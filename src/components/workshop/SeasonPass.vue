<script setup lang="ts">
import { computed, nextTick, onMounted, ref } from 'vue';
import { INTERIORS, interiorStyle, type InteriorId } from '../../data/cosmetics/bars';
import { COSMETICS } from '../../domain/cosmetics';
import { formatCountdown } from '../../domain/customerTiming';
import { BOXES, CONSUMABLES, EQUIPMENT, describeReward } from '../../domain/loot';
import { PASS_LEVELS, PASS_LEVEL_POINTS, PASS_LEVEL_PRICE, PASS_POINTS, PASS_PREMIUM_PRICE, PASS_SOURCES, PASS_STYLES_LEVEL, passClaimKey, passRewards, themeStyleIds, type PassReward } from '../../domain/pass';
import { useGameStore } from '../../stores/game';
import CharacterModel from '../characters/CharacterModel.vue';
import StylePreview from '../game/StylePreview.vue';
import CrystalAmount from '../ui/CrystalAmount.vue';
import ItemArt from '../ui/ItemArt.vue';
import UiButton from '../ui/UiButton.vue';

// The season pass: a two-week track of twenty levels. Points come from normal play (the list below says what each thing
// is worth) or can be bought with crystals. The track runs sideways like in a battle pass: the premium reward above the
// level, the free reward below it. The last free levels give the season's costumes (14) and background (20).
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
// The small picture and the short caption of a reward cell on the track.
interface Look { kind?: 'box' | 'item' | 'shard' | 'resource'; id?: string; fallback: string; caption: string }
function look(reward: PassReward): Look {
  switch (reward.kind) {
    case 'coins': return { kind: 'resource', id: 'coins', fallback: '🪙', caption: `${reward.amount}` };
    case 'crystals': return { kind: 'resource', id: 'crystals', fallback: '💎', caption: `${reward.amount}` };
    case 'xp': return { kind: 'resource', id: 'xp', fallback: '⭐', caption: `${reward.amount} XP` };
    case 'parts': return { kind: 'shard', id: 'parts', fallback: '⚙️', caption: `${reward.amount} parts` };
    case 'skinShards': return { kind: 'shard', id: 'skin', fallback: '👗', caption: `${reward.amount} skin` };
    case 'stylePieces': return { kind: 'shard', id: 'style', fallback: '🧵', caption: `${reward.amount} style` };
    case 'companionShards': return { kind: 'shard', id: 'circle', fallback: '🤝', caption: `${reward.amount} Circle` };
    case 'box': return { kind: 'box', id: reward.box, fallback: BOXES.find((item) => item.id === reward.box)?.icon ?? '📦', caption: `${reward.box} box` };
    case 'consumable': return { kind: 'item', id: reward.id, fallback: CONSUMABLES.find((item) => item.id === reward.id)?.icon ?? '🎁', caption: `${names.consumable(reward.id)}${reward.amount > 1 ? ` ×${reward.amount}` : ''}` };
    case 'supplies': return { fallback: '🧺', caption: `${reward.size} supplies` };
    case 'prestige': return { fallback: '🏅', caption: `+${reward.amount} prestige` };
    case 'interior': return { fallback: '🖼️', caption: 'Background' };
    case 'cosmetics': return { fallback: '👗', caption: 'Costumes' };
    default: return { fallback: '🎁', caption: text(reward) };
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

const track = ref<HTMLElement>();
const previewOpen = ref(false);
// Open the track at the current level, like a battle pass does.
onMounted(() => nextTick(() => {
  const node = track.value?.querySelector<HTMLElement>(`[data-level="${Math.max(1, level.value)}"]`);
  if (node && track.value) track.value.scrollLeft = Math.max(0, node.offsetLeft - track.value.clientWidth / 2 + node.clientWidth / 2);
}));
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

    <section class="pass-buy" aria-label="Buy levels">
      <div><b>Short on time?</b><small>Buy levels with crystals. Each one fills the rest of the level you are on.</small></div>
      <div class="pass-buy-buttons">
        <UiButton v-for="option in buyOptions" :key="option.count" variant="primary" size="sm" :disabled="game.crystals < option.price" @click="game.buyPassLevels(option.count)">+{{ option.count }} level{{ option.count === 1 ? '' : 's' }} · <CrystalAmount :value="option.price" /></UiButton>
        <small v-if="level >= PASS_LEVELS">All levels reached.</small>
        <small v-else-if="game.crystals < PASS_LEVEL_PRICE" class="pass-need">A level costs {{ PASS_LEVEL_PRICE }} crystals, you have {{ Math.floor(game.crystals) }}.</small>
      </div>
    </section>

    <section class="pass-track-wrap" aria-label="Pass levels">
      <div class="pass-rowlabels" aria-hidden="true"><span class="premium">Premium</span><span class="mid"></span><span class="free">Free</span></div>
      <ol ref="track" class="pass-track">
        <li v-for="row in rows" :key="row.level" :data-level="row.level" :class="{ reached: level >= row.level, current: level === row.level, final: row.level === PASS_LEVELS || row.level === PASS_STYLES_LEVEL }">
          <button type="button" class="pass-cell premium" :class="state('premium', row.level)" :disabled="state('premium', row.level) !== 'ready'" :title="`${row.premium.map(text).join(' + ')} · ${stateText('premium', row.level)}`" @click="game.claimPass('premium', row.level)">
            <ItemArt v-if="look(row.premium[0]!).kind" :kind="look(row.premium[0]!).kind!" :id="look(row.premium[0]!).id!" :fallback="look(row.premium[0]!).fallback" :size="40" />
            <span v-else class="pass-emoji" aria-hidden="true">{{ look(row.premium[0]!).fallback }}</span>
            <b>{{ look(row.premium[0]!).caption }}</b><small v-if="row.premium.length > 1">+{{ row.premium.length - 1 }} more</small>
            <i class="pass-mark" aria-hidden="true">{{ state('premium', row.level) === 'claimed' ? '✓' : state('premium', row.level) === 'ready' ? '!' : '🔒' }}</i>
          </button>
          <div class="pass-node"><span>{{ row.level }}</span></div>
          <button type="button" class="pass-cell free" :class="state('free', row.level)" :disabled="state('free', row.level) !== 'ready'" :title="`${row.free.map(text).join(' + ')} · ${stateText('free', row.level)}`" @click="game.claimPass('free', row.level)">
            <ItemArt v-if="look(row.free[0]!).kind" :kind="look(row.free[0]!).kind!" :id="look(row.free[0]!).id!" :fallback="look(row.free[0]!).fallback" :size="40" />
            <span v-else class="pass-emoji" aria-hidden="true">{{ look(row.free[0]!).fallback }}</span>
            <b>{{ look(row.free[0]!).caption }}</b><small v-if="row.free.length > 1">+{{ row.free.length - 1 }} more</small>
            <i class="pass-mark" aria-hidden="true">{{ state('free', row.level) === 'claimed' ? '✓' : state('free', row.level) === 'ready' ? '!' : '🔒' }}</i>
          </button>
        </li>
      </ol>
    </section>
    <p class="pass-hint">Swipe along the track. Tap a glowing reward to claim it; rewards wait for you, so nothing is lost if you claim later.</p>

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
.pass-level progress { width: 100%; height: 10px; accent-color: #e7b556; }
.pass-level small { color: #9eafc1; }
.pass-buy { display: flex; flex-wrap: wrap; align-items: center; justify-content: space-between; gap: 10px; padding: 10px 12px; border: 1px solid #354762; border-radius: 12px; background: #111c2d; }
.pass-buy > div:first-child { display: grid; gap: 2px; }
.pass-buy small { color: #9eafc1; font-size: 12px; }
.pass-buy-buttons { display: flex; flex-wrap: wrap; align-items: center; gap: 8px; }
.pass-need { flex-basis: 100%; color: #f2b99a !important; }

.pass-track-wrap { display: grid; grid-template-columns: 56px minmax(0, 1fr); border: 1px solid #2c3a52; border-radius: 14px; background: #0c1421; overflow: hidden; }
.pass-rowlabels { display: grid; grid-template-rows: 104px 44px 104px; align-items: center; padding: 8px 0; border-right: 1px solid #2c3a52; background: #0a111d; text-align: center; font-size: 10px; font-weight: 800; letter-spacing: .08em; text-transform: uppercase; }
.pass-rowlabels .premium { color: #e4b35c; }
.pass-rowlabels .free { color: #9eafc1; }
.pass-track { display: flex; gap: 8px; margin: 0; padding: 8px 12px; list-style: none; overflow-x: auto; scroll-snap-type: x proximity; overscroll-behavior-x: contain; }
.pass-track > li { position: relative; flex: 0 0 84px; display: grid; grid-template-rows: 104px 44px 104px; justify-items: center; scroll-snap-align: center; }
.pass-node { position: relative; display: grid; width: 100%; place-items: center; }
.pass-node::before { content: ''; position: absolute; left: -4px; right: -4px; top: 50%; height: 4px; transform: translateY(-50%); background: #26354d; }
.pass-track > li.reached .pass-node::before { background: linear-gradient(90deg, #e4b35c, #f2cd7a); }
.pass-track > li.current .pass-node::before { background: linear-gradient(90deg, #e4b35c, #f2cd7a 70%, #26354d); }
.pass-node span { position: relative; display: grid; width: 32px; height: 32px; place-items: center; border: 2px solid #3b4b65; border-radius: 50%; background: #131e30; color: #9eafc1; font: 800 14px system-ui, sans-serif; }
.pass-track > li.reached .pass-node span { border-color: #f2cd7a; background: #4a3720; color: #fff0ce; }
.pass-track > li.current .pass-node span { box-shadow: 0 0 0 4px #e4b35c44; }
.pass-track > li.final .pass-node span { border-radius: 9px; }

.pass-cell { position: relative; display: grid; align-content: center; justify-items: center; gap: 3px; width: 84px; padding: 6px 4px; border: 1px solid #2c3a52; border-radius: 12px; background: #ffffff08; color: #e9eef7; font: inherit; text-align: center; }
.pass-cell.premium { background: #d8aa5712; border-color: #d8aa5740; }
.pass-cell b { font-size: 11px; line-height: 1.2; }
.pass-cell small { color: #9eafc1; font-size: 10px; }
.pass-cell .item-art { width: 40px; height: 40px; border-radius: 50%; }
.pass-emoji { font-size: 28px; line-height: 40px; }
.pass-mark { position: absolute; top: 4px; right: 5px; font-size: 11px; font-style: normal; color: #9eafc1; }
.pass-cell.locked, .pass-cell.premium:disabled:not(.claimed) { opacity: .55; }
.pass-cell.claimed { opacity: .6; }
.pass-cell.claimed .pass-mark { color: #8fd1a0; font-weight: 800; }
.pass-cell.ready { cursor: pointer; border-color: #f2cd7a; background: #3b2b1f; box-shadow: 0 0 14px #e4b35c55; animation: pass-glow 1.8s ease-in-out infinite; }
.pass-cell.ready .pass-mark { color: #fff; background: #d9534f; width: 16px; height: 16px; border-radius: 50%; line-height: 16px; font-weight: 800; }
@keyframes pass-glow { 50% { box-shadow: 0 0 5px #e4b35c33; } }
@media (prefers-reduced-motion: reduce) { .pass-cell.ready { animation: none; } }
.pass-hint { margin: -6px 0 0; color: #9eafc1; font-size: 12px; }

.pass-points { display: grid; gap: 8px; padding: 12px; border: 1px solid #354762; border-radius: 12px; background: #111c2d; }
.pass-points > header { display: grid; gap: 2px; }
.pass-points small { color: #9eafc1; letter-spacing: .1em; font-size: 10px; font-weight: 800; }
.pass-points ul { display: grid; gap: 4px; margin: 0; padding: 0; list-style: none; }
.pass-points li { display: grid; grid-template-columns: 1fr auto; align-items: center; gap: 2px 10px; padding: 7px 10px; border-radius: 8px; background: #17253a; font-size: 13px; }
.pass-points li em { grid-column: 1; color: #8fd1a0; font-size: 11px; font-style: normal; }
.pass-points li b { grid-row: 1; grid-column: 2; color: #f4d08e; font-size: 14px; }

.pass-prize { display: grid; grid-template-columns: minmax(180px, 280px) 1fr minmax(200px, 300px); gap: 14px; align-items: stretch; padding: 12px; border: 1px solid #d8aa5766; border-radius: 14px; background: #0c1421aa; }
@media (max-width: 760px) { .pass-prize { grid-template-columns: 1fr; } }
.pass-scene { position: relative; height: 200px; border-radius: 12px; overflow: hidden; display: flex; justify-content: center; align-items: flex-end; gap: 4px; }
.pass-scene .art-character { position: relative !important; inset: auto !important; flex: 0 0 48%; width: 48% !important; height: 100% !important; aspect-ratio: auto !important; }
.pass-scene .bartender-art { position: absolute !important; inset: 0 !important; width: 100% !important; height: 100% !important; max-width: none !important; object-fit: contain !important; object-position: center bottom !important; transform: none !important; }
.pass-prize-text, .pass-premium { display: grid; gap: 6px; align-content: center; justify-items: start; }
.pass-prize-text b { font-size: 18px; color: #f8efe7; }
.pass-prize-text span, .pass-premium small { color: #c9d5e6; font-size: 13px; }
</style>
