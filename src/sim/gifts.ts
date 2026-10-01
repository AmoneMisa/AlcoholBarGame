import { RECIPES } from '../domain/catalog';
import { coins, recipePurchase } from '../domain/economy';
import { INTERIORS } from '../data/cosmetics/bars';
import { addSpareCopy, isStarterRecipe, recipeCopies, recipeLevel } from './recipes';
import { levelFor, type PlayerState } from './state';
import { COSMETICS } from '../domain/cosmetics';

// Gifts between friends and visits to a friend's bar. The sender pays when a gift is sent; the receiver's game
// changes only when they claim it. Both steps run on the server.

export class GiftError extends Error {}

export type GiftRequest =
  | { kind: 'recipe'; recipeId: string }        // buy a recipe card for a friend
  | { kind: 'recipe-copy'; recipeId: string }   // give one of your spare recipe cards
  | { kind: 'interior'; interiorId: string }    // buy a bar background for a friend
  | { kind: 'cosmetic-copy'; cosmeticId: string };
export type Gift = GiftRequest;

// What sending costs, for the gift screen and the rules.
export function giftPrice(gift: GiftRequest) {
  if (gift.kind === 'recipe-copy') return { currency: 'card' as const, amount: 1 };
  if (gift.kind === 'cosmetic-copy') return { currency:'cosmetic' as const,amount:1 };
  if (gift.kind === 'recipe') {
    const recipe = RECIPES.find((item) => item.id === gift.recipeId);
    return recipe ? recipePurchase(recipe, RECIPES.indexOf(recipe)) : undefined;
  }
  const interior = INTERIORS.find((item) => item.id === gift.interiorId);
  return interior && interior.crystalCost > 0 ? { currency: 'crystals' as const, amount: interior.crystalCost } : undefined;
}

// Validates a gift request and takes its price from the sender. Returns the clean gift to store.
export function payForGift(state: PlayerState, request: unknown): Gift {
  const gift = request as Partial<GiftRequest> | undefined;
  if (!gift || typeof gift !== 'object') throw new GiftError('Choose a gift.');
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
    name, level: levelFor(state.xp), regionId: state.regionId, bar,
    recipes: state.knownRecipeIds.length, interiors: state.ownedInteriorIds.length, mastered,
    knownRecipeIds: state.knownRecipeIds.filter((id) => !isStarterRecipe(id)), ownedInteriorIds: state.ownedInteriorIds
  };
}
