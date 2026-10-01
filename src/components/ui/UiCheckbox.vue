<script setup lang="ts">
// The standard checkbox: a label (and an optional smaller line under it) next to a box. Same size, colour and focus
// ring everywhere. Works with v-model.
//   tone="danger": for agreements to something that cannot be undone.
defineOptions({ inheritAttrs: false });
defineProps<{ modelValue?: boolean; label?: string; hint?: string; disabled?: boolean; tone?: 'danger' }>();
const emit = defineEmits<{ 'update:modelValue': [value: boolean] }>();
</script>

<template>
  <label class="ui-check" :class="{ 'ui-check-danger': tone === 'danger', 'ui-check-off': disabled }">
    <span class="ui-check-text"><b v-if="label">{{ label }}</b><slot /><small v-if="hint">{{ hint }}</small></span>
    <input v-bind="$attrs" type="checkbox" class="ui-check-box" :checked="modelValue" :disabled="disabled" @change="emit('update:modelValue', ($event.target as HTMLInputElement).checked)" />
  </label>
</template>
