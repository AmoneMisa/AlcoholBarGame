import { RECIPES } from '../domain/catalog';
import type { Recipe } from '../domain/types';
import { BASIC_RECIPE_COUNT, type PlayerState } from './state';

// Recipe levels and duplicate recipe cards.
// Upgrading an advanced recipe consumes one duplicate card. Getting a recipe you already know (shop, daily gift,
// VIP guests, friends) adds that separate inventory item; it may be used for mastery or gifted to a friend.

export const RECIPE_MAX_LEVEL = 5;
const COST_STEPS = [1, 1.8, 3, 5];

export const isStarterRecipe = (recipeId: string) => RECIPES.slice(0, BASIC_RECIPE_COUNT).some((recipe) => recipe.id === recipeId);
export const recipeLevel = (state: Pick<PlayerState, 'recipeLevels'>, recipeId: string) => Math.min(RECIPE_MAX_LEVEL, Math.max(1, state.recipeLevels?.[recipeId] ?? 1));
export const recipeCopies = (state: Pick<PlayerState, 'recipeCopies'>, recipeId: string) => Math.max(0, state.recipeCopies?.[recipeId] ?? 0);
// Levels 2 and 3 are bought with coins alone; the top two levels also take duplicate cards (2, then 3).
export const recipeCardsRequired = (level: number) => Math.floor(level) <= 2 ? 0 : Math.min(RECIPE_MAX_LEVEL, Math.floor(level) - 1);

// +6% price and +10% tips for every level above 1 (+24% / +40% at the top).
export function recipeBonus(level: number) {
  const steps = Math.min(RECIPE_MAX_LEVEL, Math.max(1, level)) - 1;
  return { pay: 1 + steps * .06, tips: 1 + steps * .1 };
}

// Coins to go from `level` to the next one (undefined at the top level).
export function upgradeCost(recipe: Recipe, level: number) {
  const step = COST_STEPS[level - 1];
  return step === undefined ? undefined : Math.round(Math.max(120, recipe.price * 18) * step);
}

export function addSpareCopy(state: PlayerState, recipeId: string, amount = 1) {
  state.recipeCopies = { ...(state.recipeCopies ?? {}), [recipeId]: recipeCopies(state, recipeId) + amount };
}
