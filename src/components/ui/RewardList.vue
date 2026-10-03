<script setup lang="ts">
import type { RewardLine } from '../../domain/rewards';
import RewardArt from './RewardArt.vue';

// One row per thing received: an icon for what it is and the amount.
defineProps<{ lines: RewardLine[] }>();
</script>

<template>
  <ul class="reward-list">
    <li v-for="(line, index) in lines" :key="index" :class="line.kind" :style="{ animationDelay: `${Math.min(index, 6) * 35}ms` }"><span class="reward-list-art"><RewardArt :line="line" /></span><span>{{ line.text }}</span></li>
  </ul>
</template>

<style>
.reward-list { display: grid; gap: 5px; margin: 0; padding: 0; list-style: none; }
.reward-list li { display: flex; align-items: center; gap: 9px; padding: 7px 10px; border-radius: 9px; background: #0d1829; color: #fff3dc; font-size: 14px; font-weight: 700; }
.reward-list-art {display:block;flex:none;width:28px;height:28px;}
.reward-list .ui-icon { flex: none; width: 20px; height: 20px; color: #f2bd58; }
.reward-list li.crystals .ui-icon { color: #6fd9ff; }
.reward-list li.tip .ui-icon, .reward-list li.prestige .ui-icon { color: #f08ad0; }
.reward-list li.xp .ui-icon, .reward-list li.level .ui-icon { color: #9be28a; }
.reward-list li {animation:reward-row-arrive .22s ease-out both;}
@keyframes reward-row-arrive {from{opacity:0;transform:translateY(4px)}to{opacity:1;transform:none}}
@media(prefers-reduced-motion:reduce){.reward-list li{animation:none;}}
</style>
