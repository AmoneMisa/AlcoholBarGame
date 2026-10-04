<script setup lang="ts">
import {computed,ref,watch} from 'vue';
import UiInput from '../ui/UiInput.vue';
import OptionSelect from '../game/OptionSelect.vue';
const props=defineProps<{items:{id:string;label:string;group?:string;character?:string}[]}>();
const model=defineModel<string>({default:''});
const search=ref(''),group=ref('all');
const groups=computed(()=>[{value:'all',label:'All categories'},...[...new Set(props.items.map(i=>i.group).filter((value):value is string=>!!value))].sort().map(value=>({value,label:value}))]);
const options=computed(()=>props.items.filter(item=>(group.value==='all'||item.group===group.value) && `${item.label} ${item.id} ${item.group ?? ''} ${item.character ?? ''}`.toLowerCase().includes(search.value.trim().toLowerCase())).map(item=>({value:item.id,label:`${item.label}${item.character ? ' · '+(item.character==='noa' ? 'Noa' : 'Leo') : ''}`})));
watch(options,()=>{if(model.value && !options.value.some(item=>item.value===model.value))model.value='';});
</script>
<template><div class="admin-catalog-picker"><UiInput v-model="search" label="Search items" placeholder="Name, theme or item ID" /><OptionSelect v-if="groups.length>1" v-model="group" label="Background / game" :options="groups" /><OptionSelect v-model="model" label="Item" :options="options" /><small v-if="!options.length">No matching items.</small></div></template>
<style scoped>.admin-catalog-picker{display:grid;gap:10px;flex:1 1 100%;min-width:0;max-width:100%;grid-template-columns:repeat(auto-fit,minmax(min(220px,100%),1fr))}.admin-catalog-picker small{grid-column:1/-1}</style>
