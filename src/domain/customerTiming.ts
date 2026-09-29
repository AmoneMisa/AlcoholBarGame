import type { Customer, Mood } from './types';

export const CUSTOMER_ARRIVAL_MIN_MS = 5 * 60 * 1000;
export const CUSTOMER_ARRIVAL_MAX_MS = 2 * 60 * 60 * 1000;
export const VIP_CHANCE = .10;
export const VIP_RECIPE_CHANCE = .25;
export const VIP_COOLDOWN_MIN_MS = 6 * 60 * 60 * 1000;
export const VIP_COOLDOWN_MAX_MS = 12 * 60 * 60 * 1000;

const between = (minimum: number, maximum: number, random = Math.random) =>
  Math.round(minimum + (maximum - minimum) * Math.min(1, Math.max(0, random())));

export function nextCustomerArrival(now = Date.now(), random = Math.random) {
  return now + between(CUSTOMER_ARRIVAL_MIN_MS, CUSTOMER_ARRIVAL_MAX_MS, random);
}

export function nextVipAvailability(now = Date.now(), random = Math.random) {
  return now + between(VIP_COOLDOWN_MIN_MS, VIP_COOLDOWN_MAX_MS, random);
}

// The chance grows with the bar's level (see progression.ts); VIP_CHANCE is the fallback.
export function canWelcomeVip(now: number, cooldownUntil: number, random = Math.random, chance = VIP_CHANCE) {
  return now >= cooldownUntil && random() < chance;
}

export function vipCarriesRecipe(hasLockedRecipes: boolean, random = Math.random) {
  return hasLockedRecipes && random() < VIP_RECIPE_CHANCE;
}

// One shared timer covers both discovering the request and preparing it. More
// demanding orders allow extra preparation time; customer temperament then
// adjusts the same clock.
export function orderTimeSeconds(mood: Mood, kind: Customer['orderKind'] = 'cocktail') {
  const base = kind === 'bottle' ? 10 * 60 : kind === 'serve' ? 6 * 60 : 8 * 60;
  const moodFactor: Partial<Record<Mood, number>> = {
    angry: .55,
    impatient: .65,
    tired: .9,
    calm: 1.1,
    wealthy: 1.25,
    vip: 1.5
  };
  return Math.round(base * (moodFactor[mood] ?? 1));
}

export function formatCountdown(seconds: number) {
  const safe = Math.max(0, Math.ceil(seconds));
  const hours = Math.floor(safe / 3600);
  const minutes = Math.floor((safe % 3600) / 60);
  const remainder = safe % 60;
  return hours ? `${hours}h ${minutes.toString().padStart(2, '0')}m` : `${minutes}:${remainder.toString().padStart(2, '0')}`;
}
