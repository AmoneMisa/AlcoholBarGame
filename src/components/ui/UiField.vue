<script setup lang="ts">
// A label above a control (input, select, ...) with an optional hint below: forms look the same on every screen.
defineProps<{ label: string; hint?: string; forId?: string }>();
</script>

<template>
  <div class="ui-field">
    <label class="ui-field-label" :for="forId">{{ label }}</label>
    <slot />
    <small v-if="hint" class="ui-field-hint">{{ hint }}</small>
  </div>
</template>
