<script setup lang="ts">
import type { RewardLine } from '../../domain/rewards';
import RewardArt from './RewardArt.vue';
import LazyArtwork from './LazyArtwork.vue';
import UiButton from './UiButton.vue';
export interface ShelfEntry { key: string; line: RewardLine; count: number; fragments?: boolean }
defineProps<{ title: string; entries: ShelfEntry[] }>();
defineEmits<{ select: [key: string] }>();
</script>
<template>
  <section class="inventory-shelf">
    <h3>{{ title }}</h3>
    <div v-if="entries.length" class="shelf-grid">
      <UiButton v-for="entry in entries" :key="entry.key" variant="ghost" class="shelf-tile" :class="[entry.line.rarity, { fragment: entry.fragments }]" :title="`${entry.line.text}${entry.fragments ? ' fragments' : ''}`" :aria-label="`${entry.line.text}, ${entry.count}${entry.fragments ? ' fragments' : ' owned'}`" @click="$emit('select', entry.key)">
        <span class="shelf-picture"><LazyArtwork><RewardArt :line="entry.line" :fragments="entry.fragments" compact /></LazyArtwork><span class="shelf-count">{{ entry.count }}</span></span>
        <span class="shelf-label">{{ entry.line.text }}</span>
      </UiButton>
    </div>
    <p v-else class="shelf-empty">Your collection will appear here.</p>
  </section>
</template>
<style>
.inventory-shelf { min-width:0;padding:12px;border:1px solid #b9955359;border-radius:8px;background:#0b1320; background-image:linear-gradient(#0b132088,#0b132088),url('/assets/ui/lounge-panel-painted-v1.webp');background-position:center;background-size:cover;box-shadow:inset 0 0 0 3px #090d1455; }
.inventory-shelf > h3 { margin:0 0 12px;color:#eac998;font:700 16px Georgia,serif; }
.shelf-grid { display:grid;grid-template-columns:repeat(auto-fill,minmax(64px,72px));gap:5px;justify-content:start; }
.inventory-shelf .shelf-tile.ui-btn { position:relative;display:block;width:100%;height:auto;aspect-ratio:1;min-width:0;min-height:0;padding:3px;border:1px solid #827352;border-radius:2px;background:linear-gradient(145deg,#25332b,#0d1720);box-shadow:inset 0 0 6px #000b; }
.inventory-shelf .shelf-tile.ui-btn:hover,.inventory-shelf .shelf-tile.ui-btn:focus-visible { z-index:3;border-color:#f3d48a;background:#2a352e;box-shadow:0 0 8px #cfa95355; }
.inventory-shelf .shelf-tile .ui-btn-label { display:block;width:100%;height:100%; }
.shelf-picture { position:absolute;inset:3px;display:block;width:auto;height:auto;overflow:hidden;border:0;border-radius:0; }
.shelf-tile.rare { border-color:#77b8c9!important; }.shelf-tile.legendary { border-color:#e6bf70!important;background:linear-gradient(140deg,#51442a,#18212a)!important; }
.shelf-count { position:absolute;left:1px;top:1px;z-index:2;min-width:14px;padding:1px 3px;border-radius:2px;background:#111723d9;color:#ffe8c2;font:700 13px/1.2 system-ui;text-shadow:0 1px #000; }
.fragment .shelf-count { color:#96dfe8; }
.shelf-label { display:none;position:absolute;left:50%;bottom:calc(100% + 6px);transform:translateX(-50%);width:max-content;max-width:180px;padding:7px 9px;border:1px solid #b99553;border-radius:4px;background:#101722;color:#fff0d0;font:600 13px/1.35 system-ui;white-space:normal;pointer-events:none; }
.shelf-tile:hover .shelf-label,.shelf-tile:focus-visible .shelf-label { display:block; }
.shelf-empty { margin:0;padding:22px 0;color:#aeb8c4;font-size:13px; }
.shelf-picture .reward-art { position:absolute;inset:0; height:100%;max-height:100%;overflow:hidden; }
.shelf-picture .item-art { width:90%!important;height:90%!important; }
.shelf-picture .art-character { position:relative!important;inset:auto!important;transform:none!important;height:92%!important;width:auto!important;aspect-ratio:.572!important; }
@media(max-width:520px) { .shelf-grid { grid-template-columns:repeat(auto-fill,minmax(54px,1fr));gap:4px; }.inventory-shelf { padding:8px; }.shelf-label { display:none!important; } }
.inventory-shelf .shelf-tile {transition:translate .16s ease,box-shadow .16s ease,border-color .16s ease;}
@media(hover:hover){.inventory-shelf .shelf-tile:hover{translate:0 -2px;}}
@media(prefers-reduced-motion:reduce){.inventory-shelf .shelf-tile{transition:none;translate:none!important;}}
</style>
