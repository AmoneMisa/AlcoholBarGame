<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue';
import { guide, pickPointer, wording, type Gesture } from '../../guide/pointer';

// Draws the guide pointer: a pulsing circle on the real element and a hand that shows the gesture. It never takes
// a click: the player presses the real button underneath. Positions are read again several times a second, because
// shelves scroll, panels open and the layout changes.

interface Drawn { key: string; gesture: Gesture; label: string; x: number; y: number; size: number; dx: number; dy: number; labelBelow: boolean; labelLeft: number }
const drawn = ref<Drawn>();
let timer: ReturnType<typeof setInterval> | undefined;

const center = (box: DOMRect) => ({ x: box.left + box.width / 2, y: box.top + box.height / 2 });

function refresh() {
  const found = pickPointer(guide.tour) ?? pickPointer(guide.help) ?? pickPointer(guide.practice);
  if (!found) { drawn.value = undefined; return; }
  let { element } = found;
  let { gesture, label } = found.spec;
  let box = element.getBoundingClientRect();
  // A bottle that is scrolled out of its shelf: point at the shelf's arrow and ask for a swipe instead.
  const shelf = element.closest('.pshelf-bottles');
  if (shelf && found.spec.gesture === 'drag') {
    const view = shelf.getBoundingClientRect();
    if (box.right > view.right + 2 || box.left < view.left - 2) {
      const right = box.right > view.right;
      const arrow = shelf.closest('.pshelf-row')?.querySelectorAll<HTMLElement>('.shelf-nudge button')[right ? 1 : 0];
      if (arrow) { element = arrow; box = arrow.getBoundingClientRect(); gesture = 'swipe'; label = `Swipe the shelf ${right ? 'left' : 'right'} (or {tap} ${right ? '›' : '‹'}) to find the bottle`; }
    }
  }
  const start = center(box);
  let dx = 0, dy = 0;
  if (gesture === 'drag' && found.spec.to) {
    const target = document.querySelector(found.spec.to);
    if (target) { const end = center(target.getBoundingClientRect()); dx = end.x - start.x; dy = end.y - start.y; }
  } else if (gesture === 'swipe') { dx = box.left < (window.innerWidth || 800) / 2 ? 90 : -90; }
  const size = Math.max(44, Math.min(120, Math.max(box.width, box.height) + 14));
  drawn.value = {
    key: `${found.spec.target}|${label}`, gesture, label: wording(label), x: start.x, y: start.y, size, dx, dy,
    labelBelow: start.y < (window.innerHeight || 800) * 0.55, labelLeft: window.innerWidth ? Math.max(150, Math.min(window.innerWidth - 150, start.x)) : start.x
  };
}

const style = computed(() => drawn.value ? { left: `${drawn.value.x}px`, top: `${drawn.value.y}px`, '--size': `${drawn.value.size}px`, '--dx': `${drawn.value.dx}px`, '--dy': `${drawn.value.dy}px` } : {});
const hand = computed(() => drawn.value?.gesture === 'type' ? '⌨️' : '👆');

onMounted(() => { refresh(); timer = setInterval(refresh, 180); window.addEventListener('resize', refresh); });
onBeforeUnmount(() => { if (timer) clearInterval(timer); window.removeEventListener('resize', refresh); });
</script>

<template>
  <div v-if="drawn" :key="drawn.key" class="guide-pointer" :class="drawn.gesture" :style="style" aria-hidden="true">
    <i class="gp-ring" />
    <svg v-if="drawn.gesture === 'drag'" class="gp-path" width="1" height="1" overflow="visible"><line x1="0" y1="0" :x2="drawn.dx" :y2="drawn.dy" /></svg>
    <span class="gp-hand">{{ hand }}</span>
    <b class="gp-label" :class="{ below: drawn.labelBelow }" :style="{ marginLeft: `${drawn.labelLeft - drawn.x}px` }">{{ drawn.label }}</b>
  </div>
</template>

<style scoped>
.guide-pointer { position: fixed; z-index: 450; width: 0; height: 0; pointer-events: none; }
.gp-ring { position: absolute; left: calc(var(--size) / -2); top: calc(var(--size) / -2); width: var(--size); height: var(--size); border-radius: 50%; border: 3px solid #ffd35a; box-shadow: 0 0 0 4px rgba(255, 211, 90, .25), 0 0 18px rgba(255, 211, 90, .8); animation: gp-pulse 1.3s ease-out infinite; }
.gp-hand { position: absolute; left: -6px; top: -4px; font-size: 30px; line-height: 1; filter: drop-shadow(0 2px 3px rgba(0, 0, 0, .6)); }
.guide-pointer.tap .gp-hand { animation: gp-tap 1.3s ease-in-out infinite; }
.guide-pointer.drag .gp-hand { animation: gp-drag 2.2s ease-in-out infinite; }
.guide-pointer.swipe .gp-hand { animation: gp-drag 1.6s ease-in-out infinite; }
.guide-pointer.type .gp-hand { animation: gp-blink 1s steps(2) infinite; }
.gp-path line { stroke: #ffd35a; stroke-width: 3; stroke-dasharray: 6 7; opacity: .9; }
.gp-label { position: absolute; top: calc(var(--size) / -2 - 44px); width: max-content; max-width: min(280px, 80vw); transform: translateX(-50%); padding: 6px 10px; border-radius: 10px; background: #ffd35a; color: #1b1405; font: 700 13px/1.25 system-ui, sans-serif; text-align: center; box-shadow: 0 6px 18px rgba(0, 0, 0, .5); }
.gp-label.below { top: calc(var(--size) / 2 + 10px); }
@keyframes gp-pulse { 0% { transform: scale(.85); opacity: 1; } 100% { transform: scale(1.25); opacity: .15; } }
@keyframes gp-tap { 0%, 100% { transform: translate(8px, 8px) scale(1); } 40% { transform: translate(0, 0) scale(.88); } }
@keyframes gp-drag { 0% { transform: translate(0, 0); } 15% { transform: translate(0, 0) scale(.9); } 80% { transform: translate(var(--dx), var(--dy)) scale(.9); } 100% { transform: translate(var(--dx), var(--dy)) scale(1); opacity: .2; } }
@keyframes gp-blink { 50% { opacity: .35; } }
@media (prefers-reduced-motion: reduce) { .gp-ring, .guide-pointer .gp-hand { animation: none; } }
</style>
