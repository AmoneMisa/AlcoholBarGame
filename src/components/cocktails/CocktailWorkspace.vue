<script setup lang="ts">
import { computed, ref } from 'vue';
import { INGREDIENTS } from '../../domain/catalog';
import { useGameStore } from '../../stores/game';
import { haptic } from '../../telegram/webapp';
import BottleModel from './BottleModel.vue';
import GlassModel from './GlassModel.vue';

const game = useGameStore();
const selectedIngredient = ref<string>();
const action = ref<'idle' | 'pouring' | 'shaking' | 'garnishing' | 'serving'>('idle');
const ingredients = computed(() => INGREDIENTS);
const totalAmount = computed(() => game.currentMix.reduce((sum, item) => sum + item.amount, 0));
const fill = computed(() => Math.min(88, (totalAmount.value / 190) * 88));
const liquidColor = computed(() => {
  if (game.currentMix.some((item) => item.ingredientId === 'cranberry-juice')) return '#d84962';
  if (game.currentMix.some((item) => item.ingredientId === 'cola')) return '#6f301d';
  if (game.currentMix.some((item) => item.ingredientId === 'pineapple-juice')) return '#f1b83d';
  return '#d9f0b1';
});
const ice = computed(() => game.currentMix.find((item) => item.ingredientId === 'ice')?.amount ?? 0);
const selected = computed(() => INGREDIENTS.find((item) => item.id === selectedIngredient.value));
const currentStep = computed(() => !game.currentMix.length ? 1 : !game.shaken && game.recipe.needsShake ? 2 : 3);

function pour(id: string) {
  selectedIngredient.value = id;
  action.value = id === 'mint' || id === 'ice' ? 'garnishing' : 'pouring';
  haptic('light');
  game.addIngredient(id);
  window.setTimeout(() => action.value = 'idle', 420);
}

function shake() {
  action.value = 'shaking';
  haptic('medium');
  game.shakeCurrentMix();
  window.setTimeout(() => action.value = 'idle', 580);
}

function serve() {
  action.value = 'serving';
  haptic('medium');
  game.serveMix();
  window.setTimeout(() => action.value = 'idle', 620);
}
</script>

<template>
  <section class="cocktail-workspace game-panel">
    <header class="panel-heading ornate-heading">
      <div><small>ORDER STATION</small><h2>Craft {{ game.recipe.name }}</h2></div>
      <span>Step {{ currentStep }} / 3</span>
    </header>
    <div class="workspace-main">
      <div class="ingredient-tray" aria-label="Ingredients">
        <button v-for="ingredient in ingredients" :key="ingredient.id" class="ingredient-button" :class="{ selected: selectedIngredient === ingredient.id }" type="button" @pointerdown.prevent="pour(ingredient.id)">
          <BottleModel :ingredient="ingredient" :active="selectedIngredient === ingredient.id" :amount="game.currentMix.find((item) => item.ingredientId === ingredient.id)?.amount" />
          <span>{{ ingredient.name }}</span><small>+{{ ingredient.pourStep }} {{ ingredient.unit }}</small>
        </button>
      </div>
      <div class="mixing-board">
        <div class="action-prop" :class="[`action-${action}`, { visible: selected && action !== 'idle' }]">
          <BottleModel v-if="selected" :ingredient="selected" />
        </div>
        <div class="shaker-prop" :class="{ active: action === 'shaking' }"><i></i></div>
        <div class="pour-stream" :class="{ active: action === 'pouring' }"></div>
        <GlassModel type="highball" :fill="fill" :color="liquidColor" :ice="ice" :garnish="game.currentMix.some((item) => item.ingredientId === 'mint') ? 'mint' : ''" :bubbles="game.currentMix.some((item) => item.ingredientId === 'soda')" :animation="action" />
        <div class="amount-readout"><b>{{ totalAmount }}</b><span>ml + garnish</span></div>
        <div class="recipe-progress">
          <div v-for="part in game.recipe.ingredients" :key="part.ingredientId" :class="{ done: game.currentMix.find((item) => item.ingredientId === part.ingredientId)?.amount === part.amount, wrong: (game.currentMix.find((item) => item.ingredientId === part.ingredientId)?.amount ?? 0) > part.amount }">
            <span>{{ INGREDIENTS.find((item) => item.id === part.ingredientId)?.name }}</span>
            <b>{{ game.currentMix.find((item) => item.ingredientId === part.ingredientId)?.amount ?? 0 }} / {{ part.amount }}</b>
          </div>
        </div>
      </div>
    </div>
    <footer class="workspace-actions">
      <button class="secondary-button" type="button" @click="game.resetMix">Clear</button>
      <button class="secondary-button" type="button" :class="{ active: action === 'shaking' }" @pointerdown.prevent="shake">Shake</button>
      <button class="primary-button" type="button" :disabled="game.serving" @pointerdown.prevent="serve">Serve drink <span>→</span></button>
    </footer>
  </section>
</template>
