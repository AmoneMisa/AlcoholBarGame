<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from 'vue';
import { CRYSTAL_EXCHANGE_BUNDLES } from '../../domain/economy';
import { useGameStore } from '../../stores/game';
import UiIcon from '../ui/UiIcon.vue';
import PopoverPanel from '../ui/PopoverPanel.vue';
import { musicOn, musicVolume, sfxOn, sfxVolume } from '../../audio/index';
defineEmits<{ design:[] }>();

const game = useGameStore();
const exchangeOpen = ref(false);
const volumeOpen = ref(false);
const percent = (value: number) => `${Math.round(value * 100)}%`;
// Dragging a slider up from zero also turns that channel back on.
function setVolume(channel: 'music' | 'sfx', event: Event) {
  const value = Number((event.target as HTMLInputElement).value) / 100;
  if (channel === 'music') { musicVolume.value = value; if (value > 0) musicOn.value = true; }
  else { sfxVolume.value = value; if (value > 0) sfxOn.value = true; }
}
const soundSilent = computed(() => (!musicOn.value || musicVolume.value === 0) && (!sfxOn.value || sfxVolume.value === 0));
const soundSummary = computed(() => soundSilent.value ? 'Muted' : [musicOn.value && musicVolume.value > 0 && 'Music', sfxOn.value && sfxVolume.value > 0 && 'FX'].filter(Boolean).join(' · '));
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
        <PopoverPanel v-if="exchangeOpen" class="currency-exchange" eyebrow="CRYSTAL EXCHANGE" title="Turn crystals into coins" close-label="Close exchange" @close="exchangeOpen = false">
          <p>This exchange only works from crystals to coins and cannot be reversed.</p>
          <button v-for="bundle in CRYSTAL_EXCHANGE_BUNDLES" :key="bundle.crystals" type="button" :disabled="game.crystals < bundle.crystals" @click="exchange(bundle.crystals)"><span><UiIcon name="crystal" /><b>{{ bundle.crystals }}</b></span><i>→</i><span><UiIcon name="coin" /><b>{{ bundle.coins.toLocaleString('en-US') }}</b></span></button>
        </PopoverPanel>
      </div>
      <button class="daily-hud-gift" type="button" :disabled="!game.dailyGiftAvailable" @click="game.claimDailyGift()"><UiIcon name="gift" /><span><small>LOGIN STREAK {{ game.upcomingLoginDay }}</small><b>{{ game.dailyGiftAvailable ? `+${game.dailyCoinReward}${game.dailyCrystalReward ? ` · ◆${game.dailyCrystalReward}` : ''}` : 'Claimed' }}</b></span></button>
      <div class="sound-resource">
        <button class="sound-open" type="button" :class="{ off: soundSilent }" :aria-expanded="volumeOpen" :aria-label="`Sound: ${soundSummary}. Open volume settings`" @click="volumeOpen = !volumeOpen"><UiIcon :name="soundSilent ? 'speaker-off' : 'speaker'" /><span><small>SOUND</small><b>{{ soundSummary }}</b></span></button>
        <PopoverPanel v-if="volumeOpen" class="volume-panel" eyebrow="SOUND" title="Volume" close-label="Close volume settings" @close="volumeOpen = false">
          <div class="volume-row" :class="{ off: !musicOn }">
            <span id="volume-music"><UiIcon name="music" /> Music</span>
            <input type="range" min="0" max="100" step="5" aria-labelledby="volume-music" :value="Math.round(musicVolume * 100)" :style="{ '--fill': percent(musicVolume) }" :aria-valuetext="musicOn ? percent(musicVolume) : 'Muted'" @input="setVolume('music', $event)" />
            <output>{{ musicOn ? percent(musicVolume) : 'Off' }}</output>
            <button type="button" :aria-pressed="!musicOn" aria-label="Mute music" @click="musicOn = !musicOn">{{ musicOn ? 'Mute' : 'Unmute' }}</button>
          </div>
          <div class="volume-row" :class="{ off: !sfxOn }">
            <span id="volume-sfx"><UiIcon name="speaker" /> Effects</span>
            <input type="range" min="0" max="100" step="5" aria-labelledby="volume-sfx" :value="Math.round(sfxVolume * 100)" :style="{ '--fill': percent(sfxVolume) }" :aria-valuetext="sfxOn ? percent(sfxVolume) : 'Muted'" @input="setVolume('sfx', $event)" />
            <output>{{ sfxOn ? percent(sfxVolume) : 'Off' }}</output>
            <button type="button" :aria-pressed="!sfxOn" aria-label="Mute sound effects" @click="sfxOn = !sfxOn">{{ sfxOn ? 'Mute' : 'Unmute' }}</button>
          </div>
        </PopoverPanel>
      </div>
    </div>
    <div class="shift-card"><small>LIVE SERVICE</small><b>{{ game.hasCustomer ? game.orderCountdown : game.nextCustomerCountdown }}</b><span>{{ game.hasCustomer ? 'Order time' : 'Next arrival' }}</span></div>
  </header>
</template>
