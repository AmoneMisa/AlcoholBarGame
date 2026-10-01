import { ALCOHOL_PRODUCTS } from './bottleCatalog';
import { SIGNATURE_BRANDS } from '../data/knowledge/signatureBrands';
import { foldText as norm } from './text';

// When the bartender pours the cocktail's signature brand (Campari in a Negroni), the guest notices: a small bonus tip.
export function sameBrand(catalogBrand: string, signatureBrand: string) {
  const a = norm(catalogBrand), b = norm(signatureBrand);
  return a === b || a.startsWith(`${b} `) || b.startsWith(`${a} `);
}

// Returns the brand name used as the signature brand, or undefined.
export function signatureBonus(recipeId: string, pourBrands: Record<string, string>) {
  for (const signature of SIGNATURE_BRANDS[recipeId] ?? []) {
    if (!signature.ingredientId) continue;
    const pouredBrand = pourBrands[signature.ingredientId!];
    const product = ALCOHOL_PRODUCTS.find((item) => item.id === pouredBrand);
    // Cocktail pours may come from a stocked product id or from a direct brand
    // key used by recipe-specific bottles (for example, `campari`).
    if ((product && sameBrand(product.brand, signature.brand)) || (!product && pouredBrand && sameBrand(pouredBrand, signature.brand))) {
      return signature.brand;
    }
  }
  return undefined;
}

// The signature brand for one ingredient of a recipe, if any (for hints at the order station).
export function signatureFor(recipeId: string, ingredientId: string) {
  return (SIGNATURE_BRANDS[recipeId] ?? []).find((item) => item.ingredientId === ingredientId);
}
