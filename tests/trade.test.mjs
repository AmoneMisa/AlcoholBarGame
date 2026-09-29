import test from 'node:test';
import assert from 'node:assert/strict';
import { checkEnglish } from '../server/english.mjs';
import { marketFor } from '../src/domain/progression.ts';
import { REGIONS } from '../src/domain/catalog.ts';
import { applyAction } from '../src/sim/rules.ts';
import { createInitialState } from '../src/sim/state.ts';
import { MAX_OFFERS, RETRY_BONUS, TACTICS, negotiatedQuote, offerChance } from '../src/sim/trade.ts';

const NOW = Date.UTC(2026, 8, 29, 12);
const context = (random = () => .1) => ({ now: NOW, random, checkEnglish, spawnCustomers: false });
function openDeal(packs = 6, random) {
  const state = createInitialState(NOW);
  state.money = 5000;
  const offers = marketFor(REGIONS.find((item) => item.id === state.regionId), NOW, state.xp).filter((offer) => offer.supplierId === 'global');
  const cart = { [offers[0].ingredientId]: packs - 1, [offers[1].ingredientId]: 1 };
  applyAction(state, { type: 'startNegotiation', supplierId: 'global', cart }, context(random));
  return state;
}
const say = (state, text, random) => applyAction(state, { type: 'haggle', text }, context(random));
const offer = (state, price, random) => applyAction(state, { type: 'makeOffer', price }, context(random));
const quoteOf = (state) => negotiatedQuote(state, state.negotiation, NOW);

test('Polite, correct bargaining raises the success chance; repeats and small orders do not', () => {
  const state = openDeal(3);
  say(state, 'Could you give me a discount, please?');
  assert.equal(state.negotiation.englishBonus, .04);
  say(state, 'Could you give me a better price, please?');
  assert.equal(state.negotiation.englishBonus, .04, 'the same tactic counts once');
  say(state, 'We are buying a large order, please lower the price.');
  assert.ok(!state.negotiation.tactics.includes('bulk'), 'three packs is not a big order');
  say(state, 'Another supplier offers a cheaper price.');
  assert.equal(state.negotiation.englishBonus, .065, 'impolite tactics count half');
  say(state, 'Could you include free delivery, please?');
  assert.equal(state.negotiation.freeDelivery, true);
});

test('Offers: lower prices are riskier, refusals add a retry bonus, three tries at most', () => {
  const state = openDeal(6);
  const { goods, minOffer } = quoteOf(state);
  assert.equal(offerChance(state.negotiation, goods, goods).rate, 1, 'the full price is always accepted');
  assert.ok(offerChance(state.negotiation, goods, minOffer).rate < offerChance(state.negotiation, goods, goods * .9).rate);
  assert.throws(() => offer(state, minOffer - 1), /Offer between/);
  for (let index = 0; index < MAX_OFFERS; index++) {
    const before = offerChance(state.negotiation, goods, minOffer).rate;
    offer(state, minOffer, () => .999);
    assert.equal(state.negotiation.retryBonus, Number(((index + 1) * RETRY_BONUS).toFixed(3)));
    if (index < MAX_OFFERS - 1) assert.ok(offerChance(state.negotiation, goods, minOffer).rate > before, 'each refusal raises the next chance');
  }
  assert.equal(state.negotiation.mood, 'done');
  assert.throws(() => offer(state, goods), /No offers left/);
  assert.equal(quoteOf(state).discount, 0, 'no deal: the list price stays');
});

test('An accepted offer sets the price the player pays', () => {
  const state = openDeal(6);
  const { goods } = quoteOf(state);
  const price = Math.round(goods * .8 * 100) / 100;
  offer(state, price, () => 0);
  assert.equal(state.negotiation.agreedGoods, price);
  assert.throws(() => say(state, 'Could you give me a discount, please?'), /agreed/);
  const quote = quoteOf(state);
  const money = state.money;
  const result = applyAction(state, { type: 'acceptDeal' }, context());
  assert.ok(Math.abs((money - state.money) - quote.total) < .01);
  assert.ok(Math.abs((result.moneyDelta ?? 0) + quote.total) < .01, 'the ledger delta is the deal total');
  assert.ok(quote.total < goods + quote.base.delivery + .01);
  assert.equal(state.deliveryOrders.at(-1).barId, quote.barId);
  assert.throws(() => applyAction(state, { type: 'startNegotiation', supplierId: 'global', cart: { gin: 1 } }, context()), /again in/);
});

test('Hard mistakes make the seller misunderstand: price, bar or product', () => {
  const kinds = new Set();
  for (const roll of [.05, .4, .8]) {
    const state = openDeal(6, () => roll);
    const before = quoteOf(state);
    say(state, 'me want you price more low', () => roll);
    assert.equal(state.negotiation.misunderstandings.length, 0, 'one mistake is forgiven');
    say(state, 'you give discount me now yes', () => roll);
    const slip = state.negotiation.misunderstandings[0];
    assert.ok(slip, 'the second hard mistake is misunderstood');
    kinds.add(slip.kind);
    const after = quoteOf(state);
    if (slip.kind === 'price') assert.ok(after.total > before.total);
    if (slip.kind === 'bar') assert.notEqual(after.barId, state.regionId);
    if (slip.kind === 'product') assert.ok(slip.to in state.negotiation.cart && !(slip.from in state.negotiation.cart));
    assert.equal(state.negotiation.englishBonus, 0, 'mistakes never earn a bonus');
  }
  assert.deepEqual([...kinds].sort(), ['bar', 'price', 'product']);
});

test('Clients cannot set negotiation terms or buy what the supplier does not sell', () => {
  const state = createInitialState(NOW);
  assert.throws(() => applyAction(state, { type: 'startNegotiation', supplierId: 'global', cart: {} }, context()), /Add packs/);
  assert.throws(() => applyAction(state, { type: 'startNegotiation', supplierId: 'nobody', cart: { gin: 1 } }, context()), /Unknown supplier/);
  const deal = openDeal(2);
  applyAction(deal, { type: 'haggle', text: 'Could you give me a discount, please?', englishBonus: .9, agreedGoods: 1 }, context());
  assert.equal(deal.negotiation.englishBonus, .04);
  assert.equal(deal.negotiation.agreedGoods, undefined);
  assert.throws(() => offer(deal, '1'), /Offer between/);
});

test('Every suggested bargaining phrase is correct English, including statement + question', () => {
  for (const text of [...TACTICS.map((tactic) => tactic.example), 'We have a big order, can you give us a discount?', "You like it, don't you?"]) {
    assert.equal(checkEnglish(text).ok, true, text);
  }
  assert.equal(checkEnglish('You like rum?').ok, false, 'a statement used as a question is still corrected');
});
