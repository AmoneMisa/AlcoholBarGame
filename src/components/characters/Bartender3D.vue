<script setup lang="ts">
// The 3D bartender: one rigged GLB (scripts/blender/build_bartender.py) customised by morph targets and colours.
// Falls back to the painted 2D character when WebGL or the model is unavailable.
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { MeshoptDecoder } from 'three/examples/jsm/libs/meshopt_decoder.module.js';
import { clone as cloneSkinned } from 'three/examples/jsm/utils/SkeletonUtils.js';
import { CLIP_FOR, EXPRESSION_MORPHS, SLOT_PREFIXES, modelUrl, rigFor, type Gender, type Look3dInput } from '../../domain/character3d';
import { paintBody, paintCloth, paintHair, paintHead } from '../../domain/character3dTextures';
import type { CharacterExpression } from '../../domain/dialogue/types';
import CharacterModel from './CharacterModel.vue';

const props = withDefaults(defineProps<{
  look: Look3dInput;
  animation?: string;
  expression?: CharacterExpression;
  crop?: 'head' | 'bust' | 'full';
}>(), { animation: 'idle', expression: 'neutral', crop: 'bust' });

const host = ref<HTMLDivElement>();
const failed = ref(false);
const rig = computed(() => rigFor(props.look));

type Model = THREE.Group & { animations: THREE.AnimationClip[] };
const models = new Map<Gender, Promise<Model>>();
function loadModel(gender: Gender) {
  if (!models.has(gender)) models.set(gender, new GLTFLoader().setMeshoptDecoder(MeshoptDecoder).loadAsync(modelUrl(gender)).then((gltf) => Object.assign(gltf.scene, { animations: gltf.animations })));
  return models.get(gender)!;
}

let renderer: THREE.WebGLRenderer | undefined;
let scene: THREE.Scene;
let camera: THREE.PerspectiveCamera;
let mixer: THREE.AnimationMixer | undefined;
let actions = new Map<string, THREE.AnimationAction>();
let current: THREE.AnimationAction | undefined;
let root: THREE.Object3D | undefined;
let key: THREE.DirectionalLight;
const materials = new Map<string, THREE.MeshToonMaterial>();
const meshes: THREE.SkinnedMesh[] = [];
let frame = 0;
let last = 0;
let blinkAt = 2;
let raf = 0;
let resizer: ResizeObserver | undefined;
let disposed = false;
let started = performance.now();
let previous = started;

// Three soft steps of light: a stylised toon look.
function toonRamp() {
  const data = new Uint8Array([90, 90, 90, 255, 175, 175, 175, 255, 255, 255, 255, 255]);
  const texture = new THREE.DataTexture(data, 3, 1, THREE.RGBAFormat);
  texture.minFilter = texture.magFilter = THREE.NearestFilter;
  texture.needsUpdate = true;
  return texture;
}

function playClip(name: string) {
  const clip = actions.get(CLIP_FOR[name] ?? 'idle') ?? actions.get('idle');
  if (!clip || clip === current) return;
  clip.reset().fadeIn(.25).play();
  current?.fadeOut(.25);
  current = clip;
}

// Skin, hair and cloth get painted texture layers; everything else is a plain colour.
const textures = new Map<string, THREE.CanvasTexture>();
function texture(role: string, canvas: HTMLCanvasElement) {
  let map = textures.get(role);
  if (!map) { map = new THREE.CanvasTexture(canvas); map.flipY = false; map.colorSpace = THREE.SRGBColorSpace; map.anisotropy = 4; textures.set(role, map); const material = materials.get(role); if (material) { material.map = map; material.needsUpdate = true; } }
  else map.needsUpdate = true;
  return map;
}
const headCanvas = document.createElement('canvas'); headCanvas.width = headCanvas.height = 512;
const bodyCanvas = document.createElement('canvas'); bodyCanvas.width = bodyCanvas.height = 1024;
let staticTextures = false;
function paintTextures() {
  paintHead(props.look, headCanvas); texture('skin_head', headCanvas);
  paintBody(props.look, bodyCanvas); texture('skin_body', bodyCanvas);
  materials.get('skin_head')?.color.set('#ffffff'); materials.get('skin_body')?.color.set('#ffffff');
  if (!staticTextures) {
    staticTextures = true;
    texture('hair', paintHair()); texture('brow', paintHair());
    texture('shirt', paintCloth('plain')); texture('vest', paintCloth('pinstripe')); texture('apron', paintCloth('plain')); texture('pants', paintCloth('plain'));
  }
}

function morphIndex(mesh: THREE.SkinnedMesh, name: string) { return mesh.morphTargetDictionary?.[name]; }
function applyLook() {
  if (!root) return;
  const next = rig.value;
  // Only the chosen mesh of each slot (hair, beard, eyes, brows, nose, mouth, cheeks, clothes) is shown.
  // A slot part with several materials loads as a group of meshes (eyes_cat, eyes_cat_1, ...): match on the base name.
  root.traverse((object) => {
    if (SLOT_PREFIXES.some((prefix) => object.name.startsWith(prefix))) object.visible = next.visible.has(object.name.replace(/_\d+$/, ''));
  });
  for (const [role, color] of Object.entries(next.colors)) materials.get(role)?.color.set(color);
  materials.get('neon')?.emissive.set(next.colors.neon!);
  paintTextures();
  root.scale.setScalar(next.scale);
  key.color.set(next.light);
  applyMorphs(0, 0);
}

// Base look + the facial expression + talking / blinking.
function applyMorphs(time: number, talking: number) {
  const weights: Record<string, number> = { ...rig.value.morphs };
  for (const [name, value] of Object.entries(EXPRESSION_MORPHS[props.expression] ?? {})) weights[name] = (weights[name] ?? 0) + value;
  if (talking) weights.mouthOpen = (weights.mouthOpen ?? 0) + Math.abs(Math.sin(time * 11)) * .55 * talking;
  const blink = Math.max(0, 1 - Math.abs(time - blinkAt) * 14);
  if (blink) weights.blink = blink;
  for (const mesh of meshes) {
    const influences = mesh.morphTargetInfluences;
    if (!influences) continue;
    influences.fill(0);
    for (const [name, value] of Object.entries(weights)) { const index = morphIndex(mesh, name); if (index !== undefined) influences[index] = value; }
  }
}

function resize() {
  if (!host.value || !renderer) return;
  const { clientWidth: w, clientHeight: h } = host.value;
  if (!w || !h) return;
  renderer.setSize(w, h, false);
  camera.aspect = w / h;
  frameCamera();
  camera.updateProjectionMatrix();
}
function frameCamera() {
  // 'bust' frames head to hips (the bar hides the rest); 'full' shows the whole figure.
  const [span, centre] = { head: [.5, 1.66], bust: [1.05, 1.36], full: [2.05, .97] }[props.crop];
  const distance = span / 2 / Math.tan(THREE.MathUtils.degToRad(camera.fov / 2));
  camera.position.set(0, centre, distance * Math.max(1, 1 / camera.aspect * .55));
  camera.lookAt(0, centre, 0);
}

function tick() {
  raf = requestAnimationFrame(tick);
  if (document.hidden || !renderer) return;
  const now = performance.now();
  if (now - last < 33) return; // ~30 fps is plenty here and light on phones
  last = now;
  const delta = (now - previous) / 1000;
  previous = now;
  const time = (now - started) / 1000;
  mixer?.update(delta);
  if (time > blinkAt + .3) blinkAt = time + 2.5 + Math.random() * 3;
  applyMorphs(time, props.animation === 'talk' ? 1 : 0);
  renderer.render(scene, camera);
  frame++;
}

let ramp: THREE.DataTexture;
let mountedGender: Gender | undefined;
let mounting = false;
// (Re)builds the character for the current gender: the male and female mannequins are separate models sharing one skeleton layout.
async function mountModel() {
  if (mounting) return;
  mounting = true;
  try {
    const gender = rig.value.gender;
    const model = await loadModel(gender);
    if (disposed) return;
    if (root) { scene.remove(root); mixer?.stopAllAction(); }
    meshes.length = 0; actions = new Map(); current = undefined; mountedGender = gender;
    root = cloneSkinned(model);
    root.traverse((object) => {
      const mesh = object as THREE.SkinnedMesh;
      if (!mesh.isMesh) return;
      const original = (Array.isArray(mesh.material) ? mesh.material : [mesh.material]) as THREE.Material[];
      const toon = original.map((item) => {
        let material = materials.get(item.name);
        if (!material) {
          material = new THREE.MeshToonMaterial({ gradientMap: ramp });
          materials.set(item.name, material);
          const map = textures.get(item.name); if (map) material.map = map;
        }
        return material;
      });
      mesh.material = Array.isArray(mesh.material) ? toon : toon[0]!;
      mesh.frustumCulled = false;
      meshes.push(mesh);
    });
    scene.add(root);
    mixer = new THREE.AnimationMixer(root);
    for (const clip of model.animations) actions.set(clip.name, mixer.clipAction(clip));
    applyLook();
    playClip(props.animation);
  } finally { mounting = false; }
  if (mountedGender !== rig.value.gender) await mountModel();
}

onMounted(async () => {
  try {
    if (!host.value) return;
    renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true, powerPreference: 'low-power' });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    host.value.appendChild(renderer.domElement);
    renderer.domElement.className = 'bartender3d-canvas';
    scene = new THREE.Scene();
    camera = new THREE.PerspectiveCamera(24, 1, .1, 20);
    scene.add(new THREE.HemisphereLight('#ffffff', '#3a3040', 1.6));
    key = new THREE.DirectionalLight('#ffd9a0', 2.4);
    key.position.set(-1.5, 2.6, 2.4);
    scene.add(key);
    const rim = new THREE.DirectionalLight('#8fb4ff', .9);
    rim.position.set(2, 1.5, -2);
    scene.add(rim);
    ramp = toonRamp();
    await mountModel();
    if (disposed) return;
    resize();
    resizer = new ResizeObserver(resize);
    resizer.observe(host.value);
    tick();
  } catch {
    failed.value = true;
  }
});

onBeforeUnmount(() => {
  disposed = true;
  cancelAnimationFrame(raf);
  resizer?.disconnect();
  mixer?.stopAllAction();
  for (const material of materials.values()) material.dispose();
  for (const map of textures.values()) map.dispose();
  scene?.traverse((object) => { const mesh = object as THREE.Mesh; if (mesh.isMesh) mesh.geometry?.dispose(); });
  renderer?.dispose();
  renderer?.domElement.remove();
});

watch(rig, () => { if (mountedGender && mountedGender !== rig.value.gender) void mountModel(); else applyLook(); }, { deep: true });
watch(() => props.animation, playClip);
watch(() => props.crop, resize);
defineExpose({ frames: () => frame });
</script>

<template>
  <CharacterModel v-if="failed" role="bartender" :character-id="look.bartenderCharacter ?? 'noa'" :outfit="look.bartender" :hair-style="look.hairStyle" :hair-color="look.hairColor" :skin-tone="look.skinTone" :expression="expression" animation="idle" />
  <div v-else ref="host" class="bartender3d" role="img" aria-label="Your bartender"></div>
</template>

<style scoped>
.bartender3d { position: relative; width: 100%; height: 100%; min-width: 0; overflow: hidden; }
/* Out of the layout flow so the canvas's pixel size can never widen its container. */
.bartender3d :deep(.bartender3d-canvas) { position: absolute; inset: 0; width: 100%; height: 100%; }
</style>
