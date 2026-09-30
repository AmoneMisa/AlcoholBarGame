import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import { CLIP_FOR, EXPRESSION_MORPHS, rigFor } from '../src/domain/character3d.ts';
import { BARTENDER_OUTFITS, BROW_SHAPES, CHEEK_SHAPES, EYE_SHAPES, FACE_SHAPES, FACIAL_HAIR_OPTIONS, HAIR_STYLES, LIP_SHAPES, NOSE_SHAPES, BODY_SHAPES, BUST_OPTIONS } from '../src/data/cosmetics/bars.ts';

// Read the shipped GLB: mesh names, morph-target names and animation clips.
const glb = readFileSync(new URL('../public/assets/characters3d/bartender.glb', import.meta.url));
const json = JSON.parse(glb.subarray(20, 20 + glb.readUInt32LE(12)).toString());
const meshNames = new Set(json.nodes.filter((node) => node.mesh !== undefined).map((node) => node.name));
const morphNames = new Set(json.meshes.flatMap((mesh) => mesh.extras?.targetNames ?? []));
const clips = new Set(json.animations.map((animation) => animation.name));

test('every hair style, beard and outfit part of the game exists in the 3D model', () => {
  for (const style of HAIR_STYLES) assert.ok(meshNames.has(rigFor({ hairStyle: style }).hair), `hair ${style}`);
  for (const beard of FACIAL_HAIR_OPTIONS.filter((item) => item !== 'clean')) assert.ok(meshNames.has(rigFor({ facialHair: beard }).beard), `beard ${beard}`);
  for (const outfit of BARTENDER_OUTFITS) for (const part of rigFor({ bartender: outfit }).visible) assert.ok(meshNames.has(part), `${outfit}: ${part}`);
});

test('every appearance option drives morph targets that exist', () => {
  const used = new Set();
  const collect = (input) => Object.keys(rigFor(input).morphs).forEach((name) => used.add(name));
  for (const face of FACE_SHAPES) collect({ face });
  for (const eyeShape of EYE_SHAPES) collect({ eyeShape });
  for (const browShape of BROW_SHAPES) collect({ browShape });
  for (const noseShape of NOSE_SHAPES) collect({ noseShape });
  for (const lipShape of LIP_SHAPES) collect({ lipShape });
  for (const cheekShape of CHEEK_SHAPES) collect({ cheekShape });
  for (const bodyShape of BODY_SHAPES) collect({ bodyShape });
  for (const bust of BUST_OPTIONS) collect({ bust });
  for (const expression of Object.values(EXPRESSION_MORPHS)) Object.keys(expression).forEach((name) => used.add(name));
  for (const name of used) assert.ok(morphNames.has(name), `missing morph target ${name}`);
});

test('animation names used by the game map to clips in the model', () => {
  for (const [game, clip] of Object.entries(CLIP_FOR)) assert.ok(clips.has(clip), `${game} -> ${clip}`);
});

test('colours and body settings change the rig', () => {
  const a = rigFor({ skinTone: 'porcelain', hairColor: 'blue', bodyShape: 'muscular', facialHair: 'full-beard' });
  const b = rigFor({ skinTone: 'deep', hairColor: 'blonde', bodyShape: 'slim', facialHair: 'clean' });
  assert.notEqual(a.colors.skin, b.colors.skin);
  assert.notEqual(a.colors.hair, b.colors.hair);
  assert.ok(a.morphs.muscular > 0 && b.morphs.slim > 0);
  assert.equal(a.beard, 'beard_full-beard');
  assert.equal(b.beard, undefined);
});
