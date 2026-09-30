import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import { AVATAR_OPTIONS } from '../src/data/cosmetics/avatar.ts';
import { BAR_PROFILE_OPTIONS } from '../src/data/cosmetics/bars.ts';
import { canUseCosmetic } from '../src/domain/cosmetics.ts';
const data=readFileSync(new URL('../public/assets/characters/3d/amber.glb',import.meta.url));
const model=JSON.parse(data.subarray(20,20+data.readUInt32LE(12)).toString());
test('The avatar is self-contained and includes all editable model parts',()=>{
 assert.equal(data.toString('ascii',0,4),'glTF');
 assert.equal(data.readUInt32LE(8),data.length);
 assert.ok(model.images.every(image=>image.bufferView!==undefined && !image.uri));
 const names=new Set(model.meshes.map(mesh=>mesh.name));
 for(const name of ['CC_Base_Body','Camila_Brow','CC_Base_Eye','Bun','Bang','Hair_Base','Crop_T_Shirt','Punk_Leather_Jacket','Apron','Jeans','F_Black_Outfit_L','Punk_Strap_Boots','Boots']) assert.ok(names.has(name),name);
});
test('Body and clothing share body morphs; the head preserves face UVs and expressions',()=>{
 for(const mesh of model.meshes.filter(mesh=>['CC_Base_Body','Jeans','Crop_T_Shirt','Punk_Leather_Jacket','Boots','Apron','F_Black_Outfit_L','Punk_Strap_Boots'].includes(mesh.name))){
  for(const morph of ['bodySlim','bodyCurvy','bodyBroad','bodyMuscular']) assert.ok(mesh.extras.targetNames.includes(morph),`${mesh.name}: ${morph}`);
  for(const primitive of mesh.primitives) assert.equal(primitive.targets.length,mesh.extras.targetNames.length);
 }
 const body=model.meshes.find(mesh=>mesh.name==='CC_Base_Body');
 for(const morph of ['eyesWide','eyesNarrow','lipsFull','lipsThin','lipsWide','lipsSmall','browArch','browInner','noseWide','noseNarrow','noseUp','noseDown','cheekHigh','cheekFull','cheekHollow']) assert.ok(body.extras.targetNames.includes(morph),morph);
 assert.ok(body.primitives.every(part=>part.attributes.TEXCOORD_1!==undefined));
});
test('The model stays light enough for mobile: low vertex budget and modest file size',()=>{
 let vertices=0;
 for(const mesh of model.meshes) for(const primitive of mesh.primitives) vertices+=model.accessors[primitive.attributes.POSITION].count;
 assert.ok(vertices<80000,`vertices: ${vertices}`);
 assert.ok(data.length<12*1024*1024,`bytes: ${data.length}`);
});
test('Every editor choice remains valid for saved profiles and server validation',()=>{
 for(const option of AVATAR_OPTIONS) for(const value of option.values) assert.ok(BAR_PROFILE_OPTIONS[option.key].includes(value),`${option.key}: ${value}`);
});
test('Facial hair keeps existing ownership IDs across avatars without bypassing locks',()=>{
 assert.equal(canUseCosmetic([], 'facialHair','stubble','noa'),false);
 assert.equal(canUseCosmetic(['facialHair:stubble:leo'], 'facialHair','stubble','noa'),true);
 assert.equal(canUseCosmetic([], 'hairStyle','bun','noa'),false);
});
