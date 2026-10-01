<script setup lang="ts">
import { REGIONS } from '../../domain/catalog';
import { useGameStore } from '../../stores/game';
import UiButton from '../ui/UiButton.vue';

// Quick bar select: one tap switches the bar you manage (stock, equipment, servers and guests are per bar).
const game = useGameStore();
const owned = () => REGIONS.filter((region) => game.isBarOwned(region.id));
</script>

<template>
  <div v-if="owned().length > 1" class="quick-bars tabs-scroll" role="group" aria-label="Switch bar">
    <UiButton v-for="region in owned()" :key="region.id" size="sm" :variant="region.id === game.regionId ? 'solid' : 'secondary'" :aria-pressed="region.id === game.regionId" @click="game.switchBar(region.id)">{{ region.name }}</UiButton>
  </div>
</template>

<style>
.quick-bars { display: flex; gap: 6px; padding: 10px 12px 0; }
</style>
