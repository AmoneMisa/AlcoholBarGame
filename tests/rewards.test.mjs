import test from 'node:test';
import assert from 'node:assert/strict';
import { snapshot, rewardLines } from '../src/domain/rewards.ts';
import { createInitialState } from '../src/sim/state.ts';
import { COSMETICS } from '../src/domain/cosmetics.ts';
import { emptyCompanions } from '../src/sim/companions.ts';
import { appearanceRewardOption, ownedFirst } from '../src/domain/appearanceRewards.ts';
import { applyAction } from '../src/sim/rules.ts';

test('Received styles only offer application to the matching bartender, and unowned rewards never offer it',()=>{
  const line={kind:'style',id:'bartender:reference-streetwear:noa',text:'New style'};
  assert.equal(appearanceRewardOption(line,'leo',[line.id],[]),undefined);
  assert.equal(appearanceRewardOption(line,'noa',[],[]),undefined);
  const option=appearanceRewardOption(line,'noa',[line.id],[]);
  assert.equal(option.label,'Wear now');
  const state=createInitialState(Date.UTC(2026,9,4));state.ownedCosmeticIds.push(line.id);
  state.bars[state.regionId].bartenderCharacter='noa';
  applyAction(state,{type:'setDecor',key:option.key,value:option.value},{now:state.lastClockAt,spawnCustomers:false});
  assert.equal(state.bars[state.regionId].bartender,'reference-streetwear');
  assert.equal(state.bars[state.regionId].bartenderCharacter,'noa');
  assert.equal(appearanceRewardOption({kind:'background',id:'riad',text:'New background'},'leo',[],[]),undefined);
  assert.deepEqual(appearanceRewardOption({kind:'background',id:'riad',text:'New background'},'leo',[],['riad']),{key:'interior',value:'riad',label:'Use background'});
});
test('Unlocked outfits precede locked outfits while retaining the order within each group',()=>{
  const items=['locked-a','owned-a','locked-b','owned-b'];
  assert.deepEqual(ownedFirst(items,item=>item.startsWith('owned')),['owned-a','owned-b','locked-a','locked-b']);
  assert.deepEqual(items,['locked-a','owned-a','locked-b','owned-b']);
});

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
