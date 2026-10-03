<script setup lang="ts">
import UiIcon from './UiIcon.vue';
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
  if (document.querySelector('.bar-photo-screen, .modal-backdrop.celebration, .modal-backdrop.reveal')) { drawn.value = undefined; return; }
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
      if (arrow) { element = arrow; box = arrow.getBoundingClientRect(); gesture = 'swipe'; label = `Swipe the shelf ${right ? 'left' : 'right'} (or {tap} the ${right ? 'right' : 'left'} arrow) to find the bottle`; }
    }
  }
  const start = center(box);
  let dx = 0, dy = 0;
  if (gesture === 'drag' && found.spec.to) {
    const target = document.querySelector(found.spec.to);
    if (target) { const end = center(target.getBoundingClientRect()); dx = end.x - start.x; dy = end.y - start.y; }
  } else if (gesture === 'swipe') { dx = box.left < (window.innerWidth || 800) / 2 ? 90 : -90; }
  const size = Math.max(44, Math.min(120, Math.max(box.width, box.height) + 14));
  // The label goes above or below the ring, wherever it hides fewer other controls (and stays on the screen).
  const labelText = wording(label);
  const labelWidth = Math.min(280, (window.innerWidth || 800) * .8, labelText.length * 7.2 + 24);
  const labelCenter = window.innerWidth ? Math.max(labelWidth / 2 + 6, Math.min(window.innerWidth - labelWidth / 2 - 6, start.x)) : start.x;
  const labelHeight = labelText.length * 7.2 > 250 ? 52 : 34;
  const aboveTop = start.y - size / 2 - 44, belowTop = start.y + size / 2 + 10;
  const controls = [...document.querySelectorAll<HTMLElement>('button, input, textarea, [role="tab"], .word-answer, .talk-line, .tour-card')].filter((control) => control !== element && !element.contains(control) && !control.contains(element)).map((control) => control.getBoundingClientRect()).filter((rect) => rect.width > 1 && rect.height > 1);
  const covered = (top: number) => controls.reduce((sum, rect) => sum + Math.max(0, Math.min(top + labelHeight, rect.bottom) - Math.max(top, rect.top)) * Math.max(0, Math.min(labelCenter + labelWidth / 2, rect.right) - Math.max(labelCenter - labelWidth / 2, rect.left)), 0);
  const fitsAbove = aboveTop >= 4, fitsBelow = belowTop + labelHeight <= (window.innerHeight || 800) - 4;
  const preferBelow = start.y < (window.innerHeight || 800) * 0.55;
  const below = fitsAbove && fitsBelow ? (covered(belowTop) === covered(aboveTop) ? preferBelow : covered(belowTop) < covered(aboveTop)) : fitsBelow;
  drawn.value = {
    key: `${found.spec.target}|${label}`, gesture, label: labelText, x: start.x, y: start.y, size, dx, dy,
    labelBelow: below, labelLeft: labelCenter
  };
}

const style = computed(() => drawn.value ? { left: `${drawn.value.x}px`, top: `${drawn.value.y}px`, '--size': `${drawn.value.size}px`, '--dx': `${drawn.value.dx}px`, '--dy': `${drawn.value.dy}px` } : {});
const hand = computed(() => drawn.value?.gesture === 'type' ? 'keyboard' : 'pointer');

onMounted(() => { refresh(); timer = setInterval(refresh, 180); window.addEventListener('resize', refresh); });
onBeforeUnmount(() => { if (timer) clearInterval(timer); window.removeEventListener('resize', refresh); });
</script>

<template>
  <div v-if="drawn" :key="drawn.key" class="guide-pointer" :class="drawn.gesture" :style="style" aria-hidden="true">
    <i class="gp-ring" />
    <i v-if="drawn.gesture === 'drag'" class="gp-path" :style="{width: Math.hypot(drawn.dx, drawn.dy) + 'px', transform: 'rotate(' + Math.atan2(drawn.dy, drawn.dx) + 'rad)'}" />
    <span class="gp-hand"><UiIcon :name="hand" /></span>
    <b class="gp-label" :class="{ below: drawn.labelBelow }" :style="{ marginLeft: `${drawn.labelLeft - drawn.x}px` }">{{ drawn.label }}</b>
  </div>
</template>

<style scoped>
.guide-pointer { position: fixed; z-index: 1850; width: 0; height: 0; pointer-events: none; }
.gp-ring { position: absolute; left: calc(var(--size) / -2); top: calc(var(--size) / -2); width: var(--size); height: var(--size); border-radius: 50%; border: 3px solid #ffd35a; box-shadow: 0 0 0 4px rgba(255, 211, 90, .25), 0 0 18px rgba(255, 211, 90, .8); animation: gp-pulse 1.3s ease-out infinite; }
.gp-hand .ui-icon { width: 30px; height: 30px; }
.gp-hand { position: absolute; left: -6px; top: -4px; width: 30px; height: 30px; color: #fff3dc; filter: drop-shadow(0 2px 3px rgba(0, 0, 0, .6)); }
.guide-pointer.tap .gp-hand { animation: gp-tap 1.3s ease-in-out infinite; }
.guide-pointer.drag .gp-hand { animation: gp-drag 2.2s ease-in-out infinite; }
.guide-pointer.swipe .gp-hand { animation: gp-drag 1.6s ease-in-out infinite; }
.guide-pointer.type .gp-hand { animation: gp-blink 1s steps(2) infinite; }
.gp-path {position:absolute;left:0;top:-1.5px;height:3px;transform-origin:left center;background:repeating-linear-gradient(to right,#ffd35a 0 6px,transparent 6px 13px);opacity:.9;}
.gp-label { position: absolute; top: calc(var(--size) / -2 - 44px); width: max-content; max-width: min(280px, 80vw); transform: translateX(-50%); padding: 6px 10px; border-radius: 10px; background: #ffd35a; color: #1b1405; font: 700 13px/1.25 system-ui, sans-serif; text-align: center; box-shadow: 0 6px 18px rgba(0, 0, 0, .5); }
.gp-label.below { top: calc(var(--size) / 2 + 10px); }
@keyframes gp-pulse { 0% { transform: scale(.85); opacity: 1; } 100% { transform: scale(1.25); opacity: .15; } }
@keyframes gp-tap { 0%, 100% { transform: translate(8px, 8px) scale(1); } 40% { transform: translate(0, 0) scale(.88); } }
@keyframes gp-drag { 0% { transform: translate(0, 0); } 15% { transform: translate(0, 0) scale(.9); } 80% { transform: translate(var(--dx), var(--dy)) scale(.9); } 100% { transform: translate(var(--dx), var(--dy)) scale(1); opacity: .2; } }
@keyframes gp-blink { 50% { opacity: .35; } }
@media (prefers-reduced-motion: reduce) { .gp-ring, .guide-pointer .gp-hand { animation: none; } }
</style>
