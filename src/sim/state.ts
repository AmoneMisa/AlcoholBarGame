import { INGREDIENTS, RECIPES, REGIONS, STARTING_INVENTORY } from '../domain/catalog';
import { ALCOHOL_PRODUCTS } from '../domain/bottleCatalog';
import { DEFAULT_BARS, type BarProfile } from '../data/cosmetics/bars';
import { CHARACTER_ART, CUSTOMER_ART_BY_SLOT } from '../data/cosmetics/artCatalog';
import { generateCustomer } from '../domain/engine';
import type { BottleInventoryItem, Customer, InventoryItem, RegionId } from '../domain/types';
import { buildProfile, shortWish, type CustomerReply, type Fact } from '../domain/conversation/customerTalk';
import type { BottleConversationFacts } from '../domain/conversation/bottleTalk';

// The complete, serializable game state of one player. The server owns it; the client only displays it
// (and, in offline practice mode, simulates it locally with the same rules).

export const BASIC_RECIPE_COUNT = 10;
export const DELIVERY_DAY_MS = 24 * 60 * 60 * 1000;
export type UnlockSource = 'starter' | 'shop' | 'special-client' | 'daily-gift';
export interface ChatLine { id: number; speaker: 'customer' | 'bartender'; text: string; note?: string; ok?: boolean; }
// One conversation with one guest. Only what has been said is stored here — never the hidden order.
export interface Transcript { lines: ChatLine[]; facts: Fact[]; bottleFacts: BottleConversationFacts; expression: CustomerReply['expression']; }

export interface DeliveryOrder { id: string; supplier: string; barId: RegionId; dueAt: number; items: InventoryItem[]; total: number; }

export interface PlayerState {
  version: 1;
  regionId: RegionId;
  money: number;
  xp: number;
  streak: number;
  bars: Record<RegionId, BarProfile>;
  knownRecipeIds: string[];
  recipeUnlockSources: Record<string, UnlockSource>;
  dailyGiftClaimedKey: string;
  loginStreak: number;
  dailyGiftResult: string;
  inventories: Record<RegionId, InventoryItem[]>;
  bottleInventories: Record<RegionId, BottleInventoryItem[]>;
  customers: Customer[];
  activeCustomerId: string;
  conversationCustomerId?: string;
  nextCustomerAt: number;
  vipCooldownUntil: number;
  lastClockAt: number;
  deliveryOrders: DeliveryOrder[];
  tradeLog: string[];
  languageStats: { sentences: number; correct: number };
  // Correct sentences already rewarded per customer, so talking cannot be farmed for XP.
  rewardedSentences: Record<string, number>;
  conversations: Record<string, Transcript>;
  message: string;
}

// A guest's name comes from their portrait, so names are unique and match the face. Special guests keep their story name.
export function withUniqueLook(customer: Customer, others: Customer[]) {
  const used = new Set(others.map((item) => item.characterId));
  if (!customer.characterId || used.has(customer.characterId)) customer.characterId = CUSTOMER_ART_BY_SLOT.find((id) => !used.has(id));
  if (!customer.specialRecipeRewardId) customer.name = CHARACTER_ART.find((art) => art.id === customer.characterId)?.name ?? customer.name;
  customer.wish = wishFor(customer);
  return customer;
}

export function wishFor(customer: Customer) {
  if (customer.orderKind === 'bottle') return 'Some sealed bottles, please.';
  if (customer.orderKind === 'serve' || customer.specialRecipeRewardId) return customer.request;
  const recipe = RECIPES.find((item) => item.id === customer.orderRecipeId);
  return recipe ? shortWish(buildProfile(recipe)) : 'Something nice, please.';
}

// What the client may see: unrevealed orders are hidden, so the player has to find them out in English.
export function publicState(state: PlayerState): PlayerState {
  const view = structuredClone(state);
  view.customers = view.customers.map((customer) => customer.orderRevealed ? customer : {
    ...customer, orderRecipeId: '', modifierId: undefined, bottleRequest: undefined, budget: 0,
    wish: customer.wish ?? wishFor(customer), request: customer.wish ?? wishFor(customer)
  });
  return view;
}

const makeBarInventory = (barIndex: number) => STARTING_INVENTORY.map((item, ingredientIndex) => {
  const ingredient = INGREDIENTS.find((entry) => entry.id === item.ingredientId)!;
  const factor = .48 + ((barIndex * 3 + ingredientIndex) % 6) * .11;
  const floor = ingredient.unit === 'ml' ? 90 : 4;
  return { ...item, amount: Math.max(floor, Math.round(item.amount * factor)) };
});

export function createInitialState(now = Date.now()): PlayerState {
  const firstGuest = withUniqueLook(generateCustomer(2, RECIPES.slice(0, BASIC_RECIPE_COUNT), .35, REGIONS[0]!.marketFactor), []);
  const knownRecipeIds = RECIPES.slice(0, BASIC_RECIPE_COUNT).map((recipe) => recipe.id);
  return {
    version: 1,
    regionId: 'new-york',
    money: 1240,
    xp: 720,
    streak: 0,
    bars: structuredClone(DEFAULT_BARS),
    knownRecipeIds,
    recipeUnlockSources: Object.fromEntries(knownRecipeIds.map((id) => [id, 'starter'])),
    dailyGiftClaimedKey: '',
    loginStreak: 0,
    dailyGiftResult: 'A new gift is available today.',
    inventories: Object.fromEntries(REGIONS.map((region, index) => [region.id, makeBarInventory(index)])) as Record<RegionId, InventoryItem[]>,
    bottleInventories: Object.fromEntries(REGIONS.map((region, barIndex) => [region.id, ALCOHOL_PRODUCTS.map((product, productIndex) => ({
      productId: product.id, quantity: 1 + ((barIndex + productIndex * 2) % 4)
    }))])) as Record<RegionId, BottleInventoryItem[]>,
    customers: [firstGuest],
    activeCustomerId: firstGuest.id,
    nextCustomerAt: 0,
    vipCooldownUntil: 0,
    lastClockAt: now,
    deliveryOrders: [],
    tradeLog: ['Each city bar now keeps its own stock.'],
    languageStats: { sentences: 0, correct: 0 },
    rewardedSentences: {},
    conversations: {},
    message: 'Tap a customer to talk, find out what they want, then build the cocktail.'
  };
}

export const levelFor = (xp: number) => Math.max(1, Math.floor(xp / 60));
