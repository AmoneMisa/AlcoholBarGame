<script setup lang="ts">
import UiIcon from './UiIcon.vue';

// The one close control used by every popup, sheet and card, so they all look and centre the same.
withDefaults(defineProps<{ label?: string; tone?: 'dark' | 'light'; size?: 'sm' | 'md' }>(), { label: 'Close', tone: 'dark', size: 'md' });
</script>

<template>
  <button class="ui-close" :class="[`ui-close-${tone}`, `ui-close-${size}`]" type="button" :aria-label="label" :title="label"><UiIcon name="close" /></button>
</template>

<style>
.ui-close { display: grid; flex: 0 0 auto; place-items: center; padding: 0; border: 1px solid #475a74; border-radius: 50%; background: #1b2940; color: #e8eef6; line-height: 0; cursor: pointer; transition: border-color .15s, color .15s, background .15s; }
.ui-close:hover, .ui-close:focus-visible { border-color: #e4b35c; color: #ffd98a; }
.ui-close .ui-icon { stroke-width: 2.2; }
.ui-close-md { width: 36px; height: 36px; }
.ui-close-md .ui-icon { width: 18px; height: 18px; }
.ui-close-sm { width: 28px; height: 28px; }
.ui-close-sm .ui-icon { width: 14px; height: 14px; }
.ui-close-light { border-color: #cbb89c; background: #fff; color: #1b2335; }
.ui-close-light:hover, .ui-close-light:focus-visible { border-color: #b8862f; color: #7a4b12; }
</style>
