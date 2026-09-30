<script setup lang="ts">
import { computed } from 'vue';
import PropThumb from '../props/PropThumb.vue';
const props = withDefaults(defineProps<{ type?: 'rocks' | 'highball' | 'collins' | 'coupe' | 'martini' | 'wine' | 'flute' | 'beer' | 'shot' | 'tiki'; fill?: number; color?: string; ice?: number; garnish?: string; bubbles?: boolean; animation?: string; artIndex?: number }>(), { type: 'highball', fill: 0, color: '#e7b64f', ice: 0, garnish: '' });
const thumbGarnish = computed(() => (props.garnish === 'mint' ? 'mint' : props.garnish ? 'lime' : '') as '' | 'mint' | 'lime');
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
    <PropThumb v-else :kind="`glass:${type}`" :fill="fill" :color="color" :ice="ice" :garnish="thumbGarnish" :label="type" />
  </div>
</template>
