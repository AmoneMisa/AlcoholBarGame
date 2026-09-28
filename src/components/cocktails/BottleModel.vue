<script setup lang="ts">
import { computed } from 'vue';
import type { Ingredient } from '../../domain/types';

const props = defineProps<{ ingredient: Ingredient; active?: boolean; amount?: number }>();
const family = computed(() => {
  if (props.ingredient.id.includes('rum')) return 'rum';
  if (props.ingredient.id.includes('whiskey')) return 'whiskey';
  if (props.ingredient.id.includes('gin')) return 'gin';
  if (props.ingredient.id.includes('vodka')) return 'vodka';
  if (props.ingredient.id.includes('tequila')) return 'tequila';
  if (props.ingredient.category === 'fruit') return 'juice';
  if (props.ingredient.category === 'herb') return 'herb';
  if (props.ingredient.category === 'garnish') return 'ice';
  return 'mixer';
});
const initials = computed(() => props.ingredient.name.split(' ').map((word) => word[0]).join('').slice(0, 2));
</script>

<template>
  <div class="bottle-visual" :class="[`family-${family}`, { active }]" aria-hidden="true">
    <span class="bottle-cap"></span><span class="bottle-neck"></span><span class="bottle-body"><i>{{ initials }}</i></span>
    <b v-if="amount">{{ amount }}</b>
  </div>
</template>
