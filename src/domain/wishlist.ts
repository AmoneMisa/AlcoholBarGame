import { COSMETICS } from './cosmetics';
import { INTERIORS } from '../data/cosmetics/bars';
import { restrictedTheme } from '../data/cosmetics/themeDistribution';
import { RECIPES } from './catalog';
import { CONSUMABLES } from './loot';
import type { RewardLine } from './rewards';
export const WISHLIST_MAX=5;
export const WISH_GIFTS: {key:string;line:RewardLine}[]=[
  ...COSMETICS.filter(item=>item.key==='bartender').map(item=>({key:`style:${item.id}`,line:{kind:'style' as const,id:item.id,text:`${item.character==='leo'?'Leo':'Noa'} · ${item.label}`}})),
  ...INTERIORS.filter(item=>item.crystalCost>0).map(item=>({key:`background:${item.id}`,line:{kind:'background' as const,id:item.id,text:item.name}})),
  ...RECIPES.map(item=>({key:`recipe:${item.id}`,line:{kind:'recipe' as const,id:item.id,text:item.name}})),
  ...CONSUMABLES.map(item=>({key:`item:${item.id}`,line:{kind:'item' as const,id:item.id,text:item.name}}))
];
export const validWishlist=(ids:unknown):string[]=>Array.isArray(ids)?[...new Set(ids.filter((id):id is string=>typeof id==='string'&&WISH_GIFTS.some(item=>item.key===id)))].slice(0,WISHLIST_MAX):[];
export const wishedGifts=(ids:unknown)=>validWishlist(ids).map(id=>WISH_GIFTS.find(item=>item.key===id)!.line);
