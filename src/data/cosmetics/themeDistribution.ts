// The newly imported games have one acquisition route. Reserved games stay
// available to promo grants and saved ownership, but never enter random pools.
export const PROMO_THEME_IDS = ['worms','harry-potter','death-stranding'] as const;
export const NEW_PASS_THEME_IDS = ['gta','gta-5','gta-sa','gta-3','palworld','devil-may-cry','darksiders-3','baldurs-gate-3','diablo-4'] as const;
export const PAID_NEW_THEME_IDS = ['control','alan-wake','quantum-break','max-payne'] as const;
export const DRAW_THEME_IDS = ['resident-evil','silent-hill','batman','divinity-original-sin-2','black-desert','shadow-tomb-raider','wolf-among-us','walking-dead-s3','tropico-6'] as const;
const styles = [...DRAW_THEME_IDS.flatMap(id=>['noa','leo'].filter(character=>id!=='batman'||character==='noa').map(character=>`bartender:theme-${id}-${character}:${character}`)),
  'bartender:theme-resident-evil-claire-noa:noa','bartender:theme-resident-evil-ada-noa:noa','bartender:theme-resident-evil-chris-leo:leo','bartender:theme-resident-evil-wesker-leo:leo'];
export const THEME_DRAW_POOLS = [
  {id:'theme-draw-1',name:'Nightfall collection',styleIds:styles.slice(0,5)},
  {id:'theme-draw-2',name:'Legends collection',styleIds:styles.slice(5,9)},
  {id:'theme-draw-3',name:'Adventure collection',styleIds:styles.slice(9,13)},
  {id:'theme-draw-4',name:'Story collection',styleIds:styles.slice(13,17)},
  {id:'theme-draw-5',name:'Resident Evil collection',styleIds:styles.slice(17,21)}
] as const;
export const restrictedTheme = (id:string) => [...PROMO_THEME_IDS,...NEW_PASS_THEME_IDS,...DRAW_THEME_IDS].some(theme=>theme===id);
export const cosmeticTheme = (id:string) => {
  const value=/^bartender:theme-(.+)-(?:noa|leo):(?:noa|leo)$/.exec(id)?.[1];
  return value ? [...PROMO_THEME_IDS,...NEW_PASS_THEME_IDS,...PAID_NEW_THEME_IDS,...DRAW_THEME_IDS].sort((a,b)=>b.length-a.length).find(theme=>value===theme||value.startsWith(theme+'-')) ?? value : undefined;
};
export const randomCosmeticAllowed = (id:string) => !restrictedTheme(cosmeticTheme(id) ?? '');
