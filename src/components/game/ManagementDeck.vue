<script setup lang="ts">
import { computed } from 'vue';
import { INGREDIENTS, RECIPES, REGIONS, SUPPLIERS } from '../../domain/catalog';
import { useGameStore } from '../../stores/game';
import BottleModel from '../cocktails/BottleModel.vue';
import GlassModel from '../cocktails/GlassModel.vue';
import CharacterModel from '../characters/CharacterModel.vue';
import PairingAdvisor from '../PairingAdvisor.vue';

withDefaults(defineProps<{ activeView?: string }>(), { activeView: 'inventory' });
const game = useGameStore();
const visibleStock = computed(() => game.inventory.slice(0, 12));
const colors = ['#dbe8b8', '#e87d64', '#b8e5df', '#efb84b', '#d84962'];
</script>

<template>
  <section class="management-deck">
    <article v-show="activeView === 'inventory'" class="game-panel inventory-deck">
      <header class="panel-heading"><div><small>STOCK ROOM</small><h2>Inventory</h2></div><span>{{ game.inventory.length }} / 200 slots</span></header>
      <div class="category-tabs"><button class="active">All</button><button>Spirits</button><button>Mixers</button><button>Fresh</button></div>
      <div class="inventory-cards">
        <div v-for="stock in visibleStock" :key="stock.ingredientId" class="inventory-card">
          <BottleModel v-if="INGREDIENTS.find((item) => item.id === stock.ingredientId)" :ingredient="INGREDIENTS.find((item) => item.id === stock.ingredientId)!" />
          <div><b>{{ INGREDIENTS.find((item) => item.id === stock.ingredientId)?.name }}</b><small>{{ stock.amount }} {{ INGREDIENTS.find((item) => item.id === stock.ingredientId)?.unit }}</small></div>
          <span>{{ Math.round(stock.amount / (INGREDIENTS.find((item) => item.id === stock.ingredientId)?.unit === 'ml' ? 45 : 1)) }}×</span>
        </div>
      </div>
    </article>

    <article v-show="activeView === 'market'" class="game-panel suppliers-deck">
      <header class="panel-heading"><div><small>DELIVERIES</small><h2>Trusted suppliers</h2></div><span>4 available</span></header>
      <div class="supplier-cards">
        <button v-for="(supplier, index) in SUPPLIERS" :key="supplier.id" :class="{ active: game.selectedSupplier === supplier.id }" type="button" @click="game.selectedSupplier = supplier.id">
          <span class="supplier-scene" :style="{ '--supplier-color': colors[index] }"><i></i><b>{{ index + 1 }}</b></span>
          <div><small>{{ supplier.deliveryDays }} DAY DELIVERY</small><h3>{{ supplier.name }}</h3><p>{{ supplier.description }}</p><em>{{ '★'.repeat(supplier.reputation) }}{{ '☆'.repeat(5 - supplier.reputation) }}</em></div>
          <strong>{{ game.selectedSupplier === supplier.id ? 'Selected' : 'Select' }}</strong>
        </button>
      </div>
    </article>

    <article v-show="activeView === 'recipes'" class="game-panel recipes-deck">
      <header class="panel-heading"><div><small>RECIPE BOOK</small><h2>House drinks</h2></div><span>{{ RECIPES.length }} learned</span></header>
      <div class="recipe-cards">
        <button v-for="(recipe, index) in RECIPES" :key="recipe.id" type="button">
          <GlassModel :type="index % 3 === 0 ? 'highball' : index % 3 === 1 ? 'coupe' : 'rocks'" :fill="74" :color="colors[index % colors.length]" :ice="index % 2 ? 3 : 0" :garnish="index % 2 ? 'citrus' : 'mint'" />
          <div><small>{{ recipe.category }}</small><b>{{ recipe.name }}</b><span>{{ recipe.ingredients.length }} ingredients · {{ recipe.needsShake ? 'Shake' : 'Build' }}</span></div>
        </button>
      </div>
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
      <header class="panel-heading"><div><small>WORLD TOUR</small><h2>Choose your city</h2></div><span>{{ game.region.tagline }}</span></header>
      <div class="world-map-art"><span v-for="(region, index) in REGIONS" :key="region.id" :class="{ active: region.id === game.regionId }" :style="{ '--x': 10 + index * 15 + '%', '--y': 30 + (index % 3) * 19 + '%' }"></span></div>
      <div class="region-cards"><button v-for="region in REGIONS" :key="region.id" :class="{ active: region.id === game.regionId }" @click="game.regionId = region.id"><b>{{ region.name }}</b><small>{{ region.tagline }}</small><span>{{ region.currencySymbol }} · {{ region.marketFactor }}×</span></button></div>
    </article>

    <PairingAdvisor v-show="activeView === 'advisor'" />
  </section>
</template>
