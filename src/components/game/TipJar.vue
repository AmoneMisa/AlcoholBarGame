<script setup lang="ts">
import { ref, watch } from 'vue';
import { useGameStore } from '../../stores/game';
const game = useGameStore();
const pulse = ref(0);
watch(() => game.tipJar, (next, old) => { if (next > old) pulse.value++; });
</script>
<template>
  <button class="tip-jar" :class="{ ready: game.tipJar > 0 }" :disabled="game.tipJar <= 0" :aria-label="`Collect ${game.tipJar} coins in tips`" @click="game.collectTips()">
    <span :key="pulse" class="tip-coin-drop" :class="{ falling: pulse > 0 }" aria-hidden="true">●</span>
    <span class="tip-jar-glass" aria-hidden="true"><span class="tip-jar-coins">● ●<br>● ● ●</span><span class="tip-jar-label">TIPS</span></span>
  </button>
</template>
<style scoped>
.tip-jar { position: absolute; z-index: 8; left: clamp(32px, calc(var(--glass-x, 65%) + 18px), calc(100% - 32px)); top: calc(var(--glass-y, 58%) - 16px); width: 64px; min-height: 84px; transform: translate(-50%, -50%); display: grid; justify-items: center; align-content: end; gap: 8px; padding: 0; border: 0; background: transparent; color: #f2d8a0; cursor: pointer; }
.tip-jar:disabled { cursor: default; opacity: .85; }
.tip-jar-glass { position: relative; width: 48px; height: 58px; border: 2px solid #eaf0e699; border-radius: 8px 8px 14px 14px; background: linear-gradient(95deg, #d1edf733, #ffffff08 45%, #e0e7e42b); box-shadow: inset 5px 0 8px #fff2, 0 6px 6px #0007; }
.tip-jar-glass::before { content: ''; position: absolute; top: -6px; left: -3px; right: -3px; height: 9px; border: 2px solid #c7d7dc; border-radius: 50%; background: #40535a99; }
.tip-jar-coins { position: absolute; bottom: 5px; left: 7px; color: #dda638; line-height: 9px; font-size: 13px; letter-spacing: -1px; text-shadow: 1px 1px #76512a; opacity: .4; }
.ready .tip-jar-coins { opacity: 1; }
.tip-jar-label { position: absolute; top: 15px; left: 4px; right: 4px; padding: 4px 0; border: 1px solid #d2b47c; border-radius: 3px; background: #dbc591; color: #4b3625; font: 700 9px Georgia, serif; letter-spacing: .15em; }
.tip-jar b { padding: 4px 6px; border-radius: 6px; background: #181323dd; font-size: 10px; white-space: normal; }
.ready .tip-jar-glass { filter: drop-shadow(0 0 9px #ffcc6666); }
.tip-coin-drop { position: absolute; top: -9px; color: #e9bd53; opacity: 0; }
.tip-coin-drop.falling { animation: jar-coin .8s ease-in both; }
@keyframes jar-coin { 0% { opacity: 1; transform: translateY(-40px) rotateY(0); } 80% { opacity: 1; } 100% { opacity: 0; transform: translateY(50px) rotateY(360deg); } }
@media (prefers-reduced-motion: reduce) { .tip-coin-drop.falling { animation: none; } }
</style>
