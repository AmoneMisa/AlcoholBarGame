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
    <img src="/assets/bar/world-land.webp" alt="World coastlines" />
    <div class="atlas-graticule"></div>
    <button v-for="region in REGIONS" :key="region.id" :style="position(region.id)" class="atlas-city" :class="[region.id,{active:region.id === game.regionId && game.isBarOwned(region.id),locked:!game.isBarOwned(region.id)}]" type="button" :aria-label="game.isBarOwned(region.id) ? `Manage ${game.bars[region.id].name} in ${region.name}` : `${region.name} bar is locked`" :disabled="!game.isBarOwned(region.id)" @click="game.switchBar(region.id)"><i></i><b>{{ region.name }}</b></button>
    <small class="atlas-caption">{{ game.ownedBarIds.length }} OF {{ REGIONS.length }} BARS OPEN</small>
  </div></div>
</template>
