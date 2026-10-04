<script setup lang="ts">
import FragmentChoicePicker from './FragmentChoicePicker.vue';
import { consumableDef } from '../../domain/loot';
import BoxRewardsPreview from './BoxRewardsPreview.vue';
import { computed, ref, watch } from 'vue';
import { useGameStore } from '../../stores/game';
import OptionSelect from '../game/OptionSelect.vue';
import { RECIPES } from '../../domain/catalog';
import { INTERIORS } from '../../data/cosmetics/bars';
import { COSMETICS } from '../../domain/cosmetics';
import { BOXES, CONSUMABLES, EQUIPMENT, describeReward } from '../../domain/loot';
import { COMPANIONS, KEEPSAKES, companionName } from '../../domain/companions';

import { shardStyles, styleShardCost } from '../../sim/loot';
import InventoryShelf, { type ShelfEntry } from '../ui/InventoryShelf.vue';
import RewardArt from '../ui/RewardArt.vue';
import ModalDialog from '../ui/ModalDialog.vue';
import ConfirmDialog from '../ui/ConfirmDialog.vue';
import UiButton from '../ui/UiButton.vue';
import { INVENTORY_CATEGORIES, matchesInventoryCategory, type InventoryCategory } from '../../domain/inventoryCategories';
import { TIER_SHARD_COST } from '../../domain/loot';
import { appearanceRewardOption } from '../../domain/appearanceRewards';
const game = useGameStore();
const props=defineProps<{category?:InventoryCategory}>();
type Entry = ShelfEntry & { detail: string; action?: Parameters<typeof game.act>[0]; actionLabel?: string; reason?: string; craftRequired?: number };
const selectedKey = ref('');
const confirmingDiscard=ref(false);
const filter = ref<InventoryCategory>('all');
const activeCategory=computed(()=>props.category??filter.value);
const page=ref(1);
const scrollRecipe = ref('');
const knownRecipes = computed(() => RECIPES.filter(recipe => game.knownRecipeIds.includes(recipe.id)));

const groups = computed<{ title: string; entries: Entry[] }[]>(() => [
  { title: 'Chests & items', entries: [
    ...(game.loot.parts > 0 ? [{ key:'parts',line:{kind:'material' as const,id:'parts',text:'Workshop parts'},count:game.loot.parts,detail:'Use these parts to upgrade your bar equipment.' }] : []),
    ...BOXES.filter(item => (game.loot.boxes[item.id] ?? 0) > 0).map(item => ({ key: `box:${item.id}`, line: { kind: 'box' as const, id: item.id, text: item.name }, count: game.loot.boxes[item.id]!, detail: item.description, action: { type: 'openBox' as const, box: item.id }, actionLabel: 'Open chest', reason: game.loot.pendingChoice ? 'Pick your previous chest reward first.' : '' })),
    ...CONSUMABLES.filter(item => (game.loot.consumables[item.id] ?? 0) > 0).map(item => ({ key: `item:${item.id}`, line: { kind: 'item' as const, id: item.id, text: item.name }, count: game.loot.consumables[item.id]!, detail: item.description, action: { type: 'useConsumable' as const, id: item.id }, actionLabel: 'Use item' }))
  ] },
  { title: 'Style collection', entries: COSMETICS.filter(item => game.ownedCosmeticIds.includes(item.id)).map(item => ({ key: `style:${item.id}`, line: { kind: 'style' as const, id: item.id, rarity: item.rarity, text: item.label }, count: 1 + (game.cosmeticCopies[item.id] ?? 0), detail: `${item.rarity} ${item.key} · ${item.character ?? 'Both characters'}. Apply this style with Use.${game.cosmeticCopies[item.id] ? ` ${game.cosmeticCopies[item.id]} spare copies can be gifted to friends.` : ''}` })) },
  { title:'Backgrounds',entries:INTERIORS.filter(item=>game.ownedInteriorIds.includes(item.id)).map(item=>({key:`background:${item.id}`,line:{kind:'background' as const,id:item.id,text:item.name},count:1,detail:'Apply this background to your current bar with Use.'})) },
  {title:'Keepsakes',entries:KEEPSAKES.filter(item=>(game.circle.keepsakes[item.id]??0)>0).map(item=>({key:`gift:${item.id}`,line:{kind:'gift' as const,id:item.id,text:item.name},count:game.circle.keepsakes[item.id]!,detail:'Give this keepsake from the Circle tab to deepen a bond.'}))},
  { title:'Circle friends',entries:COMPANIONS.filter(person=>person.id in game.circle.owned).map(person=>({key:`friend:${person.id}`,line:{kind:'companion' as const,id:person.id,text:companionName(person.id)},count:1,detail:person.intro})) },
  { title: 'Style fragments', entries: [
    ...(game.loot.skinShards > 0 ? [{key:'skin-fragments',line:{kind:'material' as const,id:'skinShards',text:'Skin shards'},count:game.loot.skinShards,fragments:true,detail:'Use these shards to craft a style in the Workshop.'}] : []),
    ...shardStyles().filter(item => (game.loot.styleShards[item.id] ?? 0) > 0).map(item => ({ key: `pieces:${item.id}`, line: { kind: 'style' as const, id: item.id, rarity: item.rarity, text: item.label }, count: (game.loot.styleShards[item.id] ?? 0), fragments: true, detail: '', craftRequired: styleShardCost(item.id), action: { type: 'craftStyle' as const, cosmeticId: item.id }, actionLabel: 'Craft', reason: game.ownedCosmeticIds.includes(item.id) ? 'You already own this style.' : '' }))
  ] },
  { title: 'Background fragments', entries: INTERIORS.filter(item => (game.loot.styleShards[`background:${item.id}`] ?? 0) > 0).map(item => ({key:`background-pieces:${item.id}`,line:{kind:'background' as const,id:item.id,text:item.name},count:game.loot.styleShards[`background:${item.id}`]!,fragments:true,detail:'',craftRequired:50,action:{type:'craftStyle' as const,cosmeticId:`background:${item.id}`},actionLabel:'Craft',reason:game.ownedInteriorIds.includes(item.id)?'You already own this background.':''})) },
  { title: 'Equipment fragments', entries: EQUIPMENT.filter(item => (game.loot.itemShards[item.id] ?? 0) > 0).map(item => ({ key: `equipment:${item.id}`, line: { kind: 'material' as const, id: item.id, text: item.name }, count: game.loot.itemShards[item.id]!, fragments: true, detail: `Shards for ${item.name} in ${game.region.name}.`, craftRequired:TIER_SHARD_COST[game.loot.equipment[game.regionId]![item.id]!.tier],action:TIER_SHARD_COST[game.loot.equipment[game.regionId]![item.id]!.tier] ? {type: 'promoteEquipment' as const,item:item.id,regionId:game.regionId} : undefined,actionLabel:'Raise tier' })) },
  { title: 'Circle fragments', entries: COMPANIONS.filter(person => (game.circle.shards[person.id] ?? 0) > 0 && !(person.id in game.circle.owned)).map(person => ({ key: `companion:${person.id}`, line: { kind: 'companion' as const, id: person.id, rarity: 'rare' as const, text: companionName(person.id) }, count: game.circle.shards[person.id]!, fragments: true, detail: `${game.circle.shards[person.id]}/${person.shards} fragments · ${person.intro}`, action: { type: 'recruitCompanion' as const, id: person.id }, actionLabel: 'Invite to your Circle', reason: game.circle.shards[person.id]! < person.shards ? `Requires ${person.shards} fragments.` : '' })) }
]);
const matchingEntries=computed(()=>groups.value.flatMap(group=>group.entries).filter(entry=>matchesInventoryCategory(entry,activeCategory.value)));
const pages=computed(()=>Math.max(1,Math.ceil(matchingEntries.value.length/24)));
const currentPage=computed(()=>Math.min(page.value,pages.value));
const visibleEntries=computed(()=>matchingEntries.value.slice((currentPage.value-1)*24,currentPage.value*24));
const categoryLabel=computed(()=>INVENTORY_CATEGORIES.find(item=>item.id===activeCategory.value)?.label??'Items');
watch([activeCategory,()=>game.regionId],()=>{page.value=1;selectedKey.value='';});
watch(pages,value=>{page.value=Math.min(page.value,value);});
const selected = computed(() => groups.value.flatMap(group => group.entries).find(entry => entry.key === selectedKey.value));
const discardAction=computed(()=>{
  const entry=selected.value;if(!entry)return undefined;
  const {kind,id}=entry.line;
  const target=kind==='box'?'box':kind==='item'?'consumable':entry.fragments&&kind==='style'||entry.fragments&&kind==='background'?'styleShards':kind==='material'&&id==='parts'?'parts':kind==='material'&&id==='skinShards'?'skinShards':entry.fragments&&kind==='material'?'itemShards':undefined;
  if(!target)return undefined;
  return {type:'discardLoot' as const,kind:target,id:kind==='background'?`background:${id}`:id??'',amount:kind==='box'||kind==='item'?1:entry.count};
});
function discard(){if(discardAction.value)game.act(discardAction.value);confirmingDiscard.value=false;selectedKey.value='';}
const appearance = computed(() => selected.value && !selected.value.fragments ? appearanceRewardOption(selected.value.line,game.decor.bartenderCharacter ?? 'noa',game.ownedCosmeticIds,game.ownedInteriorIds) : undefined);
const appearanceInUse = computed(() => !!appearance.value && (game.decor as unknown as Record<string,string>)[appearance.value.key] === appearance.value.value);
function useAppearance() { if (appearance.value) game.act({type:'setDecor',key:appearance.value.key,value:appearance.value.value}); }
const isChoice = computed(()=>consumableDef(selected.value?.line.id ?? '')?.kind==='choice');
const craftIncomplete = computed(() => !!selected.value?.craftRequired && selected.value.count < selected.value.craftRequired);
const actionLabel = computed(() => craftIncomplete.value ? `Craft (${selected.value!.count} / ${selected.value!.craftRequired})` : selected.value?.actionLabel);
function activate() { const entry = selected.value; if (entry?.action && game.act(entry.action.type === 'useConsumable' && entry.action.id === 'scroll' ? { ...entry.action,recipeId:scrollRecipe.value } : entry.action)) selectedKey.value = ''; }
</script>
<template>
  <div class="inventory-panel">
    <nav v-if="!category" class="inventory-filters" aria-label="Inventory types"><UiButton v-for="type in INVENTORY_CATEGORIES" :key="type.id" size="sm" :variant="activeCategory===type.id?'solid':'ghost'" @click="filter=type.id">{{type.label}}</UiButton></nav>
    <InventoryShelf :title="categoryLabel" :entries="visibleEntries" @select="selectedKey=$event" />
    <nav v-if="pages>1" class="collection-pagination" aria-label="Collection pages"><UiButton size="sm" icon="arrow-left" aria-label="Previous collection page" :disabled="currentPage===1" @click="page=currentPage-1"/><span>{{currentPage}} / {{pages}}</span><UiButton size="sm" icon="arrow-right" aria-label="Next collection page" :disabled="currentPage===pages" @click="page=currentPage+1"/></nav>
    <ModalDialog v-if="selected" :width="selected.line.kind === 'box' ? '640px' : '520px'" :title="selected.line.text" close-label="Close item" @close="selectedKey = ''">
      <div class="inventory-inspect-art" :class="{chest:selected.line.kind === 'box',choice:isChoice}"><RewardArt :line="selected.line" :fragments="selected.fragments" /></div>
      <BoxRewardsPreview v-if="selected.line.kind === 'box' && selected.line.id" :box-id="selected.line.id" />
      <p v-else-if="selected.detail" class="inventory-note">{{ selected.detail }}</p>
      <OptionSelect v-if="selected.line.id === 'scroll'" label="Recipe" v-model="scrollRecipe" :options="[{value:'',label:'Choose a recipe'},...knownRecipes.map(recipe=>({value:recipe.id,label:recipe.name}))]" />
<FragmentChoicePicker v-if="isChoice && selected.line.id" :id="selected.line.id" @used="selectedKey=''" />
      <UiButton :disabled="craftIncomplete || (selected.line.id === 'scroll' && !scrollRecipe)" v-if="selected.action && !isChoice" variant="solid" block :reason="selected.reason" @click="activate">{{ actionLabel }}</UiButton>
      <UiButton v-if="appearance" block variant="solid" :disabled="appearanceInUse" @click="useAppearance">{{ appearanceInUse ? 'In use' : 'Use' }}</UiButton>
      <p v-else-if="!selected.fragments && selected.line.kind === 'style' && selected.line.id && COSMETICS.find(item=>item.id===selected!.line.id)?.character" class="inventory-note">This style belongs to the other bartender. Choose that character in appearance settings to wear it.</p>
      <UiButton v-if="discardAction" variant="danger" block @click="confirmingDiscard=true">Delete{{discardAction.amount>1 ? ` all ${discardAction.amount}` : ''}}</UiButton>
    </ModalDialog>
    <ConfirmDialog v-if="confirmingDiscard&&selected&&discardAction" title="Delete items?" confirm-label="Delete" danger @cancel="confirmingDiscard=false" @confirm="discard"><p>Delete {{discardAction.amount}} of {{selected.line.text}}? These items will be lost.</p></ConfirmDialog>
    <ModalDialog v-if="game.loot.pendingChoice" :closable="false" title="Choose your chest reward" @close="selectedKey = ''">
      <div class="chest-choice"><UiButton v-for="(reward,index) in game.loot.pendingChoice" :key="index" @click="game.act({type:'pickReward',index})"><span class="choice-art"><RewardArt :line="{kind:reward.kind==='box'?'box':reward.kind==='consumable'?'item':reward.kind==='coins'?'coins':reward.kind==='crystals'?'crystals':'material',id:'id' in reward?reward.id:'box' in reward?reward.box:reward.kind,text:describeReward(reward,{consumable:id=>CONSUMABLES.find(item=>item.id===id)?.name ?? id,equipment:id=>EQUIPMENT.find(item=>item.id===id)?.name ?? id})}" /></span>{{ describeReward(reward,{consumable:id=>CONSUMABLES.find(item=>item.id===id)?.name ?? id,equipment:id=>EQUIPMENT.find(item=>item.id===id)?.name ?? id}) }}</UiButton></div>
    </ModalDialog>
  </div>
</template>
<style scoped>
.collection-pagination{display:flex;align-items:center;justify-content:center;gap:12px;font-size:13px}
.inventory-panel { display: grid; gap: 14px; padding: 16px; }
.inventory-filters { display:flex;flex-wrap:nowrap;gap:6px;overflow-x:auto;padding-bottom:6px; }
.inventory-note { margin: 0 0 12px; color: #c2b3bf; font-size: 13px; line-height: 1.5; }
.inventory-inspect-art.choice{height:110px;margin-bottom:12px}
.inventory-inspect-art.chest {height:100px;margin-bottom:12px}
.inventory-inspect-art { height: 240px; margin-bottom: 16px; }
.chest-choice {display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:12px}.chest-choice :deep(.ui-btn){height:auto;min-height:156px;padding:12px 8px}.chest-choice :deep(.ui-btn-label){display:block;white-space:normal;line-height:1.4}.choice-art{display:block;height:100px;margin-bottom:12px}
</style>
