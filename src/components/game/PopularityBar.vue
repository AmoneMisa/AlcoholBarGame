<script setup lang="ts">
import { computed } from 'vue';
import { useGameStore } from '../../stores/game';
import UiButton from '../ui/UiButton.vue';
import UiIcon from '../ui/UiIcon.vue';

// Prestige (popularity from friends who visit the bar) on the main page: how much there is, and the two boosts it buys,
// one tap away. The Friends page explains how it grows.
const GOAL = 30;
const game = useGameStore();
const enough = computed(() => game.popularity >= GOAL);
const active = computed(() => {
  const boost = game.popularityBoost;
  if (!boost) return '';
  return boost.kind === 'no-cooldown' ? '15 min rush is on' : `VIP run: ${boost.remaining} guests left`;
});
const why = computed(() => active.value ? 'A boost is already running.' : enough.value ? '' : `You need ${GOAL} prestige (you have ${game.popularity}). Friends who visit your bar add +1 a day.`);
</script>

<template>
  <section class="popularity-bar" :class="{ ready: enough && !active, 'has-actions': enough || !!active }" aria-label="Prestige">
    <UiIcon name="trophy" />
    <div class="popularity-text">
      <b>Prestige <em>{{ game.popularity }} / {{ GOAL }}</em></b>
      <small v-if="active" class="running">{{ active }}</small>
      <small v-else>Friends who visit add +1 a day. At {{ GOAL }} spend it on a boost.</small>
      <progress :value="Math.min(game.popularity, GOAL)" :max="GOAL"></progress>
    </div>
    <div v-if="enough || active" class="popularity-actions">
      <UiButton size="sm" :variant="enough && !active ? 'solid' : 'secondary'" :disabled="!!why" :title="why || 'Guests arrive without waiting for 15 minutes'" @click="game.activatePopularityBoost('no-cooldown')">15 min rush</UiButton>
      <UiButton size="sm" :variant="enough && !active ? 'solid' : 'secondary'" :disabled="!!why" :title="why || 'The next guests are VIPs'" @click="game.activatePopularityBoost('vip-run')">VIP run</UiButton>
    </div>
  </section>
</template>

<style scoped>
.popularity-bar { display: grid; grid-template-columns: 24px minmax(0, 1fr) auto; align-items: center; gap: 10px; margin: 0 0 8px; padding: 8px 12px; border: 1px solid #3b4b65; border-radius: 12px; background: #101a2b; color: #e9eef7; }
.popularity-bar.ready { border-color: #e0a14a; background: linear-gradient(90deg, #3a2a14, #101a2b); }
.popularity-bar .ui-icon { width: 22px; height: 22px; color: #ffd35a; }
.popularity-text { display: grid; gap: 3px; min-width: 0; }
.popularity-text b { font-size: 14px; }
.popularity-text em { margin-left: 6px; color: #9eafc1; font-style: normal; font-weight: 600; font-size: 12px; }
.popularity-text small { color: #9eafc1; font-size: 11px; }
.popularity-text small.running { color: #7cc686; font-weight: 700; }
.popularity-text progress { width: 100%; height: 5px; accent-color: #e7b556; }
.popularity-actions { display: flex; flex-wrap: wrap; gap: 6px; justify-content: flex-end; }
@media (max-width: 560px) { .popularity-bar.has-actions { grid-template-columns: 24px minmax(0, 1fr); } .popularity-bar.has-actions .popularity-actions { grid-column: 1 / -1; justify-content: flex-start; } }
</style>
