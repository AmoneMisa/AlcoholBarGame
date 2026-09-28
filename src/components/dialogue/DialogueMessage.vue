<script setup lang="ts">
import type { DialogueSpeaker } from '../../domain/dialogue/types';

defineProps<{ speaker: DialogueSpeaker; text: string }>();
</script>

<template>
  <div class="dialogue-message" :data-speaker="speaker">
    <span class="dialogue-speaker">{{ speaker }}</span>
    <p>“{{ text }}”</p>
  </div>
</template>
