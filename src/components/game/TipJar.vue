<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { tipJarStage } from '../../domain/tipJarVisual';
import { useGameStore } from '../../stores/game';
const game = useGameStore();
const props = defineProps<{ visited?: boolean }>();
const amount = computed(() => props.visited ? game.visitedFriend?.tips?.amount ?? 0 : game.tipJar);
const capacity = computed(() => props.visited ? game.visitedFriend?.tips?.capacity ?? 60 : game.tipJarCapacity);
const stage = computed(() => tipJarStage(amount.value, capacity.value));
const jarImage = computed(() => `${import.meta.env.BASE_URL}assets/ui/tip-jar/stage-${stage.value}.webp`);
const unavailable = computed(() => props.visited ? game.stealingTips || !game.visitedFriend?.tips || game.visitedFriend.tips.attemptedToday || game.visitedFriend.tips.attemptsLeft <= 0 : amount.value <= 0);
const pulse = ref(0);
watch(amount, (next, old) => { if (next > old) pulse.value++; });
</script>
<template>
  <button data-guide="tip-jar" class="tip-jar" :class="{ ready: amount > 0 }" :data-fill-stage="stage" :disabled="unavailable" :title="visited ? 'Take up to 5% · 30% protected · once per player per day' : `${Math.round(amount).toString()} / ${capacity} coins · accumulates for up to 12 hours · collect manually`" :aria-label="visited ? `Take a small share of ${Math.round(amount).toString()} coins in tips` : `Collect ${game.tipJar} coins in tips`" @click="visited ? game.stealVisitedTips() : game.collectTips()">
    <span :key="pulse" class="tip-coin-drop" :class="{ falling: pulse > 0 }" aria-hidden="true">●</span>
    <img class="tip-jar-art" :src="jarImage" width="64" height="64" alt="" aria-hidden="true" draggable="false">
  </button>
</template>
<style scoped>
.tip-jar { position: absolute; z-index: 8; left: auto; right: 2px; top: calc(var(--glass-y, 58%) - 16px); width: 64px; min-height: 84px; transform: translateY(-50%); display: grid; justify-items: center; align-content: end; gap: 8px; padding: 0; border: 0; background: transparent; color: #f2d8a0; cursor: pointer; }
.tip-jar:disabled { cursor: default; opacity: .85; }
.tip-jar-art { display: block; width: 64px; height: 64px; object-fit: contain; pointer-events: none; filter: drop-shadow(0 3px 3px #0008); }
.ready .tip-jar-art { filter: drop-shadow(0 0 5px #ffcc6655) drop-shadow(0 3px 3px #0008); }
.tip-jar:focus-visible { outline: 2px solid #f4c76b; outline-offset: 3px; border-radius: 12px; }
.tip-coin-drop { position: absolute; top: -9px; color: #e9bd53; opacity: 0; }
.tip-coin-drop.falling { animation: jar-coin .8s ease-in both; }
@keyframes jar-coin { 0% { opacity: 1; transform: translateY(-40px) rotateY(0); } 80% { opacity: 1; } 100% { opacity: 0; transform: translateY(50px) rotateY(360deg); } }
@media (prefers-reduced-motion: reduce) { .tip-coin-drop.falling { animation: none; } }
</style>
