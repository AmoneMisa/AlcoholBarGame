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

test('Only three painted styles per bartender are open from the start', () => {
  for (const character of ['noa', 'leo']) {
    const open = bartenderCostumesFor(character).filter((costume) => canUseCosmetic([], 'bartender', costume.value, character));
    assert.deepEqual(open.map((costume) => costume.value).sort(), [...BASIC_COSTUMES[character]].sort());
    assert.equal(BASIC_COSTUMES[character].length, 3);
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
  for (const cosmeticId of [id('noa', 'reference-flame'), id('leo', 'reference-denim'), id('noa', 'reference-biker'), id('leo', 'reference-final-5'), id('noa', 'reference-streetwear'), 'face:round']) {
    assert.throws(() => applyAction(state, { type: 'buyStyle', cosmeticId }, context()), /not for sale/, cosmeticId);
  }
  assert.throws(() => applyAction(fresh(), { type: 'buyStyle', cosmeticId: id('leo', 'reference-duelist') }, context()), /crystals/);
});

test('Backgrounds, achievements and the shop never share a style, and the rest belongs to boxes', () => {
  const sources = { basic: 0, background: 0, achievement: 0, shop: 0, box: 0 };
  for (const character of ['noa', 'leo']) for (const costume of bartenderCostumesFor(character)) sources[styleSource(character, costume.value)]++;
  assert.equal(sources.basic, 6);
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
  assert.equal(state.loot.stylePieces, 25);
});

test('50 style shards craft one full box style; fewer do not, and other styles cannot be crafted', () => {
  const state = fresh();
  const target = boxStyles()[0].id;
  state.loot.stylePieces = STYLE_PIECES_TO_CRAFT - 1;
  assert.throws(() => applyAction(state, { type: 'craftStyle', cosmeticId: target }, context()), /style shards/);
  state.loot.stylePieces = STYLE_PIECES_TO_CRAFT + 3;
  applyAction(state, { type: 'craftStyle', cosmeticId: target }, context());
  assert.equal(state.loot.stylePieces, 3);
  assert.ok(state.ownedCosmeticIds.includes(target));
  assert.throws(() => applyAction(state, { type: 'craftStyle', cosmeticId: target }, context()), /already own/);
  state.loot.stylePieces = STYLE_PIECES_TO_CRAFT;
  applyAction(state, { type: 'craftStyle', cosmeticId: id('noa', 'reference-sakura') }, context());   // an ordinary background's style
  assert.ok(state.ownedInteriorIds.includes('izakaya'), 'its background comes with it');
  assert.ok(shardStyles().every((item) => item.id !== id('noa', 'reference-flame')), 'event styles stay box-only');
  state.loot.stylePieces = 200;
  for (const cosmeticId of [id('noa', 'reference-flame'), id('noa', 'reference-biker'), id('noa', 'reference-gothic'), id('noa', 'reference-streetwear')]) {
    assert.throws(() => applyAction(state, { type: 'craftStyle', cosmeticId }, context()), /cannot be crafted/, cosmeticId);
  }
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
  const gained = state.ownedInteriorIds.filter((interiorId) => isEventInterior(interiorId));
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
