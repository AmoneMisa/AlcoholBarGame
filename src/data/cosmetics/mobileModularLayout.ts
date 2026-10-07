import type { ModularSceneDefinition, ModularSceneLayer, NormalizedRect } from './modularScenes';
import { MOBILE_BAR_ART } from './mobileBarArt';
import { ORIGINAL_ROOM_SHELVES } from './originalRoomShelves';

export function mobileModularLayout(scene: ModularSceneDefinition, width:number, height:number, seatCount?:number|string):ModularSceneDefinition {
  if(width>=760 || width<=0 || height/width<1.05) return scene;
  const shelves=scene.layers.filter(layer=>layer.role==='shelves' && layer.rect);
  if (!shelves.length) return scene;
  const original=ORIGINAL_ROOM_SHELVES[scene.id];
  const shelfArt=(asset?:string)=>original?.asset===asset ? original.bounds : MOBILE_BAR_ART[asset??''];
  const left=Math.min(...shelves.map(layer=>layer.rect!.x)),top=Math.min(...shelves.map(layer=>layer.rect!.y));
  const sw=Math.max(...shelves.map(layer=>layer.rect!.x+layer.rect!.width))-left;
  const back=height*.53;
  // Anchor the visible furniture base, ignoring transparent padding around the shelf art.
  const shelfBase=Math.max(...shelves.map(layer=>{
    const crop=shelfArt(layer.asset)?.crop;
    return layer.rect!.y+layer.rect!.height*(crop ? crop.y+crop.height : 1);
  }));
  const visibleTop=Math.min(...shelves.map(layer=>layer.rect!.y+layer.rect!.height*(shelfArt(layer.asset)?.crop.y??0)));
  // Keep shelves at room scale; the outer bays may continue beyond the phone's edges.
  const originalArrangement=shelves.some(layer=>layer.asset===original?.asset);
  const scale=Math.min(width*1.5/(sw*scene.canvas.width),height*(originalArrangement?.49:.40)/((shelfBase-visibleTop)*scene.canvas.height));
  const shelfWidth=sw*scene.canvas.width*scale;
  const shelfTop=back-(shelfBase-top)*scene.canvas.height*scale;
  const mapShelf=(r:NormalizedRect):NormalizedRect=>({x:((width-shelfWidth)/2+(r.x-left)*scene.canvas.width*scale)/width,y:(shelfTop+(r.y-top)*scene.canvas.height*scale)/height,width:r.width*scene.canvas.width*scale/width,height:r.height*scene.canvas.height*scale/height});
  const seat=Math.min(height*.74,height-144);
  // Two early rooms have no separate seat art. Give their portrait guests a real furniture anchor.
  const sourceLayers: readonly ModularSceneLayer[]=scene.layers.some(layer=>layer.role==='seating') ? scene.layers : [...scene.layers,...[1,2].map(index=>({id:`mobile-seat-${index}`,role:'seating' as const,z:30,asset:'/assets/bar/modular/velvet/stool.webp'}))];
  const originalSeats=sourceLayers.filter(layer=>layer.role==='seating');
  const count=Math.min(2,originalSeats.length,seatCount===undefined?2:Math.max(0,Math.floor(Number(seatCount)||0)));
  const seatXs=count===1?[.5]:[.25,.75];
  let index=0;
  const layers=sourceLayers.flatMap(layer=>{
    if(layer.role==='shelves' && layer.rect) return [{...layer,rect:mapShelf(layer.rect)}];
    if(layer.role==='counter'){
      const art=MOBILE_BAR_ART[layer.asset??''];
      if(!art)return [layer];
      // A bar counter has human-scale height. Crop its wide ends on a phone instead of shrinking its whole front.
      const floor=Math.min(height*.90,height-50);
      const h=Math.max(width/art.aspect,(floor-back)/(1-art.surface));
      const w=h*art.aspect;
      return [{...layer,sourceRect:art.crop,rect:{x:(width-w)/width/2,y:(back-art.surface*h)/height,width:w/width,height:h/height}}];
    }
    if(layer.role==='seating'){
      if(index>=count)return [];
      const x=seatXs[index++]!,art=MOBILE_BAR_ART[layer.asset??''];
      if(!art)return [layer];
      const w=Math.min(width*.29,108),h=Math.min(w/art.aspect,height*.24),actualWidth=h*art.aspect;
      return [{...layer,sourceRect:art.crop,rect:{x:x-actualWidth/width/2,y:(seat-art.surface*h)/height,width:actualWidth/width,height:h/height}}];
    }
    return [layer];
  });
  const bays=scene.shelfDecor?.bays.map(bay=>({...bay,rect:mapShelf(bay.rect)}));
  return {...scene,canvas:{width,height},positionY:.5,layers,
    geometry:{...scene.geometry,width,height,back:back/height,seat:seat/height,stools:seatXs.slice(0,count),bartender:.5,
      shelf:{x0:(width-shelfWidth)/width/2,x1:(width+shelfWidth)/width/2,planks:bays?.[0]?.rowBaselines.map(v=>bays[0]!.rect.y+v*bays[0]!.rect.height)??[]}},
    shelfDecor:scene.shelfDecor && {...scene.shelfDecor,bays:bays??[]}};
}
