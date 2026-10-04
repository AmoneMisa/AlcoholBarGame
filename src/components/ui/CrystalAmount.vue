<script setup lang="ts">
import UiIcon from './UiIcon.vue';

// An amount of crystals, always written the same way: the crystal icon and the number.
defineProps<{ value: number | string }>();
</script>

<template><span class="crystal-amount"><UiIcon class="inline-icon" name="crystal" /> {{ value }}</span></template>

<style>
.crystal-amount { display:inline-flex;align-items:center;justify-content:center;gap:4px;white-space:nowrap;vertical-align:middle; }
</style>
