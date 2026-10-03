<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, ref, watch } from 'vue';
import { itemArtwork } from '../../domain/itemArtwork';
import { ROULETTE_SPINS_PER_DAY, WHEEL } from '../../domain/roulette';
import { useGameStore } from '../../stores/game';
import UiButton from '../ui/UiButton.vue';
import ModalDialog from '../ui/ModalDialog.vue';

// The daily wheel: three free spins a day. The server decides where the wheel stops; this screen only plays the
// animation towards that segment. "Skip animation" jumps straight to the result.
const game = useGameStore();
const emit = defineEmits<{busy:[value:boolean]}>();
const rewardOpen = ref(false);
const won = computed(() => game.rouletteLast ? slices[game.rouletteLast.index] : undefined);
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
watch(busy, value => emit('busy', value));
const totalWeight = WHEEL.reduce((sum, segment) => sum + segment.weight, 0);
const odds = WHEEL.map((segment) => ({ ...segment, percent: Math.round(segment.weight / totalWeight * 1000) / 10 }));
const reduceMotion = () => typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

// The picture on each segment: WebP art from public/assets/workshop (the emoji stays underneath if a file is missing).
const ART: Record<string, string> = {
  'crystals-5': 'resources/crystals', 'crystals-15': 'resources/crystals', 'crystals-40': 'resources/crystals', coins: 'resources/coins', xp: 'resources/xp',
  'style-shard': 'shards/style', 'style-shards-5': 'shards/style', parts: 'shards/parts', 'circle-shard': 'shards/circle', 'skin-shards': 'shards/skin',
  'bronze-box': 'boxes/bronze', booster: 'items/xp-boost'
};
const artUrl = (id: string) => ['style-shard','style-shards-5','skin-shards','circle-shard'].includes(id) ? `${import.meta.env.BASE_URL}assets/ui/fragment-puzzle-painted-v1.webp` : ART[id] ? itemArtwork(ART[id]!,import.meta.env.BASE_URL) : '';
const slices = WHEEL.map((segment, index) => ({
  ...segment,
  art: artUrl(segment.id),
  turn: index * SEGMENT + SEGMENT / 2
}));

function finish() {
  clearTimeout(timer); clearTimeout(watchdog);
  spinning.value = false; waiting.value = false;
  angle.value = finalAngle;
  shown.value = game.rouletteLast?.text ?? '';
  rewardOpen.value = !!shown.value;
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
  waiting.value = true; shown.value = ''; rewardOpen.value = false;
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
onBeforeUnmount(() => { clearTimeout(timer); clearTimeout(watchdog); emit('busy',false); });
</script>

<template>
  <div class="wheel-page">
    <div class="wheel-stage">
      <div class="wheel-pointer" aria-hidden="true"></div>
      <div class="wheel-disc" :class="{ instant }" role="img" aria-label="Daily prize wheel" :style="{ transform: `rotate(${angle}deg)`, transitionDuration: instant ? '0ms' : `${SPIN_MS}ms` }">
        <img class="wheel-background" src="/assets/ui/daily-wheel.webp" alt="" width="800" height="800" draggable="false" />
        <div v-for="slice in slices" :key="slice.id" class="wheel-sector" :style="{transform: `rotate(${slice.turn}deg)`}" aria-hidden="true">
          <div class="wheel-sector-reward"><img v-if="slice.art" :src="slice.art" alt="" /><span v-else>{{ slice.icon }}</span><b>{{ slice.label }}</b></div>
        </div>
      </div>
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
  <ModalDialog v-if="rewardOpen" title="Your wheel reward" presentation="celebration" width="400px" @close="rewardOpen = false"><div class="wheel-prize-reveal"><img v-if="won?.art" :src="won.art" alt="" /><b>{{ shown }}</b><p>{{ game.mode === 'online' ? 'Your reward delivery is in Mail.' : 'Added to your collection.' }}</p><UiButton variant="solid" block @click="rewardOpen = false">Continue</UiButton></div></ModalDialog>
</template>

<style>
.wheel-prize-reveal { display:grid;justify-items:center;gap:18px;text-align:center;animation:wheel-prize .5s ease both; }.wheel-prize-reveal img { width:120px;height:120px;object-fit:contain;filter:drop-shadow(0 0 22px #e4b35c77); }.wheel-prize-reveal b { color:#ffe0a0;font:700 22px Georgia; }.wheel-prize-reveal p { color:#bcc9db;font-size:13px;margin:0; }
@keyframes wheel-prize { from { opacity:0;transform:translateY(12px) scale(.9); } }
@media(prefers-reduced-motion:reduce) { .wheel-prize-reveal { animation:none; } }

.wheel-page { display: grid; grid-template-columns: minmax(220px, 340px) 1fr; gap: 20px; align-items: center; padding: 8px 4px; }
@media (max-width: 640px) { .wheel-page { grid-template-columns: 1fr; justify-items: center; } }
.wheel-stage { position: relative; width: min(340px, 82vw); aspect-ratio: 1; }
.wheel-disc { width: 100%; height: 100%; display: block; transition-property: transform; transition-timing-function: cubic-bezier(.1, .72, .12, 1); filter: drop-shadow(0 10px 22px #0008); }
.wheel-disc {position:relative}
.wheel-background {display:block;width:100%;height:100%;object-fit:contain}
.wheel-sector {position:absolute;inset:0;pointer-events:none}
.wheel-sector-reward {position:absolute;left:50%;top:10%;width:24%;transform:translateX(-50%);display:grid;justify-items:center;gap:3px;color:#fff;text-align:center}
.wheel-sector-reward img {display:block;width:40%;aspect-ratio:1;object-fit:contain}
.wheel-sector-reward span {font-size:20px;line-height:1}
.wheel-sector-reward b {max-width:46px;font:700 8px/1.15 system-ui,sans-serif;white-space:normal;text-shadow:0 1px 3px #000}
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
