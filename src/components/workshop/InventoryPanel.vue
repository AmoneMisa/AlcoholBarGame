<script setup lang="ts">
import FragmentChoicePicker from './FragmentChoicePicker.vue';
import { consumableDef } from '../../domain/loot';
import BoxRewardsPreview from './BoxRewardsPreview.vue';
import { computed, ref } from 'vue';
import { useGameStore } from '../../stores/game';
import OptionSelect from '../game/OptionSelect.vue';
import { RECIPES } from '../../domain/catalog';
import { INTERIORS } from '../../data/cosmetics/bars';
import { COSMETICS } from '../../domain/cosmetics';
import { BOXES, CONSUMABLES, EQUIPMENT, describeReward } from '../../domain/loot';
import { COMPANIONS, companionName } from '../../domain/companions';

import { shardStyles, styleShardCost } from '../../sim/loot';
import InventoryShelf, { type ShelfEntry } from '../ui/InventoryShelf.vue';
import RewardArt from '../ui/RewardArt.vue';
import ModalDialog from '../ui/ModalDialog.vue';
import UiButton from '../ui/UiButton.vue';
const game = useGameStore();
type Entry = ShelfEntry & { detail: string; action?: Parameters<typeof game.act>[0]; actionLabel?: string; reason?: string; craftRequired?: number };
const selectedKey = ref('');
const filter = ref('All');
const scrollRecipe = ref('');
const knownRecipes = computed(() => RECIPES.filter(recipe => game.knownRecipeIds.includes(recipe.id)));
const filters = ['All', 'Chests', 'Consumables', 'Style collection', 'Backgrounds', 'Circle friends', 'Style fragments', 'Background fragments', 'Equipment fragments', 'Circle fragments'];
const groups = computed<{ title: string; entries: Entry[] }[]>(() => [
  { title: 'Chests & items', entries: [
    ...(game.loot.parts > 0 ? [{ key:'parts',line:{kind:'material' as const,id:'parts',text:'Workshop parts'},count:game.loot.parts,detail:'Use these parts to upgrade your bar equipment.' }] : []),
    ...BOXES.filter(item => (game.loot.boxes[item.id] ?? 0) > 0).map(item => ({ key: `box:${item.id}`, line: { kind: 'box' as const, id: item.id, text: item.name }, count: game.loot.boxes[item.id]!, detail: item.description, action: { type: 'openBox' as const, box: item.id }, actionLabel: 'Open chest', reason: game.loot.pendingChoice ? 'Pick your previous chest reward first.' : '' })),
    ...CONSUMABLES.filter(item => (game.loot.consumables[item.id] ?? 0) > 0).map(item => ({ key: `item:${item.id}`, line: { kind: 'item' as const, id: item.id, text: item.name }, count: game.loot.consumables[item.id]!, detail: item.description, action: { type: 'useConsumable' as const, id: item.id }, actionLabel: 'Use item' }))
  ] },
  { title: 'Style collection', entries: COSMETICS.filter(item => game.ownedCosmeticIds.includes(item.id)).map(item => ({ key: `style:${item.id}`, line: { kind: 'style' as const, id: item.id, rarity: item.rarity, text: item.label }, count: 1 + (game.cosmeticCopies[item.id] ?? 0), detail: `${item.rarity} ${item.key} · ${item.character ?? 'Both characters'}. Choose this style in Design.${game.cosmeticCopies[item.id] ? ` ${game.cosmeticCopies[item.id]} spare copies can be gifted to friends.` : ''}` })) },
  { title:'Backgrounds',entries:INTERIORS.filter(item=>game.ownedInteriorIds.includes(item.id)).map(item=>({key:`background:${item.id}`,line:{kind:'background' as const,id:item.id,text:item.name},count:1,detail:'Choose this background in your bar appearance settings.'})) },
  { title:'Circle friends',entries:COMPANIONS.filter(person=>person.id in game.circle.owned).map(person=>({key:`friend:${person.id}`,line:{kind:'companion' as const,id:person.id,text:companionName(person.id)},count:1,detail:person.intro})) },
  { title: 'Style fragments', entries: [
    ...shardStyles().filter(item => (game.loot.styleShards[item.id] ?? 0) > 0).map(item => ({ key: `pieces:${item.id}`, line: { kind: 'style' as const, id: item.id, rarity: item.rarity, text: item.label }, count: (game.loot.styleShards[item.id] ?? 0), fragments: true, detail: '', craftRequired: styleShardCost(item.id), action: { type: 'craftStyle' as const, cosmeticId: item.id }, actionLabel: 'Craft', reason: game.ownedCosmeticIds.includes(item.id) ? 'You already own this style.' : '' }))
  ] },
  { title: 'Background fragments', entries: INTERIORS.filter(item => (game.loot.styleShards[`background:${item.id}`] ?? 0) > 0).map(item => ({key:`background-pieces:${item.id}`,line:{kind:'background' as const,id:item.id,text:item.name},count:game.loot.styleShards[`background:${item.id}`]!,fragments:true,detail:'',craftRequired:50,action:{type:'craftStyle' as const,cosmeticId:`background:${item.id}`},actionLabel:'Craft',reason:game.ownedInteriorIds.includes(item.id)?'You already own this background.':''})) },
  { title: 'Equipment fragments', entries: EQUIPMENT.filter(item => (game.loot.itemShards[item.id] ?? 0) > 0).map(item => ({ key: `equipment:${item.id}`, line: { kind: 'material' as const, id: item.id, text: item.name }, count: game.loot.itemShards[item.id]!, fragments: true, detail: `Shards for ${item.name}. Raise its tier in Equipment for the bar you choose.` })) },
  { title: 'Circle fragments', entries: COMPANIONS.filter(person => (game.circle.shards[person.id] ?? 0) > 0 && !(person.id in game.circle.owned)).map(person => ({ key: `companion:${person.id}`, line: { kind: 'companion' as const, id: person.id, rarity: 'rare' as const, text: companionName(person.id) }, count: game.circle.shards[person.id]!, fragments: true, detail: `${game.circle.shards[person.id]}/${person.shards} fragments · ${person.intro}`, action: { type: 'recruitCompanion' as const, id: person.id }, actionLabel: 'Invite to your Circle', reason: game.circle.shards[person.id]! < person.shards ? `Requires ${person.shards} fragments.` : '' })) }
]);
const visibleEntries = computed(() => groups.value.filter(group => filter.value === 'All' || group.title === filter.value || (['Chests','Consumables'].includes(filter.value) && group.title === 'Chests & items')).flatMap(group => group.entries).filter(entry => filter.value === 'Chests' ? entry.line.kind === 'box' : filter.value === 'Consumables' ? entry.line.kind === 'item' : true));
const selected = computed(() => groups.value.flatMap(group => group.entries).find(entry => entry.key === selectedKey.value));
const isChoice = computed(()=>consumableDef(selected.value?.line.id ?? '')?.kind==='choice');
const craftIncomplete = computed(() => !!selected.value?.craftRequired && selected.value.count < selected.value.craftRequired);
const actionLabel = computed(() => craftIncomplete.value ? `Craft (${selected.value!.count} / ${selected.value!.craftRequired})` : selected.value?.actionLabel);
function activate() { const entry = selected.value; if (entry?.action && game.act(entry.action.type === 'useConsumable' && entry.action.id === 'scroll' ? { ...entry.action,recipeId:scrollRecipe.value } : entry.action)) selectedKey.value = ''; }
</script>
<template>
  <div class="inventory-panel">
    <nav class="inventory-filters" aria-label="Inventory types"><UiButton v-for="type in filters" :key="type" size="sm" :variant="filter === type ? 'solid' : 'ghost'" @click="filter = type">{{ type === 'Chests & items' ? 'Items' : type === 'Style collection' ? 'Styles' : type === 'Style fragments' ? 'Style fragments' : type === 'Equipment fragments' ? 'Equipment' : type === 'Circle fragments' ? 'Circle fragments' : type }}</UiButton></nav>
    <InventoryShelf :title="filter === 'All' ? 'All items' : filter" :entries="visibleEntries" @select="selectedKey = $event" />
    <ModalDialog v-if="selected" :width="selected.line.kind === 'box' ? '640px' : '520px'" :title="selected.line.text" close-label="Close item" @close="selectedKey = ''">
      <div class="inventory-inspect-art" :class="{chest:selected.line.kind === 'box',choice:isChoice}"><RewardArt :line="selected.line" :fragments="selected.fragments" /></div>
      <BoxRewardsPreview v-if="selected.line.kind === 'box' && selected.line.id" :box-id="selected.line.id" />
      <p v-else-if="selected.detail" class="inventory-note">{{ selected.detail }}</p>
      <OptionSelect v-if="selected.line.id === 'scroll'" label="Recipe" v-model="scrollRecipe" :options="[{value:'',label:'Choose a recipe'},...knownRecipes.map(recipe=>({value:recipe.id,label:recipe.name}))]" />
<FragmentChoicePicker v-if="isChoice && selected.line.id" :id="selected.line.id" @used="selectedKey=''" />
      <UiButton :disabled="craftIncomplete || (selected.line.id === 'scroll' && !scrollRecipe)" v-if="selected.action && !isChoice" variant="solid" block :reason="selected.reason" @click="activate">{{ actionLabel }}</UiButton>
    </ModalDialog>
    <ModalDialog v-if="game.loot.pendingChoice" :closable="false" title="Choose your chest reward" @close="selectedKey = ''">
      <div class="chest-choice"><UiButton v-for="(reward,index) in game.loot.pendingChoice" :key="index" @click="game.act({type:'pickReward',index})"><span class="choice-art"><RewardArt :line="{kind:reward.kind==='box'?'box':reward.kind==='consumable'?'item':reward.kind==='coins'?'coins':reward.kind==='crystals'?'crystals':'material',id:'id' in reward?reward.id:'box' in reward?reward.box:reward.kind,text:describeReward(reward,{consumable:id=>CONSUMABLES.find(item=>item.id===id)?.name ?? id,equipment:id=>EQUIPMENT.find(item=>item.id===id)?.name ?? id})}" /></span>{{ describeReward(reward,{consumable:id=>CONSUMABLES.find(item=>item.id===id)?.name ?? id,equipment:id=>EQUIPMENT.find(item=>item.id===id)?.name ?? id}) }}</UiButton></div>
    </ModalDialog>
  </div>
</template>
<style scoped>
.inventory-panel { display: grid; gap: 14px; padding: 16px; }
.inventory-filters { display:flex;flex-wrap:nowrap;gap:6px;overflow-x:auto;padding-bottom:6px; }
.inventory-note { margin: 0 0 12px; color: #c2b3bf; font-size: 12px; line-height: 1.5; }
.inventory-inspect-art.choice{height:110px;margin-bottom:12px}
.inventory-inspect-art.chest {height:100px;margin-bottom:12px}
.inventory-inspect-art { height: 240px; margin-bottom: 16px; }
.chest-choice {display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:12px}.chest-choice :deep(.ui-btn){height:auto;min-height:156px;padding:12px 8px}.chest-choice :deep(.ui-btn-label){display:block;white-space:normal;line-height:1.4}.choice-art{display:block;height:100px;margin-bottom:12px}
</style>
