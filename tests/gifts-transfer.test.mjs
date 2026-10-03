import test from 'node:test';
import assert from 'node:assert/strict';
import { COSMETICS } from '../src/domain/cosmetics.ts';
import { BOX_ONLY_GAME_IDS, EVENT_INTERIOR_IDS } from '../src/data/cosmetics/bars.ts';
import { INTERIOR_STYLE } from '../src/data/cosmetics/styleSources.ts';
import { GiftError, LOOT_GIFTS_PER_DAY, giftableInteriors, giftableStyles, giftPrice, payForGift, receiveGift } from '../src/sim/gifts.ts';
import { grantCosmetic, shardStyles } from '../src/sim/loot.ts';
import { createInitialState } from '../src/sim/state.ts';

const NOW = new Date(2026, 8, 30, 12).getTime();
const fresh = () => { const state = createInitialState(NOW); state.startingBarChosen = true; return state; };
const styleId = (id) => `bartender:${INTERIOR_STYLE[id].value}:${INTERIOR_STYLE[id].character}`;
const boxStyle = (character = 'noa') => COSMETICS.find((item) => item.source === 'box' && item.character === character);

test('Style shards move from the sender to the friend: the sender must have them and loses them', () => {
  const sender = fresh();
  const style = shardStyles()[0].id, other = shardStyles()[1].id;
  sender.loot.styleShards[style] = 12;
  assert.throws(() => payForGift(sender, { kind: 'style-shards', cosmeticId: style, amount: 25 }, NOW), /need 25/);
  assert.throws(() => payForGift(sender, { kind: 'style-shards', cosmeticId: style, amount: 7 }, NOW), /5, 10 or 25/);
  assert.throws(() => payForGift(sender, { kind: 'style-shards', cosmeticId: other, amount: 5 }, NOW), /need 5/, 'only the pile of that style counts');
  assert.equal(sender.loot.styleShards[style], 12, 'a refused gift costs nothing');
  const gift = payForGift(sender, { kind: 'style-shards', cosmeticId: style, amount: 10 }, NOW);
  assert.equal(sender.loot.styleShards[style], 2, 'the sender loses them');
  const receiver = fresh();
  receiveGift(receiver, gift, 'Ana');
  assert.equal(receiver.loot.styleShards[style], 10, 'the friend gets the same style');
});

test('A whole box style moves too, but only if it is owned and not worn; a copy the friend already has becomes a spare', () => {
  const item = boxStyle();
  const sender = fresh();
  assert.throws(() => payForGift(sender, { kind: 'style-transfer', cosmeticId: item.id }, NOW), /do not have/);
  sender.ownedCosmeticIds.push(item.id);
  assert.deepEqual(giftableStyles(sender).map((entry) => entry.id), [item.id]);
  sender.bars[sender.regionId].bartenderCharacter = item.character;
  sender.bars[sender.regionId].bartender = item.value;
  assert.throws(() => payForGift(sender, { kind: 'style-transfer', cosmeticId: item.id }, NOW), /being worn/);
  assert.equal(giftableStyles(sender).length, 0, 'a worn style is not offered');
  sender.bars[sender.regionId].bartender = 'vest';
  const gift = payForGift(sender, { kind: 'style-transfer', cosmeticId: item.id }, NOW);
  assert.ok(!sender.ownedCosmeticIds.includes(item.id), 'the sender loses it');
  const receiver = fresh();
  receiveGift(receiver, gift, 'Ana');
  assert.ok(receiver.ownedCosmeticIds.includes(item.id), 'the friend gets it');
  const again = fresh();
  again.ownedCosmeticIds.push(item.id);
  receiveGift(again, gift, 'Ana');
  assert.equal(again.cosmeticCopies[item.id], 1, 'already owned: a spare copy');
});

test('Only box styles can be given this way, never shop, achievement, background-linked or starting styles', () => {
  const others = COSMETICS.filter((item) => item.source && item.source !== 'box').slice(0, 40);
  assert.ok(others.length > 10);
  for (const item of others) {
    const sender = fresh();
    sender.ownedCosmeticIds.push(item.id);
    assert.throws(() => payForGift(sender, { kind: 'style-transfer', cosmeticId: item.id }, NOW), /cannot be gifted/, item.id);
    assert.ok(sender.ownedCosmeticIds.includes(item.id), 'nothing was taken');
  }
  assert.throws(() => payForGift(fresh(), { kind: 'style-transfer', cosmeticId: 'face:round' }, NOW), GiftError);
});

test('A box-only background moves together with its connected style; the sender loses both, the friend gets both', () => {
  const id = BOX_ONLY_GAME_IDS[0];
  const sender = fresh();
  assert.throws(() => payForGift(sender, { kind: 'interior-transfer', interiorId: id }, NOW), /do not have/);
  grantCosmetic(sender, styleId(id));
  assert.ok(sender.ownedInteriorIds.includes(id) && sender.ownedCosmeticIds.includes(styleId(id)), 'the style brought the background');
  assert.deepEqual(giftableInteriors(sender).map((item) => item.id), [id]);
  const gift = payForGift(sender, { kind: 'interior-transfer', interiorId: id }, NOW);
  assert.ok(!sender.ownedInteriorIds.includes(id) && !sender.ownedCosmeticIds.includes(styleId(id)), 'the sender loses both');
  const receiver = fresh();
  receiveGift(receiver, gift, 'Ana');
  assert.ok(receiver.ownedInteriorIds.includes(id) && receiver.ownedCosmeticIds.includes(styleId(id)), 'the friend gets both');
  const owner = fresh();
  grantCosmetic(owner, styleId(id));
  const shards = owner.loot.skinShards;
  receiveGift(owner, gift, 'Ana');
  assert.ok(owner.loot.skinShards > shards, 'a background the friend already has becomes shards');
});

test('A background or style that is in use cannot be given away', () => {
  const id = EVENT_INTERIOR_IDS[0];
  const sender = fresh();
  grantCosmetic(sender, styleId(id));
  sender.bars[sender.regionId].interior = id;
  assert.throws(() => payForGift(sender, { kind: 'interior-transfer', interiorId: id }, NOW), /used by one of your bars/);
  sender.bars[sender.regionId].interior = 'velvet';
  const style = INTERIOR_STYLE[id];
  sender.bars[sender.regionId].bartenderCharacter = style.character;
  sender.bars[sender.regionId].bartender = style.value;
  assert.throws(() => payForGift(sender, { kind: 'interior-transfer', interiorId: id }, NOW), /connected style is being worn/);
  assert.ok(sender.ownedInteriorIds.includes(id) && sender.ownedCosmeticIds.includes(styleId(id)), 'nothing was taken');
  assert.equal(giftableInteriors(sender).length, 0);
});

test('Only box-only backgrounds can be given away; the ordinary ones and the priced gift for event ones stay as they were', () => {
  const sender = fresh();
  sender.ownedInteriorIds.push('garden');
  assert.throws(() => payForGift(sender, { kind: 'interior-transfer', interiorId: 'garden' }, NOW), /cannot be gifted/);
  assert.equal(giftPrice({ kind: 'interior', interiorId: EVENT_INTERIOR_IDS[0] }), undefined, 'an event background cannot be bought for a friend');
});

test('These gifts count towards the daily limit of Workshop gifts', () => {
  const sender = fresh();
  const style = shardStyles()[0].id;
  sender.loot.styleShards[style] = 5 * (LOOT_GIFTS_PER_DAY + 1);
  for (let i = 0; i < LOOT_GIFTS_PER_DAY; i++) payForGift(sender, { kind: 'style-shards', cosmeticId: style, amount: 5 }, NOW);
  assert.throws(() => payForGift(sender, { kind: 'style-shards', cosmeticId: style, amount: 5 }, NOW), /per day/);
  assert.equal(sender.loot.styleShards[style], 5, 'nothing is taken once the limit is reached');
});
