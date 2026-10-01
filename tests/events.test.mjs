import test from 'node:test';
import assert from 'node:assert/strict';
import { checkEnglish } from '../server/english.mjs';
import { RECIPES } from '../src/domain/catalog.ts';
import { FOODS } from '../src/domain/foods.ts';
import { BAR_EVENTS } from '../src/domain/barEvents.ts';
import { pitchActsIn } from '../src/domain/social/pitchActs.ts';
import { applyAction, advanceClock } from '../src/sim/rules.ts';
import { pitchChance } from '../src/sim/pitch.ts';
import { applyPromo, barEventFor, tickBarEvent } from '../src/sim/events.ts';
import { createInitialState } from '../src/sim/state.ts';

const NOW = Date.UTC(2026, 9, 1, 20);
const context = (now = NOW, random = () => .5) => ({ now, random, checkEnglish, spawnCustomers: false });
const guestIn = (social = {}) => {
  const state = createInitialState(NOW);
  state.customers = [state.customers[0]];
  const guest = state.customers[0];
  state.activeCustomerId = guest.id;
  guest.social = { emotion: 'happy', rapport: 50, drunk: 10, chatty: false, topic: 'work', gender: 'f', phase: 'enjoying', nextOrderAt: NOW + 6e5, rounds: 1, staysFor: 2, chatted: [], hungry: true, lastDrink: { recipeId: RECIPES[0].id }, ...social };
  return { state, guest };
};

test('Foods have prices and every bar event is well formed', () => {
  assert.ok(FOODS.length >= 15);
  for (const event of BAR_EVENTS) assert.ok(event.title && event.minutes[0] <= event.minutes[1] && event.weight > 0, event.id);
});

test('Events start, last and end on the clock', () => {
  const { state } = guestIn();
  assert.equal(tickBarEvent(state, NOW, () => .5), undefined);
  const later = state.nextBarEventAt + 1;
  const note = tickBarEvent(state, later, () => .5);
  assert.match(note, /Tonight/);
  assert.ok(barEventFor(state, later));
  assert.ok(!barEventFor(state, state.barEvent.endsAt + 1));
});

test('Every third cocktail is free for women on ladies’ night, only for women', () => {
  const { state, guest } = guestIn();
  state.barEvent = { id: 'ladies-night', startedAt: NOW, endsAt: NOW + 6e6 };
  const results = [1, 2, 3].map(() => applyPromo(state, guest, RECIPES[0], NOW).free);
  assert.deepEqual(results, [false, false, true]);
  guest.social.gender = 'm'; guest.social.promo = undefined;
  assert.ok([1, 2, 3].every(() => !applyPromo(state, guest, RECIPES[0], NOW).free));
});

test('Every seventh drink is a gift', () => {
  const { state, guest } = guestIn();
  state.barEvent = { id: 'seventh-gift', startedAt: NOW, endsAt: NOW + 6e6 };
  const free = Array.from({ length: 7 }, () => applyPromo(state, guest, RECIPES[0], NOW).free);
  assert.deepEqual(free, [false, false, false, false, false, false, true]);
});

test('Offering food: chance is explained, talk changes it, a yes pays', () => {
  const { state, guest } = guestIn({ hungry: false, emotion: 'tired' });
  state.inventories[state.regionId].find((item) => item.ingredientId === 'fries').amount = 5;
  applyAction(state, { type: 'pitchStart', customerId: guest.id, kind: 'food', itemId: 'fries' }, context());
  const before = pitchChance(state, guest, NOW);
  assert.ok(before.parts.length >= 3);
  assert.deepEqual(pitchActsIn('It is on the house'), ['free']);
  guest.social.pitch.bonus += .1;
  assert.ok(pitchChance(state, guest, NOW).chance > before.chance);
  const money = state.money;
  applyAction(state, { type: 'pitchAsk', customerId: guest.id }, context(NOW, () => 0));
  assert.ok(state.money > money);
  assert.equal(guest.social.hungry, false);
});

test('Offering something not in stock is refused', () => {
  const { state, guest } = guestIn();
  state.inventories[state.regionId].find((item) => item.ingredientId === 'fries').amount = 0;
  assert.throws(() => applyAction(state, { type: 'pitchStart', customerId: guest.id, kind: 'food', itemId: 'fries' }, context()), /no fries|stock/i);
});

test('Clock keeps running with an event on', () => {
  const { state } = guestIn();
  state.barEvent = { id: 'happy-hour', startedAt: NOW, endsAt: NOW + 6e6 };
  advanceClock(state, context(NOW + 1000));
});

test('The speech checker marks the words that were not heard', async () => {
  const { compareSpoken } = await import('../src/domain/english/speechCheck.ts');
  assert.equal(compareSpoken('Would you like another drink?', 'would you like another drink').score, 100);
  const partial = compareSpoken('Would you like another drink?', 'would like drink');
  assert.ok(partial.score < 80 && partial.words.filter((item) => !item.ok).map((item) => item.word).includes('you'));
  assert.equal(compareSpoken('Hello', '').score, 0);
});

test('Guests come from somewhere: spelling, local words, speed and age differ but stay the same for one person', async () => {
  const { ORIGINS, originOf, spellFor, voiceProfileOf, ageGroupOf } = await import('../src/domain/social/origin.ts');
  const ids = Array.from({ length: 60 }, (_, index) => ({ id: `g${index}`, characterId: `c${index}` }));
  assert.ok(new Set(ids.map((item) => originOf(item).id)).size >= 5, 'several origins appear');
  assert.ok(new Set(ids.map((item) => ageGroupOf(item))).size === 3, 'young, adult and old all appear');
  assert.equal(originOf(ids[3]).id, originOf({ ...ids[3] }).id);
  assert.equal(spellFor(ORIGINS.find((item) => item.id === 'us'), 'My favourite colour'), 'My favorite color');
  assert.equal(spellFor(ORIGINS.find((item) => item.id === 'uk'), 'My favorite color'), 'My favourite colour');
  const speeds = new Set(ids.map((item) => voiceProfileOf({ ...item, social: undefined }).speed.toFixed(2)));
  assert.ok(speeds.size > 10, 'speeds differ');
});

test('A situation comes at least every 12 guests and never before the 4th guest', async () => {
  const { pickSituation, noteSituationStarted } = await import('../src/sim/situations.ts');
  const { state, guest } = guestIn({ phase: 'ordering' });
  let seen = [];
  let since = 0;
  for (let index = 1; index <= 300; index++) {
    since++;
    const def = pickSituation(state, guest, 'arrival', () => .5);
    if (def) { seen.push(since); since = 0; noteSituationStarted(state, () => .5); }
  }
  assert.ok(seen.length > 10, 'situations happen');
  assert.ok(Math.min(...seen) >= 4, 'never within 3 guests of the last');
  assert.ok(Math.max(...seen) <= 12, 'always within 12 guests');
});

test('Servers: opened by level, trained one by one, paid only for time away and capped at 85% of the player', async () => {
  const staff = await import('../src/domain/staff.ts');
  const { accrueStaff } = await import('../src/sim/staff.ts');
  const { state } = guestIn();
  state.money = 10000000;
  state.xp = 1e9;
  for (let index = 0; index < 4; index++) applyAction(state, { type: 'hireStaff' }, context());
  assert.equal(state.staff.length, 4);
  assert.throws(() => applyAction(state, { type: 'hireStaff' }, context()), /whole team/);
  assert.ok(staff.teamShare(state.staff) < .85, 'untrained servers are weaker');
  for (let round = 0; round < 4; round++) for (let index = 0; index < 4; index++) applyAction(state, { type: 'upgradeStaff', index }, context());
  assert.equal(staff.teamShare(state.staff), .85);
  assert.throws(() => applyAction(state, { type: 'upgradeStaff', index: 0 }, context()), /fully trained/);

  const market = { averagePrice: 10, arrival: 1 };
  state.staffAt = NOW;
  assert.equal(accrueStaff(state, NOW + 60_000, () => .5, market), undefined, 'a short pause is not an absence');
  const crystals = state.crystals, money = state.money;
  state.staffAt = NOW;
  assert.match(accrueStaff(state, NOW + 4 * 3600_000, () => .5, market), /your team served/);
  assert.ok(state.money > money);
  assert.equal(state.crystals, crystals, 'servers never bring crystals');
  const day = { ...state, staffAt: NOW };
  const capped = state.money;
  accrueStaff(day, NOW + 72 * 3600_000, () => .5, market);
  assert.ok(day.money - capped <= (8 * 3600_000 / (62.5 * 60_000)) * 10 * .85 * 1.15 + 1, 'a long absence pays at most eight hours');
});

test('A low-level bar cannot hire the next server', () => {
  const { state } = guestIn();
  state.money = 100000;
  state.xp = 0;
  assert.throws(() => applyAction(state, { type: 'hireStaff' }, context()), /higher bar level/);
});

test('Asking about allergies is understood: a guest with one says so, and then the food is refused', async () => {
  const { actsIn } = await import('../src/domain/social/acts.ts');
  const { socialReply } = await import('../src/domain/social/talk.ts');
  assert.equal(actsIn('Do you have any allergies?')[0], 'askAllergy');
  const { state, guest } = guestIn({ allergy: 'nuts', hungry: true });
  state.inventories[state.regionId].find((item) => item.ingredientId === 'nuts').amount = 5;
  const reply = socialReply(guest, ['askAllergy'], 1);
  assert.match(reply.text, /allergic to nuts/);
  assert.equal(guest.social.allergyKnown, true);
  assert.throws(() => applyAction(state, { type: 'pitchStart', customerId: guest.id, kind: 'food', itemId: 'nuts' }, context()), /allergic/);
  const { state: other, guest: calm } = guestIn({ hungry: false });
  assert.match(socialReply(calm, ['offerFood'], 1).text, /not hungry/);
  assert.ok(other);
});

test('A guest who said no to a drink or a bottle is not offered it again, and her answer teaches the bartender', async () => {
  const { ALCOHOL_PRODUCTS } = await import('../src/domain/bottleCatalog.ts');
  const { bottleQuestionTemplates, rankBottles } = await import('../src/domain/conversation/bottleTalk.ts');
  const wanted = ALCOHOL_PRODUCTS.find((item) => item.type === 'cognac');
  const vodka = ALCOHOL_PRODUCTS.find((item) => item.type === 'vodka');
  const { state, guest } = guestIn();
  Object.assign(guest, { orderKind: 'bottle', orderRevealed: false, greeting: 'Hello!', bottleRequest: { productId: wanted.id, quantity: 1, budget: 500, type: 'cognac', tastes: wanted.tastes.slice(0, 1), occasion: 'party' } });
  guest.social.phase = 'ordering';
  applyAction(state, { type: 'openConversation', customerId: guest.id }, context());
  applyAction(state, { type: 'say', text: `Would you like ${vodka.name}?` }, context());
  const talk = state.conversations[guest.id];
  assert.match(talk.lines.at(-1).text, /cognac/i, 'she says what she wants instead');
  assert.equal(talk.bottleFacts.type, 'cognac', 'the type is now known');
  assert.ok(talk.rejected.includes(vodka.id));
  const suggestions = bottleQuestionTemplates(talk.bottleFacts, rankBottles(talk.bottleFacts).filter((item) => !talk.rejected.includes(item.product.id)));
  assert.ok(!suggestions.some((item) => item.text.includes(vodka.name)));
  assert.ok(!suggestions.some((item) => /Which type of alcohol/.test(item.text)), 'the type question is not asked again');
});
