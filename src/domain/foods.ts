import type { Ingredient } from './types';

// Food to go with the drinks, sold as separate menu items. Each portion is a stock item (category "food") bought from
// the suppliers like any ingredient, so deliveries, prices, shortages, delivery problems and haggling all apply.
// Guests may be hungry, a bartender can suggest a pairing, and promotions may give a plate away.

export interface FoodDef {
  id: string;
  name: string;
  /** What the guest pays (before the guest's price factor). */
  price: number;
  /** What a portion costs the bar. */
  cost: number;
  kind: 'snack' | 'plate' | 'hot' | 'sweet';
  /** Drink traits it goes well with (the traits used by the pairing helper: strong, sparkling, sweet, sour, bitter, fresh…). */
  pairs: string[];
  /** Spirit or drink families it is a classic partner of. */
  classic: string[];
  description: string;
  /** A short, true story for the learner. */
  story: string;
  /** How it is described on the menu. */
  menu: string;
}

export const FOODS: FoodDef[] = [
  { id: 'fries', name: 'Fried potatoes', price: 6, cost: .8, kind: 'hot', pairs: ['sparkling', 'strong', 'fresh', 'bitter'], classic: ['beer', 'whiskey', 'gin'], menu: 'Fried potatoes, hot and salty', description: 'Golden fried potatoes with salt.', story: 'Fried potatoes were sold in the streets of Belgium and France in the 1700s. Salt makes people thirsty, which is good for a bar.' },
  { id: 'garlic-bread', name: 'Garlic bread', price: 5.5, cost: .7, kind: 'hot', pairs: ['strong', 'dry', 'sour'], classic: ['wine', 'vermouth', 'tequila'], menu: 'Warm bread with garlic and butter', description: 'Warm bread with garlic butter and herbs.', story: 'Garlic bread comes from Italian bruschetta, where bread was rubbed with garlic and oil.' },
  { id: 'cheese-plate', name: 'Cheese plate', price: 12, cost: 2.4, kind: 'plate', pairs: ['dry', 'sweet', 'sparkling', 'strong'], classic: ['wine', 'whiskey', 'sparkling-wine'], menu: 'Three cheeses with nuts and fruit', description: 'Three kinds of cheese with nuts and fruit.', story: 'Cheese and wine are served together because the fat in cheese softens the sharp taste of the drink.' },
  { id: 'meat-plate', name: 'Meat plate', price: 14, cost: 3.2, kind: 'plate', pairs: ['strong', 'dry', 'bitter'], classic: ['whiskey', 'beer', 'vermouth'], menu: 'Cured meats, pickles and bread', description: 'Cured meats, pickles and bread.', story: 'Cured meat was a way to keep food for the winter. Its salt and fat love a strong, dry drink.' },
  { id: 'olives', name: 'Olives', price: 4, cost: .6, kind: 'snack', pairs: ['dry', 'strong', 'bitter'], classic: ['gin', 'vermouth', 'vodka'], menu: 'Green and black olives', description: 'Green and black olives in oil.', story: 'The Martini is famous for its olive. A salty olive makes the dry drink taste smoother.' },
  { id: 'nuts', name: 'Mixed nuts', price: 4.5, cost: .7, kind: 'snack', pairs: ['strong', 'sweet', 'bitter'], classic: ['whiskey', 'rum', 'beer'], menu: 'Warm salted nuts', description: 'Warm, salted mixed nuts.', story: 'Bars give away salty nuts because they make guests thirsty. Check for nut allergies first!' },
  { id: 'nachos', name: 'Nachos', price: 8, cost: 1.4, kind: 'hot', pairs: ['sour', 'fresh', 'sparkling'], classic: ['tequila', 'beer', 'margarita'], menu: 'Corn chips with cheese and salsa', description: 'Corn chips with melted cheese and salsa.', story: 'Nachos were invented in 1943 in northern Mexico by a head waiter called Ignacio — “Nacho” — who made a snack from what was in the kitchen.' },
  { id: 'wings', name: 'Chicken wings', price: 9, cost: 1.8, kind: 'hot', pairs: ['sparkling', 'sweet', 'fresh'], classic: ['beer', 'bourbon', 'cola'], menu: 'Hot chicken wings with a cool dip', description: 'Crispy chicken wings with a spicy sauce and a cool dip.', story: 'Buffalo wings began in 1964 in Buffalo, New York, when a bar owner fried chicken wings in hot sauce for her son and his friends.' },
  { id: 'bruschetta', name: 'Bruschetta', price: 7, cost: 1.1, kind: 'snack', pairs: ['sparkling', 'dry', 'fresh'], classic: ['sparkling-wine', 'vermouth', 'spritz'], menu: 'Toasted bread with tomato and basil', description: 'Toasted bread with tomato, garlic and basil.', story: 'Bruschetta comes from the Italian word “bruscare”, which means to roast over coals.' },
  { id: 'pretzel', name: 'Soft pretzel', price: 5, cost: .8, kind: 'snack', pairs: ['bitter', 'sparkling', 'strong'], classic: ['beer', 'whiskey'], menu: 'A warm soft pretzel with mustard', description: 'A warm soft pretzel with mustard.', story: 'Pretzels are an old German bread. The twisted shape is said to look like arms folded in prayer.' },
  { id: 'popcorn', name: 'Popcorn', price: 3.5, cost: .4, kind: 'snack', pairs: ['sweet', 'sparkling', 'fresh'], classic: ['cocktails', 'beer'], menu: 'Fresh sweet or salty popcorn', description: 'Fresh sweet or salty popcorn.', story: 'Popcorn is one of the oldest snacks in the Americas. People ate it more than 5,000 years ago.' },
  { id: 'fruit-plate', name: 'Fruit plate', price: 9, cost: 2, kind: 'plate', pairs: ['sparkling', 'sweet', 'fresh'], classic: ['sparkling-wine', 'rum', 'vodka'], menu: 'Fresh seasonal fruit', description: 'Fresh seasonal fruit, cut and ready.', story: 'Fruit is a light choice for guests who want something fresh. It goes especially well with sparkling wine.' },
  { id: 'chocolate', name: 'Chocolate bites', price: 6.5, cost: 1.2, kind: 'sweet', pairs: ['strong', 'bitter', 'creamy'], classic: ['whiskey', 'coffee', 'rum'], menu: 'Dark chocolate with sea salt', description: 'Dark chocolate squares with a little sea salt.', story: 'Dark chocolate and whiskey share smoky, bitter notes, so they seem made for each other.' },
  { id: 'edamame', name: 'Edamame', price: 5, cost: .8, kind: 'snack', pairs: ['fresh', 'sparkling', 'dry'], classic: ['sake', 'beer', 'highball'], menu: 'Warm soybeans with sea salt', description: 'Warm green soybeans with sea salt.', story: 'In Japan, edamame is the classic snack with a cold beer or a whiskey highball.' },
  { id: 'spring-rolls', name: 'Spring rolls', price: 7.5, cost: 1.3, kind: 'hot', pairs: ['fresh', 'sour', 'sparkling'], classic: ['gin', 'rum', 'cocktails'], menu: 'Crispy rolls with sweet chilli sauce', description: 'Crispy vegetable rolls with sweet chilli sauce.', story: 'Spring rolls were first eaten in China at the start of spring, to celebrate the new season.' }
];

export const foodById = (id: string) => FOODS.find((food) => food.id === id);
export const isFood = (id: string) => FOODS.some((food) => food.id === id);

// The stock items for the food: a portion is a "piece"; suppliers sell packs of twelve portions.
export const FOOD_INGREDIENTS: Ingredient[] = FOODS.map((food) => ({ id: food.id, name: food.name, unit: 'piece', basePrice: food.cost, pourStep: 1, category: 'food' }));
