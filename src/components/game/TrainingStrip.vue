<script setup lang="ts">
import UiIcon from '../ui/UiIcon.vue';
import { computed, onBeforeUnmount, onMounted, ref, watchEffect } from 'vue';
import { INGREDIENTS } from '../../domain/catalog';
import { NEED_LABEL, trainingById } from '../../domain/training';
import { practicePointer } from '../../guide/practice';
import { setPointer } from '../../guide/pointer';
import { useGameStore } from '../../stores/game';
import Glyph from '../ui/Glyph.vue';

// A small card while a practice is running: what the lesson asks for, what is already done, and the next thing to
// press. The same instruction is drawn on the screen by the guide pointer (a circle and a moving hand).
const game = useGameStore();
const module = computed(() => game.training.active ? trainingById(game.training.active.moduleId) : undefined);
const seen = computed(() => game.training.progress[game.training.active?.moduleId ?? ''] ?? []);

// What is on the screen is read from the page a few times a second.
const tick = ref(0);
let timer: ReturnType<typeof setInterval> | undefined;
const shown = (selector: string) => { const element = document.querySelector<HTMLElement>(selector); return !!element && element.getBoundingClientRect().width > 1; };

const next = computed(() => {
  void tick.value;
  const active = game.training.active;
  if (!active || !module.value?.practice) return undefined;
  const guest = game.customers.find((item) => item.id === active.guestId);
  const recipe = game.recipe;
  return practicePointer({
    moduleId: active.moduleId,
    seen: seen.value,
    guestHere: !!guest,
    convOpen: !!game.conversationCustomerId && game.conversationCustomerId === guest?.id,
    recipe: recipe ? { name: recipe.name, needsShake: !!recipe.needsShake, ingredients: recipe.ingredients.map((part) => ({ id: part.ingredientId, name: INGREDIENTS.find((item) => item.id === part.ingredientId)?.name ?? part.ingredientId, amount: part.amount })) } : undefined,
    mix: game.currentMix.map((item) => ({ id: item.ingredientId, amount: item.amount })),
    shaken: !!game.shaken,
    placedWords: document.querySelectorAll('.word-answer .placed').length,
    onBar: shown('.live-glass-station'),
    onMarket: shown('[data-guide="top-up"]')
  });
});

watchEffect(() => setPointer('practice', next.value?.candidates));
onMounted(() => { timer = setInterval(() => { tick.value++; }, 300); });
onBeforeUnmount(() => { if (timer) clearInterval(timer); setPointer('practice', undefined); });
</script>

<template>
  <aside v-if="module?.practice" class="training-strip" aria-label="Practice">
    <header><b><Glyph :g="module.icon" /> Practice: {{ module.title }}</b><button type="button" @click="game.endTraining()">End</button></header>
    <ul><li v-for="need in module.practice.needs" :key="need" :class="{ ok: seen.includes(need) }"><UiIcon class="inline-icon" :name="seen.includes(need) ? 'check' : 'circle'" /> {{ NEED_LABEL[need] }}</li></ul>
    <p v-if="next" class="next-step"><Glyph g="👉" /> {{ next.instruction }}</p>
    <small v-else>{{ module.practice.hint }}</small>
  </aside>
</template>

<style scoped>
.training-strip { position: absolute; z-index: 31; right: 10px; top: 56px; width: min(280px, 60vw); display: grid; gap: 4px; padding: 8px 10px; border: 1px solid #7aa0c8; border-radius: 12px; background: rgba(15, 24, 40, .93); color: #e8eef8; font-size: 12px; }
.training-strip header { display: flex; justify-content: space-between; align-items: center; gap: 8px; }
.training-strip header button { padding: 2px 8px; border: 1px solid #5a6b86; border-radius: 8px; background: transparent; color: inherit; cursor: pointer; }
.training-strip ul { list-style: none; margin: 0; padding: 0; display: grid; gap: 2px; }
.training-strip li.ok { color: #7cc686; }
.training-strip small { opacity: .75; }
.next-step { margin: 2px 0 0; padding: 4px 6px; border-radius: 8px; background: rgba(255, 211, 90, .16); color: #ffe39a; font-weight: 700; }
</style>
