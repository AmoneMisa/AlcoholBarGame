import type { Ingredient, Modifier, Recipe, Region, Supplier } from './types';

export const REGIONS: Region[] = [
  { id: 'new-york', name: 'New York', currencySymbol: '$', marketFactor: 1.35, rentPerDay: 50, tagline: 'Classic & diverse' },
  { id: 'london', name: 'London', currencySymbol: '£', marketFactor: 1.28, rentPerDay: 42, tagline: 'Pubs & cocktails' },
  { id: 'berlin', name: 'Berlin', currencySymbol: '€', marketFactor: 1.02, rentPerDay: 31, tagline: 'Trendy & modern' },
  { id: 'tashkent', name: 'Tashkent', currencySymbol: 'soʻm ', marketFactor: 0.62, rentPerDay: 18, tagline: 'Warm & social' },
  { id: 'bucharest', name: 'Bucharest', currencySymbol: 'lei ', marketFactor: 0.78, rentPerDay: 22, tagline: 'Busy nightlife' },
  { id: 'tokyo', name: 'Tokyo', currencySymbol: '¥', marketFactor: 1.30, rentPerDay: 47, tagline: 'Precise & premium' }
];

export const INGREDIENTS: Ingredient[] = [
  { id: 'white-rum', name: 'White rum', unit: 'ml', basePrice: 0.035, pourStep: 15, category: 'spirit' },
  { id: 'dark-rum', name: 'Dark rum', unit: 'ml', basePrice: 0.040, pourStep: 15, category: 'spirit' },
  { id: 'gin', name: 'Gin', unit: 'ml', basePrice: 0.040, pourStep: 15, category: 'spirit' },
  { id: 'vodka', name: 'Vodka', unit: 'ml', basePrice: 0.032, pourStep: 15, category: 'spirit' },
  { id: 'tequila', name: 'Tequila', unit: 'ml', basePrice: 0.045, pourStep: 15, category: 'spirit' },
  { id: 'whiskey', name: 'Whiskey', unit: 'ml', basePrice: 0.052, pourStep: 15, category: 'spirit' },
  { id: 'orange-liqueur', name: 'Orange liqueur', unit: 'ml', basePrice: 0.048, pourStep: 10, category: 'spirit' },
  { id: 'vermouth', name: 'Vermouth', unit: 'ml', basePrice: 0.030, pourStep: 10, category: 'spirit' },
  { id: 'lime-juice', name: 'Lime', unit: 'ml', basePrice: 0.012, pourStep: 5, category: 'fruit' },
  { id: 'lemon-juice', name: 'Lemon', unit: 'ml', basePrice: 0.012, pourStep: 5, category: 'fruit' },
  { id: 'pineapple-juice', name: 'Pineapple', unit: 'ml', basePrice: 0.008, pourStep: 30, category: 'fruit' },
  { id: 'cranberry-juice', name: 'Cranberry', unit: 'ml', basePrice: 0.009, pourStep: 30, category: 'fruit' },
  { id: 'sugar-syrup', name: 'Sugar', unit: 'ml', basePrice: 0.006, pourStep: 5, category: 'mixer' },
  { id: 'coconut-cream', name: 'Coconut cream', unit: 'ml', basePrice: 0.012, pourStep: 15, category: 'mixer' },
  { id: 'tonic', name: 'Tonic', unit: 'ml', basePrice: 0.006, pourStep: 30, category: 'mixer' },
  { id: 'soda', name: 'Soda water', unit: 'ml', basePrice: 0.004, pourStep: 30, category: 'mixer' },
  { id: 'cola', name: 'Cola', unit: 'ml', basePrice: 0.005, pourStep: 30, category: 'mixer' },
  { id: 'mint', name: 'Mint', unit: 'piece', basePrice: 0.030, pourStep: 2, category: 'herb' },
  { id: 'ice', name: 'Ice', unit: 'piece', basePrice: 0.010, pourStep: 1, category: 'garnish' }
];

export const RECIPES: Recipe[] = [
  { id: 'mojito', name: 'Mojito', price: 9.5, needsShake: false, category: 'classic', ingredients: [
    { ingredientId: 'white-rum', amount: 45 }, { ingredientId: 'lime-juice', amount: 20 },
    { ingredientId: 'mint', amount: 6 }, { ingredientId: 'sugar-syrup', amount: 10 },
    { ingredientId: 'soda', amount: 90 }, { ingredientId: 'ice', amount: 5 }
  ]},
  { id: 'daiquiri', name: 'Daiquiri', price: 8.5, needsShake: true, category: 'classic', ingredients: [
    { ingredientId: 'white-rum', amount: 45 }, { ingredientId: 'lime-juice', amount: 25 },
    { ingredientId: 'sugar-syrup', amount: 15 }, { ingredientId: 'ice', amount: 4 }
  ]},
  { id: 'margarita', name: 'Margarita', price: 10, needsShake: true, category: 'classic', ingredients: [
    { ingredientId: 'tequila', amount: 45 }, { ingredientId: 'orange-liqueur', amount: 20 },
    { ingredientId: 'lime-juice', amount: 20 }, { ingredientId: 'ice', amount: 4 }
  ]},
  { id: 'pina-colada', name: 'Piña Colada', price: 11, needsShake: true, category: 'cocktail', ingredients: [
    { ingredientId: 'white-rum', amount: 45 }, { ingredientId: 'pineapple-juice', amount: 90 },
    { ingredientId: 'coconut-cream', amount: 30 }, { ingredientId: 'ice', amount: 5 }
  ]},
  { id: 'cosmopolitan', name: 'Cosmopolitan', price: 10.5, needsShake: true, category: 'cocktail', ingredients: [
    { ingredientId: 'vodka', amount: 45 }, { ingredientId: 'orange-liqueur', amount: 15 },
    { ingredientId: 'cranberry-juice', amount: 30 }, { ingredientId: 'lime-juice', amount: 10 }, { ingredientId: 'ice', amount: 4 }
  ]},
  { id: 'old-fashioned', name: 'Old Fashioned', price: 12, needsShake: false, category: 'classic', ingredients: [
    { ingredientId: 'whiskey', amount: 45 }, { ingredientId: 'sugar-syrup', amount: 10 }, { ingredientId: 'ice', amount: 3 }
  ]},
  { id: 'martini', name: 'Martini', price: 11.5, needsShake: false, category: 'classic', ingredients: [
    { ingredientId: 'gin', amount: 60 }, { ingredientId: 'vermouth', amount: 20 }, { ingredientId: 'ice', amount: 4 }
  ]},
  { id: 'whiskey-sour', name: 'Whiskey Sour', price: 10.5, needsShake: true, category: 'classic', ingredients: [
    { ingredientId: 'whiskey', amount: 45 }, { ingredientId: 'lemon-juice', amount: 25 },
    { ingredientId: 'sugar-syrup', amount: 15 }, { ingredientId: 'ice', amount: 4 }
  ]},
  { id: 'long-island', name: 'Long Island', price: 13, needsShake: true, category: 'cocktail', ingredients: [
    { ingredientId: 'vodka', amount: 15 }, { ingredientId: 'gin', amount: 15 }, { ingredientId: 'white-rum', amount: 15 },
    { ingredientId: 'tequila', amount: 15 }, { ingredientId: 'orange-liqueur', amount: 10 },
    { ingredientId: 'lemon-juice', amount: 20 }, { ingredientId: 'cola', amount: 60 }, { ingredientId: 'ice', amount: 5 }
  ]}
];

export const MODIFIERS: Modifier[] = [
  { id: 'extra-lime', label: 'Extra lime, please', add: { ingredientId: 'lime-juice', amount: 10 } },
  { id: 'no-ice', label: 'No ice, please', removeIngredientId: 'ice' }
];

export const SUPPLIERS: Supplier[] = [
  { id: 'global', name: 'Global Drinks Co.', description: 'Reliable, medium prices', deliveryDays: 3, reputation: 4 },
  { id: 'local', name: 'Local Market', description: 'Best prices, slower delivery', deliveryDays: 5, reputation: 3 },
  { id: 'premium', name: 'Premium Spirits', description: 'High-end brands', deliveryDays: 2, reputation: 5 },
  { id: 'fresh', name: 'Fresh & Green', description: 'Fruits, herbs, mixers', deliveryDays: 2, reputation: 4 }
];

export const STARTING_INVENTORY = INGREDIENTS.map((item) => ({
  ingredientId: item.id,
  amount: item.unit === 'ml' ? 360 : item.id === 'ice' ? 45 : 18
}));