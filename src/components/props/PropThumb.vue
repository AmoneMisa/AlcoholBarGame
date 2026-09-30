<script setup lang="ts">
// A still picture of a 3D prop (glass, orange, salt shaker), drawn once by the shared renderer and cached.
import { ref, watch } from 'vue';
import { propThumb, type ThumbRequest } from '../../domain/props3dThumbs';

const props = defineProps<{ kind: string; fill?: number; color?: string; ice?: number; garnish?: ThumbRequest['garnish']; size?: number; label?: string }>();
const url = ref('');
let ticket = 0;
watch(() => [props.kind, props.fill, props.color, props.ice, props.garnish, props.size], async () => {
  const mine = ++ticket;
  try {
    const image = await propThumb({ kind: props.kind, fill: props.fill, color: props.color, ice: props.ice, garnish: props.garnish, size: props.size });
    if (mine === ticket) url.value = image;
  } catch { if (mine === ticket) url.value = ''; }
}, { immediate: true });
</script>

<template>
  <img v-if="url" class="prop-thumb" :src="url" :alt="label ?? ''" draggable="false" />
  <span v-else class="prop-thumb prop-thumb-loading" aria-hidden="true"></span>
</template>

<style scoped>
.prop-thumb { display: block; width: 100%; height: 100%; object-fit: contain; pointer-events: none; }
</style>
