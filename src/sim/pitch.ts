import { RECIPES, REGIONS } from '../domain/catalog';
import { buildProfile } from '../domain/conversation/customerTalk';
import { coins } from '../domain/economy';
import { FOODS, foodById, type FoodDef } from '../domain/foods';
import type { Customer } from '../domain/types';
import { ensureSocial } from '../domain/social/generate';
import { clampPercent, type Pitch } from '../domain/social/model';
import { PITCH_EFFECT, pitchLine, type PitchAct } from '../domain/social/pitchActs';
import { situationById } from '../domain/situations/catalog';
import { goodAmount } from './stockQuality';
import { startSituation } from './situations';
import { barEventFor } from './events';
import type { PlayerState } from './state';
import { MINUTE } from '../domain/time';

// Offering something to a guest: another drink or some food. There is a chance of a "yes", shown to the player with
// the reasons behind it, and what the bartender says while offering raises or lowers it (a drink's story, a
// discount or a free taste help; pushing hurts). Food also pairs with the drink the guest has.

const PAUSE_AFTER_NO = 2 * MINUTE;
const MAX_TRIES = 2;

const EMOTION_MOOD: Record<string, number> = { happy: .08, excited: .08, relaxed: .04, lonely: .06, tired: -.06, upset: -.04, angry: -.18, nervous: -.02 };

export interface ChancePart { label: string; value: number }
export interface PitchChance { chance: number; parts: ChancePart[]; price: number }

const ALLERGENS: Record<'nuts' | 'dairy', string[]> = { nuts: ['nuts', 'chocolate'], dairy: ['cheese-plate', 'nachos', 'garlic-bread', 'chocolate'] };
export const allergenOf = (foodId: string) => (Object.keys(ALLERGENS) as ('nuts' | 'dairy')[]).find((kind) => ALLERGENS[kind].includes(foodId));

const priceFactorOf = (state: PlayerState, guest: Customer) => guest.priceFactor ?? REGIONS.find((region) => region.id === state.regionId)?.marketFactor ?? 1;

export function pairingScore(food: FoodDef, guest: Customer) {
  const recipeId = guest.social?.lastDrink?.recipeId;
  const recipe = recipeId ? RECIPES.find((item) => item.id === recipeId) : undefined;
  if (!recipe) return { score: 0, labels: [] as string[] };
  const traits = buildProfile(recipe).traits;
  const shared = food.pairs.filter((trait) => traits.has(trait as never));
  const spirit = recipe.ingredients.map((part) => part.ingredientId);
  const classic = food.classic.some((family) => spirit.some((id) => id.includes(family)) || recipe.name.toLowerCase().includes(family));
  return { score: Math.min(1, shared.length / 2 + (classic ? .35 : 0)), labels: [...shared, ...(classic ? ['a classic partner'] : [])] };
}

export function priceOf(state: PlayerState, guest: Customer, pitch: Pitch) {
  const factor = priceFactorOf(state, guest) * (1 - pitch.discount);
  if (pitch.kind === 'food') return coins((foodById(pitch.itemId)?.price ?? 0) * factor);
  return coins((RECIPES.find((item) => item.id === pitch.itemId)?.price ?? 0) * factor);
}

export function pitchChance(state: PlayerState, guest: Customer, now: number): PitchChance | undefined {
  const social = ensureSocial(guest, now);
  const pitch = social.pitch;
  if (!pitch) return undefined;
  const event = barEventFor(state, now);
  const parts: ChancePart[] = [{ label: pitch.kind === 'drink' ? 'Another drink' : 'Food', value: pitch.kind === 'drink' ? .42 : .48 }];
  const add = (label: string, value: number) => { if (Math.abs(value) >= .005) parts.push({ label, value }); };
  add('How much they like you', (social.rapport - 50) * .004);
  add(`They feel ${social.emotion}`, EMOTION_MOOD[social.emotion] ?? 0);
  const price = priceOf(state, guest, pitch);
  if (pitch.kind === 'drink') {
    const recipe = RECIPES.find((item) => item.id === pitch.itemId);
    add('Alcohol', social.drunk >= 75 ? -.30 : social.drunk >= 50 ? -.05 : social.drunk >= 25 ? .05 : 0);
    if (recipe && social.lastDrink?.recipeId === recipe.id) add('They already had this drink', -.12);
    else if (recipe) {
      const facts = state.conversations[guest.id]?.facts ?? [];
      const traits = buildProfile(recipe).traits;
      const liked = facts.filter((fact) => fact.likes && traits.has(fact.topic)).length;
      add(liked ? 'It matches what they like' : 'Something new', liked ? .1 : .04);
    }
    add('The price', price > (guest.budget || 12) * 1.2 ? -.15 : price < (guest.budget || 12) * .6 ? .05 : 0);
  } else {
    const food = foodById(pitch.itemId);
    if (social.hungry) add('They are hungry', .25);
    add('Food with alcohol', social.drunk >= 25 ? .08 : 0);
    if (food) {
      const pairing = pairingScore(food, guest);
      add(pairing.score >= .5 ? `Pairs well with their drink (${pairing.labels.slice(0, 2).join(', ')})` : 'Pairing', pairing.score * .12);
    }
    add('The price', price <= 8 ? .04 : price > 12 ? -.05 : 0);
  }
  add('Already asked this round', -.1 * (social.pitchTries ?? 0));
  add('What you said', pitch.bonus);
  add(event?.title ?? 'Tonight’s event', pitch.kind === 'food' ? event?.effects.foodChance ?? 0 : event?.effects.drinkChance ?? 0);
  const chance = Math.max(.03, Math.min(.95, parts.reduce((sum, part) => sum + part.value, 0)));
  return { chance, parts, price };
}

export function startPitch(state: PlayerState, guest: Customer, kind: 'drink' | 'food', itemId: string, now: number): string | undefined {
  const social = ensureSocial(guest, now);
  if (social.event) return 'Deal with the situation first.';
  if (kind === 'drink') {
    if (social.phase !== 'enjoying') return 'Offer another drink while the guest enjoys the last one.';
    if (!RECIPES.some((item) => item.id === itemId) || !state.knownRecipeIds.includes(itemId)) return 'You do not know this recipe yet.';
  } else {
    const food = foodById(itemId);
    if (!food) return 'This is not on the menu.';
    if (goodAmount(state, itemId) < 1) return `You have no ${food.name.toLowerCase()} in stock.`;
    if (social.allergyKnown && social.allergy && allergenOf(itemId) === social.allergy) return `${guest.name} told you they are allergic to this.`;
  }
  if ((social.pitchTries ?? 0) >= MAX_TRIES) return `${guest.name} has said no twice. Try again after the next drink.`;
  if (social.pitchedAt && now - social.pitchedAt < PAUSE_AFTER_NO) return 'Give the guest a moment before you ask again.';
  social.pitch = { kind, itemId, bonus: 0, used: [], discount: 0 };
  return undefined;
}

// What the bartender says while offering counts once for each kind of talk.
export function adjustPitch(guest: Customer, acts: PitchAct[], seed: string): { text: string; expression: (typeof PITCH_EFFECT)[PitchAct]['expression']; rapport: number } | undefined {
  const pitch = guest.social?.pitch;
  if (!pitch || !acts.length) return undefined;
  let reply: ReturnType<typeof adjustPitch>;
  for (const act of acts) {
    if (pitch.used.includes(act)) continue;
    pitch.used.push(act);
    const effect = PITCH_EFFECT[act];
    pitch.bonus += effect.bonus;
    if (effect.discount !== undefined) pitch.discount = Math.max(pitch.discount, effect.discount);
    reply ??= { text: pitchLine(act, seed), expression: effect.expression, rapport: effect.rapport };
  }
  return reply;
}

export function cancelPitch(guest: Customer) { if (guest.social) delete guest.social.pitch; }

// ---- The answer ----
export interface PitchResult { accepted: boolean; text: string; kind: 'drink' | 'food'; itemId: string; violation?: boolean }

export function askPitch(state: PlayerState, guest: Customer, now: number, random: () => number): PitchResult {
  const social = ensureSocial(guest, now);
  const pitch = social.pitch;
  const chance = pitchChance(state, guest, now);
  if (!pitch || !chance) throw new Error('There is no offer to make.');
  social.pitchTries = (social.pitchTries ?? 0) + 1;
  const accepted = random() < chance.chance;
  delete social.pitch;
  if (!accepted) {
    social.pitchedAt = now;
    social.rapport = clampPercent(social.rapport - (pitch.used.includes('push') ? 8 : 3));
    return { accepted: false, kind: pitch.kind, itemId: pitch.itemId, text: social.drunk >= 75 ? 'No… no more for me. I feel a bit strange.' : 'No, thank you. Maybe later.' };
  }
  if (pitch.kind === 'drink') return acceptDrink(state, guest, pitch, chance.price, now);
  return acceptFood(state, guest, pitch, chance.price, now);
}

function acceptDrink(state: PlayerState, guest: Customer, pitch: Pitch, price: number, now: number): PitchResult {
  const social = ensureSocial(guest, now);
  const recipe = RECIPES.find((item) => item.id === pitch.itemId)!;
  guest.orderRecipeId = recipe.id;
  guest.modifierId = undefined;
  guest.orderKind = 'cocktail';
  guest.serveRequest = undefined;
  guest.request = `Yes, why not? I will try ${recipe.name}.`;
  guest.orderRevealed = true;
  guest.budget = Math.max(price, recipe.price) + 4;
  guest.patienceRemaining = guest.patience;
  guest.priceFactor = priceFactorOf(state, guest) * (1 - pitch.discount);
  social.phase = 'ordering';
  social.rapport = clampPercent(social.rapport + (pitch.discount >= 1 ? 10 : 6));
  state.activeCustomerId = guest.id;
  state.xp += 4;
  const violation = social.drunk >= 75;
  if (violation) { state.ruleViolations = (state.ruleViolations ?? 0) + 1; state.popularity = Math.max(0, state.popularity - 1); }
  state.message = violation ? `${guest.name} will have ${recipe.name}. But the guest is very drunk: serving more alcohol breaks the house rule.` : `${guest.name} will have ${recipe.name}. Make it!`;
  return { accepted: true, kind: 'drink', itemId: recipe.id, violation, text: guest.request };
}

function acceptFood(state: PlayerState, guest: Customer, pitch: Pitch, price: number, now: number): PitchResult {
  const social = ensureSocial(guest, now);
  const food = foodById(pitch.itemId)!;
  const stock = state.inventories[state.regionId].find((item) => item.ingredientId === food.id);
  if (!stock || stock.amount < 1) return { accepted: false, kind: 'food', itemId: food.id, text: 'Oh, you have run out? Never mind.' };
  stock.amount -= 1;
  const pairing = pairingScore(food, guest);
  const total = coins(price * (1 + pairing.score * .15));
  state.money = coins(state.money + total);
  (social.ate ??= []).push(food.id);
  social.hungry = false;
  social.drunk = clampPercent(social.drunk - 8);
  social.rapport = clampPercent(social.rapport + 4 + (pairing.score >= .5 ? 6 : 0) + (pitch.discount >= 1 ? 6 : 0));
  state.xp += 3 + (pairing.score >= .5 ? 2 : 0);
  state.message = `${guest.name} enjoys the ${food.name.toLowerCase()}${pairing.score >= .5 ? ' — a great pairing' : ''}. +${total.toFixed(2)} coins.`;
  // A hidden allergy and the wrong food: a medical emergency, unless the guest had said so.
  const allergen = allergenOf(food.id);
  if (allergen && social.allergy === allergen) {
    const def = situationById('med-allergy');
    if (def) {
      startSituation(state, guest, def, now, () => .5);
      state.message = `${guest.name} reacts to the ${food.name.toLowerCase()}! Act fast.`;
    }
  }
  return { accepted: true, kind: 'food', itemId: food.id, text: pairing.score >= .5 ? 'Mmm! That goes so well with my drink. Thank you!' : 'Mmm, thank you. That is just what I needed.' };
}

export { FOODS };
