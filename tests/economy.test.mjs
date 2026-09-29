import test from 'node:test';
import assert from 'node:assert/strict';
import { REGIONS, SUPPLIERS } from '../src/domain/catalog.ts';
import { quotePurchase } from '../src/domain/economy.ts';
import { createMarket } from '../src/domain/engine.ts';
import { EVENT_CATALOG, EVENT_WINDOW_MS, MAX_VIP_CHANCE, economyAt, eventAt, levelFor, levelPerks, levelProgress, marketFor, xpForLevel } from '../src/domain/progression.ts';
import { applyAction, advanceClock } from '../src/sim/rules.ts';
import { createInitialState } from '../src/sim/state.ts';

const context = (now) => ({ now, random: () => .5, checkEnglish: (text) => ({ ok: true, corrected: text }) });

test('A new bar starts at level 1 and levels follow a rising XP curve', () => {
  const state = createInitialState(Date.now());
  assert.equal(state.xp, 0);
  assert.equal(levelFor(state.xp), 1);
  assert.equal(xpForLevel(2), 60);
  assert.equal(xpForLevel(3), 140);
  assert.equal(levelFor(59), 1);
  assert.equal(levelFor(60), 2);
  assert.equal(levelFor(139), 2);
  assert.deepEqual(levelProgress(100), { level: 2, into: 40, needed: 80, percent: 50 });
  for (let level = 2; level < 50; level++) assert.ok(xpForLevel(level + 1) - xpForLevel(level) > xpForLevel(level) - xpForLevel(level - 1));
});

test('Higher levels: more VIPs (never above 35%), better pay, pricier supplies, shorter waits', () => {
  let previous = levelPerks(1);
  assert.equal(previous.vipChance, .05);
  for (let level = 2; level <= 60; level++) {
    const perks = levelPerks(level);
    assert.ok(perks.vipChance >= previous.vipChance && perks.vipChance <= MAX_VIP_CHANCE);
    assert.ok(perks.pay >= previous.pay && perks.supply >= previous.supply && perks.arrival <= previous.arrival);
    previous = perks;
  }
  assert.equal(levelPerks(50).vipChance, MAX_VIP_CHANCE);
  // Even VIP Night cannot push the chance over the cap.
  const region = REGIONS[0];
  for (let window = 0; window < 3000; window++) {
    const economy = economyAt(region.id, region.marketFactor, 100_000, window * EVENT_WINDOW_MS);
    assert.ok(economy.vipChance <= MAX_VIP_CHANCE);
  }
});

test('City events are fixed by the clock, cover buffs and disasters, and change prices', () => {
  const region = REGIONS[0];
  const seen = new Set();
  let shortage;
  let discount;
  for (let window = 0; window < 2000; window++) {
    const now = window * EVENT_WINDOW_MS + 1000;
    const event = eventAt(region.id, now);
    assert.deepEqual(eventAt(region.id, now + 60_000), event, 'the same event for the whole window');
    if (!event) continue;
    seen.add(event.id);
    if (event.id === 'shortage') { shortage ??= now; assert.ok(event.shortageIds.length > 0); }
    if (event.id === 'discounts') discount ??= now;
  }
  assert.deepEqual([...seen].sort(), EVENT_CATALOG.map((event) => event.id).sort());
  assert.ok(EVENT_CATALOG.some((event) => event.kind === 'buff') && EVENT_CATALOG.some((event) => event.kind === 'disaster'));

  const base = (now) => createMarket(region, new Date(now).getDate());
  const cheap = marketFor(region, discount, 0);
  base(discount).forEach((offer, index) => assert.ok(Math.abs(cheap[index].price - offer.price * .8) < .02));
  const short = eventAt(region.id, shortage);
  const pricey = marketFor(region, shortage, 0);
  base(shortage).forEach((offer, index) => {
    const factor = short.shortageIds.includes(offer.ingredientId) ? 1.8 : 1;
    assert.ok(Math.abs(pricey[index].price - offer.price * factor) < .02);
  });
});

test('The rules charge event and level prices on the server side', () => {
  const region = REGIONS[0];
  let now = 0;
  while (eventAt(region.id, now)?.id !== 'discounts') now += EVENT_WINDOW_MS;
  now += 1000;
  const state = createInitialState(now);
  advanceClock(state, context(now));
  const supplier = SUPPLIERS.find((item) => item.id === 'global');
  const offer = marketFor(region, now, state.xp).find((item) => item.supplierId === 'global');
  const cart = { [offer.ingredientId]: 3 };
  const money = state.money;
  applyAction(state, { type: 'buy', supplierId: 'global', cart }, context(now));
  const paid = Math.round((money - state.money) * 100) / 100;
  assert.equal(paid, quotePurchase(marketFor(region, now, 0), cart, supplier).total, 'the rules charge the event price');
  assert.ok(paid < quotePurchase(createMarket(region, new Date(now).getDate()), cart, supplier).total, 'the discount is applied');
});

test('Guests carry their price level, so level-ups mid-order never break a budget', () => {
  const now = Date.now();
  const state = createInitialState(now);
  state.customers = [];
  state.nextCustomerAt = now - 1;
  state.xp = xpForLevel(20);
  advanceClock(state, { ...context(now), spawnCustomers: true });
  const guest = state.customers[0];
  const economy = economyAt(state.regionId, REGIONS.find((item) => item.id === state.regionId).marketFactor, state.xp, now);
  assert.equal(guest.priceFactor, economy.guestPriceFactor);
  assert.ok(guest.priceFactor > REGIONS.find((item) => item.id === state.regionId).marketFactor, 'level 20 guests pay more than catalog city prices');
  // A higher level makes the next guest arrive sooner (same random roll).
  const slow = createInitialState(now); slow.customers = []; slow.nextCustomerAt = 0;
  const fast = createInitialState(now); fast.customers = []; fast.nextCustomerAt = 0; fast.xp = xpForLevel(30);
  advanceClock(slow, context(now));
  advanceClock(fast, context(now));
  assert.ok(fast.nextCustomerAt - now < slow.nextCustomerAt - now);
});
