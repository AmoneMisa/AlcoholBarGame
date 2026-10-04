<script setup lang="ts">
import { computed } from 'vue';
import { useGameStore } from '../../stores/game';
const game = useGameStore();
const bonus = computed(() => game.collectionBonuses);
const percent = (value:number) => `${Number((value*100).toFixed(1))}%`;
</script>
<template>
  <details class="collection-bonuses">
    <summary>Collection bonuses · {{ bonus.styleCount }} styles + {{ bonus.backgroundCount }} backgrounds</summary>
    <p>Permanent bonuses from unique collected costumes and backgrounds. Starter looks, fragments and duplicates do not count.</p>
    <dl>
      <div><dt>Tip amounts</dt><dd>+{{ percent(bonus.rate) }}</dd></div>
      <div><dt>Offline tip duration</dt><dd>+{{ percent(bonus.offlineRate) }} · {{ game.tipJarHours.toFixed(1) }} h</dd></div>
      <div><dt>Guest cooldown</dt><dd>−{{ percent(bonus.rate) }}</dd></div>
      <div><dt>VIP / Circle chance</dt><dd>+{{ percent(bonus.rate) }} relative</dd></div>
      <div><dt>Supply delivery time</dt><dd>−{{ percent(bonus.rate) }}</dd></div>
      <div><dt>Login coins &amp; crystals</dt><dd>+{{ percent(bonus.rate) }}</dd></div>
      <div><dt>Early guest invitation cost</dt><dd>−{{ percent(bonus.rate) }}</dd></div>
      <div><dt>Daily wheel spins</dt><dd>{{ game.rouletteSpinLimit }} / day</dd></div>
      <div><dt>Prestige received per friend visit</dt><dd>{{ 1 + bonus.visitPrestige }}</dd></div>
    </dl>
    <p>Every 5 items: +0.5% (up to 10%); offline duration +1% (up to 20%). Spins: 4/5/6/7 at 16/32/48/64 items. Extra visit prestige: +1/+2/+3/+4 at 20/40/60/80. Whole currency amounts are rounded.</p>
  </details>
</template>
<style scoped>
.collection-bonuses{padding:14px;border:1px solid #736142;border-radius:12px;background:#102033;color:#e8dcc0;font-size:13px}
summary{cursor:pointer;font-weight:600;line-height:1.5}p{color:#aebccd;line-height:1.5}dl{display:grid;gap:8px}dl>div{display:flex;justify-content:space-between;gap:12px}dd{margin:0;flex-shrink:0;color:#efd081;text-align:right}
</style>
