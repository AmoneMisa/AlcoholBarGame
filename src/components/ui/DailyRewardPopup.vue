<script setup lang="ts">
import { ref } from 'vue';
import { useGameStore } from '../../stores/game';
import ModalDialog from './ModalDialog.vue';
import DailyRewardCard from './DailyRewardCard.vue';

// Opens by itself the first time the player comes back in a day (and from the Events page): the login streak, the
// seven-day track and the claim button.
const game = useGameStore();
const card = ref<InstanceType<typeof DailyRewardCard>>();
</script>

<template>
  <ModalDialog eyebrow="LOGIN STREAK" :title="`Day ${card?.cycleDay ?? game.upcomingLoginDay} · ${game.dailyGiftAvailable ? 'reward ready' : 'claimed'}`" close-label="Close daily reward" width="520px" @close="game.dailyOpen = false">
    <DailyRewardCard ref="card" />
  </ModalDialog>
</template>
