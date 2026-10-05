import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { canAnimateScene, sceneMotion } from '../src/ui/sceneMotion.ts';
import { MOTION_LAYERS, MOTION_PAINTINGS, roomMotion, motionPaintingBox } from '../src/domain/sceneMotion.ts';
import { roomWind } from '../src/domain/sceneMotion.ts';
import { windCanvasSize, createWindRenderer } from '../src/ui/windRenderer.ts';
import { modularSceneFor } from '../src/data/cosmetics/modularScenes.ts';
import { projectSceneGeometry } from '../src/data/cosmetics/barLines.ts';
import { SHELF_DECOR_PRESETS, shelfDecorPresetFor } from '../src/data/cosmetics/shelfDecor.ts';
import { WINDOW_BACKDROPS, windowBackdropFor } from '../src/data/cosmetics/windowBackdrops.ts';
import { INTERIORS } from '../src/data/cosmetics/bars.ts';

test('wind stays in reviewed curtain and foliage regions, with geometry for mobile cropping', () => {
  for (const room of ['parisian','garden','beach']) {
    const regions=roomWind(room);
    assert.ok(regions.length>0 && regions.length<=8);
    assert.ok(MOTION_PAINTINGS[room]);
    for (const rect of regions) {
      assert.equal(rect.kind,room==='parisian'?'curtain':'leaves');
      assert.ok(rect.x>=0 && rect.y>=0 && rect.x+rect.width<=1 && rect.y+rect.height<=1);
    }
  }
  assert.deepEqual(roomWind('unknown'),[]);
  assert.deepEqual(roomWind('winter'),[]);
});

test('wind render target is bounded even on large and portrait screens; unavailable WebGL fails safely', () => {
  assert.deepEqual(windCanvasSize(1920,1080),{width:768,height:432});
  assert.deepEqual(windCanvasSize(390,844),{width:237,height:512});
  assert.deepEqual(windCanvasSize(390,300),{width:390,height:300});
  assert.throws(()=>createWindRenderer({getContext:()=>null},{}),/WebGL is unavailable/);
});

test('decorative scene motion is opt-in and stops for every performance and accessibility constraint', () => {
  assert.equal(sceneMotion.value,'static');
  assert.equal(canAnimateScene('static',false,false,true),false);
  assert.equal(canAnimateScene('animated',false,false,true),true);
  for (const args of [
    ['animated',true,false,true],['animated',false,true,true],
    ['animated',false,false,false],['animated',false,false,true,false],
    ['animated',false,false,true,true,true]
  ]) assert.equal(canAnimateScene(...args),false);
});

test('water and curtain motion stays limited to reviewed locations, light works for other rooms', () => {
  assert.equal(roomMotion('cyberpunk').light,'neon');
  assert.equal(roomMotion('velvet').light,'warm');
  assert.equal(roomMotion('beach').water.length,1);
  assert.equal(roomMotion('parisian').curtains.length,3);
  assert.equal(roomMotion('marina').water.length,2);
  assert.equal(roomMotion('underwater').caustics.length,2);
  assert.equal(roomMotion('winter').snow.length,1);
  assert.equal(roomMotion('garden').fireflies.length,2);
  assert.deepEqual(roomMotion('unknown').water,[]);
  assert.deepEqual(roomMotion('unknown').curtains,[]);
  for (const room of ['beach','parisian','marina','underwater','winter','garden']) for (const rect of Object.values(roomMotion(room)).filter(Array.isArray).flat()) {
    assert.ok(rect.x>=0 && rect.y>=0 && rect.x+rect.width<=1 && rect.y+rect.height<=1);
    assert.ok(MOTION_PAINTINGS[room]?.width>0 && MOTION_PAINTINGS[room]?.height>0, 'local effects require painting proportions');
  }
});

test('local motion follows the painting crop instead of drifting on narrow screens', () => {
  assert.deepEqual(motionPaintingBox(800,400,400,400),{width:800,height:400,left:-200,top:0});
  assert.deepEqual(motionPaintingBox(800,400,800,800,.62),{width:1600,height:800,left:-400,top:0});
  assert.deepEqual(motionPaintingBox(400,800,400,400,.62),{width:400,height:800,left:0,top:-248});
});

test('every motion asset is a small transparent looping animated WebP, not a static file', () => {
  for (const file of Object.values(MOTION_LAYERS)) {
    const data=readFileSync(new URL('../public/assets/bar/motion/'+file,import.meta.url));
    assert.equal(data.toString('ascii',0,4),'RIFF');
    assert.equal(data.toString('ascii',8,12),'WEBP');
    assert.ok(data.length < 64*1024,`${file}: ${data.length} bytes`);
    let frames=0,loop,flags,width,height;
    for (let offset=12;offset+8<=data.length;) {
      const kind=data.toString('ascii',offset,offset+4),size=data.readUInt32LE(offset+4),start=offset+8;
      if(kind==='ANMF') frames++;
      if(kind==='ANIM') loop=data.readUInt16LE(start+4);
      if(kind==='VP8X') { flags=data[start];width=data.readUIntLE(start+4,3)+1;height=data.readUIntLE(start+7,3)+1; }
      offset=start+size+(size%2);
    }
    assert.equal(frames,20,file);
    assert.equal(loop,0,'infinite loop');
    assert.equal(flags&0x12,0x12,'animation and alpha flags');
    assert.ok(width*height*frames*4 <= 3*1024*1024,'bounded decoded frame area');
  }
});


test('Velvet owns modular art and geometry instead of reading positions from one painted room', () => {
  const scene=modularSceneFor('velvet');
  assert.ok(scene);
  assert.equal(scene.layers[0]?.role,'architecture');
  assert.equal(scene.layers.filter(layer=>layer.role==='shelves').length,2);
  assert.equal(scene.layers.filter(layer=>layer.role==='seating').length,5);
  assert.ok(scene.layers.some(layer=>layer.role==='counter'));
  assert.ok(scene.layers.every(layer=>layer.asset?.startsWith('/assets/bar/modular/velvet/')));
  const projected=projectSceneGeometry(scene.geometry,1774,887,scene.positionY);
  assert.equal(projected.back,559);
  assert.equal(projected.seat,674);
  assert.deepEqual(projected.stools,[177,532,887,1242,1597]);
  assert.deepEqual(projected.shelf.planks,[195,310,426]);
  assert.equal(projected.shelf.left,213);
  assert.equal(projected.shelf.right,727);
  assert.equal(modularSceneFor('garden'),undefined);
});


test('shelf decor presets are bounded, deterministic and cover the requested visual themes', () => {
  const ids=SHELF_DECOR_PRESETS.map(preset=>preset.id);
  for(const required of ['luxury-whiskey','wine-cellar','budget-mix','fantasy-elixirs','cyberpunk-liquids']) assert.ok(ids.includes(required));
  for(const preset of SHELF_DECOR_PRESETS){
    assert.ok(preset.items.length>=9,preset.id);
    for(const item of preset.items){
      assert.ok(item.cell>=0 && item.cell<24,`${preset.id}: atlas cell`);
      assert.ok(item.x>0 && item.x<1,`${preset.id}: x`);
      assert.ok(item.row>=0 && item.row<=2,`${preset.id}: row`);
      assert.ok((item.scale??1)>.5 && (item.scale??1)<1.5,`${preset.id}: scale`);
    }
  }
  assert.ok(!ids.includes('auto'));
  assert.equal(shelfDecorPresetFor('luxury-whiskey').id,'luxury-whiskey');
  assert.equal(shelfDecorPresetFor('cyberpunk-liquids').id,'cyberpunk-liquids');
});

test('Velvet exposes shelf decor bays between furniture and foreground layers', () => {
  const scene=modularSceneFor('velvet');
  assert.ok(scene?.shelfDecor);
  assert.equal(scene.shelfDecor.bays.length,2);
  assert.equal(scene.shelfDecor.z,15);
  for(const bay of scene.shelfDecor.bays){
    assert.equal(bay.rowBaselines.length,3);
    assert.ok(bay.rect.x>=0 && bay.rect.y>=0 && bay.rect.x+bay.rect.width<=1 && bay.rect.y+bay.rect.height<=1);
  }
});


test('window backdrops are explicit collection pieces, never auto-derived from an interior', () => {
  const ids=WINDOW_BACKDROPS.map(item=>item.id);
  assert.ok(!ids.includes('auto'));
  for(const required of ['skyline','rooftop','cyberpunk','winter','beach','marina','desert','tropical','inferno-penthouse']) assert.ok(ids.includes(required));
  assert.ok(WINDOW_BACKDROPS.every(item=>item.asset.startsWith('/assets/bar/backgrounds/')));
  assert.equal(windowBackdropFor('skyline').label,'Skyline lounge view');
  assert.equal(windowBackdropFor('cyberpunk').asset,'/assets/bar/backgrounds/interior-cyberpunk.webp');
  const scene=modularSceneFor('velvet');
  assert.equal(scene?.exterior?.enabled,true);
});


test('every catalog interior has a modular split manifest', () => {
  const ids=INTERIORS.map(item=>item.id);
  assert.equal(new Set(ids).size,ids.length);
  for(const id of ids){
    const url=new URL(`../scripts/modular-scenes/${id}.json`,import.meta.url);
    assert.ok(existsSync(url),`missing modular manifest: ${id}`);
    const manifest=JSON.parse(readFileSync(url,'utf8'));
    assert.equal(manifest.id,id);
    assert.ok(manifest.source?.includes('/assets/bar/backgrounds/'),`${id}: source`);
    assert.ok(manifest.modules?.['architecture-reference'],`${id}: architecture`);
    assert.ok(manifest.modules?.['shelf-reference'],`${id}: shelf`);
    assert.ok(manifest.modules?.['counter-reference'],`${id}: counter`);
    assert.ok(manifest.status==='geometry-ready-art-review-required'||manifest.status==='geometry-review-required',`${id}: status`);
  }
});
