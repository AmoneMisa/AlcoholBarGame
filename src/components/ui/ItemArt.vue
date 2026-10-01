<script setup lang="ts">
import { computed } from 'vue';

// The picture of an item, a box or a piece of equipment. If art exists in src/assets/items (see the README there) it is
// shown; otherwise the emoji from the game data is, so a missing picture never leaves a hole.
const props = withDefaults(defineProps<{ kind: 'box' | 'item' | 'equipment'; id: string; fallback: string; size?: number }>(), { size: 40 });
const found = import.meta.glob('../../assets/items/*.{webp,png}', { eager: true, query: '?url', import: 'default' }) as Record<string, string>;
const art = computed(() => Object.entries(found).find(([path]) => /\/([^/]+)\.(webp|png)$/.exec(path)?.[1] === `${props.kind}-${props.id}`)?.[1]);
</script>

<template>
  <img v-if="art" class="item-art" :src="art" alt="" :width="size" :height="size" decoding="async" />
  <span v-else class="item-art-emoji" aria-hidden="true">{{ fallback }}</span>
</template>

<style>
.item-art { display: inline-block; flex: none; object-fit: contain; vertical-align: middle; }
.item-art-emoji { display: inline-block; line-height: 1; }
</style>
