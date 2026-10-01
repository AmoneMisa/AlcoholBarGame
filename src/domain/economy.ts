import type { Customer, Recipe, RegionId, Supplier, SupplierOffer } from './types';

export const coins = (value: number) => Math.round(value * 100) / 100;
export const bulkDiscount = (packs: number) => packs >= 10 ? .10 : packs >= 5 ? .05 : 0;
export const DAILY_COINS = [100, 150, 200, 260, 320, 400, 500] as const;
export const dailyCoinsFor = (streak: number) => DAILY_COINS[Math.min(6, Math.max(0, Math.floor(streak) - 1))]!;
export const dailyCrystalsFor = (streak: number) => {
  const day = ((Math.max(1, Math.floor(streak)) - 1) % 7) + 1;
  return day === 7 ? 90 : day === 3 ? 30 : 0;
};

// Premium currency can only move into earned currency. Fixed server-known bundles prevent a client
// from inventing an exchange rate; larger bundles receive a small convenience bonus.
export const CRYSTAL_EXCHANGE_BUNDLES = [
  { crystals: 10, coins: 250 },
  { crystals: 50, coins: 1350 },
  { crystals: 100, coins: 2900 },
  { crystals: 250, coins: 7750 }
] as const;

// Crystal packs sold for Telegram Stars (currency XTR, whole Stars). The server is the only source of
// prices and amounts; the client sends just a pack id.
export interface StarCrystalPack { id: string; stars: number; crystals: number; title: string; once?: boolean }

// The starter pack is a one-time welcome offer; the regular packs share one flat rate of 2.4 crystals per Star,
// so a bigger pack is never a "better deal" that pushes players to spend more than they want.
export const STAR_CRYSTAL_PACKS: readonly StarCrystalPack[] = [
  { id: 'starter', stars: 15, crystals: 40, title: 'Starter crystals', once: true },
  { id: 'pinch', stars: 25, crystals: 60, title: 'Pinch of crystals' },
  { id: 'handful', stars: 75, crystals: 180, title: 'Handful of crystals' },
  { id: 'chest', stars: 250, crystals: 600, title: 'Chest of crystals' },
  { id: 'vault', stars: 750, crystals: 1800, title: 'Vault of crystals' }
];

export const starCrystalPack = (id: unknown) => STAR_CRYSTAL_PACKS.find((pack) => pack.id === id);

export function crystalExchange(crystals: number) {
  return CRYSTAL_EXCHANGE_BUNDLES.find((bundle) => bundle.crystals === crystals);
}

export const arrivalSkipCrystalCost = (remainingMs: number) => remainingMs <= 0 ? 0 : Math.min(24, Math.max(1, Math.ceil(remainingMs / 300_000)));

export function conversationDifficulty(customer: Customer, recipe?: Recipe) {
  let score = customer.orderKind === 'bottle' ? 3 : customer.orderKind === 'serve' ? 2 : 1;
  score += customer.mood === 'vip' || customer.mood === 'impatient' || customer.mood === 'angry' ? 1 : 0;
  score += recipe && recipe.ingredients.length >= 5 ? 1 : 0;
  return Math.min(5, Math.max(1, score));
}

export const conversationCrystalReward = (customer: Customer, recipe?: Recipe) => conversationDifficulty(customer, recipe) * 3;

export function recipePurchase(recipe: Recipe, catalogIndex: number) {
  const difficulty = recipe.ingredients.length + (recipe.needsShake ? 2 : 0) + Math.min(4, Math.floor(recipe.price / 5));
  // Four out of every five advanced lessons use crystals; a small rotating selection remains coin-priced.
  return catalogIndex % 5 === 0
    ? { currency: 'coins' as const, amount: Math.max(300, Math.round(recipe.price * 22)) }
    : { currency: 'crystals' as const, amount: Math.round(Math.min(550, Math.max(120, 120 + (difficulty - 5) * (430 / 7)))) };
}

export function calendarDate(date = new Date()) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

export function consecutiveDays(lastDate: string, streak: number, date = new Date()) {
  const yesterday = new Date(date.getFullYear(), date.getMonth(), date.getDate() - 1);
  return lastDate === calendarDate(date) ? Math.max(1, streak) : lastDate === calendarDate(yesterday) ? streak + 1 : 1;
}

export function quotePurchase(offers: SupplierOffer[], cart: Record<string, number>, supplier: Supplier) {
  const lines = offers.filter((offer) => offer.supplierId === supplier.id && Number.isFinite(cart[offer.ingredientId]) && cart[offer.ingredientId] >= 1).map((offer) => {
    const packs = Math.min(99, Math.max(1, Math.floor(cart[offer.ingredientId]!)));
    return { ...offer, packs, amount: offer.quantity * packs, subtotal: coins(offer.price * packs) };
  });
  const packs = lines.reduce((sum, line) => sum + line.packs, 0);
  const subtotal = coins(lines.reduce((sum, line) => sum + line.subtotal, 0));
  const discountRate = bulkDiscount(packs);
  const discount = coins(subtotal * discountRate);
  const discountedSubtotal = coins(subtotal - discount);
  const delivery = lines.length && discountedSubtotal < supplier.freeDeliveryAt ? supplier.deliveryFee : 0;
  return { lines, packs, subtotal, discountRate, discount, delivery, total: coins(discountedSubtotal + delivery), freeDeliveryRemaining: coins(Math.max(0, supplier.freeDeliveryAt - discountedSubtotal)) };
}

// ---- City economy ----
// Every city has signature cocktails its guests pay a premium for; everything else follows the city's price level.
export const SPECIALTY_PREMIUM = .2;
export const CITY_SPECIALTIES: Record<RegionId, string[]> = {
  'new-york': ['manhattan', 'cosmopolitan', 'long-island', 'martini'],
  london: ['gin-tonic', 'tom-collins', 'french-75', 'white-lady', 'bees-knees'],
  berlin: ['negroni', 'aperol-spritz', 'hugo-spritz', 'moscow-mule'],
  tashkent: ['mojito', 'pina-colada', 'whiskey-ginger', 'madras'],
  bucharest: ['daiquiri', 'cuba-libre', 'sex-on-the-beach', 'woo-woo'],
  tokyo: ['whiskey-highball', 'old-fashioned', 'vesper', 'espresso-martini']
};
export const isCitySpecialty = (regionId: RegionId, recipeId: string) => CITY_SPECIALTIES[regionId]?.includes(recipeId) ?? false;
export const specialtyFactor = (regionId: RegionId, recipeId: string) => isCitySpecialty(regionId, recipeId) ? 1 + SPECIALTY_PREMIUM : 1;

// Delivery costs follow the city's price level too: couriers in Tokyo cost more than in Tashkent.
export function supplierInCity(supplier: Supplier, marketFactor: number): Supplier {
  return { ...supplier, deliveryFee: coins(supplier.deliveryFee * marketFactor), freeDeliveryAt: Math.round(supplier.freeDeliveryAt * marketFactor) };
}
