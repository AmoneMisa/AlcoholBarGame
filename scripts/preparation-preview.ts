import { createApp, h } from 'vue';
import { createPinia } from 'pinia';
import { createInitialState } from '../src/sim/state';
import { useGameStore } from '../src/stores/game';
import PreparationScreen from '../src/components/cocktails/PreparationScreen.vue';

// This standalone preview has its own in-memory storage and never connects to a player session.
const sample = createInitialState();
sample.customers = sample.customers.slice(0, 1);
const guest = sample.customers[0]!;
Object.assign(guest, { name:'Mia', orderKind:'cocktail', orderRecipeId:'gin-tonic', orderRevealed:true, seatId:0 });
sample.activeCustomerId = guest.id;
const storage = new Map<string,string>([['barlingo-offline-v2',JSON.stringify(sample)]]);
Object.defineProperty(window,'localStorage',{value:{
  getItem:(key:string)=>storage.get(key) ?? null,
  setItem:(key:string,value:string)=>storage.set(key,value),
  removeItem:(key:string)=>storage.delete(key),
  clear:()=>storage.clear(), key:(index:number)=>[...storage.keys()][index] ?? null,
  get length(){return storage.size;}
}});
for (const path of ['style','dashboard','game','conversation','management','learning','knowledge','ui-kit','polish']) await import(`../src/${path}.css`);
const pinia = createPinia();
const game = useGameStore(pinia);
game.openPreparation(guest.id);
createApp({render:()=>game.preparationCustomerId ? h(PreparationScreen) : h('button',{onClick:()=>game.openPreparation(guest.id)},'Open cocktail preparation preview')}).use(pinia).mount('#app');
