<script setup lang="ts">
import { lazyPage } from '../../ui/lazy';
import { loadInventory, loadRecipes } from '../../ui/pageLoaders';
import { liteGraphics } from '../../ui/graphics';
const props = withDefaults(defineProps<{ activeView?: string; designSection?: 'bar' | 'character' }>(), { activeView: 'inventory' });
const InventoryPage = lazyPage(loadInventory);
const MarketPanel = lazyPage(() => import('./MarketPanel.vue'));
const RecipesPage = lazyPage(loadRecipes, ['management']);
const DesignPage = lazyPage(() => import('./DesignPage.vue'));
const RegionsPage = lazyPage(() => import('./RegionsPage.vue'));
const PairingAdvisor = lazyPage(() => import('../PairingAdvisor.vue'));
</script>
<template>
<section class="management-deck">
  <KeepAlive :max="liteGraphics ? 1 : 6">
    <InventoryPage v-if="props.activeView === 'inventory'" />
    <MarketPanel v-else-if="props.activeView === 'market'" />
    <RecipesPage v-else-if="props.activeView === 'recipes'" />
    <DesignPage v-else-if="props.activeView === 'design'" :design-section="props.designSection" />
    <RegionsPage v-else-if="props.activeView === 'regions'" />
    <PairingAdvisor v-else-if="props.activeView === 'advisor'" />
  </KeepAlive>
</section>
</template>
