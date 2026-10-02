<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref, watch } from 'vue';
import { CRYSTAL_EXCHANGE_BUNDLES } from '../../domain/economy';
import { useGameStore } from '../../stores/game';
import UiIcon from '../ui/UiIcon.vue';
import PopoverPanel from '../ui/PopoverPanel.vue';
import UiButton from '../ui/UiButton.vue';
import CharacterModel from '../characters/CharacterModel.vue';
import ModalDialog from '../ui/ModalDialog.vue';
import CityEvent from './CityEvent.vue';
import Glyph from '../ui/Glyph.vue';
import EventsPopup from '../ui/EventsPopup.vue';
import CrystalShopPopup from '../ui/CrystalShopPopup.vue';
import { MAX_STAFF, MAX_STAFF_LEVEL, STAFF_PROFILES, STAFF_UNLOCK_LEVELS, hireCost, teamShare, upgradeCost } from '../../domain/staff';
defineEmits<{ design:[]; goto:[view: string]; profile:[] }>();

const game = useGameStore();
const exchangeOpen = ref(false);
const shopOpen = ref(false);
const staffOpen = ref(false);
const eventsOpen = ref(false);
const perksOpen = ref(false);
const slots = computed(() => Array.from({ length: MAX_STAFF }, (_, index) => ({ index, profile: STAFF_PROFILES[index]!, unlockAt: STAFF_UNLOCK_LEVELS[index]!, member: game.staff[index], open: game.level >= STAFF_UNLOCK_LEVELS[index]! })));
// Why a hire or training button is off, said in words under the row.
const staffReason = (slot: { index: number; member?: { level: number }; open: boolean }) => {
  if (slot.member) return slot.member.level >= MAX_STAFF_LEVEL ? '' : game.money < upgradeCost(slot.index, slot.member.level) ? `Not enough coins: training costs ${upgradeCost(slot.index, slot.member.level)}, you have ${Math.floor(game.money)}.` : '';
  if (!slot.open || slot.index !== game.staff.length) return '';
  return game.money < hireCost(slot.index) ? `Not enough coins: hiring costs ${hireCost(slot.index)}, you have ${Math.floor(game.money)}.` : '';
};
const teamPercent = computed(() => Math.round(teamShare(game.staff) * 100));
// Only one header panel is open at a time, so they never pile up on top of each other.
const panels = { shop: shopOpen, exchange: exchangeOpen, staff: staffOpen, perks: perksOpen, events: eventsOpen };
for (const [name, flag] of Object.entries(panels)) watch(flag, (open) => { if (open) for (const [other, ref] of Object.entries(panels)) if (other !== name) ref.value = false; });
function exchange(crystals: number) {
  if (game.exchangeCrystals(crystals)) exchangeOpen.value = false;
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
      <button type="button" class="hud-avatar" data-guide="profile" aria-label="Character information and settings" @click="$emit('profile')"><CharacterModel role="bartender" :character-id="game.decor.bartenderCharacter ?? 'noa'" :outfit="game.decor.bartender" :face-style="game.decor.face" :hair-style="game.decor.hairStyle" :hair-color="game.decor.hairColor" /></button>
      <button type="button" class="venue-name" aria-label="Open your bar" @click="$emit('goto', 'bar')"><em>Lv. {{ game.level }}</em><b>{{ game.decor.name }}</b></button>
    </div>
    <div class="hud-resources">
      <div class="coin-resource exchange-resource"><button class="exchange-open" type="button" :aria-expanded="exchangeOpen" data-guide="coins" aria-label="Exchange crystals for coins" @click="exchangeOpen = !exchangeOpen"><UiIcon name="coin" /><b>{{ game.money.toLocaleString('en-US', { maximumFractionDigits: 2 }) }}</b></button>
        <PopoverPanel v-if="exchangeOpen" class="currency-exchange" eyebrow="COINS" title="Exchange crystals for coins" close-label="Close exchange" @close="exchangeOpen = false">

          <p>This exchange only works from crystals to coins and cannot be reversed.</p>
          <button v-for="bundle in CRYSTAL_EXCHANGE_BUNDLES" :key="bundle.crystals" type="button" :disabled="game.crystals < bundle.crystals" @click="exchange(bundle.crystals)"><span><UiIcon name="crystal" /><b>{{ bundle.crystals }}</b></span><i><UiIcon name="arrow-right" /></i><span><UiIcon name="coin" /><b>{{ bundle.coins.toLocaleString('en-US') }}</b></span></button>
        </PopoverPanel>
      </div>
      <div class="crystal-resource"><button class="exchange-open" type="button" :aria-expanded="shopOpen" data-guide="crystals" aria-label="Buy crystals" @click="shopOpen = true"><UiIcon name="crystal" /><b>{{ game.crystals.toLocaleString('en-US') }}</b></button></div>
      <div class="prestige-resource" :aria-label="`${game.popularity} prestige`" title="Prestige"><UiIcon name="star" /><b>{{ game.popularity }}</b></div>
      <div v-if="game.level >= STAFF_UNLOCK_LEVELS[0]!" class="staff-resource">
        <button class="staff-open" type="button" :aria-expanded="staffOpen" :aria-label="`Servers: ${game.staff.length} of ${MAX_STAFF} hired`" @click="staffOpen = !staffOpen"><UiIcon name="server" /></button>
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
    </div>
    <button class="hud-events" data-guide="events" type="button" :aria-label="`Events · ${game.availableEvents.badge} available rewards and free draws`" title="Events" :aria-expanded="eventsOpen" @click="eventsOpen = true"><UiIcon name="gift" /><span>Events</span><b v-if="game.availableEvents.badge" class="events-badge">{{ game.availableEvents.badge }}</b></button>
    <button class="hud-bar-info" type="button" data-guide="rules-button" aria-label="Bar info" :aria-expanded="perksOpen" @click="perksOpen = true">Bar info</button>
    <ModalDialog v-if="perksOpen" eyebrow="YOUR BAR" :title="`Bar info · ${game.region.name}`" @close="perksOpen = false">
      <CityEvent />
      <p class="rules-note">Explain these rules politely to guests. Inspectors count every rule you break{{ game.ruleViolations ? ` (so far: ${game.ruleViolations})` : '' }}.</p>
      <article v-for="rule in game.houseRules" :key="rule.id" class="rule-row"><span class="rule-icon"><Glyph :g="rule.icon" /></span><span><b>{{ rule.title }}</b><small>{{ rule.text }}</small></span></article>
    </ModalDialog>
    <EventsPopup v-if="eventsOpen" @close="eventsOpen = false" />
    <CrystalShopPopup v-if="shopOpen" @close="shopOpen = false" />
  </header>
</template>

<style scoped>
.top-hud { display:grid; align-items:center; gap:5px 10px; padding:7px 12px; min-height:52px; grid-template-columns:minmax(0,1fr) auto; }
.venue-card { display:flex; align-items:center; gap:7px; min-width:0; flex:1; padding:0; border:0; background:none; }
.hud-avatar { position:relative; flex:none; width:36px; height:36px; border-radius:50%; border:1px solid #b58b47; overflow:hidden; background:#24344a; padding:0; cursor:pointer; }
.hud-avatar :deep(.art-character) { position:absolute; width:64px; height:112px; top:0; left:50%; translate:-50% 0; transform:none; animation:none; }
.venue-name { display:flex; align-items:center; gap:6px; min-width:0; color:#f3e6c7; padding:0; }
.venue-name em { flex:none; font:700 12px system-ui; color:#dbb35e; }
.venue-name b { font-size:13px; overflow-wrap:anywhere; line-height:1.2; }
.hud-resources { display:flex; align-items:center; gap:10px; flex:none; padding:0; }
.hud-resources > div { padding:0; border:0; background:none; gap:3px; min-width:0; }
.hud-resources b { font:700 12px system-ui; font-variant-numeric:tabular-nums; }
.hud-resources :deep(.ui-icon) { width:16px; height:16px; }
.exchange-open { gap:3px; padding:0; }
.hud-bar-info { grid-column:1; grid-row:2; justify-self:start; display:flex; align-items:center; justify-content:center; height:24px; padding:0 9px; border:1px solid #b59a5c40; border-radius:7px; background:#ffffff06; color:#e6c78c; font:600 12px system-ui; white-space:nowrap; cursor:pointer; }
.hud-bar-info:hover { background:#ffffff0d; }
.hud-bar-info:focus-visible { outline:2px solid #f3d38b; outline-offset:2px; }
.hud-events,.daily-hud-gift,.staff-open { display:grid; place-items:center; flex:none; width:30px; height:30px; padding:0; border:1px solid #594b39; border-radius:10px; background:#1c2634; color:#e9c577; }
.daily-hud-gift.ready { border-color:#e8b457; }
@media(max-width:600px) { .top-hud { flex-wrap:wrap; column-gap:6px; padding:5px 8px; } .venue-card { flex:1; min-width:130px; } .hud-resources { gap:7px; } .venue-name b { font-size:12px; } }
@media(max-width:380px) { .hud-resources { order:3; width:100%; justify-content:flex-end; } }
</style>





