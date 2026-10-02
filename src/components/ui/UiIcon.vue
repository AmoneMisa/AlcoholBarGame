<script setup lang="ts">
import { computed } from 'vue';

// A line icon. The pictures are WebP files in src/assets/ui/icons (<name>.webp, and <name>-bold.webp for the heavier
// stroke some small buttons use): white lines on a transparent background, used as a mask so the icon takes the text
// colour of whatever it sits in. The mask is centred in the icon's box, so every icon is centred the same way.
const FILES = import.meta.glob('../../assets/ui/icons/*.webp', { eager: true, query: '?url', import: 'default' }) as Record<string, string>;
const urlOf = (name: string) => FILES[`../../assets/ui/icons/${name}.webp`];
const props = defineProps<{ name: string }>();
const normal = computed(() => urlOf(props.name));
const style = computed(() => normal.value ? { '--icon': `url("${normal.value}")`, '--icon-b': `url("${urlOf(`${props.name}-bold`) ?? normal.value}")` } : undefined);
</script>
<template><span class="ui-icon" :class="{ 'ui-icon-missing': !normal }" :style="style" aria-hidden="true"></span></template>

<style>
.ui-icon { display: inline-block; flex: none; background-color: currentColor; -webkit-mask: var(--icon) center / contain no-repeat; mask: var(--icon) center / contain no-repeat; }
.ui-icon-missing { background: none; }
</style>
