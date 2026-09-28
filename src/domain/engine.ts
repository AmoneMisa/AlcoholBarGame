import { INGREDIENTS, MODIFIERS, RECIPES } from './catalog';
import type { Customer, InventoryItem, Mood, Region, SupplierOffer } from './types';

const NAMES = ['Alex', 'Sam', 'Jamie', 'Robin', 'Casey', 'Morgan', 'Taylor', 'Jordan'];
const MOODS: Mood[] = ['calm', 'impatient', 'sad', 'vip', 'wealthy', 'friendly'];
const pick = <T>(list: T[]) => list[Math.floor(Math.random() * list.length)]!;

export function generateCustomer(level = 0): Customer {
  const recipe = pick(RECIPES);
  const mood = pick(MOODS);
  const modifier = level > 0 && Math.random() > 0.55 ? pick(MODIFIERS) : undefined;
  const moodBudget = mood === 'wealthy' || mood === 'vip' ? 1.8 : 1;
  return {
    id: crypto.randomUUID(), name: pick(NAMES), mood,
    patience: mood === 'impatient' ? 38 : mood === 'calm' ? 78 : 60,
    budget: recipe.price * moodBudget + 2,
    orderRecipeId: recipe.id, modifierId: modifier?.id,
    greeting: mood === 'sad' ? 'Hi. I need something simple.' : mood === 'impatient' ? 'Hi. Quick, please.' : 'Hello!',
    request: modifier ? 'I want a ' + recipe.name + ' ' + modifier.label + ', please.' : 'I want a ' + recipe.name + ', please.'
  };
}

export function requiredRecipe(customer: Customer) {
  const base = RECIPES.find((r) => r.id === customer.orderRecipeId)!;
  let ingredients = base.ingredients.map((item) => ({ ...item }));
  const modifier = MODIFIERS.find((m) => m.id === customer.modifierId);
  if (modifier?.removeIngredientId) ingredients = ingredients.filter((item) => item.ingredientId !== modifier.removeIngredientId);
  if (modifier?.add) {
    const current = ingredients.find((item) => item.ingredientId === modifier.add!.ingredientId);
    if (current) current.amount += modifier.add.amount;
    else ingredients.push({ ...modifier.add });
  }
  return { ...base, ingredients };
}

export function canMake(inventory: InventoryItem[], customer: Customer) {
  return requiredRecipe(customer).ingredients.every((required) =>
    (inventory.find((item) => item.ingredientId === required.ingredientId)?.amount ?? 0) >= required.amount
  );
}

export function useIngredients(inventory: InventoryItem[], customer: Customer) {
  const next = inventory.map((item) => ({ ...item }));
  for (const required of requiredRecipe(customer).ingredients) {
    const stock = next.find((item) => item.ingredientId === required.ingredientId);
    if (stock) stock.amount -= required.amount;
  }
  return next;
}

export function createMarket(region: Region, day: number): SupplierOffer[] {
  const wave = 1 + Math.sin(day * 1.7) * 0.06;
  return INGREDIENTS.flatMap((ingredient, index) => {
    const pack = ingredient.unit === 'ml' ? 500 : 20;
    const wholesale = ingredient.basePrice * pack * region.marketFactor * wave;
    return [
      { supplier: 'Metro Drinks', ingredientId: ingredient.id, quantity: pack,
        price: Number((wholesale * (0.9 + ((day + index) % 4) * 0.03)).toFixed(2)), quality: 'standard' as const },
      { supplier: 'Golden Bottle', ingredientId: ingredient.id, quantity: pack,
        price: Number((wholesale * 1.08).toFixed(2)), quality: 'premium' as const }
    ];
  });
}
