<script setup lang="ts">
import { computed } from 'vue';
import { INGREDIENTS } from '../domain/catalog';
import { requiredRecipe } from '../domain/engine';
import { useGameStore } from '../stores/game';
import { haptic } from '../telegram/webapp';
import CharacterModel from './CharacterModel.vue';

const game = useGameStore();
const recipe = computed(() => requiredRecipe(game.customer));
function serve() { haptic('medium'); game.serve(); }
</script>

<template>
  <section class="bar-stage" :data-wall="game.decor.wall" :data-counter="game.decor.counter">
    <div class="back-wall"><div class="shelf"><span v-for="n in 10" :key="n" class="bottle-model"><i></i></span></div></div>
    <div class="customer-zone" :key="game.customer.id">
      <CharacterModel role="customer" :mood="game.customer.mood" />
      <div class="speech"><b>{{ game.customer.name }}</b><span>{{ game.customer.greeting }} {{ game.customer.request }}</span></div>
    </div>
    <div class="bartender-zone"><CharacterModel role="bartender" :outfit="game.decor.bartender" /></div>
    <div class="counter-face">BARLINGO</div>
    <div class="shaker" :class="{ active: game.serving }"><span></span></div>
  </section>

  <section class="work-grid">
    <article class="panel">
      <div class="panel-heading"><h2>Make the drink</h2><span>Read → match → serve</span></div>
      <h3 class="recipe-name">{{ recipe.name }}</h3>
      <div class="ingredient-grid">
        <div v-for="part in recipe.ingredients" :key="part.ingredientId" class="ingredient-card">
          <span class="mini-bottle"></span>
          <b>{{ INGREDIENTS.find((x) => x.id === part.ingredientId)?.name }}</b>
          <small>{{ part.amount }} {{ INGREDIENTS.find((x) => x.id === part.ingredientId)?.unit }}</small>
        </div>
      </div>
      <button class="primary" :disabled="game.serving" @click="serve">{{ game.serving ? 'Mixing…' : 'Serve drink' }}</button>
    </article>

    <article class="panel">
      <div class="panel-heading"><h2>Inventory</h2><span>live stock</span></div>
      <div class="stock-list">
        <div v-for="stock in game.inventory" :key="stock.ingredientId" class="stock-row">
          <span>{{ INGREDIENTS.find((x) => x.id === stock.ingredientId)?.name }}</span>
          <progress :value="Math.min(stock.amount, 500)" max="500"></progress><b>{{ Math.max(0, stock.amount).toFixed(0) }}</b>
        </div>
      </div>
    </article>
  </section>
</template>
