import { RECIPES } from '../domain/catalog';
import type { Recipe } from '../domain/types';
import { BASIC_RECIPE_COUNT, type PlayerState } from './state';

// Recipe levels and spare copies.
// Upgrading a recipe makes guests pay and tip more for it. Getting a recipe you already know (shop, daily gift,
// VIP guests, friends) gives a spare copy, and spare copies of non-starter recipes can be gifted to friends.

export const RECIPE_MAX_LEVEL = 5;
const COST_STEPS = [1, 1.8, 3, 5];

export const isStarterRecipe = (recipeId: string) => RECIPES.slice(0, BASIC_RECIPE_COUNT).some((recipe) => recipe.id === recipeId);
export const recipeLevel = (state: Pick<PlayerState, 'recipeLevels'>, recipeId: string) => Math.min(RECIPE_MAX_LEVEL, Math.max(1, state.recipeLevels?.[recipeId] ?? 1));
export const recipeCopies = (state: Pick<PlayerState, 'recipeCopies'>, recipeId: string) => Math.max(0, state.recipeCopies?.[recipeId] ?? 0);

// +8% price and +12% tips for every level above 1.
export function recipeBonus(level: number) {
  const steps = Math.min(RECIPE_MAX_LEVEL, Math.max(1, level)) - 1;
  return { pay: 1 + steps * .08, tips: 1 + steps * .12 };
}

// Coins to go from `level` to the next one (undefined at the top level).
export function upgradeCost(recipe: Recipe, level: number) {
  const step = COST_STEPS[level - 1];
  return step === undefined ? undefined : Math.round(Math.max(120, recipe.price * 18) * step);
}

export function addSpareCopy(state: PlayerState, recipeId: string, amount = 1) {
  if (isStarterRecipe(recipeId)) return;
  state.recipeCopies = { ...(state.recipeCopies ?? {}), [recipeId]: recipeCopies(state, recipeId) + amount };
}
