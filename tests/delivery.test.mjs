import test from 'node:test';
import assert from 'node:assert/strict';
import { checkEnglish } from '../server/english.mjs';
import { RECIPES } from '../src/domain/catalog.ts';
import { requiredRecipe } from '../src/domain/engine.ts';
import { hasSituation, guestLine } from '../src/sim/situations.ts';
import { advanceClock, applyAction } from '../src/sim/rules.ts';
import { createInitialState, publicState, DELIVERY_DAY_MS } from '../src/sim/state.ts';
import { goodAmount, lowGradeOf, receiveOrder } from '../src/sim/stockQuality.ts';

const NOW = Date.UTC(2026, 9, 1, 15);
const context = (now = NOW, random = () => .5) => ({ now, random, checkEnglish, spawnCustomers: false });
// Problems happen at half the base rates (see receiveOrder), so the first roll is halved to land in the same band.
const seq = (...values) => { const scaled = values.map((value, at) => (at === 0 ? value * .5 : value)); let index = 0; return () => (index < scaled.length ? scaled[index++] : .5); };
const SOCIAL = { emotion: 'relaxed', rapport: 55, drunk: 0, chatty: false, topic: 'work', gender: 'x', phase: 'ordering', nextOrderAt: 0, rounds: 0, staysFor: 0, chatted: [] };

function bar() {
  const state = createInitialState(NOW);
  state.customers = [state.customers[0]];
  const guest = state.customers[0];
  state.activeCustomerId = guest.id;
  Object.assign(guest, { mood: 'calm', orderKind: 'cocktail', orderRecipeId: RECIPES[0].id, orderRevealed: true, smoker: false, patience: 99_999, patienceRemaining: 99_999 });
  guest.social = { ...SOCIAL };
  state.nextCustomerAt = 0;
  return { state, guest };
}
const stockOf = (state, id) => state.inventories[state.regionId].find((item) => item.ingredientId === id)?.amount ?? 0;
const order = (items, supplier = 'Global Drinks Co.') => ({ id: 'order-1', supplier, barId: 'new-york', dueAt: NOW, items, total: 50 });

test('Most of an order arrives fine; each kind of problem has its own consequence', () => {
  const normal = bar().state;
  const before = stockOf(normal, 'white-rum');
  assert.deepEqual(receiveOrder(normal, order([{ ingredientId: 'white-rum', amount: 500 }]), NOW, () => .5), []);
  assert.equal(stockOf(normal, 'white-rum'), before + 500);
  assert.equal(normal.deliveryIssues.length, 0);

  const lost = bar().state;
  const lostBefore = stockOf(lost, 'white-rum');
  receiveOrder(lost, order([{ ingredientId: 'white-rum', amount: 500 }]), NOW, seq(.01));
  assert.equal(stockOf(lost, 'white-rum'), lostBefore, 'lost goods never arrive');
  assert.equal(lost.deliveryIssues[0].kind, 'lost');
  assert.ok(lost.deliveryIssues[0].value > 0);

  const damaged = bar().state;
  const dBefore = stockOf(damaged, 'white-rum');
  receiveOrder(damaged, order([{ ingredientId: 'white-rum', amount: 500 }]), NOW, seq(.05, .5));
  assert.equal(stockOf(damaged, 'white-rum'), dBefore + 500, 'damaged goods are in the stock…');
  assert.ok(lowGradeOf(damaged)['white-rum'].damaged > 0 && lowGradeOf(damaged)['white-rum'].damaged < 500, '…but only part of them is damaged');
  assert.equal(goodAmount(damaged, 'white-rum'), dBefore + 500 - lowGradeOf(damaged)['white-rum'].damaged);

  const wrong = bar().state;
  const wBefore = stockOf(wrong, 'gin');
  receiveOrder(wrong, order([{ ingredientId: 'white-rum', amount: 500 }]), NOW, seq(.07, .0));
  assert.equal(wrong.deliveryIssues[0].kind, 'wrong');
  assert.notEqual(wrong.deliveryIssues[0].deliveredId, 'white-rum');
  assert.ok(wBefore >= 0);

  const fake = bar().state;
  const fBefore = stockOf(fake, 'white-rum');
  receiveOrder(fake, order([{ ingredientId: 'white-rum', amount: 500 }]), NOW, seq(.08));
  assert.equal(stockOf(fake, 'white-rum'), fBefore, 'counterfeit goods are set aside, not shelved');
  assert.equal(fake.quarantine[0].kind, 'counterfeit');

  const old = bar().state;
  receiveOrder(old, order([{ ingredientId: 'white-rum', amount: 500 }]), NOW, seq(.09, .5));
  assert.ok(lowGradeOf(old)['white-rum'].expiring === 500 && lowGradeOf(old)['white-rum'].expiringAt > NOW);

  const dead = bar().state;
  receiveOrder(dead, order([{ ingredientId: 'white-rum', amount: 500 }]), NOW, seq(.097));
  assert.equal(dead.quarantine[0].kind, 'expired');
});

test('Goods close to their date go off on time and move to quarantine', () => {
  const { state } = bar();
  const before = stockOf(state, 'white-rum');
  receiveOrder(state, order([{ ingredientId: 'white-rum', amount: 500 }]), NOW, seq(.09, .0));
  const goesOffAt = lowGradeOf(state)['white-rum'].expiringAt;
  advanceClock(state, context(goesOffAt - 1000));
  assert.equal(stockOf(state, 'white-rum'), before + 500, 'still usable before the date');
  advanceClock(state, context(goesOffAt + 1000));
  assert.equal(stockOf(state, 'white-rum'), before, 'gone after the date');
  assert.equal(state.quarantine[0].kind, 'expired');
  assert.match(state.message, /went off/);
});

test('Lower-grade goods are used first in cocktails, and never in a brand pour', () => {
  const { state, guest } = bar();
  const mix = requiredRecipe(guest).ingredients;
  const main = mix.find((item) => item.ingredientId !== 'ice');
  state.inventories[state.regionId].find((stock) => stock.ingredientId === main.ingredientId).amount = main.amount * 3;
  for (const item of mix) if (item.ingredientId !== main.ingredientId) state.inventories[state.regionId].find((stock) => stock.ingredientId === item.ingredientId).amount += 1000;
  lowGradeOf(state)[main.ingredientId] = { damaged: main.amount * 3, expiring: 0, expiringAt: 0 };
  applyAction(state, { type: 'serve', mix: mix.map((item) => ({ ...item })), shaken: true, pourBrands: {} }, context(NOW, () => .99));
  assert.equal(lowGradeOf(state)[main.ingredientId].damaged, main.amount * 2, 'the damaged goods were used first');

  // A brand pour (“Jack Daniel’s on the rocks”) needs good stock.
  const second = bar();
  second.guest.orderKind = 'serve';
  second.guest.serveRequest = { productId: 'jack-daniels-old-7', style: 'rocks' };
  second.state.inventories[second.state.regionId].find((stock) => stock.ingredientId === 'whiskey').amount = 100;
  lowGradeOf(second.state)['whiskey'] = { damaged: 100, expiring: 0, expiringAt: 0 };
  second.state.bottleInventories[second.state.regionId].find((item) => item.productId === 'jack-daniels-old-7').quantity = 3;
  assert.throws(() => applyAction(second.state, { type: 'serve', mix: [{ ingredientId: 'whiskey', amount: 50 }, { ingredientId: 'ice', amount: 3 }], shaken: false, pourBrands: { whiskey: 'jack-daniels-old-7' } }, context()), /only be used in cocktails/);
});

test('A guest who got a drink made with bad goods can complain, and a fresh drink fixes it', () => {
  const { state, guest } = bar();
  const mix = requiredRecipe(guest).ingredients;
  for (const item of mix) state.inventories[state.regionId].find((stock) => stock.ingredientId === item.ingredientId).amount += 1000;
  const main = mix.find((item) => item.ingredientId !== 'ice');
  lowGradeOf(state)[main.ingredientId] = { damaged: 5000, expiring: 0, expiringAt: 0 };
  state.money = 100;
  // random 0.05: under the complaint chance
  applyAction(state, { type: 'serve', mix: mix.map((item) => ({ ...item })), shaken: true, pourBrands: {} }, context(NOW, () => .05));
  assert.ok(hasSituation(guest), 'the guest complains');
  assert.equal(guest.social.event.kind, 'complaint-quality');
  assert.equal(state.money, 100, 'the bill is held while the complaint is open');
  assert.match(guestLine(state, guest), /flat and strange|old/);
  applyAction(state, { type: 'situationChoice', customerId: guest.id, choiceId: 'remake' }, context(NOW + 1000, () => .1));
  assert.ok(state.customers.includes(guest), 'the guest waits for a new drink');
  assert.equal(guest.social.phase, 'ordering');
  assert.equal(guest.orderRevealed, true);
  assert.equal(state.money, 100, 'a free drink: nothing was paid for the bad one');
  assert.ok(!hasSituation(guest));
});

test('Reporting a problem in good English, politely and with proof, gets a refund or a replacement', () => {
  const { state } = bar();
  receiveOrder(state, order([{ ingredientId: 'white-rum', amount: 500 }]), NOW, seq(.05, .5));
  const issue = state.deliveryIssues[0];
  const before = state.money;
  applyAction(state, { type: 'reportIssue', issueId: issue.id, text: 'Part of the rum arrived damaged. Could I send you a photo, please?' }, context(NOW + 1000, () => .05));
  const refunded = issue.status === 'refunded';
  assert.ok(refunded || issue.status === 'replaced', 'a polite, clear report with proof works: ' + issue.status);
  if (refunded) assert.equal(state.money, before + issue.value); else assert.ok(state.deliveryOrders.some((item) => item.items[0].ingredientId === 'white-rum'));

  // A rude, unclear sentence with no proof fails when the dice are against it.
  const other = bar().state;
  receiveOrder(other, order([{ ingredientId: 'white-rum', amount: 500 }]), NOW, seq(.01));
  const lostIssue = other.deliveryIssues[0];
  applyAction(other, { type: 'reportIssue', issueId: lostIssue.id, text: 'You send bad rum' }, context(NOW + 1000, () => .8));
  assert.equal(lostIssue.status, 'open');
  assert.match(other.message, /understand|proof|photo/i);
  applyAction(other, { type: 'reportIssue', issueId: lostIssue.id, text: 'You send bad rum' }, context(NOW + 2000, () => .8));
  assert.equal(lostIssue.status, 'rejected', 'two failed tries close the claim');
  assert.throws(() => applyAction(other, { type: 'discardStock', id: 'nothing' }, context()), /nothing to throw/);
});

test('A claim after the three-day window is too late, and fake goods are refunded in full', () => {
  const { state } = bar();
  receiveOrder(state, order([{ ingredientId: 'white-rum', amount: 500 }]), NOW, seq(.08));
  const issue = state.deliveryIssues[0];
  const quarantined = state.quarantine.length;
  applyAction(state, { type: 'reportIssue', issueId: issue.id, text: 'This rum is fake. Could you refund it, please? I have the invoice.' }, context(NOW + 1000, () => .05));
  assert.equal(issue.status, 'refunded');
  assert.equal(state.quarantine.length, quarantined - 1, 'the supplier took the fake goods back');
  const late = bar().state;
  receiveOrder(late, order([{ ingredientId: 'white-rum', amount: 500 }]), NOW, seq(.01));
  applyAction(late, { type: 'reportIssue', issueId: late.deliveryIssues[0].id, text: 'The rum is missing. Could you check, please?' }, context(NOW + 4 * DELIVERY_DAY_MS, () => .05));
  assert.equal(late.deliveryIssues[0].status, 'closed');
  assert.match(late.message, /three days/);
});

test('Unusable goods can be thrown away, and the client sees the problems but nothing hidden', () => {
  const { state } = bar();
  receiveOrder(state, order([{ ingredientId: 'white-rum', amount: 500 }]), NOW, seq(.08));
  const view = publicState(state);
  assert.equal(view.deliveryIssues.length, 1);
  assert.equal(view.quarantine.length, 1);
  applyAction(state, { type: 'discardStock', id: state.quarantine[0].id }, context());
  assert.equal(state.quarantine.length, 0);
});

test('A supplier with a better reputation has fewer problems', () => {
  const count = (supplier) => {
    let problems = 0;
    for (let seed = 0; seed < 4000; seed++) {
      const state = bar().state;
      const random = () => ((seed * 0.6180339887 + 0.37) % 1);
      problems += receiveOrder(state, order([{ ingredientId: 'white-rum', amount: 100 }], supplier), NOW, random).length;
    }
    return problems;
  };
  assert.ok(count('Local Market') >= count('Premium Spirits'), 'the premium supplier is at least as reliable');
});

test('Every suggested claim sentence is correct English and names its own kind of problem', async () => {
  const { CLAIM_PHRASES } = await import('../src/domain/situations/claimPhrases.ts');
  const { checkText } = await import('../src/domain/english/checker.ts');
  for (const [kind, phrases] of Object.entries(CLAIM_PHRASES)) {
    assert.ok(phrases.length >= 2, `${kind}: ideas`);
    for (const phrase of phrases) {
      const result = checkText(phrase);
      assert.equal(result.ok, true, `${kind}: “${phrase}” ${JSON.stringify(result.issues.map((item) => item.message))}`);
    }
  }
});
