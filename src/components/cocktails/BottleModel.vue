<script setup lang="ts">
import { computed } from 'vue';
import { ingredientBottleArtIndex, paintedBottleSpriteStyle } from '../../domain/bottleArt';
import type { Ingredient } from '../../domain/types';
import PropThumb from '../props/PropThumb.vue';

const props = defineProps<{ ingredient: Ingredient; active?: boolean; amount?: number }>();
// Every ingredient maps to exactly one picture: a bottle cell, an ingredient cell, or vector art.
const ingredientArt: Record<string, number> = {
  'lime-wedge': 0, 'pineapple-wedge': 2, mint: 5, ice: 6
};
const vectorFruit = ['orange', 'salt'];
const gridPosition = (index: number, columns: number, rows: number) => {
  const column = index % columns;
  const row = Math.floor(index / columns);
  const x = columns === 1 ? 50 : (column / (columns - 1)) * 100;
  const y = rows === 1 ? 50 : (row / (rows - 1)) * 100;
  return `${x}% ${y}%`;
};
const kind = computed(() => props.ingredient.unit === 'ml' ? 'bottle' : props.ingredient.id in ingredientArt ? 'ingredient' : 'vector');
const spriteStyle = computed(() => kind.value === 'ingredient' ? ({
  backgroundImage: "url('/assets/drinks/ingredients/velvet-ingredients-v2.webp')",
  backgroundSize: '400% 200%',
  backgroundPosition: gridPosition(ingredientArt[props.ingredient.id], 4, 2)
}) : paintedBottleSpriteStyle(ingredientBottleArtIndex(props.ingredient.id) ?? 0));
const modelClass = computed(() => kind.value === 'ingredient' || vectorFruit.includes(props.ingredient.id) ? 'ingredient-model' : 'bottle-model-painted');
</script>

<template>
  <div class="bottle-visual painted-model" :class="[{ active }, modelClass]" aria-hidden="true">
    <PropThumb v-if="kind === 'vector'" class="model-sprite" :kind="`item:${ingredient.id}`" :size="192" :label="ingredient.name" />
    <span v-else class="model-sprite" :style="spriteStyle"></span>
    <b v-if="amount">{{ amount }}</b>
  </div>
</template>
