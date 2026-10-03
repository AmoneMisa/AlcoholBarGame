<script setup lang="ts">
import { computed } from 'vue';
import { bartenderAvatarFor } from '../../data/cosmetics/bartenderAvatars';
const props = defineProps<{ character: string; hair?: string }>();
const avatar = computed(() => bartenderAvatarFor(props.character, props.hair));
const portrait = computed(() => ({
  backgroundImage: `url(${import.meta.env.BASE_URL}${avatar.value?.sheet.replace(/^\//, '')})`,
  backgroundPosition: `${(avatar.value?.column ?? 0) / 5 * 100}% 0%`,
  left: props.character === 'leo' ? '-24px' : '-17px',
}));
</script>
<template><span class="character-portrait" :style="portrait" aria-hidden="true" /></template>
<style scoped>
.character-portrait { position:absolute; top:-4px; width:64px; height:112px; background-size:600% 300%; background-repeat:no-repeat; pointer-events:none; }
</style>
