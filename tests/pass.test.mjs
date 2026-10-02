import test from 'node:test';
import assert from 'node:assert/strict';
import { COSMETICS } from '../src/domain/cosmetics.ts';
import {
  PASS_DAYS, PASS_EPOCH, PASS_LEVELS, PASS_LEVEL_POINTS, PASS_MS, PASS_PREMIUM_PRICE, PASS_THEMES, passEndsAt, passId, passLevel, passPointsFor, passRewards, passStartsAt, passThemeAt, themeStyleIds
} from '../src/domain/pass.ts';
import { INTERIORS } from '../src/data/cosmetics/bars.ts';
import { applyAction } from '../src/sim/rules.ts';
import { passLevelOf, passPoints } from '../src/sim/pass.ts';
import { createInitialState, normalizePlayerState } from '../src/sim/state.ts';

const T0 = PASS_EPOCH + 3 * 24 * 3600 * 1000;       // three days into the first pass
const context = (now = T0, random = () => .5) => ({ now, random, checkEnglish: (text) => ({ ok: true, corrected: text }) });
const fresh = (now = T0) => { const state = createInitialState(now); state.startingBarChosen = true; return state; };
const act = (state, action, now = T0) => applyAction(state, action, context(now));
// Plays: the same counters the real rules raise (a serve, a lesson …), so the pass sees normal play.
const play = (state, stats) => { for (const [key, amount] of Object.entries(stats)) state.loot.stats[key] = (state.loot.stats[key] ?? 0) + amount; };

test('The pass runs in fixed two-week cycles, rotating through the seasons', () => {
  assert.equal(PASS_DAYS, 14);
  assert.equal(passStartsAt(T0), PASS_EPOCH);
  assert.equal(passEndsAt(T0) - passStartsAt(T0), PASS_MS);
  assert.notEqual(passId(T0), passId(T0 + PASS_MS));
  assert.equal(passId(T0), passId(T0 + 5 * 24 * 3600 * 1000));
  const seen = PASS_THEMES.map((_, cycle) => passThemeAt(PASS_EPOCH + cycle * PASS_MS).id);
  assert.equal(new Set(seen).size, PASS_THEMES.length, 'each cycle has its own season');
  assert.equal(passThemeAt(PASS_EPOCH + PASS_THEMES.length * PASS_MS).id, PASS_THEMES[0].id, 'then it starts again');
});

test('Every season ends with its background and a costume for each bartender, all of which exist', () => {
  for (const theme of PASS_THEMES) {
    assert.ok(INTERIORS.some((item) => item.id === theme.interior), theme.id);
    for (const id of themeStyleIds(theme)) assert.ok(COSMETICS.some((item) => item.id === id), id);
    const rows = passRewards(theme);
    assert.equal(rows.length, PASS_LEVELS);
    const last = rows.at(-1);
    assert.ok(last.free.some((reward) => reward.kind === 'interior' && reward.id === theme.interior), 'the background is the grand prize');
    assert.ok(last.free.some((reward) => reward.kind === 'cosmetics' && reward.ids.length === 2), 'and the two costumes');
    assert.ok(rows.every((row) => row.free.length >= 1 && row.premium.length >= 1), 'every level has a free and a premium reward');
  }
});

test('Points come from normal play since the pass began, and set the level', () => {
  const state = fresh();
  play(state, { serves: 100, lessons: 3 });                 // before the first action of the pass: not counted
  act(state, { type: 'tick' });
  assert.equal(state.pass.id, passId(T0));
  assert.equal(passPoints(state), 0, 'what was done before the pass began does not count');
  play(state, { serves: 20, vips: 2, lessons: 1 });         // 40 + 12 + 12 = 64
  assert.equal(passPoints(state), 64);
  assert.equal(passLevelOf(state), 0);
  play(state, { serves: 6 });                               // 76 points -> level 1
  assert.equal(passLevelOf(state), 1);
  assert.equal(passLevel(PASS_LEVEL_POINTS * 50), PASS_LEVELS, 'capped at the last level');
  assert.equal(passPointsFor({ serves: 5 }, { serves: 9 }), 0, 'never negative');
});

test('Claiming: the level must be reached, each reward once, the premium track only after it is bought', () => {
  const state = fresh();
  act(state, { type: 'tick' });
  assert.throws(() => act(state, { type: 'claimPass', track: 'free', level: 1 }), /Reach pass level 1/);
  play(state, { serves: 100 });                              // 200 points -> level 2
  const coinsBefore = state.money;
  act(state, { type: 'claimPass', track: 'free', level: 1 });
  assert.ok(state.money > coinsBefore, 'level 1 pays coins');
  assert.throws(() => act(state, { type: 'claimPass', track: 'free', level: 1 }), /already claimed/);
  assert.throws(() => act(state, { type: 'claimPass', track: 'free', level: 3 }), /Reach pass level 3/);
  assert.throws(() => act(state, { type: 'claimPass', track: 'premium', level: 1 }), /premium track/);
  assert.throws(() => act(state, { type: 'claimPass', track: 'gold', level: 1 }), /Unknown pass reward/);
  assert.throws(() => act(state, { type: 'buyPassPremium' }), /crystals/);
  state.crystals = PASS_PREMIUM_PRICE + 5;
  act(state, { type: 'buyPassPremium' });
  assert.equal(state.crystals, 5);
  assert.throws(() => act(state, { type: 'buyPassPremium' }), /already have/);
  const boxes = Object.values(state.loot.boxes).reduce((sum, count) => sum + count, 0);
  act(state, { type: 'claimPass', track: 'premium', level: 1 });      // a bronze box
  assert.equal(Object.values(state.loot.boxes).reduce((sum, count) => sum + count, 0), boxes + 1);
});

test('The last level gives the background and both costumes; costumes already owned turn into shards', () => {
  const state = fresh();
  act(state, { type: 'tick' });
  play(state, { serves: 1000 });
  const theme = passThemeAt(T0);
  for (let level = 1; level < PASS_LEVELS; level++) act(state, { type: 'claimPass', track: 'free', level });
  act(state, { type: 'claimPass', track: 'free', level: PASS_LEVELS });
  assert.ok(state.ownedInteriorIds.includes(theme.interior), 'the background');
  for (const id of themeStyleIds(theme)) assert.ok(state.ownedCosmeticIds.includes(id), id);
  assert.match(state.message, /background/);
  assert.match(state.message, /costumes/);
  // Someone who already owns a costume gets shards for it instead of nothing.
  const owner = fresh();
  act(owner, { type: 'tick' });
  play(owner, { serves: 1000 });
  owner.ownedCosmeticIds.push(themeStyleIds(theme)[0]);
  const shards = owner.loot.skinShards;
  for (let level = 1; level <= PASS_LEVELS; level++) act(owner, { type: 'claimPass', track: 'free', level });
  assert.ok(owner.loot.skinShards >= shards + 10);
});

test('A new two-week pass starts clean: counters from that moment, no claims, no premium', () => {
  const state = fresh();
  act(state, { type: 'tick' });
  play(state, { serves: 100 });
  state.crystals = 500;
  act(state, { type: 'buyPassPremium' });
  act(state, { type: 'claimPass', track: 'free', level: 1 });
  const later = T0 + PASS_MS;
  act(state, { type: 'tick' }, later);
  assert.equal(state.pass.id, passId(later));
  assert.deepEqual(state.pass.claimed, []);
  assert.equal(state.pass.premium, false);
  assert.equal(passPoints(state), 0);
  play(state, { serves: 40 });
  assert.equal(passLevelOf(state), 1);
});

test('A damaged pass in a save is cleaned up', () => {
  const state = fresh();
  state.pass = { id: 12345, base: { serves: -5, vips: 'x', bottles: 7.9 }, premium: 'yes', claimed: ['f1', 'f1', 'x9', 7, 'p20'] };
  normalizePlayerState(state);
  assert.equal(state.pass.id, '');
  assert.deepEqual(state.pass.base, { bottles: 7 });
  assert.equal(state.pass.premium, false);
  assert.deepEqual(state.pass.claimed.sort(), ['f1', 'p20']);
});

test('The premium price is fair: the premium track pays back most of it in crystals, the rest is boxes, shards and the Circle', () => {
  const rows = passRewards(PASS_THEMES[0]);
  const crystals = rows.flatMap((row) => row.premium).filter((reward) => reward.kind === 'crystals').reduce((sum, reward) => sum + reward.amount, 0);
  const free = rows.flatMap((row) => row.free).filter((reward) => reward.kind === 'crystals').reduce((sum, reward) => sum + reward.amount, 0);
  assert.ok(crystals >= PASS_PREMIUM_PRICE * .5 && crystals <= PASS_PREMIUM_PRICE, `premium crystals ${crystals} for a price of ${PASS_PREMIUM_PRICE}`);
  assert.ok(free >= 80 && free <= 160, `free crystals ${free}`);
});
