import { GENERATED_SCENE_EXTERIORS } from './generatedSceneExteriors';

const BASE_WINDOW_BACKDROP_IDS = [
  'original',
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

export type WindowBackdropId = typeof BASE_WINDOW_BACKDROP_IDS[number] | typeof GENERATED_SCENE_EXTERIORS[number]['id'];
export const WINDOW_BACKDROP_IDS:readonly WindowBackdropId[] = [...BASE_WINDOW_BACKDROP_IDS,...GENERATED_SCENE_EXTERIORS.map((item:{id:WindowBackdropId})=>item.id)];

export interface WindowBackdropPreset {
  id:WindowBackdropId;
  label:string;
  asset:string;
  // Normalized crop of an independent outdoor panorama.
  sourceRect:{x:number;y:number;width:number;height:number};
}

export const WINDOW_BACKDROPS:readonly WindowBackdropPreset[] = [
  {id:'skyline',label:'Skyline lounge view',asset:'/assets/bar/exteriors/skyline.webp',sourceRect:{x:0,y:0,width:1,height:1}},
  {id:'rooftop',label:'Metropolitan rooftop view',asset:'/assets/bar/exteriors/rooftop.webp',sourceRect:{x:0,y:0,width:1,height:1}},
  {id:'cyberpunk',label:'Cyberpunk night view',asset:'/assets/bar/exteriors/cyberpunk.webp',sourceRect:{x:0,y:0,width:1,height:1}},
  {id:'winter',label:'Winter conservatory view',asset:'/assets/bar/exteriors/winter.webp',sourceRect:{x:0,y:0,width:1,height:1}},
  {id:'beach',label:'Beach club view',asset:'/assets/bar/exteriors/beach.webp',sourceRect:{x:0,y:0,width:1,height:1}},
  {id:'marina',label:'Midnight marina view',asset:'/assets/bar/exteriors/marina.webp',sourceRect:{x:0,y:0,width:1,height:1}},
  {id:'desert',label:'Desert sunset view',asset:'/assets/bar/exteriors/desert.webp',sourceRect:{x:0,y:0,width:1,height:1}},
  {id:'tropical',label:'Tropical greenhouse view',asset:'/assets/bar/exteriors/tropical.webp',sourceRect:{x:0,y:0,width:1,height:1}},
  {id:'inferno-penthouse',label:'Midnight penthouse view',asset:'/assets/bar/exteriors/inferno-penthouse.webp',sourceRect:{x:0,y:0,width:1,height:1}},
  {id:'palace',label:'Palace sunset garden',asset:'/assets/bar/exteriors/palace.webp',sourceRect:{x:0,y:0,width:1,height:1}},
  {id:'parisian',label:'Paris night view',asset:'/assets/bar/exteriors/parisian.webp',sourceRect:{x:0,y:0,width:1,height:1}},
  {id:'riad',label:'Riad city dusk',asset:'/assets/bar/exteriors/riad.webp',sourceRect:{x:0,y:0,width:1,height:1}},
  ...GENERATED_SCENE_EXTERIORS
];

const BY_ID=Object.fromEntries(WINDOW_BACKDROPS.map(item=>[item.id,item])) as Partial<Record<WindowBackdropId,WindowBackdropPreset>>;
export const windowBackdropFor=(id:WindowBackdropId):WindowBackdropPreset=>BY_ID[id]??WINDOW_BACKDROPS[0]!;
export const WINDOW_BACKDROP_OPTIONS=[{value:'original',label:'Original view'},...WINDOW_BACKDROPS.map(({id,label})=>({value:id,label}))];
