import { PAINTED_BOTTLE_ATLAS, PAINTED_BOTTLE_COLUMNS, PAINTED_BOTTLE_ROWS } from '../../domain/bottleArt';

export { PAINTED_BOTTLE_ATLAS, PAINTED_BOTTLE_COLUMNS, PAINTED_BOTTLE_ROWS };

export const SHELF_DECOR_PRESET_IDS = [
  'classic-cocktails',
  'luxury-whiskey',
  'wine-cellar',
  'budget-mix',
  'fantasy-elixirs',
  'cyberpunk-liquids',
  'velvet-original'
] as const;
export type ShelfDecorPresetId = typeof SHELF_DECOR_PRESET_IDS[number];

export interface ShelfDecorItem {
  cell:number;
  x:number;
  row:number;
  scale?:number;
  rotate?:number;
  alpha?:number;
}

export interface ShelfDecorPreset {
  id:ShelfDecorPresetId;
  label:string;
  description:string;
  density:'low'|'medium'|'high';
  filter?:string;
  glow?:string;
  atlas?:{asset:string;columns:number;rows:number};
  items:readonly ShelfDecorItem[];
}

const item=(cell:number,x:number,row:number,scale=1,rotate=0):ShelfDecorItem=>({cell,x,row,scale,rotate});
const spread=(cells:readonly number[],row:number,scale=1,offset=0):ShelfDecorItem[] =>
  cells.map((cell,index)=>item(cell,(index+1)/(cells.length+1)+offset,row,scale,(index%3-1)*1.5));

export const SHELF_DECOR_PRESETS:readonly ShelfDecorPreset[] = [
  {
    id:'velvet-original',label:'Original Velvet bottles',description:'The original painted bottles from the Velvet shelf.',density:'medium',
    atlas:{asset:'/assets/drinks/bottles/velvet-bottles-v2.webp',columns:4,rows:3},
    items:[...spread([0,1,2,3],0,.95),...spread([4,5,6,7],1,.95),...spread([8,9,10,11],2,.95)]
  },
  {
    id:'classic-cocktails',label:'Classic cocktails',description:'Balanced spirits, liqueurs and sparkling bottles.',density:'medium',
    items:[
      ...spread([0,2,3,4,6],0,.92),
      ...spread([7,8,10,12,13],1,.9),
      ...spread([9,5,11,14],2,.96)
    ]
  },
  {
    id:'luxury-whiskey',label:'Luxury whiskey',description:'Dark premium bottles, cognac-like silhouettes and restrained spacing.',density:'medium',
    filter:'saturate(1.08) contrast(1.08) brightness(.98)',
    glow:'rgba(255,177,75,.24)',
    items:[
      ...spread([5,1,5,13],0,1.08),
      ...spread([1,5,10,5],1,1.04,.015),
      ...spread([5,13,1],2,1.12)
    ]
  },
  {
    id:'wine-cellar',label:'Wine cellar',description:'Tall wine and sparkling silhouettes with more breathing room.',density:'medium',
    filter:'saturate(.9) brightness(.96)',
    items:[
      ...spread([14,9,14,9,14],0,1.02),
      ...spread([9,14,9,14],1,1.08),
      ...spread([14,14,9],2,1.1)
    ]
  },
  {
    id:'budget-mix',label:'Everyday shelf',description:'Dense mixed stock with simpler repeated bottle shapes.',density:'high',
    filter:'saturate(.82) contrast(.94) brightness(.92)',
    items:[
      ...spread([3,15,3,0,15,3],0,.82),
      ...spread([0,3,7,15,3,0],1,.82),
      ...spread([15,3,0,7,3],2,.84)
    ]
  },
  {
    id:'fantasy-elixirs',label:'Fantasy elixirs',description:'Jewel-toned potion-like bottles built from the painted bottle library.',density:'medium',
    filter:'hue-rotate(54deg) saturate(1.65) contrast(1.12) brightness(1.06)',
    glow:'rgba(116,255,178,.30)',
    items:[
      ...spread([11,12,13,6],0,.9),
      ...spread([12,11,6,13,12],1,.86),
      ...spread([13,11,12],2,1.0)
    ]
  },
  {
    id:'cyberpunk-liquids',label:'Cyberpunk liquids',description:'Cold neon stock with electric blue and magenta treatment.',density:'high',
    filter:'hue-rotate(168deg) saturate(2.15) contrast(1.25) brightness(1.12)',
    glow:'rgba(69,220,255,.42)',
    items:[
      ...spread([11,3,22,13,11,23],0,.84),
      ...spread([22,11,3,23,13,11],1,.82),
      ...spread([11,22,13,3,23],2,.88)
    ]
  }
];

const BY_ID = Object.fromEntries(SHELF_DECOR_PRESETS.map((preset)=>[preset.id,preset])) as Record<ShelfDecorPresetId,ShelfDecorPreset>;

export function shelfDecorPresetFor(selected:ShelfDecorPresetId):ShelfDecorPreset {
  return BY_ID[selected];
}

export const SHELF_DECOR_OPTIONS = SHELF_DECOR_PRESET_IDS.map((value)=>({
  value,
  label:BY_ID[value].label
}));
