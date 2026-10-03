import { completeAction } from './paid-action.mjs';
import test from 'node:test';
import assert from 'node:assert/strict';
import { RECIPES, REGIONS, SUPPLIERS } from '../src/domain/catalog.ts';
import { BAR_PURCHASE_LEVEL, SECOND_BAR_COIN_COST, barUnlockPrice } from '../src/domain/barUnlocks.ts';
import { quotePurchase, supplierInCity } from '../src/domain/economy.ts';
import { createMarket, requiredRecipe } from '../src/domain/engine.ts';
import { EVENT_CATALOG, EVENT_WINDOW_MS, MAX_VIP_CHANCE, economyAt, eventAt, levelFor, levelPerks, levelProgress, marketFor, xpForLevel } from '../src/domain/progression.ts';
import { advanceClock } from '../src/sim/rules.ts';
import { createInitialState, normalizePlayerState } from '../src/sim/state.ts';
import { recipeCardsRequired } from '../src/sim/recipes.ts';
import { DAILY_LESSON_RECIPE_CHANCE, dailyLessonsFor, learningStreakBonus } from '../src/domain/dailyLessons.ts';
import { DEFAULT_BARS } from '../src/data/cosmetics/bars.ts';

const context = (now) => ({ now, random: () => .5, checkEnglish: (text) => ({ ok: true, corrected: text }) });

test('A new bar starts at level 1 and levels follow a rising XP curve', () => {
  const state = createInitialState(Date.now());
  assert.deepEqual(state.tradeLog, []);
  assert.equal(state.xp, 0);
  assert.equal(levelFor(state.xp), 1);
  assert.equal(xpForLevel(2), 60);
  assert.equal(xpForLevel(3), 190);
  assert.equal(levelFor(59), 1);
  assert.equal(levelFor(60), 2);
  assert.equal(levelFor(139), 2);
  assert.deepEqual(levelProgress(125), { level: 2, into: 65, needed: 130, percent: 50 });
  for (let level = 2; level < 50; level++) assert.ok(xpForLevel(level + 1) - xpForLevel(level) > xpForLevel(level) - xpForLevel(level - 1));
});

test('The trade history contains operations, not old stock tutorial notices', () => {
  const state = createInitialState(Date.now());
  state.tradeLog = ['Sold 2 products for 12.50 coins.', 'Each city bar now keeps its own stock.'];
  normalizePlayerState(state);
  assert.deepEqual(state.tradeLog, ['Sold 2 products for 12.50 coins.']);
});

test('Daily lessons award server-checked XP and crystals once, with a streak bonus capped at 50%', () => {
  const now = new Date(2026,8,29,12).getTime();
  const state = createInitialState(now);
  const lessons = dailyLessonsFor('2026-09-29');
  assert.equal(lessons.length,3);
  assert.throws(() => completeAction(state,{type:'completeDailyLesson',lessonId:lessons[0].id,answer:'wrong'},context(now)),/try again/i);
  const firstXp = state.xp;const firstCrystals = state.crystals;
  completeAction(state,{type:'completeDailyLesson',lessonId:lessons[0].id,answer:lessons[0].answer},context(now));
  assert.equal(state.xp,firstXp + lessons[0].xp);assert.equal(state.crystals,firstCrystals + lessons[0].crystals);
  assert.throws(() => completeAction(state,{type:'completeDailyLesson',lessonId:lessons[0].id,answer:lessons[0].answer},context(now)),/already/i);
  for (const lesson of lessons.slice(1)) completeAction(state,{type:'completeDailyLesson',lessonId:lesson.id,answer:lesson.answer},context(now));
  assert.equal(state.learningStreak,1);assert.equal(state.dailyLessonCompletedIds.length,3);
  state.learningStreak = 99;state.lastLearningDayKey = '2026-09-29';
  assert.equal(learningStreakBonus(100),.5);
  const tomorrow = new Date(2026,8,30,12).getTime();const next = dailyLessonsFor('2026-09-30')[0];
  const xp = state.xp;completeAction(state,{type:'completeDailyLesson',lessonId:next.id,answer:next.answer},context(tomorrow));
  assert.equal(state.xp - xp,Math.round(next.xp * 1.5));
});

test('Completing the daily set can drop a random recipe at the configured low chance', () => {
  assert.ok(DAILY_LESSON_RECIPE_CHANCE > 0 && DAILY_LESSON_RECIPE_CHANCE < .1);
  const now = new Date(2026,8,29,12).getTime();const state = createInitialState(now);const before = state.knownRecipeIds.length;
  const lucky = { ...context(now), random:() => 0 };
  for (const lesson of dailyLessonsFor('2026-09-29')) completeAction(state,{type:'completeDailyLesson',lessonId:lesson.id,answer:lesson.answer},lucky);
  assert.equal(state.knownRecipeIds.length,before + 1);assert.match(state.dailyLessonResult,/Lucky drop/);
});

test('The first bar is chosen freely; expansion starts at level 25, then costs coins and crystals', () => {
  const now = Date.now();const state = createInitialState(now);
  assert.equal(state.startingBarChosen,false);assert.deepEqual(state.ownedBarIds,['new-york']);
  assert.equal(new Set(Object.values(state.bars).map((bar) => bar.interior)).size,6,'the welcome screen previews six different interiors');
  completeAction(state,{type:'chooseStartingBar',regionId:'berlin'},context(now));
  assert.deepEqual(state.ownedBarIds,['berlin']);assert.equal(state.regionId,'berlin');
  assert.equal(state.bars.berlin.interior,DEFAULT_BARS.berlin.interior);assert.ok(state.ownedInteriorIds.includes(DEFAULT_BARS.berlin.interior));
  assert.throws(() => completeAction(state,{type:'switchBar',regionId:'london'},context(now)),/Purchase/);
  assert.throws(() => completeAction(state,{type:'buyBar',regionId:'london'},context(now)),new RegExp(`level ${BAR_PURCHASE_LEVEL}`));
  state.xp = xpForLevel(BAR_PURCHASE_LEVEL);state.money = SECOND_BAR_COIN_COST;
  completeAction(state,{type:'buyBar',regionId:'london'},context(now));
  assert.ok(state.ownedBarIds.includes('london'));assert.equal(state.money,0);assert.equal(state.regionId,'london');
  assert.equal(state.bars.london.interior,DEFAULT_BARS.london.interior);assert.ok(state.ownedInteriorIds.includes(DEFAULT_BARS.london.interior));
  assert.equal(barUnlockPrice(state.ownedBarIds).currency,'crystals');
  state.crystals = barUnlockPrice(state.ownedBarIds).amount;
  completeAction(state,{type:'buyBar',regionId:'tokyo'},context(now));
  assert.ok(state.ownedBarIds.includes('tokyo'));assert.equal(state.crystals,0);
});

test('Recipe mastery: levels 2 and 3 cost coins only, the top two levels also take 2 and 3 cards', () => {
  const now = Date.now();const state = createInitialState(now);const recipe = RECIPES[0];
  state.money = 100000;state.recipeCopies = {};
  assert.deepEqual([1,2,3,4].map(recipeCardsRequired),[0,0,2,3]);
  completeAction(state,{type:'upgradeRecipe',recipeId:recipe.id},context(now));
  completeAction(state,{type:'upgradeRecipe',recipeId:recipe.id},context(now));
  assert.equal(state.recipeLevels[recipe.id],3,'coins alone reach level 3');
  state.recipeCopies[recipe.id] = 1;
  assert.throws(() => completeAction(state,{type:'upgradeRecipe',recipeId:recipe.id},context(now)),/need 2/i);
  state.recipeCopies[recipe.id] = 2;
  completeAction(state,{type:'upgradeRecipe',recipeId:recipe.id},context(now));
  assert.equal(state.recipeLevels[recipe.id],4);assert.equal(state.recipeCopies[recipe.id],0);
});

test('Higher levels: more VIPs (never above the cap), better pay and tips, cheaper and faster supplies, shorter waits', () => {
  let previous = levelPerks(1);
  assert.equal(previous.vipChance, .05);
  for (let level = 2; level <= 60; level++) {
    const perks = levelPerks(level);
    assert.ok(perks.vipChance >= previous.vipChance && perks.vipChance <= MAX_VIP_CHANCE);
    assert.ok(perks.pay >= previous.pay && perks.supply <= previous.supply && perks.delivery <= previous.delivery && perks.tipChance >= previous.tipChance && perks.arrival <= previous.arrival);
    previous = perks;
  }
  assert.equal(levelPerks(50).vipChance, MAX_VIP_CHANCE);
  // A new bar earns less and pays full supplier prices; perks stay within modest caps.
  assert.equal(levelPerks(1).pay, .85);assert.equal(levelPerks(1).supply, 1);assert.equal(levelPerks(1).tipChance, .45);
  assert.ok(levelPerks(50).pay <= 1.3 && levelPerks(50).supply >= .85 && levelPerks(50).delivery >= .65 && levelPerks(50).tipChance <= .75);
  assert.equal(levelPerks(4).autoSupply, false);assert.equal(levelPerks(5).autoSupply, true);
  assert.equal(levelPerks(9).autoServe, false);assert.equal(levelPerks(10).autoServe, true);
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
  base(discount).forEach((offer, index) => assert.equal(cheap[index].price, Math.round(offer.price * .8)));
  const short = eventAt(region.id, shortage);
  const pricey = marketFor(region, shortage, 0);
  base(shortage).forEach((offer, index) => {
    const factor = short.shortageIds.includes(offer.ingredientId) ? 1.8 : 1;
    assert.equal(pricey[index].price, Math.round(offer.price * factor));
  });
});

test('The rules charge event and level prices on the server side', () => {
  const region = REGIONS[0];
  let now = 0;
  while (eventAt(region.id, now)?.id !== 'discounts') now += EVENT_WINDOW_MS;
  now += 1000;
  const state = createInitialState(now);
  advanceClock(state, context(now));
  // The bar pays this city's delivery terms.
  const supplier = supplierInCity(SUPPLIERS.find((item) => item.id === 'global'), region.marketFactor);
  const offer = marketFor(region, now, state.xp).find((item) => item.supplierId === 'global');
  const cart = { [offer.ingredientId]: 3 };
  const money = state.money;
  completeAction(state, { type: 'buy', supplierId: 'global', cart }, context(now));
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
  // A city event of the hour (a new competitor, a festival) can raise or lower the price factor; the level perk is what is tested.
  assert.ok(guest.priceFactor / (economy.event?.effects?.pay ?? 1) > REGIONS.find((item) => item.id === state.regionId).marketFactor, 'level 20 guests pay more than catalog city prices');
  // A higher level makes the next guest arrive sooner (same random roll).
  const slow = createInitialState(now); slow.customers = []; slow.nextCustomerAt = 0;
  const fast = createInitialState(now); fast.customers = []; fast.nextCustomerAt = 0; fast.xp = xpForLevel(30);
  advanceClock(slow, context(now));
  advanceClock(fast, context(now));
  assert.ok(fast.nextCustomerAt - now < slow.nextCustomerAt - now);
});

test('Tips are a chance, Auto-serve needs level 10 and a confirmed order, and never earns a tip', () => {
  const now = 1_800_000_000_000;
  const at = (random) => ({ now, random: () => random, checkEnglish: (text) => ({ ok: true, corrected: text }) });
  const setup = (xp) => {
    const state = createInitialState(now);state.xp = xp;
    const guest = state.customers[0];guest.mood = 'calm';guest.orderKind = 'cocktail';guest.orderRecipeId = RECIPES[0].id;guest.orderRevealed = true;
    // Guests may ask for a twist (“extra lime”), so the exact drink comes from the rules, not the plain recipe.
    for (const item of requiredRecipe(guest).ingredients) state.inventories[state.regionId].find((stock) => stock.ingredientId === item.ingredientId).amount += 1000;
    return state;
  };
  const serve = (state, random) => completeAction(state,{type:'serve',mix:requiredRecipe(state.customers[0]).ingredients.map((item) => ({...item})),shaken:true,pourBrands:{}},at(random));
  // Guests without a fixed price factor pay the city's rate (the rules' own fallback).
  const price = (state) => Math.round(requiredRecipe(state.customers[0]).price * (state.customers[0].priceFactor ?? REGIONS.find((region) => region.id === state.regionId).marketFactor));

  const lucky = setup(0);const luckyPrice = price(lucky);const before = lucky.money;serve(lucky, .1);
  assert.equal(Math.round((lucky.money-before)*100)/100,luckyPrice);
  assert.ok(lucky.tipJar > 0, 'a tip waits in the jar');
  const tip = lucky.tipJar; completeAction(lucky,{type:'collectTips'},at(.1));
  assert.equal(lucky.tipJar,0); assert.equal(Math.round((lucky.money-before)*100)/100, Math.round((luckyPrice+tip)*100)/100);
  assert.throws(()=>completeAction(lucky,{type:'collectTips'},at(.1)),/empty/i);
  const unlucky = setup(0);const unluckyPrice = price(unlucky);const start = unlucky.money;serve(unlucky, .9);
  assert.equal(Math.round((unlucky.money - start) * 100) / 100, unluckyPrice, 'no tip above the chance');

  const low = setup(0);
  assert.throws(() => completeAction(low,{type:'autoServe'},at(.1)),/level 10/i);
  const high = setup(xpForLevel(10));high.customers[0].orderRevealed = false;
  assert.throws(() => completeAction(high,{type:'autoServe'},at(.1)),/talk to the guest/i);
  high.customers[0].orderRevealed = true;const autoPrice = price(high);const autoStart = high.money;const guestsBefore = high.customers.length;
  completeAction(high,{type:'autoServe'},at(.1));
  assert.equal(Math.round((high.money - autoStart) * 100) / 100, autoPrice, 'automated drinks are paid but not tipped');
  assert.equal(high.customers.length, guestsBefore - 1);
});

test('Auto-supply unlocks at level 5 and reorders low stock once, at market prices plus delivery', () => {
  const now = 1_800_000_000_000;
  const state = createInitialState(now);
  assert.throws(() => completeAction(state,{type:'setAutoSupply',enabled:true},context(now)),/level 5/i);
  state.xp = xpForLevel(5);state.money = 5000;
  const lime = state.inventories[state.regionId].find((stock) => stock.ingredientId === 'lime-juice');lime.amount = 20;
  completeAction(state,{type:'setAutoSupply',enabled:true},context(now));
  const orders = state.deliveryOrders.filter((order) => order.items.some((item) => item.ingredientId === 'lime-juice'));
  assert.equal(orders.length, 1, 'low stock is reordered');
  assert.ok(state.money < 5000);
  advanceClock(state,{ now: now + 1000 });
  assert.equal(state.deliveryOrders.filter((order) => order.items.some((item) => item.ingredientId === 'lime-juice')).length, 1, 'never ordered twice while on the way');
  const ordersBefore = state.deliveryOrders.length;
  completeAction(state,{type:'setAutoSupply',enabled:false},context(now + 2000));
  for (const stock of state.inventories[state.regionId]) stock.amount = 0;
  advanceClock(state,{ now: now + 3000 });
  assert.equal(state.deliveryOrders.length, ordersBefore, 'switched off, nothing is ordered');
});

test('City economy: every specialty is a real recipe, specialties pay a premium, delivery terms follow city prices', async () => {
  const { CITY_SPECIALTIES, SPECIALTY_PREMIUM, specialtyFactor, supplierInCity } = await import('../src/domain/economy.ts');
  for (const region of REGIONS) {
    assert.ok(CITY_SPECIALTIES[region.id].length >= 3, `${region.name} has specialties`);
    for (const id of CITY_SPECIALTIES[region.id]) assert.ok(RECIPES.some((recipe) => recipe.id === id), `${id} exists`);
  }
  assert.equal(specialtyFactor('tokyo','whiskey-highball'), 1 + SPECIALTY_PREMIUM);
  assert.equal(specialtyFactor('tashkent','whiskey-highball'), 1);
  const courier = SUPPLIERS[0];
  const cheap = supplierInCity(courier, REGIONS.find((region) => region.id === 'tashkent').marketFactor);
  const dear = supplierInCity(courier, REGIONS.find((region) => region.id === 'new-york').marketFactor);
  assert.ok(cheap.deliveryFee < dear.deliveryFee && cheap.freeDeliveryAt < dear.freeDeliveryAt);
});

test('Daily lessons: the bank is large and unique, and the correct answer is shuffled but always among the choices', () => {
  const seen = new Map();
  const positions = new Set();
  for (let day = 1; day <= 300; day++) {
    const key = '2027-' + String(1 + Math.floor(day / 28)).padStart(2, '0') + '-' + String(1 + (day % 28)).padStart(2, '0');
    for (const lesson of dailyLessonsFor(key)) {
      assert.equal(lesson.choices.length, 3);
      assert.ok(lesson.choices.includes(lesson.answer), lesson.id + ': the answer must be one of the choices');
      assert.equal(new Set(lesson.choices).size, 3, lesson.id + ': choices are different');
      assert.deepEqual(lesson.choices, dailyLessonsFor(key).find((item) => item.id === lesson.id).choices, 'the shuffle is stable for a day');
      if (seen.has(lesson.id)) assert.equal(seen.get(lesson.id), lesson.prompt, 'lesson ids are unique');
      seen.set(lesson.id, lesson.prompt);
      positions.add(lesson.choices.indexOf(lesson.answer));
    }
  }
  assert.ok(seen.size >= 45, 'at least 45 different lessons, saw ' + seen.size);
  assert.deepEqual([...positions].sort(), [0, 1, 2], 'the right answer is not always first');
});
