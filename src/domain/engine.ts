import { signatureRecipe } from './signature';
import { INGREDIENTS, MODIFIERS, RECIPES } from './catalog';
import { ALCOHOL_PRODUCTS, generateBottleRequest } from './bottleCatalog';
import { withArticle } from './english/articles';
import { makeServeRequest, serveRecipe, serveRequestText, servePrice } from './brandServe';
import { CUSTOMER_ART_BY_SLOT } from '../data/cosmetics/artCatalog';
import { orderTimeSeconds } from './customerTiming';
import type { BottleOccasion, Customer, InventoryItem, Mood, Recipe, Region, SupplierOffer } from './types';

const NAMES = ['Alex', 'Sam', 'Jamie', 'Robin', 'Casey', 'Morgan', 'Taylor', 'Jordan', 'Chris', 'Nina'];
// VIP arrival is controlled by the real-time cooldown in the game store. Keep
// ordinary generation free of VIPs so that route is the single source of truth.
const MOODS: Mood[] = ['calm', 'impatient', 'sad', 'wealthy', 'friendly'];
const pick = <T>(list: T[]) => list[Math.floor(Math.random() * list.length)]!;

export function generateCustomer(level = 0, recipePool: Recipe[] = RECIPES, bottleChance = .35, marketFactor = 1.35, serveChance = .25): Customer {
  const recipe = pick(recipePool.length ? recipePool : RECIPES);
  const mood = pick(MOODS);
  const modifier = level > 1 && Math.random() > 0.65 ? pick(MODIFIERS) : undefined;
  const greeting = mood === 'sad' ? 'I am having a rough day.' :
    mood === 'impatient' ? 'Hurry up, please.' :
    mood === 'vip' ? 'Good evening.' : 'Hello!';

  const customer: Customer = {
    id: crypto.randomUUID(),
    characterId: pick(CUSTOMER_ART_BY_SLOT),
    name: pick(NAMES),
    mood,
    patience: 1,
    patienceRemaining: 1,
    budget: recipe.price * (mood === 'wealthy' || mood === 'vip' ? 1.8 : 1) + 4,
    orderRecipeId: recipe.id,
    modifierId: modifier?.id,
    greeting,
    request: modifier ? 'I’ll have ' + withArticle(recipe.name) + '. ' + modifier.label + '.' : 'I’ll have ' + withArticle(recipe.name) + ', please.',
    paymentMethod: Math.random() > 0.45 ? 'card' : 'cash',
    orderKind: 'cocktail'
  };
  if (Math.random() < bottleChance) {
    const product = pick(ALCOHOL_PRODUCTS);
    const quantity = 1 + Math.floor(Math.random() * (mood === 'wealthy' || mood === 'vip' ? 3 : 2));
    const occasion = pick<BottleOccasion>(['gift','party','dinner','celebration','home bar']);
    customer.orderKind = 'bottle';
    customer.bottleRequest = generateBottleRequest(product, quantity, occasion, marketFactor);
    customer.request = `${quantity} sealed bottle${quantity === 1 ? '' : 's'} for a ${occasion}.`;
    customer.budget = customer.bottleRequest.budget;
  } else if (Math.random() < serveChance) {
    // A simple brand call: the guest names the spirit brand and how to serve it.
    const serveRequest = makeServeRequest();
    customer.orderKind = 'serve';
    customer.serveRequest = serveRequest;
    customer.request = serveRequestText(serveRequest);
    customer.orderRevealed = true;
    customer.modifierId = undefined;
    customer.budget = servePrice(serveRequest) * (mood === 'wealthy' || mood === 'vip' ? 1.8 : 1.2) + 2;
  }
  customer.patience = orderTimeSeconds(customer.mood, customer.orderKind);
  customer.patienceRemaining = customer.patience;
  return customer;
}

// Shown while the server keeps a guest's order secret: nothing to match yet.
const MYSTERY_RECIPE: Recipe = { id: 'mystery', name: 'Mystery order', price: 0, needsShake: false, category: 'cocktail', ingredients: [], origin: '', story: '', tastingNotes: [], occasions: [], method: [] };

export function requiredRecipe(customer: Customer) {
  if (customer.signature) return signatureRecipe(customer.signature);
  if (customer.orderKind === 'serve' && customer.serveRequest) return serveRecipe(customer.serveRequest);
  const base = RECIPES.find((recipe) => recipe.id === customer.orderRecipeId);
  if (!base) return MYSTERY_RECIPE;
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
    // Wholesale sits 15% above catalog cost; level perks and events adjust it from there (see marketFor).
    const wholesale = ingredient.basePrice * pack * region.marketFactor * wave * 1.15;
    return suppliers
      .filter((supplier) => supplier.accepts.includes(ingredient.category))
      .map((supplier) => {
        const listPrice = Number((wholesale * supplier.multiplier * (0.96 + ((day + index) % 4) * 0.025)).toFixed(2));
        const discountPercent = (day + index * 3) % 7 === 0 ? 15 : 0;
        return {
          supplierId: supplier.id,
          supplier: supplier.name,
          ingredientId: ingredient.id,
          quantity: pack,
          listPrice,
          discountPercent,
          price: Number((listPrice * (1 - discountPercent / 100)).toFixed(2)),
          quality: supplier.quality
        };
      });
  });
}
