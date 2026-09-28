<script setup lang="ts">
import { computed, ref } from 'vue';
import { INGREDIENTS, RECIPES, REGIONS, SUPPLIERS } from '../../domain/catalog';
import type { Ingredient, RegionId } from '../../domain/types';
import { useGameStore } from '../../stores/game';
import BottleModel from '../cocktails/BottleModel.vue';
import GlassModel from '../cocktails/GlassModel.vue';
import CharacterModel from '../characters/CharacterModel.vue';
import PairingAdvisor from '../PairingAdvisor.vue';

withDefaults(defineProps<{ activeView?: string }>(), { activeView: 'inventory' });
const game = useGameStore();
const stockCategory = ref<'all' | 'spirit' | 'mixer' | 'fresh'>('all');
const marketCategory = ref<'all' | 'spirit' | 'mixer' | 'fresh'>('all');
const selectedRecipeId = ref<string | null>(null);
const transferIngredientId = ref(INGREDIENTS[0]!.id);
const colors = ['#dbe8b8', '#e87d64', '#b8e5df', '#efb84b'];

const ingredientById = (id: string) => INGREDIENTS.find((item) => item.id === id)!;
const uiCategory = (ingredient: Ingredient) => ingredient.category === 'spirit' ? 'spirit' : ingredient.category === 'mixer' && !['sugar-syrup', 'coconut-cream'].includes(ingredient.id) ? 'mixer' : 'fresh';
const visibleStock = computed(() => game.inventory.filter((stock) => stockCategory.value === 'all' || uiCategory(ingredientById(stock.ingredientId)) === stockCategory.value));
const supplierOffers = computed(() => game.market.filter((offer) => offer.supplierId === game.selectedSupplier && (marketCategory.value === 'all' || uiCategory(ingredientById(offer.ingredientId)) === marketCategory.value)));
const selectedRecipe = computed(() => RECIPES.find((recipe) => recipe.id === selectedRecipeId.value) ?? null);
const selectedRecipeIndex = computed(() => Math.max(0, RECIPES.findIndex((recipe) => recipe.id === selectedRecipeId.value)));
const targetRegions = computed(() => REGIONS.filter((region) => region.id !== game.regionId));
const barUnits = (id: RegionId) => game.inventories[id].reduce((sum, stock) => sum + stock.amount, 0);
const stockAmount = (ingredientId: string) => game.inventory.find((stock) => stock.ingredientId === ingredientId)?.amount ?? 0;
</script>

<template>
  <section class="management-deck">
    <article v-show="activeView === 'inventory'" class="game-panel inventory-deck">
      <header class="panel-heading"><div><small>STOCK ROOM · {{ game.region.name }}</small><h2>Bar inventories</h2></div><span>{{ game.inventory.length }} products</span></header>
      <div class="bar-switcher" aria-label="Choose a bar inventory">
        <button v-for="region in REGIONS" :key="region.id" :class="{ active: region.id === game.regionId }" type="button" @click="game.switchBar(region.id)"><b>{{ region.name }}</b><small>{{ barUnits(region.id).toLocaleString() }} units</small></button>
      </div>
      <div class="inventory-tools">
        <div class="category-tabs inventory-filter">
          <button v-for="category in ['all','spirit','mixer','fresh'] as const" :key="category" :class="{ active: stockCategory === category }" type="button" @click="stockCategory = category">{{ category === 'spirit' ? 'Spirits' : category === 'mixer' ? 'Mixers' : category === 'fresh' ? 'Fresh & food' : 'All' }}</button>
        </div>
        <div class="transfer-console">
          <div><small>MOVE BETWEEN BARS</small><b>Stock transfer</b></div>
          <select v-model="transferIngredientId" aria-label="Ingredient to transfer"><option v-for="ingredient in INGREDIENTS" :key="ingredient.id" :value="ingredient.id">{{ ingredient.name }}</option></select>
          <span>→</span>
          <select v-model="game.transferTargetId" aria-label="Destination bar"><option v-for="region in targetRegions" :key="region.id" :value="region.id">{{ region.name }}</option></select>
          <button type="button" @click="game.transferStock(transferIngredientId, game.transferTargetId)">Transfer {{ ingredientById(transferIngredientId).unit === 'ml' ? '100 ml' : '3 pcs' }}</button>
        </div>
      </div>
      <div class="inventory-cards">
        <div v-for="stock in visibleStock" :key="stock.ingredientId" class="inventory-card">
          <BottleModel :ingredient="ingredientById(stock.ingredientId)" />
          <div><b>{{ ingredientById(stock.ingredientId).name }}</b><small>{{ stock.amount }} {{ ingredientById(stock.ingredientId).unit }}</small></div>
          <span>{{ uiCategory(ingredientById(stock.ingredientId)) }}</span>
        </div>
      </div>
    </article>

    <article v-show="activeView === 'market'" class="game-panel suppliers-deck">
      <header class="panel-heading"><div><small>TRADE FLOOR · {{ game.region.name }}</small><h2>Buy and sell stock</h2></div><span>{{ game.region.currencySymbol }}{{ game.money.toFixed(2) }}</span></header>
      <div class="supplier-picker">
        <button v-for="(supplier, index) in SUPPLIERS" :key="supplier.id" :class="{ active: game.selectedSupplier === supplier.id }" type="button" @click="game.selectedSupplier = supplier.id">
          <span class="supplier-scene" :style="{ '--supplier-color': colors[index] }"><i></i><b>{{ index + 1 }}</b></span>
          <div><small>{{ supplier.deliveryDays }} DAY ROUTE</small><h3>{{ supplier.name }}</h3><p>{{ supplier.description }}</p><em>{{ '★'.repeat(supplier.reputation) }}{{ '☆'.repeat(5 - supplier.reputation) }}</em></div>
        </button>
      </div>
      <div class="category-tabs market-filter">
        <button v-for="category in ['all','spirit','mixer','fresh'] as const" :key="category" :class="{ active: marketCategory === category }" type="button" @click="marketCategory = category">{{ category === 'spirit' ? 'Spirits' : category === 'mixer' ? 'Mixers' : category === 'fresh' ? 'Fresh & food' : 'All offers' }}</button>
      </div>
      <div class="market-offer-grid">
        <article v-for="offer in supplierOffers" :key="offer.supplierId + offer.ingredientId" class="market-offer-card">
          <BottleModel :ingredient="ingredientById(offer.ingredientId)" />
          <div class="offer-copy"><small>{{ offer.quality }} · pack of {{ offer.quantity }} {{ ingredientById(offer.ingredientId).unit }}</small><h3>{{ ingredientById(offer.ingredientId).name }}</h3><span>In {{ game.region.name }}: {{ stockAmount(offer.ingredientId) }} {{ ingredientById(offer.ingredientId).unit }}</span></div>
          <strong>{{ game.region.currencySymbol }}{{ offer.price.toFixed(2) }}</strong>
          <div class="trade-actions"><button type="button" @click="game.buy(offer)">Buy pack</button><button type="button" class="sell-button" :disabled="stockAmount(offer.ingredientId) <= 0" @click="game.sell(offer.ingredientId)">Sell some</button></div>
        </article>
      </div>
      <div class="trade-log"><small>RECENT TRADES</small><span v-for="entry in game.tradeLog.slice(0, 3)" :key="entry">{{ entry }}</span></div>
    </article>

    <article v-show="activeView === 'recipes'" class="game-panel recipes-deck">
      <template v-if="!selectedRecipe">
        <header class="panel-heading"><div><small>RECIPE BOOK</small><h2>Stories, methods & moments</h2></div><span>{{ RECIPES.length }} learned</span></header>
        <div class="recipe-cards">
          <button v-for="(recipe, index) in RECIPES" :key="recipe.id" type="button" @click="selectedRecipeId = recipe.id">
            <GlassModel :type="index % 3 === 0 ? 'highball' : index % 3 === 1 ? 'coupe' : 'rocks'" :art-index="index % 10" />
            <div class="recipe-card-copy"><small>{{ recipe.origin }}</small><b>{{ recipe.name }}</b><p>{{ recipe.story }}</p><span>{{ recipe.ingredients.length }} ingredients · {{ recipe.needsShake ? 'Shake' : 'Build / stir' }}</span><em>Open recipe →</em></div>
          </button>
        </div>
      </template>
      <template v-else>
        <header class="panel-heading recipe-detail-heading"><button type="button" @click="selectedRecipeId = null">← All recipes</button><div><small>{{ selectedRecipe.category }} · {{ selectedRecipe.origin }}</small><h2>{{ selectedRecipe.name }}</h2></div><span>{{ game.region.currencySymbol }}{{ (selectedRecipe.price * game.region.marketFactor).toFixed(2) }}</span></header>
        <div class="recipe-detail-page">
          <aside class="recipe-hero-art"><GlassModel :art-index="selectedRecipeIndex" type="coupe" /><div><small>TASTING PROFILE</small><span v-for="note in selectedRecipe.tastingNotes" :key="note">{{ note }}</span></div></aside>
          <section class="recipe-story"><small>THE STORY</small><h3>A drink with a past</h3><p>{{ selectedRecipe.story }}</p><div class="occasion-block"><small>WHEN IT IS A GOOD CHOICE</small><div><span v-for="occasion in selectedRecipe.occasions" :key="occasion">{{ occasion }}</span></div></div></section>
          <section class="recipe-formula"><small>WHAT YOU NEED</small><h3>Bar formula</h3><div v-for="part in selectedRecipe.ingredients" :key="part.ingredientId"><BottleModel :ingredient="ingredientById(part.ingredientId)" /><b>{{ ingredientById(part.ingredientId).name }}</b><span>{{ part.amount }} {{ ingredientById(part.ingredientId).unit }}</span></div></section>
          <section class="recipe-method"><small>COOKING PATH</small><h3>{{ selectedRecipe.needsShake ? 'Shake and serve' : 'Build with control' }}</h3><ol><li v-for="(step, index) in selectedRecipe.method" :key="step"><b>{{ index + 1 }}</b><span>{{ step }}</span></li></ol></section>
        </div>
      </template>
    </article>

    <article v-show="activeView === 'design'" class="game-panel design-deck">
      <header class="panel-heading"><div><small>PERSONALIZE</small><h2>Bar & bartender</h2></div><span>Live preview</span></header>
      <div class="design-grid-new">
        <div class="mini-interior" :data-wall="game.decor.wall"><span></span><b>THE VELVET HOUR</b><i></i></div>
        <div class="bartender-custom"><CharacterModel role="bartender" character-id="noa" :outfit="game.decor.bartender" /><div><button v-for="outfit in ['vest','shirt','apron']" :key="outfit" :class="{ active: game.decor.bartender === outfit }" @click="game.decor.bartender = outfit">{{ outfit }}</button></div></div>
        <div class="design-options"><small>WALL MOOD</small><button v-for="wall in ['neon','burgundy','emerald']" :key="wall" :class="{ active: game.decor.wall === wall }" @click="game.decor.wall = wall"><i :data-color="wall"></i>{{ wall }}</button></div>
      </div>
    </article>

    <article v-show="activeView === 'regions'" class="game-panel regions-deck">
      <header class="panel-heading"><div><small>WORLD TOUR</small><h2>Choose your active bar</h2></div><span>{{ game.region.tagline }}</span></header>
      <div class="world-map-art"><span v-for="(region, index) in REGIONS" :key="region.id" :class="{ active: region.id === game.regionId }" :style="{ '--x': 10 + index * 15 + '%', '--y': 30 + (index % 3) * 19 + '%' }"></span></div>
      <div class="region-cards"><button v-for="region in REGIONS" :key="region.id" :class="{ active: region.id === game.regionId }" @click="game.switchBar(region.id)"><b>{{ region.name }}</b><small>{{ region.tagline }}</small><span>{{ region.currencySymbol }} · {{ region.marketFactor }}× · {{ barUnits(region.id).toLocaleString() }} stock</span></button></div>
    </article>

    <PairingAdvisor v-show="activeView === 'advisor'" />
  </section>
</template>
