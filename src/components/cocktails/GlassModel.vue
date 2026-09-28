<script setup lang="ts">
import { computed } from 'vue';
const props = withDefaults(defineProps<{ type?: 'rocks' | 'highball' | 'collins' | 'coupe' | 'martini' | 'wine' | 'flute' | 'beer' | 'shot' | 'tiki'; fill?: number; color?: string; ice?: number; garnish?: string; bubbles?: boolean; animation?: string; artIndex?: number }>(), { type: 'highball', fill: 0, color: '#e7b64f', ice: 0, garnish: '' });
const clampedFill = computed(() => `${Math.max(0, Math.min(92, props.fill))}%`);
const liquidStyle = computed(() => ({ height: clampedFill.value, '--liquid-color': props.color }));
const artStyle = computed(() => {
  if (props.artIndex === undefined) return {};
  const column = props.artIndex % 5;
  const row = Math.floor(props.artIndex / 5);
  return { backgroundPosition: `${(column / 4) * 100}% ${row * 100}%` };
});
</script>

<template>
  <div class="glass-model" :class="[`glass-${type}`, animation && `glass-${animation}`, artIndex !== undefined && 'glass-painted']">
    <div v-if="artIndex !== undefined" class="drink-art-sprite" :style="artStyle"></div>
    <div v-else class="glass-bowl">
      <span class="glass-rim"></span>
      <div class="glass-liquid" :style="liquidStyle">
        <span class="liquid-surface"></span><span class="liquid-shine"></span>
        <span v-if="bubbles" class="bubbles"><i></i><i></i><i></i></span>
      </div>
      <i v-for="n in Math.min(ice, 6)" :key="n" class="ice-cube" :style="{ '--n': n }"></i>
      <span v-if="garnish" class="garnish" :data-garnish="garnish"></span>
      <span class="glass-measures"><i></i><i></i><i></i></span>
    </div>
    <template v-if="artIndex === undefined"><span class="glass-stem"></span><span class="glass-foot"></span><span class="glass-shadow"></span></template>
  </div>
</template>
