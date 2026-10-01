<script setup lang="ts">
import UiButton from '../ui/UiButton.vue';
import UiIcon from '../ui/UiIcon.vue';
import Glyph from '../ui/Glyph.vue';
import { computed, ref } from 'vue';
import { NEED_LABEL, TRAINING_MODULES, TRAINING_REWARD } from '../../domain/training';
import { useGameStore } from '../../stores/game';
import PopoverPanel from '../ui/PopoverPanel.vue';

// The training academy: a guide and (mostly) a risk-free practice for each core mechanic.
const emit = defineEmits<{ close: []; goto: [view: string] }>();
const game = useGameStore();
const openId = ref<string>(game.training.active?.moduleId ?? TRAINING_MODULES.find((module) => !game.training.done.includes(module.id))?.id ?? '');
const finished = computed(() => TRAINING_MODULES.filter((module) => game.training.done.includes(module.id)).length);
const toggle = (id: string) => { openId.value = openId.value === id ? '' : id; };

function practise(id: string) {
  const module = TRAINING_MODULES.find((item) => item.id === id);
  if (!module) return;
  if (game.startTraining(id)) {
    emit('close');
    emit('goto', module.practice?.guest === 'none' ? (module.goto?.view ?? 'service') : 'service');
  }
}
const seen = (id: string) => game.training.progress[id] ?? [];
</script>

<template>
  <PopoverPanel class="academy-panel" padded eyebrow="TRAINING" title="Academy" close-label="Close training" @close="emit('close')">
    <p class="academy-lead">{{ finished }} of {{ TRAINING_MODULES.length }} lessons done. Each lesson has a short guide and, where it helps, a practice with no risk. The first time you finish one: +{{ TRAINING_REWARD.xp }} XP and +{{ TRAINING_REWARD.crystals }} crystals.</p>
    <article v-for="module in TRAINING_MODULES" :key="module.id" class="academy-module" :class="{ done: game.training.done.includes(module.id), open: openId === module.id }">
      <button type="button" class="academy-head" :aria-expanded="openId === module.id" @click="toggle(module.id)">
        <span class="academy-icon"><Glyph :g="game.training.done.includes(module.id) ? '✅' : module.icon" /></span>
        <span><b>{{ module.title }}</b><small>{{ module.summary }}</small></span>
        <i><UiIcon :name="openId === module.id ? 'chevron-down' : 'chevron-right'" /></i>
      </button>
      <div v-if="openId === module.id" class="academy-body">
        <ol><li v-for="step in module.guide" :key="step.title"><b>{{ step.title }}.</b> {{ step.text }}</li></ol>
        <template v-if="module.practice">
          <p class="academy-hint"><UiIcon class="inline-icon" name="bulb" /> {{ module.practice.hint }}</p>
          <ul v-if="game.training.active?.moduleId === module.id" class="academy-needs"><li v-for="need in module.practice.needs" :key="need" :class="{ ok: seen(module.id).includes(need) }"><UiIcon class="inline-icon" :name="seen(module.id).includes(need) ? 'check' : 'circle'" /> {{ NEED_LABEL[need] }}</li></ul>
          <div class="academy-actions">
            <UiButton variant="primary" @click="practise(module.id)">{{ game.training.active?.moduleId === module.id ? 'Restart practice' : game.training.done.includes(module.id) ? 'Practise again' : 'Start practice' }}</UiButton>
            <UiButton variant="secondary" v-if="game.training.active?.moduleId === module.id" @click="game.endTraining()">End practice</UiButton>
          </div>
        </template>
        <div v-else class="academy-actions">
          <UiButton variant="secondary" v-if="module.goto" @click="emit('close'); emit('goto', module.goto.view)">{{ module.goto.label }}</UiButton>
          <UiButton variant="primary" :disabled="game.training.done.includes(module.id)" @click="game.trainingDone(module.id)">{{ game.training.done.includes(module.id) ? 'Done' : 'Got it' }}</UiButton>
        </div>
      </div>
    </article>
  </PopoverPanel>
</template>

<style scoped>
.academy-panel { max-height: 78vh; overflow: auto; }
.academy-lead { margin: 0 0 8px; font-size: 12px; opacity: .85; }
.academy-module { border-top: 1px solid #304159; }
.academy-head { display: grid; grid-template-columns: 34px 1fr auto; align-items: center; gap: 8px; width: 100%; padding: 8px 0; border: 0; background: transparent; color: inherit; text-align: left; cursor: pointer; }
.academy-head b, .academy-head small { display: block; }
.academy-head small { opacity: .75; font-size: 11px; }
.academy-icon { font-size: 22px; }
.academy-module.done .academy-head b { color: #7cc686; }
.academy-body { padding: 0 0 10px 42px; display: grid; gap: 8px; font-size: 12.5px; line-height: 1.45; }
.academy-body ol { margin: 0; padding-left: 16px; display: grid; gap: 4px; }
.academy-hint { margin: 0; padding: 6px 8px; border-radius: 8px; background: rgba(240, 195, 90, .12); }
.academy-needs { list-style: none; margin: 0; padding: 0; display: grid; gap: 2px; }
.academy-needs li.ok { color: #7cc686; }
.academy-actions { display: flex; flex-wrap: wrap; gap: 8px; }
</style>
