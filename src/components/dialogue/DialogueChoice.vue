<script setup lang="ts">
import type { DialogueChoice } from '../../domain/dialogue/types';

defineProps<{ choice: DialogueChoice; index: number }>();
defineEmits<{ select: [choice: DialogueChoice] }>();
</script>

<template>
  <button class="dialogue-choice" :data-tone="choice.tone" @click="$emit('select', choice)">
    <span>{{ index + 1 }}</span><b>{{ choice.text }}</b>
  </button>
</template>
