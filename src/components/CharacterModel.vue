<script setup lang="ts">
import type { Mood } from '../domain/types';

defineProps<{ role: 'bartender' | 'customer'; mood?: Mood; outfit?: string }>();
</script>

<template>
  <div class="character" :class="[role, mood, outfit]" aria-hidden="true">
    <div class="hair"></div>
    <div class="head">
      <span class="eye eye-left"></span><span class="eye eye-right"></span><span class="mouth"></span>
    </div>
    <div class="neck"></div>
    <div class="body"><span class="lapel left"></span><span class="lapel right"></span></div>
  </div>
</template>
