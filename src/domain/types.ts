export type RegionId = 'london' | 'bucharest' | 'tashkent' | 'new-york';
export type Mood = 'calm' | 'impatient' | 'sad' | 'vip' | 'wealthy' | 'friendly';

export interface Region {
  id: RegionId;
  name: string;
  currencySymbol: string;
  marketFactor: number;
  rentPerDay: number;
}

export interface Ingredient {
  id: string;
  name: string;
  unit: 'ml' | 'piece';
  basePrice: number;
}

export interface RecipeItem { ingredientId: string; amount: number }
export interface Recipe { id: string; name: string; price: number; ingredients: RecipeItem[] }
export interface Modifier { id: string; label: string; add?: RecipeItem; removeIngredientId?: string }

export interface Customer {
  id: string;
  name: string;
  mood: Mood;
  patience: number;
  budget: number;
  orderRecipeId: string;
  modifierId?: string;
  greeting: string;
  request: string;
}

export interface InventoryItem { ingredientId: string; amount: number }
export interface SupplierOffer {
  supplier: string;
  ingredientId: string;
  quantity: number;
  price: number;
  quality: 'standard' | 'premium';
}
