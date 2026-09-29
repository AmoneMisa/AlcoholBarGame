<script setup lang="ts">
import { computed, ref } from 'vue';
import { INGREDIENTS } from '../../domain/catalog';
import { formatCountdown } from '../../domain/customerTiming';
import { useGameStore } from '../../stores/game';

// The city's current buff or disaster, plus what the bar's level gives. `compact` is the chip on the bar scene.
defineProps<{ compact?: boolean }>();
const game = useGameStore();
const open = ref(false);
const event = computed(() => game.economy.event);
// `economy` is recomputed on every game-clock tick, so this countdown stays live.
const endsIn = computed(() => event.value ? formatCountdown(Math.max(0, (event.value.endsAt - Date.now()) / 1000)) : '');
const shortage = computed(() => event.value?.shortageIds.map((id) => INGREDIENTS.find((item) => item.id === id)?.name).filter(Boolean).join(', '));
const percent = (value: number) => `${value >= 1 ? '+' : '−'}${Math.round(Math.abs(value - 1) * 100)}%`;
const perks = computed(() => {
  const economy = game.economy;
  return [
    `VIP chance ${Math.round(economy.vipChance * 100)}%`,
    `Guests pay ${percent(economy.perks.pay)}`,
    `Supplier prices ${percent(economy.perks.supply)}`,
    `Next guest ${percent(economy.perks.arrival)} wait`
  ];
});
</script>

<template>
  <div class="city-event" :class="[compact ? 'compact' : 'full', event?.kind ?? 'calm']">
    <button type="button" class="city-event-head" :aria-expanded="!compact || open" @click="open = !open">
      <span class="city-event-icon" aria-hidden="true">{{ event?.icon ?? '🌙' }}</span>
      <span><b>{{ event?.name ?? 'A quiet night' }}</b><small>{{ event ? `${event.kind === 'buff' ? 'City buff' : 'City disaster'} · ends in ${endsIn}` : `Level ${game.level} perks` }}</small></span>
    </button>
    <div v-if="!compact || open" class="city-event-body">
      <p v-if="event">{{ event.description }}</p>
      <p v-if="shortage" class="shortage">Short supply: {{ shortage }}</p>
      <ul><li v-for="perk in perks" :key="perk">{{ perk }}</li></ul>
      <small>Level {{ game.level }} · {{ game.xpProgress.into }}/{{ game.xpProgress.needed }} XP to level {{ game.level + 1 }}</small>
    </div>
  </div>
</template>

<style scoped>
.city-event { border: 1px solid #5b4a3a; border-radius: 12px; background: #0d1522e8; color: #e8e2d6; box-shadow: 0 10px 24px #0007; backdrop-filter: blur(8px); }
.city-event.buff { border-color: #d6a54e; }
.city-event.disaster { border-color: #c2505c; }
.city-event.compact { position: absolute; z-index: 11; top: 12px; left: 12px; max-width: 250px; }
.city-event.full { margin: 0 0 10px; }
.city-event-head { display: flex; width: 100%; align-items: center; gap: 8px; padding: 7px 10px; border: 0; background: transparent; color: inherit; text-align: left; cursor: pointer; }
.city-event-icon { font-size: 18px; }
.city-event-head b, .city-event-head small { display: block; }
.city-event-head b { font-size: 11px; }
.city-event-head small { color: #a9b3c1; font-size: 8px; letter-spacing: .04em; }
.buff .city-event-head b { color: #ffd98b; }
.disaster .city-event-head b { color: #ff9ca5; }
.city-event-body { padding: 0 10px 9px; font-size: 9px; line-height: 1.45; }
.city-event-body p { margin: 0 0 5px; }
.city-event-body .shortage { color: #ffb3b9; }
.city-event-body ul { display: flex; flex-wrap: wrap; gap: 4px; margin: 0 0 5px; padding: 0; list-style: none; }
.city-event-body li { padding: 2px 6px; border: 1px solid #3c4d64; border-radius: 8px; background: #16233a; color: #cfd8e4; }
.city-event-body > small { color: #8f9bab; font-size: 8px; }
</style>
