<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue';
import { fetchLeaderboard, viewBoardBar, type BoardBar, type LeaderboardResult } from '../../telegram/api';
import { LEADERBOARD_SIZE, MIN_WEEKLY_SCORE } from '../../domain/leaderboard';
import { useGameStore } from '../../stores/game';
import WeeklyPodium from './WeeklyPodium.vue';
import WeeklyRewards from './WeeklyRewards.vue';
import BoardBarView from '../profile/BoardBarView.vue';
import UiButton from '../ui/UiButton.vue';
const game = useGameStore();
// A look at the bar of someone on the board (read-only).
const viewing = ref<BoardBar>();
const viewError = ref('');
async function viewRow(row: { rank: number; score: number }) {
  if (!board.value) return;
  viewError.value = '';
  try {
    const result = await viewBoardBar(boardScope.value, row.rank, board.value.week, row.score);
    if (result.ok) viewing.value = result; else viewError.value = result.error ?? 'This bar is not available.';
  } catch (error) { viewError.value = (error as Error).message; }
}
// ---- Weekly leaderboard (online only) ----
const board = ref<LeaderboardResult | null>(null);
const boardError = ref('');
const boardLoading = ref(false);
const boardScope = ref<'global' | 'friends'>('global');
async function loadBoard() {
  if (game.mode !== 'online') return;
  boardLoading.value = true; boardError.value = '';
  try { board.value = await fetchLeaderboard(boardScope.value); } catch (error) { boardError.value = (error as Error).message; }
  boardLoading.value = false;
}
onMounted(() => { void loadBoard(); });
watch(boardScope, () => { void loadBoard(); });
watch(() => game.loot.leaderboardClaimed, () => { void loadBoard(); });
const daysLeft = computed(() => board.value ? Math.max(0, Math.ceil((board.value.endsAt - Date.now()) / 86_400_000)) : 0);
</script>
<template><section class="workshop-utility weekly-leaderboard">    <div  class="draw">
      <article v-if="game.mode !== 'online'" class="card"><h3>🏆 Weekly leaderboard</h3><p>The leaderboard needs an online account. Open the game from Telegram to compete.</p></article>
      <template v-else>
        <article class="card">
          <h3>🏆 This week's {{ boardScope === 'friends' ? 'friends' : 'top bars' }}</h3>
          <div class="row"><UiButton :variant="boardScope === 'global' ? 'solid' : 'secondary'" @click="boardScope = 'global'">Everyone</UiButton><UiButton :variant="boardScope === 'friends' ? 'solid' : 'secondary'" @click="boardScope = 'friends'">Friends</UiButton></div>
          <p>Score = XP you earn this week (serving, English, lessons). A drink pays the same XP at every level, so newcomers can win. Resets in {{ daysLeft }} day{{ daysLeft === 1 ? '' : 's' }}.</p>
          <p v-if="boardLoading">Loading…</p><p v-if="boardError || viewError" class="sig-error">{{ boardError || viewError }}</p>
          <WeeklyPodium v-if="board?.top.length" :rows="board.top" />
          <ol v-if="board" class="board">
            <li v-for="row in board.top" :key="row.rank" :class="{ me: row.me }"><b>{{ row.rank }}</b><span>{{ row.label }}<small v-if="row.level"> · level {{ row.level }}</small></span><em>{{ row.score }}</em><UiButton size="sm" variant="secondary" @click="viewRow(row)">View bar</UiButton></li>
            <li v-if="!board.top.length" class="empty">{{ boardScope === 'friends' ? 'Add friends in the Friends tab to compete with them.' : 'Nobody has scored yet this week. Serve a drink to take the lead.' }}</li>
          </ol>
          <p v-if="board?.me">You are <b>#{{ board.me.rank }}</b> of {{ board.me.size }} with {{ board.me.score }} XP.<template v-if="board.me.rank > LEADERBOARD_SIZE"> The list shows the top {{ LEADERBOARD_SIZE }}.</template></p>
          <p v-else-if="board">You have no score this week yet.</p>
          <UiButton variant="primary" @click="loadBoard">Refresh</UiButton>
        </article>
        <article class="card">
          <h3>🎁 Last week's reward</h3>
          <template v-if="board?.previous">
            <p>You finished <b>#{{ board.previous.rank }}</b> of {{ board.previous.size }} with {{ board.previous.score }} XP<template v-if="board.previous.tier"> — {{ board.previous.tier }}</template>.</p>
            <p v-if="board.previous.reward">Reward: {{ board.previous.reward }}</p>
            <p v-else>You need {{ MIN_WEEKLY_SCORE }} XP in a week to earn a reward.</p>
            <UiButton variant="primary" :disabled="!board.previous.claimable" @click="game.act({ type: 'claimLeaderboardReward' })">{{ board.previous.claimable ? 'Claim reward' : board.previous.reward ? 'Claimed' : 'No reward' }}</UiButton>
          </template>
          <p v-else>You did not play last week. Score at least {{ MIN_WEEKLY_SCORE }} XP this week to earn a reward next week.</p>
          <WeeklyRewards />
        </article>
      </template>
    </div>

<BoardBarView v-if="viewing" :view="viewing" @close="viewing = undefined" /></section></template>
<style src="./utility-panels.css"></style>
