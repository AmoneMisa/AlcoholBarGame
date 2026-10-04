<script setup lang="ts">
import { computed,ref,watch } from 'vue';
import { WISH_GIFTS,WISHLIST_MAX } from '../../domain/wishlist';
import { useGameStore } from '../../stores/game';
import ModalDialog from '../ui/ModalDialog.vue';
import UiInput from '../ui/UiInput.vue';
import UiButton from '../ui/UiButton.vue';
import RewardArt from '../ui/RewardArt.vue';
const game=useGameStore();const emit=defineEmits<{close:[]}>();
const chosen=ref([...(game.profile.wishedGifts??[])]);const search=ref('');const limit=ref(20);
const matching=computed(()=>WISH_GIFTS.filter(item=>item.line.text.toLowerCase().includes(search.value.toLowerCase())));
watch(search,()=>limit.value=20);
function toggle(id:string){if(chosen.value.includes(id))chosen.value=chosen.value.filter(item=>item!==id);else if(chosen.value.length<WISHLIST_MAX)chosen.value.push(id);}
function save(){if(game.act({type:'setWishedGifts',ids:chosen.value}))emit('close');}
</script>
<template><ModalDialog title="Desired gifts" eyebrow="YOUR PROFILE" width="640px" @close="emit('close')"><div class="wish-editor"><p>Select up to five gifts your friends will see on your profile. {{ chosen.length }} / {{ WISHLIST_MAX }}</p><div class="wish-selected"><UiButton v-for="id in chosen" :key="id" size="sm" icon="close" @click="toggle(id)">{{ WISH_GIFTS.find(item=>item.key===id)?.line.text }}</UiButton></div><UiInput v-model="search" type="search" label="Find a gift" placeholder="Search styles, backgrounds or items" /><div class="wish-options"><button v-for="item in matching.slice(0,limit)" :key="item.key" type="button" :aria-pressed="chosen.includes(item.key)" :disabled="chosen.length>=WISHLIST_MAX && !chosen.includes(item.key)" @click="toggle(item.key)"><RewardArt :line="item.line" /><span>{{ item.line.text }}</span></button></div><UiButton v-if="matching.length>limit" block @click="limit+=20">Show more</UiButton></div><template #footer><div class="wish-actions"><UiButton variant="solid" @click="save">Save gifts · {{ chosen.length }} / 5</UiButton><UiButton @click="emit('close')">Cancel</UiButton></div></template></ModalDialog></template>
<style scoped>.wish-editor{display:grid;gap:14px}.wish-editor p{margin:0;font-size:13px;color:#bbc9da;line-height:1.5}.wish-selected,.wish-actions{display:flex;flex-wrap:wrap;gap:10px}.wish-options{display:grid;grid-template-columns:repeat(auto-fill,minmax(110px,1fr));gap:10px}.wish-options button{display:grid;grid-template-rows:90px auto;gap:8px;justify-items:center;border:1px solid #526178;border-radius:10px;background:#112035;color:#e5e9ef;padding:10px;font:inherit;font-size:12px}.wish-options button[aria-pressed=true]{border-color:#f4d18c;background:#3d3023}.wish-options button:disabled{opacity:.4}.wish-options :deep(.reward-art){width:90px;height:90px}</style>
