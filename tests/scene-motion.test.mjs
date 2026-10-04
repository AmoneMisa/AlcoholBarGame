import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { canAnimateScene, sceneMotion } from '../src/ui/sceneMotion.ts';
import { MOTION_LAYERS, MOTION_PAINTINGS, roomMotion, motionPaintingBox } from '../src/domain/sceneMotion.ts';
import { roomWind } from '../src/domain/sceneMotion.ts';
import { windCanvasSize, createWindRenderer } from '../src/ui/windRenderer.ts';

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
