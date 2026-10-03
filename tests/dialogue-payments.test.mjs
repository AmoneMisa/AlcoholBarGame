import test from 'node:test';
import assert from 'node:assert/strict';
import { createPinia, setActivePinia } from 'pinia';
import { createInitialState, normalizePlayerState } from '../src/sim/state.ts';
import { applyAction, advanceClock } from '../src/sim/rules.ts';
import { RECIPES } from '../src/domain/catalog.ts';
import { useGameStore } from '../src/stores/game.ts';

const now = Date.UTC(2026, 9, 3, 12);
const context = { now, random: () => .5, checkEnglish: text => ({ ok: true, corrected: text }), spawnCustomers: false, training: true };
function order() {
  const state = createInitialState(now);
  const guest = state.customers[0];
  Object.assign(guest, { orderKind: 'cocktail', orderRecipeId: 'gin-tonic', modifierId: undefined, orderRevealed: true, specialRecipeRewardId: undefined });
  guest.social.staysFor = 0;
  state.customers = [guest]; state.activeCustomerId = guest.id;
  for (const stock of state.inventories[state.regionId]) stock.amount = 1000;
  const mix = RECIPES.find(recipe => recipe.id === 'gin-tonic').ingredients.map(item => ({ ...item }));
  return { state, guest, mix };
}

test('A served cocktail awaits dialogue payment; money and tips are credited once, then the jar is collected', () => {
  const { state, guest, mix } = order();
  const balance = state.money;
  applyAction(state, { type: 'serve', mix, shaken: false }, context);
  assert.equal(state.money, balance); assert.equal(state.tipJar, 0);
  assert.ok(guest.pendingPayment.coins > 0); assert.ok(guest.pendingPayment.tips > 0);
  assert.equal(state.conversationCustomerId, guest.id);
  const bill = { ...guest.pendingPayment };
  assert.throws(() => applyAction(state, { type: 'serve', mix }, context), /payment/);
  for (const action of [
    { type:'askToLeave', customerId:guest.id, tone:'gentle' },
    { type:'offerSimilar', customerId:guest.id },
    { type:'pitchStart', customerId:guest.id, kind:'drink', itemId:'gin-tonic' },
    { type:'rejectCustomer', customerId:guest.id }
  ]) assert.throws(() => applyAction(state, action, context), /payment/);
  applyAction(state, { type: 'say', text: 'How are you?' }, context);
  assert.equal(state.money, balance);
  advanceClock(state, { now: now + 600000, spawnCustomers: false });
  assert.ok(state.customers.some(item => item.id === guest.id), 'unpaid guests do not disappear');
  applyAction(state, { type: 'say', text: 'Would you like to pay by card or in cash?' }, { ...context, now: now + 600000 });
  assert.equal(state.money, Number((balance + bill.coins).toFixed(2)));
  assert.equal(state.tipJar, bill.tips); assert.equal(guest.pendingPayment, undefined);
  assert.throws(() => applyAction(state, { type: 'say', text: 'Here is your receipt.' }, context), /conversation/);
  applyAction(state, { type: 'collectTips' }, context);
  assert.equal(state.tipJar, 0);
});

test('A pending bill survives save normalization and is visible to its owner', () => {
  const { state, guest, mix } = order();
  applyAction(state, { type: 'serve', mix }, context);
  const loaded = normalizePlayerState(JSON.parse(JSON.stringify(state)));
  assert.deepEqual(loaded.customers[0].pendingPayment, guest.pendingPayment);
});

test('Training always uses Gin & Tonic and guarantees a tip, without saving practice rewards or inventory', async () => {
  const saved = new Map();
  globalThis.localStorage = { getItem: key => saved.get(key) ?? null, setItem: (key, value) => saved.set(key, value) };
  setActivePinia(createPinia());
  const game = useGameStore(); game.mode = 'offline';
  const original = { money: game.money, tips: game.tipJar, stock: JSON.stringify(game.inventory), guests: JSON.stringify(game.customers) };
  game.beginTraining();
  assert.equal(game.customer.orderRecipeId, 'gin-tonic'); assert.equal(game.customer.name, 'Mia');
  game.openConversation(game.customer.id);
  await game.say('Would you like a Gin & Tonic?');
  assert.equal(game.customer.orderRevealed, true);
  game.openPreparation(game.customer.id);
  for (const ingredient of RECIPES.find(recipe => recipe.id === 'gin-tonic').ingredients) game.addIngredient(ingredient.ingredientId, ingredient.amount);
  assert.equal(game.serveMix(), true); assert.equal(game.trainingPhase, 'payment');
  await game.say('Would you like to pay by card or in cash?');
  assert.equal(game.trainingPhase, 'tips'); assert.ok(game.tipJar > 0);
  game.collectTips(); assert.equal(game.trainingPhase, 'complete');
  assert.equal(saved.size, 0, 'practice is never persisted');
  game.endTraining();
  assert.deepEqual({ money: game.money, tips: game.tipJar, stock: JSON.stringify(game.inventory), guests: JSON.stringify(game.customers) }, original);
  game.beginTraining(); game.endTraining(); assert.equal(game.money, original.money, 'skipping also restores account');
});
