<script setup lang="ts">
import { computed } from 'vue';
const props = withDefaults(defineProps<{ type?: 'rocks' | 'highball' | 'collins' | 'coupe' | 'martini' | 'wine' | 'flute' | 'beer' | 'shot' | 'tiki'; fill?: number; color?: string; ice?: number; garnish?: string; bubbles?: boolean; animation?: string; artIndex?: number; recipeId?: string }>(), { type: 'highball', fill: 0, color: '#e7b64f', ice: 0, garnish: '' });
const newCocktailArt = new Set(['blue-lagoon', 'champagne-cocktail', 'tommys-margarita', 'batanga', 'rusty-nail', 'whiskey-smash', 'mamie-taylor', 'bronx', 'martinez', 'bijou', 'last-word', 'blue-hawaii', 'ti-punch', 'greyhound', 'queens-park-swizzle', 'singapore-sling']);
const hasArt = computed(() => props.artIndex !== undefined || (props.recipeId && newCocktailArt.has(props.recipeId)));
const clampedFill = computed(() => `${Math.max(0, Math.min(92, props.fill))}%`);
const liquidStyle = computed(() => ({ height: clampedFill.value, '--liquid-color': props.color }));
const artStyle = computed(() => {
  if (props.recipeId && newCocktailArt.has(props.recipeId)) return {
    backgroundImage: `url('${import.meta.env.BASE_URL}assets/drinks/cocktails/${props.recipeId}.webp')`,
    backgroundSize: 'contain',
    backgroundPosition: 'center'
  };
  if (props.artIndex === undefined) return {};
  const index = props.artIndex % 10;
  const column = index % 5;
  const row = Math.floor(index / 5);
  return { backgroundPosition: `${(column / 4) * 100}% ${row * 100}%` };
});
const garnishStyle = computed(() => {
  if (props.garnish === 'orange') return {
    backgroundImage: "url('/assets/drinks/ingredients/orange-garnish-v1.webp')",
    backgroundSize: 'contain',
    backgroundPosition: 'center'
  };
  const cells: Record<string, number> = { citrus: 0, 'lime-wedge': 0, 'pineapple-wedge': 2, mint: 5 };
  const index = cells[props.garnish];
  if (index === undefined) return {};
  const column = index % 4;
  const row = Math.floor(index / 4);
  return {
    backgroundImage: "url('/assets/drinks/ingredients/velvet-ingredients-v2.webp')",
    backgroundSize: '400% 200%',
    backgroundPosition: `${(column / 3) * 100}% ${row * 100}%`
  };
});
</script>

<template>
  <div class="glass-model" :class="[`glass-${type}`, animation && `glass-${animation}`, hasArt && 'glass-painted']">
    <div v-if="hasArt" class="drink-art-sprite" :style="artStyle"></div>
    <div v-else class="glass-live-art">
      <div class="glass-liquid" :style="liquidStyle">
        <span class="liquid-surface"></span><span class="liquid-shine"></span>
        <span v-if="bubbles" class="bubbles"><i></i><i></i><i></i></span>
      </div>
      <span v-if="ice" class="glass-ice-art" :style="{ '--ice-level': Math.min(ice, 6) }"></span>
      <span v-if="garnish" class="glass-garnish-art" :data-garnish="garnish" :style="garnishStyle"></span>
      <img class="glass-shell-art" src="/assets/drinks/glass/live-highball-v1.webp" alt="" draggable="false" />
      <span class="glass-measures"><i></i><i></i><i></i></span>
    </div>
  </div>
</template>
