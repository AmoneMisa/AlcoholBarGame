<script setup lang="ts">
defineProps<{ satisfaction: number; patience: number }>();
</script>
<template>
  <div class="service-meters">
    <label>Patience <span><i :style="{ width: patience + '%' }"></i></span></label>
    <label>Satisfaction <span><i :style="{ width: satisfaction + '%' }"></i></span></label>
  </div>
</template>
