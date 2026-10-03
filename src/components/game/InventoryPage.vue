<script setup lang="ts">
import UiButton from '../ui/UiButton.vue';
import WorkshopStock from './WorkshopStock.vue';
import UiInput from '../ui/UiInput.vue';
import CrystalAmount from '../ui/CrystalAmount.vue';
import PanelHeading from '../ui/PanelHeading.vue';
import { computed, ref, watch } from 'vue';
import { INGREDIENTS, RECIPES, REGIONS } from '../../domain/catalog';
import { ALCOHOL_PRODUCTS, ALCOHOL_TYPE_LABELS, bottleSaleCrystalReward } from '../../domain/bottleCatalog';
import UiIcon from '../ui/UiIcon.vue';
import BrandBottle from '../knowledge/BrandBottle.vue';
import { guideIdForProduct } from '../../data/knowledge/alcohol';
import { capacityFor, isPerishable } from '../../domain/warehouse';
import type { Ingredient, RegionId } from '../../domain/types';
import { useGameStore } from '../../stores/game';
import BottleModel from '../cocktails/BottleModel.vue';
import GlassModel from '../cocktails/GlassModel.vue';
import OptionSelect from './OptionSelect.vue';
import DeliveryProblems from './DeliveryProblems.vue';
const game = useGameStore();
const stockCategory = ref<'all' | 'spirit' | 'mixer' | 'fresh' | 'food' | 'items' | 'shards' | 'cards'>('all');
const stockTabs = computed(() => {
  const loot = game.loot;
  const tabs: { id: typeof stockCategory.value; label: string }[] = [{ id: 'all', label: 'All' }, { id: 'spirit', label: 'Spirits' }, { id: 'mixer', label: 'Mixers' }, { id: 'fresh', label: 'Fresh' }, { id: 'food', label: 'Food' }];
  const hasItems = loot.parts > 0 || Object.values(loot.boxes).some((n) => n > 0) || Object.values(loot.consumables).some((n) => n > 0) || Object.values(game.circle.keepsakes).some((n) => n > 0);
  const hasShards = loot.skinShards > 0 || Object.values(loot.styleShards).some((n) => n > 0) || Object.values(loot.itemShards).some((n) => n > 0) || Object.values(game.circle.shards).some((n) => n > 0);
  if (hasItems) tabs.push({ id: 'items', label: 'Items' });
  if (hasShards) tabs.push({ id: 'shards', label: 'Shards' });
  if (recipeCardInventory.value.length) tabs.push({ id: 'cards', label: 'Cards' });
  return tabs;
});
const isStockKind = computed(() => ['all', 'spirit', 'mixer', 'fresh', 'food'].includes(stockCategory.value));
const transferIngredientId = ref(INGREDIENTS[0]!.id);
const fridgeLevel = computed(() => game.loot.equipment[game.regionId]?.fridge?.level ?? 0);
const capacityOf = (id: string) => capacityFor(INGREDIENTS.find((item) => item.id === id)!, fridgeLevel.value);
const ingredientById = (id: string) => INGREDIENTS.find((item) => item.id === id)!;
const bottleById = (id: string) => ALCOHOL_PRODUCTS.find((item) => item.id === id)!;
const uiCategory = (ingredient: Ingredient) => ingredient.category === 'food' ? 'food' : ingredient.category === 'spirit' ? 'spirit' : ingredient.category === 'mixer' && !['sugar-syrup', 'coconut-cream', 'milk', 'coconut-milk'].includes(ingredient.id) ? 'mixer' : 'fresh';
const visibleStock = computed(() => game.visibleInventory.filter((stock) => stockCategory.value === 'all' || uiCategory(ingredientById(stock.ingredientId)) === stockCategory.value));
const bottleSearch = ref('');
const bottlePage = ref(1);
const BOTTLES_PER_PAGE = 12;
const matchingBottles = computed(() => {
  const query = bottleSearch.value.trim().toLowerCase();
  return game.bottleInventory.filter(stock => {
    const product = bottleById(stock.productId);
    return !query || `${product.name} ${product.brand} ${ALCOHOL_TYPE_LABELS[product.type]}`.toLowerCase().includes(query);
  });
});
const bottlePages = computed(() => Math.max(1, Math.ceil(matchingBottles.value.length / BOTTLES_PER_PAGE)));
const currentBottlePage = computed(() => Math.min(bottlePage.value, bottlePages.value));
const visibleBottles = computed(() => matchingBottles.value.slice((currentBottlePage.value - 1) * BOTTLES_PER_PAGE, currentBottlePage.value * BOTTLES_PER_PAGE));
watch([bottleSearch, () => game.regionId, stockCategory], () => { bottlePage.value = 1; });
const targetRegions = computed(() => REGIONS.filter((region) => region.id !== game.regionId && game.isBarOwned(region.id)));
const barUnits = (id: RegionId) => game.inventories[id].reduce((sum, stock) => sum + stock.amount, 0);
const barBottles = (id: RegionId) => game.bottleInventories[id].reduce((sum, stock) => sum + stock.quantity, 0);
const recipeCardInventory = computed(() => RECIPES.map((recipe) => ({ recipe, quantity: game.recipeCopies[recipe.id] ?? 0 })).filter((item) => item.quantity > 0));

</script>
<template>
<article class="game-panel inventory-deck">
      <PanelHeading :eyebrow="`STOCK ROOM · ${game.region.name}`" title="Bar inventories" :aside="`${game.inventory.length} ingredients · ${game.bottleInventory.length} sealed brands`" />
      <div class="bar-switcher" aria-label="Choose a bar inventory">
        <button v-for="region in REGIONS.filter(item => game.isBarOwned(item.id))" :key="region.id" :class="{ active: region.id === game.regionId }" type="button" @click="game.switchBar(region.id)"><b>{{ region.name }}</b><small>{{ barUnits(region.id).toLocaleString() }} ingredient units · {{ barBottles(region.id) }} bottles</small></button>
      </div>
      <div class="inventory-tools">
        <div class="category-tabs inventory-filter">
          <button v-for="tab in stockTabs" :key="tab.id" :class="{ active: stockCategory === tab.id }" type="button" @click="stockCategory = tab.id">{{ tab.label }}</button>
        </div>
        <div v-if="targetRegions.length" class="transfer-console">
          <div><small>MOVE BETWEEN BARS</small><b>Stock transfer</b></div>
          <OptionSelect label="Ingredient" v-model="transferIngredientId" :options="INGREDIENTS.map((ingredient) => ({ value: ingredient.id, label: ingredient.name }))" />
          <UiIcon class="inline-icon" name="arrow-right" />
          <OptionSelect label="To bar" v-model="game.transferTargetId" :options="targetRegions.map((region) => ({ value: region.id, label: region.name }))" />
          <button type="button" @click="game.transferStock(transferIngredientId, game.transferTargetId)">Transfer {{ ingredientById(transferIngredientId).unit === 'ml' ? '100 ml' : '3 pcs' }}</button>
        </div>
        <p v-else class="transfer-locked">Unlock a second bar at level {{ game.barPurchaseLevel }} to rotate stock between locations.</p>
      </div>
      <WorkshopStock v-if="stockCategory === 'items' || stockCategory === 'shards'" :kind="stockCategory" />
      <div v-if="isStockKind" class="inventory-cards">
        <div v-for="stock in visibleStock" :key="stock.ingredientId" class="inventory-card">
          <BottleModel :ingredient="ingredientById(stock.ingredientId)" />
          <div><b>{{ ingredientById(stock.ingredientId).name }}</b><small>{{ stock.amount }} / {{ capacityOf(stock.ingredientId) }} {{ ingredientById(stock.ingredientId).unit }}<template v-if="isPerishable(ingredientById(stock.ingredientId))"> · fresh, spoils</template></small></div>
          <span>{{ uiCategory(ingredientById(stock.ingredientId)) }}</span>
          <em v-if="game.lowGrade[stock.ingredientId]?.damaged" class="grade damaged" title="Damaged: cocktails only">{{ game.lowGrade[stock.ingredientId]!.damaged }} damaged</em>
          <em v-if="game.lowGrade[stock.ingredientId]?.expiring" class="grade expiring" title="Close to its date: use it soon">{{ game.lowGrade[stock.ingredientId]!.expiring }} old</em>
        </div>
      </div>
      <DeliveryProblems />
      <section v-if="(stockCategory === 'all' || stockCategory === 'cards') && recipeCardInventory.length" class="recipe-item-inventory">
        <header><div><small>COLLECTIBLE ITEMS</small><h3>Recipe cards</h3></div><span>Duplicates are spent on mastery upgrades.</span></header>
        <div><article v-for="item in recipeCardInventory" :key="item.recipe.id"><GlassModel :art-index="RECIPES.indexOf(item.recipe)" :recipe-id="item.recipe.id" type="coupe" /><span><small>RECIPE ITEM</small><b>{{ item.recipe.name }}</b><em>Owned ×{{ item.quantity }}</em></span><strong>×{{ item.quantity }}</strong></article></div>
      </section>
      <section v-if="stockCategory === 'all' || stockCategory === 'spirit'" class="sealed-stock-section">
        <header><div><small>FULL-BOTTLE RETAIL</small><h3>Popular brands ready to sell</h3></div></header>
        <div class="bottle-inventory-tools">
          <UiInput v-model="bottleSearch" label="Find a bottle" placeholder="Search by name, brand or type" type="search" />
          <nav aria-label="Bottle inventory pages" class="bottle-pagination">
            <UiButton size="sm" variant="secondary" aria-label="Previous bottle page" :disabled="currentBottlePage === 1" @click="bottlePage = currentBottlePage - 1"><UiIcon name="arrow-left" /></UiButton>
            <span role="status">{{ currentBottlePage }} / {{ bottlePages }} · {{ matchingBottles.length }} brands</span>
            <UiButton size="sm" variant="secondary" aria-label="Next bottle page" :disabled="currentBottlePage === bottlePages" @click="bottlePage = currentBottlePage + 1"><UiIcon name="arrow-right" /></UiButton>
          </nav>
        </div>
        <p v-if="!matchingBottles.length">No bottles match your search.</p>
        <div class="sealed-stock-grid">
          <article v-for="stock in visibleBottles" :key="stock.productId">
            <div class="stock-brand-model"><BrandBottle :brand="bottleById(stock.productId).brand" :category="guideIdForProduct(bottleById(stock.productId))" :color="bottleById(stock.productId).color" /></div>
            <div><small>{{ ALCOHOL_TYPE_LABELS[bottleById(stock.productId).type] }} · {{ bottleById(stock.productId).abv }}% ABV</small><b>{{ bottleById(stock.productId).name }}</b><span>{{ bottleById(stock.productId).volumeMl }} ml · customer pays {{ (bottleById(stock.productId).price * game.economy.guestPriceFactor).toFixed(0) }} coins + <CrystalAmount :value="bottleSaleCrystalReward(bottleById(stock.productId))" /></span></div>
            <strong>{{ stock.quantity }}×</strong>
            <button v-if="game.bottleCrystalCost(stock.productId)" class="reserve-restock" type="button" :disabled="game.crystals < game.bottleCrystalCost(stock.productId)" @click="game.buyBottleStock(stock.productId)">+1 reserve · <CrystalAmount :value="game.bottleCrystalCost(stock.productId)" /></button>
          </article>
        </div>
      </section>
    </article>
</template>
<style scoped>
.bottle-inventory-tools { display:flex; flex-wrap:wrap; align-items:end; justify-content:space-between; gap:12px; margin:12px 0; }
.bottle-inventory-tools > :first-child { flex:1 1 240px; max-width:480px; }
.bottle-pagination { display:flex; align-items:center; gap:8px; }
.bottle-pagination span { font-size:.85rem; color:var(--muted, #a8b6c9); white-space:nowrap; }
</style>

