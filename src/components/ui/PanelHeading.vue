<script setup lang="ts">
// The top bar of a screen: a small gold eyebrow, the title and, on the right, a short fact about the screen.
defineProps<{ eyebrow: string; title: string; aside?: string }>();
</script>

<template>
  <header class="panel-heading">
    <div><small>{{ eyebrow }}</small><h2>{{ title }}</h2></div>
    <span v-if="aside">{{ aside }}</span>
  </header>
</template>
