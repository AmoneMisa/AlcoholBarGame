<script setup lang="ts">
import type { RewardKind, RewardLine } from '../../domain/rewards';
import UiIcon from './UiIcon.vue';

// One row per thing received: an icon for what it is and the amount.
defineProps<{ lines: RewardLine[] }>();
const ICONS: Record<RewardKind, string> = {
  coins: 'coin', tip: 'coin', crystals: 'crystal', xp: 'star', recipe: 'book', style: 'brush', background: 'pin', card: 'book', prestige: 'trophy', level: 'star', gift: 'gift', companion: 'friends', item: 'gift', box: 'gift', material: 'crystal'
};
</script>

<template>
  <ul class="reward-list">
    <li v-for="(line, index) in lines" :key="index" :class="line.kind"><UiIcon :name="ICONS[line.kind]" /><span>{{ line.text }}</span></li>
  </ul>
</template>

<style>
.reward-list { display: grid; gap: 5px; margin: 0; padding: 0; list-style: none; }
.reward-list li { display: flex; align-items: center; gap: 9px; padding: 7px 10px; border-radius: 9px; background: #0d1829; color: #fff3dc; font-size: 14px; font-weight: 700; }
.reward-list .ui-icon { flex: none; width: 20px; height: 20px; color: #f2bd58; }
.reward-list li.crystals .ui-icon { color: #6fd9ff; }
.reward-list li.tip .ui-icon, .reward-list li.prestige .ui-icon { color: #f08ad0; }
.reward-list li.xp .ui-icon, .reward-list li.level .ui-icon { color: #9be28a; }
</style>
