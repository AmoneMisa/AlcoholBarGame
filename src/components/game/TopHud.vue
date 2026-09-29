<script setup lang="ts">
import { computed, onMounted, onUnmounted } from 'vue';
import { useGameStore } from '../../stores/game';
import UiIcon from '../ui/UiIcon.vue';
defineEmits<{ design:[] }>();

const game = useGameStore();
const xpPercent = computed(() => game.xp % 60 / 60 * 100);
let calendarTimer: ReturnType<typeof setInterval>;
onMounted(() => {
  calendarTimer = setInterval(game.refreshDailyGift, 60_000);
  window.addEventListener('focus', game.refreshDailyGift);
  document.addEventListener('visibilitychange', game.refreshDailyGift);
});
onUnmounted(() => {
  clearInterval(calendarTimer);
  window.removeEventListener('focus', game.refreshDailyGift);
  document.removeEventListener('visibilitychange', game.refreshDailyGift);
});
</script>

<template>
  <header class="top-hud">
    <div class="venue-card">
      <div class="venue-mark"><UiIcon name="glass" /></div>
      <div><small>YOUR BAR · {{ game.region.name }}</small><b>{{ game.decor.name }}</b><div class="xp-line"><span :style="{ width: xpPercent + '%' }"></span></div></div>
      <em>LV. {{ game.level }}</em>
    </div>
    <div class="hud-resources">
      <div><UiIcon name="coin" /><span><small>COINS</small><b>{{ game.money.toLocaleString('en-US', { maximumFractionDigits: 2 }) }}</b></span></div>
      <button class="daily-hud-gift" type="button" :disabled="!game.dailyGiftAvailable" @click="game.claimDailyGift()"><UiIcon name="gift" /><span><small>LOGIN STREAK {{ game.upcomingLoginDay }}</small><b>{{ game.dailyGiftAvailable ? '+' + game.dailyCoinReward : 'Claimed' }}</b></span></button>
    </div>
    <div class="shift-card"><small>LIVE SERVICE</small><b>{{ game.hasCustomer ? game.orderCountdown : game.nextCustomerCountdown }}</b><span>{{ game.hasCustomer ? 'Order time' : 'Next arrival' }}</span></div>
    <button class="settings-button" type="button" aria-label="Customize and rename bar" @click="$emit('design')"><UiIcon name="brush" /></button>
  </header>
</template>
