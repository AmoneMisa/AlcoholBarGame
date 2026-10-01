<script setup lang="ts">
import { onMounted, onBeforeUnmount, ref, watch } from 'vue';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader.js';
import { clone } from 'three/examples/jsm/utils/SkeletonUtils.js';
import { HAIR_PALETTE, EYE_PALETTE, LIP_PALETTE, SHADOW_PALETTE, OUTFIT_PALETTE } from '../../data/cosmetics/avatar';
import { avatarIdleAt } from '../../domain/avatarMotion';

defineOptions({ inheritAttrs: false });
const props = defineProps<{ characterId?: string; outfit?: string; hairStyle?: string; hairColor?: string; bodyShape?: string; eyeShape?: string; eyeColor?: string; browShape?: string; noseShape?: string; cheekShape?: string; lipShape?: string; lipColor?: string; eyeshadow?: string; eyeliner?: string; blush?: string; facialHair?: string; outfitColor?: string; pose?: string; animation?: string; interactive?: boolean }>();
const emit = defineEmits<{ ready: []; error: [] }>();
const host = ref<HTMLDivElement>();
const loading = ref(true);
const closeup = ref(false);
const motionPaused = ref(false);
const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
let renderer: THREE.WebGLRenderer | undefined;
let scene: THREE.Scene;
let camera: THREE.PerspectiveCamera;
let avatar: THREE.Group | undefined;
let observer: ResizeObserver | undefined;
let visibility: IntersectionObserver | undefined;
let disposed = false;
let visible = true;
// The preview only turns about 40° each way (enough to judge clothes and hair), then sways gently on its own.
const MAX_TURN = .7;
let angle = 0;
let sway = 0;
let lastTouch = -1e9;
let frame = 0;
let lastFrame = 0;
let motionSeconds = 0;
const clampTurn = (value: number) => Math.max(-MAX_TURN, Math.min(MAX_TURN, value));
let dragX: number | undefined;
// Which outfits show each swappable garment. Body, hair and face parts always show.
const OUTFIT_PARTS: Record<string, string[]> = {
  Jeans: ['vest', 'shirt', 'suit-jeans', 'baggy-tee'], Crop_T_Shirt: ['vest', 'shirt', 'tee-skirt'], Boots: ['vest', 'shirt', 'biker', 'tee-skirt', 'suit-jeans', 'baggy-tee'],
  Plaid_Punk_Shirt: ['shirt', 'biker'], Mens_Jacket: ['vest'], Jacket_Shirt: ['vest'], Biker_Jeans: ['biker'], Punk_Leather_Jacket: ['vest'], Loose_Kimono: ['kimono'], Loose_BaggyTee: ['baggy-tee'], Loose_Streetwear: ['streetwear'],
  Bunny_Leotard: ['bunny'], Bunny_Vest: ['bunny'], Bunny_Collar: ['bunny'], Bunny_Jacket: ['bunny'], Bunny_Gloves: ['bunny'], Bunny_Stockings: ['bunny'], Bunny_BunnyEars: ['bunny'], Bunny_Tail: ['bunny'], Bunny_Pads_Nipples: ['bunny'], Bunny_Pads_Vagina: ['bunny'],
  Suit_Jacket: ['biker', 'suit-jeans'], Suit_Skirt: ['biker', 'tee-skirt'], Punk_Strap_Boots: ['biker']
};
// Per-character model and camera heights: [camera, look-at] for the full body and for the face close-up.
const CHARACTERS: Record<string, { glb: string; full: [number, number]; face: [number, number]; eyeY: number }> = {
  noa: { glb: '/assets/characters/3d/amber.glb', full: [1.0, .8], face: [1.6, 1.58], eyeY: 1.5965 },
  leo: { glb: '/assets/characters/3d/leo.glb', full: [1.03, .8], face: [1.675, 1.655], eyeY: 1.675 }
};
const character = () => CHARACTERS[props.characterId ?? 'noa'] ?? CHARACTERS.noa!;
// 3D beard meshes: which facial-hair choices show each one.
const BEARD_PARTS: Record<string, string[]> = {
  Chinstrap_Thick: ['short-beard', 'full-beard'], Circle_Thick: ['goatee'],
  Mustache_Horseshoe: ['moustache', 'full-beard'], Soul_Path_Thick: ['soul-patch']
};
const isHairMaterial = (name: string) => /Hair|Brow|Scalp|Beard/.test(name) && name !== 'Skin_BrowBase';
const materials: THREE.MeshStandardMaterial[] = [];
const geometries: THREE.BufferGeometry[] = [];
const meshes: THREE.Mesh[] = [];
const uniforms = {
  idleBreath: { value: 0 }, idleYaw: { value: 0 }, idleNod: { value: 0 }, neckHeight: { value: 1.45 },
  blushTint: { value: new THREE.Color() }, lipGloss: { value: 0 },
  eyeTint: { value: new THREE.Color() }, garmentTint: { value: new THREE.Color() }, garmentAmount: { value: 0 }, lipTint: { value: new THREE.Color() }, shadowTint: { value: new THREE.Color() }, beardTint: { value: new THREE.Color() }, scalpTint: { value: new THREE.Color() },
  lipAmount: { value: 0 }, shadowAmount: { value: 0 }, blushAmount: { value: 0 }, linerAmount: { value: 0 }, linerWing: { value: 0 }, beardMode: { value: 0 }
};
function makeup(material: THREE.MeshStandardMaterial) {
  material.onBeforeCompile = shader => {
    Object.assign(shader.uniforms, uniforms);
    shader.vertexShader = 'attribute vec2 faceCoord; attribute float scalpMask; varying vec2 vFaceCoord; varying float vScalp;\n' + shader.vertexShader;
    shader.vertexShader = shader.vertexShader.replace('#include <begin_vertex>', '#include <begin_vertex>\nvFaceCoord = vec2(faceCoord.x, 1.0-faceCoord.y); vScalp = scalpMask;');
    shader.fragmentShader = `varying vec2 vFaceCoord; varying float vScalp;
      uniform vec3 lipTint, shadowTint, beardTint, scalpTint, blushTint;
      uniform float lipAmount, shadowAmount, blushAmount, linerAmount, linerWing, beardMode;
      float spot(vec2 p, vec2 c, vec2 r) { return 1.0-smoothstep(.2,1.0,length((p-c)/r)); }
      ` + shader.fragmentShader;
    shader.fragmentShader = shader.fragmentShader.replace('#include <map_fragment>', `#include <map_fragment>
      vec2 p = vFaceCoord;
      // Taper lipstick toward the mouth corners, keeping the philtrum and skin clear.
      float lx = abs((p.x-.5)/.105);
      float lipHeight = .020 * sqrt(max(0.0,1.0-lx*lx));
      float cupid = .004*exp(-pow((lx-.3)/.2,2.0));
      float lips = (1.0-smoothstep(.88,1.0,lx)) * (1.0-smoothstep(lipHeight,lipHeight+.005,abs(p.y-(.262+cupid))));
      float lids = max(spot(p,vec2(.35,.567),vec2(.10,.038)),spot(p,vec2(.65,.567),vec2(.10,.038)));
      vec2 ep = vec2(abs(p.x-.5),p.y);
      float arc = .534 + .017*(1.0-pow((ep.x-.15)/.08,2.0));
      float liner = (1.0-smoothstep(.004,.009,abs(ep.y-arc))) * (1.0-smoothstep(.07,.09,abs(ep.x-.15)));
      float wing = smoothstep(.207,.219,ep.x)*(1.0-smoothstep(.24,.27,ep.x));
      wing *= 1.0-smoothstep(.002,.007,abs(ep.y-(.536+(ep.x-.22)*.42)));
      liner = max(liner,wing*linerWing);
      float cheeks = max(spot(p,vec2(.24,.38),vec2(.13,.08)),spot(p,vec2(.76,.38),vec2(.13,.08)));
      float beard = spot(p,vec2(.5,.16),vec2(.29,.16))*(1.0-lips);
      float moustache = spot(p,vec2(.5,.325),vec2(.14,.028));
      if (beardMode > 3.5) beard = moustache;
      else if (beardMode > 2.5) beard = spot(p,vec2(.5,.14),vec2(.12,.10));
      else if (beardMode > 1.5) beard = max(beard,moustache);
      float grain = .65+.35*fract(sin(dot(p,vec2(912.1,137.7)))*43758.5453);
      // Under the hair cards the skull reads as hair-coloured roots instead of bare skin showing through gaps.
      diffuseColor.rgb = mix(diffuseColor.rgb, scalpTint, vScalp*.94);
      diffuseColor.rgb = mix(diffuseColor.rgb, shadowTint, lids*shadowAmount);
      diffuseColor.rgb = mix(diffuseColor.rgb, vec3(.09,.06,.08), liner*linerAmount);
      diffuseColor.rgb = mix(diffuseColor.rgb, blushTint, cheeks*blushAmount);
      float skinDetail = clamp(dot(diffuseColor.rgb,vec3(.3,.59,.11))*1.8,.6,1.2);
      diffuseColor.rgb = mix(diffuseColor.rgb, lipTint*skinDetail, lips*lipAmount);
      diffuseColor.rgb = mix(diffuseColor.rgb, beardTint, beard*grain*(beardMode>0.0 ? (beardMode<1.5 ? .35 : .85) : 0.0));
    `);
    shader.uniforms.lipGloss = uniforms.lipGloss;
    shader.fragmentShader = 'uniform float lipGloss;\n' + shader.fragmentShader;
    shader.fragmentShader = shader.fragmentShader.replace('#include <roughnessmap_fragment>', '#include <roughnessmap_fragment>\nroughnessFactor = mix(roughnessFactor,.22,lips*lipGloss);');
  };
  material.customProgramCacheKey = () => 'bartender-makeup-v3';
}
// All parts use the same gentle deformation, so collars, beards and hair
// remain attached to the face as it breathes and turns. Morphs run first.
function idleMaterial(material: THREE.MeshStandardMaterial) {
  const previous = material.onBeforeCompile.bind(material);
  const previousKey = material.customProgramCacheKey();
  material.onBeforeCompile = (shader, gl) => {
    previous(shader, gl);
    for (const key of ['idleBreath','idleYaw','idleNod','neckHeight'] as const) shader.uniforms[key] = uniforms[key];
    shader.vertexShader = `uniform float idleBreath, idleYaw, idleNod, neckHeight;
      mat3 idleRotation(float h) {
        float y=idleYaw*h, n=idleNod*h;
        return mat3(cos(y),0.,-sin(y),0.,1.,0.,sin(y),0.,cos(y)) * mat3(1.,0.,0.,0.,cos(n),sin(n),0.,-sin(n),cos(n));
      }\n` + shader.vertexShader;
    shader.vertexShader = shader.vertexShader.replace('#include <beginnormal_vertex>', '#include <beginnormal_vertex>\nobjectNormal = idleRotation(smoothstep(neckHeight-.05,neckHeight+.08,position.y)) * objectNormal;');
    shader.vertexShader = shader.vertexShader.replace('#include <project_vertex>', `
      float hw=smoothstep(neckHeight-.05,neckHeight+.08,transformed.y);
      vec3 pivot=vec3(0.,neckHeight,0.);
      transformed=pivot+idleRotation(hw)*(transformed-pivot);
      float chest=exp(-pow((transformed.y-(neckHeight-.22))/.22,2.));
      transformed.z+=idleBreath*chest;
      #include <project_vertex>`);
  };
  material.customProgramCacheKey = () => `${previousKey}:idle-v1`;
}
// The garment that defines an outfit can be recoloured; its own shading (plaid, leather grain, folds) is kept.
const RECOLOURABLE = /^(Loose_\w+|Cloth_Jacket_Leather|DeluxeBunnysuit|Female_T_Shirt|Punk_Leather_jacket|F_Black_Outfit_L|Plaid_Punk_Shirt|Biker_Jeans)$/;
function garmentColour(material: THREE.MeshStandardMaterial) {
  material.onBeforeCompile = shader => {
    shader.uniforms.garmentTint = uniforms.garmentTint; shader.uniforms.garmentAmount = uniforms.garmentAmount;
    shader.fragmentShader = 'uniform vec3 garmentTint; uniform float garmentAmount;\n' + shader.fragmentShader;
    shader.fragmentShader = shader.fragmentShader.replace('#include <map_fragment>', `#include <map_fragment>
      float gl = dot(diffuseColor.rgb, vec3(.3, .59, .11));
      diffuseColor.rgb = mix(diffuseColor.rgb, garmentTint * (.35 + gl * 1.25), garmentAmount);
    `);
  };
  material.customProgramCacheKey = () => 'bartender-garment-v1';
}
// Eye colour tints only the iris: sclera and lashes are nearly colourless, so they keep their own white.
function eyeColour(material: THREE.MeshStandardMaterial) {
  material.onBeforeCompile = shader => {
    shader.uniforms.eyeTint = uniforms.eyeTint;
    shader.fragmentShader = 'uniform vec3 eyeTint;\n' + shader.fragmentShader;
    shader.fragmentShader = shader.fragmentShader.replace('#include <map_fragment>', `#include <map_fragment>
      float chroma = max(diffuseColor.r, max(diffuseColor.g, diffuseColor.b)) - min(diffuseColor.r, min(diffuseColor.g, diffuseColor.b));
      float iris = smoothstep(.10, .28, chroma);
      float lum = dot(diffuseColor.rgb, vec3(.3, .59, .11));
      diffuseColor.rgb = mix(diffuseColor.rgb, eyeTint * (.55 + lum * 1.4), iris);
    `);
  };
  material.customProgramCacheKey = () => 'bartender-eye-v1';
}
function update() {
  if (!avatar) return;
  const hair = props.hairStyle ?? 'updo';
  // The work apron is retired: older saves that used it show the plain shirt look.
  const outfit = props.outfit === 'apron' ? 'shirt' : ['vest', 'shirt', 'biker', 'tee-skirt', 'suit-jeans', 'bunny', 'kimono', 'baggy-tee', 'streetwear'].includes(props.outfit ?? '') ? props.outfit! : 'vest';
  for (const mesh of meshes) {
    const name = mesh.userData.part as string;
    if (props.characterId !== 'leo') {
      if (['Bun', 'Bang', 'Real_Hair', 'Hair_Base'].includes(name)) mesh.visible = hair === 'waves' ? false : name === 'Bun' ? ['updo','bun','ponytail'].includes(hair) : name === 'Bang' ? hair !== 'bun' : name === 'Real_Hair' ? !['pixie','bun'].includes(hair) : true;
      if (name.startsWith('SKM_Hair')) mesh.visible = hair === 'waves';
    } else {
      // 'buzz' keeps only the scalp layer of the blowback hair.
      if (name === 'Short_blowback') mesh.visible = hair !== 'buzz' || /Scalp/.test((mesh.material as THREE.Material).name);
      if (name in BEARD_PARTS) mesh.visible = BEARD_PARTS[name]!.includes(props.facialHair ?? 'clean');
    }
    if (name in OUTFIT_PARTS) mesh.visible = OUTFIT_PARTS[name]!.includes(outfit);
    const dict = mesh.morphTargetDictionary;
    const weights = mesh.morphTargetInfluences;
    if (dict && weights) {
      weights.fill(0);
      const set = (key: string, value: number) => { const index = dict[key]; if (index !== undefined) weights[index] = value; };
      set('eyesWide', props.eyeShape === 'round' ? .65 : 0);
      set('eyesNarrow', props.eyeShape === 'narrow' ? .6 : props.eyeShape === 'hooded' ? .25 : 0);
      set('browArch', props.browShape === 'high-arch' ? .7 : props.browShape === 'soft-arch' ? .2 : 0);
      set('browInner', props.browShape === 'bold' ? .3 : 0);
      set('lipsFull', props.lipShape === 'full' ? .12 : 0);
      set('lipsThin', props.lipShape === 'thin' ? .5 : 0);
      const nose = props.noseShape, cheek = props.cheekShape, lips = props.lipShape;
      set('noseWide', nose === 'wide' ? .7 : 0);
      set('noseNarrow', nose === 'narrow' ? .7 : nose === 'button' ? .25 : 0);
      set('noseUp', nose === 'turned-up' ? .8 : nose === 'button' ? .35 : 0);
      set('noseDown', nose === 'straight' ? .2 : 0);
      set('cheekHigh', cheek === 'high' ? .7 : 0);
      set('cheekFull', cheek === 'full' ? .6 : cheek === 'round' ? .3 : 0);
      set('cheekHollow', cheek === 'hollow' ? .7 : 0);
      set('lipsWide', lips === 'wide' ? .6 : 0);
      set('lipsSmall', lips === 'small' ? .5 : 0);
      set('smile', .08);
      set('mouthClose', 0);
      mesh.userData.openEyes = dict.eyesWide !== undefined ? weights[dict.eyesWide] : 0;
      mesh.userData.narrowEyes = dict.eyesNarrow !== undefined ? weights[dict.eyesNarrow] : 0;
    }
  }
  for (const material of materials) {
    if (isHairMaterial(material.name)) {
      material.color.set(HAIR_PALETTE[props.hairColor ?? 'espresso'] ?? HAIR_PALETTE.espresso!);
      // The source hair texture is very dark at the roots; lift it so the colour choice reads.
      if (/Hair|Scalp/.test(material.name)) {
        material.color.multiplyScalar(1.2);
        // A little self-light keeps near-black roots from reading as holes.
        material.emissive.copy(material.color).multiplyScalar(.06);
      } else if (/Brow/.test(material.name)) material.color.multiplyScalar(.95);
      else material.color.multiplyScalar(.8);
    }
  }
  uniforms.garmentTint.value.set(OUTFIT_PALETTE[props.outfitColor ?? 'natural'] ?? OUTFIT_PALETTE.natural!);
  uniforms.garmentAmount.value = !props.outfitColor || props.outfitColor === 'natural' ? 0 : .92;
  uniforms.eyeTint.value.set(EYE_PALETTE[props.eyeColor ?? 'brown'] ?? EYE_PALETTE.brown!);
  uniforms.lipTint.value.set(LIP_PALETTE[props.lipColor ?? 'bare'] ?? LIP_PALETTE.bare!);
  uniforms.shadowTint.value.set(SHADOW_PALETTE[props.eyeshadow ?? 'none'] ?? SHADOW_PALETTE.none!);
  uniforms.blushTint.value.set(({soft:'#ae6669',peach:'#d18a70',rose:'#bd5873',bronze:'#966443'} as Record<string,string>)[props.blush ?? 'soft'] ?? '#ae6669');
  uniforms.lipGloss.value = props.lipColor === 'gloss' ? 1 : !props.lipColor || props.lipColor === 'bare' ? 0 : .2;
  uniforms.beardTint.value.set(HAIR_PALETTE[props.hairColor ?? 'espresso'] ?? HAIR_PALETTE.espresso!);
  uniforms.scalpTint.value.set(HAIR_PALETTE[props.hairColor ?? 'espresso'] ?? HAIR_PALETTE.espresso!).multiplyScalar(.5);
  uniforms.lipAmount.value = !props.lipColor || props.lipColor === 'bare' ? 0 : .5;
  uniforms.shadowAmount.value = !props.eyeshadow || props.eyeshadow === 'none' ? 0 : .32;
  uniforms.blushAmount.value = !props.blush || props.blush === 'none' ? 0 : .16;
  uniforms.linerAmount.value = !props.eyeliner || props.eyeliner === 'none' ? 0 : props.eyeliner === 'fine' ? .5 : .85;
  uniforms.linerWing.value = props.eyeliner === 'winged' ? 1 : 0;
  for (const material of materials) {
    if (/Scalp/.test(material.name)) material.visible = true;
  }
  // Leo's beards are real meshes; only stubble is painted on the skin.
  uniforms.beardMode.value = props.characterId === 'leo' ? (props.facialHair === 'stubble' ? 1 : 0) : ({ clean:0,stubble:1,'short-beard':2,goatee:3,moustache:4 } as Record<string,number>)[props.facialHair ?? 'clean'] ?? 0;
  avatar.rotation.y = clampTurn(angle + sway) + (props.pose === 'confident' ? -.12 : props.pose === 'working' ? .12 : 0);
  draw();
}
function draw() { if (renderer && avatar && visible) renderer.render(scene,camera); }
function resize() {
  if (!host.value || !renderer) return;
  const {width,height} = host.value.getBoundingClientRect();
  if (!width || !height) return;
  renderer.setSize(width,height,false);
  camera.aspect = width/height;
  camera.updateProjectionMatrix();
  draw();
}
function focusFace() {
  closeup.value = !closeup.value;
  // A longer lens distance keeps the close-up flattering instead of a wide-angle nose.
  const [eyeY, lookY] = closeup.value ? character().face : character().full;
  camera.position.set(0, eyeY, closeup.value ? 1.25 : 4.5);
  camera.lookAt(0, lookY, 0);
  draw();
}
function down(event: PointerEvent) { if (props.interactive) { dragX=event.clientX; host.value?.setPointerCapture(event.pointerId); } }
function turn(step: number) { angle = clampTurn(angle + step); lastTouch = performance.now(); update(); }
function move(event: PointerEvent) { if (dragX !== undefined) { angle = clampTurn(angle + (event.clientX-dragX)*.012); dragX=event.clientX; lastTouch = performance.now(); update(); } }
function applyIdle(enabled: boolean) {
  const state = avatarIdleAt(motionSeconds, enabled);
  const interacting = performance.now()-lastTouch < 2500 || dragX !== undefined;
  uniforms.idleBreath.value = state.breath;
  uniforms.idleYaw.value = interacting ? 0 : state.yaw;
  uniforms.idleNod.value = interacting ? 0 : state.nod;
  sway = interacting ? 0 : state.sway;
  for (const mesh of meshes) {
    const index = mesh.morphTargetDictionary?.blink;
    if (index !== undefined && mesh.morphTargetInfluences) {
      mesh.morphTargetInfluences[index] = state.blink;
      // Wide/squint presets must not fight a closed eyelid.
      for (const [name,key] of [['eyesWide','openEyes'],['eyesNarrow','narrowEyes']] as const) {
        const shape=mesh.morphTargetDictionary?.[name];
        if (shape!==undefined) mesh.morphTargetInfluences[shape]=(mesh.userData[key] ?? 0)*(1-state.blink);
      }
    }
  }
  if (avatar) avatar.rotation.y = clampTurn(angle+sway)+(props.pose==='confident' ? -.12 : props.pose==='working' ? .12 : 0);
}
// Cap rendering at 30 fps; hidden viewers and reduced-motion users stay still.
function tick(time = 0) {
  frame = requestAnimationFrame(tick);
  if (!avatar || !visible || document.hidden || motionPaused.value || reducedMotion.matches) { lastFrame=time; return; }
  if (time-lastFrame < 1000/30) return;
  motionSeconds += Math.min(.1,(time-lastFrame)/1000);
  lastFrame=time;
  applyIdle(true);
  draw();
}
function resetIdle() { applyIdle(false); draw(); }
watch(motionPaused, resetIdle);
watch(() => ({...props}),update);
onMounted(async () => {
  try {
    renderer = new THREE.WebGLRenderer({alpha:true,antialias:true,powerPreference:'low-power'});
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, (navigator.hardwareConcurrency ?? 8) <= 4 || ((navigator as Navigator & { deviceMemory?: number }).deviceMemory ?? 8) <= 2 ? 1 : 1.5));
    renderer.outputColorSpace=THREE.SRGBColorSpace;
    renderer.toneMapping=THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure=1.15;
    host.value!.append(renderer.domElement);
    scene=new THREE.Scene();
    camera=new THREE.PerspectiveCamera(28,1,.01,20);
    camera.position.set(0,character().full[0],4.5); camera.lookAt(0,character().full[1],0);
    scene.add(new THREE.HemisphereLight('#fff5ec','#646879',1.8));
    const key=new THREE.DirectionalLight('#fff5eb',2.5); key.position.set(-2,3,4); scene.add(key);
    const rim=new THREE.DirectionalLight('#c7dcff',1.5); rim.position.set(2,2,-2); scene.add(rim);
    const gltf=await loadAvatar(character().glb);
    if (disposed) return;
    avatar=clone(gltf) as THREE.Group;
    uniforms.neckHeight.value = character().eyeY-.15;
    avatar.updateMatrixWorld(true);
    avatar.traverse(object => {
      if (!(object instanceof THREE.Mesh)) return;
      meshes.push(object);
      // Primitive splits inherit the original part name through their parent.
      object.userData.part=object.name.replace(/_\d+$/,'');
      object.geometry=object.geometry.clone(); geometries.push(object.geometry);
      if (object.geometry.getAttribute('uv1')) object.geometry.setAttribute('faceCoord',object.geometry.getAttribute('uv1'));
      const prepare=(original:THREE.Material) => {
        const mat=original.clone() as THREE.MeshStandardMaterial; materials.push(mat);
        // The brow mesh ships with an opaque skin-coloured underlay that shows as white patches; the hairs alone look right.
        if (/Brow_Base|Skin_BrowBase/.test(mat.name)) mat.visible = false;
        if (/^Std_Eye_[LR]$/.test(mat.name)) eyeColour(mat);
        if (/Eyelash/.test(mat.name)) { mat.color.set('#211810'); mat.emissive.set(0); mat.roughness=.85; }
        if (RECOLOURABLE.test(mat.name)) garmentColour(mat);
        if (isHairMaterial(mat.name) || /Eyelash/.test(mat.name)) {
          // Scalp cards must stay solid, strands need a cleaner edge, lashes the hardest cut.
          mat.alphaTest = /Scalp/.test(mat.name) ? .05 : /Eyelash/.test(mat.name) ? .5 : .14;
          mat.alphaToCoverage = true; mat.transparent = false; mat.side = THREE.DoubleSide;
        }
        if (mat.name === 'Std_Skin_Head' && object.geometry.getAttribute('faceCoord')) {
          makeup(mat);
          if (!object.geometry.getAttribute('scalpMask')) {
            const pos = object.geometry.getAttribute('position'), mask = new Float32Array(pos.count);
            // Hair cards provide the hairline; painting a horizontal band across
            // the forehead creates a visibly artificial edge.
            for (let i = 0; i < pos.count; i++) mask[i] = 0;
            object.geometry.setAttribute('scalpMask', new THREE.BufferAttribute(mask, 1));
          }
        }
        if (/Skin/.test(mat.name)) { mat.roughness=.58; mat.normalScale.setScalar(.45); }
        if (/Leather|Outfit_L/.test(mat.name)) mat.roughness=.48;
        idleMaterial(mat);
        return mat;
      };
      object.material=Array.isArray(object.material) ? object.material.map(prepare) : prepare(object.material);
      object.frustumCulled=false;
    });
    scene.add(avatar);
    update(); resize();
    observer=new ResizeObserver(resize); observer.observe(host.value!);
    visibility=new IntersectionObserver(entries => { visible=entries[0]?.isIntersecting ?? true; if(visible) resize(); }); visibility.observe(host.value!);
    loading.value=false; emit('ready');
    reducedMotion.addEventListener('change',resetIdle);
    tick();
  } catch (error) { console.warn('Bartender 3D preview unavailable',error); emit('error'); }
});
onBeforeUnmount(() => { disposed=true; cancelAnimationFrame(frame); reducedMotion.removeEventListener('change',resetIdle); observer?.disconnect(); visibility?.disconnect(); geometries.forEach(g => g.dispose()); materials.forEach(m => m.dispose()); renderer?.dispose(); renderer?.domElement.remove(); });
</script>
<script lang="ts">
// One shared download. Instances clone skeletons and materials, never shared textures.
const cachedAvatars = new Map<string, Promise<THREE.Group>>();
function loadAvatar(url: string) {
  let cachedAvatar = cachedAvatars.get(url);
  if (!cachedAvatar) {
    const draco=new DRACOLoader().setDecoderPath('/assets/characters/3d/draco/').setWorkerLimit(1);
    cachedAvatar=new GLTFLoader().setDRACOLoader(draco).loadAsync(url)
      .then(g => g.scene).catch(error => { cachedAvatars.delete(url); throw error; }).finally(() => draco.dispose());
    cachedAvatars.set(url, cachedAvatar);
  }
  return cachedAvatar;
}
</script>
<template>
  <div ref="host" class="bartender-3d" :class="{interactive}" role="img" aria-label="Customizable 3D bartender" @pointerdown="down" @pointermove="move" @pointerup="dragX=undefined" @pointercancel="dragX=undefined">
    <span v-if="loading" class="avatar-loading" role="status">Preparing character…</span>
  </div>
  <div v-if="interactive && !loading" class="avatar-camera" @pointerdown.stop>
    <button type="button" aria-label="Turn character left" @click="turn(-.3)">↶</button>
    <button type="button" :aria-pressed="closeup" @click="focusFace">{{ closeup ? 'Full body' : 'Face close-up' }}</button>
    <button type="button" aria-label="Turn character right" @click="turn(.3)">↷</button>
    <button type="button" :aria-pressed="motionPaused" :aria-label="motionPaused ? 'Resume idle animation' : 'Pause idle animation'" @click="motionPaused = !motionPaused">{{ motionPaused ? 'Play' : 'Pause' }}</button>
  </div>
</template>
<style scoped>
.bartender-3d{position:absolute;inset:0;min-height:1px}.bartender-3d :deep(canvas){display:block;width:100%;height:100%}.interactive{cursor:grab;touch-action:pan-y}.interactive:active{cursor:grabbing}.avatar-loading{position:absolute;left:10%;right:10%;top:48%;font-size:11px;text-align:center;color:#e4d5c1;background:#211a27bd;border-radius:8px;padding:8px}
.avatar-camera{position:absolute;bottom:8px;left:8px;right:8px;display:flex;gap:6px;z-index:2}.avatar-camera button{min-height:36px}
</style>
