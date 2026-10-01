<script setup lang="ts">
import { computed, ref, watch } from 'vue';

// The picture of an item, a box, a piece of equipment, a keepsake, an achievement or a person of the Circle. The art lives in
// public/assets/workshop/<folder>/<id>.webp (see the README there). If a picture is missing or fails to load, the emoji from
// the game data is shown instead, so there is never a broken image.
const FOLDER = { box: 'boxes', item: 'items', equipment: 'equipment', keepsake: 'keepsakes', achievement: 'achievements', companion: 'companions' } as const;
const props = withDefaults(defineProps<{ kind: keyof typeof FOLDER; id: string; fallback: string; size?: number }>(), { size: 40 });
const failed = ref(false);
watch(() => [props.kind, props.id], () => { failed.value = false; });
const src = computed(() => `${import.meta.env.BASE_URL}assets/workshop/${FOLDER[props.kind]}/${props.id}.webp`);
</script>

<template>
  <img v-if="!failed" class="item-art" :src="src" alt="" :width="size" :height="size" decoding="async" @error="failed = true" />
  <span v-else class="item-art-emoji" aria-hidden="true" :style="{ fontSize: size * 0.7 + 'px' }">{{ fallback }}</span>
</template>

<style>
.item-art { display: inline-block; flex: none; object-fit: contain; vertical-align: middle; }
.item-art-emoji { display: inline-grid; place-items: center; line-height: 1; }
</style>
