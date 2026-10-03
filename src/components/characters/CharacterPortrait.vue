<script setup lang="ts">
import { computed } from 'vue';
import { bartenderAvatarFor } from '../../data/cosmetics/bartenderAvatars';
const props = defineProps<{ character: string; hair?: string }>();
const avatar = computed(() => bartenderAvatarFor(props.character, props.hair));
const portrait = computed(() => ({
  backgroundImage: `url(${import.meta.env.BASE_URL}assets/optimized/portraits/${avatar.value ? props.character : 'noa'}-${avatar.value?.hairStyle ?? 'updo'}.webp)`,
}));
</script>
<template><span class="character-portrait" :style="portrait" aria-hidden="true" /></template>
<style scoped>
.character-portrait { position:absolute; inset:0; width:100%; height:100%; background-size:100% 100%; background-position:center; background-repeat:no-repeat; pointer-events:none; }
</style>
