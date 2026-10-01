<script setup lang="ts">
import { ref } from 'vue';

// The standard text input: same height, border and focus ring everywhere. Works with v-model. Give it a `label` (every
// input has one, next to its placeholder) and it draws the label above itself; every other attribute (placeholder,
// maxlength, type, aria-label, ...) goes to the input.
defineOptions({ inheritAttrs: false });
defineProps<{ modelValue?: string | number; label?: string; hint?: string }>();
const emit = defineEmits<{ 'update:modelValue': [value: string] }>();
const el = ref<HTMLInputElement>();
defineExpose({ focus: () => el.value?.focus(), select: () => el.value?.select(), el });
</script>

<template>
  <label v-if="label" class="ui-field ui-input-field">
    <span class="ui-field-label">{{ label }}</span>
    <input ref="el" v-bind="$attrs" class="ui-input" :value="modelValue" @input="emit('update:modelValue', ($event.target as HTMLInputElement).value)" />
    <small v-if="hint" class="ui-field-hint">{{ hint }}</small>
  </label>
  <input v-else ref="el" v-bind="$attrs" class="ui-input" :value="modelValue" @input="emit('update:modelValue', ($event.target as HTMLInputElement).value)" />
</template>
