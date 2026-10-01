<script setup lang="ts">
import { computed } from 'vue';
import { NEED_LABEL, trainingById } from '../../domain/training';
import { useGameStore } from '../../stores/game';

// A small card while a practice is running: what the lesson asks for and what is already done.
const game = useGameStore();
const module = computed(() => game.training.active ? trainingById(game.training.active.moduleId) : undefined);
const seen = computed(() => game.training.progress[game.training.active?.moduleId ?? ''] ?? []);
</script>

<template>
  <aside v-if="module?.practice" class="training-strip" aria-label="Practice">
    <header><b>{{ module.icon }} Practice: {{ module.title }}</b><button type="button" @click="game.endTraining()">End</button></header>
    <ul><li v-for="need in module.practice.needs" :key="need" :class="{ ok: seen.includes(need) }">{{ seen.includes(need) ? '☑' : '☐' }} {{ NEED_LABEL[need] }}</li></ul>
    <small>{{ module.practice.hint }}</small>
  </aside>
</template>

<style scoped>
.training-strip { position: absolute; z-index: 31; right: 10px; top: 56px; width: min(280px, 60vw); display: grid; gap: 4px; padding: 8px 10px; border: 1px solid #7aa0c8; border-radius: 12px; background: rgba(15, 24, 40, .93); color: #e8eef8; font-size: 12px; }
.training-strip header { display: flex; justify-content: space-between; align-items: center; gap: 8px; }
.training-strip header button { padding: 2px 8px; border: 1px solid #5a6b86; border-radius: 8px; background: transparent; color: inherit; cursor: pointer; }
.training-strip ul { list-style: none; margin: 0; padding: 0; display: grid; gap: 2px; }
.training-strip li.ok { color: #7cc686; }
.training-strip small { opacity: .75; }
</style>
