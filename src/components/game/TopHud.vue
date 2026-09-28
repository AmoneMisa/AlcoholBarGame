<script setup lang="ts">
import { computed } from 'vue';
import { useGameStore } from '../../stores/game';

const game = useGameStore();
const xpPercent = computed(() => game.xp % 60 / 60 * 100);
</script>

<template>
  <header class="top-hud">
    <div class="venue-card">
      <div class="venue-mark"><span></span></div>
      <div><small>YOUR BAR</small><b>The Velvet Hour</b><div class="xp-line"><span :style="{ width: xpPercent + '%' }"></span></div></div>
      <em>LV. {{ game.level }}</em>
    </div>
    <div class="hud-resources">
      <div><i class="coin-icon"></i><span><small>COINS</small><b>{{ game.money.toFixed(0) }}</b></span></div>
      <div><i class="gem-icon"></i><span><small>GEMS</small><b>{{ game.gems }}</b></span></div>
      <div><i class="energy-icon"></i><span><small>ENERGY</small><b>{{ game.energy }}/100</b></span></div>
    </div>
    <div class="shift-card"><small>MON · WEEK {{ game.week }}</small><b>21:35</b><span>Evening shift</span></div>
    <button class="settings-button" type="button" aria-label="Settings"><span></span><span></span><span></span></button>
  </header>
</template>
