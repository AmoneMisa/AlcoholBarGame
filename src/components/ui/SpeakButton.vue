<script setup lang="ts">
import { speak } from '../../domain/english/speak';
import UiButton from './UiButton.vue';

// A small speaker button: reads an English word or sentence aloud (the same voice as the rest of the game).
defineProps<{ text: string; label?: string }>();
</script>

<template>
  <UiButton class="speak-button" size="sm" variant="ghost" icon="speaker" :aria-label="label ?? `Listen: ${text}`" :title="`Listen: ${text}`" @click.stop.prevent="speak(text)" />
</template>

<style>
.speak-button.ui-btn-sm { min-height: 28px; width: 28px; padding: 0; border-radius: 50%; color: #ffd98a; vertical-align: middle; }
.speak-button .ui-icon { width: 16px; height: 16px; }
</style>
