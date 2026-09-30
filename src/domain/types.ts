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
export type AlcoholType = 'whiskey' | 'bourbon' | 'liqueur' | 'herbal-liqueur' | 'specialty-liqueur' | 'sambuca' | 'sangria' | 'infusion' | 'fruit-wine' | 'champagne' | 'sparkling-wine' | 'port-wine' | 'cognac' | 'brandy' | 'beer' | 'non-alcoholic-beer' | 'soju' | 'sake' | 'cider' | 'vodka' | 'gin' | 'rum' | 'tequila' | 'aperitif' | 'vermouth';
export type BottleOccasion = 'gift' | 'party' | 'dinner' | 'celebration' | 'home bar';

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
  characterId?: string;
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
  specialRecipeRewardId?: string;
  orderRevealed?: boolean;
  // What the guest says before the order is known (“Something to feel fresh and cool…”); safe to show.
  wish?: string;
  // City x level x event price level when the guest walked in; what they pay and budget with.
  priceFactor?: number;
  orderKind?: 'cocktail' | 'bottle' | 'serve';
  // Brand-call order (“Jack Daniel’s on the rocks”): the only bar order that names a brand.
  serveRequest?: import('./brandServe').ServeRequest;
  bottleRequest?: BottleRequest;
  selectedBottleId?: string;
  smoker?: boolean;
  // A guest who came for the bar's own signature cocktail (see domain/signature.ts).
  signature?: import('./signature').SignatureSnapshot;
}

export interface AlcoholProduct {
  id: string;
  name: string;
  brand: string;
  type: AlcoholType;
  volumeMl: number;
  abv: number;
  price: number;
  popularity: number;
  origin: string;
  tastes: string[];
  occasions: BottleOccasion[];
  description: string;
  ingredientId: string;
  color: string;
}

export interface BottleRequest {
  productId: string;
  quantity: number;
  budget: number;
  type: AlcoholType;
  tastes: string[];
  occasion: BottleOccasion;
  preferredBrand?: string;
}

export interface BottleInventoryItem {
  productId: string;
  quantity: number;
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
  listPrice: number;
  discountPercent: number;
  quality: 'standard' | 'premium';
}

export interface Supplier {
  id: string;
  name: string;
  description: string;
  deliveryDays: number;
  reputation: number;
  deliveryFee: number;
  freeDeliveryAt: number;
  icon: 'truck' | 'basket' | 'bottle' | 'leaf';
}
