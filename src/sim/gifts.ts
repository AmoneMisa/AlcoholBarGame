import { addStat } from '../domain/achievementStats';
import { buildPlayerProfile } from '../domain/profile';
import { RECIPES } from '../domain/catalog';
import { calendarDate, coins, recipePurchase } from '../domain/economy';
import { DUPLICATE_INTERIOR_SHARDS, INTERIORS, isEventInterior } from '../data/cosmetics/bars';
import { styleForInterior } from '../data/cosmetics/styleSources';
import { grantCosmetic } from './loot';
import { addSpareCopy, isStarterRecipe, recipeCopies, recipeLevel } from './recipes';
import { levelFor, type PlayerState } from './state';
import { COSMETICS } from '../domain/cosmetics';
import { consumableDef } from '../domain/loot';

// Gifts between friends and visits to a friend's bar. The sender pays when a gift is sent; the receiver's game
// changes only when they claim it. Both steps run on the server.

export class GiftError extends Error {}

export type GiftRequest =
  | { kind: 'recipe'; recipeId: string }        // buy a recipe card for a friend
  | { kind: 'recipe-copy'; recipeId: string }   // give one of your spare recipe cards
  | { kind: 'interior'; interiorId: string }    // buy a bar background for a friend
  | { kind: 'cosmetic-copy'; cosmeticId: string }
  | { kind: 'consumable'; id: string }           // one consumable from your Workshop stock
  | { kind: 'skin-shards'; amount: number }     // 5, 10 or 20 skin shards
  // Things that only boxes give move from one player to the other: the sender loses them, the receiver gets them.
  // Only what the sender really has, and (for whole items) only what is not in use in any of their bars.
  | { kind: 'style-shards'; amount: number }    // 5, 10 or 25 style shards
  | { kind: 'style-transfer'; cosmeticId: string }       // a whole box style
  | { kind: 'interior-transfer'; interiorId: string };   // a box-only background, together with its connected style
export const SHARD_GIFT_AMOUNTS = [5, 10, 20] as const;
export const STYLE_SHARD_GIFT_AMOUNTS = [5, 10, 25] as const;
// Anti-abuse: gifts of Workshop items are limited per day, and only move items that already exist.
export const LOOT_GIFTS_PER_DAY = 5;
export type Gift = GiftRequest;


// What sending costs, for the gift screen and the rules.
export function giftPrice(gift: GiftRequest) {
  if (gift.kind === 'recipe-copy') return { currency: 'card' as const, amount: 1 };
  if (gift.kind === 'consumable') return { currency: 'item' as const, amount: 1 };
  if (gift.kind === 'skin-shards') return { currency: 'shards' as const, amount: gift.amount };
  if (gift.kind === 'cosmetic-copy') return { currency:'cosmetic' as const,amount:1 };
  if (gift.kind === 'style-shards') return { currency: 'shards' as const, amount: gift.amount };
  if (gift.kind === 'style-transfer' || gift.kind === 'interior-transfer') return { currency: 'item' as const, amount: 1 };
  if (gift.kind === 'recipe') {
    const recipe = RECIPES.find((item) => item.id === gift.recipeId);
    return recipe ? recipePurchase(recipe, RECIPES.indexOf(recipe)) : undefined;
  }
  const interior = INTERIORS.find((item) => item.id === gift.interiorId);
  return interior && interior.crystalCost > 0 && !isEventInterior(interior.id) ? { currency: 'crystals' as const, amount: interior.crystalCost } : undefined;
}

// Validates a gift request and takes its price from the sender. Returns the clean gift to store.
export function payForGift(state: PlayerState, request: unknown, now = Date.now()): Gift {
  const gift = request as Partial<GiftRequest> | undefined;
  if (!gift || typeof gift !== 'object') throw new GiftError('Choose a gift.');
  if (gift.kind === 'style-shards' || gift.kind === 'style-transfer' || gift.kind === 'interior-transfer') return payForTransfer(state, gift as { kind?: string; amount?: number; cosmeticId?: string; interiorId?: string }, now);
  if (gift.kind === 'consumable' || gift.kind === 'skin-shards') {
    const today = calendarDate(new Date(now));
    const sent = state.loot.giftsSent?.day === today ? state.loot.giftsSent.count : 0;
    if (sent >= LOOT_GIFTS_PER_DAY) throw new GiftError(`You can send ${LOOT_GIFTS_PER_DAY} Workshop gifts per day.`);
    let clean: Gift;
    if (gift.kind === 'consumable') {
      const item = consumableDef(String(gift.id));
      if (!item) throw new GiftError('Unknown item.');
      if ((state.loot.consumables[item.id] ?? 0) < 1) throw new GiftError(`You have no ${item.name}.`);
      state.loot.consumables[item.id] = (state.loot.consumables[item.id] ?? 0) - 1;
      if (state.loot.consumables[item.id]! <= 0) delete state.loot.consumables[item.id];
      clean = { kind: 'consumable', id: item.id };
    } else {
      const amount = (SHARD_GIFT_AMOUNTS as readonly number[]).find((value) => value === (gift as { amount?: number }).amount);
      if (!amount) throw new GiftError('Send 5, 10 or 20 skin shards.');
      if (state.loot.skinShards < amount) throw new GiftError(`You need ${amount} skin shards.`);
      state.loot.skinShards -= amount;
      clean = { kind: 'skin-shards', amount };
    }
    state.loot.giftsSent = { day: today, count: sent + 1 };
    return clean;
  }
  if (gift.kind === 'cosmetic-copy') {
    const cosmetic = COSMETICS.find((item) => item.id === gift.cosmeticId);
    if (!cosmetic) throw new GiftError('Unknown cosmetic item.');
    if ((state.cosmeticCopies[cosmetic.id] ?? 0) < 1) throw new GiftError(`You have no spare ${cosmetic.label}.`);
    state.cosmeticCopies[cosmetic.id] = (state.cosmeticCopies[cosmetic.id] ?? 0) - 1;
    return { kind:'cosmetic-copy',cosmeticId:cosmetic.id };
  }
  if (gift.kind === 'recipe' || gift.kind === 'recipe-copy') {
    const recipe = RECIPES.find((item) => item.id === gift.recipeId);
    if (!recipe) throw new GiftError('Unknown recipe.');
    if (isStarterRecipe(recipe.id)) throw new GiftError('Starter recipes cannot be gifted — every bar already has them.');
    if (gift.kind === 'recipe-copy') {
      if (recipeCopies(state, recipe.id) < 1) throw new GiftError(`You have no spare ${recipe.name} card.`);
      state.recipeCopies = { ...(state.recipeCopies ?? {}), [recipe.id]: recipeCopies(state, recipe.id) - 1 };
      return { kind: 'recipe-copy', recipeId: recipe.id };
    }
    const price = recipePurchase(recipe, RECIPES.indexOf(recipe));
    charge(state, price.currency, price.amount);
    return { kind: 'recipe', recipeId: recipe.id };
  }
  if (gift.kind === 'interior') {
    const price = giftPrice({ kind: 'interior', interiorId: String(gift.interiorId) });
    if (!price) throw new GiftError('This background cannot be gifted.');
    charge(state, 'crystals', price.amount);
    return { kind: 'interior', interiorId: String(gift.interiorId) };
  }
  throw new GiftError('Choose a gift.');
}

// ---- Transfers: style shards, whole box styles and box-only backgrounds ----
/** A style is in use when one of the player's bars has that bartender wearing it. */
export const styleInUse = (state: PlayerState, cosmeticId: string) => {
  const item = COSMETICS.find((entry) => entry.id === cosmeticId);
  return !!item && Object.values(state.bars).some((bar) => bar.bartender === item.value && (bar.bartenderCharacter ?? 'noa') === item.character);
};
export const interiorInUse = (state: PlayerState, interiorId: string) => Object.values(state.bars).some((bar) => bar.interior === interiorId);
const connectedStyleId = (interiorId: string) => { const linked = styleForInterior(interiorId); return linked ? `bartender:${linked.value}:${linked.character}` : ''; };
/** The whole box styles a player may give away right now: owned and not worn in any bar. */
export const giftableStyles = (state: PlayerState) => COSMETICS.filter((item) => item.source === 'box' && state.ownedCosmeticIds.includes(item.id) && !styleInUse(state, item.id));
/** The box-only backgrounds a player may give away right now: owned, not used by any bar, and their connected style not worn. */
export const giftableInteriors = (state: PlayerState) => INTERIORS.filter((item) => isEventInterior(item.id) && state.ownedInteriorIds.includes(item.id)
  && !interiorInUse(state, item.id) && !(connectedStyleId(item.id) && styleInUse(state, connectedStyleId(item.id))));

function payForTransfer(state: PlayerState, gift: { kind?: string; amount?: number; cosmeticId?: string; interiorId?: string }, now: number): Gift {
  const today = calendarDate(new Date(now));
  const sent = state.loot.giftsSent?.day === today ? state.loot.giftsSent.count : 0;
  if (sent >= LOOT_GIFTS_PER_DAY) throw new GiftError(`You can send ${LOOT_GIFTS_PER_DAY} Workshop gifts per day.`);
  let clean: Gift;
  if (gift.kind === 'style-shards') {
    const amount = (STYLE_SHARD_GIFT_AMOUNTS as readonly number[]).find((value) => value === gift.amount);
    if (!amount) throw new GiftError('Send 5, 10 or 25 style shards.');
    if (state.loot.stylePieces < amount) throw new GiftError(`You need ${amount} style shards.`);
    state.loot.stylePieces -= amount;
    clean = { kind: 'style-shards', amount };
  } else if (gift.kind === 'style-transfer') {
    const item = COSMETICS.find((entry) => entry.id === gift.cosmeticId);
    if (!item || item.source !== 'box') throw new GiftError('This style cannot be gifted.');
    if (!state.ownedCosmeticIds.includes(item.id)) throw new GiftError(`You do not have ${item.label}.`);
    if (styleInUse(state, item.id)) throw new GiftError(`${item.label} is being worn in one of your bars. Change the outfit first.`);
    state.ownedCosmeticIds = state.ownedCosmeticIds.filter((id) => id !== item.id);
    clean = { kind: 'style-transfer', cosmeticId: item.id };
  } else {
    const interior = INTERIORS.find((entry) => entry.id === gift.interiorId);
    if (!interior || !isEventInterior(interior.id)) throw new GiftError('This background cannot be gifted.');
    if (!state.ownedInteriorIds.includes(interior.id)) throw new GiftError(`You do not have ${interior.name}.`);
    if (interiorInUse(state, interior.id)) throw new GiftError(`${interior.name} is used by one of your bars. Choose another background first.`);
    const styleId = connectedStyleId(interior.id);
    if (styleId && styleInUse(state, styleId)) throw new GiftError('Its connected style is being worn in one of your bars. Change the outfit first.');
    state.ownedInteriorIds = state.ownedInteriorIds.filter((id) => id !== interior.id);
    if (styleId) state.ownedCosmeticIds = state.ownedCosmeticIds.filter((id) => id !== styleId);   // the pair moves together
    clean = { kind: 'interior-transfer', interiorId: interior.id };
  }
  state.loot.giftsSent = { day: today, count: sent + 1 };
  return clean;
}

function charge(state: PlayerState, currency: 'coins' | 'crystals', amount: number) {
  if (currency === 'coins') {
    if (state.money < amount) throw new GiftError(`You need ${amount} coins.`);
    state.money = coins(state.money - amount);
  } else {
    if (state.crystals < amount) throw new GiftError(`You need ${amount} crystals.`);
    state.crystals -= amount;
  }
}

// Applies a claimed gift to the receiver. Something they already have becomes a spare card or a crystal refund.
export function receiveGift(state: PlayerState, gift: Gift, from: string) {
  addStat(state, 'giftsGot', 1);
  if (gift.kind === 'consumable') {
    const item = consumableDef(gift.id);
    if (!item) return `${from}'s gift could not be opened.`;
    state.loot.consumables[item.id] = (state.loot.consumables[item.id] ?? 0) + 1;
    return `${from} gave you a ${item.name}!`;
  }
  if (gift.kind === 'skin-shards') {
    const amount = (SHARD_GIFT_AMOUNTS as readonly number[]).includes(gift.amount) ? gift.amount : 0;
    if (!amount) return `${from}'s gift could not be opened.`;
    state.loot.skinShards += amount;
    return `${from} gave you ${amount} skin shards!`;
  }
  if (gift.kind === 'style-shards') {
    const amount = (STYLE_SHARD_GIFT_AMOUNTS as readonly number[]).includes(gift.amount) ? gift.amount : 0;
    if (!amount) return `${from}'s gift could not be opened.`;
    state.loot.stylePieces += amount;
    return `${from} gave you ${amount} style shards!`;
  }
  if (gift.kind === 'style-transfer') {
    const item = COSMETICS.find((entry) => entry.id === gift.cosmeticId);
    if (!item || item.source !== 'box') return `${from}'s gift could not be opened.`;
    if (state.ownedCosmeticIds.includes(item.id)) {
      state.cosmeticCopies[item.id] = (state.cosmeticCopies[item.id] ?? 0) + 1;
      return `You already own ${item.label}: ${from}'s gift is now a spare you can send on.`;
    }
    state.ownedCosmeticIds.push(item.id);
    return `${from} gave you the ${item.label} style!`;
  }
  if (gift.kind === 'interior-transfer') {
    const interior = INTERIORS.find((entry) => entry.id === gift.interiorId);
    if (!interior || !isEventInterior(interior.id)) return `${from}'s gift could not be opened.`;
    if (state.ownedInteriorIds.includes(interior.id)) {
      state.loot.skinShards += DUPLICATE_INTERIOR_SHARDS;
      return `You already have ${interior.name}, so ${from}'s gift became ${DUPLICATE_INTERIOR_SHARDS} skin shards.`;
    }
    state.ownedInteriorIds.push(interior.id);
    const styleId = connectedStyleId(interior.id);
    if (styleId) grantCosmetic(state, styleId);   // the background brings its connected style
    return `${from} gave you the ${interior.name} background and its style!`;
  }
  if (gift.kind === 'cosmetic-copy') {
    const cosmetic = COSMETICS.find((item) => item.id === gift.cosmeticId);
    if (!cosmetic) return `${from}'s cosmetic gift could not be opened.`;
    if (state.ownedCosmeticIds.includes(cosmetic.id)) {
      state.cosmeticCopies[cosmetic.id] = (state.cosmeticCopies[cosmetic.id] ?? 0) + 1;
      return `You already own ${cosmetic.label}: ${from}'s gift is now a spare you can send on.`;
    }
    state.ownedCosmeticIds.push(cosmetic.id);
    return `${from} gave you the ${cosmetic.label} style!`;
  }
  if (gift.kind === 'interior') {
    const interior = INTERIORS.find((item) => item.id === gift.interiorId);
    if (!interior) return `${from}'s gift could not be opened.`;
    if (state.ownedInteriorIds.includes(interior.id)) {
      state.crystals += interior.crystalCost;
      return `You already have ${interior.name}, so ${from}'s gift became ${interior.crystalCost} crystals.`;
    }
    state.ownedInteriorIds.push(interior.id);
    return `${from} gave you the ${interior.name} background!`;
  }
  const recipe = RECIPES.find((item) => item.id === gift.recipeId);
  if (!recipe) return `${from}'s gift could not be opened.`;
  if (state.knownRecipeIds.includes(recipe.id)) {
    addSpareCopy(state, recipe.id);
    return `You already know ${recipe.name}: ${from}'s card is now a spare you can gift on.`;
  }
  state.knownRecipeIds.push(recipe.id);
  state.recipeUnlockSources[recipe.id] = 'friend-gift';
  return `${from} gave you the ${recipe.name} recipe!`;
}

// One visit reward per friend per day.
// What a visitor may see of a friend's bar.
export function publicBar(state: PlayerState, name: string) {
  const bar = state.bars[state.regionId];
  const mastered = state.knownRecipeIds.map((id) => ({ id, level: recipeLevel(state, id) })).filter((item) => item.level > 1)
    .sort((a, b) => b.level - a.level).slice(0, 3)
    .map((item) => ({ name: RECIPES.find((recipe) => recipe.id === item.id)?.name ?? item.id, level: item.level }));
  return {
    name, level: levelFor(state.xp), regionId: state.regionId, bar, profile: buildPlayerProfile(state),
    recipes: state.knownRecipeIds.length, interiors: state.ownedInteriorIds.length, mastered,
    knownRecipeIds: state.knownRecipeIds.filter((id) => !isStarterRecipe(id)), ownedInteriorIds: state.ownedInteriorIds
  };
}
