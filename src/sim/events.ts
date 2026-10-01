import { INGREDIENTS } from '../domain/catalog';
import { BAR_EVENTS, barEventById, type BarEventDef, type Promo } from '../domain/barEvents';
import { foodById } from '../domain/foods';
import type { Customer, Recipe } from '../domain/types';
import { ensureSocial } from '../domain/social/generate';
import { clampPercent } from '../domain/social/model';
import { goodAmount } from './stockQuality';
import type { PlayerState } from './state';
import { MINUTE } from '../domain/time';

// Events at the bar (domain/barEvents.ts): which one is on now, when the next starts, and what a promotion gives away.

export interface ActiveBarEvent { id: string; startedAt: number; endsAt: number }

export function barEventFor(state: PlayerState, now: number): (BarEventDef & { endsAt: number }) | undefined {
  const active = state.barEvent;
  const def = active && active.endsAt > now ? barEventById(active.id) : undefined;
  return def && active ? { ...def, endsAt: active.endsAt } : undefined;
}

// Starts and ends events on the server clock. Returns a note for the message line when something changed.
export function tickBarEvent(state: PlayerState, now: number, random: () => number): string | undefined {
  const active = state.barEvent;
  if (active && active.endsAt <= now) {
    state.barEvent = undefined;
    state.nextBarEventAt = now + Math.round((20 + random() * 70) * MINUTE);
    return `The ${barEventById(active.id)?.title.toLowerCase() ?? 'event'} is over.`;
  }
  if (state.barEvent) return undefined;
  if (state.nextBarEventAt === undefined) { state.nextBarEventAt = now + Math.round((10 + random() * 30) * MINUTE); return undefined; }
  if (now < state.nextBarEventAt) return undefined;
  // Not every pause ends with an event; sometimes the evening is just an evening.
  if (random() < .25) { state.nextBarEventAt = now + Math.round((20 + random() * 40) * MINUTE); return undefined; }
  const options = BAR_EVENTS.filter((event) => event.id !== state.lastBarEventId);
  const total = options.reduce((sum, event) => sum + event.weight, 0);
  let roll = random() * total;
  const picked = options.find((event) => (roll -= event.weight) < 0) ?? options[0]!;
  const minutes = picked.minutes[0] + random() * (picked.minutes[1] - picked.minutes[0]);
  state.barEvent = { id: picked.id, startedAt: now, endsAt: now + Math.round(minutes * MINUTE) };
  state.lastBarEventId = picked.id;
  state.nextBarEventAt = undefined;
  return `Tonight: ${picked.icon} ${picked.title}. ${picked.description}`;
}

const WINE = ['sparkling-wine', 'fruit-wine'];
export const isWineDrink = (recipe: Recipe) => recipe.ingredients.some((part) => WINE.includes(part.ingredientId));

export interface PromoResult { free: boolean; notes: string[] }

// Counts a drink towards the promotion that is on and says whether this one is free (or brings a gift).
export function applyPromo(state: PlayerState, guest: Customer, recipe: Recipe, now: number): PromoResult {
  const result: PromoResult = { free: false, notes: [] };
  const event = barEventFor(state, now);
  const promo: Promo | undefined = event?.promo;
  if (!event || !promo) return result;
  const social = ensureSocial(guest, now);
  if (promo.kind === 'nth-free') {
    if (promo.women && social.gender !== 'f') return result;
    const count = (social.promo ??= { drinks: 0, wine: 0 }).drinks + 1;
    social.promo.drinks = count;
    if (count % promo.n === 0) { result.free = true; result.notes.push(`${event.title}: this ${count === 3 ? 'third' : `${count}th`} cocktail is free for ${guest.name}!`); }
  } else if (promo.kind === 'every-nth-gift') {
    const key = guest.characterId ?? guest.id;
    const counts = (state.loyalty ??= {});
    counts[key] = (counts[key] ?? 0) + 1;
    if (counts[key]! >= promo.n) { counts[key] = 0; result.free = true; result.notes.push(`${event.title}: ${guest.name} gets this drink as a gift. Well done!`); }
    else if (counts[key] === promo.n - 1) result.notes.push(`${guest.name} is one drink away from a free one.`);
  } else if (promo.kind === 'combo-gift' && isWineDrink(recipe)) {
    const bag = (social.promo ??= { drinks: 0, wine: 0 });
    bag.wine++;
    if (bag.wine >= promo.drinks) {
      bag.wine = 0;
      const food = foodById(promo.foodId);
      const stock = state.inventories[state.regionId].find((item) => item.ingredientId === promo.foodId);
      if (food && stock && goodAmount(state, promo.foodId) >= 1) {
        stock.amount -= 1;
        (social.ate ??= []).push(food.id);
        social.hungry = false;
        social.rapport = clampPercent(social.rapport + 8);
        result.notes.push(`${event.title}: ${guest.name} gets ${food.name.toLowerCase()} as a gift!`);
      } else result.notes.push(`${event.title}: ${guest.name} earned a gift, but you have no ${INGREDIENTS.find((item) => item.id === promo.foodId)?.name.toLowerCase() ?? 'food'} left.`);
    }
  }
  return result;
}
