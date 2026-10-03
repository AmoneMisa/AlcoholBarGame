<script setup lang="ts">
import UiIcon from '../ui/UiIcon.vue';
import { computed, ref } from 'vue';
import { INTERIORS, interiorStyle, type InteriorId } from '../../data/cosmetics/bars';
import { COSMETICS } from '../../domain/cosmetics';
import { formatCountdown } from '../../domain/customerTiming';
import { CONSUMABLES, EQUIPMENT, describeReward } from '../../domain/loot';
import { PASS_LEVELS, PASS_LEVEL_POINTS, PASS_LEVEL_PRICE, PASS_POINTS, PASS_PREMIUM_PRICE, PASS_SOURCES, PASS_STYLES_LEVEL, passClaimKey, passRewards, themeStyleIds, type PassReward } from '../../domain/pass';
import { useGameStore } from '../../stores/game';
import CharacterModel from '../characters/CharacterModel.vue';
import SeasonPrizePreview from './SeasonPrizePreview.vue';
import CrystalAmount from '../ui/CrystalAmount.vue';
import RewardArt from '../ui/RewardArt.vue';
import type { RewardLine } from '../../domain/rewards';
import UiButton from '../ui/UiButton.vue';

// The season pass: a two-week track of twenty levels. Points come from normal play (the list below says what each thing
// is worth) or can be bought with crystals. Each level shows both tracks in a vertical list.
// The last free levels give the season's costumes (14) and background (20).
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
  if (reward.kind === 'interior') return `the background ${INTERIORS.find((item) => item.id === reward.id)?.name ?? reward.id}`;
  if (reward.kind === 'cosmetics') return reward.ids.map((id) => `${id.endsWith(':noa') ? 'Noa' : 'Leo'}: ${label(id)}`).join(' + ');
  return describeReward(reward, names);
}
function quantity(reward: PassReward): string {
  if ('amount' in reward) return String(reward.amount);
  return '';
}
function rewardPictures(reward: PassReward): RewardLine[] {
  const caption = text(reward);
  switch (reward.kind) {
    case 'cosmetics': return reward.ids.map(id=>({kind:'style',id,text:label(id)}));
    case 'interior': return [{kind:'background',id:reward.id,text:caption}];
    case 'coins': case 'crystals': case 'xp': case 'prestige': return [{kind:reward.kind,text:caption}];
    case 'box': return [{kind:'box',id:reward.box,text:caption}];
    case 'consumable': return [{kind:'item',id:reward.id,text:caption}];
    case 'supplies': return [{kind:'gift',id:'supplies',text:caption}];
    case 'parts': return [{kind:'material',id:'parts',text:caption}];
    case 'companionShards': return [{kind:'material',id:'circle',text:caption}];
    case 'skinShards': case 'stylePieces': return [{kind:'material',id:reward.kind==='skinShards' && reward.id ? `style:${reward.id}` : reward.kind==='skinShards' ? 'skinShards' : 'stylePieces',text:caption}];
    default: return [{kind:'gift',text:caption}];
  }
}
const claimed = (track: 'free' | 'premium', lvl: number) => game.passClaimed.includes(passClaimKey(track, lvl));
const state = (track: 'free' | 'premium', lvl: number) => claimed(track, lvl) ? 'claimed' : level.value < lvl ? 'locked' : track === 'premium' && !game.passPremium ? 'premium' : 'ready';
const stateText = (track: 'free' | 'premium', lvl: number) => ({ claimed: 'Claimed', locked: `Reach level ${lvl}`, premium: 'Premium only', ready: 'Tap to claim' })[state(track, lvl)];

// What gives points: each source, its worth, and what the player has done since the pass began.
const sources = computed(() => PASS_SOURCES.map((source) => {
  const done = Math.max(0, (game.loot.stats[source.stat] ?? 0) - (game.passCurrent ? game.passBase[source.stat] ?? 0 : game.loot.stats[source.stat] ?? 0));
  return { ...source, worth: PASS_POINTS[source.stat] ?? 0, done };
}).sort((a, b) => b.worth - a.worth));
const bought = computed(() => Math.max(0, game.passPoints - game.passEarned));

// Buying levels: one level is the rest of the one in progress.
const buyOptions = computed(() => [1, 5].map((count) => ({ count: Math.min(count, PASS_LEVELS - level.value), price: Math.min(count, PASS_LEVELS - level.value) * PASS_LEVEL_PRICE })).filter((option, index, all) => option.count > 0 && (index === 0 || option.count !== all[0]!.count)));
const buyReason = (price: number) => game.crystals < price ? `Not enough crystals: you need ${price}, you have ${Math.floor(game.crystals)}.` : '';

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
        <small>{{ level >= PASS_LEVELS ? 'Pass complete' : `${inLevel} / ${PASS_LEVEL_POINTS} points to level ${level + 1}` }}<template v-if="bought"> · {{ bought }} bought</template></small>
      </div>
    </header>

    <section class="pass-reward-list" aria-label="Pass levels">
      <div class="pass-track-head"><b>Free</b><span></span><div><b>Premium</b><UiButton v-if="!game.passPremium" size="sm" :disabled="game.crystals < PASS_PREMIUM_PRICE" :title="'Unlock for ' + PASS_PREMIUM_PRICE + ' crystals'" @click="game.buyPassPremium()">Activate</UiButton><small v-else>Activated</small></div></div>
      <ol class="pass-track">
        <li v-for="row in rows" :key="row.level" :data-level="row.level" :class="{ reached: level >= row.level, current: level === row.level }">
          <div class="pass-node"><span>{{ row.level }}</span></div>
          <button v-for="tier in (['free', 'premium'] as const)" :key="tier" type="button" class="pass-cell" :class="[tier, state(tier, row.level)]" :disabled="state(tier, row.level) !== 'ready'" :aria-label="tier + ' level ' + row.level + ': ' + row[tier].map(text).join(', ') + '. ' + stateText(tier, row.level)" @click="game.claimPass(tier, row.level)">

            <div v-for="(reward, index) in row[tier]" :key="index" class="pass-reward" :title="text(reward)">
              <div class="pass-cell-art"><RewardArt v-for="(picture, pictureIndex) in rewardPictures(reward)" :key="pictureIndex" :line="picture" /></div>
              <b v-if="quantity(reward)">{{ quantity(reward) }}</b>
            </div>
            <span class="pass-lock" v-if="!['claimed', 'ready'].includes(state(tier, row.level))"><UiIcon name="lock" /></span><small v-else class="pass-status">{{ state(tier, row.level) === 'claimed' ? 'Claimed' : 'Claim' }}</small>
          </button>
        </li>
      </ol>
    </section>
    <p class="pass-hint">Scroll through the levels. Tap an available reward to claim it.</p>

    <section class="pass-buy" aria-label="Buy levels">
      <div><b>Short on time?</b><small>Buy levels with crystals. Each one fills the rest of the level you are on.</small></div>
      <div class="pass-buy-buttons">
        <UiButton v-for="option in buyOptions" :key="option.count" variant="primary" size="sm" :disabled="game.crystals < option.price" @click="game.buyPassLevels(option.count)">+{{ option.count }} level{{ option.count === 1 ? '' : 's' }} · <CrystalAmount :value="option.price" /></UiButton>
        <small v-if="level >= PASS_LEVELS">All levels reached.</small>
        <small v-else-if="game.crystals < PASS_LEVEL_PRICE" class="pass-need">A level costs {{ PASS_LEVEL_PRICE }} crystals, you have {{ Math.floor(game.crystals) }}.</small>
      </div>
    </section>

    <section class="pass-points" aria-label="How to earn pass points">
      <header><small>HOW TO EARN POINTS</small><b>{{ PASS_LEVEL_POINTS }} points make a level</b></header>
      <ul>
        <li v-for="source in sources" :key="source.stat"><span>{{ source.label }}</span><em v-if="source.done">{{ source.done }} so far · {{ source.done * source.worth }} pts</em><b>+{{ source.worth }}</b></li>
      </ul>
    </section>

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
        <UiButton v-if="!game.passPremium" variant="primary" :reason="buyReason(PASS_PREMIUM_PRICE)" @click="game.buyPassPremium()">Unlock · <CrystalAmount :value="PASS_PREMIUM_PRICE" /></UiButton>
      </div>
    </section>
    <SeasonPrizePreview v-if="previewOpen" @close="previewOpen = false" />
  </div>
</template>

<style>
.pass { display: grid; gap: 14px; padding:18px; border-radius:12px; background:#0b1320 url('/assets/ui/pass-panel-painted-v1.webp') center top / cover no-repeat; }
.pass .pass-buy,.pass .pass-prize,.pass .pass-points{background-color:#0c1725c4;}
@media(max-width:640px){.pass{padding:12px;}}
.pass-hero { display: grid; grid-template-columns: 1fr minmax(220px, 320px); gap: 16px; align-items: center; }
@media (max-width: 640px) { .pass-hero { grid-template-columns: 1fr; } }
.pass-hero h3 { margin: 2px 0; font-size: 24px; color: #e4b35c; }
.pass-hero p { margin: 0; color: #c9d5e6; }
.pass-timer { opacity: .75; }
.pass-level { display: grid; gap: 6px; }
.pass-level progress { width: 100%; height: 10px; accent-color: #e7b556; }
.pass-level small { color: #9eafc1; }
.pass-buy { display: flex; flex-wrap: wrap; align-items: center; justify-content: space-between; gap: 10px; padding: 10px 12px; border: 1px solid #354762; border-radius: 12px; background: #111c2d; }
.pass-buy > div:first-child { display: grid; gap: 2px; }
.pass-buy small { color: #9eafc1; font-size: 12px; }
.pass-buy-buttons { display: flex; flex-wrap: wrap; align-items: center; gap: 8px; }
.pass-need { flex-basis: 100%; color: #f2b99a !important; }

.pass-reward-list { min-width:0;border:1px solid #536078;border-radius:14px;background:#0c1725cc;overflow:hidden; }
.pass-track-head,.pass-track > li { display:grid;grid-template-columns:minmax(0,1fr) 40px minmax(0,1fr);gap:10px;align-items:center; }
.pass-track-head { padding:14px 12px;color:#e4b35c;font-size:16px;text-align:center;border-bottom:1px solid #947440;background:#142039 url('/assets/ui/pass-panel-painted-v1.webp') center / cover; }
.pass-track-head > div { display:grid;justify-items:center;gap:8px; }
.pass-track-head small { font-size:11px; }
.pass-track-head > b { color:#bbd5ee; }
.pass-track { display:grid;margin:0;padding:0 12px;list-style:none;max-height:min(52vh,520px);overflow-y:auto;overscroll-behavior:contain; }
.pass-track > li { position:relative;padding:18px 0;border-bottom:1px solid #94744066; }
.pass-node { grid-column:2;grid-row:1;align-self:stretch;display:grid;place-items:center;position:relative; }
.pass-node::before { content:'';position:absolute;top:-18px;bottom:-18px;width:3px;background:#977039; }
.pass-node span { position:relative;display:grid;place-items:center;width:34px;height:38px;border:1px solid #b89858;border-radius:9px;background:#25384d;color:#fff0ce;font-weight:800; }
.pass-track > li.reached .pass-node span { background:#805b28;border-color:#edc578; }
.pass-cell { position:relative;grid-row:1;display:flex;flex-wrap:wrap;align-content:center;justify-content:center;gap:10px;min-width:0;min-height:125px;padding:12px 8px 28px;border:1px solid #607c9a;border-radius:12px;background:#142a40cc;color:#e9eef7;font:inherit;text-align:center; }
.pass-cell.premium { grid-column:3;background:#4b351ccc;border-color:#cda050; }
.pass-cell.free { grid-column:1; }
.pass-reward { display:grid;justify-items:center;gap:4px;min-width:0; }
.pass-reward b { font-size:14px;line-height:1.2;color:#fff3d7; }
.pass-cell-art { display:flex;align-items:center;justify-content:center;width:64px;height:64px;gap:2px; }
.pass-cell-art > .reward-art { flex:1;min-width:0;height:64px; }
.pass-cell-art .item-art { width:64px;height:64px; }
.pass-lock { position:absolute;right:-5px;top:-8px;font-size:27px;filter:drop-shadow(0 2px 3px #000a); }
.pass-status { position:absolute;bottom:8px;left:0;right:0;color:#8fd1a0;font-size:11px;font-weight:800; }
.pass-cell.ready { cursor:pointer;border-color:#edc578;box-shadow:0 0 12px #edc57835; }
.pass-cell.ready .pass-status { color:#ffdc85; }
.pass-hint { margin:0;color:#aebed2;font-size:12px;line-height:1.5; }
@media(max-width:540px){
 .pass{padding:8px;gap:12px;}
 .pass-track-head,.pass-track > li{grid-template-columns:minmax(0,1fr) 32px minmax(0,1fr);gap:8px;}
 .pass-track{padding:0 8px;}
 .pass-node span{width:28px;height:34px;font-size:13px;}
 .pass-cell{padding:10px 4px 25px;min-height:124px;gap:8px;}
 .pass-cell-art{width:54px;height:54px;}
 .pass-cell-art > .reward-art{height:54px;}
 .pass-cell-art .item-art{width:54px;height:54px;}
}

.pass-points { display: grid; gap: 8px; padding: 12px; border: 1px solid #354762; border-radius: 12px; background: #111c2d; }
.pass-points > header { display: grid; gap: 2px; }
.pass-points small { color: #9eafc1; letter-spacing: .1em; font-size: 10px; font-weight: 800; }
.pass-points ul { display: grid; gap: 4px; margin: 0; padding: 0; list-style: none; }
.pass-points li { display: grid; grid-template-columns: 1fr auto; align-items: center; gap: 2px 10px; padding: 7px 10px; border-radius: 8px; background: #17253a; font-size: 13px; }
.pass-points li em { grid-column: 1; color: #8fd1a0; font-size: 11px; font-style: normal; }
.pass-points li b { grid-row: 1; grid-column: 2; color: #f4d08e; font-size: 14px; }

.pass-prize { display: grid; grid-template-columns: minmax(180px, 260px) minmax(220px,1fr); gap: 14px; align-items: stretch; padding: 12px; border: 1px solid #d8aa5766; border-radius: 14px; background: #0c1421aa; }
@media (max-width: 760px) { .pass-prize { grid-template-columns: 1fr; } }
.pass-scene { position: relative; height: 200px; border-radius: 12px; overflow: hidden; display: flex; justify-content: center; align-items: flex-end; gap: 4px; }
.pass-scene .art-character { position: relative !important; inset: auto !important; flex: 0 0 48%; width: 48% !important; height: 92% !important; aspect-ratio: auto !important; }
.pass-scene .bartender-art { position: absolute !important; inset: 0 !important; width: 100% !important; height: 100% !important; max-width: none !important; object-fit: contain !important; object-position: center bottom !important; transform: none !important; }
.pass-premium { grid-column:1 / -1;padding-top:12px;border-top:1px solid #354762; }
.pass-prize-text, .pass-premium { display: grid; gap: 6px; align-content: center; justify-items: start; }
.pass-prize-text b { font-size: 18px; color: #f8efe7; }
.pass-prize-text span, .pass-premium small { color: #c9d5e6; font-size: 13px; }
</style>
