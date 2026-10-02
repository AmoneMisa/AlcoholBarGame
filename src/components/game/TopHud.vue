<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref, watch } from 'vue';
import { CRYSTAL_EXCHANGE_BUNDLES, STAR_CRYSTAL_PACKS } from '../../domain/economy';
import { useGameStore } from '../../stores/game';
import UiIcon from '../ui/UiIcon.vue';
import PopoverPanel from '../ui/PopoverPanel.vue';
import UiButton from '../ui/UiButton.vue';
import { MAX_STAFF, MAX_STAFF_LEVEL, STAFF_PROFILES, STAFF_UNLOCK_LEVELS, hireCost, teamShare, upgradeCost } from '../../domain/staff';
defineEmits<{ design:[]; goto:[view: string] }>();

const game = useGameStore();
const exchangeOpen = ref(false);
const staffOpen = ref(false);
const slots = computed(() => Array.from({ length: MAX_STAFF }, (_, index) => ({ index, profile: STAFF_PROFILES[index]!, unlockAt: STAFF_UNLOCK_LEVELS[index]!, member: game.staff[index], open: game.level >= STAFF_UNLOCK_LEVELS[index]! })));
// Why a hire or training button is off, said in words under the row.
const staffReason = (slot: { index: number; member?: { level: number }; open: boolean }) => {
  if (slot.member) return slot.member.level >= MAX_STAFF_LEVEL ? '' : game.money < upgradeCost(slot.index, slot.member.level) ? `Not enough coins: training costs ${upgradeCost(slot.index, slot.member.level)}, you have ${Math.floor(game.money)}.` : '';
  if (!slot.open || slot.index !== game.staff.length) return '';
  return game.money < hireCost(slot.index) ? `Not enough coins: hiring costs ${hireCost(slot.index)}, you have ${Math.floor(game.money)}.` : '';
};
const teamPercent = computed(() => Math.round(teamShare(game.staff) * 100));
// Only one header panel is open at a time, so they never pile up on top of each other.
const panels = { exchange: exchangeOpen, staff: staffOpen };
for (const [name, flag] of Object.entries(panels)) watch(flag, (open) => { if (open) for (const [other, ref] of Object.entries(panels)) if (other !== name) ref.value = false; });
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
      <button type="button" class="venue-mark profile-open" data-guide="profile" aria-label="Open your character" title="Your character" @click="$emit('goto', 'character')"><UiIcon name="glass" /></button>
      <div><small>YOUR BAR · {{ game.region.name }}<em v-if="game.mode !== 'online'" class="sync-badge" :class="game.mode" :title="game.mode === 'offline' ? 'No connection to the game server: progress is saved on this device only and is not added to your account.' : 'Connecting to your account…'">{{ game.mode === 'offline' ? 'Offline practice' : 'Connecting…' }}</em></small><button type="button" class="venue-name" aria-label="Open your bar: switch bar, cities and design" title="Your bar: switch, cities, design" @click="$emit('goto', 'bar')"><b>{{ game.decor.name }}</b><UiIcon name="chevron-down" /><i v-if="game.cosmeticRouletteAvailable" class="venue-dot" title="A free style spin is waiting in Design" aria-label="A free style spin is waiting in Design" /></button><div class="xp-line"><span :style="{ width: xpPercent + '%' }"></span></div></div>
      <em>LV. {{ game.level }}</em>
    </div>
    <div class="hud-resources">
      <div><UiIcon name="coin" /><span><small>COINS</small><b>{{ game.money.toLocaleString('en-US', { maximumFractionDigits: 2 }) }}</b></span></div>
      <div class="crystal-resource exchange-resource">
        <button class="exchange-open" type="button" :aria-expanded="exchangeOpen" aria-label="Convert crystals to coins" @click="exchangeOpen = !exchangeOpen"><UiIcon name="crystal" /><span><small>CRYSTALS</small><b>{{ game.crystals.toLocaleString('en-US') }}</b></span></button>
        <PopoverPanel v-if="exchangeOpen" class="currency-exchange" eyebrow="CRYSTALS" title="Get and use crystals" close-label="Close exchange" @close="exchangeOpen = false">
          <h4 class="crystal-shop-title">Buy with Telegram Stars</h4>
          <button v-for="pack in STAR_CRYSTAL_PACKS.filter((item) => !item.once || game.starterPackAvailable)" :key="pack.id" type="button" class="star-pack" :disabled="game.buyingCrystals" @click="buyPack(pack.id)"><span><UiIcon name="crystal" /><b>{{ pack.crystals.toLocaleString('en-US') }}</b></span><i><UiIcon name="arrow-right" /></i><span><b>{{ pack.stars }}</b> <UiIcon class="inline-icon" name="star" /></span><em v-if="pack.once">One-time offer</em></button>
          <h4 class="crystal-shop-title">Exchange for coins</h4>
          <p>This exchange only works from crystals to coins and cannot be reversed.</p>
          <button v-for="bundle in CRYSTAL_EXCHANGE_BUNDLES" :key="bundle.crystals" type="button" :disabled="game.crystals < bundle.crystals" @click="exchange(bundle.crystals)"><span><UiIcon name="crystal" /><b>{{ bundle.crystals }}</b></span><i><UiIcon name="arrow-right" /></i><span><UiIcon name="coin" /><b>{{ bundle.coins.toLocaleString('en-US') }}</b></span></button>
        </PopoverPanel>
      </div>
      <div v-if="game.level >= STAFF_UNLOCK_LEVELS[0]!" class="staff-resource">
        <button class="staff-open" type="button" :aria-expanded="staffOpen" :aria-label="`Servers: ${game.staff.length} of ${MAX_STAFF} hired`" @click="staffOpen = !staffOpen"><span class="staff-icons"><i v-for="slot in slots" :key="slot.index" :class="{ hired: !!slot.member, locked: !slot.open }"><UiIcon name="server" /></i></span><span><small>SERVERS</small><b>{{ game.staff.length ? `${teamPercent}% of you` : 'Hire' }}</b></span></button>
        <PopoverPanel v-if="staffOpen" class="staff-panel" padded eyebrow="SERVERS" :title="`Your team in ${game.region.name}`" close-label="Close servers" @close="staffOpen = false">
          <p>Every bar has its own servers. They work for you while you are away (for up to 24 hours at a time) and earn up to {{ Math.round(MAX_STAFF * 21.25) }}% of what you would earn serving alone with all four fully trained. They never bring crystals or tips.</p>
          <article v-for="slot in slots" :key="slot.index" class="staff-row">
            <span class="staff-face" :class="{ hired: !!slot.member }"><UiIcon name="server" /></span>
            <span class="staff-text"><b>{{ slot.profile.name }} · {{ slot.profile.role }}</b><small v-if="slot.member">Level {{ slot.member.level }} / {{ MAX_STAFF_LEVEL }}</small><small v-else-if="slot.open">{{ slot.profile.about }}</small><small v-else>Opens at bar level {{ slot.unlockAt }}</small></span>
            <UiButton v-if="slot.member" size="sm" variant="primary" :disabled="slot.member.level >= MAX_STAFF_LEVEL" :reason="staffReason(slot)" @click="game.upgradeStaff(slot.index)">{{ slot.member.level >= MAX_STAFF_LEVEL ? 'Max' : `Train ${upgradeCost(slot.index, slot.member.level)}` }}</UiButton>
            <UiButton v-else-if="slot.open && slot.index === game.staff.length" size="sm" variant="primary" :reason="staffReason(slot)" @click="game.hireStaff()">Hire {{ hireCost(slot.index) }}</UiButton>
          </article>
        </PopoverPanel>
      </div>
      <button class="daily-hud-gift events-hud" :class="{ ready: game.dailyGiftAvailable }" type="button" aria-label="Events and login streak" @click="$emit('goto', 'events')"><UiIcon name="gift" /><span><small>EVENTS</small><b>{{ game.dailyGiftAvailable ? 'Claim' : game.economy.event || game.barEvent ? 'Live' : `Day ${game.loginStreak}` }}</b></span></button>
    </div>
    <div class="shift-card"><small>LIVE SERVICE</small><b>{{ game.hasCustomer ? game.orderCountdown : game.nextCustomerCountdown }}</b><span>{{ game.hasCustomer ? 'Order time' : 'Next arrival' }}</span></div>
  </header>
</template>
