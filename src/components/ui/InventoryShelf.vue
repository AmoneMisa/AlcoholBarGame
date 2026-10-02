<script setup lang="ts">
import type { RewardLine } from '../../domain/rewards';
import RewardArt from './RewardArt.vue';
import UiButton from './UiButton.vue';
export interface ShelfEntry { key: string; line: RewardLine; count: number; fragments?: boolean }
defineProps<{ title: string; entries: ShelfEntry[] }>();
defineEmits<{ select: [key: string] }>();
</script>
<template>
  <section class="inventory-shelf">
    <h3>{{ title }}</h3>
    <div v-if="entries.length" class="shelf-grid">
      <UiButton v-for="entry in entries" :key="entry.key" variant="ghost" class="shelf-tile" :class="[entry.line.rarity, { fragment: entry.fragments }]" :aria-label="`${entry.line.text}, ${entry.count}${entry.fragments ? ' fragments' : ' owned'}`" @click="$emit('select', entry.key)">
        <span class="shelf-picture"><RewardArt :line="entry.line" /><span class="shelf-count">{{ entry.fragments ? '◈ ' : '' }}{{ entry.count }}</span></span>
        <span class="shelf-label">{{ entry.line.text }}</span>
      </UiButton>
    </div>
    <p v-else class="shelf-empty">Your collection will appear here.</p>
  </section>
</template>
<style>
.inventory-shelf { border: 1px solid #665441; border-radius: 12px; overflow: hidden; background: linear-gradient(145deg, #3b2b36, #211b2c); }
.inventory-shelf > h3 { margin: 0; padding: 12px; color: #eac998; font: 700 17px Georgia, serif; border-bottom: 1px solid #82675055; }
.shelf-grid { display: grid; grid-template-columns: repeat(5, minmax(0, 1fr)); gap: 0; }
.shelf-tile.ui-btn { min-width: 0; height: auto; min-height: 136px; padding: 12px 5px 16px; border: 0; border-bottom: 7px solid #85695a; border-radius: 0; background: linear-gradient(transparent 78%, #bd947c33); box-shadow: 0 3px 0 #160e21, inset 0 -1px #e5c9a5; }
.shelf-tile > .ui-btn-label { width: 100%; display: grid; gap: 6px; }
.shelf-picture { position: relative; display: block; height: 78px; width: 100%; border: 1px solid #9c8297; border-radius: 4px; background: linear-gradient(140deg, #493c59, #241d30); }
.shelf-tile.rare .shelf-picture { border-color: #8ccfdf; }
.shelf-tile.legendary .shelf-picture { border-color: #efcc86; background: linear-gradient(140deg, #716044, #362435); }
.shelf-count { position: absolute; right: -3px; bottom: -4px; min-width: 22px; padding: 2px 4px; border-radius: 4px; background: #352438ed; color: #ffe6c4; font: 700 14px Georgia, serif; text-shadow: 0 1px #000; }
.fragment .shelf-count { color: #95e6f0; }
.shelf-label { display: block; color: #eddfd3; font-size: 10px; line-height: 1.25; white-space: normal; overflow-wrap: anywhere; }
.shelf-empty { margin: 0; padding: 20px 12px; color: #b9a7b8; font-size: 12px; }
@media (max-width: 360px) { .shelf-grid { grid-template-columns: repeat(4, minmax(0, 1fr)); } }
</style>
