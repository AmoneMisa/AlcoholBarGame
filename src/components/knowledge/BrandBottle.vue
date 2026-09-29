<script setup lang="ts">
import { computed, useId } from 'vue';
import { bottlePath, LABEL_BOX, labelText, lookFor } from '../../data/knowledge/brandModels';

// A brand's bottle drawn as vector art: category silhouette + the brand's own colours and name.
const props = defineProps<{ brand: string; category: string; color?: string }>();
const uid = useId();
const look = computed(() => lookFor(props.brand, props.category, props.color));
const path = computed(() => bottlePath(look.value.shape));
const box = computed(() => LABEL_BOX[look.value.shape]);
const text = computed(() => labelText(props.brand));
const fontSize = computed(() => Math.min(7, (box.value.w - 3) / Math.max(4, text.value.length) * 1.75));
</script>

<template>
  <svg class="brand-bottle" viewBox="0 0 60 120" role="img" :aria-label="`${brand} bottle`">
    <defs>
      <linearGradient :id="`${uid}-shade`" x1="0" x2="1">
        <stop offset="0" stop-color="#fff" stop-opacity=".32" /><stop offset=".25" stop-color="#fff" stop-opacity=".05" />
        <stop offset=".6" stop-color="#000" stop-opacity="0" /><stop offset="1" stop-color="#000" stop-opacity=".45" />
      </linearGradient>
      <clipPath :id="`${uid}-clip`"><path :d="path" /></clipPath>
    </defs>
    <ellipse cx="30" cy="117" rx="18" ry="2.5" fill="#000" opacity=".35" />
    <path :d="path" :fill="look.glass" :opacity="look.frosted ? .88 : 1" stroke="#0008" stroke-width=".8" />
    <g :clip-path="`url(#${uid}-clip)`">
      <!-- cap / foil -->
      <rect x="0" y="0" width="60" :height="look.shape === 'champagne' ? 38 : look.shape === 'can' ? 38 : look.shape === 'soju' ? 32 : look.shape === 'squat' ? 22 : 16" :fill="look.cap" />
      <!-- label -->
      <rect v-if="look.labelStyle === 'band'" x="0" :y="box.y + box.h / 2 - 7" width="60" height="14" :fill="look.label" />
      <ellipse v-else-if="look.labelStyle === 'oval'" cx="30" :cy="box.y + box.h / 2" :rx="box.w / 2" :ry="box.h / 2" :fill="look.label" stroke="#0004" stroke-width=".6" />
      <path v-else-if="look.labelStyle === 'shield'" :d="`M${30 - box.w / 2} ${box.y} H${30 + box.w / 2} V${box.y + box.h * .7} L30 ${box.y + box.h} L${30 - box.w / 2} ${box.y + box.h * .7} Z`" :fill="look.label" stroke="#0004" stroke-width=".6" />
      <rect v-else :x="30 - box.w / 2" :y="box.y" :width="box.w" :height="box.h" rx="2" :fill="look.label" stroke="#0004" stroke-width=".6" />
      <text x="30" :y="box.y + box.h / 2 + fontSize / 3" text-anchor="middle" :font-size="fontSize" font-weight="800" font-family="Georgia, serif" :fill="look.ink" letter-spacing=".2">{{ text }}</text>
      <rect x="0" y="0" width="60" height="120" :fill="`url(#${uid}-shade)`" />
      <path d="M17 44 V104" stroke="#fff" stroke-opacity=".35" stroke-width="2" stroke-linecap="round" />
    </g>
  </svg>
</template>

<style scoped>
.brand-bottle { display: block; width: 100%; height: 100%; filter: drop-shadow(0 6px 6px #0008); }
</style>
