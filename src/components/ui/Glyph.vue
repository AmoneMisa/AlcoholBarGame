<script setup lang="ts">
import UiIcon from './UiIcon.vue';
import { glyphIcon } from './glyphs';

// An emoji from the game data, drawn as a sprite icon.
defineProps<{ g?: string }>();
</script>

<template><UiIcon class="glyph" :name="glyphIcon(g)" /></template>

<style>
.glyph { width: 1.2em; height: 1.2em; flex: none; vertical-align: -.22em; }
</style>
