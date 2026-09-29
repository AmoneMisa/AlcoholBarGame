import { RECIPES } from './catalog';
import type { Recipe } from './types';

function isRecipe(value: unknown): value is Recipe {
  if (!value || typeof value !== 'object') return false;
  const recipe = value as Partial<Recipe>;
  return typeof recipe.id === 'string' && typeof recipe.name === 'string' && Number.isFinite(recipe.price)
    && typeof recipe.needsShake === 'boolean' && (recipe.category === 'classic' || recipe.category === 'cocktail')
    && typeof recipe.origin === 'string' && typeof recipe.story === 'string'
    && Array.isArray(recipe.tastingNotes) && Array.isArray(recipe.occasions) && Array.isArray(recipe.method)
    && Array.isArray(recipe.ingredients) && recipe.ingredients.every((item) =>
      !!item && typeof item.ingredientId === 'string' && Number.isFinite(item.amount) && item.amount > 0
    );
}

export async function hydrateCocktailCatalog(fetcher: typeof fetch = fetch) {
  try {
    const response = await fetcher('/api/cocktails', { headers: { Accept: 'application/json' } });
    if (!response.ok) throw new Error(`Cocktail API returned ${response.status}`);
    const payload: unknown = await response.json();
    if (!Array.isArray(payload) || !payload.length || !payload.every(isRecipe)) throw new Error('Cocktail API returned invalid data');
    // Keep the exported array identity stable: every domain module imports this
    // same object, so hydrating it before Vue mounts updates the whole game.
    RECIPES.splice(0, RECIPES.length, ...payload);
    return { source: 'database' as const, count: payload.length };
  } catch (error) {
    console.warn('Using bundled cocktail fallback because the database API is unavailable.', error);
    return { source: 'fallback' as const, count: RECIPES.length };
  }
}

