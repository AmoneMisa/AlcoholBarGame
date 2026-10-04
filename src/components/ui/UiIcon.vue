<script setup lang="ts">
import { computed } from 'vue';
import { itemArtwork } from '../../domain/itemArtwork';
import { thumbnailArtwork } from '../../domain/optimizedArtwork';

// Navigation uses line icons; game resources and rewards use their full-color WebP art.
// A line icon. The pictures are WebP files in public/assets/ui/icons (<name>.webp, and <name>-bold.webp for the heavier
// stroke some small buttons use): white lines on a transparent background, used as a mask so the icon takes the text
// colour of whatever it sits in. The mask is centred in the icon's box, so every icon is centred the same way.
const ICONS = new Set(["alert-bold","alert","arrow-left-bold","arrow-left","arrow-right-bold","arrow-right","bag-bold","bag","ball-bold","ball","ban-bold","ban","basket-bold","basket","book-bold","book","bottle-bold","bottle","brush-bold","brush","bulb-bold","bulb","cap-bold","cap","card-bold","card","chat-bold","chat","check-bold","check","chevron-down-bold","chevron-down","chevron-left-bold","chevron-left","chevron-right-bold","chevron-right","chevron-up-bold","chevron-up","circle-bold","circle","clock-bold","clock","close-bold","close","cloud-bold","cloud","coin-bold","coin","copy-bold","copy","crystal-bold","crystal","drop-bold","drop","eye-bold","eye","face-angry-bold","face-angry","face-calm-bold","face-calm","face-dizzy-bold","face-dizzy","face-grimace-bold","face-grimace","face-happy-bold","face-happy","face-pleading-bold","face-pleading","face-sad-bold","face-sad","face-sleepy-bold","face-sleepy","face-star-bold","face-star","flame-bold","flame","fork-bold","fork","friends-bold","friends","fullscreen","gift-bold","gift","glass-bold","glass","heart-bold","heart","help-bold","help","keyboard-bold","keyboard","leaf-bold","leaf","lock-bold","lock","mail","mic-bold","mic","moon-bold","moon","music-bold","music","pair-bold","pair","paw-bold","paw","pencil-bold","pencil","pin-bold","pin","plane-bold","plane","plus-bold","plus","pointer-bold","pointer","refresh-bold","refresh","server-bold","server","settings-bold","settings","share-bold","share","smoke-bold","smoke","speaker-bold","speaker-off-bold","speaker-off","speaker","star-bold","star-fill-bold","star-fill","star","stock-bold","stock","tag-bold","tag","taxi-bold","taxi","trash-bold","trash","trophy-bold","trophy","truck-bold","truck","user-plus-bold","user-plus"]);
const urlOf = (name: string) => ICONS.has(name) ? `${import.meta.env.BASE_URL}assets/ui/icons/${name}.webp` : undefined;
const GAME_ART: Record<string,string> = {coin:'resources/coins',crystal:'resources/crystals',prestige:'resources/prestige',trophy:'resources/prestige',gift:'boxes/choice',xp:'resources/xp'};
const props = defineProps<{ name: string }>();
const artwork = computed(() => props.name === 'lock' ? `${import.meta.env.BASE_URL}assets/ui/lock-painted-v1.webp` : GAME_ART[props.name] ? itemArtwork(GAME_ART[props.name]!,import.meta.env.BASE_URL) : undefined);
const normal = computed(() => urlOf(props.name));
const style = computed(() => artwork.value ? {backgroundImage: `url("${thumbnailArtwork(artwork.value, 96, import.meta.env.BASE_URL)}")`} : normal.value ? { '--icon': `url("${normal.value}")`, '--icon-b': `url("${urlOf(`${props.name}-bold`) ?? normal.value}")` } : undefined);
</script>
<template><svg v-if="name === 'hanger'" class="ui-icon ui-icon-vector" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M10 5a2 2 0 1 1 3 1.7L12 8v2L3 16a1 1 0 0 0 .6 1.8h16.8A1 1 0 0 0 21 16l-9-6" /></svg><span v-else class="ui-icon" :class="{ 'ui-icon-lock': name === 'lock', 'ui-icon-art': artwork, 'ui-icon-missing': !normal && !artwork }" :style="style" aria-hidden="true"></span></template>

<style>
.ui-icon { width:24px;height:24px;display: inline-block; flex: none; background-color: currentColor; -webkit-mask: var(--icon) center / contain no-repeat; mask: var(--icon) center / contain no-repeat; }
.ui-icon.ui-icon-art {background-color:transparent;background-position:center;background-size:contain;background-repeat:no-repeat;-webkit-mask:none;mask:none;}
.ui-icon-lock {width:1em;height:1em;vertical-align:middle;}
.ui-icon-missing { background: none; }
.ui-icon-vector {background:none;-webkit-mask:none;mask:none;}
</style>
