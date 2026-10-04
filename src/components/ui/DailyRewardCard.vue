<script setup lang="ts">
import { computed, onUnmounted } from 'vue';
import { useGameStore } from '../../stores/game';
import LoginRewardTrack from './LoginRewardTrack.vue';
import RewardList from './RewardList.vue';

const game = useGameStore();
const cycleDay = computed(() => ((game.dailyGiftAvailable ? game.upcomingLoginDay : game.loginStreak) - 1) % 7 + 1);
const justClaimed = computed(() => game.rewardReport?.title === 'Daily reward' ? game.rewardReport : undefined);
defineExpose({ cycleDay });
onUnmounted(() => { if (game.rewardReport?.title === 'Daily reward') game.dismissRewards(); });
</script>

<template>
  <div class="daily-popup">
    <LoginRewardTrack />
    <div v-if="justClaimed" class="daily-result">
      <b>You received</b>
      <RewardList :lines="justClaimed.lines" />
    </div>
  </div>
</template>
