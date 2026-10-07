<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { tipJarStage } from '../../domain/tipJarVisual';
import { useGameStore } from '../../stores/game';
import ModalDialog from '../ui/ModalDialog.vue';
import UiButton from '../ui/UiButton.vue';
const game = useGameStore();
const props = defineProps<{ visited?: boolean }>();
const amount = computed(() => props.visited ? game.visitedFriend?.tips?.amount ?? 0 : game.tipJar);
const capacity = computed(() => props.visited ? game.visitedFriend?.tips?.capacity ?? 60 : game.tipJarCapacity);
const stage = computed(() => tipJarStage(amount.value, capacity.value));
const jarImage = computed(() => `${import.meta.env.BASE_URL}assets/ui/tip-jar/stage-${stage.value}.webp`);
const unavailable = computed(() => props.visited ? game.stealingTips || !game.visitedFriend?.tips || game.visitedFriend.tips.attemptedToday || game.visitedFriend.tips.attemptsLeft <= 0 : amount.value <= 0);
const pulse = ref(0);
const open = ref(false);
const collecting = ref(false);
async function collect() {
  if (collecting.value || amount.value <= 0) return;
  collecting.value = true;
  try { if (await game.collectTips()) open.value = false; } finally { collecting.value = false; }
}
async function steal() { await game.stealVisitedTips(); open.value = false; }
watch(amount, (next, old) => { if (next > old) pulse.value++; });
</script>
<template>
  <button data-guide="tip-jar" class="tip-jar" :class="{ ready: amount > 0 }" :data-fill-stage="stage" :aria-label="visited ? `View ${Math.round(amount)} coins in your friend's tip jar` : `Open tip jar · ${Math.round(amount)} coins`" @click="open = true">
    <span :key="pulse" class="tip-coin-drop" :class="{ falling: pulse > 0 }" aria-hidden="true">●</span>
    <img class="tip-jar-art" :src="jarImage" width="64" height="64" alt="" aria-hidden="true" draggable="false">
  </button>
  <ModalDialog v-if="open" :title="visited ? 'Your friend’s tip jar' : 'Tip jar'" eyebrow="TIPS" width="420px" :closable="!collecting && !game.stealingTips" @close="open = false">
    <div class="tip-jar-summary"><img :src="jarImage" width="88" height="88" alt="" /><div><b>{{ Math.floor(amount) }} coins</b><small>Capacity: {{ capacity }} coins</small></div></div>
    <p v-if="!visited">Tips accumulate for up to {{ game.tipJarHours.toFixed(1) }} hours or until the jar is full. Collect them here to add them to your balance.</p>
    <p>Visitors can steal up to 5%. At least 30% of deposited tips stay protected. One attempt per player per day, 10 attempts total.</p>
    <template v-if="visited"><p>{{ game.visitedFriend?.tips?.attemptsLeft ?? 0 }} attempts left today. Empty or protected jars also use an attempt.</p><p v-if="game.visitedFriend?.tips?.attemptedToday">You have already tried this jar today.</p><UiButton variant="solid" block :disabled="unavailable" @click="steal">{{ game.stealingTips ? 'Taking tips…' : 'Steal tips' }}</UiButton></template>
    <UiButton v-else variant="solid" block data-guide="tip-collect" :disabled="unavailable || collecting" @click="collect">{{ collecting ? 'Collecting…' : 'Collect' }}</UiButton>
  </ModalDialog>
</template>
<style scoped>
.tip-jar-summary {display:flex;align-items:center;gap:18px;margin-bottom:16px;}.tip-jar-summary img{object-fit:contain;flex:none;}.tip-jar-summary b{display:block;font-size:22px;color:#f4ce83;}.tip-jar-summary small{display:block;margin-top:6px;color:#aebdce;}
.tip-jar { position: absolute; z-index: 8; left: auto; right: 2px; top: calc(var(--glass-y, 58%) - 16px); width: 64px; min-height: 84px; transform: translateY(-50%); display: grid; justify-items: center; align-content: end; gap: 8px; padding: 0; border: 0; background: transparent; color: #f2d8a0; cursor: pointer; }
.mobile-modular .tip-jar { left:var(--jar-x); right:auto; top:calc(var(--jar-base) - var(--jar-size)); width:var(--jar-size); min-height:var(--jar-size); transform:translateX(-50%); }
.mobile-modular .tip-jar-art { width:var(--jar-size); height:var(--jar-size); }
.tip-jar:disabled { cursor: default; opacity: .85; }
.tip-jar-art { display: block; width: 64px; height: 64px; object-fit: contain; pointer-events: none; filter: drop-shadow(0 3px 3px #0008); }
.ready .tip-jar-art { filter: drop-shadow(0 0 5px #ffcc6655) drop-shadow(0 3px 3px #0008); }
.tip-jar:focus-visible { outline: 2px solid #f4c76b; outline-offset: 3px; border-radius: 12px; }
.tip-coin-drop { position: absolute; top: -9px; color: #e9bd53; opacity: 0; }
.tip-coin-drop.falling { animation: jar-coin .8s ease-in both; }
@keyframes jar-coin { 0% { opacity: 1; transform: translateY(-40px) rotateY(0); } 80% { opacity: 1; } 100% { opacity: 0; transform: translateY(50px) rotateY(360deg); } }
@media (prefers-reduced-motion: reduce) { .tip-coin-drop.falling { animation: none; } }
</style>
