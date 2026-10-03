import test from 'node:test';
import assert from 'node:assert/strict';
import { BOX_TABLES } from '../src/domain/loot.ts';
import { COSMETICS, DRAWABLE_COSMETICS, canUseCosmetic, interiorForCosmetic } from '../src/domain/cosmetics.ts';
import { INTERIORS, isEventInterior } from '../src/data/cosmetics/bars.ts';
import { bartenderCostumesFor } from '../src/data/cosmetics/bartenderCostumes.ts';
import { ACHIEVEMENT_STYLES, BASIC_COSTUMES, BOX_STYLE_CHANCE, INTERIOR_STYLE, SHOP_STYLES, STYLE_PIECES_TO_CRAFT, STYLE_SHOP_PRICE, styleSource } from '../src/data/cosmetics/styleSources.ts';
import { ACHIEVEMENTS } from '../src/domain/quests.ts';
import { applyAction } from '../src/sim/rules.ts';
import { boxStyles, claimAchievement, grantCosmetic, grantReward, shardStyles } from '../src/sim/loot.ts';
import { createInitialState, normalizePlayerState } from '../src/sim/state.ts';

const NOW = new Date(2026, 8, 30, 12).getTime();
const context = (random = () => .5) => ({ now: NOW, random, checkEnglish: (text) => ({ ok: true, corrected: text }) });
const fresh = () => { const state = createInitialState(NOW); state.startingBarChosen = true; state.loot.boxes = {}; return state; };
const id = (character, value) => `bartender:${value}:${character}`;

test('Painted costumes remain locked until earned', () => {
  for (const character of ['noa', 'leo']) {
    const open = bartenderCostumesFor(character).filter((costume) => canUseCosmetic([], 'bartender', costume.value, character));
    assert.deepEqual(open.map((costume) => costume.value).sort(), [...BASIC_COSTUMES[character]].sort());
    assert.equal(BASIC_COSTUMES[character].length, 0);
  }
});

test('Each background has exactly one connected style, and the table only names real styles and backgrounds', () => {
  const styles = Object.values(INTERIOR_STYLE).map((style) => id(style.character, style.value));
  assert.equal(new Set(styles).size, styles.length, 'a style is connected to at most one background');
  for (const [interiorId, style] of Object.entries(INTERIOR_STYLE)) {
    assert.ok(INTERIORS.some((item) => item.id === interiorId), interiorId);
    assert.ok(bartenderCostumesFor(style.character).some((costume) => costume.value === style.value), `${interiorId}: ${style.value}`);
    assert.equal(interiorForCosmetic(id(style.character, style.value)), interiorId);
    assert.notEqual(styleSource(style.character, style.value), 'basic', 'basic styles carry no background');
  }
  assert.equal(INTERIOR_STYLE.velvet, undefined, 'the starting background has no style');
  assert.ok(Object.keys(INTERIOR_STYLE).length <= INTERIORS.length - 1, 'some newer backgrounds may have no style');
});

test('Achievement style pairs name real achievements and real styles', () => {
  for (const goalId of Object.keys(ACHIEVEMENT_STYLES)) assert.ok(ACHIEVEMENTS.some((goal) => goal.id === goalId), goalId);
  for (const pair of Object.values(ACHIEVEMENT_STYLES)) for (const character of ['noa', 'leo']) {
    assert.ok(COSMETICS.some((item) => item.id === id(character, pair[character])), pair[character]);
  }
});

test('Getting a style gives its matching background, once', () => {
  const state = fresh();
  const text = grantCosmetic(state, id('noa', 'reference-sakura'));
  assert.ok(state.ownedCosmeticIds.includes(id('noa', 'reference-sakura')));
  assert.ok(state.ownedInteriorIds.includes('izakaya'));
  assert.match(text, /Lantern izakaya/);
  assert.equal(grantCosmetic(state, id('noa', 'reference-sakura')), '');
});

test('Only a short list of unconnected styles is sold; background, achievement, box and basic styles cannot be bought', () => {
  const shop = Object.values(SHOP_STYLES).flat();
  assert.ok(shop.length >= 10 && shop.length <= 12, `${shop.length} styles in the shop`);
  const state = fresh();
  state.crystals = STYLE_SHOP_PRICE * 2;
  const bought = id('noa', 'reference-gothic');
  assert.equal(styleSource('noa', 'reference-gothic'), 'shop');
  applyAction(state, { type: 'buyStyle', cosmeticId: bought }, context());
  assert.equal(state.crystals, STYLE_SHOP_PRICE);
  assert.ok(state.ownedCosmeticIds.includes(bought));
  assert.deepEqual(state.ownedInteriorIds, ['velvet'], 'a shop style brings no background');
  assert.throws(() => applyAction(state, { type: 'buyStyle', cosmeticId: bought }, context()), /already own/);
  for (const cosmeticId of [id('noa', 'reference-flame'), id('leo', 'reference-denim'), id('noa', 'reference-biker'), id('leo', 'reference-final-5'), 'face:round']) {
    assert.throws(() => applyAction(state, { type: 'buyStyle', cosmeticId }, context()), /not for sale/, cosmeticId);
  }
  assert.throws(() => applyAction(fresh(), { type: 'buyStyle', cosmeticId: id('leo', 'reference-duelist') }, context()), /crystals/);
});

test('Backgrounds, achievements and the shop never share a style, and the rest belongs to boxes', () => {
  const sources = { basic: 0, background: 0, achievement: 0, shop: 0, box: 0 };
  for (const character of ['noa', 'leo']) for (const costume of bartenderCostumesFor(character)) sources[styleSource(character, costume.value)]++;
  assert.equal(sources.basic, 0);
  assert.equal(sources.background, Object.keys(INTERIOR_STYLE).length);
  assert.equal(sources.achievement, Object.keys(ACHIEVEMENT_STYLES).length * 2);
  assert.equal(sources.shop, Object.values(SHOP_STYLES).flat().length);
  assert.ok(sources.box > 20);
  assert.equal(boxStyles().length, sources.box);
});

test('Buying a background gives its one style with it', () => {
  const state = fresh();
  state.crystals = 5000;
  applyAction(state, { type: 'buyInterior', interiorId: 'desert' }, context());
  assert.ok(state.ownedInteriorIds.includes('desert'));
  assert.ok(state.ownedCosmeticIds.includes(id('noa', 'reference-desert')));
  assert.deepEqual(state.ownedCosmeticIds, [id('noa', 'reference-desert')], 'only the one connected style');
});

test('Box odds: 22% for one shard, bigger piles rarer, 0.5% for a whole style, and the extra drops are low-chance', () => {
  for (const kind of ['bronze', 'silver', 'gold']) {
    const table = BOX_TABLES[kind];
    const total = table.reduce((sum, entry) => sum + entry.weight, 0);
    const chance = (match) => table.filter((entry) => match(entry.make(1, () => .5))).reduce((sum, entry) => sum + entry.weight, 0) / total;
    assert.ok(Math.abs(chance((r) => r.kind === 'stylePieces' && r.amount === 1) - .22) < 1e-9, `${kind}: 1 shard`);
    for (const amount of [2, 5, 10, 25]) assert.ok(table.some((entry) => { const r = entry.make(1, () => .5); return r.kind === 'stylePieces' && r.amount === amount; }), `${kind}: ${amount} shards`);
    const piles = [1, 2, 5, 10, 25].map((amount) => chance((r) => r.kind === 'stylePieces' && r.amount === amount));
    assert.ok(piles.every((value, index) => index === 0 || value < piles[index - 1]), `${kind}: bigger piles are rarer`);
    assert.ok(Math.abs(chance((r) => r.kind === 'style') - BOX_STYLE_CHANCE) < 1e-9, `${kind}: whole style`);
    assert.ok(chance((r) => r.kind === 'xp') > 0, `${kind}: xp`);
  }
  for (const kind of ['silver', 'gold']) {
    const table = BOX_TABLES[kind];
    assert.ok(table.some((entry) => entry.make(1, () => .5).kind === 'prestige'), `${kind}: bar prestige`);
    const total = table.reduce((sum, entry) => sum + entry.weight, 0);
    const star = table.filter((entry) => entry.make(1, () => .5).kind === 'prestige').reduce((sum, entry) => sum + entry.weight, 0) / total;
    assert.ok(star < .02, `${kind}: bar prestiges are rare`);
  }
});

test('The new reward kinds are applied: XP, bar prestiges and shards', () => {
  const state = fresh();
  const xp = state.xp;
  grantReward(state, { kind: 'xp', amount: 250 }, () => .5);
  grantReward(state, { kind: 'prestige', amount: 1 }, () => .5);
  grantReward(state, { kind: 'stylePieces', amount: 25 }, () => .5);
  assert.equal(state.xp, xp + 250);
  assert.equal(state.popularity, 1);
  const piles = Object.entries(state.loot.styleShards);
  assert.equal(piles.length, 1, 'a drop is one pile for one style');
  assert.equal(piles[0][1], 25);
  assert.ok(shardStyles().some((item) => item.id === piles[0][0]) && !state.ownedCosmeticIds.includes(piles[0][0]), 'for a craftable style the player does not own');
});

test('50 style shards craft one full box style; fewer do not, and other styles cannot be crafted', () => {
  const state = fresh();
  const target = boxStyles()[0].id;
  const other = boxStyles()[1].id;
  state.loot.styleShards[target] = STYLE_PIECES_TO_CRAFT - 1;
  assert.throws(() => applyAction(state, { type: 'craftStyle', cosmeticId: target }, context()), /shards/);
  state.loot.styleShards = { [other]: STYLE_PIECES_TO_CRAFT + 9 };
  assert.throws(() => applyAction(state, { type: 'craftStyle', cosmeticId: target }, context()), /shards/, 'shards of another style do not count');
  state.loot.styleShards[target] = STYLE_PIECES_TO_CRAFT + 3;
  applyAction(state, { type: 'craftStyle', cosmeticId: target }, context());
  assert.equal(state.loot.styleShards[target], 3);
  assert.ok(state.ownedCosmeticIds.includes(target));
  assert.throws(() => applyAction(state, { type: 'craftStyle', cosmeticId: target }, context()), /already own/);
  state.loot.styleShards[id('noa', 'reference-sakura')] = STYLE_PIECES_TO_CRAFT;
  applyAction(state, { type: 'craftStyle', cosmeticId: id('noa', 'reference-sakura') }, context());   // an ordinary background's style
  assert.ok(state.ownedInteriorIds.includes('izakaya'), 'its background comes with it');
  assert.ok(shardStyles().every((item) => item.id !== id('noa', 'reference-flame')), 'event styles stay box-only');
  for (const cosmeticId of [id('noa', 'reference-flame'), id('noa', 'reference-biker'), id('noa', 'reference-gothic')]) {
    assert.throws(() => applyAction(state, { type: 'craftStyle', cosmeticId }, context()), /cannot be crafted/, cosmeticId);
  }
});

test('An old shared pool of style shards is split into piles for single styles when the save loads', () => {
  const state = fresh();
  state.loot.stylePieces = 23;
  const loaded = normalizePlayerState(JSON.parse(JSON.stringify(state)));
  assert.equal(loaded.loot.stylePieces, 0);
  const total = Object.values(loaded.loot.styleShards).reduce((sum, n) => sum + n, 0);
  assert.equal(total, 23, 'nothing is lost');
  assert.ok(Object.keys(loaded.loot.styleShards).every((key) => shardStyles().some((item) => item.id === key)));
});

test('Painted styles are not in the style draw, the roulette or skin-shard crafting', () => {
  assert.ok(DRAWABLE_COSMETICS.every((item) => !item.source));
  const state = fresh();
  state.loot.skinShards = 500;
  assert.throws(() => applyAction(state, { type: 'craftSkin', cosmeticId: id('noa', 'reference-final-8') }, context()), /Unknown style/);
});

test('Achievements give both bartenders their styles', () => {
  const state = fresh();
  state.loot.stats.serves = 500;
  for (const tier of ['a-serve-10', 'a-serve-100', 'a-serve-500']) claimAchievement(state, tier);
  assert.ok(state.ownedCosmeticIds.includes(id('noa', 'reference-final-67')));
  assert.ok(state.ownedCosmeticIds.includes(id('leo', 'reference-final-70')));
});

test('A box background brings its own style, and event backgrounds are only in boxes', () => {
  const state = fresh();
  grantReward(state, { kind: 'eventInterior' }, () => .5);   // the special-event background reward of Silver and Gold boxes
  const gained = state.ownedInteriorIds.filter((interiorId) => interiorId !== 'velvet');
  assert.equal(gained.length, 1);
  const style = INTERIOR_STYLE[gained[0]];
  assert.ok(state.ownedCosmeticIds.includes(id(style.character, style.value)), 'the background came with its style');
  const events = Object.keys(INTERIOR_STYLE).filter((interiorId) => isEventInterior(interiorId));
  for (const interiorId of events) assert.equal(styleSource(INTERIOR_STYLE[interiorId].character, INTERIOR_STYLE[interiorId].value), 'background');
});

test('A style someone is already wearing stays theirs after the update', () => {
  const state = fresh();
  state.bars[state.regionId].bartenderCharacter = 'noa';
  state.bars[state.regionId].bartender = 'reference-qipao';
  normalizePlayerState(state);
  assert.ok(state.ownedCosmeticIds.includes(id('noa', 'reference-qipao')));
});

test('A new bar starts with a few basic bottles only; premium and other labels are topped up with crystals', async () => {
  const { ALCOHOL_PRODUCTS, STARTER_BOTTLE_IDS, isPremiumBottle, bottleRestockCrystalCost } = await import('../src/domain/bottleCatalog.ts');
  const state = fresh();
  for (const shelf of Object.values(state.bottleInventories)) {
    const onShelf = shelf.filter((item) => item.quantity > 0).map((item) => item.productId).sort();
    assert.deepEqual(onShelf, [...STARTER_BOTTLE_IDS].sort());
    assert.ok(ALCOHOL_PRODUCTS.filter(isPremiumBottle).every((product) => (shelf.find((item) => item.productId === product.id)?.quantity ?? 0) === 0), 'no premium bottle at the start');
  }
  const premium = ALCOHOL_PRODUCTS.find((product) => product.id === 'moet-imperial');
  state.crystals = 500;
  applyAction(state, { type: 'buyBottleStock', productId: premium.id, quantity: 2 }, context());
  assert.equal(state.bottleInventories[state.regionId].find((item) => item.productId === premium.id).quantity, 2);
  assert.equal(state.crystals, 500 - bottleRestockCrystalCost(premium) * 2);
});

test('Economy: selling a topped-up bottle pays a small margin, and the themed backgrounds have graded prices', async () => {
  const { ALCOHOL_PRODUCTS, bottleRestockCrystalCost, bottleSaleCrystalReward } = await import('../src/domain/bottleCatalog.ts');
  for (const product of ALCOHOL_PRODUCTS) {
    const cost = bottleRestockCrystalCost(product);
    const reward = bottleSaleCrystalReward(product);
    assert.ok(reward > cost, product.id);
    assert.ok(reward <= Math.max(cost + 1, Math.ceil(cost * 1.5)), `${product.id}: margin stays small (${cost} -> ${reward})`);
  }
  const { THEMED_INTERIORS } = await import('../src/data/cosmetics/themedBars.ts');
  const prices = THEMED_INTERIORS.map((item) => INTERIORS.find((entry) => entry.id === item.id).crystalCost).sort((a, b) => a - b);
  assert.ok(prices[0] <= 600 && prices.at(-1) >= 1800, 'a cheap first tier up to the big ones');
  assert.equal(new Set(prices).size, prices.length, 'every themed background has its own price');
});

test('Daily wheel: three spins a day, a new day resets them, every segment can be granted, prizes stay small', async () => {
  const { WHEEL, ROULETTE_SPINS_PER_DAY, spinWheel, spinsLeft } = await import('../src/domain/roulette.ts');
  assert.equal(ROULETTE_SPINS_PER_DAY, 3);
  const state = fresh();
  assert.equal(spinsLeft(state.roulette, '2026-09-30'), 3);
  for (let spin = 1; spin <= 3; spin++) {
    applyAction(state, { type: 'spinRoulette' }, context(() => .3));
    assert.equal(state.roulette.spins, spin);
    assert.equal(state.roulette.last.n, spin);
    assert.ok(state.roulette.last.index >= 0 && state.roulette.last.index < WHEEL.length);
    assert.match(state.message, /^Wheel:/);
  }
  assert.throws(() => applyAction(state, { type: 'spinRoulette' }, context(() => .3)), /all 3 spins/);
  const tomorrow = { ...context(() => .3), now: NOW + 24 * 3600 * 1000 };
  applyAction(state, { type: 'spinRoulette' }, tomorrow);
  assert.equal(state.roulette.spins, 1, 'a new day starts again');
  // Every segment hands over something real.
  for (const [index, segment] of WHEEL.entries()) {
    const copy = fresh();
    const reward = segment.make(1, () => .5);
    assert.doesNotThrow(() => grantReward(copy, reward, () => .5), segment.id);
    assert.ok(WHEEL[index].weight > 0);
  }
  // The crystal prize is small: the average spin pays a couple of crystals at most.
  const total = WHEEL.reduce((sum, segment) => sum + segment.weight, 0);
  const crystals = WHEEL.reduce((sum, segment) => { const reward = segment.make(1, () => .5); return sum + (reward.kind === 'crystals' ? reward.amount * segment.weight / total : 0); }, 0);
  assert.ok(crystals > .5 && crystals < 3, `${crystals.toFixed(2)} crystals per spin`);
  // The same random numbers give the same spin (the server decides, the screen only animates).
  assert.deepEqual(spinWheel(5, () => .42), spinWheel(5, () => .42));
});

test('Circle shards drop from boxes for one person who has not joined, and become keepsakes once everyone has', async () => {
  const { COMPANIONS } = await import('../src/domain/companions.ts');
  for (const kind of ['bronze', 'silver', 'gold']) assert.ok(BOX_TABLES[kind].some((entry) => entry.make(1, () => .5).kind === 'companionShards'), kind);
  const state = fresh();
  const text = grantReward(state, { kind: 'companionShards', amount: 2 }, () => 0);
  const person = COMPANIONS.find((item) => (state.companions?.shards?.[item.id] ?? 0) > 0);
  assert.ok(person, 'one person got shards');
  assert.equal(state.companions.shards[person.id], 2);
  assert.ok(text.startsWith('2 shards of ') && text.includes(`(2 / ${person.shards})`), text);
  state.companions.owned = Object.fromEntries(COMPANIONS.map((item) => [item.id, 0]));
  assert.match(grantReward(state, { kind: 'companionShards', amount: 1 }, () => 0), /keepsake/);
  // The wheel and the boxes never push a person past the shards needed to join.
  const capped = fresh();
  for (let i = 0; i < 60; i++) grantReward(capped, { kind: 'companionShards', amount: 3 }, () => 0);
  assert.ok(COMPANIONS.every((item) => (capped.companions.shards[item.id] ?? 0) <= item.shards));
});
