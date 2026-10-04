<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import { requestedDrawPool } from '../../domain/uiOffers';
import { THEME_DRAW_POOLS } from '../../data/cosmetics/themeDistribution';
import { COSMETICS, DRAWABLE_COSMETICS, interiorForCosmetic } from '../../domain/cosmetics';
import { INTERIORS, interiorStyle } from '../../data/cosmetics/bars';
import { DRAW_COST } from '../../domain/loot';
import { useGameStore } from '../../stores/game';
import SectionTabs from '../ui/SectionTabs.vue';
import RewardArt from '../ui/RewardArt.vue';
import UiButton from '../ui/UiButton.vue';
import CrystalAmount from '../ui/CrystalAmount.vue';
const game=useGameStore();
const selected=ref<string>(THEME_DRAW_POOLS[0].id);
const tabs=[...THEME_DRAW_POOLS.map(item=>({id:item.id,label:item.name})),{id:'standard',label:'Classic draw'},{id:'seasonal',label:'Seasonal draw'}];
watch(requestedDrawPool,id=>{if(tabs.some(item=>item.id===id))selected.value=id!;},{immediate:true});
const collection=computed(()=>THEME_DRAW_POOLS.some(item=>item.id===selected.value));
const pool=computed(()=>THEME_DRAW_POOLS.find(item=>item.id===selected.value)??{id:selected.value,styleIds:DRAWABLE_COSMETICS.map(item=>item.id)});
const prizes=computed(()=>pool.value.styleIds.map(id=>({id,style:COSMETICS.find(item=>item.id===id)!,background:collection.value?INTERIORS.find(item=>item.id===interiorForCosmetic(id)):undefined})));
const collected=(id:string,background?:string)=>game.ownedCosmeticIds.includes(id)&&(!background||game.ownedInteriorIds.includes(background));
</script>
<template><section class="theme-draw"><SectionTabs v-model="selected" label="Style collections" :tabs="tabs" /><p v-if="collection">Choose a small collection to find the style you want. Each prize includes a style and its matching background. Every pair has the same chance. Duplicate styles become 10 fragments; a missing background is still added.</p><p v-else>Classic odds: 70% common, 27% rare, 3% legendary. A rare or better cosmetic is guaranteed within 10 draws, and a legendary within 50. Seasonal draws feature selected legendary styles. Duplicates become fragments.</p><div class="theme-draw-prizes">
  <article v-for="prize in prizes" :key="prize.id" :class="{owned:collected(prize.id,prize.background?.id)}">
    <div class="theme-draw-look" :style="prize.background ? interiorStyle(prize.background.id) : undefined" :aria-label="prize.style.label">
      <RewardArt :line="{kind:'style',id:prize.id,text:prize.style.label}" />
    </div>
    <b>{{ prize.style.label }}</b>
    <span v-if="prize.background" class="theme-draw-background">+ {{ prize.background.name }} background</span>
    <small>{{ collection ? (100/pool.styleIds.length).toFixed(0)+'%' : prize.style.rarity }} · {{ collected(prize.id,prize.background?.id)?'Owned':'Not collected' }}</small>
  </article>
</div><div class="theme-draw-actions"><UiButton variant="solid" :crystal-cost="DRAW_COST.single" @click="game.act({type:'drawStyle',count:1,banner:pool.id})">Spin · <CrystalAmount :value="DRAW_COST.single" /></UiButton><UiButton :crystal-cost="DRAW_COST.ten" @click="game.act({type:'drawStyle',count:10,banner:pool.id})">10 spins · <CrystalAmount :value="DRAW_COST.ten" /></UiButton></div></section></template>
<style scoped>.theme-draw{display:grid;gap:16px;min-width:0}.theme-draw p{margin:0;font-size:13px;line-height:1.5;color:#bfcddc}.theme-draw-prizes{display:grid;grid-template-columns:repeat(auto-fit,minmax(140px,1fr));gap:12px}.theme-draw-prizes article{display:grid;grid-template-rows:180px auto;gap:8px;justify-items:center;padding:12px;border:1px solid #58647a;border-radius:12px;background:#112133;text-align:center;font-size:13px}.theme-draw-prizes .owned{border-color:#8bd8a0;box-shadow:inset 0 0 18px #8bd8a025}.theme-draw-prizes :deep(.reward-art){width:100%;height:180px}.theme-draw-look{width:100%;height:180px;overflow:hidden;border-radius:8px;background-color:#09131f}.theme-draw-background{font-size:12px;color:#bfcddc}.theme-draw-prizes small{color:#e0c58f}.theme-draw-actions{display:flex;flex-wrap:wrap;gap:12px}.theme-draw-actions :deep(.ui-btn){flex:1}</style>
