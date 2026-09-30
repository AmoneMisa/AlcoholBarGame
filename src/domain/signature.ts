import { INGREDIENTS } from './catalog';
import type { Recipe, RecipeItem } from './types';

// A bar's signature cocktail: invented by the player, ordered by guests who "heard about it".
// Everything here is pure; sim/loot.ts applies it on the server.
export const SIGNATURE_LEVEL = 15;
export const SIGNATURE_FEE = 300;
export const SIGNATURE_GUEST_CHANCE = .15;
export const FAME_STEPS = [10, 30, 60] as const;   // signatures served for fame levels 1-3
export const FAME_PRICE_BONUS = .05;               // per fame level
export const MIN_ITEMS = 2;
export const MAX_ITEMS = 5;
export const MIN_LIQUID_ML = 60;
export const MAX_LIQUID_ML = 250;
export const MAX_SPIRIT_ML = 120;                  // above this the drink is "too strong"
const MAX_POUR = { spirit: 60, other: 90 } as const;
const MAX_PIECES = 6;

export interface Signature { name: string; items: RecipeItem[]; needsShake: boolean; price: number; served: number; }
export type SignatureSnapshot = Omit<Signature, 'served'>;

export const fameLevel = (served: number) => FAME_STEPS.filter((step) => served >= step).length;
export const nextFameStep = (served: number) => FAME_STEPS.find((step) => served < step);

const SOUR = ['lime-juice', 'lemon-juice'];
const SWEET = ['sugar-syrup', 'orange-liqueur', 'coconut-cream', 'cranberry-juice', 'pineapple-juice', 'coffee-liqueur', 'herbal-liqueur', 'blue-curacao', 'specialty-liqueur'];
const TOPS = ['tonic', 'soda', 'cola', 'ginger-beer', 'grapefruit-soda'];
const ingredientOf = (id: string) => INGREDIENTS.find((item) => item.id === id);

// The price a guest pays, with the reasons shown to the designer.
export function scoreSignature(items: readonly RecipeItem[]) {
  const notes: string[] = [];
  const ids = items.map((item) => item.ingredientId);
  const spiritMl = items.reduce((sum, item) => ingredientOf(item.ingredientId)?.category === 'spirit' ? sum + item.amount : sum, 0);
  let price = 7;
  const strength = Math.min(4, spiritMl * .05);
  price += strength;
  price += Math.max(0, Math.min(MAX_ITEMS, ids.length) - 2) * .8;
  if (spiritMl > 0 && ids.some((id) => SOUR.includes(id)) && ids.some((id) => SWEET.includes(id))) { price += 2.5; notes.push('Balanced sour and sweet +2.5'); }
  if (spiritMl > 0 && ids.some((id) => TOPS.includes(id))) { price += 1.5; notes.push('Refreshing long drink +1.5'); }
  if (ids.some((id) => ['herb', 'garnish'].includes(ingredientOf(id)?.category ?? '') && id !== 'ice')) { price += 1; notes.push('Garnished +1'); }
  if (spiritMl > MAX_SPIRIT_ML) { price -= 2; notes.push(`Too strong (over ${MAX_SPIRIT_ML} ml of spirit) −2`); }
  return { price: Math.round(Math.min(15, Math.max(6, price)) * 100) / 100, spiritMl, notes };
}

export class SignatureError extends Error {}
const cleanName = (value: unknown) => typeof value === 'string' ? value.replace(/[^\p{L}\p{N} '&.-]/gu, '').replace(/\s+/g, ' ').trim().slice(0, 24) : '';

// Validates untrusted input. `usable` = ingredients of the recipes the player knows.
export function validateSignature(input: unknown, usable: ReadonlySet<string>): SignatureSnapshot {
  const raw = input as { name?: unknown; items?: unknown; needsShake?: unknown } | undefined;
  const name = cleanName(raw?.name);
  if (name.length < 3) throw new SignatureError('Give your cocktail a name of at least 3 letters.');
  if (!Array.isArray(raw?.items)) throw new SignatureError('Choose the ingredients.');
  const seen = new Set<string>();
  const items: RecipeItem[] = [];
  for (const entry of raw!.items as { ingredientId?: unknown; amount?: unknown }[]) {
    const ingredient = typeof entry?.ingredientId === 'string' ? ingredientOf(entry.ingredientId) : undefined;
    if (!ingredient) throw new SignatureError('Unknown ingredient.');
    if (seen.has(ingredient.id)) throw new SignatureError(`${ingredient.name} is listed twice.`);
    if (!usable.has(ingredient.id)) throw new SignatureError(`${ingredient.name} is not stocked for your recipes yet.`);
    seen.add(ingredient.id);
    const amount = typeof entry.amount === 'number' ? entry.amount : NaN;
    const max = ingredient.unit === 'piece' ? MAX_PIECES : ingredient.category === 'spirit' ? MAX_POUR.spirit : MAX_POUR.other;
    if (!Number.isInteger(amount) || amount < ingredient.pourStep || amount > max || amount % ingredient.pourStep !== 0) {
      throw new SignatureError(`${ingredient.name}: use ${ingredient.pourStep}–${max} ${ingredient.unit === 'ml' ? 'ml' : 'pieces'} in steps of ${ingredient.pourStep}.`);
    }
    items.push({ ingredientId: ingredient.id, amount });
  }
  if (items.length < MIN_ITEMS || items.length > MAX_ITEMS) throw new SignatureError(`Use ${MIN_ITEMS} to ${MAX_ITEMS} ingredients.`);
  if (!items.some((item) => ingredientOf(item.ingredientId)?.category === 'spirit')) throw new SignatureError('A signature cocktail needs at least one spirit.');
  const liquid = items.reduce((sum, item) => ingredientOf(item.ingredientId)?.unit === 'ml' ? sum + item.amount : sum, 0);
  if (liquid < MIN_LIQUID_ML || liquid > MAX_LIQUID_ML) throw new SignatureError(`The drink must hold ${MIN_LIQUID_ML}–${MAX_LIQUID_ML} ml of liquid (now ${liquid} ml).`);
  return { name, items, needsShake: raw?.needsShake === true, price: scoreSignature(items).price };
}

// A guest's order is a tiny recipe, so the order station, judging and payment work unchanged.
export function signatureRecipe(signature: SignatureSnapshot): Recipe {
  return {
    id: `signature-${signature.name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`, name: signature.name, price: signature.price, needsShake: signature.needsShake, category: 'cocktail',
    ingredients: signature.items.map((item) => ({ ...item })), origin: 'House creation', story: 'Invented at this bar.', tastingNotes: ['house special'], occasions: ['House special'],
    method: [signature.needsShake ? 'Shake all ingredients with ice and strain.' : 'Build the ingredients over ice and stir.']
  };
}
