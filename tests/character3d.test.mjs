import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import { CLIP_FOR, EXPRESSION_MORPHS, SKIN, rigFor } from '../src/domain/character3d.ts';
import { BARTENDER_OUTFITS, BROW_SHAPES, BODY_SHAPES, BUST_OPTIONS, CHEEK_SHAPES, EYE_SHAPES, FACE_SHAPES, FACIAL_HAIR_OPTIONS, HAIR_STYLES, LIP_SHAPES, NOSE_SHAPES, SKIN_TONES } from '../src/data/cosmetics/bars.ts';

// Read the shipped GLBs: mesh names, morph-target names, animation clips and materials.
function inspect(gender) {
  const glb = readFileSync(new URL(`../public/assets/characters3d/bartender-${gender}.glb`, import.meta.url));
  const json = JSON.parse(glb.subarray(20, 20 + glb.readUInt32LE(12)).toString());
  return {
    meshes: new Set(json.nodes.filter((node) => node.mesh !== undefined).map((node) => node.name)),
    morphs: new Set(json.meshes.flatMap((mesh) => mesh.extras?.targetNames ?? [])),
    clips: new Set(json.animations.map((animation) => animation.name)),
    materials: new Set(json.materials.map((material) => material.name)),
    uvs: json.meshes.every((mesh) => mesh.primitives.every((primitive) => 'TEXCOORD_0' in primitive.attributes)),
    joints: json.skins[0].joints.length
  };
}
const models = { female: inspect('female'), male: inspect('male') };
const looks = { female: { bartenderCharacter: 'noa' }, male: { bartenderCharacter: 'leo' } };

for (const gender of ['female', 'male']) {
  const model = models[gender];
  const base = looks[gender];
  test(`${gender} mannequin: every hair, beard, outfit and face part of the game exists as its own mesh`, () => {
    for (const hairStyle of HAIR_STYLES) assert.ok(model.meshes.has(rigFor({ ...base, hairStyle }).hair), `hair ${hairStyle}`);
    for (const facialHair of FACIAL_HAIR_OPTIONS.filter((item) => item !== 'clean')) assert.ok(model.meshes.has(rigFor({ ...base, facialHair }).beard), `beard ${facialHair}`);
    for (const bartender of BARTENDER_OUTFITS) for (const name of rigFor({ ...base, bartender }).visible) assert.ok(model.meshes.has(name), `${bartender}: ${name}`);
    for (const eyeShape of EYE_SHAPES) assert.ok(model.meshes.has(`eyes_${eyeShape}`), `eyes ${eyeShape}`);
    for (const browShape of BROW_SHAPES) assert.ok(model.meshes.has(`brows_${browShape}`), `brows ${browShape}`);
    for (const noseShape of NOSE_SHAPES) assert.ok(model.meshes.has(`nose_${noseShape}`), `nose ${noseShape}`);
    for (const lipShape of LIP_SHAPES) assert.ok(model.meshes.has(`mouth_${lipShape}`), `mouth ${lipShape}`);
    for (const cheekShape of CHEEK_SHAPES) assert.ok(model.meshes.has(`cheeks_${cheekShape}`), `cheeks ${cheekShape}`);
    for (const name of ['body', 'head', 'ears']) assert.ok(model.meshes.has(name), name);
  });

  test(`${gender} mannequin: morph targets, clips, materials and UVs are all there`, () => {
    const used = new Set();
    const collect = (input) => Object.keys(rigFor({ ...base, ...input }).morphs).forEach((name) => used.add(name));
    for (const face of FACE_SHAPES) collect({ face });
    for (const cheekShape of CHEEK_SHAPES) collect({ cheekShape });
    for (const bodyShape of BODY_SHAPES) collect({ bodyShape });
    for (const bust of BUST_OPTIONS) collect({ bust });
    for (const expression of Object.values(EXPRESSION_MORPHS)) Object.keys(expression).forEach((name) => used.add(name));
    for (const name of used) assert.ok(model.morphs.has(name), `missing morph target ${name}`);
    for (const clip of Object.values(CLIP_FOR)) assert.ok(model.clips.has(clip), `missing clip ${clip}`);
    for (const role of Object.keys(rigFor(base).colors)) assert.ok(model.materials.has(role) || role === 'skin', `missing material ${role}`);
    for (const role of ['skin_body', 'skin_head', 'hair', 'brow', 'lip', 'iris']) assert.ok(model.materials.has(role), role);
    assert.ok(model.uvs, 'every mesh has UVs');
  });
}

test('male and female mannequins share one skeleton so every clip fits both', () => {
  assert.equal(models.female.joints, models.male.joints);
});

test('every skin tone option has a colour, and settings change the rig', () => {
  for (const tone of SKIN_TONES) assert.match(SKIN[tone], /^#[0-9a-f]{6}$/i, tone);
  const a = rigFor({ skinTone: 'porcelain', hairColor: 'blue', bodyShape: 'muscular', facialHair: 'full-beard', eyeShape: 'cat' });
  const b = rigFor({ skinTone: 'ebony', hairColor: 'blonde', bodyShape: 'slim', facialHair: 'clean', eyeShape: 'round' });
  assert.notEqual(a.colors.skin, b.colors.skin);
  assert.notEqual(a.colors.hair, b.colors.hair);
  assert.ok(a.morphs.muscular > 0 && b.morphs.slim > 0);
  assert.equal(a.beard, 'beard_full-beard');
  assert.equal(b.beard, undefined);
  assert.ok(a.visible.has('eyes_cat') && b.visible.has('eyes_round') && !b.visible.has('eyes_cat'));
  assert.equal(rigFor({ bartenderCharacter: 'leo' }).gender, 'male');
  assert.equal(rigFor({ bartenderCharacter: 'noa' }).gender, 'female');
});
