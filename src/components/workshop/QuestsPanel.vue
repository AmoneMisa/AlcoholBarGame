<script setup lang="ts">
import { computed } from 'vue';
import { COSMETICS } from '../../domain/cosmetics';
import { ACHIEVEMENT_STYLES } from '../../data/cosmetics/styleSources';
import { ACHIEVEMENTS, questsForWeek, weekOf, type StatId } from '../../domain/quests';
import { useGameStore } from '../../stores/game';
import ItemArt from '../ui/ItemArt.vue';
import UiButton from '../ui/UiButton.vue';

// Weekly quests, the tasting log and the achievement series. Lives on the Events page next to the pass and the wheel.
const game = useGameStore();
// The pair of styles an achievement gives (one per bartender), with the matching backgrounds that come along.
const achievementStyles = (goalId: string) => {
  const pair = ACHIEVEMENT_STYLES[goalId];
  return pair ? Object.entries(pair).map(([character, value]) => COSMETICS.find((item) => item.id === `bartender:${value}:${character}`)?.label).filter(Boolean).join(' · ') : '';
};
const week = computed(() => weekOf(Date.now()));
const quests = computed(() => questsForWeek(week.value).map((quest) => {
  const current = game.loot.quests.week === week.value;
  return { quest, progress: current ? game.loot.quests.progress[quest.stat] ?? 0 : 0, claimed: current && game.loot.quests.claimed.includes(quest.id) };
}));
const stat = (id: string) => game.achievementStat(id as StatId);
// One card per achievement series: the next tier to claim, and the four tiers as pips.
const achievementRows = computed(() => [...new Set(ACHIEVEMENTS.map((item) => item.series))].map((series) => {
  const tiers = ACHIEVEMENTS.filter((item) => item.series === series).map((item) => ({ ...item, done: game.loot.achievements.includes(item.id) }));
  const next = tiers.find((item) => !item.done);
  return { series, seriesName: tiers[0]!.seriesName, tiers, goal: next ?? tiers[tiers.length - 1]!, finished: !next };
}));
</script>

<template>
  <div class="quest-grid">
    <article v-for="item in quests" :key="item.quest.id" class="quest-card">
      <small>WEEKLY QUEST</small>
      <p>{{ item.quest.name }}</p>
      <progress :value="Math.min(item.progress, item.quest.target)" :max="item.quest.target"></progress>
      <b>{{ Math.min(item.progress, item.quest.target) }} / {{ item.quest.target }} · +{{ item.quest.crystals }} crystals + {{ item.quest.box }} box</b>
      <UiButton variant="primary" :disabled="item.claimed || item.progress < item.quest.target" @click="game.act({ type: 'claimQuest', questId: item.quest.id })">{{ item.claimed ? 'Claimed' : 'Claim' }}</UiButton>
    </article>
    <article class="quest-card">
      <h3>Tasting log</h3>
      <p>{{ stat('tasted') }} recipes and {{ game.loot.tasted.length - stat('tasted') }} brands tasted. Serving a recipe for the first time gives parts and skin shards; a new brand gives a shard.</p>
    </article>
    <article v-for="row in achievementRows" :key="row.series" class="quest-card">
      <ItemArt kind="achievement" :id="row.series" fallback="🏅" :size="72" class="quest-art" />
      <h3>{{ row.seriesName }}</h3>
      <p>{{ row.goal.name }}</p>
      <p class="quest-tiers"><span v-for="tier in row.tiers" :key="tier.id" :class="['quest-tier', `quest-tier-${tier.tier}`, { done: tier.done }]" :title="`${tier.tierName}: ${tier.target}`">{{ tier.tierName }}</span></p>
      <progress :value="Math.min(stat(row.goal.stat), row.goal.target)" :max="row.goal.target"></progress>
      <b>{{ Math.min(stat(row.goal.stat), row.goal.target) }} / {{ row.goal.target }} · +{{ row.goal.crystals }} crystals + {{ row.goal.box }} box</b>
      <small v-if="achievementStyles(row.goal.id)">Styles: {{ achievementStyles(row.goal.id) }}</small>
      <UiButton variant="primary" :disabled="row.finished || stat(row.goal.stat) < row.goal.target" @click="game.act({ type: 'claimAchievement', id: row.goal.id })">{{ row.finished ? 'All tiers claimed' : `Claim ${row.goal.tierName}` }}</UiButton>
    </article>
  </div>
</template>

<style>
.quest-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(250px, 1fr)); gap: 10px; }
.quest-card { display: grid; align-content: start; gap: 8px; padding: 14px; border: 1px solid #354762; border-radius: 13px; background: #111c2d; }
.quest-card h3 { margin: 0; font: 700 17px Georgia, serif; }
.quest-card p { margin: 0; color: #aebdce; font-size: 12px; line-height: 1.45; }
.quest-card > small:first-child { color: #9eafc1; font-size: 10px; font-weight: 800; letter-spacing: .1em; }
.quest-card > b { color: #f4d08e; font-size: 12px; }
.quest-card progress { width: 100%; accent-color: #e7b556; }
.quest-art { display: block; width: 72px; height: 72px; object-fit: contain; border-radius: 50%; }
.quest-tiers { display: flex; flex-wrap: wrap; gap: 4px; margin: 2px 0; }
.quest-tier { padding: 1px 8px; border-radius: 999px; border: 1px solid #4a5a72; font-size: 11px; opacity: .5; }
.quest-tier.done { opacity: 1; font-weight: 700; }
.quest-tier-1.done { border-color: #a8672f; color: #e9b27d; }
.quest-tier-2.done { border-color: #b9c3d0; color: #e4ebf3; }
.quest-tier-3.done { border-color: #f0c24b; color: #ffe08a; }
.quest-tier-4.done { border-color: #7fe0f0; color: #bff3fb; }
</style>
