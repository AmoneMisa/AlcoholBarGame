<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { fragmentChoiceOptions } from '../../domain/fragmentChoices';
import { useGameStore } from '../../stores/game';
import RewardArt from '../ui/RewardArt.vue';
import UiInput from '../ui/UiInput.vue';
import UiButton from '../ui/UiButton.vue';
const props=defineProps<{id:string}>();const emit=defineEmits<{used:[]}>();const game=useGameStore();
const fragmentTarget=ref('');const choiceSearch=ref('');watch(()=>props.id,()=>{fragmentTarget.value='';choiceSearch.value='';});
const choiceOptions=computed(()=>fragmentChoiceOptions(props.id).filter(item=>(props.id!=='friend-choice' || !(item.id! in game.circle.owned)) && item.text.toLowerCase().includes(choiceSearch.value.toLowerCase())));
function confirm(){if(game.act({type:'useFragmentChoice',id:props.id,targetId:fragmentTarget.value}))emit('used');}
</script>
<template>      <section class="fragment-choice-picker" aria-label="Choose a fragment">
        <UiInput v-model="choiceSearch" type="search" label="Find a fragment" placeholder="Find a style, background or item" />
        <div class="fragment-choice-grid"><button v-for="option in choiceOptions" :key="option.id" type="button" :aria-pressed="fragmentTarget===option.id" :title="option.text" @click="fragmentTarget=option.id!"><RewardArt :line="option" :fragments="true" /><span>{{ option.text }}</span></button></div>
        <p v-if="!choiceOptions.length">No matching fragments.</p>
      </section><UiButton block variant="solid" :disabled="!fragmentTarget || !(game.loot.consumables[id] ?? 0)" @click="confirm">Confirm fragment</UiButton></template>
<style scoped>.fragment-choice-picker{display:grid;gap:10px;margin-bottom:14px}.fragment-choice-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(100px,1fr));gap:8px;max-height:min(260px,30vh);overflow-y:auto;padding:3px}.fragment-choice-grid button{display:grid;grid-template-rows:78px auto;gap:6px;border:1px solid #46566a;border-radius:8px;background:#0c1623;color:#e5d8c0;padding:8px;min-width:0;font-size:11px}.fragment-choice-grid button[aria-pressed=true]{border-color:#edc56f;background:#273246}.fragment-choice-grid span{line-height:1.3;overflow-wrap:anywhere}.fragment-choice-picker input{padding:10px;border:1px solid #46566a;border-radius:8px;background:#0c1623;color:white}
</style>
