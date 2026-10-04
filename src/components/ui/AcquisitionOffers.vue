<script setup lang="ts">
import { computed, ref } from 'vue';
import { currencyOffer, acquisitionOffer, navigateTo } from '../../domain/uiOffers';
import { CRYSTAL_EXCHANGE_BUNDLES } from '../../domain/economy';
import { THEME_DRAW_POOLS, PROMO_THEME_IDS, cosmeticTheme, randomCosmeticAllowed } from '../../data/cosmetics/themeDistribution';
import { fragmentChoiceOptions } from '../../domain/fragmentChoices';
import { styleForInterior, achievementForStyle } from '../../data/cosmetics/styleSources';
import { COSMETICS, DRAWABLE_COSMETICS, interiorForCosmetic } from '../../domain/cosmetics';
import { seasonAt } from '../../domain/seasons';
import { interiorOrigin, styleOrigin } from '../../domain/styleInfo';
import { BOX_INTERIOR_IDS } from '../../data/cosmetics/bars';
import { themeStyleIds } from '../../domain/pass';
import { useGameStore } from '../../stores/game';
import ModalDialog from './ModalDialog.vue';
import UiButton from './UiButton.vue';
import CrystalAmount from './CrystalAmount.vue';
import CrystalShopPopup from './CrystalShopPopup.vue';
const game=useGameStore();
const shop=ref(false);
const shopPrice=computed(()=>{
  const target=acquisitionOffer.value;if(!target)return 0;
  const style=COSMETICS.find(item=>item.id===target.id);
  return target.kind==='background'?interiorOrigin(target.id).price:style?.character?styleOrigin(style.character,style.value).price:0;
});
function buyTarget(){const target=acquisitionOffer.value;if(!target)return;const ok=target.kind==='background'?game.buyInterior(target.id):game.buyStyle(target.id);if(ok)acquisitionOffer.value=undefined;}
const sources=computed(()=>{
  const target=acquisitionOffer.value;if(!target)return [];
  const rows:{label:string;detail:string;view:string;section?:string}[]=[];
  const linked=target.kind==='background'?styleForInterior(target.id):undefined;
  const styleId=target.kind==='style'?target.id:linked?`bartender:${linked.value}:${linked.character}`:'';
  const cosmetic=COSMETICS.find(item=>item.id===styleId);
  const theme=target.kind==='background'?target.id:cosmeticTheme(target.id);
  if(PROMO_THEME_IDS.some(id=>id===theme)) return [{label:'Promo codes',detail:'This collection is reserved for promo codes.',view:'settings'}];
  for(const pool of THEME_DRAW_POOLS) if(pool.styleIds.includes(styleId)) rows.push({label:pool.name,detail:`Try a collection draw with ${pool.styleIds.length} styles.`,view:'theme-draw',section:pool.id});
  if(DRAWABLE_COSMETICS.some(item=>item.id===styleId)) {
    rows.push({label:'Classic style draw',detail:'Try the classic draw for this cosmetic.',view:'theme-draw',section:'standard'});
    if(seasonAt(game.nowMs).featuredIds.includes(styleId)) rows.push({label:'Seasonal style draw',detail:'This cosmetic is featured in the current seasonal draw.',view:'theme-draw',section:'seasonal'});
  }
  if(target.kind==='background'?game.passTheme.interior===target.id:themeStyleIds(game.passTheme).includes(target.id)) rows.push({label:'Current Battle Pass',detail:'Earn points and collect this season’s rewards.',view:'events',section:'pass'});
  if(cosmetic?.character && achievementForStyle(cosmetic.character,cosmetic.value)) rows.push({label:'Achievements',detail:'Complete this style’s achievement.',view:'achievements'});
  const boxed=target.kind==='companion'||(target.kind==='background'?BOX_INTERIOR_IDS.includes(target.id):randomCosmeticAllowed(styleId)&&(cosmetic?.source==='box'||BOX_INTERIOR_IDS.includes(interiorForCosmetic(styleId)??'')));
  if(boxed) {
    const count=Object.values(game.loot.boxes).reduce((sum,n)=>sum+n,0);
    rows.push({label:count?'Chests in inventory':'Chests',detail:count?`${count} chests available. Check rewards before opening.`:'Find chests in events and rewards.',view:'manage',section:'workshop'});
  }
  for(const id of ['style-choice','background-choice','friend-choice']) if((game.loot.consumables[id]??0)>0 && fragmentChoiceOptions(id).some(item=>item.id===target.id)) rows.push({label:'Your fragment choice',detail:'You own a choice item for this reward.',view:'manage',section:'workshop'});
  const shards=target.kind==='companion'?game.circle.shards[target.id]??0:target.kind==='style'?game.loot.styleShards[target.id]??0:game.loot.styleShards['background:'+target.id]??0;
  if(shards) rows.push({label:`Your fragments · ${shards}`,detail:'Use your collected fragments to work toward this reward.',view:target.kind==='companion'?'circle':'manage',section:target.kind==='companion'?undefined:'workshop'});
  if(target.kind==='companion') rows.push({label:'Meet guests at the bar',detail:'Build a bond and gather Circle fragments.',view:'bar',section:'service'});
  if(!rows.length) rows.push({label:'Events & rewards',detail:'Look for this collection in future rewards.',view:'events'});
  return rows;
});
</script>
<template>
  <ModalDialog v-if="currencyOffer" :title="currencyOffer==='crystals'?'Top up crystals':'Exchange crystals for coins'" width="440px" @close="currencyOffer=undefined"><div class="offer-content"><p>{{ currencyOffer==='crystals'?'Get crystals to complete this action.':'Exchange crystals to get the coins for this action.' }}</p><template v-if="currencyOffer==='coins'"><UiButton v-for="bundle in CRYSTAL_EXCHANGE_BUNDLES" :key="bundle.crystals" :crystal-cost="bundle.crystals" @click="game.exchangeCrystals(bundle.crystals) && (currencyOffer=undefined)"><CrystalAmount :value="bundle.crystals" /> → {{ bundle.coins.toLocaleString('en-US') }} coins</UiButton></template><UiButton v-else variant="solid" block @click="currencyOffer=undefined;shop=true">View crystal packs</UiButton><UiButton block @click="currencyOffer=undefined">Later</UiButton></div></ModalDialog>
  <CrystalShopPopup v-if="shop" @close="shop=false" />
  <ModalDialog v-if="acquisitionOffer" :title="acquisitionOffer.label" eyebrow="HOW TO GET" width="480px" @close="acquisitionOffer=undefined"><div class="offer-content"><p>Choose where to find this reward.</p><UiButton v-if="shopPrice" variant="solid" block :crystal-cost="shopPrice" @click="buyTarget">Buy · <CrystalAmount :value="shopPrice" /></UiButton><UiButton v-for="(source,i) in sources" :key="i" class="offer-source" block @click="navigateTo(source.view,source.section)"><b>{{ source.label }}</b><small>{{ source.detail }}</small></UiButton><UiButton block @click="acquisitionOffer=undefined">Later</UiButton></div></ModalDialog>
</template>
<style scoped>.offer-content{display:grid;gap:12px}.offer-content p{margin:0 0 4px;font-size:14px;line-height:1.5;color:#bfcddc}:deep(.offer-source){height:auto;min-height:64px;text-align:left}:deep(.offer-source .ui-btn-label){display:grid;gap:5px;white-space:normal;width:100%}.offer-source b{color:#f5d79c}.offer-source small{font-weight:400;color:#bfcddc;line-height:1.4}</style>
