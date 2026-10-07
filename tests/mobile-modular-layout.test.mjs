import test from 'node:test';
import assert from 'node:assert/strict';
import { MODULAR_SCENES } from '../src/data/cosmetics/modularScenes.ts';
import { mobileModularLayout } from '../src/data/cosmetics/mobileModularLayout.ts';
import { MOBILE_BAR_ART } from '../src/data/cosmetics/mobileBarArt.ts';

test('portrait furniture and gameplay share visible stool and counter anchors in every bar', () => {
  for (const original of Object.values(MODULAR_SCENES).filter(scene=>scene.status==='production')) for (const [width,height] of [[320,480],[360,640],[390,760],[430,640]]) {
    const scene=mobileModularLayout(original,width,height);
    assert.equal(scene.canvas.width,width,original.id);
    assert.equal(scene.layers.filter(l=>l.role==='seating').length,2);
    assert.ok(scene.geometry.seat*height+96<=height-48,original.id+' cards clear tools');
    const seats=scene.layers.filter(l=>l.role==='seating');
    for(const [index,layer] of seats.entries()) {
      const art=MOBILE_BAR_ART[layer.asset];
      assert.ok(art,layer.asset);
      assert.ok(Math.abs(layer.rect.x+layer.rect.width/2-scene.geometry.stools[index])<1e-6);
      assert.ok(Math.abs(layer.rect.y+art.surface*layer.rect.height-scene.geometry.seat)<1e-5);
      assert.ok(layer.rect.x>=0 && layer.rect.x+layer.rect.width<=1);
    }
    for(const layer of scene.layers.filter(l=>l.role==='counter')) {
      const art=MOBILE_BAR_ART[layer.asset];
      assert.ok(Math.abs(layer.rect.y+art.surface*layer.rect.height-scene.geometry.back)<1e-5);
      assert.ok(Math.abs(layer.rect.width*width/(layer.rect.height*height)-art.aspect)<1e-5);
      assert.ok((layer.rect.y+layer.rect.height)*height>=Math.min(height*.90,height-50)-.01,original.id+' counter rests on floor');
    }
    for (const bay of scene.shelfDecor?.bays??[]) assert.ok(Number.isFinite(bay.rect.x) && bay.rect.y>=0 && bay.rowBaselines.every(row=>bay.rect.y+row*bay.rect.height<scene.geometry.back));
  }
});
test('the visible shelf base meets the counter rather than floating at the top of the screen', () => {
  for(const original of Object.values(MODULAR_SCENES).filter(scene=>scene.status==='production')) {
    const scene=mobileModularLayout(original,390,640);
    const bottoms=scene.layers.filter(layer=>layer.role==='shelves').map(layer=>{
      const crop=MOBILE_BAR_ART[layer.asset].crop;
      return layer.rect.y+layer.rect.height*(crop.y+crop.height);
    });
    assert.ok(Math.abs(Math.max(...bottoms)-scene.geometry.back)<1e-5,original.id);
  }
});
test('portrait layout preserves source definitions, desktop layout and requested seat counts', () => {
  const scene=MODULAR_SCENES['harry-potter'];
  const before=JSON.stringify(scene);
  assert.equal(mobileModularLayout(scene,1000,700),scene);
  assert.equal(mobileModularLayout(scene,390,300),scene);
  for(const count of [0,1,2,5]) {
    const mobile=mobileModularLayout(scene,390,640,count);
    assert.equal(mobile.geometry.stools.length,Math.min(2,count));
    assert.equal(mobile.layers.filter(l=>l.role==='seating').length,Math.min(2,count));
    if(count===1) assert.equal(mobile.geometry.stools[0],.5);
  }
  assert.equal(JSON.stringify(scene),before);
});
test('stool guests use the cushion rather than the footrest; chair guests use the seat rather than its back', () => {
  for(const id of ['harry-potter','velvet']) {
    const seat=MODULAR_SCENES[id].layers.find(layer=>layer.role==='seating');
    assert.ok(MOBILE_BAR_ART[seat.asset].surface<.1,id);
  }
  const chair=MODULAR_SCENES.izakaya.layers.find(layer=>layer.role==='seating');
  assert.ok(MOBILE_BAR_ART[chair.asset].surface>.15 && MOBILE_BAR_ART[chair.asset].surface<.3);
});
