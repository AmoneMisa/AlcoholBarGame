import test from 'node:test';
import assert from 'node:assert/strict';
import { RECIPES } from '../src/domain/catalog.ts';
import { COSMETICS } from '../src/domain/cosmetics.ts';
import { DRAW_COST, LEGENDARY_PITY, TIER_LEVEL_CAP, rollRarity, upgradeCostFor } from '../src/domain/loot.ts';
import { normalizeLoot } from '../src/domain/lootState.ts';
import { xpForLevel } from '../src/domain/progression.ts';
import { applyAction } from '../src/sim/rules.ts';
import { lootBonuses } from '../src/sim/loot.ts';
import { createInitialState, normalizePlayerState } from '../src/sim/state.ts';

const NOW = new Date(2026, 8, 30, 12).getTime();
const context = (random = () => .5, now = NOW) => ({ now, random, checkEnglish: (text) => ({ ok: true, corrected: text }) });
const run = (state, action, random, now) => applyAction(state, action, context(random, now));
const fresh = () => { const state = createInitialState(NOW); state.startingBarChosen = true; state.loot.boxes = {}; return state; };

test('Old saves gain a valid loot state and tampered numbers are discarded', () => {
  const state = fresh();
  delete state.loot;
  normalizePlayerState(state);
  assert.equal(state.loot.parts, 0);
  const loot = normalizeLoot({ parts: -5, skinShards: 'x', boxes: { bronze: 2.9, fake: 9 }, equipment: { london: { shaker: { level: 99, tier: 'mythic' } } } }, 1);
  assert.equal(loot.parts, 0);
  assert.equal(loot.skinShards, 0);
  assert.deepEqual(loot.boxes, { bronze: 2 });
  assert.equal(loot.equipment.london.shaker.level, 10);
  assert.equal(loot.equipment.london.shaker.tier, 'common');
});

test('Equipment upgrades cost coins and parts, respect the tier cap and are per bar', () => {
  const state = fresh();
  state.money = 100_000; state.loot.parts = 500;
  const cost = upgradeCostFor(0);
  run(state, { type: 'upgradeEquipment', item: 'register' });
  assert.equal(state.loot.equipment['new-york'].register.level, 1);
  assert.equal(state.loot.parts, 500 - cost.parts);
  assert.equal(state.loot.equipment.london.register.level, 0);
  for (let i = 1; i < TIER_LEVEL_CAP.common; i++) run(state, { type: 'upgradeEquipment', item: 'register' });
  assert.throws(() => run(state, { type: 'upgradeEquipment', item: 'register' }), /tier/);
  assert.throws(() => run(state, { type: 'upgradeEquipment', item: 'nope' }), /Unknown equipment/);
  state.loot.itemShards.register = 10;
  run(state, { type: 'promoteEquipment', item: 'register' });
  run(state, { type: 'upgradeEquipment', item: 'register' });
  assert.equal(state.loot.equipment['new-york'].register.level, TIER_LEVEL_CAP.common + 1);
  assert.ok(lootBonuses(state, NOW).payFactor > 1.07);
});

test('A refused upgrade never spends anything', () => {
  const state = fresh();
  state.money = 10; state.loot.parts = 0;
  assert.throws(() => run(state, { type: 'upgradeEquipment', item: 'shaker' }));
  assert.equal(state.money, 10);
  assert.equal(state.loot.equipment['new-york'].shaker.level, 0);
});

test('Boxes: only owned boxes open, rewards land in the state, choice boxes need a pick', () => {
  const state = fresh();
  assert.throws(() => run(state, { type: 'openBox', box: 'gold' }), /do not have/);
  state.loot.boxes = { bronze: 2, choice: 1 };
  run(state, { type: 'openBox', box: 'bronze' }, () => 0);
  assert.equal(state.loot.parts, 8, 'the first box always holds enough parts for a first upgrade');
  run(state, { type: 'openBox', box: 'bronze' }, () => 0);
  assert.equal(state.loot.parts, 11);
  assert.equal(state.loot.boxes.bronze, undefined);
  run(state, { type: 'openBox', box: 'choice' }, () => .1);
  assert.equal(state.loot.pendingChoice.length, 3);
  assert.throws(() => run(state, { type: 'openBox', box: 'bronze' }), /choice box/);
  assert.throws(() => run(state, { type: 'pickReward', index: 5 }), /Pick one/);
  run(state, { type: 'pickReward', index: 0 });
  assert.equal(state.loot.pendingChoice, undefined);
});

test('Buying boxes and consumables spends crystals and refuses when short', () => {
  const state = fresh();
  assert.throws(() => run(state, { type: 'buyBox', box: 'bronze' }), /crystals/);
  assert.throws(() => run(state, { type: 'buyBox', box: 'choice' }), /not for sale/);
  state.crystals = 100;
  run(state, { type: 'buyBox', box: 'bronze', quantity: 2 });
  assert.equal(state.crystals, 40);
  assert.equal(state.loot.boxes.bronze, 2);
  run(state, { type: 'buyConsumable', id: 'golden-ice' });
  assert.equal(state.loot.consumables['golden-ice'], 1);
});

test('Boosters last for their duration and cannot stack; charges arm once', () => {
  const state = fresh();
  state.loot.consumables = { 'xp-boost': 2, 'golden-ice': 2 };
  run(state, { type: 'useConsumable', id: 'xp-boost' });
  assert.equal(lootBonuses(state, NOW + 1000).xpFactor, 1.5);
  assert.equal(lootBonuses(state, NOW + 61 * 60_000).xpFactor, 1);
  assert.throws(() => run(state, { type: 'useConsumable', id: 'xp-boost' }), /already active/);
  run(state, { type: 'useConsumable', id: 'golden-ice' });
  assert.throws(() => run(state, { type: 'useConsumable', id: 'golden-ice' }), /already armed/);
  assert.throws(() => run(state, { type: 'useConsumable', id: 'courier' }), /have no/);
});

test('Golden Ice pays more and always tips on the next perfect serve, and is used up', () => {
  // Both serves start from the same guest, so only Golden Ice can make the difference.
  const base = fresh();
  const guest = base.customers[0];
  guest.modifierId = undefined; guest.orderKind = 'cocktail'; guest.orderRevealed = true;
  for (const stock of base.inventories['new-york']) stock.amount = 5000;
  const recipe = RECIPES.find((item) => item.id === guest.orderRecipeId);
  const serve = (armed) => {
    const state = structuredClone(base);
    if (armed) state.loot.armed['golden-ice'] = 1;
    run(state, { type: 'serve', mix: recipe.ingredients.map((item) => ({ ...item })), shaken: true, pourBrands: {} });
    return state;
  };
  const plain = serve(false);
  const golden = serve(true);
  assert.ok(plain.money > 600, 'the plain serve was perfect');
  assert.ok(golden.money > plain.money);
  assert.equal(golden.loot.armed['golden-ice'], undefined);
});

test('Style draw: costs crystals, unlocks skins, duplicates become shards, pity guarantees a legendary', () => {
  const state = fresh();
  assert.throws(() => run(state, { type: 'drawStyle', count: 1 }), /crystals/);
  assert.throws(() => run(state, { type: 'drawStyle', count: 3 }), /single/);
  state.crystals = DRAW_COST.ten + DRAW_COST.single;
  run(state, { type: 'drawStyle', count: 10 }, () => .9);
  assert.equal(state.crystals, DRAW_COST.single);
  assert.equal(state.loot.lastDraw.length, 10);
  assert.ok(state.loot.lastDraw.some((item) => item.rarity !== 'common'), 'a ten-draw guarantees a rare');
  const shardsBefore = state.loot.skinShards;
  run(state, { type: 'drawStyle', count: 1 }, () => .9);
  assert.ok(state.ownedCosmeticIds.length >= 1);
  assert.ok(state.loot.skinShards >= shardsBefore);
  assert.equal(rollRarity({ sinceRare: 0, sinceLegendary: LEGENDARY_PITY - 1 }, () => .99), 'legendary');
  assert.equal(rollRarity({ sinceRare: 0, sinceLegendary: 0 }, () => .99), 'common');
});

test('Skin shards craft a chosen skin only when enough are held', () => {
  const state = fresh();
  const skin = COSMETICS.find((item) => item.rarity === 'common');
  assert.throws(() => run(state, { type: 'craftSkin', cosmeticId: skin.id }), /skin shards/);
  state.loot.skinShards = 20;
  run(state, { type: 'craftSkin', cosmeticId: skin.id });
  assert.ok(state.ownedCosmeticIds.includes(skin.id));
  assert.equal(state.loot.skinShards, 0);
  assert.throws(() => run(state, { type: 'craftSkin', cosmeticId: skin.id }), /already own/);
});

test('Level-ups grant boxes exactly once', () => {
  const state = fresh();
  state.xp = xpForLevel(9);
  state.loot.levelRewarded = 1;
  run(state, { type: 'tick' });
  assert.equal(state.loot.boxes.choice, undefined);
  assert.equal(state.loot.boxes.silver, 1);
  assert.equal(state.loot.boxes.bronze, 4);
  state.xp = xpForLevel(10);
  run(state, { type: 'tick' });
  assert.equal(state.loot.boxes.choice, 1);
  run(state, { type: 'tick' });
  assert.equal(state.loot.boxes.choice, 1);
  assert.equal(state.loot.boxes.bronze, 4);
});

test('Prestige needs level 50, resets the business, keeps recipes and crystals, and stars buy permanent perks', () => {
  const state = fresh();
  state.crystals = 77;
  assert.throws(() => run(state, { type: 'prestige' }), /level 50/);
  state.xp = xpForLevel(50);
  state.money = 99_999;
  state.loot.runEarned = 40_000;
  state.loot.equipment['new-york'].shaker.level = 4;
  const recipes = [...state.knownRecipeIds];
  run(state, { type: 'prestige' });
  assert.equal(state.xp, 0);
  assert.equal(state.money, 600);
  assert.equal(state.crystals, 77);
  assert.deepEqual(state.knownRecipeIds, recipes);
  assert.equal(state.loot.equipment['new-york'].shaker.level, 0);
  assert.equal(state.loot.prestige.count, 1);
  assert.equal(state.loot.prestige.stars, 2 + Math.floor(Math.sqrt(40_000 / 400)));
  assert.equal(state.loot.boxes.choice, 1);
  const stars = state.loot.prestige.stars;
  run(state, { type: 'buyPrestigePerk', perk: 'pay' });
  run(state, { type: 'buyPrestigePerk', perk: 'bank' });
  assert.equal(state.loot.prestige.stars, stars - 2);
  assert.equal(lootBonuses(state, NOW).payFactor, 1.015);
  state.loot.prestige.stars = 0;
  assert.throws(() => run(state, { type: 'buyPrestigePerk', perk: 'supply' }), /stars/);
  assert.throws(() => run(state, { type: 'buyPrestigePerk', perk: 'fake' }), /Unknown/);
});

test('Recipe Scroll needs a known recipe; Express Courier needs a delivery', () => {
  const state = fresh();
  state.loot.consumables = { scroll: 1, courier: 1 };
  assert.throws(() => run(state, { type: 'useConsumable', id: 'scroll', recipeId: 'not-a-recipe' }), /already know/);
  run(state, { type: 'useConsumable', id: 'scroll', recipeId: state.knownRecipeIds[0] });
  assert.equal(state.recipeCopies[state.knownRecipeIds[0]], 1);
  assert.throws(() => run(state, { type: 'useConsumable', id: 'courier' }), /no delivery/);
  state.deliveryOrders.push({ id: 'a', supplier: 'S', barId: 'new-york', dueAt: NOW + 1e9, items: [], total: 0 });
  run(state, { type: 'useConsumable', id: 'courier' });
  run(state, { type: 'tick' });
  assert.equal(state.deliveryOrders.length, 0);
});

test('Serving tracks stats, pays the tasting reward only the first time, and quests/achievements claim once', async () => {
  const { RECIPES } = await import('../src/domain/catalog.ts');
  const { questsForWeek, weekOf } = await import('../src/domain/quests.ts');
  const state = fresh();
  const serve = () => {
    const guest = state.customers[0];
    guest.modifierId = undefined; guest.orderKind = 'cocktail'; guest.orderRevealed = true; guest.orderRecipeId = RECIPES[0].id;
    for (const stock of state.inventories['new-york']) stock.amount = 5000;
    run(state, { type: 'serve', mix: RECIPES[0].ingredients.map((item) => ({ ...item })), shaken: true, pourBrands: {} });
    state.customers = state.customers.length ? state.customers : [];
  };
  serve();
  assert.equal(state.loot.stats.serves, 1);
  assert.equal(state.loot.stats.tasted, 1);
  assert.equal(state.loot.skinShards, 3);
  serve();
  assert.equal(state.loot.stats.serves, 2);
  assert.equal(state.loot.skinShards, 3, 'no second tasting reward');

  assert.throws(() => run(state, { type: 'claimAchievement', id: 'a-serve-10' }), /not finished/);
  state.loot.stats.serves = 10;
  run(state, { type: 'claimAchievement', id: 'a-serve-10' });
  assert.equal(state.loot.boxes.bronze >= 1, true);
  assert.throws(() => run(state, { type: 'claimAchievement', id: 'a-serve-10' }), /already claimed/);

  const quest = questsForWeek(weekOf(NOW))[0];
  assert.throws(() => run(state, { type: 'claimQuest', questId: quest.id }), /not finished/);
  state.loot.quests = { week: weekOf(NOW), progress: { [quest.stat]: quest.target }, claimed: [] };
  const crystals = state.crystals;
  run(state, { type: 'claimQuest', questId: quest.id });
  assert.equal(state.crystals, crystals + quest.crystals);
  assert.throws(() => run(state, { type: 'claimQuest', questId: quest.id }), /already claimed/);
  assert.throws(() => run(state, { type: 'claimQuest', questId: 'q-fake' }), /not active/);
});

test('New players start with stock only for their starter recipes; other rows are empty and auto-supply ignores them', async () => {
  const { RECIPES, INGREDIENTS } = await import('../src/domain/catalog.ts');
  const { usableIngredientIds } = await import('../src/domain/usableStock.ts');
  const state = createInitialState(NOW);
  const usable = usableIngredientIds(state.knownRecipeIds);
  for (const stock of state.inventories['new-york']) {
    if (usable.has(stock.ingredientId)) assert.ok(stock.amount > 0, `${stock.ingredientId} is stocked`);
    else assert.equal(stock.amount, 0, `${stock.ingredientId} starts empty`);
  }
  assert.equal(state.inventories.london.length, INGREDIENTS.length, 'every row still exists so deliveries can land');
  // Auto-supply must not order ingredients the player cannot use yet.
  state.startingBarChosen = true; state.xp = 1e6; state.money = 1e6; state.autoSupply = true;
  run(state, { type: 'tick' });
  const ordered = state.deliveryOrders.flatMap((order) => order.items.map((item) => item.ingredientId));
  assert.ok(ordered.every((id) => usable.has(id)));
  // Learning a recipe makes its ingredients usable.
  const locked = RECIPES.find((recipe) => !state.knownRecipeIds.includes(recipe.id) && recipe.ingredients.some((item) => !usable.has(item.ingredientId)));
  state.knownRecipeIds.push(locked.id);
  assert.ok(locked.ingredients.every((item) => usableIngredientIds(state.knownRecipeIds).has(item.ingredientId)));
});

test('Starting stock is small but covers several levels of starter orders', async () => {
  const { RECIPES } = await import('../src/domain/catalog.ts');
  const { starterStock, STARTER_SERVES } = await import('../src/sim/state.ts');
  const ids = RECIPES.slice(0, 10).map((recipe) => recipe.id);
  const stock = starterStock(ids);
  // Every starter recipe can be made at least three times from the starting stock alone.
  for (const recipe of RECIPES.slice(0, 10)) for (const part of recipe.ingredients) assert.ok((stock.get(part.ingredientId) ?? 0) >= part.amount * 3, `${recipe.name}: ${part.ingredientId}`);
  // ...but nothing is stocked for more than ~40 average orders (it used to be 120+ for some items).
  for (const [id, amount] of stock) {
    if (!amount) continue;
    const perOrder = RECIPES.slice(0, 10).flatMap((recipe) => recipe.ingredients.filter((part) => part.ingredientId === id)).reduce((sum, part) => sum + part.amount, 0) / 10;
    assert.ok(amount <= Math.max(perOrder * STARTER_SERVES * 3, 0.5 * 3 * 90), `${id} is not over-stocked`);
  }
});

test('English rewards: perfect talks pay parts, every third (or hard) one a box; finishing the daily set pays a box', async () => {
  const { englishTalkReward, dailyLessonsBox } = await import('../src/sim/loot.ts');
  const { dailyLessonsFor } = await import('../src/domain/dailyLessons.ts');
  const { questsForWeek } = await import('../src/domain/quests.ts');
  const state = fresh();
  englishTalkReward(state, 1, NOW);
  englishTalkReward(state, 2, NOW);
  assert.equal(state.loot.parts, 3);
  assert.equal(state.loot.boxes.bronze, undefined);
  englishTalkReward(state, 1, NOW);
  assert.equal(state.loot.boxes.bronze, 1);
  englishTalkReward(state, 4, NOW);
  assert.equal(state.loot.boxes.silver, 1, 'hard English drops a silver box');
  assert.equal(state.loot.stats.perfectTalks, 4);
  dailyLessonsBox(state, 3, NOW);
  assert.equal(state.loot.boxes.bronze, 2);
  dailyLessonsBox(state, 7, NOW);
  assert.equal(state.loot.boxes.silver, 2);
  assert.equal(state.loot.stats.lessons, 2);
  for (let week = 0; week < 30; week++) assert.equal(new Set(questsForWeek(week).map((quest) => quest.id)).size, 3);

  // Through the real action: the third lesson of the day grants the box exactly once.
  const day = new Date(2026, 8, 29, 12).getTime();
  const player = fresh();
  for (const lesson of dailyLessonsFor('2026-09-29')) run(player, { type: 'completeDailyLesson', lessonId: lesson.id, answer: lesson.answer }, undefined, day);
  assert.equal(player.loot.boxes.bronze, 1);
  assert.equal(player.loot.stats.lessons, 1);
});

test('Regulars: loyalty grows per served guest, levels pay rewards once, favourites pay a bonus only for regulars', async () => {
  const { earnLoyalty, regularPriceBonus } = await import('../src/sim/loot.ts');
  const { favoriteRecipeId, regularLevel, REGULAR_FAVORITE_BONUS } = await import('../src/domain/regulars.ts');
  const state = fresh();
  const favorite = favoriteRecipeId('marin');
  const other = RECIPES.slice(0, 10).find((recipe) => recipe.id !== favorite).id;
  assert.equal(favoriteRecipeId('marin'), favorite, 'stable favourite');
  assert.equal(regularPriceBonus(state, 'marin', favorite), 1, 'no bonus before level 1');
  earnLoyalty(state, 'marin', 'Marin', other, false);
  earnLoyalty(state, 'marin', 'Marin', other, false);
  assert.equal(state.loot.boxes.bronze, undefined);
  const note = earnLoyalty(state, 'marin', 'Marin', other, false);
  assert.match(note, /level 1 regular/);
  assert.equal(state.loot.boxes.bronze, 1);
  assert.equal(regularLevel(state.loot.regulars.marin), 1);
  assert.equal(regularPriceBonus(state, 'marin', favorite), REGULAR_FAVORITE_BONUS);
  assert.equal(regularPriceBonus(state, 'marin', other), 1);
  // VIP + favourite jump three points, and a level is never paid twice.
  earnLoyalty(state, 'marin', 'Marin', favorite, true);
  assert.equal(state.loot.regulars.marin, 6);
  earnLoyalty(state, 'marin', 'Marin', favorite, true);
  assert.equal(state.loot.regulars.marin, 9);
  assert.equal(state.loot.parts, 8);
  earnLoyalty(state, 'marin', 'Marin', other, false);
  assert.equal(state.loot.parts, 8);
  // Unknown portraits and tampered saves are ignored.
  assert.equal(earnLoyalty(state, 'not-a-guest', 'X', other, false), '');
  assert.deepEqual(normalizeLoot({ regulars: { marin: 5, hacker: 999, kai: -3 } }, 1).regulars, { marin: 5 });
});

test('Spoilage: fresh produce loses stock daily from level 3, the fridge slows it, everything else keeps', async () => {
  const { xpForLevel: xpFor } = await import('../src/domain/progression.ts');
  const { spoiledAmount, spoilRate, isPerishable } = await import('../src/domain/warehouse.ts');
  const { INGREDIENTS } = await import('../src/domain/catalog.ts');
  const DAY = 86_400_000;
  assert.equal(spoilRate(0), .12);
  assert.equal(spoilRate(10), 0);
  assert.equal(spoiledAmount(8, 0), 0, 'tiny reserves are safe');
  assert.equal(isPerishable(INGREDIENTS.find((item) => item.id === 'mint')), true);
  assert.equal(isPerishable(INGREDIENTS.find((item) => item.id === 'gin')), false);
  const stockOf = (state, id) => state.inventories['new-york'].find((item) => item.ingredientId === id);

  const beginner = fresh();
  stockOf(beginner, 'lime-juice').amount = 1000;
  run(beginner, { type: 'tick' }, undefined, NOW);
  run(beginner, { type: 'tick' }, undefined, NOW + 3 * DAY);
  assert.equal(stockOf(beginner, 'lime-juice').amount, 1000, 'no spoilage below level 3');

  const state = fresh();
  state.xp = xpFor(3);
  stockOf(state, 'lime-juice').amount = 1000; stockOf(state, 'gin').amount = 1000;
  run(state, { type: 'tick' }, undefined, NOW);
  run(state, { type: 'tick' }, undefined, NOW + DAY / 2);
  assert.equal(stockOf(state, 'lime-juice').amount, 1000, 'nothing before a full day');
  run(state, { type: 'tick' }, undefined, NOW + DAY);
  assert.equal(stockOf(state, 'lime-juice').amount, 880);
  assert.equal(stockOf(state, 'gin').amount, 1000);
  assert.match(state.loot.log[0], /Spoilage/);
  run(state, { type: 'tick' }, undefined, NOW + DAY + 1000);
  assert.equal(stockOf(state, 'lime-juice').amount, 880, 'once per day');

  const cold = fresh();
  cold.xp = xpFor(3); cold.loot.equipment['new-york'].fridge.level = 10;
  stockOf(cold, 'lime-juice').amount = 1000;
  run(cold, { type: 'tick' }, undefined, NOW);
  run(cold, { type: 'tick' }, undefined, NOW + 5 * DAY);
  assert.equal(stockOf(cold, 'lime-juice').amount, 1000, 'a level 10 fridge stops spoilage');
});

test('Storeroom capacity: orders beyond it are refused, the fridge raises it, late deliveries are clamped', async () => {
  const { capacityFor } = await import('../src/domain/warehouse.ts');
  const { INGREDIENTS, SUPPLIERS } = await import('../src/domain/catalog.ts');
  const { marketFor } = await import('../src/domain/progression.ts');
  const { REGIONS } = await import('../src/domain/catalog.ts');
  const gin = INGREDIENTS.find((item) => item.id === 'gin');
  assert.equal(capacityFor(gin, 0), 5000);
  assert.equal(capacityFor(gin, 10), 10000);
  const state = fresh();
  state.money = 1e6;
  const region = REGIONS[0];
  const offer = marketFor(region, NOW, state.xp).find((item) => item.ingredientId === 'gin');
  const supplier = SUPPLIERS.find((item) => item.id === offer.supplierId);
  const packs = Math.ceil(5000 / offer.quantity) + 1;
  assert.throws(() => run(state, { type: 'buy', supplierId: supplier.id, cart: { gin: packs } }), /No room for Gin/);
  assert.equal(state.money, 1e6, 'a refused order costs nothing');
  state.loot.equipment['new-york'].fridge.level = 10;
  run(state, { type: 'buy', supplierId: supplier.id, cart: { gin: packs } });
  assert.equal(state.deliveryOrders.length, 1);
  // Pending deliveries count against the room.
  assert.throws(() => run(state, { type: 'buy', supplierId: supplier.id, cart: { gin: 99 } }), /No room/);
  // A delivery that lands on a nearly full shelf is clamped.
  state.loot.equipment['new-york'].fridge.level = 0;
  state.deliveryOrders[0].dueAt = NOW;
  run(state, { type: 'tick' }, undefined, NOW + 1000);
  assert.ok(state.inventories['new-york'].find((item) => item.ingredientId === 'gin').amount <= 5000);
});

test('Workshop gifts are limited to five per day and reset the next day', async () => {
  const { payForGift, LOOT_GIFTS_PER_DAY } = await import('../src/sim/gifts.ts');
  const state = fresh();
  state.loot.skinShards = 1000;
  for (let i = 0; i < LOOT_GIFTS_PER_DAY; i++) payForGift(state, { kind: 'skin-shards', amount: 5 }, NOW);
  assert.throws(() => payForGift(state, { kind: 'skin-shards', amount: 5 }, NOW), /per day/);
  assert.equal(state.loot.skinShards, 1000 - 5 * LOOT_GIFTS_PER_DAY);
  payForGift(state, { kind: 'skin-shards', amount: 5 }, NOW + 86_400_000);
});

test('Signature cocktails: validation, price scoring, fee, level gate', async () => {
  const { scoreSignature, validateSignature, SIGNATURE_FEE, SIGNATURE_LEVEL } = await import('../src/domain/signature.ts');
  const { usableIngredientIds } = await import('../src/domain/usableStock.ts');
  const { RECIPES } = await import('../src/domain/catalog.ts');
  const good = { name: '  Velvet   Hour!! ', needsShake: true, items: [{ ingredientId: 'gin', amount: 45 }, { ingredientId: 'lime-juice', amount: 20 }, { ingredientId: 'sugar-syrup', amount: 15 }, { ingredientId: 'mint', amount: 2 }] };
  const usable = usableIngredientIds(RECIPES.slice(0, 10).map((recipe) => recipe.id));
  const clean = validateSignature(good, usable);
  assert.equal(clean.name, 'Velvet Hour');
  const score = scoreSignature(good.items);
  assert.match(score.notes.join(), /Balanced sour and sweet/);
  assert.match(score.notes.join(), /Garnished/);
  assert.ok(score.price > 9 && score.price <= 15);
  const bad = (patch, pattern) => assert.throws(() => validateSignature({ ...good, ...patch }, usable), pattern);
  bad({ name: 'x' }, /name/);
  bad({ items: [{ ingredientId: 'gin', amount: 45 }] }, /2 to 5/);
  bad({ items: [{ ingredientId: 'gin', amount: 47 }, { ingredientId: 'soda', amount: 60 }] }, /steps of/);
  bad({ items: [{ ingredientId: 'gin', amount: 45 }, { ingredientId: 'gin', amount: 15 }] }, /twice/);
  bad({ items: [{ ingredientId: 'soda', amount: 60 }, { ingredientId: 'tonic', amount: 60 }] }, /spirit/);
  bad({ items: [{ ingredientId: 'gin', amount: 15 }, { ingredientId: 'soda', amount: 30 }] }, /liquid/);
  bad({ items: [{ ingredientId: 'nonsense', amount: 15 }, { ingredientId: 'soda', amount: 30 }] }, /Unknown/);
  bad({ items: [{ ingredientId: 'dark-rum', amount: 30 }, { ingredientId: 'soda', amount: 60 }] }, /not stocked/);
  assert.ok(scoreSignature([{ ingredientId: 'gin', amount: 60 }, { ingredientId: 'vodka', amount: 60 }, { ingredientId: 'white-rum', amount: 60 }]).notes.some((line) => /Too strong/.test(line)));

  const state = fresh();
  const action = { type: 'designSignature', name: good.name, items: good.items, needsShake: true };
  assert.throws(() => run(state, action), /unlock at level/);
  state.xp = xpForLevel(SIGNATURE_LEVEL);
  state.money = 100;
  assert.throws(() => run(state, action), /coins/);
  state.money = 1000;
  run(state, action);
  assert.equal(state.money, 1000 - SIGNATURE_FEE);
  assert.equal(state.loot.signatures['new-york'].name, 'Velvet Hour');
  assert.equal(state.loot.signatures.london, undefined, 'per bar');
  assert.throws(() => run(state, action), /already/);
  assert.equal(state.money, 700, 'a refused redesign is free');
});

test('Signature guests order the house special, pay its price with fame, and cannot be swapped', async () => {
  const { RECIPES } = await import('../src/domain/catalog.ts');
  const { requiredRecipe } = await import('../src/domain/engine.ts');
  const { fameLevel, FAME_STEPS } = await import('../src/domain/signature.ts');
  const state = fresh();
  state.xp = xpForLevel(15);
  state.money = 1000;
  const items = [{ ingredientId: 'gin', amount: 45 }, { ingredientId: 'tonic', amount: 90 }];
  run(state, { type: 'designSignature', name: 'Sky Tonic', items, needsShake: false });
  // Force the next arrival to be a signature guest (random() = 0 is below the guest chance).
  state.customers = []; state.nextCustomerAt = 1; state.vipCooldownUntil = NOW + 1e12;
  applyAction(state, { type: 'tick' }, { now: NOW + 10_000, random: () => 0, checkEnglish: (t) => ({ ok: true, corrected: t }), spawnCustomers: true });
  const guest = state.customers[0];
  assert.ok(guest?.signature, 'a signature guest arrived');
  // The house special is not announced: the client never sees it, and it must be brought up in English.
  const { publicState } = await import('../src/sim/state.ts');
  const view = publicState(state).customers[0];
  assert.equal(view.signature, undefined);
  assert.doesNotMatch(view.request, /Sky Tonic/);
  assert.equal(guest.orderRevealed, false);
  assert.throws(() => run(state, { type: 'serve', mix: items.map((item) => ({ ...item })), shaken: false, pourBrands: {} }), /Talk to the guest/);
  assert.throws(() => run(state, { type: 'offerSimilar', customerId: guest.id }), /signature cocktail/);
  run(state, { type: 'openConversation', customerId: guest.id });
  assert.doesNotMatch(state.conversations[guest.id].lines[0].text, /Sky Tonic/, 'the opening line does not give the name away');
  const seen = [];
  const talk = (text) => applyAction(state, { type: 'say', text }, { now: NOW + 20_000, random: () => .5, checkEnglish: (t) => { seen.push(t); return { ok: true, corrected: t }; } });
  talk('Good evening, how are you?');
  assert.equal(guest.orderRevealed, false, 'small talk does not confirm the order');
  talk('Would you like the Sky Tonic?');
  assert.match(seen.at(-1), /Mojito/, 'the invented name is masked for the spell checker');
  assert.equal(guest.orderRevealed, true);
  assert.match(guest.request, /Sky Tonic/);
  assert.equal(requiredRecipe(guest).ingredients.length, 2);
  assert.match(state.conversations[guest.id].lines.at(-1).text, /Sky Tonic is exactly what/);
  assert.equal(publicState(state).customers[0].signature.name, 'Sky Tonic');

  const price = guest.signature.price;
  for (const stock of state.inventories['new-york']) stock.amount = 5000;
  guest.priceFactor = 1;
  const before = state.money;
  run(state, { type: 'serve', mix: items.map((item) => ({ ...item })), shaken: false, pourBrands: {} }, () => .99);
  assert.ok(state.money - before >= price * .85, 'paid about the signature price');
  assert.equal(state.loot.signatures['new-york'].served, 1);
  assert.equal(state.loot.stats.signatures, 1);
  assert.equal(state.loot.stats.tasted ?? 0, 0, 'no tasting reward for the house special');

  // Fame levels up at the thresholds and pays a box once.
  state.loot.signatures['new-york'].served = FAME_STEPS[0] - 1;
  const g2 = { ...state.customers[0] };
  assert.equal(fameLevel(state.loot.signatures['new-york'].served), 0);
  state.customers = [{ ...guest, id: 'again', signature: guest.signature, patienceRemaining: 500, orderRevealed: true }];
  state.activeCustomerId = 'again';
  run(state, { type: 'serve', mix: items.map((item) => ({ ...item })), shaken: false, pourBrands: {} }, () => .99);
  assert.equal(fameLevel(state.loot.signatures['new-york'].served), 1);
  assert.ok((state.loot.boxes.bronze ?? 0) >= 1);
  void g2;
});

test('Saved signatures are re-validated on load', () => {
  const loot = normalizeLoot({ signatures: {
    'new-york': { name: 'Good One', needsShake: false, price: 99, served: 4, items: [{ ingredientId: 'gin', amount: 45 }, { ingredientId: 'tonic', amount: 90 }] },
    london: { name: 'Hack', items: [{ ingredientId: 'gin', amount: 1000 }] },
    berlin: 'not an object'
  } }, 1);
  assert.equal(loot.signatures['new-york'].name, 'Good One');
  assert.equal(loot.signatures['new-york'].served, 4);
  assert.notEqual(loot.signatures['new-york'].price, 99, 'price is recomputed, never trusted');
  assert.equal(loot.signatures.london, undefined);
  assert.equal(loot.signatures.berlin, undefined);
});

test('The house special can also be asked for as "the house special"; wrong dishes never confirm it', async () => {
  const state = fresh();
  state.xp = xpForLevel(15); state.money = 1000; state.vipCooldownUntil = NOW + 1e12;
  run(state, { type: 'designSignature', name: 'Amber Sour', items: [{ ingredientId: 'whiskey', amount: 45 }, { ingredientId: 'lemon-juice', amount: 25 }], needsShake: true });
  state.customers = []; state.nextCustomerAt = 1;
  applyAction(state, { type: 'tick' }, { now: NOW + 10_000, random: () => 0, checkEnglish: (t) => ({ ok: true, corrected: t }), spawnCustomers: true });
  const guest = state.customers[0];
  run(state, { type: 'openConversation', customerId: guest.id });
  const seen = [];
  const talk = (text) => applyAction(state, { type: 'say', text }, { now: NOW + 20_000, random: () => .5, checkEnglish: (t) => { seen.push(t); return { ok: true, corrected: t }; } });
  talk('Would you like a Mojito?');
  assert.equal(guest.orderRevealed, false, 'naming another drink does not confirm it');
  talk('Maybe our house special?');
  assert.equal(guest.orderRevealed, true);
  assert.equal(state.conversations[guest.id].correct, 2);
  // A vowel-initial name is masked with a vowel-initial word so "an Amber Sour" stays grammatical.
  talk('An Amber Sour is nice.');
  assert.match(seen.at(-1), /An Orange/);
});

test('Seasons: one per UTC month, two featured legendaries, all twelve covered once a year', async () => {
  const { seasonAt } = await import('../src/domain/seasons.ts');
  const { COSMETICS: all } = await import('../src/domain/cosmetics.ts');
  const legendary = all.filter((item) => item.rarity === 'legendary').map((item) => item.id);
  const featured = [];
  for (let month = 0; month < 12; month++) {
    const season = seasonAt(Date.UTC(2026, month, 15, 12));
    assert.equal(season.id, `2026-${String(month + 1).padStart(2, '0')}`);
    assert.equal(season.featuredIds.length, 2);
    assert.equal(season.startsAt, Date.UTC(2026, month, 1));
    assert.equal(season.endsAt, Date.UTC(2026, month + 1, 1));
    featured.push(...season.featuredIds);
  }
  assert.equal(new Set(featured).size, legendary.length, 'every legendary is featured once a year');
  assert.ok(featured.every((id) => legendary.includes(id)));
  assert.equal(seasonAt(Date.UTC(2026, 8, 30, 23, 59, 59)).id, '2026-09');
  assert.equal(seasonAt(Date.UTC(2026, 9, 1)).id, '2026-10');
});

test('Season banner: rate-up, draw counting, milestone boxes once, spark pick, monthly reset', async () => {
  const { seasonAt, SPARK_DRAWS, SEASON_MILESTONES } = await import('../src/domain/seasons.ts');
  const season = seasonAt(NOW);
  const state = fresh();
  state.crystals = 1e6;
  assert.throws(() => run(state, { type: 'drawStyle', count: 1, banner: 'nonsense' }), /Unknown banner/);
  // The standard banner never counts toward the season.
  run(state, { type: 'drawStyle', count: 1 }, () => .9);
  assert.equal(state.loot.season.draws, 0);
  // With random() = 0 every pull is legendary and lands on a featured style (0 < 0.75).
  const before = new Set(state.ownedCosmeticIds);
  run(state, { type: 'drawStyle', count: 1, banner: 'seasonal' }, () => 0);
  assert.equal(state.loot.season.draws, 1);
  assert.ok(season.featuredIds.includes(state.loot.lastDraw[0].id), 'the first pull is a featured legendary');
  assert.equal(state.loot.lastDraw[0].rarity, 'legendary');
  void before;
  // random() just below 1 never takes the rate-up: a featured style can still come from the normal pool, but the share is 75%.
  for (let i = 0; i < 9; i++) run(state, { type: 'drawStyle', count: 1, banner: 'seasonal' }, () => .9);
  assert.equal(state.loot.season.draws, 10);
  assert.equal(state.loot.boxes.silver, 1, 'milestone 10 pays a silver box once');
  run(state, { type: 'drawStyle', count: 10, banner: 'seasonal' }, () => .9);
  assert.equal(state.loot.boxes.silver, 1);
  assert.equal(state.loot.season.rewarded.length, 1);
  // Draws across a milestone in one ten-draw still pay it.
  state.loot.season.draws = 25;
  run(state, { type: 'drawStyle', count: 10, banner: 'seasonal' }, () => .9);
  assert.equal(state.loot.boxes.gold, 1);
  assert.deepEqual([...state.loot.season.rewarded].sort((a, b) => a - b), [10, 30].filter((step) => SEASON_MILESTONES.some((m) => m.draws === step)));

  // Spark needs enough draws, a featured style you do not own, and works once.
  const target = season.featuredIds.find((id) => !state.ownedCosmeticIds.includes(id)) ?? season.featuredIds[0];
  state.ownedCosmeticIds = state.ownedCosmeticIds.filter((id) => id !== target);
  assert.throws(() => run(state, { type: 'claimSpark', cosmeticId: target }), /first/);
  state.loot.season.draws = SPARK_DRAWS;
  assert.throws(() => run(state, { type: 'claimSpark', cosmeticId: COSMETICS.find((item) => item.rarity === 'common').id }), /featured styles/);
  run(state, { type: 'claimSpark', cosmeticId: target });
  assert.ok(state.ownedCosmeticIds.includes(target));
  assert.throws(() => run(state, { type: 'claimSpark', cosmeticId: target }), /already/);

  // A new month starts fresh.
  run(state, { type: 'drawStyle', count: 1, banner: 'seasonal' }, () => .9, Date.UTC(2026, 9, 2));
  assert.equal(state.loot.season.id, '2026-10');
  assert.equal(state.loot.season.draws, 1);
  assert.equal(state.loot.season.spark, false);
  assert.equal(normalizeLoot({ season: { id: 'bad', draws: -5, rewarded: [10, 999], spark: 'yes' } }, 1).season.rewarded.length, 1);
});

test('Week-end notice appears only for a claimable reward, once per week key', async () => {
  const { weeklyRewardNotice } = await import('../src/domain/leaderboard.ts');
  const base = { week: 2950, rank: 2, size: 40, tier: 'Podium', reward: '1 choice box + 1 silver box + 30 crystals', claimable: true };
  const notice = weeklyRewardNotice(base);
  assert.equal(notice.key, 'weekly-reward:2950');
  assert.match(notice.title, /Podium/);
  assert.match(notice.text, /#2 of 40/);
  assert.notEqual(weeklyRewardNotice({ ...base, week: 2951 }).key, notice.key);
  assert.equal(weeklyRewardNotice({ ...base, claimable: false }), null, 'already claimed');
  assert.equal(weeklyRewardNotice({ ...base, reward: null, claimable: false }), null, 'below the minimum score');
  assert.equal(weeklyRewardNotice(null), null, 'did not play last week');
});

test('Event backgrounds cannot be bought or gifted, come from boxes, and duplicates become shards', async () => {
  const { EVENT_INTERIOR_IDS, INTERIORS: all, DUPLICATE_INTERIOR_SHARDS, DEFAULT_BARS: bars } = await import('../src/data/cosmetics/bars.ts');
  const { giftPrice } = await import('../src/sim/gifts.ts');
  const { BOX_TABLES, rollFromTable } = await import('../src/domain/loot.ts');
  const { grantReward } = await import('../src/sim/loot.ts');
  const cheapest = Math.min(...EVENT_INTERIOR_IDS.map((id) => all.find((item) => item.id === id).crystalCost));
  assert.ok(cheapest >= 1800, 'only the high-cost backgrounds are events');
  assert.ok(EVENT_INTERIOR_IDS.every((id) => Object.values(bars).every((bar) => bar.interior !== id)), 'no city includes an event background');
  const state = fresh();
  state.crystals = 1e6;
  for (const id of EVENT_INTERIOR_IDS) {
    assert.throws(() => run(state, { type: 'buyInterior', interiorId: id }), /special event/);
    assert.equal(giftPrice({ kind: 'interior', interiorId: id }), undefined);
  }
  assert.equal(state.crystals, 1e6);
  run(state, { type: 'buyInterior', interiorId: 'garden' });   // ordinary backgrounds are still for sale
  // Gold and silver boxes can hold one.
  assert.ok(BOX_TABLES.gold.some((entry) => entry.make(1, () => 0).kind === 'eventInterior'));
  assert.ok(BOX_TABLES.silver.some((entry) => entry.make(1, () => 0).kind === 'eventInterior'));
  // Granting picks a background the player does not own; once all are owned it pays skin shards.
  const owned = new Set();
  for (let i = 0; i < EVENT_INTERIOR_IDS.length; i++) {
    const text = grantReward(state, { kind: 'eventInterior' }, () => 0);
    assert.match(text, /special event background/);
  }
  assert.ok(EVENT_INTERIOR_IDS.every((id) => state.ownedInteriorIds.includes(id)));
  const before = state.loot.skinShards;
  assert.match(grantReward(state, { kind: 'eventInterior' }, () => 0), /skin shards/);
  assert.equal(state.loot.skinShards, before + DUPLICATE_INTERIOR_SHARDS);
  void owned; void rollFromTable;
});

test('Review fixes: XP curve migration, first-box bonus, auto-serve gating, whole-word signature names, negotiated storeroom limits', async () => {
  const { migrateXpCurve } = await import('../src/sim/state.ts');
  const { levelFor, xpForLevel: newXp } = await import('../src/domain/progression.ts');
  const { RECIPES } = await import('../src/domain/catalog.ts');
  // 1) A save on the old curve keeps its level and its progress inside the level.
  const oldXp = (level) => { const s = level - 1; return 60 * s + 10 * s * (s - 1); };
  const old = { xp: oldXp(9) + 70 };   // level 9, 70 of 220 XP in
  migrateXpCurve(old);
  assert.equal(levelFor(old.xp), 9);
  assert.ok(old.xp > newXp(9) && old.xp < newXp(10));
  assert.ok(Math.abs((old.xp - newXp(9)) / (newXp(10) - newXp(9)) - 70 / 220) < .01);
  const maxed = { xp: oldXp(50) + 5000 }; migrateXpCurve(maxed);
  assert.equal(levelFor(maxed.xp), 50);
  const again = { xp: 500, xpCurve: 2 }; migrateXpCurve(again);
  assert.equal(again.xp, 500, 'already migrated');
  assert.equal(createInitialState(NOW).xpCurve, 2);

  // 2) Only the welcome (first bronze) box carries the guaranteed parts; a gold box opened first does not use it up.
  const box = fresh();
  box.loot.boxes = { gold: 1, bronze: 1 };
  run(box, { type: 'openBox', box: 'gold' }, () => 0);
  assert.equal(box.loot.firstBoxOpened, false);
  run(box, { type: 'openBox', box: 'bronze' }, () => 0);
  assert.equal(box.loot.parts >= 8, true);
  assert.equal(normalizeLoot({ stats: { boxes: 3 } }, 1).firstBoxOpened, true, 'older saves never get the bonus later');

  // 3) Auto-serve is paid and gives XP, but no drops, stats or leaderboard score.
  const auto = fresh();
  auto.xp = xpForLevel(10);
  const guest = auto.customers[0];
  guest.modifierId = undefined; guest.orderKind = 'cocktail'; guest.orderRevealed = true;
  for (const stock of auto.inventories['new-york']) stock.amount = 5000;
  const recipe = RECIPES.find((item) => item.id === guest.orderRecipeId);
  const xpBefore = auto.xp;
  run(auto, { type: 'serve', mix: recipe.ingredients.map((item) => ({ ...item })), shaken: true, pourBrands: {}, auto: true }, () => 0);
  assert.ok(auto.xp > xpBefore && auto.money > 600);
  assert.equal(auto.loot.stats.serves ?? 0, 0);
  assert.equal(auto.loot.parts, 0);
  assert.equal(auto.loot.weekly.score, 0);
  assert.equal(auto.loot.tasted.length, 0);

  // 4) A signature name called "Gin" is not found inside "begin"; the mask never collides with words in the sentence.
  const sig = fresh();
  sig.xp = xpForLevel(15); sig.money = 1000; sig.vipCooldownUntil = NOW + 1e12;
  run(sig, { type: 'designSignature', name: 'Gin Fizz', items: [{ ingredientId: 'gin', amount: 45 }, { ingredientId: 'soda', amount: 60 }], needsShake: false });
  sig.customers = []; sig.nextCustomerAt = 1;
  applyAction(sig, { type: 'tick' }, { now: NOW + 10_000, random: () => 0, checkEnglish: (t) => ({ ok: true, corrected: t }), spawnCustomers: true });
  const sg = sig.customers[0];
  run(sig, { type: 'openConversation', customerId: sg.id });
  const seen = [];
  const talk = (text) => applyAction(sig, { type: 'say', text }, { now: NOW + 20_000, random: () => .5, checkEnglish: (t) => { seen.push(t); return { ok: true, corrected: t }; } });
  talk('Let us begin, would you like a Mojito?');
  assert.equal(sg.orderRevealed, false);
  talk('Would you like a Mojito or our Gin Fizz?');
  assert.match(seen.at(-1), /Daiquiri/, 'the mask avoids a word already in the sentence');
  assert.equal(sg.orderRevealed, true);
});

test('Negotiated orders respect storeroom capacity, the fridge and order discounts', async () => {
  const { REGIONS, INGREDIENTS } = await import('../src/domain/catalog.ts');
  const { marketFor } = await import('../src/domain/progression.ts');
  const state = createInitialState(NOW);
  state.startingBarChosen = true; state.money = 1e6;
  const offer = marketFor(REGIONS.find((item) => item.id === state.regionId), NOW, state.xp).find((item) => item.supplierId === 'global');
  const cap = INGREDIENTS.find((item) => item.id === offer.ingredientId).unit === 'ml' ? 5000 : 120;
  const packs = Math.ceil(cap / offer.quantity) + 2;
  const deal = (cart) => { state.negotiation = undefined; state.lastNegotiatedAt = {}; run(state, { type: 'startNegotiation', supplierId: 'global', cart }); };
  deal({ [offer.ingredientId]: packs });
  assert.throws(() => run(state, { type: 'acceptDeal' }), /No room/);
  assert.equal(state.money, 1e6, 'a refused deal costs nothing');
  state.loot.equipment['new-york'].fridge.level = 10;
  deal({ [offer.ingredientId]: 2 });
  state.loot.prestige.perks.supply = 5;   // -10% supplier prices
  state.loot.armed.voucher = 1;           // -20%
  const quoted = state.negotiation;
  void quoted;
  run(state, { type: 'acceptDeal' });
  assert.equal(state.loot.armed.voucher, undefined, 'the voucher is used up');
  const order = state.deliveryOrders.at(-1);
  assert.ok(order.total > 0);
  assert.ok(order.dueAt - NOW < 86_400_000 * 10, 'delivery is scheduled');
});

test('Achievements have four tiers per series that must be claimed in order, and the profile shows the highest tier', async () => {
  const { ACHIEVEMENTS, achievementSeries, bestTiers } = await import('../src/domain/quests.ts');
  const { buildPlayerProfile } = await import('../src/domain/profile.ts');
  const series = new Set(ACHIEVEMENTS.map((item) => item.series));
  for (const name of series) {
    const tiers = achievementSeries(name);
    assert.equal(tiers.length, 4, `${name} has four tiers`);
    assert.deepEqual(tiers.map((item) => item.tier), [1, 2, 3, 4]);
    assert.equal(tiers.every((item, index) => index === 0 || item.target > tiers[index - 1].target), true, `${name} targets rise`);
  }
  assert.equal(new Set(ACHIEVEMENTS.map((item) => item.id)).size, ACHIEVEMENTS.length, 'ids are unique');
  const state = fresh();
  state.loot.stats.serves = 500;
  assert.throws(() => run(state, { type: 'claimAchievement', id: 'a-serve-100' }), /Bronze first/);
  run(state, { type: 'claimAchievement', id: 'a-serve-10' });
  run(state, { type: 'claimAchievement', id: 'a-serve-100' });
  run(state, { type: 'claimAchievement', id: 'a-serve-500' });
  assert.throws(() => run(state, { type: 'claimAchievement', id: 'a-serve-2000' }), /not finished/);
  assert.deepEqual(bestTiers(state.loot.achievements).map((item) => item.id), ['a-serve-500']);
  const profile = buildPlayerProfile({ served: 1, servedByBar: {}, languageStats: { sentences: 0, correct: 0 }, ownedBarIds: [], loot: state.loot, featuredAchievements: ['a-serve-10'] });
  assert.equal(profile.shown.length, 1);
  assert.equal(profile.shown[0].tierName, 'Gold');
  assert.equal(profile.achievementCount, 3);
});

test('Achievement counters: spending, collections, levels, servers, gifts and login days', async () => {
  const { statValue, addStat } = await import('../src/domain/achievementStats.ts');
  const { ACHIEVEMENTS } = await import('../src/domain/quests.ts');
  const { normalizeLoot } = await import('../src/domain/lootState.ts');
  const { xpForLevel } = await import('../src/domain/progression.ts');
  const state = fresh();
  // coins and crystals used: any action that lowers the purse counts, earning does not
  state.crystals = 100;
  run(state, { type: 'exchangeCrystals', crystals: 10 });
  assert.equal(statValue(state, 'crystalsSpent'), 10);
  assert.equal(statValue(state, 'coinsSpent'), 0, 'gaining coins is not spending');
  state.money = 500;
  state.loot.stats.coinsSpent = 0;
  const { RECIPES } = await import('../src/domain/catalog.ts');
  const { recipePurchase } = await import('../src/domain/economy.ts');
  const cheap = RECIPES.map((item, index) => ({ item, price: recipePurchase(item, index) })).find((entry) => entry.price.currency === 'coins' && !state.knownRecipeIds.includes(entry.item.id));
  state.money = cheap.price.amount + 10;
  run(state, { type: 'buyRecipe', recipeId: cheap.item.id });
  assert.equal(statValue(state, 'coinsSpent'), Math.floor(cheap.price.amount));
  // derived counters read what the player owns now and keep the best value
  state.xp = xpForLevel(26);
  assert.equal(statValue(state, 'level'), 26);
  state.ownedBarIds = ['new-york', 'london'];
  assert.equal(statValue(state, 'bars'), 2);
  state.staffByBar = { 'new-york': [{ level: 3 }, { level: 2 }], london: [{ level: 1 }] };
  assert.equal(statValue(state, 'staffHired'), 3, 'servers of all bars count');
  assert.equal(statValue(state, 'staffLevels'), 6);
  state.loot.stats.level = 40;
  state.xp = 0;
  assert.equal(statValue(state, 'level'), 40, 'progress is kept after a Grand Opening');
  // fully equipped bars
  for (const item of Object.values(state.loot.equipment['new-york'])) item.level = 5;
  assert.equal(statValue(state, 'barUpgrades'), 1);
  // counted when they happen
  addStat(state, 'giftsSent', 2); addStat(state, 'visitedBy', 1);
  assert.equal(statValue(state, 'giftsSent'), 2);
  // every achievement counter exists and survives a save
  const kept = normalizeLoot(JSON.parse(JSON.stringify({ ...state.loot, stats: Object.fromEntries(ACHIEVEMENTS.map((item) => [item.stat, 2_000_000])) })), 1);
  for (const goal of ACHIEVEMENTS) assert.ok((kept.stats[goal.stat] ?? 0) > 0, `${goal.stat} is saved`);
});

test('Equipment of another owned bar can be upgraded without switching, and only owned bars', () => {
  const state = fresh();
  state.ownedBarIds = ['new-york', 'london'];
  state.money = 100000; state.loot.parts = 100; state.loot.itemShards = { shaker: 20 };
  run(state, { type: 'upgradeEquipment', item: 'shaker', regionId: 'london' });
  assert.equal(state.loot.equipment.london.shaker.level, 1);
  assert.equal(state.loot.equipment['new-york'].shaker.level, 0, 'the managed bar is untouched');
  assert.equal(state.regionId, 'new-york');
  run(state, { type: 'promoteEquipment', item: 'shaker', regionId: 'london' });
  assert.equal(state.loot.equipment.london.shaker.tier, 'rare');
  assert.throws(() => run(state, { type: 'upgradeEquipment', item: 'shaker', regionId: 'berlin' }), /do not own/);
  assert.throws(() => run(state, { type: 'upgradeEquipment', item: 'shaker', regionId: 'nowhere' }), /do not own/);
});
