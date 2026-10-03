<script setup lang="ts">
import CloseButton from './CloseButton.vue';

// Shared frame for small panels (volume, crystal exchange, fresh ingredients): gold-edged card with an
// eyebrow, a serif title and the standard close button. The parent class positions it.
defineProps<{ eyebrow: string; title: string; closeLabel?: string; /** Adds room around the content (panels that do not set their own). */ padded?: boolean }>();
defineEmits<{ close: [] }>();
</script>

<template>
  <section class="ui-popover" role="dialog" :aria-label="title">
    <header class="ui-popover-head">
      <div><small>{{ eyebrow }}</small><b>{{ title }}</b></div>
      <CloseButton :label="closeLabel ?? `Close ${title.toLowerCase()}`" size="sm" @click="$emit('close')" />
    </header>
    <div v-if="padded" class="ui-popover-body"><slot /></div>
    <slot v-else />
  </section>
</template>

<style>
.ui-popover { z-index: 180; border: 1px solid #d2a24e; border-radius: 14px; background: #0b1320; background-image:linear-gradient(#0b132066,#0b132066),url('/assets/ui/lounge-panel-painted-v1.webp');background-position:center;background-size:cover;background-repeat:no-repeat; box-shadow: 0 20px 50px #000d; color: #fff; text-align: left; }
.ui-popover-head { display: flex; align-items: center; justify-content: space-between; gap: 10px; padding: 10px 12px 9px; border-bottom: 1px solid #354762; }
.ui-popover-head small { display: block; color: var(--gold, #e8b85a); font-size: 13px; font-weight: 900; letter-spacing: .13em; }
.ui-popover-body { padding: 12px 14px 14px; }
.ui-popover-head b { display: block; margin-top: 2px; color: #fff3dc; font: 700 17px Georgia, serif; }
.ui-popover {animation:popover-arrive .16s ease-out both;}
@keyframes popover-arrive {from{opacity:0;translate:0 5px}to{opacity:1;translate:0 0}}
@media(prefers-reduced-motion:reduce){.ui-popover{animation:none;}}
</style>
