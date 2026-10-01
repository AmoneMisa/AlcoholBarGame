<script setup lang="ts">
import UiButton from './UiButton.vue';

// Shown instead of a blank screen when a page could not be loaded (a lost connection, or an old copy of the game after
// an update). One tap reloads the game.
defineProps<{ error?: unknown }>();
const reload = () => window.location.reload();
</script>

<template>
  <section class="load-error" role="alert">
    <b>This page could not be loaded.</b>
    <p>Check your connection, or the game may have been updated. Reloading gets the latest version.</p>
    <UiButton variant="solid" icon="refresh" @click="reload">Reload the game</UiButton>
  </section>
</template>

<style>
.load-error { display: grid; justify-items: start; gap: 10px; margin: 14px; padding: 18px; border: 1px solid #8a5a3a; border-radius: 14px; background: #2a1b17; color: #ffe2cf; }
.load-error p { margin: 0; color: #e6c7b3; font-size: 14px; }
</style>
