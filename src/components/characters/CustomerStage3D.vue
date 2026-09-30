<script setup lang="ts">
// All guests at the bar are drawn on ONE canvas (one WebGL context however many guests sit there). Each guest's HTML button carries an empty
// slot element (`[data-guest-slot]`); this stage reads the slot's rectangle every frame and draws that guest's 3D person into it, cut off at
// the slot's bottom edge (the back edge of the counter).
import { onBeforeUnmount, onMounted, ref, watch } from 'vue';
import * as THREE from 'three';
import type { Look3dInput } from '../../domain/character3d';
import { CharacterRig, addCharacterLights, loadCharacterModel } from '../../domain/character3dRig';
import type { CharacterExpression } from '../../domain/dialogue/types';

export interface Guest3D { id: string; look: Look3dInput; animation: string; expression: CharacterExpression }
const props = defineProps<{ guests: Guest3D[] }>();

const host = ref<HTMLDivElement>();
let renderer: THREE.WebGLRenderer | undefined;
let scene: THREE.Scene;
let camera: THREE.OrthographicCamera;
const rigs = new Map<string, { rig: CharacterRig; look: string; gender: string }>();
const pending = new Set<string>();
let width = 1; let height = 1;
let raf = 0; let last = 0; let previous = performance.now();
const started = performance.now();
let resizer: ResizeObserver | undefined;
let disposed = false;

const lookKey = (guest: Guest3D) => JSON.stringify(guest.look);
async function ensure(guest: Guest3D) {
  const existing = rigs.get(guest.id);
  const gender = guest.look.bartenderCharacter === 'leo' ? 'male' : 'female';
  if (existing && existing.gender === gender) {
    if (existing.look !== lookKey(guest)) { existing.rig.setLook(guest.look); existing.look = lookKey(guest); }
    existing.rig.setExpression(guest.expression); existing.rig.play(guest.animation);
    return;
  }
  if (pending.has(guest.id)) return;
  pending.add(guest.id);
  try {
    const model = await loadCharacterModel(gender);
    if (disposed) return;
    if (existing) { scene.remove(existing.rig.root); existing.rig.dispose(); }
    // Guests are small on screen: lighter textures keep five of them cheap.
    const rig = new CharacterRig(model, gender, { headTexture: 256, bodyTexture: 512 });
    rig.setLook(guest.look); rig.setExpression(guest.expression); rig.play(guest.animation);
    scene.add(rig.root);
    rigs.set(guest.id, { rig, look: lookKey(guest), gender });
  } finally { pending.delete(guest.id); }
}

function sync() {
  const ids = new Set(props.guests.map((guest) => guest.id));
  for (const [id, entry] of rigs) if (!ids.has(id)) { scene.remove(entry.rig.root); entry.rig.dispose(); rigs.delete(id); }
  for (const guest of props.guests) void ensure(guest);
}

function resize() {
  if (!host.value || !renderer) return;
  width = host.value.clientWidth; height = host.value.clientHeight;
  if (!width || !height) return;
  renderer.setSize(width, height, false);
  camera.left = 0; camera.right = width; camera.top = height; camera.bottom = 0;
  camera.updateProjectionMatrix();
}

// Metres of the person from the hips up (hips at 0.95 m, hair top at about 1.98 m) fill the slot's height.
const HIPS = .95; const VISIBLE = 1.12;
function tick() {
  raf = requestAnimationFrame(tick);
  if (document.hidden || !renderer || !host.value) return;
  const now = performance.now();
  if (now - last < 33) return;
  last = now;
  const dt = Math.min(.1, (now - previous) / 1000); previous = now;
  const time = (now - started) / 1000;
  const box = host.value.getBoundingClientRect();
  renderer.setScissorTest(false);
  renderer.clear();
  renderer.setScissorTest(true);
  for (const guest of props.guests) {
    const entry = rigs.get(guest.id);
    const slot = host.value.parentElement?.querySelector<HTMLElement>(`[data-guest-slot="${CSS.escape(guest.id)}"]`);
    if (!entry || !slot) continue;
    const rect = slot.getBoundingClientRect();
    if (!rect.width || !rect.height) { entry.rig.root.visible = false; continue; }
    const scale = rect.height / VISIBLE;
    const centreX = rect.left - box.left + rect.width / 2;
    const bottom = height - (rect.bottom - box.top);           // slot bottom edge, measured up from the canvas bottom
    entry.rig.update(dt, time, guest.animation === 'talk');
    entry.rig.root.scale.setScalar(scale);
    entry.rig.root.position.set(centreX, bottom - HIPS * scale, 0);
    for (const other of rigs.values()) other.rig.root.visible = other === entry;
    const x = Math.max(0, rect.left - box.left - rect.width * .3), w = Math.min(width - x, rect.width * 1.6 - Math.max(0, box.left - rect.left));
    if (w <= 1 || rect.right < box.left || rect.left > box.right) continue;      // scrolled out of view
    renderer.setScissor(x, bottom, w, Math.min(height - bottom, rect.height * 1.25));
    renderer.clearDepth();
    renderer.render(scene, camera);
  }
  for (const entry of rigs.values()) entry.rig.root.visible = true;
}

onMounted(() => {
  try {
    if (!host.value) return;
    renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true, powerPreference: 'low-power' });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.autoClear = false;
    renderer.domElement.className = 'guest-stage-canvas';
    host.value.appendChild(renderer.domElement);
    scene = new THREE.Scene();
    camera = new THREE.OrthographicCamera(0, 1, 1, 0, 1, 4000);
    camera.position.set(0, 0, 2000);
    addCharacterLights(scene);
    resize();
    resizer = new ResizeObserver(resize); resizer.observe(host.value);
    sync();
    tick();
  } catch { /* no WebGL: the guests' buttons still work, they just have no picture */ }
});
onBeforeUnmount(() => {
  disposed = true; cancelAnimationFrame(raf); resizer?.disconnect();
  for (const entry of rigs.values()) entry.rig.dispose();
  renderer?.dispose(); renderer?.domElement.remove();
});
watch(() => props.guests, sync, { deep: true });
</script>

<template>
  <div ref="host" class="guest-stage" aria-hidden="true"></div>
</template>

<style scoped>
.guest-stage { position: absolute; inset: 0; z-index: 0; pointer-events: none; }
.guest-stage :deep(.guest-stage-canvas) { position: absolute; inset: 0; width: 100%; height: 100%; }
</style>
