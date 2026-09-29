<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from 'vue';
import { CRYSTAL_EXCHANGE_BUNDLES } from '../../domain/economy';
import { useGameStore } from '../../stores/game';
import UiIcon from '../ui/UiIcon.vue';
defineEmits<{ design:[] }>();

const game = useGameStore();
const exchangeOpen = ref(false);
const xpPercent = computed(() => game.xpProgress.percent);
function exchange(crystals: number) {
  if (game.exchangeCrystals(crystals)) exchangeOpen.value = false;
}
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
      <div><small>YOUR BAR · {{ game.region.name }}<em v-if="game.mode !== 'online'" class="sync-badge" :class="game.mode" :title="game.mode === 'offline' ? 'No connection to the game server: progress is saved on this device only and is not added to your account.' : 'Connecting to your account…'">{{ game.mode === 'offline' ? 'Offline practice' : 'Connecting…' }}</em></small><b>{{ game.decor.name }}</b><div class="xp-line"><span :style="{ width: xpPercent + '%' }"></span></div></div>
      <em>LV. {{ game.level }}</em>
    </div>
    <div class="hud-resources">
      <div><UiIcon name="coin" /><span><small>COINS</small><b>{{ game.money.toLocaleString('en-US', { maximumFractionDigits: 2 }) }}</b></span></div>
      <div class="crystal-resource exchange-resource">
        <button class="exchange-open" type="button" :aria-expanded="exchangeOpen" aria-label="Convert crystals to coins" @click="exchangeOpen = !exchangeOpen"><UiIcon name="crystal" /><span><small>CRYSTALS</small><b>{{ game.crystals.toLocaleString('en-US') }}</b></span></button>
        <section v-if="exchangeOpen" class="currency-exchange" aria-label="Convert crystals to coins">
          <header><div><small>CRYSTAL EXCHANGE</small><b>Turn crystals into coins</b></div><button type="button" aria-label="Close exchange" @click="exchangeOpen = false">×</button></header>
          <p>This exchange only works from crystals to coins and cannot be reversed.</p>
          <button v-for="bundle in CRYSTAL_EXCHANGE_BUNDLES" :key="bundle.crystals" type="button" :disabled="game.crystals < bundle.crystals" @click="exchange(bundle.crystals)"><span><UiIcon name="crystal" /><b>{{ bundle.crystals }}</b></span><i>→</i><span><UiIcon name="coin" /><b>{{ bundle.coins.toLocaleString('en-US') }}</b></span></button>
        </section>
      </div>
      <button class="daily-hud-gift" type="button" :disabled="!game.dailyGiftAvailable" @click="game.claimDailyGift()"><UiIcon name="gift" /><span><small>LOGIN STREAK {{ game.upcomingLoginDay }}</small><b>{{ game.dailyGiftAvailable ? `+${game.dailyCoinReward}${game.dailyCrystalReward ? ` · ◆${game.dailyCrystalReward}` : ''}` : 'Claimed' }}</b></span></button>
    </div>
    <div class="shift-card"><small>LIVE SERVICE</small><b>{{ game.hasCustomer ? game.orderCountdown : game.nextCustomerCountdown }}</b><span>{{ game.hasCustomer ? 'Order time' : 'Next arrival' }}</span></div>
  </header>
</template>
