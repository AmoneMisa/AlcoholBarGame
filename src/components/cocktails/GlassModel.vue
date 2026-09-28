<script setup lang="ts">
import { computed } from 'vue';
const props = withDefaults(defineProps<{ type?: 'rocks' | 'highball' | 'collins' | 'coupe' | 'martini' | 'wine' | 'flute' | 'beer' | 'shot' | 'tiki'; fill?: number; color?: string; ice?: number; garnish?: string; bubbles?: boolean; animation?: string }>(), { type: 'highball', fill: 0, color: '#e7b64f', ice: 0, garnish: '' });
const clampedFill = computed(() => `${Math.max(0, Math.min(92, props.fill))}%`);
</script>

<template>
  <div class="glass-model" :class="[`glass-${type}`, animation && `glass-${animation}`]">
    <div class="glass-bowl">
      <div class="glass-liquid" :style="{ height: clampedFill, background: color }">
        <span v-if="bubbles" class="bubbles"></span>
      </div>
      <i v-for="n in Math.min(ice, 6)" :key="n" class="ice-cube" :style="{ '--n': n }"></i>
      <span v-if="garnish" class="garnish" :data-garnish="garnish"></span>
    </div>
    <span class="glass-stem"></span><span class="glass-foot"></span>
  </div>
</template>
