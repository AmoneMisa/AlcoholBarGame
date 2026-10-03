<script setup lang="ts">
import { computed } from 'vue';
import { thumbnailArtwork } from '../../domain/optimizedArtwork';
const props = withDefaults(defineProps<{series:string;tier:number;size?:number}>(),{size:64});
const src = computed(()=>thumbnailArtwork(`${import.meta.env.BASE_URL}assets/workshop/achievements/${props.series}-tier-${Math.max(1,Math.min(4,Math.floor(props.tier)))}.webp`, props.size <= 48 ? 96 : 192, import.meta.env.BASE_URL));
</script>
<template><img class="achievement-art" :src="src" alt="" :width="size" :height="size" loading="lazy" decoding="async" /></template>
<style>.achievement-art{display:inline-block;flex:none;object-fit:contain;vertical-align:middle;}</style>
