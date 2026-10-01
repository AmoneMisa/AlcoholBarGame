<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from 'vue';
import { CRYSTAL_EXCHANGE_BUNDLES, STAR_CRYSTAL_PACKS } from '../../domain/economy';
import { useGameStore } from '../../stores/game';
import UiIcon from '../ui/UiIcon.vue';
import PopoverPanel from '../ui/PopoverPanel.vue';
import { musicOn, musicVolume, sfxOn, sfxVolume, speechOn, speechVolume } from '../../audio/index';
defineEmits<{ design:[] }>();

const game = useGameStore();
const exchangeOpen = ref(false);
const volumeOpen = ref(false);
const percent = (value: number) => `${Math.round(value * 100)}%`;
// Dragging a slider up from zero also turns that channel back on.
function setVolume(channel: 'music' | 'sfx' | 'speech', event: Event) {
  const value = Number((event.target as HTMLInputElement).value) / 100;
  if (channel === 'music') { musicVolume.value = value; if (value > 0) musicOn.value = true; }
  else if (channel === 'sfx') { sfxVolume.value = value; if (value > 0) sfxOn.value = true; }
  else { speechVolume.value = value; if (value > 0) speechOn.value = true; }
}
const soundSilent = computed(() => (!musicOn.value || musicVolume.value === 0) && (!sfxOn.value || sfxVolume.value === 0) && (!speechOn.value || speechVolume.value === 0));
const soundSummary = computed(() => soundSilent.value ? 'Muted' : [musicOn.value && musicVolume.value > 0 && 'Music', sfxOn.value && sfxVolume.value > 0 && 'FX', speechOn.value && speechVolume.value > 0 && 'Voice'].filter(Boolean).join(' · '));
const xpPercent = computed(() => game.xpProgress.percent);
function exchange(crystals: number) {
  if (game.exchangeCrystals(crystals)) exchangeOpen.value = false;
}
async function buyPack(packId: string) {
  if (await game.buyCrystalPack(packId)) exchangeOpen.value = false;
}
let calendarTimer: ReturnType<typeof setInterval>;
// Other screens pin content just below the HUD (the Design preview), so its height is published as --hud-h.
const hud = ref<HTMLElement>();
const hudObserver = typeof ResizeObserver === 'undefined' ? undefined : new ResizeObserver(() => {
  if (hud.value) document.documentElement.style.setProperty('--hud-h', `${Math.round(hud.value.getBoundingClientRect().height)}px`);
});
onMounted(() => {
  if (hud.value) hudObserver?.observe(hud.value);
  calendarTimer = setInterval(game.refreshDailyGift, 60_000);
  window.addEventListener('focus', game.refreshDailyGift);
  document.addEventListener('visibilitychange', game.refreshDailyGift);
});
onUnmounted(() => {
  hudObserver?.disconnect();
  clearInterval(calendarTimer);
  window.removeEventListener('focus', game.refreshDailyGift);
  document.removeEventListener('visibilitychange', game.refreshDailyGift);
});
</script>

<template>
  <header ref="hud" class="top-hud">
    <div class="venue-card">
      <div class="venue-mark"><UiIcon name="glass" /></div>
      <div><small>YOUR BAR · {{ game.region.name }}<em v-if="game.mode !== 'online'" class="sync-badge" :class="game.mode" :title="game.mode === 'offline' ? 'No connection to the game server: progress is saved on this device only and is not added to your account.' : 'Connecting to your account…'">{{ game.mode === 'offline' ? 'Offline practice' : 'Connecting…' }}</em></small><b>{{ game.decor.name }}</b><div class="xp-line"><span :style="{ width: xpPercent + '%' }"></span></div></div>
      <em>LV. {{ game.level }}</em>
    </div>
    <div class="hud-resources">
      <div><UiIcon name="coin" /><span><small>COINS</small><b>{{ game.money.toLocaleString('en-US', { maximumFractionDigits: 2 }) }}</b></span></div>
      <div class="crystal-resource exchange-resource">
        <button class="exchange-open" type="button" :aria-expanded="exchangeOpen" aria-label="Convert crystals to coins" @click="exchangeOpen = !exchangeOpen"><UiIcon name="crystal" /><span><small>CRYSTALS</small><b>{{ game.crystals.toLocaleString('en-US') }}</b></span></button>
        <PopoverPanel v-if="exchangeOpen" class="currency-exchange" eyebrow="CRYSTALS" title="Get and use crystals" close-label="Close exchange" @close="exchangeOpen = false">
          <h4 class="crystal-shop-title">Buy with Telegram Stars</h4>
          <button v-for="pack in STAR_CRYSTAL_PACKS.filter((item) => !item.once || game.starterPackAvailable)" :key="pack.id" type="button" class="star-pack" :disabled="game.buyingCrystals" @click="buyPack(pack.id)"><span><UiIcon name="crystal" /><b>{{ pack.crystals.toLocaleString('en-US') }}</b></span><i>→</i><span><b>{{ pack.stars }}</b> ⭐</span><em v-if="pack.once">One-time offer</em></button>
          <h4 class="crystal-shop-title">Exchange for coins</h4>
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
          <div class="volume-row" :class="{ off: !speechOn }">
            <span id="volume-speech"><UiIcon name="chat" /> English voice</span>
            <input type="range" min="0" max="100" step="5" aria-labelledby="volume-speech" :value="Math.round(speechVolume * 100)" :style="{ '--fill': percent(speechVolume) }" :aria-valuetext="speechOn ? percent(speechVolume) : 'Muted'" @input="setVolume('speech', $event)" />
            <output>{{ speechOn ? percent(speechVolume) : 'Off' }}</output>
            <button type="button" :aria-pressed="!speechOn" aria-label="Mute English voice" @click="speechOn = !speechOn">{{ speechOn ? 'Mute' : 'Unmute' }}</button>
          </div>
        </PopoverPanel>
      </div>
    </div>
    <div class="shift-card"><small>LIVE SERVICE</small><b>{{ game.hasCustomer ? game.orderCountdown : game.nextCustomerCountdown }}</b><span>{{ game.hasCustomer ? 'Order time' : 'Next arrival' }}</span></div>
  </header>
</template>
