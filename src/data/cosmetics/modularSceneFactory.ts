import type { ModularSceneDefinition, ModularSceneLayer, NormalizedRect, ShelfDecorBay } from './modularScenes';

export function mirrorRect(rect:NormalizedRect):NormalizedRect {
  return {x:1-rect.x-rect.width,y:rect.y,width:rect.width,height:rect.height};
}

export function mirrorLayer(layer:ModularSceneLayer,id:string):ModularSceneLayer {
  if(!layer.rect) throw new Error(`Cannot mirror layer ${layer.id} without a rect.`);
  return {...layer,id,rect:mirrorRect(layer.rect),flipX:!layer.flipX};
}

export function mirrorShelfBay(bay:ShelfDecorBay):ShelfDecorBay {
  return {...bay,rect:mirrorRect(bay.rect)};
}

export function defineModularScene<T extends ModularSceneDefinition>(scene:T):T {
  if(scene.canvas.width<=0||scene.canvas.height<=0) throw new Error(`${scene.id}: invalid canvas`);
  const rects:[string,NormalizedRect][]=[
    ...scene.layers.filter(layer=>layer.rect).map(layer=>[layer.id,layer.rect!] as [string,NormalizedRect]),
    ...Object.entries(scene.slots),
    ...(scene.shelfDecor?.bays.map((bay,index)=>[`shelfDecor.${index}`,bay.rect] as [string,NormalizedRect])??[])
  ];
  for(const [name,rect] of rects){
    if(!Number.isFinite(rect.x+rect.y+rect.width+rect.height)||rect.width<=0||rect.height<=0||rect.x<-.1||rect.y<-.1||rect.x+rect.width>1.1||rect.y+rect.height>1.1)
      throw new Error(`${scene.id}.${name}: rect is outside the scene`);
  }
  for(const bay of scene.shelfDecor?.bays??[]) for(const baseline of bay.rowBaselines)
    if(baseline<=0||baseline>=1) throw new Error(`${scene.id}: shelf row baseline must be inside its bay`);
  return scene;
}
