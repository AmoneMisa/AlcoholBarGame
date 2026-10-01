<script setup lang="ts">
// The tabs inside a main screen (English: Learn / Recipes / Pairings, Manage: Market / Inventory / Workshop, ...).
// A row that scrolls sideways when it is wider than the screen.
defineProps<{ tabs: { id: string; label: string; badge?: number }[]; modelValue: string; label?: string }>();
const emit = defineEmits<{ 'update:modelValue': [id: string] }>();
</script>

<template>
  <nav class="section-tabs tabs-scroll" role="tablist" :aria-label="label ?? 'Sections'">
    <button v-for="tab in tabs" :key="tab.id" type="button" role="tab" :aria-selected="modelValue === tab.id" :class="{ active: modelValue === tab.id }" :data-guide="'nav-' + tab.id" @click="emit('update:modelValue', tab.id)">
      {{ tab.label }}<i v-if="tab.badge" class="section-badge">{{ tab.badge }}</i>
    </button>
  </nav>
</template>

<style>
.section-tabs { display: flex; gap: 6px; padding: 10px 12px 6px; }
.section-tabs button { position: relative; flex: 0 0 auto; box-sizing: border-box; min-height: var(--ctl-h, 40px); padding: 0 18px; border: 1px solid #40536c; border-radius: 999px; background: #111c2d; color: #c7d3e0; font: 800 14px/1.2 system-ui, sans-serif; white-space: nowrap; cursor: pointer; }
.section-tabs button.active { border-color: #e0a14a; background: #3b2b1f; color: #fff0ce; }
.section-tabs button:focus-visible { outline: 2px solid #ffd35a; outline-offset: 2px; }
.section-badge { position: absolute; top: -6px; right: -4px; min-width: 18px; height: 18px; padding: 0 5px; border-radius: 9px; background: #d9534f; color: #fff; font: 700 10px/18px system-ui, sans-serif; font-style: normal; text-align: center; box-shadow: 0 0 0 2px #0f1a2b; }
</style>
