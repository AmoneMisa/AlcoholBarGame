<script setup lang="ts">
defineProps<{ title: string; detail: string; nonAlcoholic?: boolean }>();
</script>
<template>
  <article class="recommendation-card">
    <span class="recommendation-icon">{{ nonAlcoholic ? '0%' : '✦' }}</span>
    <div><small>{{ nonAlcoholic ? 'NON-ALCOHOLIC OPTION' : 'PAIRING IDEA' }}</small><b>{{ title }}</b><p>{{ detail }}</p></div>
  </article>
</template>
