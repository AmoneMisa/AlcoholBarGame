import { RECIPES } from './catalog';
let loading: Promise<void> | undefined;
export function loadRecipeDetails() {
  return loading ??= import('./recipeDetails').then(({ RECIPE_DETAILS }) => {
    for (const recipe of RECIPES) Object.assign(recipe, RECIPE_DETAILS[recipe.id as keyof typeof RECIPE_DETAILS]);
    // Database prose is optional; the local descriptive pack is ready immediately.
    void import('./recipeApi').then(async ({ hydrateCocktailCatalog }) => {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 800);
      try { await hydrateCocktailCatalog((input, init) => fetch(input, { ...init, signal: controller.signal })); }
      finally { clearTimeout(timer); }
    }).catch(() => undefined);
  }).catch(error => { loading = undefined; throw error; });
}
