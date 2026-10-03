import { coins } from '../src/domain/economy';
import { grantCosmetic, addStyleShards } from '../src/sim/loot';

// Capture only transferable rewards; claim counters, event progress and paid costs stay applied.
const scalars=['money','crystals','xp','popularity'];
const lists=['ownedCosmeticIds','ownedInteriorIds','knownRecipeIds'];
const maps=[['cosmeticCopies'],['recipeCopies'],['loot','parts'],['loot','skinShards'],['loot','stylePieces'],['loot','styleShards'],['loot','itemShards'],['loot','consumables'],['loot','boxes'],['companions','shards'],['companions','keepsakes']];
const at=(object,path)=>path.reduce((value,key)=>value?.[key],object);
const parent=(object,path)=>{let value=object;for(const key of path.slice(0,-1)) value=value[key]??={};return value;};
export function deferEventRewards(before,state) {
  const changes=[];
  const numeric=path=>{
    const old=at(before,path)??0, next=at(state,path)??0;
    if (typeof next!=='number' || next<=old) return;
    const amount=coins(next-old); changes.push({path,amount}); parent(state,path)[path.at(-1)]=old;
  };
  for(const key of scalars) numeric([key]);
  for(const path of maps) {
    const value=at(state,path);
    if(typeof value==='number') numeric(path);
    else for(const key of Object.keys(value??{})) numeric([...path,key]);
  }
  for(const key of lists) {
    const added=state[key].filter(id=>!before[key].includes(id));
    if(added.length){changes.push({path:[key],added});state[key]=state[key].filter(id=>!added.includes(id));}
  }
  // Store stable product IDs, never array indices that might change during the 180-day wait.
  for(const [field,idKey,countKey] of [['inventories','ingredientId','amount'],['bottleInventories','productId','quantity']]) {
    for(const [region,shelf] of Object.entries(state[field])) for(const item of shelf) {
      const old=before[field][region]?.find(other=>other[idKey]===item[idKey])?.[countKey]??0;
      if(item[countKey]>old){changes.push({stock:field,region,id:item[idKey],amount:Math.round((item[countKey]-old)*100)/100});item[countKey]=old;}
    }
  }
  if(changes.some(item=>item.path?.[0]==='xp')) state.loot.weekly=structuredClone(before.loot.weekly);
  return changes;
}
export function claimEventRewards(state,changes) {
  for(const item of changes) {
    if(item.stock){const shelf=state[item.stock][item.region];let stock=shelf.find(stock=>stock[item.stock==='inventories'?'ingredientId':'productId']===item.id);if(!stock){stock=item.stock==='inventories'?{ingredientId:item.id,amount:0}:{productId:item.id,quantity:0};shelf.push(stock);}stock[item.stock==='inventories'?'amount':'quantity']+=item.amount;}
    else if(item.added){for(const id of item.added){if(item.path[0]==='ownedCosmeticIds')grantCosmetic(state,id);else if(!state[item.path[0]].includes(id))state[item.path[0]].push(id);else if(item.path[0]==='knownRecipeIds')state.recipeCopies={...state.recipeCopies,[id]:(state.recipeCopies?.[id]??0)+1};}}
    else if(item.path?.[0]==='loot' && ['skinShards','stylePieces'].includes(item.path[1])) addStyleShards(state,item.amount,()=>0);
    else {const holder=parent(state,item.path),key=item.path.at(-1);holder[key]=coins((holder[key]??0)+item.amount);}
  }
}
