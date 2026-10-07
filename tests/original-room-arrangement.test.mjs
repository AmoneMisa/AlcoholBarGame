import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import { MODULAR_SCENES, modularSceneFor } from '../src/data/cosmetics/modularScenes.ts';
import { ORIGINAL_ROOM_SHELVES, COUNTER_GLASSWARE } from '../src/data/cosmetics/originalRoomShelves.ts';
import { mobileModularLayout } from '../src/data/cosmetics/mobileModularLayout.ts';

test('original arrangements reuse installed source fragments without replacing the movable furniture or exterior',()=>{
  for(const [id,source] of Object.entries(ORIGINAL_ROOM_SHELVES)){
    const base=MODULAR_SCENES[id],before=JSON.stringify(base);
    const scene=modularSceneFor(id,false,'room-original');
    assert.ok(existsSync(new URL('../public'+source.asset,import.meta.url)),id);
    assert.equal(scene.shelfDecor,undefined,id+' no duplicate stock over original props');
    assert.ok(scene.layers.filter(layer=>layer.role==='shelves').every(layer=>layer.asset===source.asset));
    assert.equal(scene.exterior,base.exterior);
    assert.equal(scene.layers.find(layer=>layer.role==='counter').asset,base.layers.find(layer=>layer.role==='counter').asset);
    assert.deepEqual(scene.geometry,base.geometry);
    assert.equal(JSON.stringify(base),before);
    assert.equal(modularSceneFor(id,false,'wine-cellar'),base,id+' other bottle sets stay selectable');
  }
  assert.ok(existsSync(new URL('../public'+COUNTER_GLASSWARE.asset,import.meta.url)));
});
test('source decorations keep their base at the counter on tall and short phones',()=>{
  for(const [id,source] of Object.entries(ORIGINAL_ROOM_SHELVES))for(const [width,height] of [[320,480],[390,640]]){
    const scene=mobileModularLayout(modularSceneFor(id,false,'room-original'),width,height);
    const shelves=scene.layers.filter(layer=>layer.role==='shelves');
    const bottom=Math.max(...shelves.map(layer=>layer.rect.y+layer.rect.height*(source.bounds.crop.y+source.bounds.crop.height)));
    assert.ok(Math.abs(bottom-scene.geometry.back)<1e-5,id);
    assert.ok(shelves.every(layer=>layer.rect.y+layer.rect.height*source.bounds.crop.y>=0),id);
    assert.ok(scene.geometry.seat*height+96<=height-48);
  }
});
