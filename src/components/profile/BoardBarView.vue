<script setup lang="ts">
import type { BoardBar } from '../../telegram/api';
import ModalDialog from '../ui/ModalDialog.vue';
import UiButton from '../ui/UiButton.vue';
import UiIcon from '../ui/UiIcon.vue';
import ProfileCard from './ProfileCard.vue';
import BarShowcase from './BarShowcase.vue';

// A look at the bar of someone on the weekly board. Read-only: it gives nothing to either side (a visit from the
// Friends tab is what earns prestige and opens gifts).
defineProps<{ view: BoardBar }>();
const emit = defineEmits<{ close: [] }>();
</script>

<template>
  <ModalDialog :title="view.bar.name" :eyebrow="`WEEKLY BOARD · #${view.rank}`" width="640px" @close="emit('close')">
    <BarShowcase :bar="view.bar.bar" :name="view.bar.name" />
    <ProfileCard v-if="view.bar.profile" :name="view.bar.name" :level="view.bar.level" :profile="view.bar.profile" :look="view.bar.bar" />
    <ul class="board-view-stats">
      <li><UiIcon name="star" />Level {{ view.bar.level }}</li>
      <li><UiIcon name="trophy" />{{ view.bar.prestige }} prestige</li>
      <li><UiIcon name="book" />{{ view.bar.recipes }} recipes</li>
      <li><UiIcon name="pin" />{{ view.bar.interiors }} backgrounds</li>
      <li><UiIcon name="trophy" />{{ view.score }} XP this week</li>
    </ul>
    <p v-if="view.bar.mastered.length" class="board-view-mastered">Mastered: {{ view.bar.mastered.map((item) => `${item.name} (lv ${item.level})`).join(' · ') }}</p>
    <template #footer><UiButton variant="secondary" @click="emit('close')">Close</UiButton></template>
  </ModalDialog>
</template>

<style>
.board-view-stats { display: flex; flex-wrap: wrap; gap: 10px 16px; list-style: none; margin: 10px 0 0; padding: 0; color: #c9d5e6; font-size: 13px; }
.board-view-stats li { display: inline-flex; align-items: center; gap: 6px; }
.board-view-mastered { margin: 8px 0 0; color: #9eafc1; font-size: 13px; }
</style>
