<script setup lang="ts">
import { CITY_COORDINATES } from '../../data/cosmetics/bars';
import { REGIONS } from '../../domain/catalog';
import { useGameStore } from '../../stores/game';
import type { RegionId } from '../../domain/types';
const game = useGameStore();
function position(id:RegionId) { const [longitude,latitude] = CITY_COORDINATES[id]; return { left:`${(longitude + 180) / 360 * 100}%`,top:`${(85 - latitude) / 145 * 100}%` }; }
</script>
<template>
  <div class="world-map-scroll"><div class="world-atlas" aria-label="Your bars around the world">
    <img src="/assets/bar/world-land.svg" alt="World coastlines" />
    <div class="atlas-graticule"></div>
    <button v-for="region in REGIONS" :key="region.id" :style="position(region.id)" class="atlas-city" :class="[region.id,{active:region.id === game.regionId}]" type="button" :aria-label="`Manage ${game.bars[region.id].name} in ${region.name}`" @click="game.switchBar(region.id)"><i></i><b>{{ region.name }}</b></button>
    <small class="atlas-caption">YOUR SIX LOCATIONS</small>
  </div></div>
</template>
