<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { REGIONS } from '../../domain/catalog';
import { BARTENDER_OUTFITS, interiorStyle } from '../../data/cosmetics/bars';
import { useGameStore } from '../../stores/game';
import AppearancePicker from './AppearancePicker.vue';
import StylePreview from './StylePreview.vue';
import BarScene from './BarScene.vue';
import CharacterModel from '../characters/CharacterModel.vue';
import PanelHeading from '../ui/PanelHeading.vue';
import UiButton from '../ui/UiButton.vue';
import UiInput from '../ui/UiInput.vue';
import CollectionBonuses from './CollectionBonuses.vue';
const props=defineProps<{activeView?:string;designSection?:'bar'|'character'}>();
const game=useGameStore();
const section=ref<'background'|'style'|'character'>(props.designSection==='character'?'style':'background');
const character=computed(()=>(game.decor.bartenderCharacter==='leo'?'leo':'noa') as 'noa'|'leo');
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
    <PanelHeading eyebrow="PERSONALIZE" title="Bar & bartender" />
    <div class="customization-content">
      <nav class="customization-tabs" aria-label="Customization sections"><UiButton size="sm" :variant="section==='background'?'solid':'ghost'" @click="section='background'">Backgrounds</UiButton><UiButton size="sm" :variant="section==='style'?'solid':'ghost'" @click="section='style'">Styles</UiButton><UiButton size="sm" :variant="section==='character'?'solid':'ghost'" @click="section='character'">Character</UiButton></nav>
      <CollectionBonuses />
      <template v-if="section==='background'">
        <nav v-if="game.ownedBarIds.length>1" class="customization-tabs" aria-label="Choose a bar"><UiButton v-for="region in REGIONS.filter(item=>game.isBarOwned(item.id))" :key="region.id" size="sm" :variant="game.regionId===region.id?'solid':'ghost'" @click="game.switchBar(region.id)">{{region.name}}</UiButton></nav>
        <form class="customization-name" @submit.prevent="game.renameBar(barName)"><UiInput v-model="barName" label="Bar name" maxlength="32" required/><UiButton size="sm" type="submit">Save name</UiButton></form>
        <div class="customization-bar-preview" aria-label="Live preview of your bar"><BarScene preview :active="false" /></div>
        <UiButton size="sm" variant="secondary" @click="openPreview()">Preview backgrounds &amp; styles</UiButton>
        <AppearancePicker kind="background" :character="character" :selected="game.decor.interior" @pick="pickBackground" />
      </template>
      <template v-else>
        <nav class="customization-tabs" aria-label="Choose bartender"><UiButton size="sm" :variant="character==='noa'?'solid':'ghost'" @click="chooseCharacter('noa')">Noa</UiButton><UiButton size="sm" :variant="character==='leo'?'solid':'ghost'" @click="chooseCharacter('leo')">Leo</UiButton></nav>
        <div class="customization-character-preview" :style="interiorStyle(game.decor.interior)" aria-label="Current bartender style"><CharacterModel role="bartender" :character-id="character" :outfit="game.decor.bartender" :hair-style="game.decor.hairStyle" /></div>
        <AppearancePicker v-if="section==='style'" kind="style" :character="character" :selected="game.decor.bartender" @pick="pickStyle" />
        <form v-else class="customization-name" @submit.prevent="game.renameBartender(nickname)"><UiInput v-model="nickname" label="Bartender nickname" maxlength="18" required/><UiButton size="sm" type="submit">Save nickname</UiButton></form>
      </template>
    </div>
  </article>
  <StylePreview v-if="preview" :character="character" :interior="preview.interior" :outfit="preview.outfit" @close="preview=undefined" />
</template>
<style scoped>
.customization-content{display:grid;gap:12px;min-width:0;padding:12px}.customization-tabs{display:flex;flex-wrap:wrap;gap:6px;position:static}.customization-name{display:grid;grid-template-columns:minmax(0,1fr) auto;align-items:end;gap:8px}.customization-bar-preview{position:static;height:220px;overflow:hidden;border:1px solid #354962;border-radius:12px}.customization-bar-preview :deep(.bar-scene-wrap){height:100%}.customization-bar-preview :deep(.bar-scene){height:100%!important;min-height:0!important;margin:0!important;border-radius:0!important}.customization-character-preview{position:relative;height:220px;border:1px solid #354962;border-radius:12px;overflow:hidden}.customization-character-preview :deep(.art-character){position:relative!important;inset:auto!important;height:220px!important;min-height:0!important;width:132px!important;margin:0 auto;transform:none!important;aspect-ratio:.6!important}
</style>
