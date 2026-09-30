<script setup lang="ts">
// The live glass on the bar: a real 3D glass with liquid that rises as it is poured, ice, garnish, bubbles, a pour stream and the
// cocktail shaker that takes over while shaking.
import { onBeforeUnmount, onMounted, ref, watch } from 'vue';
import * as THREE from 'three';
import { GlassRig, environmentFor, frameGlass, loadProps, type Garnish, type GlassType } from '../../domain/props3d';

const props = withDefaults(defineProps<{
  type?: GlassType; fill?: number; color?: string; ice?: number; garnish?: Garnish; bubbles?: boolean; pouring?: string; shaking?: boolean;
}>(), { type: 'highball', fill: 0, color: '#d8a24a', ice: 0, garnish: '', bubbles: false, shaking: false });

const host = ref<HTMLDivElement>();
const failed = ref(false);
let renderer: THREE.WebGLRenderer | undefined;
let scene: THREE.Scene; let camera: THREE.PerspectiveCamera;
let rig: GlassRig | undefined; let env: THREE.Texture | undefined;
let raf = 0; let last = 0; let disposed = false; let resizer: ResizeObserver | undefined;
const started = performance.now();

const state = () => ({ fill: props.fill, color: props.color, ice: props.ice, garnish: props.garnish, bubbles: props.bubbles, pouring: props.pouring, shaking: props.shaking });

function resize() {
  if (!host.value || !renderer) return;
  const { clientWidth: w, clientHeight: h } = host.value;
  if (!w || !h) return;
  renderer.setSize(w, h, false);
  camera.aspect = w / h;
  frameGlass(camera, props.type);
  camera.updateProjectionMatrix();
}

function mountRig(model: THREE.Group) {
  if (rig) { scene.remove(rig.group); rig.dispose(); }
  rig = new GlassRig(model, props.type, env);
  rig.set(state());
  scene.add(rig.group);
  resize();
}

function tick() {
  raf = requestAnimationFrame(tick);
  if (document.hidden || !renderer || !rig) return;
  const now = performance.now();
  if (now - last < 33) return;
  const dt = Math.min(.1, (now - last) / 1000); last = now;
  rig.tick(dt, (now - started) / 1000);
  renderer.render(scene, camera);
}

onMounted(async () => {
  try {
    if (!host.value) return;
    renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true, powerPreference: 'low-power' });
    renderer.localClippingEnabled = true;
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.domElement.className = 'glass3d-canvas';
    host.value.appendChild(renderer.domElement);
    scene = new THREE.Scene();
    camera = new THREE.PerspectiveCamera(28, 1, .1, 30);
    env = environmentFor(renderer); scene.environment = env;
    scene.add(new THREE.HemisphereLight('#ffffff', '#4a3f52', 1.05));
    const key = new THREE.DirectionalLight('#fff1d6', 2.0); key.position.set(-1.6, 2.6, 2.6); scene.add(key);
    const rim = new THREE.DirectionalLight('#9dbcff', 1); rim.position.set(2, 1, -2); scene.add(rim);
    const model = await loadProps();
    if (disposed) return;
    mountRig(model);
    resizer = new ResizeObserver(resize); resizer.observe(host.value);
    tick();
  } catch { failed.value = true; }
});

onBeforeUnmount(() => {
  disposed = true; cancelAnimationFrame(raf); resizer?.disconnect(); rig?.dispose(); env?.dispose(); renderer?.dispose(); renderer?.domElement.remove();
});

watch(() => [props.fill, props.color, props.ice, props.garnish, props.bubbles, props.pouring, props.shaking], () => rig?.set(state()));
watch(() => props.type, async () => { if (renderer) mountRig(await loadProps()); });
</script>

<template>
  <div class="glass3d" role="img" aria-label="Your glass">
    <div v-if="failed" class="glass3d-fallback">3D view unavailable</div>
    <div v-else ref="host" class="glass3d-host"></div>
  </div>
</template>

<style scoped>
.glass3d { position: relative; width: 100%; height: 100%; min-width: 0; }
.glass3d-host { position: absolute; inset: 0; overflow: hidden; }
.glass3d-host :deep(.glass3d-canvas) { position: absolute; inset: 0; width: 100%; height: 100%; }
.glass3d-fallback { display: grid; place-items: center; height: 100%; color: #8a94a6; font-size: 11px; }
</style>
