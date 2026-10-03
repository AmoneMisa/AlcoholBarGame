import { CHARACTER_ART } from '../../data/cosmetics/artCatalog';
import { FOODS } from '../foods';
import type { Customer, Mood } from '../types';
import { clampPercent, type Emotion, type Gender, type GuestSocial, type TalkTopic } from './model';

// Rolls a guest's feelings and life story when they walk in. Everything takes a random function, so the server's
// seeded clock decides, and old saved guests get a stable personality from their id.

type Weighted<T> = [T, number][];
function weighted<T>(options: Weighted<T>, random: () => number): T {
  const total = options.reduce((sum, [, weight]) => sum + weight, 0);
  let roll = random() * total;
  for (const [value, weight] of options) { roll -= weight; if (roll < 0) return value; }
  return options[0]![0];
}

// The old business mood hints at how the guest feels, but never fully decides it.
const EMOTIONS_BY_MOOD: Record<Mood, Weighted<Emotion>> = {
  sad: [['upset', 6], ['lonely', 2.5], ['tired', 1.5]],
  impatient: [['angry', 5], ['tired', 2.5], ['nervous', 2.5]],
  angry: [['angry', 8], ['upset', 2]],
  tired: [['tired', 8], ['relaxed', 2]],
  friendly: [['happy', 5], ['excited', 3], ['relaxed', 2]],
  calm: [['relaxed', 4], ['tired', 3], ['lonely', 1.5], ['happy', 1.5]],
  wealthy: [['happy', 3.5], ['relaxed', 3.5], ['excited', 3]],
  shy: [['nervous', 5], ['lonely', 5]],
  confused: [['nervous', 6], ['tired', 4]],
  vip: [['relaxed', 5], ['happy', 5]]
};

const CHATTY: Record<Emotion, number> = { lonely: .8, excited: .6, upset: .55, happy: .45, relaxed: .35, nervous: .3, angry: .25, tired: .2 };
const START_RAPPORT: Record<Emotion, number> = { angry: 30, upset: 40, nervous: 48, tired: 50, lonely: 55, relaxed: 60, happy: 65, excited: 70 };

const TOPICS_BY_EMOTION: Record<Emotion, Weighted<TalkTopic>> = {
  angry: [['work', 4], ['relationship', 2], ['money', 3], ['family', 2], ['sports', 1.5]],
  upset: [['relationship', 4], ['work', 3], ['family', 3], ['money', 2], ['health', 2], ['sports', 1]],
  tired: [['work', 5], ['family', 2], ['health', 2], ['travel', 1], ['weather', 1]],
  nervous: [['relationship', 3], ['work', 3], ['health', 3], ['travel', 1]],
  lonely: [['relationship', 3], ['family', 3], ['work', 2], ['weather', 1]],
  excited: [['celebration', 4], ['sports', 3], ['travel', 3], ['work', 2], ['relationship', 2]],
  happy: [['celebration', 3], ['sports', 2], ['travel', 2], ['weather', 2], ['work', 2], ['relationship', 2]],
  relaxed: [['travel', 3], ['weather', 3], ['sports', 2], ['family', 2], ['work', 1]]
};

// How many more drinks the guest plans to stay for after the first one.
const STAYS: Record<Emotion, Weighted<number>> = {
  lonely: [[1, 3], [2, 4], [3, 3]], excited: [[0, 2], [1, 4], [2, 3], [3, 1]], happy: [[0, 3], [1, 4], [2, 3]], relaxed: [[0, 4], [1, 4], [2, 2]],
  upset: [[0, 4], [1, 4], [2, 2]], nervous: [[0, 6], [1, 4]], tired: [[0, 7], [1, 3]], angry: [[0, 7], [1, 3]]
};

export function genderOf(characterId?: string): Gender {
  const presentation = CHARACTER_ART.find((art) => art.id === characterId)?.presentation;
  return presentation === 'female' ? 'f' : presentation === 'male' ? 'm' : 'x';
}

// A small deterministic random generator for guests that were saved before feelings existed.
export function seededRandom(text: string) {
  let hash = 2166136261;
  for (let index = 0; index < text.length; index++) hash = Math.imul(hash ^ text.charCodeAt(index), 16777619);
  return () => {
    hash = Math.imul(hash ^ (hash >>> 15), 2246822507);
    hash = Math.imul(hash ^ (hash >>> 13), 3266489909);
    return ((hash ^= hash >>> 16) >>> 0) / 4294967296;
  };
}

export interface RollOptions {
  arrivesDrunk?: number;
  /** Added to the chance a guest arrives already drunk (events: student night, a big match). */
  drunkChance?: number;
  /** Extra weight for some feelings (events: a big match makes guests excited or angry). */
  emotionWeights?: Partial<Record<Emotion, number>>;
  chattyBonus?: number;
  extraStays?: number;
}

export function rollSocial(customer: Pick<Customer, 'id' | 'mood' | 'characterId' | 'smoker'>, now: number, random: () => number, options: RollOptions = {}): GuestSocial {
  const table: Weighted<Emotion> = [...(EMOTIONS_BY_MOOD[customer.mood] ?? EMOTIONS_BY_MOOD.calm)];
  for (const [emotion, weight] of Object.entries(options.emotionWeights ?? {}) as [Emotion, number][]) {
    const existing = table.find(([name]) => name === emotion);
    if (existing) existing[1] += weight; else table.push([emotion, weight]);
  }
  const emotion = weighted(table, random);
  // About one guest in eleven walks in already drunk — and then tends to want company and one more.
  const drunk = options.arrivesDrunk ?? (random() < .09 + (options.drunkChance ?? 0) ? 30 + Math.floor(random() * 45) : 0);
  const rapport = clampPercent(START_RAPPORT[emotion] + (random() - .5) * 16);
  const social: GuestSocial = {
    emotion,
    rapport,
    drunk,
    chatty: random() < CHATTY[emotion] + (drunk >= 30 ? .25 : 0) + (options.chattyBonus ?? 0),
    topic: weighted(TOPICS_BY_EMOTION[emotion], random),
    gender: genderOf(customer.characterId),
    phase: 'ordering',
    nextOrderAt: 0,
    rounds: 0,
    staysFor: weighted(STAYS[emotion], random) + (drunk >= 50 ? 1 : 0) + (options.extraStays ?? 0),
    hungry: random() < .28 + (drunk >= 30 ? .2 : 0),
    allergy: random() < .05 ? (random() < .6 ? 'nuts' : 'dairy') : undefined,
    chatted: []
  };
  // Smokers often ask for an ashtray as soon as they sit down.
  if (customer.smoker && random() < .45) social.need = { kind: 'ashtray', since: now };
  if (social.hungry) {
    const kind = (['specific', 'recommend', 'choice'] as const)[Math.min(2, Math.floor(random() * 3))]!;
    social.foodRequest = { kind, itemId: kind === 'specific' ? FOODS[Math.min(FOODS.length - 1, Math.floor(random() * FOODS.length))]!.id : undefined };
    social.need ??= { kind:'food', since:now };
  }
  return social;
}

// Guests saved before feelings existed get a stable personality from their id.
export function ensureSocial(customer: Customer, now: number): GuestSocial {
  customer.social ??= rollSocial(customer, now, seededRandom(customer.id), { arrivesDrunk: 0 });
  if (customer.social.hungry && !customer.social.foodRequest) {
    const random = seededRandom(`${customer.id}:food-request`);
    const kind = (['specific','recommend','choice'] as const)[Math.floor(random() * 3)]!;
    customer.social.foodRequest = {kind, itemId:kind === 'specific' ? FOODS[Math.floor(random() * FOODS.length)]!.id : undefined};
  }
  return customer.social;
}
