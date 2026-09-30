import type { Ingredient } from './types';

// Storeroom rules. Every ingredient has a capacity per bar, and fresh produce spoils a little every day.
// The back-bar fridge raises capacity (+10% per level) and slows spoilage (-1.2 points per level, none at level 10).
export const CAPACITY_BASE = { ml: 5000, piece: 120 } as const;
export const CAPACITY_PER_FRIDGE_LEVEL = .1;
export const SPOIL_BASE_RATE = .12;
export const SPOIL_PER_FRIDGE_LEVEL = .012;
// Spoilage only starts once the bar is established; a brand-new bar never loses stock.
export const SPOIL_START_LEVEL = 3;
export const SPOIL_MAX_DAYS = 7;

export const isPerishable = (ingredient: Pick<Ingredient, 'id' | 'category'>) =>
  ingredient.category === 'fruit' || ingredient.category === 'herb' || ingredient.id === 'milk' || ingredient.id === 'coconut-milk';
export const capacityFor = (ingredient: Pick<Ingredient, 'unit'>, fridgeLevel: number) =>
  Math.round(CAPACITY_BASE[ingredient.unit] * (1 + CAPACITY_PER_FRIDGE_LEVEL * fridgeLevel));
export const spoilRate = (fridgeLevel: number) => Math.max(0, SPOIL_BASE_RATE - SPOIL_PER_FRIDGE_LEVEL * fridgeLevel);
// Whole units lost in one day: small stock is never touched (floor), so tiny reserves survive.
export const spoiledAmount = (amount: number, fridgeLevel: number) => Math.floor(amount * spoilRate(fridgeLevel));
