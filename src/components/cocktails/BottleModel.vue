<script setup lang="ts">
import { computed } from 'vue';
import { ingredientBottleArtIndex, paintedBottleSpriteStyle } from '../../domain/bottleArt';
import type { Ingredient } from '../../domain/types';

const props = defineProps<{ ingredient: Ingredient; active?: boolean; amount?: number }>();
// Every ingredient maps to exactly one painted asset: a bottle cell, an ingredient cell, or a standalone WebP.
const ingredientArt: Record<string, number> = {
  'lime-wedge': 0, 'pineapple-wedge': 2, mint: 5, ice: 6
};
const standaloneArt: Record<string, string> = {
  orange: '/assets/drinks/ingredients/orange-garnish-v1.webp',
  salt: '/assets/drinks/ingredients/bar-salt-v1.webp'
};
const gridPosition = (index: number, columns: number, rows: number) => {
  const column = index % columns;
  const row = Math.floor(index / columns);
  const x = columns === 1 ? 50 : (column / (columns - 1)) * 100;
  const y = rows === 1 ? 50 : (row / (rows - 1)) * 100;
  return `${x}% ${y}%`;
};
const kind = computed(() => props.ingredient.category === 'food' ? 'food' : props.ingredient.unit === 'ml' ? 'bottle' : props.ingredient.id in ingredientArt ? 'ingredient' : 'standalone');
const spriteStyle = computed(() => {
  if (kind.value === 'food') return {
    backgroundImage: `url('${import.meta.env.BASE_URL}assets/drinks/food/${props.ingredient.id}.webp')`,
    backgroundSize: 'contain',
    backgroundPosition: 'center'
  };
  if (kind.value === 'ingredient') return {
    backgroundImage: "url('/assets/drinks/ingredients/velvet-ingredients-v2.webp')",
    backgroundSize: '400% 200%',
    backgroundPosition: gridPosition(ingredientArt[props.ingredient.id], 4, 2)
  };
  if (kind.value === 'standalone') return {
    backgroundImage: `url('${standaloneArt[props.ingredient.id]}')`,
    backgroundSize: 'contain',
    backgroundPosition: 'center'
  };
  return paintedBottleSpriteStyle(ingredientBottleArtIndex(props.ingredient.id) ?? 0);
});
const modelClass = computed(() => kind.value === 'bottle' ? 'bottle-model-painted' : kind.value === 'food' ? 'food-model' : 'ingredient-model');
</script>

<template>
  <div class="bottle-visual painted-model" :class="[{ active }, modelClass]" aria-hidden="true">
    <span class="model-sprite" :style="spriteStyle"></span>
    <b v-if="amount">{{ amount }}</b>
  </div>
</template>
