<script setup lang="ts">
import { INGREDIENTS, REGIONS, SUPPLIERS } from './domain/catalog';
import { useGameStore } from './stores/game';
import BarScene from './components/BarScene.vue';
import CharacterModel from './components/CharacterModel.vue';
import PairingAdvisor from './components/PairingAdvisor.vue';
import { haptic } from './telegram/webapp';

const game = useGameStore();
const scenarios = [
  ['This drink is too strong!', 'Make a new one'],
  ['I’m really upset today…', 'Suggest a drink'],
  ['I want the most expensive whiskey you have.', 'Show premium options'],
  ['Hurry up! I’ve been waiting too long!', 'Apologize']
];
</script>

<template>
  <div class="app-shell dashboard-app">
    <header class="game-header">
      <div class="profile-card"><div class="cat-avatar">🐱</div><div><strong>Whisker Bar</strong><span>Lv. {{ game.level }} · ★★★★★</span></div></div>
      <div class="resource-strip"><div>🪙 <b>{{ game.money.toFixed(0) }}</b></div><div>💎 <b>{{ game.gems }}</b></div><div>⚡ <b>{{ game.energy }}/100</b></div></div>
      <div class="clock-card"><b>Mon, Week {{ game.week }}</b><span>21:35</span></div>
      <button class="icon-button">⚙️</button>
    </header>

    <main class="dashboard-shell">
      <div class="status-line">{{ game.message }}</div>
      <BarScene />

      <section class="management-row top-row">
        <article class="panel inventory-panel">
          <div class="panel-title-row"><h2>Inventory</h2><span>📦 stock</span></div>
          <div class="filter-tabs"><button class="active">All</button><button>Spirits</button><button>Mixers</button><button>Fruits</button></div>
          <div class="inventory-grid">
            <div v-for="stock in game.inventory.slice(0, 12)" :key="stock.ingredientId" class="inventory-item">
              <span>{{ INGREDIENTS.find((i) => i.id === stock.ingredientId)?.category === 'spirit' ? '🍾' : INGREDIENTS.find((i) => i.id === stock.ingredientId)?.category === 'fruit' ? '🍊' : INGREDIENTS.find((i) => i.id === stock.ingredientId)?.category === 'herb' ? '🌿' : INGREDIENTS.find((i) => i.id === stock.ingredientId)?.category === 'garnish' ? '🧊' : '🥤' }}</span>
              <b>{{ Math.round(stock.amount / (INGREDIENTS.find((i) => i.id === stock.ingredientId)?.unit === 'ml' ? 45 : 1)) }}x</b>
              <small>{{ INGREDIENTS.find((i) => i.id === stock.ingredientId)?.name }}</small>
            </div>
          </div>
        </article>

        <article class="panel suppliers-panel">
          <div class="filter-tabs wide"><button class="active">Suppliers</button><button>Market prices</button><button>Special offers</button></div>
          <div class="supplier-list">
            <div v-for="supplier in SUPPLIERS" :key="supplier.id" class="supplier-row">
              <div class="supplier-art">{{ supplier.id === 'fresh' ? '🥬' : '🚚' }}</div>
              <div><b>{{ supplier.name }}</b><small>{{ supplier.description }}</small><span>🚚 {{ supplier.deliveryDays }} days · {{ '★'.repeat(supplier.reputation) }}</span></div>
              <button @click="game.selectedSupplier = supplier.id">Select</button>
            </div>
          </div>
        </article>

        <article class="panel recipes-panel">
          <div class="panel-title-row"><h2>Recipes</h2><span>{{ game.filteredRecipes.length }} known</span></div>
          <div class="filter-tabs">
            <button :class="{ active: game.recipeCategory === 'all' }" @click="game.recipeCategory = 'all'">All</button>
            <button :class="{ active: game.recipeCategory === 'classic' }" @click="game.recipeCategory = 'classic'">Classic</button>
            <button :class="{ active: game.recipeCategory === 'cocktail' }" @click="game.recipeCategory = 'cocktail'">Cocktails</button>
          </div>
          <div class="recipe-grid"><button v-for="recipe in game.filteredRecipes" :key="recipe.id" class="recipe-tile"><span>🍸</span><b>{{ recipe.name }}</b></button></div>
        </article>
      </section>

      <section class="management-row bottom-row">
        <article class="panel customization-panel">
          <div class="panel-title-row"><h2>Bar Customization</h2><span>Interior</span></div>
          <div class="custom-preview" :data-wall="game.decor.wall"><div>BAR</div><i></i></div>
          <div class="choice-row"><button :class="{ active: game.decor.wall === 'neon' }" @click="game.decor.wall = 'neon'">Neon</button><button :class="{ active: game.decor.wall === 'burgundy' }" @click="game.decor.wall = 'burgundy'">Classic</button><button :class="{ active: game.decor.wall === 'emerald' }" @click="game.decor.wall = 'emerald'">Green</button></div>
        </article>

        <article class="panel bartender-panel">
          <div class="panel-title-row"><h2>Bartender</h2><span>Customize</span></div>
          <div class="bartender-preview"><CharacterModel role="bartender" :outfit="game.decor.bartender" /></div>
          <div class="choice-row"><button @click="game.decor.bartender = 'vest'">Vest</button><button @click="game.decor.bartender = 'shirt'">Shirt</button><button @click="game.decor.bartender = 'apron'">Apron</button></div>
        </article>

        <article class="panel region-panel">
          <div class="panel-title-row"><h2>Choose your region</h2><span>{{ game.region.tagline }}</span></div>
          <div class="world-map"><span v-for="region in REGIONS" :key="region.id" :class="{ active: region.id === game.regionId }">📍 {{ region.name }}</span></div>
          <div class="region-grid"><button v-for="region in REGIONS" :key="region.id" :class="{ active: region.id === game.regionId }" @click="game.regionId = region.id"><b>{{ region.name }}</b><small>{{ region.tagline }}</small></button></div>
        </article>

        <article class="panel scenarios-panel">
          <div class="panel-title-row"><h2>Example scenarios</h2><span>A0 service English</span></div>
          <div class="scenario-list"><div v-for="scenario in scenarios" :key="scenario[0]" class="scenario-row"><span>🙂</span><div><b>{{ scenario[0] }}</b><button>{{ scenario[1] }}</button></div></div></div>
        </article>
      </section>

      <PairingAdvisor />

      <section class="market-strip panel">
        <div class="panel-title-row"><h2>Quick restock</h2><span>Regional market prices</span></div>
        <div class="market-offers"><button v-for="offer in game.market.slice(0, 8)" :key="offer.supplier + offer.ingredientId" @click="haptic(); game.buy(offer)"><b>{{ INGREDIENTS.find((i) => i.id === offer.ingredientId)?.name }}</b><span>{{ offer.supplier }}</span><strong>{{ game.region.currencySymbol }}{{ offer.price.toFixed(2) }}</strong></button></div>
      </section>

      <button class="next-day-button" @click="game.nextDay()">🌙 Finish shift / next day</button>
    </main>
  </div>
</template>
