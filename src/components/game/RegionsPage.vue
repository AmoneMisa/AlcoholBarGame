<script setup lang="ts">
import PanelHeading from '../ui/PanelHeading.vue';
import { REGIONS } from '../../domain/catalog';
import { INTERIORS } from '../../data/cosmetics/bars';
import type { RegionId } from '../../domain/types';
import { useGameStore } from '../../stores/game';
import WorldMap from './WorldMap.vue';
const game = useGameStore();
const barUnits = (id: RegionId) => game.inventories[id].reduce((sum, stock) => sum + stock.amount, 0);
const barPriceLabel = () => game.nextBarPrice.currency === 'coins' ? `${game.nextBarPrice.amount.toLocaleString()} coins` : `${game.nextBarPrice.amount.toLocaleString()} crystals`;
const barActionLabel = (id: RegionId) => {
  if (!game.startingBarChosen) return 'Choose · free';
  if (game.isBarOwned(id)) return id === game.regionId ? 'Active bar' : 'Switch';
  if (game.level < game.barPurchaseLevel) return `Level ${game.barPurchaseLevel}`;
  return `Buy · ${barPriceLabel()}`;
};
function regionAction(id: RegionId) {
  if (!game.startingBarChosen) game.chooseStartingBar(id);
  else if (game.isBarOwned(id)) game.switchBar(id);
  else game.buyBar(id);
}

</script>
<template>
<article class="game-panel regions-deck">
      <PanelHeading eyebrow="WORLD TOUR" :title="`${game.startingBarChosen ? 'Build your bar network' : 'Choose your first city'}`" :aside="`${game.ownedBarIds.length} / ${REGIONS.length} bars open`" />
      <div class="bar-unlock-rules"><b>{{ game.startingBarChosen ? `Expansion unlocks at level ${game.barPurchaseLevel}` : 'Your first bar is free' }}</b><span>The second location costs coins. Every later location costs crystals. Each bar keeps its own name, look and inventory.</span></div>
      <WorldMap />
      <div class="region-cards"><article v-for="region in REGIONS" :key="region.id" :class="{ active: region.id === game.regionId && game.isBarOwned(region.id), locked: !game.isBarOwned(region.id) }"><img :src="INTERIORS.find(item => item.id === game.bars[region.id].interior)?.asset" alt="" /><small>{{ region.name }}</small><b>{{ game.bars[region.id].name }}</b><small>{{ region.tagline }}</small><span v-if="game.isBarOwned(region.id)">{{ region.marketFactor }}× prices · {{ barUnits(region.id).toLocaleString() }} stock</span><span v-else>{{ game.level < game.barPurchaseLevel && game.startingBarChosen ? `Level ${game.barPurchaseLevel} required` : 'Location not owned' }}</span><button type="button" :disabled="game.startingBarChosen && (game.isBarOwned(region.id) && region.id === game.regionId || !game.isBarOwned(region.id) && game.level < game.barPurchaseLevel)" @click="regionAction(region.id)">{{ barActionLabel(region.id) }}</button></article></div>
    </article>
</template>
<style scoped>
.bottle-inventory-tools { display:flex; flex-wrap:wrap; align-items:end; justify-content:space-between; gap:12px; margin:12px 0; }
.bottle-inventory-tools > :first-child { flex:1 1 240px; max-width:480px; }
.bottle-pagination { display:flex; align-items:center; gap:8px; }
.bottle-pagination span { font-size:.85rem; color:var(--muted, #a8b6c9); white-space:nowrap; }
</style>

