<script setup lang="ts">
import { computed } from 'vue';
import { itemArtwork } from '../../domain/itemArtwork';

// Navigation uses line icons; game resources and rewards use their full-color WebP art.
// A line icon. The pictures are WebP files in src/assets/ui/icons (<name>.webp, and <name>-bold.webp for the heavier
// stroke some small buttons use): white lines on a transparent background, used as a mask so the icon takes the text
// colour of whatever it sits in. The mask is centred in the icon's box, so every icon is centred the same way.
const FILES = import.meta.glob('../../assets/ui/icons/*.webp', { eager: true, query: '?url', import: 'default' }) as Record<string, string>;
const urlOf = (name: string) => FILES[`../../assets/ui/icons/${name}.webp`];
const GAME_ART: Record<string,string> = {coin:'resources/coins',crystal:'resources/crystals',prestige:'resources/prestige',trophy:'resources/prestige',gift:'boxes/choice',xp:'resources/xp'};
const props = defineProps<{ name: string }>();
const artwork = computed(() => props.name === 'lock' ? `${import.meta.env.BASE_URL}assets/ui/lock-painted-v1.webp` : GAME_ART[props.name] ? itemArtwork(GAME_ART[props.name]!,import.meta.env.BASE_URL) : undefined);
const normal = computed(() => urlOf(props.name));
const style = computed(() => artwork.value ? {backgroundImage: `url("${artwork.value}")`} : normal.value ? { '--icon': `url("${normal.value}")`, '--icon-b': `url("${urlOf(`${props.name}-bold`) ?? normal.value}")` } : undefined);
</script>
<template><span class="ui-icon" :class="{ 'ui-icon-lock': name === 'lock', 'ui-icon-art': artwork, 'ui-icon-missing': !normal && !artwork }" :style="style" aria-hidden="true"></span></template>

<style>
.ui-icon { display: inline-block; flex: none; background-color: currentColor; -webkit-mask: var(--icon) center / contain no-repeat; mask: var(--icon) center / contain no-repeat; }
.ui-icon.ui-icon-art {background-color:transparent;background-position:center;background-size:contain;background-repeat:no-repeat;-webkit-mask:none;mask:none;}
.ui-icon-lock {width:1em;height:1em;vertical-align:middle;}
.ui-icon-missing { background: none; }
</style>
