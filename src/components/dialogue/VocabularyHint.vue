<script setup lang="ts">
import type { VocabularyEntry } from '../../domain/dialogue/types';
defineProps<{ entry: VocabularyEntry }>();
</script>
<template>
  <button class="vocabulary-hint" :title="entry.pronunciation" type="button">
    <span>{{ entry.learned ? 'Learned' : 'New word' }}</span>
    <b>{{ entry.word }}</b><small>{{ entry.meaning }}</small>
  </button>
</template>
