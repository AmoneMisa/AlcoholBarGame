import test from 'node:test';
import assert from 'node:assert/strict';
import { CHARACTER_ART, CUSTOMER_ART_BY_SLOT } from '../src/data/cosmetics/artCatalog.ts';
import { RECIPES } from '../src/domain/catalog.ts';
import { ACHIEVEMENTS } from '../src/domain/quests.ts';
import { barEventById } from '../src/domain/barEvents.ts';
import { BONUSES, BOND_STEPS, COMPANIONS, COMPANION_LINKS, MAX_COMPANION_LEVEL, companionLevelCost, companionPower, levelCapForGrade, linkStrength, KEEPSAKE_IDS, bondLevel, bonusAmount, companionSlots } from '../src/domain/companions.ts';
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

test('The Circle: fifteen people, each with their own bonus, a portrait, a story of six chapters and a real way to meet them', () => {
  assert.equal(COMPANIONS.length, 15);
  assert.ok(COMPANIONS.every((person) => !CUSTOMER_ART_BY_SLOT.includes(person.id)), 'Circle guests have identities separate from ordinary customers');
  assert.equal(new Set(COMPANIONS.map((item) => item.bonus)).size, 15, 'every person has a bonus of their own');
  assert.deepEqual(new Set(BONUSES.map((item) => item.id)), new Set(COMPANIONS.map((item) => item.bonus)), 'every bonus belongs to someone');
  for (const person of COMPANIONS) {
    assert.ok(CHARACTER_ART.some((art) => art.id === person.id), `${person.id} has a portrait`);
    assert.equal(person.chapters.length, 6);
    assert.ok(person.chapters.every((text) => text.length > 60), `${person.id} chapters are real text`);
    assert.ok(person.intro.length > 40 && person.quote.length > 10);
    assert.ok(KEEPSAKE_IDS.includes(person.likes));
    if (person.joinsWith) assert.ok(ACHIEVEMENTS.some((item) => item.id === person.joinsWith), `${person.id} joins with a real achievement`);
    if (person.eventId) assert.ok(barEventById(person.eventId), `${person.id} likes a real night`);
  }
  assert.equal(new Set(COMPANIONS.map((item) => item.joinsWith).filter(Boolean)).size, COMPANIONS.filter((item) => item.joinsWith).length, 'one person per achievement');
  assert.equal(bondLevel(0), 1);
  assert.equal(bondLevel(BOND_STEPS[5]), 6);
  assert.equal(companionSlots(10), 2);
  assert.equal(companionSlots(25), 3);
});

test('Old Circle saves transfer bond, shards, crew, visits and spotlight to the new people', () => {
  const state = fresh();
  state.companions = {
    owned: { marin: 120, kai: 0 }, shards: { imani: 9 }, keepsakes: {},
    assigned: { [state.regionId]: ['marin', 'kai'] },
    visits: { day: '2026-09-30', counts: { marin: 2 } },
    spotlights: { marin: { until: NOW + 60_000, ready: NOW + 7 * 3_600_000 } }
  };
  normalizePlayerState(state);
  assert.equal(state.companions.owned.mirelle, 120);
  assert.equal(state.companions.owned.kellan, 0);
  assert.equal(state.companions.shards.yara, 9);
  assert.deepEqual(state.companions.assigned[state.regionId], ['mirelle', 'kellan']);
  assert.equal(state.companions.visits.counts.mirelle, 2);
  assert.ok(state.companions.spotlights.mirelle.until > NOW);
});

test('A Circle companion can arrive with their own identity', () => {
  const state = fresh();
  state.customers = [];
  state.nextCustomerAt = 1;
  state.vipCooldownUntil = NOW + 1e12;
  applyAction(state, { type: 'tick' }, { ...context(() => 0, NOW + 10_000), spawnCustomers: true });
  const guest = state.customers[0];
  assert.ok(COMPANIONS.some((person) => person.id === guest.characterId));
  assert.ok(!CUSTOMER_ART_BY_SLOT.includes(guest.characterId));
});

test('Shards recruit a person, and an achievement brings one at once', () => {
  const state = fresh();
  const kellan = COMPANIONS.find((item) => item.id === 'kellan');
  assert.throws(() => run(state, { type: 'recruitCompanion', id: 'kellan' }), /shards/);
  state.companions = { ...(state.companions ?? {}), shards: { kellan: kellan.shards }, owned: {}, keepsakes: {}, assigned: {}, visits: { day: '', counts: {} } };
  run(state, { type: 'recruitCompanion', id: 'kellan' });
  assert.ok(hasJoined(state, 'kellan'));
  assert.equal(state.companions.shards.kellan, undefined);
  assert.throws(() => run(state, { type: 'recruitCompanion', id: 'kellan' }), /already/);
  // an achievement brings its person without shards
  state.loot.achievements = ['a-serve-10', 'a-serve-100'];
  state.loot.stats.serves = 500;
  run(state, { type: 'claimAchievement', id: 'a-serve-500' });
  assert.ok(hasJoined(state, 'mirelle'), 'Mirelle joins with the Legend achievement');
  assert.match(state.message, /Mirelle/);
  assert.ok(Object.values(state.companions.keepsakes).reduce((sum, count) => sum + count, 0) >= 2, 'achievements give keepsakes');
});

test('Keepsakes deepen the bond; a loved one counts more; the story opens by bond level', () => {
  const state = fresh();
  const neri = COMPANIONS.find((item) => item.id === 'neri');
  state.companions = { owned: { neri: 0 }, shards: {}, keepsakes: { sweets: 5, book: 5 }, assigned: {}, visits: { day: '', counts: {} } };
  assert.throws(() => run(state, { type: 'giveKeepsake', id: 'kellan', kind: 'sweets' }), /not joined/);
  run(state, { type: 'giveKeepsake', id: 'neri', kind: 'book' });
  assert.equal(state.companions.owned.neri, 15);
  run(state, { type: 'giveKeepsake', id: 'neri', kind: neri.likes });
  assert.equal(state.companions.owned.neri, 55, 'a loved keepsake gives 40');
  assert.equal(bondLevel(55), 2);
  state.companions.keepsakes.book = 99;
  for (let i = 0; i < 120; i++) { try { run(state, { type: 'giveKeepsake', id: 'neri', kind: 'book' }); } catch { break; } }
  assert.equal(state.companions.owned.neri, BOND_STEPS[5], 'the bond stops at the top');
  assert.throws(() => run(state, { type: 'giveKeepsake', id: 'neri', kind: 'book' }), /fully bonded/);
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
  state.companions = { owned: { yara: 280, kellan: 0, bram: 0, nadia: 0 }, shards: {}, keepsakes: {}, assigned: {}, visits: { day: '', counts: {} } };
  const home = state.regionId;
  const before = lootBonuses(state, NOW).tipChance;
  run(state, { type: 'assignCompanion', id: 'yara' });
  assert.deepEqual(crewOf(state), ['yara']);
  assert.equal(companionBonus(state, 'tips'), bonusAmount('tips', companionPower(40, 4)), 'Ingrid is at bond 4: a saved person counts ten levels per grade');
  assert.ok(Math.abs(lootBonuses(state, NOW).tipChance - before - bonusAmount('tips', companionPower(40, 4))) < 1e-9, 'the bonus reaches the rules');
  assert.throws(() => run(state, { type: 'assignCompanion', id: 'yara' }), /already/);
  run(state, { type: 'assignCompanion', id: 'kellan' });
  assert.throws(() => run(state, { type: 'assignCompanion', id: 'bram' }), /room for 2/);
  // moving to another bar takes the person away from the first
  run(state, { type: 'switchBar', regionId: 'london' });
  assert.equal(companionBonus(state, 'tips'), 0, 'London has nobody yet');
  run(state, { type: 'assignCompanion', id: 'yara' });
  assert.deepEqual(crewOf(state, 'london'), ['yara']);
  assert.deepEqual(crewOf(state, home), ['kellan']);
  run(state, { type: 'dismissCompanion', id: 'yara' });
  assert.deepEqual(crewOf(state, 'london'), []);
  assert.throws(() => run(state, { type: 'dismissCompanion', id: 'yara' }), /not working/);
  assert.throws(() => run(state, { type: 'assignCompanion', id: 'cassian' }), /not joined/);
});

test('Serving a person as a guest leaves shards (more on their night) or bond points, three times a day, and sometimes a keepsake', () => {
  const state = fresh();
  const first = companionVisit(state, 'yara', { eventId: 'jazz-night' }, NOW, () => .9);
  assert.match(first, /2 shards/);
  assert.equal(state.companions.shards.yara, 2);
  companionVisit(state, 'yara', {}, NOW, () => .9);
  companionVisit(state, 'yara', {}, NOW, () => .9);
  assert.equal(companionVisit(state, 'yara', {}, NOW, () => .9), '', 'three visits a day');
  assert.equal(state.companions.shards.yara, 4);
  assert.notEqual(companionVisit(state, 'yara', {}, NOW + 24 * 3600_000, () => .9), '', 'a new day');
  assert.equal(companionVisit(state, 'nobody', {}, NOW, () => .9), '');
  state.companions.owned.paloma = 0;
  assert.match(companionVisit(state, 'paloma', {}, NOW, () => .1), /\+3 bond.*keepsake/);
  assert.equal(state.companions.owned.paloma, 3);
});

test('A real serve for a companion guest counts as a visit, and practice guests do not', () => {
  const state = fresh();
  state.customers = [state.customers[0]];
  const guest = state.customers[0];
  const recipe = RECIPES[0];
  Object.assign(guest, { characterId: 'kellan', name: 'Kellan', modifierId: undefined, orderKind: 'cocktail', orderRevealed: true, orderRecipeId: recipe.id, patience: 99999, patienceRemaining: 99999 });
  state.activeCustomerId = guest.id;
  for (const stock of state.inventories[state.regionId]) stock.amount = 5000;
  run(state, { type: 'serve', mix: recipe.ingredients.map((item) => ({ ...item })), shaken: true, pourBrands: {} });
  assert.equal(state.companions?.shards.kellan, 1, 'a served Kellan leaves a shard');
});

test('Saves keep only known people, one bar each, and sane numbers; the achievements follow the circle', () => {
  const state = fresh();
  state.companions = { owned: { kellan: 99999, ghost: 5 }, shards: { kellan: 5, nadia: 9999, ghost: 3 }, keepsakes: { book: -3, vinyl: 2.8, fake: 4 }, assigned: { 'new-york': ['kellan', 'ghost', 'nadia'], london: ['kellan'] }, visits: { day: 5, counts: null } };
  normalizePlayerState(state);
  assert.deepEqual(Object.keys(state.companions.owned), ['kellan']);
  assert.equal(state.companions.owned.kellan, BOND_STEPS[5]);
  assert.equal(state.companions.shards.kellan, undefined, 'a joined person has no shards');
  assert.equal(state.companions.shards.nadia, 30);
  assert.deepEqual(state.companions.keepsakes, { vinyl: 2 });
  assert.deepEqual(state.companions.assigned['new-york'], ['kellan']);
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
  assert.equal(start.name, 'Known person');
  assert.equal(start.nextAt, 40);
  assert.equal(standing(COMPANION_LADDER, BOND_STEPS[5]).nextAt, undefined, 'the top grade has no next step');
  assert.deepEqual(COMPANION_LADDER.names, ['Known person', 'Friends', 'Good friends', 'Close friends', 'Best friends', 'Forever friends']);
  assert.equal(standing(COMPANION_LADDER, 9999).along, 1);
});

test('A person has a level that the bond grade caps: 19, 29, 39 … and a better grade is stronger at once', () => {
  assert.deepEqual([1, 2, 3, 6].map(levelCapForGrade), [19, 29, 39, 69]);
  assert.ok(companionPower(20, 2) > companionPower(20, 1), 'the same level is stronger at a better grade');
  const state = fresh();
  state.money = 1e6; state.loot.parts = 1000;
  state.companions = { owned: { mirelle: BOND_STEPS[0] }, shards: {}, keepsakes: {}, assigned: {}, visits: { day: '', counts: {} }, levels: { mirelle: 19 } };
  assert.throws(() => run(state, { type: 'levelUpCompanion', id: 'mirelle' }), /cannot go past level 19/);
  state.companions.owned.mirelle = BOND_STEPS[1];
  const cost = companionLevelCost(19);
  const coinsBefore = state.money, partsBefore = state.loot.parts;
  run(state, { type: 'levelUpCompanion', id: 'mirelle' });
  assert.equal(state.companions.levels.mirelle, 20);
  assert.equal(state.money, coinsBefore - cost.coins);
  assert.equal(state.loot.parts, partsBefore - cost.parts);
  state.money = 0;
  assert.throws(() => run(state, { type: 'levelUpCompanion', id: 'mirelle' }), /coins/);
  state.companions.owned.mirelle = BOND_STEPS[5]; state.companions.levels.mirelle = MAX_COMPANION_LEVEL;
  assert.throws(() => run(state, { type: 'levelUpCompanion', id: 'mirelle' }), /highest level/);
});

test('Friends who know each other: both bonuses grow in the same bar, by the lesser grade of the two', () => {
  for (const link of COMPANION_LINKS) assert.ok(COMPANIONS.some((item) => item.id === link.a) && COMPANIONS.some((item) => item.id === link.b), 'a link joins two real people');
  assert.equal(new Set(COMPANION_LINKS.flatMap((link) => [link.a, link.b])).size, 15, 'everyone has a friend');
  assert.equal(linkStrength(3), .1 * 3);
  const state = fresh();
  state.companions = { owned: { mirelle: BOND_STEPS[4], aveline: BOND_STEPS[1] }, shards: {}, keepsakes: {}, assigned: {}, visits: { day: '', counts: {} }, levels: { mirelle: 50, aveline: 20 } };
  run(state, { type: 'assignCompanion', id: 'mirelle' });
  const alone = companionBonus(state, 'xp');
  run(state, { type: 'assignCompanion', id: 'aveline' });
  const together = companionBonus(state, 'xp');
  assert.ok(Math.abs(together - alone * (1 + linkStrength(2))) < 1e-9, 'the lesser grade (Friends, 2) sets the link: +20% on Marin');
  assert.ok(companionBonus(state, 'arrival') > 0);
});
