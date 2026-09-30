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
const run = (state, action, random) => applyAction(state, action, context(random));
const fresh = () => { const state = createInitialState(NOW); state.startingBarChosen = true; return state; };

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
  state.loot.boxes = { bronze: 1, choice: 1 };
  run(state, { type: 'openBox', box: 'bronze' }, () => 0);
  assert.equal(state.loot.parts, 3);
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
  const serve = (armed) => {
    const state = fresh();
    if (armed) state.loot.armed['golden-ice'] = 1;
    const guest = state.customers[0];
    guest.modifierId = undefined;
    guest.orderKind = 'cocktail';
    guest.orderRevealed = true;
    const recipe = RECIPES.find((item) => item.id === guest.orderRecipeId);
    for (const stock of state.inventories['new-york']) stock.amount = 5000;
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
