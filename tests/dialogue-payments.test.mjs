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

test('Sealed-bottle shoppers have one opening about the purchase, without a second drink order',()=>{
  for(const emotion of ['relaxed','happy','angry','tired']) {
    const state=createInitialState(now),guest=state.customers[0];
    Object.assign(guest,{orderKind:'bottle',greeting:'Hello!',orderRevealed:false,bottleRequest:{productId:'jack-daniels-old-7',quantity:2,budget:40,type:'whisky',tastes:[],occasion:'gift'}});
    Object.assign(guest.social,{emotion,phase:'ordering',rounds:0,need:undefined,foodRequest:undefined});
    applyAction(state,{type:'openConversation',customerId:guest.id},context);
    assert.equal(state.conversations[guest.id].lines[0].text,'Hello! I need some sealed bottles for a gift. Can you help me choose?');
    assert.deepEqual(state.conversations[guest.id].bottleFacts,{occasion:'gift'});
  }
});

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
  const accumulatedTips = state.tipJar;
  applyAction(state, { type: 'say', text: 'Would you like to pay by card or in cash?' }, { ...context, now: now + 600000 });
  assert.equal(state.money, Number((balance + bill.coins).toFixed(2)));
  assert.equal(state.tipJar, Number((bill.tips + accumulatedTips).toFixed(2))); assert.equal(guest.pendingPayment, undefined);
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
  const patience = game.customer.patienceRemaining;
  game.tickGameClock(Date.now() + 48 * 60 * 60 * 1000);
  assert.equal(game.customer.patienceRemaining, patience, 'training has no running deadline');
  assert.equal(game.customers.length, 1, 'no regular customers join training');
  game.openConversation(game.customer.id);
  await game.say('Would you like a Gin & Tonic?');
  assert.equal(game.customer.orderRevealed, true);
  game.openPreparation(game.customer.id);
  for (const ingredient of RECIPES.find(recipe => recipe.id === 'gin-tonic').ingredients) game.addIngredient(ingredient.ingredientId, ingredient.amount);
  assert.equal(game.serveMix(), true); assert.equal(game.trainingPhase, 'payment');
  await game.say('Would you like to pay by card or in cash?');
  assert.equal(game.trainingPhase, 'tips'); assert.ok(game.tipJar > 0);
  game.collectTips(); assert.equal(game.trainingPhase, 'complete');
  assert.equal(game.trainingActive, true, 'collecting tips does not end the rest of the tutorial');
  assert.equal(game.inventory.find(item => item.ingredientId === 'tonic').amount, 0);
  game.selectSupplier('global'); game.purchaseCart = { tonic:1 };
  assert.equal(game.checkoutPurchase(), true);
  assert.equal(game.trainingRestocked, true);
  assert.ok(game.inventory.find(item => item.ingredientId === 'tonic').amount > 0, 'practice refill actually adds stock');
  assert.equal(game.deliveryOrders.length, 0, 'practice delivery arrives immediately');
  assert.equal(game.trainingActive, true);
  assert.equal(saved.size, 0, 'practice is never persisted');
  game.endTraining();
  assert.deepEqual({ money: game.money, tips: game.tipJar, stock: JSON.stringify(game.inventory), guests: JSON.stringify(game.customers) }, original);
  game.beginTraining(); game.endTraining(); assert.equal(game.money, original.money, 'skipping also restores account');
});
import { trainingGuest, trainingQuestions, TRAINING_HELP, TRAINING_CONFIRM, TRAINING_PAYMENT } from '../src/domain/training.ts';
import { tilesFor } from '../src/domain/conversation/customerTalk.ts';

test('Every training replay has the same clean guest and correctly ordered words, independent of random guests and account recipes',()=>{
 for(let i=0;i<20;i++){
  setActivePinia(createPinia());const game=useGameStore();game.mode='offline';
  game.beginTraining();assert.deepEqual(JSON.parse(JSON.stringify(game.customer)),trainingGuest());assert.equal(game.customers.length,1);
  const templates=trainingQuestions(game.customer,0);assert.deepEqual(templates.map(x=>x.text),[TRAINING_HELP,TRAINING_CONFIRM]);
  for(const text of [TRAINING_HELP,TRAINING_CONFIRM,TRAINING_PAYMENT]){
   const words=tilesFor(text,RECIPES,true).map(x=>x.text);
   assert.equal(words.join(' ').replace(/\s+([?.!])/g,'$1'),text);
   assert.deepEqual(tilesFor(text,RECIPES,true),tilesFor(text,RECIPES.slice(0,10),true));
  }
  assert.deepEqual(trainingQuestions(game.customer,1),[{text:TRAINING_CONFIRM}]);
  game.customer.pendingPayment={coins:10,tips:2,crystals:0};assert.deepEqual(trainingQuestions(game.customer,2),[{text:TRAINING_PAYMENT}]);
  game.endTraining();
 }
});
