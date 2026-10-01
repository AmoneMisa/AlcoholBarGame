<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from 'vue';
import { CRYSTAL_EXCHANGE_BUNDLES, STAR_CRYSTAL_PACKS } from '../../domain/economy';
import { useGameStore } from '../../stores/game';
import UiIcon from '../ui/UiIcon.vue';
import PopoverPanel from '../ui/PopoverPanel.vue';
import { MAX_STAFF, MAX_STAFF_LEVEL, STAFF_PROFILES, STAFF_UNLOCK_LEVELS, hireCost, teamShare, upgradeCost } from '../../domain/staff';
import { TRAINING_MODULES } from '../../domain/training';
import AcademyPanel from './AcademyPanel.vue';
import { musicOn, musicVolume, sfxOn, sfxVolume, speechOn, speechVolume, voiceMode } from '../../audio/index';
defineEmits<{ design:[]; goto:[view: string] }>();

const game = useGameStore();
const exchangeOpen = ref(false);
const staffOpen = ref(false);
const academyOpen = ref(false);
const lessonsLeft = computed(() => TRAINING_MODULES.length - game.training.done.length);
const startTour = () => window.dispatchEvent(new Event('barlingo:tour'));
const slots = computed(() => Array.from({ length: MAX_STAFF }, (_, index) => ({ index, profile: STAFF_PROFILES[index]!, unlockAt: STAFF_UNLOCK_LEVELS[index]!, member: game.staff[index], open: game.level >= STAFF_UNLOCK_LEVELS[index]! })));
const teamPercent = computed(() => Math.round(teamShare(game.staff) * 100));
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
      <div class="academy-resource">
        <button class="staff-open" type="button" :aria-expanded="academyOpen" aria-label="Open the training academy" @click="academyOpen = !academyOpen"><span class="staff-icons"><i class="hired">🎓</i></span><span><small>TRAINING</small><b>{{ lessonsLeft ? `${lessonsLeft} to do` : 'All done' }}</b></span></button>
        <AcademyPanel v-if="academyOpen" @close="academyOpen = false" @goto="(view) => $emit('goto', view)" />
      </div>
      <div class="staff-resource">
        <button class="staff-open" type="button" :aria-expanded="staffOpen" :aria-label="`Servers: ${game.staff.length} of ${MAX_STAFF} hired`" @click="staffOpen = !staffOpen"><span class="staff-icons"><i v-for="slot in slots" :key="slot.index" :class="{ hired: !!slot.member, locked: !slot.open }"><UiIcon name="server" /></i></span><span><small>SERVERS</small><b>{{ game.staff.length ? `${teamPercent}% of you` : 'Hire' }}</b></span></button>
        <PopoverPanel v-if="staffOpen" class="staff-panel" eyebrow="SERVERS" title="Your team" close-label="Close servers" @close="staffOpen = false">
          <p>Servers work for you while you are away and earn up to {{ Math.round(MAX_STAFF * 21.25) }}% of what you would earn serving alone with all four fully trained. They never bring crystals or tips.</p>
          <article v-for="slot in slots" :key="slot.index" class="staff-row">
            <span class="staff-face" :class="{ hired: !!slot.member }"><UiIcon name="server" /></span>
            <span class="staff-text"><b>{{ slot.profile.name }} · {{ slot.profile.role }}</b><small v-if="slot.member">Level {{ slot.member.level }} / {{ MAX_STAFF_LEVEL }}</small><small v-else-if="slot.open">{{ slot.profile.about }}</small><small v-else>Opens at bar level {{ slot.unlockAt }}</small></span>
            <button v-if="slot.member" type="button" :disabled="slot.member.level >= MAX_STAFF_LEVEL || game.money < upgradeCost(slot.index, slot.member.level)" @click="game.upgradeStaff(slot.index)">{{ slot.member.level >= MAX_STAFF_LEVEL ? 'Max' : `Train ${upgradeCost(slot.index, slot.member.level)}` }}</button>
            <button v-else-if="slot.open && slot.index === game.staff.length" type="button" :disabled="game.money < hireCost(slot.index)" @click="game.hireStaff()">Hire {{ hireCost(slot.index) }}</button>
          </article>
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
          <button type="button" class="how-to-play" @click="volumeOpen = false; startTour()">❔ How to play (replay the tour)</button>
          <div class="volume-row voice-mode">
            <span id="voice-mode"><UiIcon name="chat" /> Guest voices</span>
            <select aria-labelledby="voice-mode" v-model="voiceMode"><option value="murmur">Murmur</option><option value="speech">Read aloud</option><option value="off">Off</option></select>
          </div>
        </PopoverPanel>
      </div>
    </div>
    <div class="shift-card"><small>LIVE SERVICE</small><b>{{ game.hasCustomer ? game.orderCountdown : game.nextCustomerCountdown }}</b><span>{{ game.hasCustomer ? 'Order time' : 'Next arrival' }}</span></div>
  </header>
</template>
