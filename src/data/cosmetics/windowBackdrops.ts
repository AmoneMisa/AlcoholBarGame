export const WINDOW_BACKDROP_IDS = [
  'skyline',
  'rooftop',
  'cyberpunk',
  'winter',
  'beach',
  'marina',
  'desert',
  'tropical',
  'inferno-penthouse',
  'palace',
  'parisian',
  'riad'
] as const;

export type WindowBackdropId = typeof WINDOW_BACKDROP_IDS[number];

export interface WindowBackdropPreset {
  id:WindowBackdropId;
  label:string;
  asset:string;
  // Normalized source crop inside the already-existing background art.
  // These can be tuned per artwork without changing renderer or save format.
  sourceRect:{x:number;y:number;width:number;height:number};
}

export const WINDOW_BACKDROPS:readonly WindowBackdropPreset[] = [
  {id:'skyline',label:'Skyline lounge view',asset:'/assets/bar/backgrounds/skyline-lounge.webp',sourceRect:{x:.12,y:.02,width:.76,height:.58}},
  {id:'rooftop',label:'Metropolitan rooftop view',asset:'/assets/bar/backgrounds/interior-rooftop.webp',sourceRect:{x:.10,y:.02,width:.80,height:.56}},
  {id:'cyberpunk',label:'Cyberpunk night view',asset:'/assets/bar/backgrounds/interior-cyberpunk.webp',sourceRect:{x:.08,y:.02,width:.84,height:.58}},
  {id:'winter',label:'Winter conservatory view',asset:'/assets/bar/backgrounds/interior-winter.webp',sourceRect:{x:.10,y:.02,width:.80,height:.58}},
  {id:'beach',label:'Beach club view',asset:'/assets/bar/backgrounds/interior-beach.webp',sourceRect:{x:.08,y:.02,width:.84,height:.58}},
  {id:'marina',label:'Midnight marina view',asset:'/assets/bar/backgrounds/interior-marina.webp',sourceRect:{x:.08,y:.02,width:.84,height:.58}},
  {id:'desert',label:'Desert sunset view',asset:'/assets/bar/backgrounds/interior-desert.webp',sourceRect:{x:.08,y:.02,width:.84,height:.58}},
  {id:'tropical',label:'Tropical greenhouse view',asset:'/assets/bar/backgrounds/interior-tropical.webp',sourceRect:{x:.08,y:.02,width:.84,height:.58}},
  {id:'inferno-penthouse',label:'Midnight penthouse view',asset:'/assets/bar/backgrounds/inferno-penthouse-club.webp',sourceRect:{x:.08,y:.02,width:.84,height:.58}},
  {id:'palace',label:'Palace sunset garden',asset:'/assets/bar/backgrounds/interior-palace.webp',sourceRect:{x:.34,y:.10,width:.32,height:.46}},
  {id:'parisian',label:'Paris night view',asset:'/assets/bar/backgrounds/interior-parisian.webp',sourceRect:{x:.13,y:.06,width:.18,height:.39}},
  {id:'riad',label:'Riad city dusk',asset:'/assets/bar/backgrounds/interior-riad.webp',sourceRect:{x:.84,y:.11,width:.16,height:.46}}
];

const BY_ID=Object.fromEntries(WINDOW_BACKDROPS.map(item=>[item.id,item])) as Record<WindowBackdropId,WindowBackdropPreset>;
export const windowBackdropFor=(id:WindowBackdropId)=>BY_ID[id];
export const WINDOW_BACKDROP_OPTIONS=WINDOW_BACKDROPS.map(({id,label})=>({value:id,label}));
