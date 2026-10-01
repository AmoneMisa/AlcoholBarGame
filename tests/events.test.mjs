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
