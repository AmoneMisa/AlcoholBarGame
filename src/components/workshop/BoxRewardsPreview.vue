<script setup lang="ts">
import { computed } from 'vue';
import { BOX_TABLES, CONSUMABLES, EQUIPMENT, type Reward } from '../../domain/loot';
import { COSMETICS } from '../../domain/cosmetics';
import { INTERIORS, BOX_INTERIOR_IDS } from '../../data/cosmetics/bars';
import { COMPANIONS, KEEPSAKES, companionName } from '../../domain/companions';
import { RECIPES } from '../../domain/catalog';
import { ALCOHOL_PRODUCTS } from '../../domain/bottleCatalog';
import { isStarterRecipe } from '../../sim/recipes';
import { boxStyles, shardStyles } from '../../sim/loot';
import { useGameStore } from '../../stores/game';
import type { RewardLine } from '../../domain/rewards';
import RewardArt from '../ui/RewardArt.vue';
import BrandBottle from '../knowledge/BrandBottle.vue';

const props = defineProps<{ boxId: string }>();
const game = useGameStore();
type Preview = { key: string; line: RewardLine; fragments?: boolean; bottleId?: string };
const rewards = computed(() => {
  const items = new Map<string, Preview>();
  const put = (line: RewardLine, fragments = false, bottleId?: string) => {
    const key = `${line.kind}:${line.id ?? ''}:${fragments}:${bottleId ?? ''}`;
    items.set(key, { key, line, fragments, bottleId });
  };
  const styles = (ids: readonly string[], fragments: boolean) => ids.forEach(id => {
    const item = COSMETICS.find(item => item.id === id)!;
    put({ kind: 'style', id, text: item.label, rarity: item.rarity }, fragments);
  });
  const backgrounds = (ids: readonly string[], fragments: boolean) => ids.forEach(id => {
    put({ kind: 'background', id, text: INTERIORS.find(item => item.id === id)!.name }, fragments);
  });
  const add = (reward: Reward) => {
    switch (reward.kind) {
      case 'skinShards': case 'stylePieces': {
        const missing = shardStyles().filter(item=>!game.ownedCosmeticIds.includes(item.id));
        styles(reward.kind === 'skinShards' && reward.id ? [reward.id] : (missing.length ? missing : shardStyles()).map(item => item.id), true);
        break;
      }
      case 'style': {
        const missing = boxStyles().filter(item => !game.ownedCosmeticIds.includes(item.id));
        styles((missing.length ? missing : boxStyles()).map(item => item.id), !missing.length);
        break;
      }
      case 'backgroundShards': backgrounds(BOX_INTERIOR_IDS, true); break;
      case 'eventInterior': {
        const missing = BOX_INTERIOR_IDS.filter(id => !game.ownedInteriorIds.includes(id));
        backgrounds(missing.length ? missing : BOX_INTERIOR_IDS, !missing.length);
        break;
      }
      case 'companionShards': {const missing=COMPANIONS.filter(person=>!(person.id in game.circle.owned));if(missing.length) missing.forEach(person=>put({kind:'companion',id:person.id,text:companionName(person.id)},true));else KEEPSAKES.forEach(item=>put({kind:'gift',id:item.id,text:item.name}));break;}
      case 'consumable': put({kind:'item',id:reward.id,text:CONSUMABLES.find(item=>item.id===reward.id)!.name}); break;
      case 'itemShards': put({kind:'material',id:`shard:${reward.id}`,text:EQUIPMENT.find(item=>item.id===reward.id)!.name}, true); break;
      case 'recipeCard': {
        const known = RECIPES.filter(item=>game.knownRecipeIds.includes(item.id));
        const advanced = known.filter(item=>!isStarterRecipe(item.id));
        (advanced.length ? advanced : known).forEach(item=>put({kind:'card',id:item.id,text:item.name}));
        break;
      }
      case 'mysteryBottle': [...ALCOHOL_PRODUCTS].sort((a,b)=>b.price-a.price).slice(0,Math.max(1,Math.ceil(ALCOHOL_PRODUCTS.length*.3))).forEach(item=>put({kind:'item',id:item.id,text:item.name}, false, item.id)); break;
      case 'box': put({kind:'box',id:reward.box,text:`${reward.box} box`}); break;
      case 'parts': put({kind:'material',id:'parts',text:'Workshop parts'}); break;
      case 'coins': case 'crystals': case 'xp': case 'prestige': put({kind:reward.kind,text:reward.kind}); break;
    }
  };
  const kinds = props.boxId === 'choice' ? ['silver','gold'] as const : [props.boxId];
  const pool = new Map<string,Reward>();
  for (const kind of kinds) {
    const table = BOX_TABLES[kind as keyof typeof BOX_TABLES];
    if (!table) continue;
    // Enumerate the finite item selectors in the actual drop tables, without rolling or changing the game.
    for (const entry of table) for (let step=0; step<=100; step++) { const reward=entry.make(game.level,()=>Math.min(.999999,step/100)); pool.set(`${reward.kind}:${'id' in reward ? reward.id : ''}`,reward); }
  }
  for (const reward of pool.values()) add(reward);
  return [...items.values()];
});
</script>

<template>
  <section class="box-rewards" aria-label="Possible chest rewards">
    <h3>Possible rewards</h3>
    <div class="box-rewards-grid">
      <span v-for="item in rewards" :key="item.key" class="box-reward" :class="[item.line.rarity,{fragments:item.fragments}]" tabindex="0" :title="`${item.line.text}${item.fragments ? ' fragments' : ''}`" :aria-label="`${item.line.text}${item.fragments ? ' fragments' : ''}`">
        <BrandBottle v-if="item.bottleId" :brand="ALCOHOL_PRODUCTS.find(product=>product.id===item.bottleId)!.brand" :category="ALCOHOL_PRODUCTS.find(product=>product.id===item.bottleId)!.type" />
        <RewardArt v-else :line="item.line" :fragments="item.fragments" />
      </span>
    </div>
  </section>
</template>

<style scoped>
.box-rewards { margin:0 0 18px; }
.box-rewards h3 { margin:0 0 10px;color:#e8cf9d;font:600 15px Georgia,serif; }
.box-rewards-grid { display:grid;grid-template-columns:repeat(auto-fill,minmax(62px,1fr));gap:6px;max-height:260px;overflow-y:auto;padding:3px;overscroll-behavior:contain; }
.box-reward { position:relative;display:grid;place-items:center;aspect-ratio:1;min-width:0;overflow:hidden;border:1px solid #746449;border-radius:5px;background:#0b1320 var(--ui-card-art) center / cover no-repeat; }
.box-reward.rare { border-color:#77b8c9; }.box-reward.legendary { border-color:#e6bf70; }
.box-reward:focus-visible { outline:2px solid #ffe3a0;outline-offset:1px; }
.box-reward :deep(.item-art) { width:85%;height:85%; }
.box-reward :deep(.art-character) { height:94%; }
.fragment-mark { position:absolute;left:3px;top:3px;padding:1px 3px;border-radius:3px;background:#111723de;color:#96dfe8;font:700 13px/1.2 system-ui; }
</style>
