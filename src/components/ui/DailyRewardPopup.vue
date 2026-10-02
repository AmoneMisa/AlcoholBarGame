<script setup lang="ts">
import { watch } from 'vue';
import { useGameStore } from '../../stores/game';
import ModalDialog from './ModalDialog.vue';
import LoginRewardTrack from './LoginRewardTrack.vue';
const game = useGameStore();
watch(() => game.rewardReport?.id, () => { if (game.rewardReport?.title === 'Daily reward') game.dailyOpen = false; });
</script>
<template><ModalDialog eyebrow="LOGIN STREAK" title="Login rewards" @close="game.dailyOpen = false"><LoginRewardTrack /></ModalDialog></template>

