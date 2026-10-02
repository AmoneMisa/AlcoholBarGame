import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {composeRenderLayers, renderSvg} from '../src/domain/characterStudio/art.ts';
import {paintedLook} from '../src/domain/characterStudio/painted.ts';
import {RIGS} from '../src/domain/characterStudio/rig.ts';

test('painted looks use separate packaged PNGs with their own rig and existing depth order',()=>{
 for(const model of ['woman','man']){
  const look=paintedLook(model),layers=composeRenderLayers(look,model);
  const levels=layers.map(l=>RIGS[model].layers.indexOf(l.layer));
  assert.deepEqual(levels,[...levels].sort((a,b)=>a-b));
  for(const layer of layers){
   assert.equal(layer.rig,RIGS[model].id);
   assert.match(layer.svg,/data-art="painted-raster"/);
   const images=[...layer.svg.matchAll(/href="(\/assets\/Character\/Painted\/[^"<>]+)"/g)];
   assert.ok(images.length,layer.id);
   for(const [,url] of images){
    assert.ok(url.includes('/'+model+'/'));
    const bytes=fs.readFileSync('public'+url);
    assert.equal(bytes.subarray(1,4).toString(),'PNG');
   }
  }
  assert.ok(layers.some(l=>l.layer==='face'));
  assert.match(renderSvg(look,undefined,false,model),/class="eye-shut"/);
 }
});

test('recoloring changes filters without replacing painted geometry or sources',()=>{
 const base=paintedLook('woman');
 const changed={...base,hairColor:'#eeeeee',primary:'#8f354e',secondary:'#97b7a0',trim:'#aeaeae'};
 const sources=look=>[...renderSvg(look).matchAll(/<image[^>]+>/g)].map(m=>m[0]);
 assert.deepEqual(sources(base),sources(changed));
 assert.notEqual(renderSvg(base),renderSvg(changed));
});
