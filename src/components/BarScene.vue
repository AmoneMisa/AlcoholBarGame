<script setup lang="ts">
import { computed, onBeforeUnmount } from 'vue';
import { INGREDIENTS } from '../domain/catalog';
import { useGameStore } from '../stores/game';
import { haptic } from '../telegram/webapp';
import CharacterModel from './CharacterModel.vue';

const game = useGameStore();
const ingredientButtons = computed(() => INGREDIENTS.slice(0, 12));
const interval = window.setInterval(() => game.tickPatience(), 1000);
onBeforeUnmount(() => window.clearInterval(interval));

function add(id: string) {
  haptic('light');
  game.addIngredient(id);
}

function ratio(value: number, total: number) {
  return Math.max(0, Math.min(100, Math.round((value / total) * 100)));
}
</script>

<template>
  <section class="hero-grid">
    <div class="bar-stage dashboard-bar" :data-wall="game.decor.wall">
      <div class="bar-sign">🐱 <b>BAR</b></div>
      <div class="back-wall">
        <div class="shelf dashboard-shelf"><span v-for="n in 16" :key="'a'+n" class="bottle-model"><i></i></span></div>
        <div class="shelf dashboard-shelf second"><span v-for="n in 14" :key="'b'+n" class="bottle-model"><i></i></span></div>
      </div>

      <div class="customer-line">
        <button
          v-for="item in game.customers"
          :key="item.id"
          class="customer-card"
          :class="{ active: item.id === game.activeCustomerId }"
          @click="game.selectCustomer(item.id)"
        >
          <div class="speech compact">{{ item.request }}</div>
          <CharacterModel role="customer" :mood="item.mood" />
          <div class="customer-meta">
            <b>{{ item.name }}</b><small>{{ item.mood }}</small>
            <div class="patience-meter"><i :style="{ width: ratio(item.patienceRemaining, item.patience) + '%' }"></i></div>
          </div>
        </button>
      </div>

      <div class="dashboard-counter"><span v-for="n in 13" :key="n"></span></div>
    </div>

    <aside class="cocktail-panel panel">
      <div class="panel-title-row"><h2>Make the cocktail</h2><span>1 / 4</span></div>
      <div class="active-order">
        <CharacterModel role="customer" :mood="game.customer.mood" />
        <div><b>{{ game.customer.name }}</b><p>{{ game.customer.request }}</p>
          <div class="patience-meter"><i :style="{ width: ratio(game.customer.patienceRemaining, game.customer.patience) + '%' }"></i></div>
        </div>
      </div>

      <div class="maker-grid">
        <button v-for="ingredient in ingredientButtons" :key="ingredient.id" class="maker-item" @click="add(ingredient.id)">
          <span>{{ ingredient.category === 'spirit' ? '🍾' : ingredient.category === 'fruit' ? '🍋' : ingredient.category === 'herb' ? '🌿' : ingredient.category === 'garnish' ? '🧊' : '🥤' }}</span>
          <small>{{ ingredient.name }}</small>
          <em>{{ game.currentMix.find((item) => item.ingredientId === ingredient.id)?.amount ?? 0 }}</em>
        </button>
      </div>

      <div class="recipe-card">
        <h3>{{ game.recipe.name }}</h3>
        <div v-for="part in game.recipe.ingredients" :key="part.ingredientId">
          <span>{{ INGREDIENTS.find((i) => i.id === part.ingredientId)?.name }}</span>
          <b>{{ part.amount }} {{ INGREDIENTS.find((i) => i.id === part.ingredientId)?.unit }}</b>
        </div>
      </div>

      <div class="maker-actions">
        <button class="secondary" @click="game.resetMix()">Clear</button>
        <button class="secondary" @click="game.shakeCurrentMix()">Shake</button>
        <button class="serve-button" :disabled="game.serving" @click="game.serveMix()">✓ Serve</button>
      </div>
    </aside>
  </section>
</template>