<script setup lang="ts">
import { computed } from 'vue';
import UiIcon from './UiIcon.vue';

// The standard button. One height, content centred, the same look on every screen.
//   variant: primary (brown, the main action), solid (gold, the one big call to action), secondary (dark), danger, ghost.
//   size: md (40px) or sm (32px).
//   reason: why the button cannot be pressed right now; the button is dimmed and the reason is shown under it, so nobody
//   faces a dead button without knowing why.
defineOptions({ inheritAttrs: false });
const props = withDefaults(defineProps<{
  variant?: 'primary' | 'solid' | 'secondary' | 'danger' | 'ghost';
  size?: 'md' | 'sm';
  icon?: string;
  block?: boolean;
  reason?: string;
  type?: 'button' | 'submit';
}>(), { variant: 'secondary', size: 'md', type: 'button' });
const emit = defineEmits<{ click: [event: MouseEvent] }>();
const blocked = computed(() => !!props.reason);
function press(event: MouseEvent) { if (!blocked.value) emit('click', event); }
</script>

<template>
  <button v-bind="$attrs" :type="type" class="ui-btn" :class="[`ui-btn-${variant}`, `ui-btn-${size}`, { 'ui-btn-block': block, 'ui-btn-blocked': blocked }]" :aria-disabled="blocked || undefined" @click="press">
    <UiIcon v-if="icon" :name="icon" /><span v-if="$slots.default" class="ui-btn-label"><slot /></span>
  </button>
  <p v-if="reason" class="ui-reason" role="note">{{ reason }}</p>
</template>
