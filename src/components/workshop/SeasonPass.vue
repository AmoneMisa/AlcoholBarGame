<script setup lang="ts">
import { computed, ref } from 'vue';
import { INTERIORS, interiorStyle, type InteriorId } from '../../data/cosmetics/bars';
import { COSMETICS } from '../../domain/cosmetics';
import { formatCountdown } from '../../domain/customerTiming';
import { CONSUMABLES, EQUIPMENT, describeReward } from '../../domain/loot';
import { PASS_LEVELS, PASS_LEVEL_POINTS, PASS_PREMIUM_PRICE, PASS_STYLES_LEVEL, passClaimKey, passRewards, themeStyleIds, type PassReward } from '../../domain/pass';
import { useGameStore } from '../../stores/game';
import CharacterModel from '../characters/CharacterModel.vue';
import StylePreview from '../game/StylePreview.vue';
import CrystalAmount from '../ui/CrystalAmount.vue';
import UiButton from '../ui/UiButton.vue';

// The season pass: a two-week track of twenty levels. Points come from normal play; the free track is for everyone,
// the premium track is bought once per pass. The last level gives the season's background and both bartenders' costumes.
const game = useGameStore();
const theme = computed(() => game.passTheme);
const rows = computed(() => passRewards(theme.value));
const level = computed(() => game.passLevelNow);
const inLevel = computed(() => level.value >= PASS_LEVELS ? PASS_LEVEL_POINTS : game.passPoints % PASS_LEVEL_POINTS);
const secondsLeft = computed(() => Math.max(0, Math.floor((game.passEnds - game.nowMs) / 1000)));
const daysLeft = computed(() => Math.ceil(secondsLeft.value / 86400));
const names = { consumable: (id: string) => CONSUMABLES.find((item) => item.id === id)?.name ?? id, equipment: (id: string) => EQUIPMENT.find((item) => item.id === id)?.name ?? id };
const interiorName = computed(() => INTERIORS.find((item) => item.id === theme.value.interior)?.name ?? '');
const label = (id: string) => COSMETICS.find((item) => item.id === id)?.label ?? id;
const styleIds = computed(() => themeStyleIds(theme.value));

function text(reward: PassReward): string {
  if (reward.kind === 'interior') return INTERIORS.find((item) => item.id === reward.id)?.name ?? reward.id;
  if (reward.kind === 'cosmetics') return reward.ids.map((id) => `${id.endsWith(':noa') ? 'Noa' : 'Leo'}: ${label(id)}`).join(' + ');
  return describeReward(reward, names);
}
const claimed = (track: 'free' | 'premium', lvl: number) => game.passClaimed.includes(passClaimKey(track, lvl));
const state = (track: 'free' | 'premium', lvl: number) => claimed(track, lvl) ? 'claimed' : level.value < lvl ? 'locked' : track === 'premium' && !game.passPremium ? 'premium' : 'ready';

const previewOpen = ref(false);
</script>

<template>
  <div class="pass">
    <header class="pass-hero">
      <div>
        <small>SEASON PASS · {{ daysLeft }} DAY{{ daysLeft === 1 ? '' : 'S' }} LEFT <span class="pass-timer">({{ formatCountdown(secondsLeft) }})</span></small>
        <h3>{{ theme.name }}</h3>
        <p>{{ theme.tagline }}</p>
      </div>
      <div class="pass-level" role="status">
        <b>Level {{ level }} / {{ PASS_LEVELS }}</b>
        <progress :value="inLevel" :max="PASS_LEVEL_POINTS"></progress>
        <small>{{ level >= PASS_LEVELS ? 'Pass complete' : `${PASS_LEVEL_POINTS - inLevel} points to level ${level + 1}` }} · points come from serving, lessons, VIPs, bottles and boxes</small>
      </div>
    </header>

    <section class="pass-prize" aria-label="Season prizes">
      <div class="pass-scene" :style="interiorStyle(theme.interior as InteriorId)">
        <CharacterModel role="bartender" character-id="noa" :outfit="theme.noa" />
        <CharacterModel role="bartender" character-id="leo" :outfit="theme.leo" />
      </div>
      <div class="pass-prize-text">
        <small>SEASON PRIZES</small>
        <b>Level {{ PASS_STYLES_LEVEL }}: the costumes</b>
        <span>Noa: {{ label(styleIds[0]!) }}</span>
        <span>Leo: {{ label(styleIds[1]!) }}</span>
        <b>Level {{ PASS_LEVELS }}: the background</b>
        <span>{{ interiorName }}</span>
        <UiButton size="sm" variant="secondary" @click="previewOpen = true">Preview the prizes</UiButton>
      </div>
      <div class="pass-premium">
        <b>{{ game.passPremium ? 'Premium track unlocked' : 'Premium track' }}</b>
        <small>Supplies for your bar, coins, boosters and prestige on every level, with a big pack at the end.</small>
        <UiButton v-if="!game.passPremium" variant="primary" :disabled="game.crystals < PASS_PREMIUM_PRICE" @click="game.buyPassPremium()">Unlock · <CrystalAmount :value="PASS_PREMIUM_PRICE" /></UiButton>
      </div>
    </section>

    <ol class="pass-track" aria-label="Pass rewards">
      <li v-for="row in rows" :key="row.level" :class="{ reached: level >= row.level, final: row.level === PASS_LEVELS || row.level === PASS_STYLES_LEVEL }">
        <span class="pass-num">{{ row.level }}</span>
        <div class="pass-cell free">
          <small>Free</small>
          <span>{{ row.free.map(text).join(' · ') }}</span>
          <UiButton size="sm" :variant="state('free', row.level) === 'ready' ? 'primary' : 'secondary'" :disabled="state('free', row.level) !== 'ready'" @click="game.claimPass('free', row.level)">{{ state('free', row.level) === 'claimed' ? 'Claimed' : state('free', row.level) === 'ready' ? 'Claim' : 'Locked' }}</UiButton>
        </div>
        <div class="pass-cell premium">
          <small>Premium</small>
          <span>{{ row.premium.map(text).join(' · ') }}</span>
          <UiButton size="sm" :variant="state('premium', row.level) === 'ready' ? 'primary' : 'secondary'" :disabled="state('premium', row.level) !== 'ready'" @click="game.claimPass('premium', row.level)">{{ state('premium', row.level) === 'claimed' ? 'Claimed' : state('premium', row.level) === 'ready' ? 'Claim' : state('premium', row.level) === 'premium' ? 'Premium' : 'Locked' }}</UiButton>
        </div>
      </li>
    </ol>
    <StylePreview v-if="previewOpen" :character="game.decor.bartenderCharacter === 'leo' ? 'leo' : 'noa'" :interior="theme.interior" :outfit="game.decor.bartenderCharacter === 'leo' ? theme.leo : theme.noa" @close="previewOpen = false" />
  </div>
</template>

<style>
.pass { display: grid; gap: 14px; }
.pass-hero { display: grid; grid-template-columns: 1fr minmax(220px, 320px); gap: 16px; align-items: center; }
@media (max-width: 640px) { .pass-hero { grid-template-columns: 1fr; } }
.pass-hero h3 { margin: 2px 0; font-size: 24px; color: #e4b35c; }
.pass-hero p { margin: 0; color: #c9d5e6; }
.pass-timer { opacity: .75; }
.pass-level { display: grid; gap: 6px; }
.pass-level progress { width: 100%; height: 10px; }
.pass-level small { color: #9eafc1; }
.pass-prize { display: grid; grid-template-columns: minmax(180px, 280px) 1fr minmax(200px, 300px); gap: 14px; align-items: stretch; padding: 12px; border: 1px solid #d8aa5766; border-radius: 14px; background: #0c1421aa; }
@media (max-width: 760px) { .pass-prize { grid-template-columns: 1fr; } }
.pass-scene { position: relative; height: 200px; border-radius: 12px; overflow: hidden; display: flex; justify-content: center; align-items: flex-end; gap: 4px; }
.pass-scene .art-character { position: relative !important; inset: auto !important; flex: 0 0 48%; width: 48% !important; height: 100% !important; aspect-ratio: auto !important; }
.pass-scene .bartender-art { position: absolute !important; inset: 0 !important; width: 100% !important; height: 100% !important; max-width: none !important; object-fit: contain !important; object-position: center bottom !important; transform: none !important; }
.pass-prize-text, .pass-premium { display: grid; gap: 6px; align-content: center; justify-items: start; }
.pass-prize-text b { font-size: 18px; color: #f8efe7; }
.pass-prize-text span, .pass-premium small { color: #c9d5e6; font-size: 13px; }
.pass-track { list-style: none; margin: 0; padding: 0; display: grid; gap: 8px; }
.pass-track li { display: grid; grid-template-columns: 34px 1fr 1fr; gap: 8px; align-items: stretch; padding: 8px; border: 1px solid #2c3a52; border-radius: 12px; background: #0c1421; }
@media (max-width: 640px) { .pass-track li { grid-template-columns: 28px 1fr; } .pass-track .premium { grid-column: 2; } }
.pass-track li.reached { border-color: #d8aa5799; }
.pass-track li.final { border-color: #e4b35c; background: linear-gradient(135deg, #1b2030, #2a2113); }
.pass-num { display: grid; place-items: center; font-weight: 800; color: #e4b35c; }
.pass-cell { display: grid; gap: 4px; align-content: space-between; padding: 6px 8px; border-radius: 8px; background: #ffffff08; font-size: 13px; }
.pass-cell small { letter-spacing: .08em; color: #9eafc1; }
.pass-cell.premium { background: #d8aa5712; }
.pass-cell .ui-btn { justify-self: start; }
</style>
