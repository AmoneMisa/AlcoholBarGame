<script lang="ts">
import sprite from '../../assets/ui/game-icons.svg?raw';

// The icon sprite is put into the page once and every icon points at it with #name. An external sprite file
// (<use href="file.svg#name">) is not drawn by some embedded browsers (Telegram desktop), which left empty circles.
if (typeof document !== 'undefined' && !document.getElementById('ui-icon-sprite')) {
  const holder = document.createElement('div');
  holder.id = 'ui-icon-sprite';
  holder.setAttribute('aria-hidden', 'true');
  holder.style.cssText = 'position:absolute;width:0;height:0;overflow:hidden;pointer-events:none';
  holder.innerHTML = sprite;
  document.body.prepend(holder);
}
</script>
<script setup lang="ts">
defineProps<{ name:string }>();
</script>
<template><svg class="ui-icon" viewBox="0 0 24 24" aria-hidden="true"><use :href="`#${name}`" /></svg></template>
