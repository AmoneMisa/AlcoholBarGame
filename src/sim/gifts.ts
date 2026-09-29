import { RECIPES } from '../domain/catalog';
import { calendarDate, coins, recipePurchase } from '../domain/economy';
import { INTERIORS } from '../data/cosmetics/bars';
import { addSpareCopy, isStarterRecipe, recipeCopies, recipeLevel } from './recipes';
import { levelFor, type PlayerState } from './state';

// Gifts between friends and visits to a friend's bar. The sender pays when a gift is sent; the receiver's game
// changes only when they claim it. Both steps run on the server.

export class GiftError extends Error {}

export type GiftRequest =
  | { kind: 'recipe'; recipeId: string }        // buy a recipe card for a friend
  | { kind: 'recipe-copy'; recipeId: string }   // give one of your spare recipe cards
  | { kind: 'interior'; interiorId: string };   // buy a bar background for a friend
export type Gift = GiftRequest;

export const VISIT_REWARD = 20;

export function giftLabel(gift: Gift) {
  if (gift.kind === 'interior') return `${INTERIORS.find((item) => item.id === gift.interiorId)?.name ?? 'A new'} background`;
  const recipe = RECIPES.find((item) => item.id === gift.recipeId);
  return `${recipe?.name ?? 'A'} recipe card`;
}

// What sending costs, for the gift screen and the rules.
export function giftPrice(gift: GiftRequest) {
  if (gift.kind === 'recipe-copy') return { currency: 'card' as const, amount: 1 };
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
export function rewardVisit(state: PlayerState, friendId: string, now: number) {
  const today = calendarDate(new Date(now));
  if (state.friendVisits?.[friendId] === today) return 0;
  state.friendVisits = { ...(state.friendVisits ?? {}), [friendId]: today };
  state.money = coins(state.money + VISIT_REWARD);
  return VISIT_REWARD;
}

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
