import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import { AVATAR_OPTIONS, avatarOptionsFor } from '../src/data/cosmetics/avatar.ts';
import { BAR_PROFILE_OPTIONS } from '../src/data/cosmetics/bars.ts';
import { canUseCosmetic } from '../src/domain/cosmetics.ts';
import { avatarIdleAt } from '../src/domain/avatarMotion.ts';

const load = (file) => {
  const data = readFileSync(new URL(`../public/assets/characters/3d/${file}`, import.meta.url));
  return { data, model: JSON.parse(data.subarray(20, 20 + data.readUInt32LE(12)).toString()) };
};
const noa = load('amber.glb');
const leo = load('leo.glb');
const FACE_MORPHS = ['blink', 'eyesWide', 'eyesNarrow', 'lipsFull', 'lipsThin', 'lipsWide', 'lipsSmall', 'browArch', 'browInner', 'noseWide', 'noseNarrow', 'noseUp', 'cheekHigh', 'cheekFull', 'cheekHollow'];
const LEO_ONLY_MORPHS = ['mouthClose'];   // closes the male mouth, which the source leaves slightly open

for (const [label, { data, model }, parts, garments] of [
  ['Noa', noa, ['CC_Base_Body', 'CC_Base_Eye', 'Bun', 'Bang', 'Hair_Base', 'SKM_Hair_Bangs', 'Crop_T_Shirt', 'Punk_Leather_Jacket', 'Jeans', 'Suit_Jacket', 'Suit_Skirt', 'Punk_Strap_Boots', 'Boots', 'Bunny_Leotard', 'Bunny_Jacket', 'Bunny_Stockings', 'Bunny_BunnyEars'],
    ['CC_Base_Body', 'Jeans', 'Crop_T_Shirt', 'Punk_Leather_Jacket', 'Boots', 'Suit_Jacket', 'Suit_Skirt', 'Punk_Strap_Boots']],
  ['Leo', leo, ['CC_Base_Body', 'CC_Base_Eye', 'Male_Bushy', 'Short_blowback', 'Plaid_Punk_Shirt', 'Mens_Jacket', 'Jeans', 'Boots', 'Biker_Jeans', 'Chinstrap_Thick', 'Circle_Thick', 'Mustache_Horseshoe', 'Soul_Path_Thick'],
    ['CC_Base_Body', 'Jeans', 'Plaid_Punk_Shirt', 'Mens_Jacket', 'Boots']]
]) {
  test(`${label}: the avatar is self-contained and has every editable part`, () => {
    assert.equal(data.toString('ascii', 0, 4), 'glTF');
    assert.equal(data.readUInt32LE(8), data.length);
    assert.ok(model.images.every((image) => image.bufferView !== undefined && !image.uri));
    const names = new Set(model.meshes.map((mesh) => mesh.name));
    for (const name of parts) assert.ok(names.has(name), name);
  });
  test(`${label}: has a fixed body shape and keeps face UVs and expressions`, () => {
    // The body shape is baked in: garments carry no runtime body morphs, only the face keeps expression targets.
    for (const mesh of model.meshes.filter((mesh) => garments.includes(mesh.name) && mesh.name !== 'CC_Base_Body')) assert.ok(!mesh.extras?.targetNames?.includes('bodyCurvy'), mesh.name);
    const body = model.meshes.find((mesh) => mesh.name === 'CC_Base_Body');
    for (const morph of [...FACE_MORPHS, ...(label === 'Leo' ? LEO_ONLY_MORPHS : [])]) assert.ok(body.extras.targetNames.includes(morph), morph);
    assert.ok(!body.extras.targetNames.includes('bodyBroad'));
    assert.ok(body.primitives.every((part) => part.attributes.TEXCOORD_1 !== undefined));
    for (const mesh of model.meshes) assert.ok((mesh.weights ?? []).every((weight) => weight === 0), `${mesh.name}: expressions must start neutral`);
    const lashes = model.materials.filter((material) => /Eyelash/.test(material.name));
    assert.ok(lashes.length > 0);
    for (const material of lashes) {
      const colour = material.pbrMetallicRoughness?.baseColorFactor ?? [1, 1, 1, 1];
      assert.ok(colour.slice(0, 3).every((channel) => channel < .05), `${material.name}: lashes must not export white`);
    }
  });
  test(`${label}: stays light enough for mobile`, () => {
    let vertices = 0;
    for (const mesh of model.meshes) for (const primitive of mesh.primitives) vertices += model.accessors[primitive.attributes.POSITION].count;
    // Every outfit and hair style is stored in the file, but only one outfit and one hairstyle are drawn at a time.
    assert.ok(vertices < 130000, `stored vertices: ${vertices}`);
    const count = (mesh) => mesh.primitives.reduce((sum, p) => sum + model.accessors[p.attributes.POSITION].count, 0);
    const heaviest = model.meshes.filter((mesh) => /^(Loose_|Bunny_|Suit_)/.test(mesh.name)).map(count).sort((a, b) => b - a)[0] ?? 0;
    assert.ok(heaviest <= 17000, `heaviest garment: ${heaviest}`);
    assert.ok(data.length < 12 * 1024 * 1024, `bytes: ${data.length}`);
    // Units are metres: a centimetre-scale export would be 100x taller.
    const body = model.meshes.find((mesh) => mesh.name === 'CC_Base_Body');
    const height = Math.max(...body.primitives.map((p) => model.accessors[p.attributes.POSITION].max[1]));
    assert.ok(height > 1.5 && height < 2.1, `height: ${height}`);
  });
}

test('Leo jacket preserves separate leather, lining and metal materials', () => {
  const jacket=leo.model.meshes.find((mesh)=>mesh.name==='Mens_Jacket');
  assert.ok(leo.model.meshes.some((mesh)=>mesh.name==='Jacket_Shirt'),'fitted shirt insert must accompany the open jacket');
  const used=jacket.primitives.map((part)=>leo.model.materials[part.material]);
  for(const name of ['Leather','Lining','Metal']) assert.ok(used.some((material)=>material.name==='Cloth_Jacket_'+name));
  const leather=used.find((material)=>material.name==='Cloth_Jacket_Leather');
  assert.ok(leather.normalTexture && leather.pbrMetallicRoughness.baseColorTexture);
  assert.ok(!jacket.extras?.targetNames?.length,'jacket fit is baked, without facial expressions');
});

test('Every editor choice remains valid for saved profiles and server validation', () => {
  for (const option of AVATAR_OPTIONS) for (const value of option.values) assert.ok(BAR_PROFILE_OPTIONS[option.key].includes(value), `${option.key}: ${value}`);
  for (const character of ['noa', 'leo']) {
    for (const option of avatarOptionsFor(character)) {
      assert.ok(option.values.length > 0);
      for (const value of option.values) assert.ok(BAR_PROFILE_OPTIONS[option.key].includes(value), `${character} ${option.key}: ${value}`);
    }
  }
});

test('Each character only offers what its model can show', () => {
  const keys = (character) => avatarOptionsFor(character).map((option) => option.key);
  assert.ok(!keys('noa').includes('facialHair'));
  assert.ok(!keys('noa').includes('bodyShape') && !keys('leo').includes('bodyShape'));   // one fixed shape each
  assert.ok(keys('leo').includes('facialHair'));
  assert.ok(!keys('leo').includes('lipColor'));
  assert.ok(keys('noa').includes('lipColor'));
  assert.ok(avatarOptionsFor('noa').find((option) => option.key === 'hairStyle').values.includes('waves'));
  assert.ok(avatarOptionsFor('leo').find((option) => option.key === 'hairStyle').values.includes('buzz'));
});

test('Idle motion stays subtle, blinks briefly, and fully stops when paused', () => {
  let closingFrames=0;
  for(let i=0;i<3000;i++) {
    const pose=avatarIdleAt(i/60);
    assert.ok(pose.blink>=0 && pose.blink<=1);
    assert.ok(Math.abs(pose.breath)<=.0023 && Math.abs(pose.yaw)<=.046 && Math.abs(pose.nod)<=.013);
    if(pose.blink>.2) closingFrames++;
    assert.deepEqual(avatarIdleAt(i/60,false),{blink:0,breath:0,yaw:0,nod:0,sway:0});
  }
  assert.ok(closingFrames>0 && closingFrames<180,'eyes should remain open for over 94% of the idle cycle');
  assert.equal(avatarIdleAt(3.6).blink,1);
  assert.equal(avatarIdleAt(3.9).blink,0);
});

test('Facial hair keeps existing ownership IDs across avatars without bypassing locks', () => {
  assert.equal(canUseCosmetic([], 'facialHair', 'stubble', 'noa'), false);
  assert.equal(canUseCosmetic(['facialHair:stubble:leo'], 'facialHair', 'stubble', 'noa'), true);
  assert.equal(canUseCosmetic([], 'hairStyle', 'bun', 'noa'), false);
});
