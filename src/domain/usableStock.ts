import { RECIPES } from './catalog';

// Ingredients a bar can actually use: those in the recipes the player knows. New players start with stock
// for their ten starter recipes only; the rest is bought once a recipe is learned.
export function usableIngredientIds(knownRecipeIds: readonly string[]): Set<string> {
  return new Set(RECIPES.filter((recipe) => knownRecipeIds.includes(recipe.id)).flatMap((recipe) => recipe.ingredients.map((item) => item.ingredientId)));
}
