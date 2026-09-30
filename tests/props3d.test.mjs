import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const glb = readFileSync(new URL('../public/assets/props3d/bar-props.glb', import.meta.url));
const json = JSON.parse(glb.subarray(20, 20 + glb.readUInt32LE(12)).toString());
const meshes = new Set(json.nodes.filter((node) => node.mesh !== undefined).map((node) => node.name));
const glasses = JSON.parse(readFileSync(new URL('../src/data/props/glasses.json', import.meta.url), 'utf8'));

test('every glass type has a shell and a liquid volume', () => {
  const types = Object.keys(glasses).filter((key) => !key.startsWith('_'));
  assert.equal(types.length, 10);
  for (const type of types) {
    assert.ok(meshes.has(`glass_${type}`), `glass_${type}`);
    assert.ok(meshes.has(`liquid_${type}`), `liquid_${type}`);
    const { outer, inner, innerBottom, rim } = glasses[type];
    assert.ok(outer.length >= 3 && inner.length >= 2 && innerBottom < rim, `${type} profile`);
  }
});

test('garnishes, ice, shaker and inventory items exist', () => {
  for (const name of ['ice', 'garnish_lime', 'garnish_orange', 'garnish_mint', 'garnish_pineapple', 'garnish_cherry', 'shaker_body', 'shaker_cap', 'shaker_lid',
    'item_orange', 'item_salt', 'item_salt_fill', 'item_salt_cap']) assert.ok(meshes.has(name), name);
});
