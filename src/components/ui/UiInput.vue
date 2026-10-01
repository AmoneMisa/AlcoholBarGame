<script setup lang="ts">
import { ref } from 'vue';

// The standard text input: same height, border and focus ring everywhere. Works with v-model; every other attribute
// (placeholder, maxlength, type, aria-label, ...) goes to the input itself.
defineOptions({ inheritAttrs: false });
defineProps<{ modelValue?: string | number }>();
const emit = defineEmits<{ 'update:modelValue': [value: string] }>();
const el = ref<HTMLInputElement>();
defineExpose({ focus: () => el.value?.focus(), select: () => el.value?.select(), el });
</script>

<template>
  <input ref="el" v-bind="$attrs" class="ui-input" :value="modelValue" @input="emit('update:modelValue', ($event.target as HTMLInputElement).value)" />
</template>
