<script setup lang="ts">
// A 3D person (bartender or guest portrait): a rigged mannequin (scripts/blender/build_bartender.py) customised by morph targets, colours and painted texture layers.
// Falls back to the painted 2D character when WebGL or the model is unavailable.
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue';
import * as THREE from 'three';
import { rigFor, type Look3dInput } from '../../domain/character3d';
import { CharacterRig, addCharacterLights, loadCharacterModel } from '../../domain/character3dRig';
import type { CharacterExpression } from '../../domain/dialogue/types';
import CharacterModel from './CharacterModel.vue';

const props = withDefaults(defineProps<{
  look: Look3dInput;
  animation?: string;
  expression?: CharacterExpression;
  crop?: 'head' | 'portrait' | 'bust' | 'full';
  role?: 'bartender' | 'customer';
  characterId?: string;
}>(), { animation: 'idle', expression: 'neutral', crop: 'bust', role: 'bartender' });

const host = ref<HTMLDivElement>();
const failed = ref(false);
const data = computed(() => rigFor(props.look));

let renderer: THREE.WebGLRenderer | undefined;
let scene: THREE.Scene;
let camera: THREE.PerspectiveCamera;
let key: THREE.DirectionalLight;
let character: CharacterRig | undefined;
let raf = 0;
let last = 0;
let resizer: ResizeObserver | undefined;
let disposed = false;
let mounting = false;
const started = performance.now();

// (Re)builds the character for the current gender: the male and female mannequins are separate models sharing one skeleton layout.
async function mountCharacter() {
  if (mounting) return;
  mounting = true;
  try {
    const gender = data.value.gender;
    const model = await loadCharacterModel(gender);
    if (disposed) return;
    if (character) { scene.remove(character.root); character.dispose(); }
    character = new CharacterRig(model, gender);
    scene.add(character.root);
    applyAll();
  } finally { mounting = false; }
  if (character && character.gender !== data.value.gender) await mountCharacter();
}
function applyAll() {
  if (!character) return;
  character.setLook(props.look);
  character.setExpression(props.expression);
  character.play(props.animation);
  key.color.set(character.data.light);
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
  // 'head' is a portrait, 'bust' frames head to hips, 'full' the whole figure (the bar hides the lower part).
  const [span, centre] = { head: [.5, 1.66], portrait: [.85, 1.5], bust: [1.05, 1.36], full: [2.05, .97] }[props.crop];
  const distance = span / 2 / Math.tan(THREE.MathUtils.degToRad(camera.fov / 2));
  camera.position.set(0, centre, distance * Math.max(1, 1 / camera.aspect * .55));
  camera.lookAt(0, centre, 0);
}

let previous = started;
function tick() {
  raf = requestAnimationFrame(tick);
  if (document.hidden || !renderer) return;
  const now = performance.now();
  if (now - last < 33) return; // ~30 fps is plenty here and light on phones
  last = now;
  const delta = (now - previous) / 1000;
  previous = now;
  character?.update(delta, (now - started) / 1000, props.animation === 'talk');
  renderer.render(scene, camera);
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
    key = addCharacterLights(scene);
    await mountCharacter();
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
  character?.dispose();
  scene?.traverse((object) => { const mesh = object as THREE.Mesh; if (mesh.isMesh) mesh.geometry?.dispose(); });
  renderer?.dispose();
  renderer?.domElement.remove();
});

watch(data, () => { if (character && character.gender !== data.value.gender) void mountCharacter(); else applyAll(); }, { deep: true });
watch(() => props.animation, () => character?.play(props.animation));
watch(() => props.expression, () => character?.setExpression(props.expression));
watch(() => props.crop, resize);
</script>

<template>
  <CharacterModel v-if="failed" :role="role" :character-id="role === 'customer' ? characterId : (look.bartenderCharacter ?? 'noa')" :outfit="look.bartender" :hair-style="look.hairStyle" :hair-color="look.hairColor" :skin-tone="look.skinTone" :expression="expression" animation="idle" />
  <div v-else ref="host" class="bartender3d" role="img" :aria-label="role === 'customer' ? 'Guest' : 'Your bartender'"></div>
</template>

<style scoped>
.bartender3d { position: relative; width: 100%; height: 100%; min-width: 0; overflow: hidden; }
/* Out of the layout flow so the canvas's pixel size can never widen its container. */
.bartender3d :deep(.bartender3d-canvas) { position: absolute; inset: 0; width: 100%; height: 100%; }
</style>
