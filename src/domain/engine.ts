import { INGREDIENTS, MODIFIERS, RECIPES } from './catalog';
import type { Customer, InventoryItem, Mood, Region, SupplierOffer } from './types';

const NAMES = ['Alex', 'Sam', 'Jamie', 'Robin', 'Casey', 'Morgan', 'Taylor', 'Jordan', 'Chris', 'Nina'];
const MOODS: Mood[] = ['calm', 'impatient', 'sad', 'vip', 'wealthy', 'friendly'];
const pick = <T>(list: T[]) => list[Math.floor(Math.random() * list.length)]!;

export function generateCustomer(level = 0): Customer {
  const recipe = pick(RECIPES);
  const mood = pick(MOODS);
  const modifier = level > 1 && Math.random() > 0.65 ? pick(MODIFIERS) : undefined;
  const patience = mood === 'impatient' ? 38 : mood === 'calm' ? 82 : mood === 'sad' ? 54 : 68;
  const greeting = mood === 'sad' ? 'I am having a rough day.' :
    mood === 'impatient' ? 'Hurry up, please.' :
    mood === 'vip' ? 'Good evening.' : 'Hello!';

  return {
    id: crypto.randomUUID(),
    name: pick(NAMES),
    mood,
    patience,
    patienceRemaining: patience,
    budget: recipe.price * (mood === 'wealthy' || mood === 'vip' ? 1.8 : 1) + 4,
    orderRecipeId: recipe.id,
    modifierId: modifier?.id,
    greeting,
    request: modifier ? 'I’ll have a ' + recipe.name + '. ' + modifier.label + '.' : 'I’ll have a ' + recipe.name + ', please.',
    paymentMethod: Math.random() > 0.45 ? 'card' : 'cash'
  };
}

export function requiredRecipe(customer: Customer) {
  const base = RECIPES.find((recipe) => recipe.id === customer.orderRecipeId)!;
  let ingredients = base.ingredients.map((item) => ({ ...item }));
  const modifier = MODIFIERS.find((item) => item.id === customer.modifierId);

  if (modifier?.removeIngredientId) ingredients = ingredients.filter((item) => item.ingredientId !== modifier.removeIngredientId);
  if (modifier?.add) {
    const current = ingredients.find((item) => item.ingredientId === modifier.add!.ingredientId);
    if (current) current.amount += modifier.add.amount;
    else ingredients.push({ ...modifier.add });
  }

  return { ...base, ingredients };
}

export function judgeMix(mix: InventoryItem[], customer: Customer, shaken: boolean) {
  const recipe = requiredRecipe(customer);
  const actual = Object.fromEntries(mix.map((item) => [item.ingredientId, item.amount]));
  const expected = Object.fromEntries(recipe.ingredients.map((item) => [item.ingredientId, item.amount]));
  const ids = Array.from(new Set([...Object.keys(actual), ...Object.keys(expected)]));
  const details = ids.map((ingredientId) => ({
    ingredientId,
    expected: expected[ingredientId] ?? 0,
    actual: actual[ingredientId] ?? 0,
    ok: (expected[ingredientId] ?? 0) === (actual[ingredientId] ?? 0)
  }));
  const shakeOk = recipe.needsShake ? shaken : true;
  return { recipe, details, shakeOk, success: details.every((item) => item.ok) && shakeOk };
}

export function consumeMix(inventory: InventoryItem[], mix: InventoryItem[]) {
  const next = inventory.map((item) => ({ ...item }));
  for (const used of mix) {
    const stock = next.find((item) => item.ingredientId === used.ingredientId);
    if (stock) stock.amount -= used.amount;
  }
  return next;
}

export function canMake(inventory: InventoryItem[], customer: Customer) {
  return requiredRecipe(customer).ingredients.every((required) =>
    (inventory.find((item) => item.ingredientId === required.ingredientId)?.amount ?? 0) >= required.amount
  );
}

export function createMarket(region: Region, day: number): SupplierOffer[] {
  const wave = 1 + Math.sin(day * 1.7) * 0.06;
  const suppliers = [
    { id: 'global', name: 'Global Drinks Co.', multiplier: 1, quality: 'standard' as const, accepts: ['spirit', 'mixer'] },
    { id: 'local', name: 'Local Market', multiplier: .88, quality: 'standard' as const, accepts: ['mixer', 'fruit', 'herb', 'garnish'] },
    { id: 'premium', name: 'Premium Spirits', multiplier: 1.17, quality: 'premium' as const, accepts: ['spirit'] },
    { id: 'fresh', name: 'Fresh & Green', multiplier: 1.03, quality: 'premium' as const, accepts: ['fruit', 'herb', 'garnish', 'mixer'] }
  ];
  return INGREDIENTS.flatMap((ingredient, index) => {
    const pack = ingredient.unit === 'ml' ? 500 : 12;
    const wholesale = ingredient.basePrice * pack * region.marketFactor * wave;
    return suppliers
      .filter((supplier) => supplier.accepts.includes(ingredient.category))
      .map((supplier) => ({
        supplierId: supplier.id,
        supplier: supplier.name,
        ingredientId: ingredient.id,
        quantity: pack,
        price: Number((wholesale * supplier.multiplier * (0.96 + ((day + index) % 4) * 0.025)).toFixed(2)),
        quality: supplier.quality
      }));
  });
}
