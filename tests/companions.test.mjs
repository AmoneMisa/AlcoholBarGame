import test from 'node:test';
import assert from 'node:assert/strict';
import { CHARACTER_ART } from '../src/data/cosmetics/artCatalog.ts';
import { RECIPES } from '../src/domain/catalog.ts';
import { ACHIEVEMENTS } from '../src/domain/quests.ts';
import { barEventById } from '../src/domain/barEvents.ts';
import { BONUSES, BOND_STEPS, COMPANIONS, KEEPSAKE_IDS, bondLevel, bonusAmount, companionSlots } from '../src/domain/companions.ts';
import { COMPANION_LADDER, standing } from '../src/domain/relationship.ts';
import { xpForLevel } from '../src/domain/progression.ts';
import { companionBonus, companionVisit, crewOf, hasJoined } from '../src/sim/companions.ts';
import { lootBonuses } from '../src/sim/loot.ts';
import { applyAction } from '../src/sim/rules.ts';
import { createInitialState, normalizePlayerState } from '../src/sim/state.ts';

const NOW = new Date(2026, 8, 30, 12).getTime();
const context = (random = () => .5, now = NOW) => ({ now, random, checkEnglish: (text) => ({ ok: true, corrected: text }), spawnCustomers: false });
const run = (state, action, random, now) => applyAction(state, action, context(random, now));
const fresh = () => { const state = createInitialState(NOW); state.startingBarChosen = true; state.loot.boxes = {}; state.xp = xpForLevel(30); state.crystals = 500; return state; };

test('The Circle: fifteen people, each with their own bonus, a portrait, a story of five chapters and a real way to meet them', () => {
  assert.equal(COMPANIONS.length, 15);
  assert.equal(new Set(COMPANIONS.map((item) => item.bonus)).size, 15, 'every person has a bonus of their own');
  assert.deepEqual(new Set(BONUSES.map((item) => item.id)), new Set(COMPANIONS.map((item) => item.bonus)), 'every bonus belongs to someone');
  for (const person of COMPANIONS) {
    assert.ok(CHARACTER_ART.some((art) => art.id === person.id), `${person.id} has a portrait`);
    assert.equal(person.chapters.length, 5);
    assert.ok(person.chapters.every((text) => text.length > 60), `${person.id} chapters are real text`);
    assert.ok(person.intro.length > 40 && person.quote.length > 10);
    assert.ok(KEEPSAKE_IDS.includes(person.likes));
    if (person.joinsWith) assert.ok(ACHIEVEMENTS.some((item) => item.id === person.joinsWith), `${person.id} joins with a real achievement`);
    if (person.eventId) assert.ok(barEventById(person.eventId), `${person.id} likes a real night`);
  }
  assert.equal(new Set(COMPANIONS.map((item) => item.joinsWith).filter(Boolean)).size, COMPANIONS.filter((item) => item.joinsWith).length, 'one person per achievement');
  assert.equal(bondLevel(0), 1);
  assert.equal(bondLevel(BOND_STEPS[4]), 5);
  assert.equal(companionSlots(10), 2);
  assert.equal(companionSlots(25), 3);
});

test('Shards recruit a person, and an achievement brings one at once', () => {
  const state = fresh();
  const kai = COMPANIONS.find((item) => item.id === 'kai');
  assert.throws(() => run(state, { type: 'recruitCompanion', id: 'kai' }), /shards/);
  state.companions = { ...(state.companions ?? {}), shards: { kai: kai.shards }, owned: {}, keepsakes: {}, assigned: {}, visits: { day: '', counts: {} } };
  run(state, { type: 'recruitCompanion', id: 'kai' });
  assert.ok(hasJoined(state, 'kai'));
  assert.equal(state.companions.shards.kai, undefined);
  assert.throws(() => run(state, { type: 'recruitCompanion', id: 'kai' }), /already/);
  // an achievement brings its person without shards
  state.loot.achievements = ['a-serve-10', 'a-serve-100'];
  state.loot.stats.serves = 500;
  run(state, { type: 'claimAchievement', id: 'a-serve-500' });
  assert.ok(hasJoined(state, 'marin'), 'Marin joins with the Legend achievement');
  assert.match(state.message, /Marin/);
  assert.ok(Object.values(state.companions.keepsakes).reduce((sum, count) => sum + count, 0) >= 2, 'achievements give keepsakes');
});

test('Keepsakes deepen the bond; a loved one counts more; the story opens by bond level', () => {
  const state = fresh();
  const eli = COMPANIONS.find((item) => item.id === 'eli');
  state.companions = { owned: { eli: 0 }, shards: {}, keepsakes: { sweets: 5, book: 5 }, assigned: {}, visits: { day: '', counts: {} } };
  assert.throws(() => run(state, { type: 'giveKeepsake', id: 'kai', kind: 'sweets' }), /not joined/);
  run(state, { type: 'giveKeepsake', id: 'eli', kind: 'book' });
  assert.equal(state.companions.owned.eli, 15);
  run(state, { type: 'giveKeepsake', id: 'eli', kind: eli.likes });
  assert.equal(state.companions.owned.eli, 55, 'a loved keepsake gives 40');
  assert.equal(bondLevel(55), 2);
  state.companions.keepsakes.book = 99;
  for (let i = 0; i < 60; i++) { try { run(state, { type: 'giveKeepsake', id: 'eli', kind: 'book' }); } catch { break; } }
  assert.equal(state.companions.owned.eli, BOND_STEPS[4], 'the bond stops at the top');
  assert.throws(() => run(state, { type: 'giveKeepsake', id: 'eli', kind: 'book' }), /fully bonded/);
  // buying uses crystals
  const crystals = state.crystals;
  run(state, { type: 'buyKeepsake', kind: 'flowers', quantity: 2 });
  assert.equal(state.crystals, crystals - 50);
  assert.equal(state.companions.keepsakes.flowers, 2);
  state.crystals = 0;
  assert.throws(() => run(state, { type: 'buyKeepsake', kind: 'flowers' }), /crystals/);
});

test('A person works in one bar at a time, the bar has limited room, and the bonus is theirs and only there', () => {
  const state = fresh();
  state.ownedBarIds = ['new-york', 'london'];
  state.xp = xpForLevel(10);
  state.companions = { owned: { imani: 280, kai: 0, theo: 0, ana: 0 }, shards: {}, keepsakes: {}, assigned: {}, visits: { day: '', counts: {} } };
  const home = state.regionId;
  const before = lootBonuses(state, NOW).tipChance;
  run(state, { type: 'assignCompanion', id: 'imani' });
  assert.deepEqual(crewOf(state), ['imani']);
  assert.equal(companionBonus(state, 'tips'), bonusAmount('tips', 4), 'Imani is at bond 4');
  assert.ok(Math.abs(lootBonuses(state, NOW).tipChance - before - bonusAmount('tips', 4)) < 1e-9, 'the bonus reaches the rules');
  assert.throws(() => run(state, { type: 'assignCompanion', id: 'imani' }), /already/);
  run(state, { type: 'assignCompanion', id: 'kai' });
  assert.throws(() => run(state, { type: 'assignCompanion', id: 'theo' }), /room for 2/);
  // moving to another bar takes the person away from the first
  run(state, { type: 'switchBar', regionId: 'london' });
  assert.equal(companionBonus(state, 'tips'), 0, 'London has nobody yet');
  run(state, { type: 'assignCompanion', id: 'imani' });
  assert.deepEqual(crewOf(state, 'london'), ['imani']);
  assert.deepEqual(crewOf(state, home), ['kai']);
  run(state, { type: 'dismissCompanion', id: 'imani' });
  assert.deepEqual(crewOf(state, 'london'), []);
  assert.throws(() => run(state, { type: 'dismissCompanion', id: 'imani' }), /not working/);
  assert.throws(() => run(state, { type: 'assignCompanion', id: 'marco' }), /not joined/);
});

test('Serving a person as a guest leaves shards (more on their night) or bond points, three times a day, and sometimes a keepsake', () => {
  const state = fresh();
  const first = companionVisit(state, 'imani', { eventId: 'jazz-night' }, NOW, () => .9);
  assert.match(first, /2 shards/);
  assert.equal(state.companions.shards.imani, 2);
  companionVisit(state, 'imani', {}, NOW, () => .9);
  companionVisit(state, 'imani', {}, NOW, () => .9);
  assert.equal(companionVisit(state, 'imani', {}, NOW, () => .9), '', 'three visits a day');
  assert.equal(state.companions.shards.imani, 4);
  assert.notEqual(companionVisit(state, 'imani', {}, NOW + 24 * 3600_000, () => .9), '', 'a new day');
  assert.equal(companionVisit(state, 'nobody', {}, NOW, () => .9), '');
  state.companions.owned.rosa = 0;
  assert.match(companionVisit(state, 'rosa', {}, NOW, () => .1), /\+3 bond.*keepsake/);
  assert.equal(state.companions.owned.rosa, 3);
});

test('A real serve for a companion guest counts as a visit, and practice guests do not', () => {
  const state = fresh();
  state.customers = [state.customers[0]];
  const guest = state.customers[0];
  const recipe = RECIPES[0];
  Object.assign(guest, { characterId: 'kai', name: 'Kai', modifierId: undefined, orderKind: 'cocktail', orderRevealed: true, orderRecipeId: recipe.id, patience: 99999, patienceRemaining: 99999 });
  state.activeCustomerId = guest.id;
  for (const stock of state.inventories[state.regionId]) stock.amount = 5000;
  run(state, { type: 'serve', mix: recipe.ingredients.map((item) => ({ ...item })), shaken: true, pourBrands: {} });
  assert.equal(state.companions?.shards.kai, 1, 'a served Kai leaves a shard');
});

test('Saves keep only known people, one bar each, and sane numbers; the achievements follow the circle', () => {
  const state = fresh();
  state.companions = { owned: { kai: 99999, ghost: 5 }, shards: { kai: 5, ana: 9999, ghost: 3 }, keepsakes: { book: -3, vinyl: 2.8, fake: 4 }, assigned: { 'new-york': ['kai', 'ghost', 'ana'], london: ['kai'] }, visits: { day: 5, counts: null } };
  normalizePlayerState(state);
  assert.deepEqual(Object.keys(state.companions.owned), ['kai']);
  assert.equal(state.companions.owned.kai, BOND_STEPS[4]);
  assert.equal(state.companions.shards.kai, undefined, 'a joined person has no shards');
  assert.equal(state.companions.shards.ana, 30);
  assert.deepEqual(state.companions.keepsakes, { vinyl: 2 });
  assert.deepEqual(state.companions.assigned['new-york'], ['kai']);
  assert.deepEqual(state.companions.assigned.london, [], 'nobody is in two bars');
  assert.deepEqual(state.companions.visits, { day: '', counts: {} });
});

test('Spotlight doubles a working companion for half an hour, then they rest', () => {
  const state = fresh();
  const person = COMPANIONS[0];
  state.companions = { owned: { [person.id]: BOND_STEPS[2] }, shards: {}, keepsakes: {}, assigned: {}, visits: { day: "", counts: {} } };
  assert.throws(() => run(state, { type: 'spotlightCompanion', id: person.id }), /work in this bar/);
  run(state, { type: 'assignCompanion', id: person.id });
  const normal = companionBonus(state, person.bonus);
  run(state, { type: 'spotlightCompanion', id: person.id });
  state.lastClockAt = NOW + 60_000;
  assert.equal(companionBonus(state, person.bonus), normal * 2);
  assert.throws(() => run(state, { type: 'spotlightCompanion', id: person.id }, undefined, NOW + 60_000), /already in the spotlight/);
  state.lastClockAt = NOW + 31 * 60_000;
  assert.equal(companionBonus(state, person.bonus), normal);
  assert.throws(() => run(state, { type: 'spotlightCompanion', id: person.id }, undefined, NOW + 31 * 60_000), /resting/);
  run(state, { type: 'spotlightCompanion', id: person.id }, undefined, NOW + 7 * 3_600_000);
  const saved = normalizePlayerState(JSON.parse(JSON.stringify(state)));
  assert.ok(saved.companions.spotlights[person.id].until > NOW, 'the spotlight survives a save');
});

test('The relationship line follows the bond: one grade per bond level, with what is left to the next', () => {
  assert.equal(COMPANION_LADDER.names.length, BOND_STEPS.length);
  for (let level = 1; level <= BOND_STEPS.length; level++) {
    const here = standing(COMPANION_LADDER, BOND_STEPS[level - 1]);
    assert.equal(here.index + 1, level, 'the grade matches bondLevel');
  }
  const start = standing(COMPANION_LADDER, 39);
  assert.equal(start.name, 'Acquaintance');
  assert.equal(start.nextAt, 40);
  assert.equal(standing(COMPANION_LADDER, 560).nextAt, undefined, 'the top grade has no next step');
  assert.equal(standing(COMPANION_LADDER, 9999).along, 1);
});
