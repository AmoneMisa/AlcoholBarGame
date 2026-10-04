<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { BARTENDER_OUTFITS, INTERIORS, interiorStyle, type InteriorId } from '../../data/cosmetics/bars';
import { bartenderCostumesFor } from '../../data/cosmetics/bartenderCostumes';
import { COSMETICS, canUseCosmetic } from '../../domain/cosmetics';
import { ownedFirst } from '../../domain/appearanceRewards';
import { styleLabel } from '../../domain/styleInfo';
import { useGameStore } from '../../stores/game';
import CharacterModel from '../characters/CharacterModel.vue';
import UiInput from '../ui/UiInput.vue';
import UiIcon from '../ui/UiIcon.vue';
import UiButton from '../ui/UiButton.vue';
const props=defineProps<{kind:'background'|'style';character:'noa'|'leo';selected:string}>();
const emit=defineEmits<{pick:[id:string]}>();
const game=useGameStore();const search=ref('');const page=ref(1);const PAGE_SIZE=8;
const entries=computed(()=>{
  const items: {id:string;label:string;owned:boolean}[]=props.kind==='background' ? INTERIORS.map(item=>({id:item.id,label:item.name,owned:game.ownedInteriorIds.includes(item.id)})) : BARTENDER_OUTFITS.filter(value=>['vest','shirt','apron'].includes(value)||bartenderCostumesFor(props.character).some(item=>item.value===value)||COSMETICS.some(item=>item.key==='bartender'&&item.character===props.character&&item.value===value)).map(value=>({id:value,label:styleLabel(props.character,value),owned:canUseCosmetic(game.ownedCosmeticIds,'bartender',value,props.character)}));
  return ownedFirst(items,item=>item.owned).filter(item=>item.label.toLowerCase().includes(search.value.trim().toLowerCase()));
});
const pages=computed(()=>Math.max(1,Math.ceil(entries.value.length/PAGE_SIZE)));
const currentPage=computed(()=>Math.min(page.value,pages.value));
const visible=computed(()=>entries.value.slice((currentPage.value-1)*PAGE_SIZE,currentPage.value*PAGE_SIZE));
watch([search,()=>props.kind,()=>props.character],()=>{page.value=1;});
watch(pages,value=>{page.value=Math.min(page.value,value);});
</script>
<template>
  <section class="appearance-catalog" :aria-label="kind==='background'?'Background catalogue':'Style catalogue'">
    <header><h3>{{kind==='background'?'Backgrounds':'Styles'}}</h3><small>{{entries.length}} options</small></header>
    <UiInput v-model="search" type="search" :label="kind==='background'?'Find a background':'Find a style'" placeholder="Search by name" />
    <div class="appearance-grid">
      <button v-for="item in visible" :key="item.id" type="button" class="appearance-tile" :class="{selected:selected===item.id,owned:item.owned}" :aria-label="`Choose ${kind}: ${item.label}`" :aria-pressed="selected===item.id" @click="emit('pick',item.id)">
        <span v-if="kind==='background'" class="appearance-thumb background-thumb" :style="interiorStyle(item.id as InteriorId)" role="img" :aria-label="item.label" />
        <span v-else class="appearance-thumb style-thumb"><CharacterModel role="bartender" :character-id="character" :outfit="item.id" :art-size="128" /></span>
        <b>{{item.label}}</b><small><UiIcon :name="item.owned?'check':'lock'"/>{{selected===item.id?'Selected':item.owned?'Owned':'Not owned'}}</small>
      </button>
    </div>
    <p v-if="!entries.length">No matching items.</p>
    <nav v-if="entries.length" class="appearance-pagination" :aria-label="kind==='background'?'Background pages':'Style pages'"><UiButton size="sm" icon="arrow-left" :aria-label="`Previous ${kind} page`" :disabled="currentPage===1" @click="page=currentPage-1"/><span role="status">{{currentPage}} / {{pages}}</span><UiButton size="sm" icon="arrow-right" :aria-label="`Next ${kind} page`" :disabled="currentPage===pages" @click="page=currentPage+1"/></nav>
  </section>
</template>
<style scoped>
.appearance-catalog{display:grid;gap:10px;min-width:0}.appearance-catalog header{display:flex;align-items:center;justify-content:space-between;gap:8px}.appearance-catalog h3{margin:0;font-size:16px;color:#f5d79e}.appearance-catalog header small{font-size:12px;color:#a6b4c7}.appearance-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:8px}.appearance-tile{display:flex;flex-direction:column;gap:6px;min-width:0;padding:8px;border:1px solid #34485f;border-radius:11px;background:#101d2e;color:#eaf0f8;cursor:pointer;text-align:center}.appearance-tile.selected{border-color:#e8bf6d;box-shadow:inset 0 0 0 1px #e8bf6d}.appearance-thumb{display:block;position:relative;width:100%;height:112px;overflow:hidden;border-radius:7px}.background-thumb{background-size:cover!important}.style-thumb{height:150px;background:radial-gradient(ellipse at top,#35435a,#0b1522)}.style-thumb :deep(.art-character){position:relative!important;inset:auto!important;width:90px!important;height:150px!important;min-height:0!important;margin:auto;transform:none!important;aspect-ratio:.6!important}.appearance-tile b{font-size:13px;line-height:17px;font-weight:600;overflow-wrap:anywhere}.appearance-tile small{display:flex;align-items:center;justify-content:center;gap:4px;margin-top:auto;font-size:11px;color:#a4b3c6}.appearance-tile.owned small{color:#a1d9b7}.appearance-tile small .ui-icon{width:12px;height:12px}.appearance-pagination{display:flex;align-items:center;justify-content:center;gap:14px;font-size:13px;padding:4px 0 8px}@media(min-width:1000px){.appearance-grid{grid-template-columns:repeat(4,minmax(0,1fr))}}
</style>


