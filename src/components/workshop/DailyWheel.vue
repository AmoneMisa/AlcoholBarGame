<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, ref, watch } from 'vue';
import { ROULETTE_SPINS_PER_DAY, WHEEL } from '../../domain/roulette';
import { useGameStore } from '../../stores/game';
import UiButton from '../ui/UiButton.vue';

// The daily wheel: three free spins a day. The server decides where the wheel stops; this screen only plays the
// animation towards that segment. "Skip animation" jumps straight to the result.
const game = useGameStore();
const SEGMENT = 360 / WHEEL.length;
const SPIN_MS = 4600;
const angle = ref(0);
const instant = ref(false);       // no transition: used when skipping, and for people who prefer less motion
const waiting = ref(false);       // a spin was asked for and the answer has not arrived yet
const spinning = ref(false);      // the wheel is turning
const shown = ref('');            // the prize text, only shown once the wheel has stopped
let finalAngle = 0;
let timer: ReturnType<typeof setTimeout> | undefined;
let watchdog: ReturnType<typeof setTimeout> | undefined;

const left = computed(() => game.rouletteSpinsLeft);
const busy = computed(() => waiting.value || spinning.value);
const totalWeight = WHEEL.reduce((sum, segment) => sum + segment.weight, 0);
const odds = WHEEL.map((segment) => ({ ...segment, percent: Math.round(segment.weight / totalWeight * 1000) / 10 }));
const reduceMotion = () => typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

const point = (degrees: number, radius: number) => {
  const radians = degrees * Math.PI / 180;
  return `${(radius * Math.sin(radians)).toFixed(2)} ${(-radius * Math.cos(radians)).toFixed(2)}`;
};
// The picture on each segment: WebP art from public/assets/workshop (the emoji stays underneath if a file is missing).
const ART: Record<string, string> = {
  'crystals-5': 'resources/crystals', 'crystals-15': 'resources/crystals', 'crystals-40': 'resources/crystals', coins: 'resources/coins', xp: 'resources/xp',
  'style-shard': 'shards/style', 'style-shards-5': 'shards/style', parts: 'shards/parts', 'circle-shard': 'shards/circle', 'skin-shards': 'shards/skin',
  'bronze-box': 'boxes/bronze', booster: 'items/xp-boost'
};
const artUrl = (id: string) => ART[id] ? `${import.meta.env.BASE_URL}assets/workshop/${ART[id]}.webp` : '';
const slices = WHEEL.map((segment, index) => ({
  ...segment,
  art: artUrl(segment.id),
  path: `M0 0 L${point(index * SEGMENT, 96)} A96 96 0 0 1 ${point((index + 1) * SEGMENT, 96)} Z`,
  turn: index * SEGMENT + SEGMENT / 2
}));

function finish() {
  clearTimeout(timer); clearTimeout(watchdog);
  spinning.value = false; waiting.value = false;
  angle.value = finalAngle;
  shown.value = game.rouletteLast?.text ?? '';
  nextTick(() => { instant.value = false; });
}

function start(index: number) {
  clearTimeout(watchdog);
  const centre = index * SEGMENT + SEGMENT / 2;
  const wanted = (360 - centre) % 360;                          // the segment's centre ends up under the pointer
  const delta = (((wanted - (angle.value % 360)) % 360) + 360) % 360;
  finalAngle = angle.value + 360 * 5 + delta;
  shown.value = '';
  if (reduceMotion()) { instant.value = true; angle.value = finalAngle; nextTick(finish); return; }
  spinning.value = true; waiting.value = false;
  nextTick(() => requestAnimationFrame(() => { angle.value = finalAngle; }));
  timer = setTimeout(finish, SPIN_MS + 300);
}

function spin() {
  if (busy.value || left.value <= 0) return;
  waiting.value = true; shown.value = '';
  const accepted = game.spinRoulette();
  if (!accepted) waiting.value = false;
  else watchdog = setTimeout(() => { waiting.value = false; }, 8000);   // the server did not answer: let the player try again
}

function skip() {
  if (!spinning.value) return;
  instant.value = true;
  finish();
}

watch(() => game.rouletteLast?.n, (next, previous) => {
  if (waiting.value && next !== undefined && next !== previous) start(game.rouletteLast!.index);
});
onBeforeUnmount(() => { clearTimeout(timer); clearTimeout(watchdog); });
</script>

<template>
  <div class="wheel-page">
    <div class="wheel-stage">
      <div class="wheel-pointer" aria-hidden="true"></div>
      <svg class="wheel-disc" :class="{ instant }" viewBox="-100 -100 200 200" role="img" aria-label="Daily prize wheel" :style="{ transform: `rotate(${angle}deg)`, transitionDuration: instant ? '0ms' : `${SPIN_MS}ms` }">
        <circle r="99" fill="#10182a" stroke="#d8aa57" stroke-width="2" />
        <g v-for="(slice, index) in slices" :key="slice.id">
          <path :d="slice.path" :fill="slice.color" stroke="#0c1421" stroke-width="1" />
          <g :transform="`rotate(${slice.turn})`">
            <text y="-70" text-anchor="middle" font-size="13">{{ slice.icon }}</text>
            <image v-if="slice.art" :href="slice.art" x="-8.5" y="-80" width="17" height="17" />
            <text y="-57" text-anchor="middle" font-size="5.2" fill="#fff" font-weight="700">{{ slice.label }}</text>
          </g>
        </g>
        <circle r="9" fill="#d8aa57" />
      </svg>
    </div>
    <div class="wheel-side">
      <p class="wheel-spins" role="status"><b>{{ left }}</b> of {{ ROULETTE_SPINS_PER_DAY }} spins left today</p>
      <p class="wheel-result" role="status" aria-live="polite">{{ shown || (spinning ? 'Spinning…' : waiting ? 'Waiting for the wheel…' : 'Spin the wheel for a small prize.') }}</p>
      <div class="wheel-buttons">
        <UiButton variant="primary" :disabled="busy || left <= 0" @click="spin">{{ left <= 0 ? 'Come back tomorrow' : 'Spin' }}</UiButton>
        <UiButton v-if="spinning" variant="secondary" @click="skip">Skip animation</UiButton>
      </div>
      <details class="wheel-odds">
        <summary>What is on the wheel</summary>
        <ul><li v-for="item in odds" :key="item.id"><span>{{ item.icon }} {{ item.label }}</span><b>{{ item.percent }}%</b></li></ul>
      </details>
    </div>
  </div>
</template>

<style>
.wheel-page { display: grid; grid-template-columns: minmax(220px, 340px) 1fr; gap: 20px; align-items: center; padding: 8px 4px; }
@media (max-width: 640px) { .wheel-page { grid-template-columns: 1fr; justify-items: center; } }
.wheel-stage { position: relative; width: min(340px, 82vw); aspect-ratio: 1; }
.wheel-disc { width: 100%; height: 100%; display: block; transition-property: transform; transition-timing-function: cubic-bezier(.1, .72, .12, 1); filter: drop-shadow(0 10px 22px #0008); }
.wheel-pointer { position: absolute; z-index: 2; left: 50%; top: -6px; width: 0; height: 0; transform: translateX(-50%); border-left: 12px solid transparent; border-right: 12px solid transparent; border-top: 22px solid #f2c96a; filter: drop-shadow(0 2px 3px #000a); }
.wheel-side { display: grid; gap: 12px; align-content: center; }
.wheel-spins { margin: 0; color: #c9d5e6; }
.wheel-spins b { color: #e4b35c; font-size: 22px; }
.wheel-result { margin: 0; min-height: 3em; font-size: 16px; font-weight: 700; color: #f8efe7; }
.wheel-buttons { display: flex; flex-wrap: wrap; gap: 8px; }
.wheel-odds { font-size: 13px; color: #c9d5e6; }
.wheel-odds summary { cursor: pointer; }
.wheel-odds ul { list-style: none; margin: 8px 0 0; padding: 0; display: grid; gap: 4px; }
.wheel-odds li { display: flex; justify-content: space-between; gap: 12px; }
@media (prefers-reduced-motion: reduce) { .wheel-disc { transition-duration: 0ms !important; } }
</style>
