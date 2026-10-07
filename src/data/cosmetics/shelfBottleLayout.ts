import type { ShelfDecorPreset } from './shelfDecor';
import type { ShelfDecorBay } from './modularScenes';

export interface BottleCrop { x:number; y:number; width:number; height:number }

// Reviewed row markers can point to the front lip. Find the upper illuminated edge nearby.
export function shelfSurface(pixels:Uint8ClampedArray,width:number,height:number,x0:number,x1:number,baseline:number,radius:number) {
  const mean=(y:number)=>{
    let total=0,valid=0;
    for(let i=0;i<24;i++){
      const x=Math.max(0,Math.min(width-1,Math.round(x0+(x1-x0)*(i+.5)/24)));
      const offset=(Math.max(0,Math.min(height-1,y))*width+x)*4;
      if(pixels[offset+3]!<128)continue;
      total+=pixels[offset]!*.2126+pixels[offset+1]!*.7152+pixels[offset+2]!*.0722;valid++;
    }
    return valid>=18 ? total/valid : 0;
  };
  const start=Math.max(2,Math.round(baseline-radius)),end=Math.min(height-1,Math.round(baseline+4));
  const edges=Array.from({length:Math.max(0,end-start+1)},(_,i)=>({y:start+i,delta:mean(start+i)-mean(start+i-2)}));
  const peak=Math.max(0,...edges.map(edge=>edge.delta));
  return peak<12 ? baseline : edges.find(edge=>edge.delta>=peak*.45)!.y;
}

export function shelfBottlePlacements(bays:readonly ShelfDecorBay[],preset:ShelfDecorPreset,crops:readonly BottleCrop[],width:number,height:number) {
  const gaps=bays.flatMap(bay=>bay.rowBaselines.map((line,index)=>(line-(index?bay.rowBaselines[index-1]!:0))*bay.rect.height*height)).filter(gap=>gap>0);
  const bottleHeight=Math.min(height*.115,Math.min(...gaps)*.80);
  const patterns=[...new Set(preset.items.map(item=>item.row))].sort((a,b)=>a-b).map(row=>preset.items.filter(item=>item.row===row));
  if(!patterns.length)return [];
  return bays.flatMap(bay=>bay.rowBaselines.flatMap((line,row)=>{
    const pattern=patterns[row%patterns.length]!;
    const available=bay.rect.width*width;
    const widest=Math.max(...pattern.map(item=>{const crop=crops[item.cell%crops.length]!;return crop.width/crop.height*bottleHeight*(item.scale??1);}));
    const count=Math.max(1,Math.min(pattern.length,Math.floor(available/(widest+4))-1));
    return Array.from({length:count},(_,index)=>{
      const item=pattern[Math.floor(index*pattern.length/count)]!;
      const crop=crops[item.cell%crops.length]!;
      const h=Math.min(bottleHeight*(item.scale??1),available*.75*crop.height/crop.width);
      return {item,crop,x:(bay.rect.x+bay.rect.width*(index+1)/(count+1))*width,y:(bay.rect.y+line*bay.rect.height)*height,width:h*crop.width/crop.height,height:h};
    });
  }));
}
