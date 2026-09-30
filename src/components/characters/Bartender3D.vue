<script setup lang="ts">
import { onMounted, onBeforeUnmount, ref, watch } from 'vue';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader.js';
import { clone } from 'three/examples/jsm/utils/SkeletonUtils.js';
import { HAIR_PALETTE, EYE_PALETTE, LIP_PALETTE, SHADOW_PALETTE } from '../../data/cosmetics/avatar';

defineOptions({ inheritAttrs: false });
const props = defineProps<{ outfit?: string; hairStyle?: string; hairColor?: string; bodyShape?: string; eyeShape?: string; eyeColor?: string; browShape?: string; noseShape?: string; cheekShape?: string; lipShape?: string; lipColor?: string; eyeshadow?: string; eyeliner?: string; blush?: string; facialHair?: string; pose?: string; animation?: string; interactive?: boolean }>();
const emit = defineEmits<{ ready: []; error: [] }>();
const host = ref<HTMLDivElement>();
const loading = ref(true);
const closeup = ref(false);
let renderer: THREE.WebGLRenderer | undefined;
let scene: THREE.Scene;
let camera: THREE.PerspectiveCamera;
let avatar: THREE.Group | undefined;
let observer: ResizeObserver | undefined;
let visibility: IntersectionObserver | undefined;
let disposed = false;
let visible = true;
let angle = 0;
let dragX: number | undefined;
// Which outfits show each swappable garment. Body, hair and face parts always show.
const OUTFIT_PARTS: Record<string, string[]> = {
  Jeans: ['vest', 'shirt', 'apron'], Crop_T_Shirt: ['vest', 'shirt', 'apron'], Boots: ['vest', 'shirt', 'apron'],
  Punk_Leather_Jacket: ['vest'], Apron: ['apron'], F_Black_Outfit_L: ['biker'], Punk_Strap_Boots: ['biker']
};
const materials: THREE.MeshStandardMaterial[] = [];
const geometries: THREE.BufferGeometry[] = [];
const meshes: THREE.Mesh[] = [];
const uniforms = {
  lipTint: { value: new THREE.Color() }, shadowTint: { value: new THREE.Color() }, beardTint: { value: new THREE.Color() },
  lipAmount: { value: 0 }, shadowAmount: { value: 0 }, blushAmount: { value: 0 }, linerAmount: { value: 0 }, beardMode: { value: 0 }
};
function makeup(material: THREE.MeshStandardMaterial) {
  material.onBeforeCompile = shader => {
    Object.assign(shader.uniforms, uniforms);
    shader.vertexShader = 'attribute vec2 faceCoord; varying vec2 vFaceCoord;\n' + shader.vertexShader;
    shader.vertexShader = shader.vertexShader.replace('#include <begin_vertex>', '#include <begin_vertex>\nvFaceCoord = vec2(faceCoord.x, 1.0-faceCoord.y);');
    shader.fragmentShader = `varying vec2 vFaceCoord;
      uniform vec3 lipTint, shadowTint, beardTint;
      uniform float lipAmount, shadowAmount, blushAmount, linerAmount, beardMode;
      float spot(vec2 p, vec2 c, vec2 r) { return 1.0-smoothstep(.55,1.0,length((p-c)/r)); }
      ` + shader.fragmentShader;
    shader.fragmentShader = shader.fragmentShader.replace('#include <map_fragment>', `#include <map_fragment>
      vec2 p = vFaceCoord;
      float lips = spot(p,vec2(.5,.278),vec2(.12,.037));
      float lids = max(spot(p,vec2(.35,.56),vec2(.10,.044)),spot(p,vec2(.65,.56),vec2(.10,.044)));
      float liner = max(spot(p,vec2(.35,.535),vec2(.095,.012)),spot(p,vec2(.65,.535),vec2(.095,.012)));
      float cheeks = max(spot(p,vec2(.24,.38),vec2(.13,.08)),spot(p,vec2(.76,.38),vec2(.13,.08)));
      float beard = spot(p,vec2(.5,.16),vec2(.29,.16))*(1.0-lips);
      float moustache = spot(p,vec2(.5,.325),vec2(.14,.028));
      if (beardMode > 3.5) beard = moustache;
      else if (beardMode > 2.5) beard = spot(p,vec2(.5,.14),vec2(.12,.10));
      else if (beardMode > 1.5) beard = max(beard,moustache);
      float grain = .65+.35*fract(sin(dot(p,vec2(912.1,137.7)))*43758.5453);
      diffuseColor.rgb = mix(diffuseColor.rgb, shadowTint, lids*shadowAmount);
      diffuseColor.rgb = mix(diffuseColor.rgb, vec3(.09,.06,.08), liner*linerAmount);
      diffuseColor.rgb = mix(diffuseColor.rgb, vec3(.65,.22,.23), cheeks*blushAmount);
      diffuseColor.rgb = mix(diffuseColor.rgb, lipTint, lips*lipAmount);
      diffuseColor.rgb = mix(diffuseColor.rgb, beardTint, beard*grain*(beardMode>0.0 ? (beardMode<1.5 ? .35 : .85) : 0.0));
    `);
  };
  material.customProgramCacheKey = () => 'bartender-makeup-v1';
}
function update() {
  if (!avatar) return;
  const hair = props.hairStyle ?? 'updo';
  const outfit = ['vest', 'shirt', 'apron', 'biker'].includes(props.outfit ?? '') ? props.outfit! : 'vest';
  for (const mesh of meshes) {
    const name = mesh.userData.part as string;
    if (['Bun', 'Bang', 'Real_Hair'].includes(name)) mesh.visible = name === 'Bun' ? ['updo','bun','ponytail'].includes(hair) : name === 'Bang' ? hair !== 'bun' : !['pixie','bun'].includes(hair);
    if (name in OUTFIT_PARTS) mesh.visible = OUTFIT_PARTS[name]!.includes(outfit);
    const dict = mesh.morphTargetDictionary;
    const weights = mesh.morphTargetInfluences;
    if (dict && weights) {
      weights.fill(0);
      const set = (key: string, value: number) => { const index = dict[key]; if (index !== undefined) weights[index] = value; };
      const body = ({slim:'bodySlim',curvy:'bodyCurvy',broad:'bodyBroad',muscular:'bodyMuscular'} as Record<string,string>)[props.bodyShape ?? ''];
      if (body) set(body,1);
      set('eyesWide', props.eyeShape === 'round' ? .65 : 0);
      set('eyesNarrow', props.eyeShape === 'narrow' ? .6 : props.eyeShape === 'hooded' ? .25 : 0);
      set('browArch', props.browShape === 'high-arch' ? .7 : props.browShape === 'soft-arch' ? .2 : 0);
      set('browInner', props.browShape === 'bold' ? .3 : 0);
      set('lipsFull', props.lipShape === 'full' ? .55 : 0);
      set('lipsThin', props.lipShape === 'thin' ? .65 : 0);
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
      set('smile', .12);
    }
  }
  for (const material of materials) {
    if (/Hair|Brow|Scalp/.test(material.name)) material.color.set(HAIR_PALETTE[props.hairColor ?? 'espresso'] ?? HAIR_PALETTE.espresso!);
    if (/Std_(Eye|Cornea)_[LR]/.test(material.name)) material.color.set(EYE_PALETTE[props.eyeColor ?? 'brown'] ?? EYE_PALETTE.brown!);
  }
  uniforms.lipTint.value.set(LIP_PALETTE[props.lipColor ?? 'bare'] ?? LIP_PALETTE.bare!);
  uniforms.shadowTint.value.set(SHADOW_PALETTE[props.eyeshadow ?? 'none'] ?? SHADOW_PALETTE.none!);
  uniforms.beardTint.value.set(HAIR_PALETTE[props.hairColor ?? 'espresso'] ?? HAIR_PALETTE.espresso!);
  uniforms.lipAmount.value = !props.lipColor || props.lipColor === 'bare' ? 0 : .7;
  uniforms.shadowAmount.value = !props.eyeshadow || props.eyeshadow === 'none' ? 0 : .5;
  uniforms.blushAmount.value = !props.blush || props.blush === 'none' ? 0 : .24;
  uniforms.linerAmount.value = !props.eyeliner || props.eyeliner === 'none' ? 0 : props.eyeliner === 'fine' ? .5 : .85;
  uniforms.beardMode.value = ({ clean:0,stubble:1,'short-beard':2,goatee:3,moustache:4 } as Record<string,number>)[props.facialHair ?? 'clean'] ?? 2;
  avatar.rotation.y = angle + (props.pose === 'confident' ? -.12 : props.pose === 'working' ? .12 : 0);
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
  camera.position.set(0, closeup.value ? 1.6 : 1.08, closeup.value ? .72 : 3.9);
  camera.lookAt(0, closeup.value ? 1.59 : .9, 0);
  draw();
}
function down(event: PointerEvent) { if (props.interactive) { dragX=event.clientX; host.value?.setPointerCapture(event.pointerId); } }
function move(event: PointerEvent) { if (dragX !== undefined) { angle += (event.clientX-dragX)*.012; dragX=event.clientX; update(); } }
watch(() => ({...props}),update);
onMounted(async () => {
  try {
    renderer = new THREE.WebGLRenderer({alpha:true,antialias:true,powerPreference:'low-power'});
    renderer.setPixelRatio(Math.min(window.devicePixelRatio,1.5));
    renderer.outputColorSpace=THREE.SRGBColorSpace;
    renderer.toneMapping=THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure=1.15;
    host.value!.append(renderer.domElement);
    scene=new THREE.Scene();
    camera=new THREE.PerspectiveCamera(28,1,.01,20);
    camera.position.set(0,1.08,3.9); camera.lookAt(0,.9,0);
    scene.add(new THREE.HemisphereLight('#fff0df','#626183',2.7));
    const key=new THREE.DirectionalLight('#fff0de',3.5); key.position.set(-2,3,4); scene.add(key);
    const rim=new THREE.DirectionalLight('#b8cfff',2); rim.position.set(2,2,-2); scene.add(rim);
    const gltf=await loadAvatar();
    if (disposed) return;
    avatar=clone(gltf) as THREE.Group;
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
        if (/Hair|Brow|Eyelash|Scalp/.test(mat.name)) { mat.alphaTest=.35; mat.alphaToCoverage=true; mat.transparent=false; mat.side=THREE.DoubleSide; }
        if (mat.name === 'Std_Skin_Head' && object.geometry.getAttribute('faceCoord')) {
          makeup(mat);
        }
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
    // Demand rendering: redraw only for changes, resizing, or interaction.
  } catch (error) { console.warn('Bartender 3D preview unavailable',error); emit('error'); }
});
onBeforeUnmount(() => { disposed=true; observer?.disconnect(); visibility?.disconnect(); geometries.forEach(g => g.dispose()); materials.forEach(m => m.dispose()); renderer?.dispose(); renderer?.domElement.remove(); });
</script>
<script lang="ts">
// One shared download. Instances clone skeletons and materials, never shared textures.
let cachedAvatar: Promise<THREE.Group> | undefined;
function loadAvatar() {
  if (!cachedAvatar) {
    const draco=new DRACOLoader().setDecoderPath('/assets/characters/3d/draco/').setWorkerLimit(1);
    cachedAvatar=new GLTFLoader().setDRACOLoader(draco).loadAsync('/assets/characters/3d/amber.glb')
      .then(g => g.scene).catch(error => { cachedAvatar=undefined; throw error; }).finally(() => draco.dispose());
  }
  return cachedAvatar;
}
</script>
<template>
  <div ref="host" class="bartender-3d" :class="{interactive}" role="img" aria-label="Customizable 3D bartender" @pointerdown="down" @pointermove="move" @pointerup="dragX=undefined" @pointercancel="dragX=undefined">
    <span v-if="loading" class="avatar-loading" role="status">Preparing character…</span>
  </div>
  <div v-if="interactive && !loading" class="avatar-camera" @pointerdown.stop>
    <button type="button" aria-label="Turn character left" @click="angle -= .3; update()">↶</button>
    <button type="button" :aria-pressed="closeup" @click="focusFace">{{ closeup ? 'Full body' : 'Face close-up' }}</button>
    <button type="button" aria-label="Turn character right" @click="angle += .3; update()">↷</button>
  </div>
</template>
<style scoped>
.bartender-3d{position:absolute;inset:0;min-height:1px}.bartender-3d :deep(canvas){display:block;width:100%;height:100%}.interactive{cursor:grab;touch-action:pan-y}.interactive:active{cursor:grabbing}.avatar-loading{position:absolute;left:10%;right:10%;top:48%;font-size:11px;text-align:center;color:#e4d5c1;background:#211a27bd;border-radius:8px;padding:8px}
.avatar-camera{position:absolute;bottom:8px;left:8px;right:8px;display:flex;gap:6px;z-index:2}.avatar-camera button{min-height:36px}
</style>
