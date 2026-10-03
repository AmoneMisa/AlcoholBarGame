<script setup lang="ts">
import UiIcon from '../ui/UiIcon.vue';
import ModalDialog from '../ui/ModalDialog.vue';
import { computed, nextTick, ref, watch } from 'vue';

export interface SelectOption { value: string; label: string; locked?: boolean }
const props = defineProps<{ label: string; modelValue: string; options: SelectOption[] }>();
const emit = defineEmits<{ 'update:modelValue': [value: string] }>();
const open = ref(false);
const list = ref<HTMLElement>();
const trigger = ref<HTMLButtonElement>();
const current = computed(() => props.options.find((option) => option.value === props.modelValue)?.label ?? props.modelValue);

function close(restoreFocus = true) { open.value = false; if (restoreFocus) trigger.value?.focus(); }
function choose(option: SelectOption) { if (option.locked) return; emit('update:modelValue', option.value); close(); }
function onKey(event: KeyboardEvent) {
  if (event.key === 'Escape') { event.stopPropagation(); close(); return; }
  if (event.key !== 'ArrowDown' && event.key !== 'ArrowUp') return;
  event.preventDefault();
  const items = [...(list.value?.querySelectorAll<HTMLButtonElement>('button:not([disabled])') ?? [])];
  const at = items.indexOf(document.activeElement as HTMLButtonElement);
  items[(at + (event.key === 'ArrowDown' ? 1 : -1) + items.length) % items.length]?.focus();
}
watch(open, async (value) => {
  if (!value) return;
  await nextTick();
  await new Promise((resolve) => setTimeout(resolve)); // after the dialog has taken focus itself
  const selected = list.value?.querySelector<HTMLElement>('[aria-selected="true"] button') ?? list.value?.querySelector<HTMLElement>('button:not([disabled])');
  selected?.focus();
  selected?.scrollIntoView({ block: 'center' });
});
</script>

<template>
  <div class="opt-select">
    <span class="opt-label">{{ label }}</span>
    <button ref="trigger" type="button" class="opt-trigger" aria-haspopup="listbox" :aria-expanded="open" :aria-label="`${label}: ${current}`" @click="open = true">
      <span>{{ current }}</span><i aria-hidden="true"><UiIcon name="chevron-down" /></i>
    </button>
    <!-- Rendered on <body>: the design panel clips overflow and the bottom navigation would hide a dropdown. -->
    <ModalDialog v-if="open" :title="label" placement="bottom" width="420px" close-label="Close" @close="close()">
      <ul ref="list" class="opt-list" role="listbox" :aria-label="label" @keydown="onKey">
        <li v-for="option in options" :key="option.value" role="option" :aria-selected="option.value === modelValue" :aria-disabled="option.locked || undefined">
          <button type="button" :disabled="option.locked" :class="{ selected: option.value === modelValue }" @click="choose(option)">
            <span>{{ option.label }}</span><em v-if="option.locked"><UiIcon class="inline-icon" name="lock" /> Locked</em><em v-else-if="option.value === modelValue"><UiIcon name="check" /></em>
          </button>
        </li>
      </ul>
    </ModalDialog>
  </div>
</template>

<style>
.opt-select{display:grid;gap:6px;min-width:0;font-size:13px;color:#d6c5b0}
.opt-trigger{display:flex;align-items:center;justify-content:space-between;gap:8px;width:100%;min-width:0;min-height:44px;padding:8px 12px;color:#f0e7dc;background:#182232;border:1px solid #465064;border-radius:10px;font-size:14px;text-align:left}
.opt-trigger span{overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.opt-trigger i{color:#d8aa57;font-style:normal}
.opt-trigger:focus-visible,.opt-list button:focus-visible{outline:2px solid #d8aa57;outline-offset:2px}
.opt-list{margin:0;padding:0;list-style:none}
.opt-list li button{display:flex;align-items:center;justify-content:space-between;gap:10px;width:100%;min-height:46px;padding:8px 12px;color:#f0e7dc;background:transparent;border:1px solid transparent;border-radius:10px;font-size:15px;text-align:left}
.opt-list li button:hover:not(:disabled){background:#1b2b44}
.opt-list li button.selected{background:#4a3219;border-color:#d8aa57;color:#ffe2a8}
.opt-list li button:disabled{color:#7d8696;cursor:not-allowed}
.opt-list li em{font-style:normal;font-size:13px;color:#d8aa57}
.opt-list li button:disabled em{color:#7d8696}
</style>
