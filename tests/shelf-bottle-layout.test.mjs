import test from 'node:test';
import assert from 'node:assert/strict';
import { shelfBottlePlacements, shelfSurface } from '../src/data/cosmetics/shelfBottleLayout.ts';
import { SHELF_DECOR_PRESETS } from '../src/data/cosmetics/shelfDecor.ts';
import { MODULAR_SCENES } from '../src/data/cosmetics/modularScenes.ts';
import { mobileModularLayout } from '../src/data/cosmetics/mobileModularLayout.ts';

const crops=Array.from({length:24},(_,index)=>({x:0,y:0,width:30+index%8*5,height:100}));
test('every physical shelf receives upright bottles with clear spacing for every preset and phone size',()=>{
  for(const original of Object.values(MODULAR_SCENES).filter(scene=>scene.status==='production')) for(const [width,height] of [[320,480],[390,640]]) for(const preset of SHELF_DECOR_PRESETS){
    const scene=mobileModularLayout(original,width,height);
    const bays=scene.shelfDecor?.bays??[];
    for(const bay of bays){
      const placements=shelfBottlePlacements([bay],preset,crops,width,height);
      for(const baseline of bay.rowBaselines){
        const row=placements.filter(b=>Math.abs(b.y-(bay.rect.y+baseline*bay.rect.height)*height)<1e-6);
        assert.ok(row.length>0,original.id+' all rows filled');
        for(const [index,bottle] of row.entries()){
          assert.ok(bottle.x-bottle.width/2>=bay.rect.x*width);
          assert.ok(bottle.x+bottle.width/2<=(bay.rect.x+bay.rect.width)*width);
          if(index)assert.ok(row[index-1].x+row[index-1].width/2<bottle.x-bottle.width/2,original.id+' no collisions');
        }
      }
    }
  }
});
test('shelf surface uses the upper plank edge rather than the bright front lip',()=>{
  const pixels=new Uint8ClampedArray(80*100*4);
  for(let y=0;y<100;y++)for(let x=0;x<80;x++){
    const value=y===45||y===46?140:y===55||y===56?220:20;
    pixels.set([value,value,value,255],(y*80+x)*4);
  }
  assert.equal(shelfSurface(pixels,80,100,5,75,58,20),45);
  pixels.fill(0);
  assert.equal(shelfSurface(pixels,80,100,5,75,58,20),58);
});
