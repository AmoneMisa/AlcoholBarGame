<script setup lang="ts">
import type { BoardBar } from '../../telegram/api';
import ModalDialog from '../ui/ModalDialog.vue';
import UiButton from '../ui/UiButton.vue';
import UiIcon from '../ui/UiIcon.vue';
import ProfileCard from './ProfileCard.vue';
import BarShowcase from './BarShowcase.vue';
import { computed, ref } from 'vue';
import { useGameStore } from '../../stores/game';

// A look at the bar of someone on the weekly board. Read-only: it gives nothing to either side (a visit from the
// Friends tab is what earns prestige and opens gifts).
const props = defineProps<{ view: BoardBar }>();
const emit = defineEmits<{ close: []; visit: [] }>();
const game = useGameStore();
const pending = ref(false);
const feedback = ref('');
const relationship = computed(() => game.friends.find(friend => friend.code === props.view.player?.code)?.status === 'accepted' ? 'accepted' : game.friends.find(friend => friend.code === props.view.player?.code)?.direction ?? props.view.player?.relationship ?? 'none');
async function add() {
  if (!props.view.player || pending.value) return;
  pending.value = true;
  try { if (relationship.value === 'incoming') await game.answerFriend(props.view.player.code, true); else await game.addFriend(props.view.player.code); feedback.value = game.message; }
  finally { pending.value = false; }
}
async function visit() {
  if (!props.view.player || pending.value) return;
  if (relationship.value !== 'accepted') { feedback.value = 'Become friends to visit this bar.'; return; }
  pending.value = true;
  try { if (await game.visitFriend(props.view.player.code)) { emit('visit'); emit('close'); } else feedback.value = game.message; }
  finally { pending.value = false; }
}
</script>

<template>
  <ModalDialog :title="view.bar.name" :eyebrow="`WEEKLY BOARD · #${view.rank}`" width="640px" @close="emit('close')">
    <BarShowcase :bar="view.bar.bar" :name="view.bar.name" />
    <ProfileCard v-if="view.bar.profile" :name="view.player?.nickname || view.bar.bar.bartenderNickname || view.bar.name" :level="view.bar.level" :profile="view.bar.profile" :look="view.bar.bar" />
    <div v-if="view.player && !view.player.me" class="board-social-actions">
      <UiButton icon="user-plus" :disabled="pending || relationship === 'accepted' || relationship === 'outgoing'" @click="add">{{ relationship === 'accepted' ? 'Friends' : relationship === 'outgoing' ? 'Request sent' : relationship === 'incoming' ? 'Accept friend request' : 'Add friend' }}</UiButton>
      <UiButton icon="pin" :disabled="pending" @click="visit">Visit</UiButton>
    </div><p v-if="feedback" role="status">{{ feedback }}</p>
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
.board-social-actions {display:flex;flex-wrap:wrap;gap:8px;margin-top:12px;}
</style>
