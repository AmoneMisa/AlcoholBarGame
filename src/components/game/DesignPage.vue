<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { REGIONS } from '../../domain/catalog';
import { BARTENDER_OUTFITS, INTERIORS, interiorStyle } from '../../data/cosmetics/bars';
import { modularSceneFor } from '../../data/cosmetics/modularScenes';
import { SHELF_DECOR_OPTIONS, type ShelfDecorPresetId } from '../../data/cosmetics/shelfDecor';
import { WINDOW_BACKDROP_OPTIONS, type WindowBackdropId } from '../../data/cosmetics/windowBackdrops';
import { styleLabel } from '../../domain/styleInfo';
import { useGameStore } from '../../stores/game';
import AppearancePicker from './AppearancePicker.vue';
import StylePreview from './StylePreview.vue';
import CharacterModel from '../characters/CharacterModel.vue';
import UiButton from '../ui/UiButton.vue';
import UiInput from '../ui/UiInput.vue';
import CollectionBonuses from './CollectionBonuses.vue';
import OptionSelect from './OptionSelect.vue';
const props=defineProps<{activeView?:string;designSection?:'bar'|'character'}>();
const emit=defineEmits<{close:[]}>();
const game=useGameStore();
const section=ref<'background'|'style'|'character'>(props.designSection==='character'?'style':'background');
const character=computed(()=>(game.decor.bartenderCharacter==='leo'?'leo':'noa') as 'noa'|'leo');
const backgroundName=computed(()=>INTERIORS.find(item=>item.id===game.decor.interior)?.name??'');
const modularDefinition=computed(()=>modularSceneFor(game.decor.interior,true));
const modularBackground=computed(()=>!!modularDefinition.value);
const shelfPreset=computed({get:()=>game.decor.shelfPreset??'classic-cocktails',set:(value:string)=>{game.decor.shelfPreset=value as ShelfDecorPresetId;}});
const windowBackdrop=computed({get:()=>game.decor.windowBackdrop??'night-city',set:(value:string)=>{game.decor.windowBackdrop=value as WindowBackdropId;}});
const seatMaximum=computed(()=>modularDefinition.value?.layers.filter(layer=>layer.role==='seating').length??0);
const seatCount=computed({
  get:()=>String(Math.min(seatMaximum.value,Number(game.decor.seatCount??seatMaximum.value))),
  set:(value:string)=>{game.decor.seatCount=value as NonNullable<typeof game.decor.seatCount>;}
});
const seatCountOptions=computed(()=>Array.from({length:seatMaximum.value+1},(_,count)=>({value:String(count),label:count===0?'No seats':count===1?'1 seat':`${count} seats`})));
const barName=ref(game.decor.name);const nickname=ref(game.decor.bartenderNickname??(character.value==='leo'?'Leo':'Noa'));
watch(()=>game.regionId,()=>{barName.value=game.decor.name;nickname.value=game.decor.bartenderNickname??(character.value==='leo'?'Leo':'Noa');});
watch(()=>props.designSection,value=>{section.value=value==='character'?'style':'background';});
const preview=ref<{interior:string;outfit:string}>();
function openPreview(interior:string=game.decor.interior,outfit:string=game.decor.bartender){preview.value={interior,outfit};}
function pickBackground(id:string){if(game.ownedInteriorIds.includes(id))game.chooseInterior(id);else openPreview(id);}
function pickStyle(id:string){if(game.canUseCosmetic('bartender',id))game.decor.bartender=id as typeof BARTENDER_OUTFITS[number];else openPreview(undefined,id as typeof BARTENDER_OUTFITS[number]);}
function chooseCharacter(next:'noa'|'leo'){
  if(next===character.value)return;
  const previousDefault=character.value==='leo'?'Leo':'Noa';
  game.decor.bartenderCharacter=next;game.decor.bartender='vest';game.decor.hairStyle=next==='leo'?'slick':'updo';game.decor.hairColor=next==='leo'?'chestnut':'espresso';
  if(!game.decor.bartenderNickname||game.decor.bartenderNickname===previousDefault){nickname.value=next==='leo'?'Leo':'Noa';game.renameBartender(nickname.value);}
}
</script>
<template>
  <article class="game-panel customization-page">
    <header class="customization-heading"><h1>Customize</h1><UiButton size="sm" variant="ghost" icon="close" aria-label="Close customization" @click="emit('close')" /></header>
    <div class="customization-content">
      <nav class="customization-tabs" aria-label="Customization sections"><UiButton size="sm" :variant="section==='background'?'solid':'ghost'" @click="section='background'">Backgrounds</UiButton><UiButton size="sm" :variant="section==='style'?'solid':'ghost'" @click="section='style'">Styles</UiButton><UiButton size="sm" :variant="section==='character'?'solid':'ghost'" @click="section='character'">Character</UiButton></nav>
      <template v-if="section==='background'">
        <nav v-if="game.ownedBarIds.length>1" class="customization-tabs" aria-label="Choose a bar"><UiButton v-for="region in REGIONS.filter(item=>game.isBarOwned(item.id))" :key="region.id" size="sm" :variant="game.regionId===region.id?'solid':'ghost'" @click="game.switchBar(region.id)">{{region.name}}</UiButton></nav>
        <button type="button" class="customization-bar-preview" :style="interiorStyle(game.decor.interior)" aria-label="Preview backgrounds and styles" @click="openPreview()"><span>{{backgroundName}} <b>· In use</b></span></button>
        <AppearancePicker kind="background" :character="character" :selected="game.decor.interior" @pick="pickBackground" />
        <div v-if="modularBackground" class="bar-module-controls">
          <OptionSelect v-model="shelfPreset" label="Back-bar bottle style" :options="[...SHELF_DECOR_OPTIONS]" />
          <OptionSelect v-if="seatMaximum" v-model="seatCount" label="Bar seats" :options="seatCountOptions" />
          <OptionSelect v-if="modularDefinition?.exterior" v-model="windowBackdrop" label="View outside" :options="[...WINDOW_BACKDROP_OPTIONS]" />
          <small>One seat image is reused at the scene anchors, so changing the count does not duplicate art files. Decorative shelf bottles and the exterior view remain independent layers.</small>
        </div>
      </template>
      <template v-else>
        <nav class="customization-tabs" aria-label="Choose bartender"><UiButton size="sm" :variant="character==='noa'?'solid':'ghost'" @click="chooseCharacter('noa')">Noa</UiButton><UiButton size="sm" :variant="character==='leo'?'solid':'ghost'" @click="chooseCharacter('leo')">Leo</UiButton></nav>
        <button type="button" class="customization-character-preview" aria-label="Preview current bartender style" @click="openPreview()"><CharacterModel role="bartender" :character-id="character" :outfit="game.decor.bartender" :hair-style="game.decor.hairStyle" /><span>{{styleLabel(character,game.decor.bartender)}} <b>· In use</b></span></button>
        <AppearancePicker v-if="section==='style'" kind="style" :character="character" :selected="game.decor.bartender" @pick="pickStyle" />
        <template v-else><form class="customization-name" @submit.prevent="game.renameBartender(nickname)"><UiInput v-model="nickname" label="Bartender nickname" maxlength="18" required/><UiButton size="sm" type="submit">Save nickname</UiButton></form><form class="customization-name" @submit.prevent="game.renameBar(barName)"><UiInput v-model="barName" label="Bar name" maxlength="32" required/><UiButton size="sm" type="submit">Save name</UiButton></form><CollectionBonuses /></template>
      </template>
    </div>
  </article>
  <StylePreview v-if="preview" :character="character" :interior="preview.interior" :outfit="preview.outfit" @close="preview=undefined" />
</template>
<style scoped>
.customization-heading{display:flex;align-items:center;justify-content:space-between;gap:8px;padding:8px 12px;border-bottom:1px solid #304158}.customization-heading h1{margin:0;color:#fff0d2;font:700 23px/1.2 Georgia,serif}.customization-content{display:grid;gap:8px;min-width:0;padding:10px 12px}.customization-tabs{display:flex;flex-wrap:wrap;gap:6px;position:static}.customization-tabs[aria-label="Customization sections"]{flex-wrap:nowrap;gap:0;border:1px solid #3b516c;border-radius:8px;overflow:hidden}.customization-tabs[aria-label="Customization sections"] :deep(.ui-btn){flex:1;min-width:0;border-radius:0;border:0;font-size:12px;min-height:34px;padding:6px}.customization-name{display:grid;grid-template-columns:minmax(0,1fr) auto;align-items:end;gap:8px}.customization-bar-preview,.customization-character-preview{position:relative;display:block;width:100%;height:96px;padding:0;overflow:hidden;border:1px solid #354962;border-radius:9px;cursor:pointer;background-position:center;background-size:cover;color:#eaf0f8}.customization-bar-preview>span,.customization-character-preview>span{position:absolute;bottom:0;left:0;right:0;padding:7px;background:linear-gradient(transparent,#07121fea);font-size:11px;text-align:center}.customization-bar-preview b,.customization-character-preview b{color:#efc579;font-weight:600}.customization-character-preview{background:radial-gradient(ellipse at top,#304158,#0d1827)}.bar-module-controls{display:grid;gap:6px;padding-top:2px}.bar-module-controls small{color:#8492a6;font-size:11px;line-height:1.35}.customization-character-preview :deep(.art-character){position:relative!important;inset:auto!important;height:192px!important;min-height:0!important;width:116px!important;margin:0 auto;transform:none!important;aspect-ratio:.6!important}
</style>
