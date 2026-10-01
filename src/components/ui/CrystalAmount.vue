<script setup lang="ts">
import UiIcon from './UiIcon.vue';

// An amount of crystals, always written the same way: the crystal icon and the number.
defineProps<{ value: number | string }>();
</script>

<template><span class="crystal-amount"><UiIcon class="inline-icon" name="crystal" /> {{ value }}</span></template>

<style>
.crystal-amount { white-space: nowrap; }
</style>
