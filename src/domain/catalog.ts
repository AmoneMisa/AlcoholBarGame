import type { Ingredient, Modifier, Recipe, Region, Supplier } from './types';
import { ADDITIONAL_RECIPES } from './additionalRecipes';

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
  { id: 'bitter-aperitif', name: 'Bitter aperitif', unit: 'ml', basePrice: 0.046, pourStep: 15, category: 'spirit' },
  { id: 'sparkling-wine', name: 'Sparkling wine', unit: 'ml', basePrice: 0.042, pourStep: 30, category: 'spirit' },
  { id: 'coffee-liqueur', name: 'Coffee liqueur', unit: 'ml', basePrice: 0.044, pourStep: 15, category: 'spirit' },
  { id: 'blue-curacao', name: 'Blue Curaçao', unit: 'ml', basePrice: 0.040, pourStep: 5, category: 'spirit' },
  { id: 'herbal-liqueur', name: 'Herbal liqueur', unit: 'ml', basePrice: 0.052, pourStep: 5, category: 'spirit' },
  { id: 'specialty-liqueur', name: 'Specialty liqueur', unit: 'ml', basePrice: 0.045, pourStep: 5, category: 'spirit' },
  { id: 'fruit-wine', name: 'Fruit wine', unit: 'ml', basePrice: 0.022, pourStep: 15, category: 'spirit' },
  { id: 'alcohol-free-beer', name: 'Alcohol-free beer', unit: 'ml', basePrice: 0.010, pourStep: 30, category: 'mixer' },
  { id: 'lime-juice', name: 'Lime', unit: 'ml', basePrice: 0.012, pourStep: 5, category: 'fruit' },
  { id: 'lemon-juice', name: 'Lemon', unit: 'ml', basePrice: 0.012, pourStep: 5, category: 'fruit' },
  { id: 'pineapple-juice', name: 'Pineapple', unit: 'ml', basePrice: 0.008, pourStep: 30, category: 'fruit' },
  { id: 'cranberry-juice', name: 'Cranberry', unit: 'ml', basePrice: 0.009, pourStep: 30, category: 'fruit' },
  { id: 'sugar-syrup', name: 'Sugar', unit: 'ml', basePrice: 0.006, pourStep: 5, category: 'mixer' },
  { id: 'coconut-cream', name: 'Coconut cream', unit: 'ml', basePrice: 0.012, pourStep: 15, category: 'mixer' },
  { id: 'milk', name: 'Milk', unit: 'ml', basePrice: 0.006, pourStep: 5, category: 'mixer' },
  { id: 'coconut-milk', name: 'Coconut milk', unit: 'ml', basePrice: 0.010, pourStep: 5, category: 'mixer' },
  { id: 'tonic', name: 'Tonic', unit: 'ml', basePrice: 0.006, pourStep: 30, category: 'mixer' },
  { id: 'soda', name: 'Soda water', unit: 'ml', basePrice: 0.004, pourStep: 30, category: 'mixer' },
  { id: 'cola', name: 'Cola', unit: 'ml', basePrice: 0.005, pourStep: 30, category: 'mixer' },
  { id: 'ginger-beer', name: 'Ginger beer', unit: 'ml', basePrice: 0.008, pourStep: 30, category: 'mixer' },
  { id: 'grapefruit-soda', name: 'Grapefruit soda', unit: 'ml', basePrice: 0.008, pourStep: 30, category: 'mixer' },
  { id: 'mint', name: 'Mint', unit: 'piece', basePrice: 0.030, pourStep: 2, category: 'herb' },
  { id: 'ice', name: 'Ice', unit: 'piece', basePrice: 0.010, pourStep: 1, category: 'garnish' },
  { id: 'lime-wedge', name: 'Fresh lime', unit: 'piece', basePrice: 0.18, pourStep: 1, category: 'fruit' },
  { id: 'orange', name: 'Fresh orange', unit: 'piece', basePrice: 0.22, pourStep: 1, category: 'fruit' },
  { id: 'pineapple-wedge', name: 'Pineapple wedge', unit: 'piece', basePrice: 0.24, pourStep: 1, category: 'fruit' },
  { id: 'salt', name: 'Bar salt', unit: 'piece', basePrice: 0.04, pourStep: 1, category: 'garnish' }
];

export const RECIPES: Recipe[] = [
  { id: 'mojito', name: 'Mojito', price: 9.5, needsShake: false, category: 'classic',
    origin: 'Havana, Cuba · early 20th century',
    story: 'A bright Cuban highball descended from rum, lime and mint punches. Its long, icy build made it a natural warm-weather favorite.',
    tastingNotes: ['fresh', 'citrusy', 'herbal', 'sparkling'], occasions: ['Hot evening', 'Easy conversation', 'First-time guest', 'Long session'],
    method: ['Gently press the mint with lime and syrup.', 'Add rum and fill the glass with ice.', 'Top with soda and lift the mint through the drink.', 'Garnish with a fresh lime wedge.'], ingredients: [
    { ingredientId: 'white-rum', amount: 45 }, { ingredientId: 'lime-juice', amount: 20 },
    { ingredientId: 'mint', amount: 6 }, { ingredientId: 'sugar-syrup', amount: 10 },
    { ingredientId: 'soda', amount: 90 }, { ingredientId: 'ice', amount: 5 }, { ingredientId: 'lime-wedge', amount: 1 }
  ]},
  { id: 'daiquiri', name: 'Daiquiri', price: 8.5, needsShake: true, category: 'classic',
    origin: 'Cuba · turn of the 20th century',
    story: 'A compact rum sour named for the Cuban town of Daiquirí. The classic version is clean and restrained rather than frozen or oversized.',
    tastingNotes: ['sharp', 'clean', 'rum-forward'], occasions: ['Aperitif', 'Classic drinker', 'Quick round', 'Warm night'],
    method: ['Chill a coupe glass.', 'Add rum, lime and syrup to a shaker with ice.', 'Shake hard until cold.', 'Fine-strain into the chilled glass.'], ingredients: [
    { ingredientId: 'white-rum', amount: 45 }, { ingredientId: 'lime-juice', amount: 25 },
    { ingredientId: 'sugar-syrup', amount: 15 }, { ingredientId: 'ice', amount: 4 }
  ]},
  { id: 'margarita', name: 'Margarita', price: 10, needsShake: true, category: 'classic',
    origin: 'Mexico / United States · 1930s–1940s',
    story: 'The tequila member of the sour family balances agave, orange liqueur and lime. Several origin stories compete, but the structure became a modern classic.',
    tastingNotes: ['tart', 'agave', 'citrus', 'saline'], occasions: ['Celebration', 'Spicy food', 'Lively group', 'Aperitif'],
    method: ['Run lime around half the rim and apply salt.', 'Add tequila, orange liqueur and lime to a shaker with ice.', 'Shake until well chilled.', 'Strain over fresh ice or serve up.'], ingredients: [
    { ingredientId: 'tequila', amount: 45 }, { ingredientId: 'orange-liqueur', amount: 20 },
    { ingredientId: 'lime-juice', amount: 20 }, { ingredientId: 'ice', amount: 4 }, { ingredientId: 'salt', amount: 1 }
  ]},
  { id: 'pina-colada', name: 'Piña Colada', price: 11, needsShake: true, category: 'cocktail',
    origin: 'Puerto Rico · mid-20th century',
    story: 'Puerto Rico’s celebrated tropical drink brings rum together with pineapple and coconut for a rich, transportive serve.',
    tastingNotes: ['creamy', 'tropical', 'sweet'], occasions: ['Vacation mood', 'Dessert drink', 'Relaxed guest', 'Celebration'],
    method: ['Add rum, pineapple, coconut cream and ice to the shaker.', 'Shake longer than usual to integrate the cream.', 'Pour into a chilled hurricane glass.', 'Finish with a pineapple wedge.'], ingredients: [
    { ingredientId: 'white-rum', amount: 45 }, { ingredientId: 'pineapple-juice', amount: 90 },
    { ingredientId: 'coconut-cream', amount: 30 }, { ingredientId: 'ice', amount: 5 }, { ingredientId: 'pineapple-wedge', amount: 1 }
  ]},
  { id: 'cosmopolitan', name: 'Cosmopolitan', price: 10.5, needsShake: true, category: 'cocktail',
    origin: 'United States · 1980s',
    story: 'A modern pink sour that became a late-20th-century icon. Cranberry softens the citrus while keeping the serve crisp and elegant.',
    tastingNotes: ['crisp', 'berry', 'citrusy'], occasions: ['Stylish night out', 'Celebration', 'Photo-friendly serve', 'Aperitif'],
    method: ['Chill a cocktail glass.', 'Add vodka, orange liqueur, cranberry, lime and ice.', 'Shake briskly until cold.', 'Fine-strain and express orange over the surface.'], ingredients: [
    { ingredientId: 'vodka', amount: 45 }, { ingredientId: 'orange-liqueur', amount: 15 },
    { ingredientId: 'cranberry-juice', amount: 30 }, { ingredientId: 'lime-juice', amount: 10 }, { ingredientId: 'ice', amount: 4 }, { ingredientId: 'orange', amount: 1 }
  ]},
  { id: 'old-fashioned', name: 'Old Fashioned', price: 12, needsShake: false, category: 'classic',
    origin: 'United States · 19th century',
    story: 'The name asks for a cocktail made in the old manner: spirit, sugar, bitters and water. It is a patient, spirit-led drink rather than a sweet one.',
    tastingNotes: ['rich', 'spirit-forward', 'aromatic'], occasions: ['After dinner', 'Slow conversation', 'Whiskey fan', 'Quiet evening'],
    method: ['Add syrup and whiskey to a rocks glass.', 'Add a large piece of ice.', 'Stir slowly until chilled and diluted.', 'Express an orange peel and place it in the glass.'], ingredients: [
    { ingredientId: 'whiskey', amount: 45 }, { ingredientId: 'sugar-syrup', amount: 10 }, { ingredientId: 'ice', amount: 3 }, { ingredientId: 'orange', amount: 1 }
  ]},
  { id: 'martini', name: 'Martini', price: 11.5, needsShake: false, category: 'classic',
    origin: 'United States · late 19th century',
    story: 'Few drinks are as adaptable or debated. At its core, the Martini is a cold, precise conversation between gin and dry vermouth.',
    tastingNotes: ['dry', 'botanical', 'silky'], occasions: ['Formal evening', 'Aperitif', 'Classic drinker', 'Focused conversation'],
    method: ['Chill a martini glass.', 'Add gin, vermouth and ice to a mixing glass.', 'Stir until very cold and properly diluted.', 'Strain and garnish according to the guest’s preference.'], ingredients: [
    { ingredientId: 'gin', amount: 60 }, { ingredientId: 'vermouth', amount: 20 }, { ingredientId: 'ice', amount: 4 }
  ]},
  { id: 'whiskey-sour', name: 'Whiskey Sour', price: 10.5, needsShake: true, category: 'classic',
    origin: 'United States · 19th century',
    story: 'A foundational sour: whiskey, citrus and sugar. It keeps the warmth of the spirit while adding lift and approachability.',
    tastingNotes: ['balanced', 'citrusy', 'warming'], occasions: ['Unsure guest', 'Comfort drink', 'Food pairing', 'Cool evening'],
    method: ['Add whiskey, lemon, syrup and ice to a shaker.', 'Shake firmly until chilled.', 'Strain over fresh ice.', 'Garnish with an orange slice.'], ingredients: [
    { ingredientId: 'whiskey', amount: 45 }, { ingredientId: 'lemon-juice', amount: 25 },
    { ingredientId: 'sugar-syrup', amount: 15 }, { ingredientId: 'ice', amount: 4 }, { ingredientId: 'orange', amount: 1 }
  ]},
  { id: 'long-island', name: 'Long Island', price: 13, needsShake: true, category: 'cocktail',
    origin: 'Long Island, New York · 1970s',
    story: 'A high-energy multi-spirit highball whose color recalls iced tea. Despite the name, no tea is required.',
    tastingNotes: ['strong', 'citrusy', 'cola'], occasions: ['Experienced guest', 'One-drink order', 'Late night', 'High-energy group'],
    method: ['Add the spirits, liqueur, lemon and ice to a shaker.', 'Shake briefly to chill.', 'Strain into an ice-filled highball.', 'Top with cola and stir once.'], ingredients: [
    { ingredientId: 'vodka', amount: 15 }, { ingredientId: 'gin', amount: 15 }, { ingredientId: 'white-rum', amount: 15 },
    { ingredientId: 'tequila', amount: 15 }, { ingredientId: 'orange-liqueur', amount: 10 },
    { ingredientId: 'lemon-juice', amount: 20 }, { ingredientId: 'cola', amount: 60 }, { ingredientId: 'ice', amount: 5 }
  ]},
  { id: 'gin-tonic', name: 'Gin & Tonic', price: 9, needsShake: false, category: 'classic',
    origin: 'British India · 19th century', story: 'A crisp highball built around botanical gin and bitter tonic, lengthened over ice for a bright and uncomplicated serve.',
    tastingNotes: ['botanical', 'bitter', 'refreshing'], occasions: ['Easy order', 'Warm evening', 'Aperitif', 'Long conversation'],
    method: ['Fill a highball with ice.', 'Add gin.', 'Top slowly with tonic.', 'Garnish with fresh lime.'], ingredients: [
      { ingredientId: 'gin', amount: 45 }, { ingredientId: 'tonic', amount: 90 }, { ingredientId: 'ice', amount: 5 }, { ingredientId: 'lime-wedge', amount: 1 }
  ]},
  { id: 'negroni', name: 'Negroni', price: 13, needsShake: false, category: 'classic',
    origin: 'Florence, Italy · early 20th century', story: 'An equal-parts Italian aperitivo balancing gin, bitter aperitif and vermouth. Bold bitterness and orange aromatics make it unmistakable.',
    tastingNotes: ['bitter', 'botanical', 'orange'], occasions: ['Aperitivo', 'Experienced guest', 'Slow sip', 'Before dinner'],
    method: ['Add gin, bitter aperitif and vermouth to a mixing glass.', 'Stir with ice until chilled.', 'Strain over a large cube.', 'Finish with orange.'], ingredients: [
      { ingredientId: 'gin', amount: 30 }, { ingredientId: 'bitter-aperitif', amount: 30 }, { ingredientId: 'vermouth', amount: 30 }, { ingredientId: 'ice', amount: 3 }, { ingredientId: 'orange', amount: 1 }
  ]},
  { id: 'mai-tai', name: 'Mai Tai', price: 14, needsShake: true, category: 'cocktail',
    origin: 'California · 1940s', story: 'A layered rum sour from the golden age of tiki, designed to showcase rum through lime, orange and almond-like sweetness.',
    tastingNotes: ['tropical', 'nutty', 'rum-forward'], occasions: ['Tiki night', 'Celebration', 'Adventurous guest', 'Summer party'],
    method: ['Add rums, orange liqueur, lime and syrup to a shaker.', 'Shake with ice.', 'Pour over crushed ice.', 'Crown with mint and lime.'], ingredients: [
      { ingredientId: 'white-rum', amount: 30 }, { ingredientId: 'dark-rum', amount: 30 }, { ingredientId: 'orange-liqueur', amount: 15 }, { ingredientId: 'lime-juice', amount: 25 }, { ingredientId: 'sugar-syrup', amount: 10 }, { ingredientId: 'ice', amount: 5 }, { ingredientId: 'mint', amount: 2 }
  ]},
  { id: 'french-75', name: 'French 75', price: 14, needsShake: true, category: 'classic',
    origin: 'France · early 20th century', story: 'A sparkling gin sour with celebratory energy: brisk citrus underneath a lively crown of bubbles.',
    tastingNotes: ['sparkling', 'dry', 'citrusy'], occasions: ['Celebration', 'Brunch', 'Elegant guest', 'Welcome drink'],
    method: ['Shake gin, lemon and syrup with ice.', 'Strain into a flute.', 'Top with sparkling wine.', 'Garnish lightly with citrus.'], ingredients: [
      { ingredientId: 'gin', amount: 30 }, { ingredientId: 'lemon-juice', amount: 15 }, { ingredientId: 'sugar-syrup', amount: 10 }, { ingredientId: 'sparkling-wine', amount: 60 }, { ingredientId: 'ice', amount: 3 }
  ]},
  { id: 'moscow-mule', name: 'Moscow Mule', price: 11, needsShake: false, category: 'cocktail',
    origin: 'Los Angeles · 1940s', story: 'A snappy vodka highball famous for ginger heat, lime brightness and its cold copper-mug presentation.',
    tastingNotes: ['gingery', 'zesty', 'sparkling'], occasions: ['Casual group', 'Warm day', 'Vodka fan', 'Food pairing'],
    method: ['Fill a mug or highball with ice.', 'Add vodka and lime.', 'Top with ginger beer.', 'Stir briefly and garnish with lime.'], ingredients: [
      { ingredientId: 'vodka', amount: 45 }, { ingredientId: 'lime-juice', amount: 15 }, { ingredientId: 'ginger-beer', amount: 90 }, { ingredientId: 'ice', amount: 5 }, { ingredientId: 'lime-wedge', amount: 1 }
  ]},
  { id: 'espresso-martini', name: 'Espresso Martini', price: 14, needsShake: true, category: 'cocktail',
    origin: 'London · 1980s', story: 'A modern after-dinner cocktail combining vodka, coffee liqueur and sweetness beneath a dense aromatic foam.',
    tastingNotes: ['coffee', 'rich', 'energizing'], occasions: ['After dinner', 'Late night', 'Coffee lover', 'Dessert alternative'],
    method: ['Add vodka, coffee liqueur and syrup to a shaker.', 'Fill with ice and shake very hard.', 'Fine-strain into a chilled coupe.', 'Allow the foam to settle before serving.'], ingredients: [
      { ingredientId: 'vodka', amount: 45 }, { ingredientId: 'coffee-liqueur', amount: 30 }, { ingredientId: 'sugar-syrup', amount: 10 }, { ingredientId: 'ice', amount: 5 }
  ]},
  { id: 'paloma', name: 'Paloma', price: 11.5, needsShake: false, category: 'cocktail',
    origin: 'Mexico · mid-20th century', story: 'A relaxed tequila highball where grapefruit bitterness and citrus acidity make the spirit feel bright and refreshing.',
    tastingNotes: ['grapefruit', 'tart', 'refreshing'], occasions: ['Hot afternoon', 'Spicy food', 'Casual guest', 'Outdoor table'],
    method: ['Salt part of the rim if requested.', 'Fill a highball with ice.', 'Add tequila and lime.', 'Top with grapefruit soda and stir once.'], ingredients: [
      { ingredientId: 'tequila', amount: 45 }, { ingredientId: 'lime-juice', amount: 15 }, { ingredientId: 'grapefruit-soda', amount: 90 }, { ingredientId: 'ice', amount: 5 }, { ingredientId: 'salt', amount: 1 }
  ]},
  ...ADDITIONAL_RECIPES
];

const INGREDIENT_ABV: Record<string, number> = {
  'white-rum': 40, 'dark-rum': 40, gin: 40, vodka: 40, tequila: 40, whiskey: 40,
  'orange-liqueur': 25, vermouth: 16, 'bitter-aperitif': 25, 'sparkling-wine': 12, 'coffee-liqueur': 20,
  'blue-curacao': 21, 'herbal-liqueur': 38, 'specialty-liqueur': 22, 'fruit-wine': 10
};

/** Approximate serving strength after normal shaking/stirring dilution. */
export function estimateRecipeAbv(recipe: Recipe) {
  const liquid = recipe.ingredients.reduce((sum, part) => sum + (INGREDIENTS.find((item) => item.id === part.ingredientId)?.unit === 'ml' ? part.amount : 0), 0);
  if (!liquid) return 0;
  const alcohol = recipe.ingredients.reduce((sum, part) => sum + part.amount * (INGREDIENT_ABV[part.ingredientId] ?? 0), 0);
  const dilution = recipe.needsShake ? .82 : .9;
  return Math.round((alcohol / liquid) * dilution);
}

export function recipeAlcoholLabel(recipe: Recipe) {
  const abv = estimateRecipeAbv(recipe);
  const strength = abv === 0 ? 'Alcohol-free' : abv <= 12 ? 'Light' : abv <= 22 ? 'Medium' : 'Strong';
  return abv === 0 ? strength : `~${abv}% ABV · ${strength}`;
}

export const MODIFIERS: Modifier[] = [
  { id: 'extra-lime', label: 'Extra lime, please', add: { ingredientId: 'lime-juice', amount: 10 } },
  { id: 'no-ice', label: 'No ice, please', removeIngredientId: 'ice' }
];

export const SUPPLIERS: Supplier[] = [
  { id: 'global', name: 'Global Drinks Co.', description: 'Reliable spirits & mixers', deliveryDays: 3, reputation: 4, deliveryFee: 8, freeDeliveryAt: 100, icon: 'truck' },
  { id: 'local', name: 'Local Market', description: 'Budget produce & mixers', deliveryDays: 5, reputation: 3, deliveryFee: 4, freeDeliveryAt: 45, icon: 'basket' },
  { id: 'premium', name: 'Premium Spirits', description: 'Premium bottles, fast route', deliveryDays: 2, reputation: 5, deliveryFee: 12, freeDeliveryAt: 150, icon: 'bottle' },
  { id: 'fresh', name: 'Fresh & Green', description: 'Fresh fruit, herbs & mixers', deliveryDays: 2, reputation: 4, deliveryFee: 5, freeDeliveryAt: 60, icon: 'leaf' }
];

export const STARTING_INVENTORY = INGREDIENTS.map((item) => ({
  ingredientId: item.id,
  amount: item.unit === 'ml' ? 360 : item.id === 'ice' ? 45 : 18
}));
