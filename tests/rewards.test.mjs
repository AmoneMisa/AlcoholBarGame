import test from 'node:test';
import assert from 'node:assert/strict';
import { snapshot, rewardLines } from '../src/domain/rewards.ts';
import { createInitialState } from '../src/sim/state.ts';
import { COSMETICS } from '../src/domain/cosmetics.ts';
import { emptyCompanions } from '../src/sim/companions.ts';

test('Chest reports include materials, items and boxes, ignoring resources spent', () => {
  const state = createInitialState(Date.UTC(2026, 9, 2));
  state.loot.boxes.bronze = 1;
  const before = snapshot(state);
  state.loot.boxes.bronze--;
  state.loot.parts += 8;
  state.loot.consumables['golden-ice'] = 2;
  state.loot.boxes.gold = 1;
  const lines = rewardLines(before, snapshot(state));
  assert.ok(lines.some(line => line.kind === 'material' && line.id === 'parts' && line.text.startsWith('+8')));
  assert.ok(lines.some(line => line.kind === 'item' && line.id === 'golden-ice' && line.text.endsWith('×2')));
  assert.ok(lines.some(line => line.kind === 'box' && line.id === 'gold'));
  assert.ok(!lines.some(line => line.id === 'bronze'));
  assert.equal(before.items['golden-ice'], undefined, 'snapshot is independent of mutated inventory');
});

test('New unlocks preserve their identity and rarity for the reveal; owned companions do not repeat', () => {
  const state = createInitialState(Date.UTC(2026, 9, 2));
  const before = snapshot(state);
  const style = COSMETICS.find(item => !state.ownedCosmeticIds.includes(item.id));
  state.ownedCosmeticIds.push(style.id);
  state.ownedInteriorIds.push('palace');
  state.companions = emptyCompanions();
  state.companions.owned.mirelle = 0;
  let lines = rewardLines(before, snapshot(state));
  assert.ok(lines.some(line => line.kind === 'style' && line.id === style.id && line.rarity === style.rarity));
  assert.ok(lines.some(line => line.kind === 'background' && line.id === 'palace'));
  assert.ok(lines.some(line => line.kind === 'companion' && line.id === 'mirelle'));
  const joined = snapshot(state);
  state.companions.owned.mirelle = 50;
  lines = rewardLines(joined, snapshot(state));
  assert.ok(!lines.some(line => line.kind === 'companion'));
});
