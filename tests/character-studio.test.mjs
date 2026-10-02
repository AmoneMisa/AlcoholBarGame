import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { BODY, composeLayers, renderSvg } from '../src/domain/characterStudio/art.ts';
import { MAN_BODY } from '../src/domain/characterStudio/manArt.ts';
import { RIG, RIGS, DEFAULT_LOOK, DEFAULTS, OPTIONS_BY_MODEL, HAIR_COLORS, validateLook, parseSavedLook, serializeLook } from '../src/domain/characterStudio/rig.ts';

test('canonical body and coordinate contract match the frozen prototype baseline', () => {
  const baseline = JSON.parse(readFileSync(new URL('../src/domain/characterStudio/baseline.json', import.meta.url)));
  assert.equal(createHash('sha256').update(JSON.stringify(RIG) + BODY).digest('hex'), baseline.sha256);
  assert.ok(Object.isFrozen(RIG.anchors.eyeLeft));
  assert.throws(() => { RIG.anchors.eyeLeft[0] = 0; });
});
test('every prototype combination preserves body, layer order, and unique SVG IDs', () => {
 for (const model of ['woman', 'man']) {
  const rig = RIGS[model];
  const body = model === 'woman' ? BODY : MAN_BODY;
  let combinations = [{}];
  for (const [key, values] of Object.entries(OPTIONS_BY_MODEL[model])) combinations = combinations.flatMap(combo => values.map(value => ({ ...combo, [key]: value })));
  for (const combo of combinations) {
    const look = { ...DEFAULTS[model], ...combo };
    const layers = composeLayers(look, model);
    assert.equal(layers.find(asset => asset.layer === 'body').svg, body);
    assert.ok(layers.every(asset => asset.rig === rig.id));
    const order = layers.map(asset => rig.layers.indexOf(asset.layer));
    assert.deepEqual(order, [...order].sort((a, b) => a - b));
    const svg = renderSvg(look, undefined, false, model);
    assert.match(svg, /viewBox="0 0 600 1000"/);
    const ids = [...svg.matchAll(/\bid="([^"]+)"/g)].map(match => match[1]);
    assert.equal(ids.length, new Set(ids).size);
    for (const match of svg.matchAll(/url\(#([^\)]+)\)/g)) assert.ok(ids.includes(match[1]));
  }
  assert.equal(combinations.length, 2916);
 }
});
test('hair recolors reuse geometry and material changes stay independent', () => {
  const original = composeLayers(DEFAULT_LOOK);
  for (const hairColor of HAIR_COLORS) {
    const recolored = composeLayers({ ...DEFAULT_LOOK, hairColor });
    assert.equal(recolored.find(a => a.layer === 'hairBack').svg, original.find(a => a.layer === 'hairBack').svg);
    assert.equal(recolored.find(a => a.layer === 'hairFront').svg, original.find(a => a.layer === 'hairFront').svg);
  }
  for (const region of ['primary', 'secondary', 'trim']) {
    const next = { ...DEFAULT_LOOK, [region]: '#123456' };
    assert.equal(composeLayers(next).find(a => a.layer === 'body').svg, BODY);
    const svg = renderSvg(next);
    for (const other of ['primary', 'secondary', 'trim'].filter(key => key !== region)) assert.ok(svg.includes(DEFAULT_LOOK[other]));
  }
});
test('untrusted imports cannot inject markup or mix rigs', () => {
  assert.equal(validateLook({ ...DEFAULT_LOOK, hairColor: '"><script/>' }), false);
  assert.equal(validateLook({ ...DEFAULT_LOOK, eyes: 'unknown' }), false);
  assert.equal(validateLook(null), false);
  assert.throws(() => renderSvg({ ...DEFAULT_LOOK, primary: 'red' }));
});

test('male rig is independently frozen; existing woman fingerprint remains unchanged', () => {
  const baseline = JSON.parse(readFileSync(new URL('../src/domain/characterStudio/man-baseline.json', import.meta.url)));
  assert.equal(createHash('sha256').update(JSON.stringify(RIGS.man) + MAN_BODY).digest('hex'), baseline.sha256);
  assert.notEqual(MAN_BODY, BODY);
  assert.notDeepEqual(RIGS.man.anchors.shoulderLeft, RIGS.woman.anchors.shoulderLeft);
  assert.notDeepEqual(RIGS.man.anchors.mouth, RIGS.woman.anchors.mouth);
  assert.ok(Object.isFrozen(RIGS.man.anchors.eyeLeft));
  assert.throws(() => { RIGS.man.anchors.eyeLeft[0] = 0; });
});

test('cross-rig layers, hairstyles and outfits fail closed in both directions', () => {
  for (const [model, other] of [['woman', 'man'], ['man', 'woman']]) {
    for (const asset of composeLayers(DEFAULTS[other], other)) {
      assert.throws(() => renderSvg(DEFAULTS[model], asset, false, model), /Cross-mannequin/);
    }
    for (const key of ['hair', 'outfit', 'accessory']) {
      assert.equal(validateLook({ ...DEFAULTS[model], [key]: DEFAULTS[other][key] }, model), false);
    }
    assert.throws(() => composeLayers(DEFAULTS[other], model));
  }
});

test('saved looks route to matching rigs and preserve independent selections', () => {
  const woman = { ...DEFAULTS.woman, hair: 'bob', primary: '#654321' };
  const man = { ...DEFAULTS.man, hair: 'tied', primary: '#123456' };
  for (const [model, look] of [['woman', woman], ['man', man]]) {
    const saved = serializeLook(model, look);
    const parsed = parseSavedLook(JSON.parse(JSON.stringify(saved)));
    assert.equal(parsed.model, model);
    assert.deepEqual(parsed.look, look);
    assert.throws(() => parseSavedLook({ ...saved, revision: 999 }));
    assert.throws(() => parseSavedLook({ ...saved, rig: 'unknown-rig' }));
    const other = model === 'woman' ? 'man' : 'woman';
    assert.throws(() => parseSavedLook({ ...saved, rig: RIGS[other].id }));
    assert.equal(Object.hasOwn(parseSavedLook({ ...saved, look: { ...look, unknown: 'ignored' } }).look, 'unknown'), false);
  }
  assert.equal(woman.primary, '#654321');
  assert.equal(man.primary, '#123456');
});

test('male hair palettes reuse paths, all layers export with their own rig and pivot metadata', () => {
  for (const model of ['woman', 'man']) {
    for (const hair of OPTIONS_BY_MODEL[model].hair) {
      const original = composeLayers({ ...DEFAULTS[model], hair }, model);
      for (const hairColor of HAIR_COLORS) {
        const recolored = composeLayers({ ...DEFAULTS[model], hair, hairColor }, model);
        for (const layer of ['hairBack', 'hairFront']) assert.equal(recolored.find(a => a.layer === layer).svg, original.find(a => a.layer === layer).svg);
      }
      for (const asset of original) {
        const svg = renderSvg({ ...DEFAULTS[model], hair }, asset, false, model);
        assert.ok(svg.includes(`data-rig="${RIGS[model].id}"`));
        assert.ok(svg.includes(`--pivot-fabric:${RIGS[model].pivots.fabric[0]}px ${RIGS[model].pivots.fabric[1]}px`));
        assert.equal([...svg.matchAll(/data-layer=/g)].length, 1);
      }
    }
  }
});
