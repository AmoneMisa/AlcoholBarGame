<script setup lang="ts">
import { onMounted, onUnmounted, ref } from 'vue';
const root = ref<HTMLElement>();
const visible = ref(false);
let observer: IntersectionObserver | undefined;
onMounted(() => {
  if (typeof IntersectionObserver === 'undefined' || !root.value) { visible.value = true; return; }
  observer = new IntersectionObserver(entries => {
    if (!entries.some(entry => entry.isIntersecting)) return;
    visible.value = true;
    observer?.disconnect();
  }, { rootMargin: '160px' });
  observer.observe(root.value);
});
onUnmounted(() => observer?.disconnect());
</script>
<template><span ref="root" class="lazy-artwork"><slot v-if="visible" /></span></template>
<style>.lazy-artwork { display:block;width:100%;height:100%;min-height:1px; }</style>
