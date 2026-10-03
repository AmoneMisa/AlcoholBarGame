<script setup lang="ts">
import { SCREENSHOT_OPTIONS, useScreenshotStore } from '../../stores/screenshot';
import UiCheckbox from '../ui/UiCheckbox.vue';
const screenshot=useScreenshotStore();
</script>
<template><div class="screenshot-options"><p>Choose what appears in the full-screen bar. The game header and navigation are always hidden.</p><UiCheckbox v-for="option in SCREENSHOT_OPTIONS" :key="option.id" v-model="screenshot.prefs[option.id]" :label="option.label" /></div></template>
<style scoped>.screenshot-options {display:grid;gap:12px}.screenshot-options p {margin:0;font-size:13px;color:#b4c1d2;line-height:1.5}</style>
