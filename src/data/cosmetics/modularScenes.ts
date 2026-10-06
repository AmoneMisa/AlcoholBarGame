import type { SceneGeometry } from './barLines';
import { defineModularScene, mirrorLayer, mirrorShelfBay } from './modularSceneFactory';
import { GENERATED_MODULAR_SCENES } from './generatedModularScenes';

export type ModularLayerRole = 'architecture' | 'floor' | 'wall' | 'shelves' | 'seating' | 'counter' | 'decor';
export type ModularSelectionKey = 'wall' | 'counter' | 'counterColor' | 'shelf' | 'seating' | 'floor';

export interface NormalizedRect { x:number; y:number; width:number; height:number }
export interface ShelfDecorBay { rect:NormalizedRect; rowBaselines:readonly number[] }

export interface ModularSceneLayer {
  id: string;
  role: ModularLayerRole;
  z: number;
  asset?: string;
  rect?: NormalizedRect;
  selection?: ModularSelectionKey;
  variants?: Readonly<Record<string,string>>;
  flipX?: boolean;
}

export interface ModularSceneDefinition {
  id: string;
  status: 'authoring' | 'production';
  canvas: { width:number; height:number };
  positionY: number;
  geometry: SceneGeometry;
  layers: readonly ModularSceneLayer[];
  // Slots are scene-space contracts. Art can be replaced without changing gameplay anchors.
  slots: Readonly<Record<string, NormalizedRect>>;
  exterior?: { enabled:true };
  shelfDecor?: {
    z:number;
    bays:readonly ShelfDecorBay[];
    panelTop:string;
    panelBottom:string;
    rail:string;
  };
  lighting: {
    lightA: { x:number; y:number; radius:number };
    lightB: { x:number; y:number; radius:number };
    vignette: number;
  };
}

const VELVET_GEOMETRY: SceneGeometry = {
  width:1774,height:887,back:.63,seat:.76,
  stools:[.10,.30,.50,.70,.90],
  // The left bay is the interactive bottle shelf; the right bay is decorative
  // in this first modular slice. This keeps bottles away from the centre neon.
  shelf:{x0:.12,x1:.41,planks:[.22,.35,.48]}
};

const shelfLeft:ModularSceneLayer = {id:'shelf-left',role:'shelves',z:10,asset:'/assets/bar/modular/velvet/shelf.webp',selection:'shelf',rect:{x:.12,y:.09,width:.29,height:.48}};
const shelfRight = mirrorLayer(shelfLeft,'shelf-right');
const decorBayLeft:ShelfDecorBay = {rect:{x:.145,y:.145,width:.24,height:.34},rowBaselines:[.29,.60,.91]};
const decorBayRight = mirrorShelfBay(decorBayLeft);

export const MODULAR_SCENES: Readonly<Record<string,ModularSceneDefinition>> = {
  ...GENERATED_MODULAR_SCENES,
  velvet:defineModularScene({
    id:'velvet',
    status:'production',
    canvas:{width:1774,height:887},
    positionY:.5,
    geometry:VELVET_GEOMETRY,
    layers:[
      {id:'architecture',role:'architecture',z:0,asset:'/assets/bar/modular/velvet/architecture.webp'},
      shelfLeft,
      shelfRight,
      {id:'counter',role:'counter',z:20,asset:'/assets/bar/modular/velvet/counter.webp',selection:'counter',rect:{x:-.015,y:.57,width:1.03,height:.285}},
      {id:'seat-1',role:'seating',z:30,asset:'/assets/bar/modular/velvet/stool.webp',selection:'seating',rect:{x:.0275,y:.742,width:.145,height:.255}},
      {id:'seat-2',role:'seating',z:30,asset:'/assets/bar/modular/velvet/stool.webp',selection:'seating',rect:{x:.2275,y:.742,width:.145,height:.255}},
      {id:'seat-3',role:'seating',z:30,asset:'/assets/bar/modular/velvet/stool.webp',selection:'seating',rect:{x:.4275,y:.742,width:.145,height:.255}},
      {id:'seat-4',role:'seating',z:30,asset:'/assets/bar/modular/velvet/stool.webp',selection:'seating',rect:{x:.6275,y:.742,width:.145,height:.255}},
      {id:'seat-5',role:'seating',z:30,asset:'/assets/bar/modular/velvet/stool.webp',selection:'seating',rect:{x:.8275,y:.742,width:.145,height:.255}}
    ],
    slots:{
      wall:{x:0,y:0,width:1,height:.63},
      shelves:{x:.12,y:.09,width:.76,height:.48},
      seating:{x:.0275,y:.742,width:.945,height:.255},
      counter:{x:-.015,y:.57,width:1.03,height:.285},
      floor:{x:0,y:.63,width:1,height:.37}
    },
    exterior:{enabled:true},
    shelfDecor:{
      z:15,
      bays:[decorBayLeft,decorBayRight],
      panelTop:'#25120d',
      panelBottom:'#120907',
      rail:'#b8782b'
    },
    lighting:{
      lightA:{x:.24,y:.10,radius:.58},
      lightB:{x:.79,y:.12,radius:.52},
      vignette:.12
    }
  })
};

export const modularSceneFor = (interior:string, allowAuthoring=false) => {
  const scene=MODULAR_SCENES[interior];
  return scene && (scene.status==='production' || allowAuthoring) ? scene : undefined;
};

export function layerAsset(layer:ModularSceneLayer, selections:Partial<Record<ModularSelectionKey,string>>, fallback?:string) {
  if (layer.id==='architecture') return layer.asset ?? fallback;
  const selected=layer.selection ? selections[layer.selection] : undefined;
  return (selected && layer.variants?.[selected]) || layer.asset;
}
