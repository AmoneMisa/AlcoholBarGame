<script setup lang="ts">
import { nextTick, onBeforeUnmount, onMounted, ref } from 'vue';
import CloseButton from './CloseButton.vue';

// The one frame for small utility popups (daily reward, pick-an-option, first-bar choice): a blurred backdrop,
// a gold-edged sheet, an optional title bar with the standard close button, a body and an optional footer.
// It closes on Escape and on a tap outside, locks the page behind it and moves focus inside when it opens.
const props = withDefaults(defineProps<{
  title?: string; eyebrow?: string; closeLabel?: string; label?: string; // label: the accessible name when there is no visible title
  closable?: boolean;            // false: the player must choose (no close button, Escape and outside taps do nothing)
  placement?: 'center' | 'bottom'; // bottom: a sheet that rises from the screen edge on phones
  width?: string;
}>(), { closable: true, placement: 'center', width: '520px' });
const emit = defineEmits<{ close: [] }>();
const sheet = ref<HTMLElement>();
const request = () => { if (props.closable) emit('close'); };

function onKey(event: KeyboardEvent) {
  if (event.key !== 'Escape' || !props.closable) return;
  event.stopPropagation();
  emit('close');
}
onMounted(async () => {
  document.body.classList.add('modal-open');
  await nextTick();
  if (sheet.value?.contains(document.activeElement) && document.activeElement !== sheet.value) return;
  const first = sheet.value?.querySelector<HTMLElement>('[autofocus], button:not([disabled]), input, select, [tabindex]');
  (first ?? sheet.value)?.focus({ preventScroll: true });
});
onBeforeUnmount(() => document.body.classList.remove('modal-open'));
</script>

<template>
  <Teleport to="body">
    <div class="modal-backdrop" :class="placement" @pointerdown.self="request" @keydown="onKey">
      <section ref="sheet" class="modal-sheet" role="dialog" aria-modal="true" :aria-label="title || label" tabindex="-1" :style="{ width: `min(${width}, 100%)` }">
        <header v-if="title || closable" class="modal-head">
          <div><small v-if="eyebrow">{{ eyebrow }}</small><b v-if="title">{{ title }}</b></div>
          <CloseButton v-if="closable" :label="closeLabel ?? `Close ${title ?? 'dialog'}`" size="sm" @click="emit('close')" />
        </header>
        <div class="modal-body"><slot /></div>
        <footer v-if="$slots.footer" class="modal-foot"><slot name="footer" /></footer>
      </section>
    </div>
  </Teleport>
</template>

<style>
.modal-backdrop { position: fixed; z-index: 1500; inset: 0; display: flex; align-items: center; justify-content: center; padding: max(12px, env(safe-area-inset-top)) 12px max(12px, env(safe-area-inset-bottom)); background: #04070dcc; backdrop-filter: blur(5px); animation: modal-fade .16s ease both; }
.modal-backdrop.bottom { align-items: flex-end; }
.modal-sheet { display: grid; grid-template-rows: auto minmax(0, 1fr) auto; max-height: 100%; overflow: hidden; border: 1px solid #d2a24e; border-radius: 16px; background: linear-gradient(150deg, #1b2740, #0b1320 72%); box-shadow: 0 24px 70px #000e; color: #fff; outline: 0; }
.modal-head { display: flex; align-items: center; justify-content: space-between; gap: 10px; padding: 12px 14px; border-bottom: 1px solid #354762; }
.modal-head small { display: block; color: var(--gold, #e8b85a); font-size: 9px; font-weight: 900; letter-spacing: .14em; }
.modal-head b { display: block; color: #fff3dc; font: 700 19px Georgia, serif; }
.modal-body { min-height: 0; overflow-y: auto; overscroll-behavior: contain; padding: 14px; }
.modal-foot { padding: 12px 14px 14px; border-top: 1px solid #354762; }
body.modal-open { overflow: hidden; }
@keyframes modal-fade { from { opacity: 0; } }
@media (min-width: 760px) { .modal-backdrop.bottom { align-items: center; } }
</style>
