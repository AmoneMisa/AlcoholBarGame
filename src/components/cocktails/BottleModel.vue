<script setup lang="ts">
import { computed } from 'vue';
import type { Ingredient } from '../../domain/types';

const props = defineProps<{ ingredient: Ingredient; active?: boolean; amount?: number }>();
const bottleOrder = ['white-rum', 'dark-rum', 'gin', 'vodka', 'tequila', 'whiskey', 'orange-liqueur', 'vermouth', 'lime-juice', 'cranberry-juice', 'soda', 'tonic'];
const ingredientOrder = ['lime-juice', 'lemon-juice', 'pineapple-juice', 'cranberry-juice', 'sugar-syrup', 'mint', 'ice', 'coconut-cream'];
const ingredientIndex = computed(() => ingredientOrder.indexOf(props.ingredient.id));
const bottleIndex = computed(() => {
  const direct = bottleOrder.indexOf(props.ingredient.id);
  if (direct >= 0) return direct;
  if (props.ingredient.id === 'cola') return 10;
  return 11;
});
const gridPosition = (index: number, columns: number, rows: number) => {
  const column = index % columns;
  const row = Math.floor(index / columns);
  const x = columns === 1 ? 50 : (column / (columns - 1)) * 100;
  const y = rows === 1 ? 50 : (row / (rows - 1)) * 100;
  return `${x}% ${y}%`;
};
const spriteStyle = computed(() => ingredientIndex.value >= 0 ? ({
  backgroundImage: "url('/assets/drinks/ingredients/velvet-ingredients-v2.png')",
  backgroundSize: '400% 200%',
  backgroundPosition: gridPosition(ingredientIndex.value, 4, 2)
}) : ({
  backgroundImage: "url('/assets/drinks/bottles/velvet-bottles-v2.png')",
  backgroundSize: '400% 300%',
  backgroundPosition: gridPosition(bottleIndex.value, 4, 3)
}));
</script>

<template>
  <div class="bottle-visual painted-model" :class="[{ active }, ingredientIndex >= 0 ? 'ingredient-model' : 'bottle-model-painted']" aria-hidden="true">
    <span class="model-sprite" :style="spriteStyle"></span>
    <b v-if="amount">{{ amount }}</b>
  </div>
</template>
