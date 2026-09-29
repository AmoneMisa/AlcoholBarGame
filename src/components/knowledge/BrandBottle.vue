<script setup lang="ts">
import { computed } from 'vue';
import { brandBottleArtIndex, paintedBottleSpriteStyle } from '../../domain/bottleArt';

const props = defineProps<{ brand: string; category: string; color?: string }>();
const spriteStyle = computed(() => paintedBottleSpriteStyle(brandBottleArtIndex(props.brand, props.category)));
</script>

<template>
  <span class="brand-bottle painted-brand-bottle" role="img" :aria-label="`${brand} bottle`">
    <i :style="spriteStyle"></i>
  </span>
</template>

<style scoped>
.brand-bottle { position: relative; display: block; width: 100%; height: 100%; filter: drop-shadow(0 7px 7px #0009); }
.brand-bottle i { position: absolute; top: 50%; left: 50%; display: block; width: 150%; aspect-ratio: 1; background-repeat: no-repeat; transform: translate(-50%,-50%); }
</style>
