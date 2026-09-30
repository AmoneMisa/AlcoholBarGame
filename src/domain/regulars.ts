import { RECIPES } from './catalog';
import { CUSTOMER_ART_BY_SLOT } from '../data/cosmetics/artCatalog';
import type { BoxKind } from './loot';

// Regulars: every guest portrait is a person who remembers the bar. Serving them earns loyalty points;
// each loyalty level pays a reward, and their favourite drink earns a small price bonus once they are regular.
export const REGULAR_LEVELS = [3, 8, 15, 25] as const;
export const REGULAR_FAVORITE_BONUS = 1.1;
export interface RegularReward { box?: BoxKind; parts?: number; skinShards?: number; crystals?: number; }
export const REGULAR_REWARDS: RegularReward[] = [
  { box: 'bronze' },
  { parts: 8, skinShards: 5 },
  { box: 'silver', crystals: 10 },
  { box: 'choice', crystals: 25 }
];
export const REGULAR_STARTERS = 10;

export const isRegularId = (id: string) => CUSTOMER_ART_BY_SLOT.includes(id);
export function regularLevel(points: number) {
  return REGULAR_LEVELS.filter((step) => points >= step).length;
}
export function nextRegularStep(points: number) {
  return REGULAR_LEVELS.find((step) => points < step);
}
// A stable favourite among the ten starter recipes, so every player can serve it from day one.
export function favoriteRecipeId(characterId: string) {
  let hash = 0;
  for (const char of characterId) hash = (hash * 31 + char.charCodeAt(0)) >>> 0;
  return RECIPES[hash % REGULAR_STARTERS]!.id;
}
