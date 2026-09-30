<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, ref, watch } from 'vue';

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
  document.body.classList.toggle('opt-sheet-open', value);
  if (!value) return;
  await nextTick();
  const selected = list.value?.querySelector<HTMLElement>('[aria-selected="true"] button') ?? list.value?.querySelector<HTMLElement>('button:not([disabled])');
  selected?.focus();
  selected?.scrollIntoView({ block: 'center' });
});
onBeforeUnmount(() => document.body.classList.remove('opt-sheet-open'));
</script>

<template>
  <div class="opt-select">
    <span class="opt-label">{{ label }}</span>
    <button ref="trigger" type="button" class="opt-trigger" aria-haspopup="listbox" :aria-expanded="open" :aria-label="`${label}: ${current}`" @click="open = true">
      <span>{{ current }}</span><i aria-hidden="true">▾</i>
    </button>
    <!-- Rendered on <body>: the design panel clips overflow and the bottom navigation would hide a dropdown. -->
    <Teleport to="body">
      <div v-if="open" class="opt-backdrop" @pointerdown.self="close()" @keydown="onKey">
        <div ref="list" class="opt-sheet" role="listbox" :aria-label="label">
          <header><b>{{ label }}</b><button type="button" class="opt-close" aria-label="Close" @click="close()">✕</button></header>
          <ul>
            <li v-for="option in options" :key="option.value" role="option" :aria-selected="option.value === modelValue" :aria-disabled="option.locked || undefined">
              <button type="button" :disabled="option.locked" :class="{ selected: option.value === modelValue }" @click="choose(option)">
                <span>{{ option.label }}</span><em v-if="option.locked">🔒 Locked</em><em v-else-if="option.value === modelValue">✓</em>
              </button>
            </li>
          </ul>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<style>
.opt-select{display:grid;gap:6px;min-width:0;font-size:12px;color:#d6c5b0}
.opt-trigger{display:flex;align-items:center;justify-content:space-between;gap:8px;width:100%;min-width:0;min-height:44px;padding:8px 12px;color:#f0e7dc;background:#182232;border:1px solid #465064;border-radius:10px;font-size:14px;text-align:left}
.opt-trigger span{overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.opt-trigger i{color:#d8aa57;font-style:normal}
.opt-trigger:focus-visible,.opt-sheet button:focus-visible{outline:2px solid #d8aa57;outline-offset:2px}
.opt-backdrop{position:fixed;inset:0;z-index:1000;display:flex;align-items:flex-end;justify-content:center;padding:0 8px calc(8px + env(safe-area-inset-bottom,0px));background:#02060dcc}
.opt-sheet{display:grid;grid-template-rows:auto minmax(0,1fr);width:min(420px,100%);max-height:min(70vh,560px);overflow:hidden;background:#121e30;border:1px solid #d8aa5766;border-radius:16px;box-shadow:0 -10px 40px #000a}
.opt-sheet header{display:flex;align-items:center;justify-content:space-between;padding:12px 14px;border-bottom:1px solid #354761;color:#ffe2a8;font-size:14px}
.opt-close{min-width:40px;min-height:40px;color:#d6c5b0;background:transparent;border:0;font-size:16px}
.opt-sheet ul{margin:0;padding:6px;list-style:none;overflow-y:auto;overscroll-behavior:contain}
.opt-sheet li button{display:flex;align-items:center;justify-content:space-between;gap:10px;width:100%;min-height:46px;padding:8px 12px;color:#f0e7dc;background:transparent;border:1px solid transparent;border-radius:10px;font-size:15px;text-align:left}
.opt-sheet li button:hover:not(:disabled){background:#1b2b44}
.opt-sheet li button.selected{background:#4a3219;border-color:#d8aa57;color:#ffe2a8}
.opt-sheet li button:disabled{color:#7d8696;cursor:not-allowed}
.opt-sheet li em{font-style:normal;font-size:12px;color:#d8aa57}
.opt-sheet li button:disabled em{color:#7d8696}
body.opt-sheet-open{overflow:hidden}
@media(min-width:760px){.opt-backdrop{align-items:center}}
</style>
