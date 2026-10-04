export type InventoryCategory = 'all' | 'chests' | 'boosters' | 'upgrades' | 'backgrounds' | 'styles' | 'shards' | 'circle';
export const INVENTORY_CATEGORIES: {id:InventoryCategory;label:string}[]=[
  {id:'all',label:'All'},{id:'chests',label:'Chests'},{id:'boosters',label:'Boosters'},
  {id:'upgrades',label:'Upgrades'},{id:'backgrounds',label:'Backgrounds'},
  {id:'styles',label:'Styles'},{id:'shards',label:'Shards'},{id:'circle',label:'Circle'}
];
export function matchesInventoryCategory(entry:{line:{kind:string;id?:string};fragments?:boolean},category:InventoryCategory){
  if(category==='all')return true;
  if(category==='shards')return !!entry.fragments;
  if(category==='upgrades')return entry.line.kind==='material' && entry.line.id!=='skinShards';
  if(entry.fragments)return false;
  if(category==='chests')return entry.line.kind==='box';
  if(category==='boosters')return entry.line.kind==='item';
  if(category==='backgrounds')return entry.line.kind==='background';
  if(category==='styles')return entry.line.kind==='style';
  return entry.line.kind==='companion'||entry.line.kind==='gift';
}
