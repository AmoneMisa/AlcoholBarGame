<script setup lang="ts">
import { onUnmounted, watch } from 'vue';
import { useGameStore } from '../../stores/game';
import CloseButton from './CloseButton.vue';
import RewardList from './RewardList.vue';

// Tells the player exactly what the last action gave: coins, tips, crystals, XP, recipes, gifts.
// It stays until closed or tapped away, or for a few seconds when nothing else needs reading.
const game = useGameStore();
let timer: ReturnType<typeof setTimeout> | undefined;
watch(() => game.rewardReport?.id, (id) => {
  clearTimeout(timer);
  if (id) timer = setTimeout(game.dismissRewards, 9000);
});
onUnmounted(() => clearTimeout(timer));
</script>

<template>
  <aside v-if="game.rewardReport && !game.dailyOpen" :key="game.rewardReport.id" class="reward-popup" role="status" aria-live="polite">
    <header><b>{{ game.rewardReport.title }}</b><CloseButton label="Close reward summary" size="sm" @click="game.dismissRewards()" /></header>
    <RewardList :lines="game.rewardReport.lines" />
  </aside>
</template>

<style>
.reward-popup { position: fixed; z-index: 140; left: 50%; bottom: calc(96px + env(safe-area-inset-bottom, 0px)); display: grid; gap: 8px; width: min(340px, calc(100vw - 24px)); padding: 10px 12px 12px; border: 1px solid #d2a24e; border-radius: 14px; background: linear-gradient(150deg, #1b2740f7, #0b1320f7 72%); box-shadow: 0 18px 50px #000d; transform: translateX(-50%); animation: reward-in .24s ease-out; }
.reward-popup > header { display: flex; align-items: center; justify-content: space-between; gap: 10px; }
.reward-popup > header b { color: var(--gold, #e8b85a); font: 700 15px Georgia, serif; }
@keyframes reward-in { from { opacity: 0; transform: translate(-50%, 14px); } }
</style>
