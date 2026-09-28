import type { Ingredient, Modifier, Recipe, Region } from './types';

export const REGIONS: Region[] = [
  { id: 'london', name: 'London', currencySymbol: '£', marketFactor: 1.28, rentPerDay: 42 },
  { id: 'bucharest', name: 'Bucharest', currencySymbol: 'lei ', marketFactor: 0.78, rentPerDay: 22 },
  { id: 'tashkent', name: 'Tashkent', currencySymbol: 'soʻm ', marketFactor: 0.62, rentPerDay: 18 },
  { id: 'new-york', name: 'New York', currencySymbol: '$', marketFactor: 1.35, rentPerDay: 50 }
];

export const INGREDIENTS: Ingredient[] = [
  { id: 'white-rum', name: 'white rum', unit: 'ml', basePrice: 0.035 },
  { id: 'gin', name: 'gin', unit: 'ml', basePrice: 0.04 },
  { id: 'vodka', name: 'vodka', unit: 'ml', basePrice: 0.032 },
  { id: 'lime-juice', name: 'lime juice', unit: 'ml', basePrice: 0.012 },
  { id: 'sugar-syrup', name: 'sugar syrup', unit: 'ml', basePrice: 0.006 },
  { id: 'tonic', name: 'tonic water', unit: 'ml', basePrice: 0.006 },
  { id: 'soda', name: 'soda water', unit: 'ml', basePrice: 0.004 },
  { id: 'ice', name: 'ice', unit: 'piece', basePrice: 0.01 }
];

export const RECIPES: Recipe[] = [
  { id: 'daiquiri', name: 'Daiquiri', price: 8.5, ingredients: [
    { ingredientId: 'white-rum', amount: 50 }, { ingredientId: 'lime-juice', amount: 25 },
    { ingredientId: 'sugar-syrup', amount: 15 }, { ingredientId: 'ice', amount: 4 }
  ]},
  { id: 'gin-tonic', name: 'Gin and Tonic', price: 9, ingredients: [
    { ingredientId: 'gin', amount: 45 }, { ingredientId: 'tonic', amount: 120 },
    { ingredientId: 'lime-juice', amount: 10 }, { ingredientId: 'ice', amount: 5 }
  ]},
  { id: 'vodka-soda', name: 'Vodka Soda', price: 7.5, ingredients: [
    { ingredientId: 'vodka', amount: 45 }, { ingredientId: 'soda', amount: 120 },
    { ingredientId: 'lime-juice', amount: 10 }, { ingredientId: 'ice', amount: 5 }
  ]}
];

export const MODIFIERS: Modifier[] = [
  { id: 'extra-lime', label: 'with extra lime', add: { ingredientId: 'lime-juice', amount: 15 } },
  { id: 'less-sugar', label: 'with less sugar', removeIngredientId: 'sugar-syrup' },
  { id: 'no-ice', label: 'without ice', removeIngredientId: 'ice' }
];

export const STARTING_INVENTORY = INGREDIENTS.map((item) => ({
  ingredientId: item.id,
  amount: item.unit === 'ml' ? 400 : 20
}));
