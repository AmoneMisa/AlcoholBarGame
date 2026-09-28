export type RegionId = 'new-york' | 'london' | 'berlin' | 'tashkent' | 'bucharest' | 'tokyo';
export type Mood =
  | 'calm'
  | 'friendly'
  | 'impatient'
  | 'angry'
  | 'sad'
  | 'tired'
  | 'shy'
  | 'confused'
  | 'wealthy'
  | 'vip';
export type PaymentMethod = 'cash' | 'card';

export interface Region {
  id: RegionId;
  name: string;
  currencySymbol: string;
  marketFactor: number;
  rentPerDay: number;
  tagline: string;
}

export interface Ingredient {
  id: string;
  name: string;
  unit: 'ml' | 'piece';
  basePrice: number;
  pourStep: number;
  category: 'spirit' | 'mixer' | 'fruit' | 'herb' | 'garnish';
}

export interface RecipeItem {
  ingredientId: string;
  amount: number;
}

export interface Recipe {
  id: string;
  name: string;
  price: number;
  needsShake: boolean;
  category: 'classic' | 'cocktail';
  ingredients: RecipeItem[];
  origin: string;
  story: string;
  tastingNotes: string[];
  occasions: string[];
  method: string[];
}

export interface Modifier {
  id: string;
  label: string;
  add?: RecipeItem;
  removeIngredientId?: string;
}

export interface Customer {
  id: string;
  name: string;
  mood: Mood;
  patience: number;
  patienceRemaining: number;
  budget: number;
  orderRecipeId: string;
  modifierId?: string;
  greeting: string;
  request: string;
  paymentMethod: PaymentMethod;
}

export interface InventoryItem {
  ingredientId: string;
  amount: number;
}

export interface SupplierOffer {
  supplierId: string;
  supplier: string;
  ingredientId: string;
  quantity: number;
  price: number;
  quality: 'standard' | 'premium';
}

export interface Supplier {
  id: string;
  name: string;
  description: string;
  deliveryDays: number;
  reputation: number;
}
