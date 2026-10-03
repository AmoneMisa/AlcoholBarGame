import type { RewardLine, RewardKind } from './rewards';
import type { Gift } from '../sim/gifts';
import { giftLabel } from '../sim/gifts';
import { COSMETICS } from './cosmetics';
import { RECIPES, INGREDIENTS } from './catalog';
import { INTERIORS } from '../data/cosmetics/bars';
import { companionById } from './companions';
import { boxDef, consumableDef, equipmentDef } from './loot';
import { ALCOHOL_PRODUCTS } from './bottleCatalog';

export function giftAttachments(gift: Gift): RewardLine[] {
  const text=giftLabel(gift);
  if ('interiorId' in gift) return [{kind:'background',id:gift.interiorId,text}];
  if ('recipeId' in gift) return [{kind:'recipe',id:gift.recipeId,text}];
  if ('cosmeticId' in gift) return [{kind:gift.kind==='style-shards'?'material':'style',id:gift.kind==='style-shards'?`style:${gift.cosmeticId}`:gift.cosmeticId,text}];
  if (gift.kind==='consumable') return [{kind:'item',id:gift.id,text}];
  return [{kind:'material',id:'skinShards',text}];
}
type Package = {promo?: {kind:string;id?:string;amount?:number}[];changes?: {path?:string[];amount?:number;added?:string[];stock?:string;id?:string}[]};
function line(kind:RewardKind,id:string|undefined,amount=1):RewardLine {
  const names:Record<string,string>={coins:'Coins',crystals:'Crystals',xp:'XP',prestige:'Prestige',parts:'Workshop parts',skinShards:'Skin shards',stylePieces:'Style pieces'};
  const name=kind==='style'?COSMETICS.find(x=>x.id===id)?.label : kind==='background'?INTERIORS.find(x=>x.id===id)?.name : kind==='recipe'||kind==='card'?RECIPES.find(x=>x.id===id)?.name : kind==='companion'?companionById(id??'')?.title : kind==='box'?boxDef(id??'')?.name : kind==='item'?consumableDef(id??'')?.name : id?.startsWith('style:background:')?`${INTERIORS.find(x=>x.id===id.slice(17))?.name ?? 'Background'} fragments` : id?.startsWith('style:')?`${COSMETICS.find(x=>x.id===id.slice(6))?.label ?? 'Style'} fragments` : id?.startsWith('shard:')?`${equipmentDef(id.slice(6))?.name ?? 'Item'} shards` : undefined;
  return {kind,id,text:`${name ?? names[id??kind] ?? id ?? kind} ×${amount}`};
}
export function rewardAttachments(payload:unknown):RewardLine[] {
  const pack=payload as Package|undefined;
  if(!pack) return [];
  if(pack.promo) return pack.promo.map(r=>line(({consumable:'item',itemShards:'material',parts:'material',backgroundShards:'material',skinShards:'material',stylePieces:'material'} as Record<string,RewardKind>)[r.kind] ?? r.kind as RewardKind,r.kind==='itemShards'?`shard:${r.id}`:r.kind==='backgroundShards'?`style:background:${r.id}`:['skinShards','stylePieces'].includes(r.kind)&&r.id?`style:${r.id}`:r.id ?? (['parts','skinShards','stylePieces'].includes(r.kind)?r.kind:undefined),r.amount??1));
  return (pack.changes??[]).flatMap(r=>{
    if(r.stock) return [{kind:'item' as const,id:r.id,text:`${(r.stock==='inventories'?INGREDIENTS:ALCOHOL_PRODUCTS).find(x=>x.id===r.id)?.name ?? r.id} ×${r.amount}`}];
    const p=r.path??[];
    if(r.added) return r.added.map(id=>line(p[0]==='ownedCosmeticIds'?'style':p[0]==='ownedInteriorIds'?'background':'recipe',id));
    if(p[0]==='money'||p[0]==='crystals'||p[0]==='xp'||p[0]==='popularity') return [line(p[0]==='money'?'coins':p[0]==='popularity'?'prestige':p[0] as RewardKind,undefined,r.amount)];
    if(p[0]==='cosmeticCopies') return [line('style',p[1],r.amount)];
    if(p[0]==='recipeCopies') return [line('card',p[1],r.amount)];
    const field=p[1],id=p[2];
    if(field==='boxes'||field==='consumables') return [line(field==='boxes'?'box':'item',id,r.amount)];
    if(field==='styleShards') return [line('material',`style:${id}`,r.amount)];
    if(field==='itemShards') return [line('material',`shard:${id}`,r.amount)];
    return [line('material',id??field,r.amount)];
  });
}
