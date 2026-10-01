import type { Emotion } from './social/model';
import type { SituationCategory } from './situations/types';

// Events at one bar for an hour or two: promotions and the mood of the night. Unlike the city events (progression.ts)
// they change who walks in, what they feel, what they order, how long they stay and what they pay.

export interface BarEventEffects {
  /** Multiplies the wait for the next guest (below 1 = busier). */
  arrival?: number;
  /** Multiplies what guests pay for a drink. */
  pay?: number;
  /** Added to the tip chance. */
  tipChance?: number;
  /** Added to the chance a guest says yes to another drink or to food. */
  drinkChance?: number;
  foodChance?: number;
  /** Share of arriving guests who are women (otherwise random). */
  womenShare?: number;
  /** Extra drinks guests plan to stay for. */
  stays?: number;
  /** More guests arrive already drunk, or chatty. */
  drunkChance?: number;
  chatty?: number;
  /** Shifts how guests feel when they walk in. */
  emotions?: Partial<Record<Emotion, number>>;
  /** Share of guests who come for sealed bottles / a brand pour (higher or lower than usual). */
  bottleShare?: number;
  serveShare?: number;
  /** Multiplies how often each kind of situation happens. */
  situations?: Partial<Record<SituationCategory, number>>;
}

// A promotion that gives something away.
export type Promo =
  | { kind: 'nth-free'; n: number; women?: boolean; text: string }
  | { kind: 'every-nth-gift'; n: number; text: string }
  | { kind: 'combo-gift'; drinks: number; match: 'wine'; foodId: string; text: string };

export interface BarEventDef {
  id: string;
  title: string;
  icon: string;
  description: string;
  /** How long it lasts, in minutes. */
  minutes: [number, number];
  weight: number;
  effects: BarEventEffects;
  promo?: Promo;
  mood: 'good' | 'busy' | 'quiet' | 'risky';
}

export const BAR_EVENTS: BarEventDef[] = [
  { id: 'ladies-night', title: 'Ladies’ night', icon: '💃', mood: 'good', weight: 4, minutes: [90, 150],
    description: 'More women come in tonight, and every third cocktail is free for them.',
    effects: { womenShare: .75, arrival: .8, drinkChance: .05, chatty: .15 },
    promo: { kind: 'nth-free', n: 3, women: true, text: 'Every third cocktail is free for women.' } },
  { id: 'seventh-gift', title: 'Buy six, the seventh is a gift', icon: '🎁', mood: 'good', weight: 4, minutes: [90, 180],
    description: 'Guests who keep ordering are rewarded: every seventh drink is a gift. Guests stay longer.',
    effects: { stays: 1, drinkChance: .12, arrival: .9 },
    promo: { kind: 'every-nth-gift', n: 7, text: 'Every seventh drink is a gift.' } },
  { id: 'wine-cheese', title: 'Wine and cheese', icon: '🧀', mood: 'good', weight: 3, minutes: [90, 150],
    description: 'Three glasses of wine bring a cheese plate as a gift. Guests like to talk and linger.',
    effects: { stays: 1, foodChance: .12, chatty: .2, emotions: { relaxed: 2, happy: 1 } },
    promo: { kind: 'combo-gift', drinks: 3, match: 'wine', foodId: 'cheese-plate', text: 'Three glasses of wine: a cheese plate is a gift.' } },
  { id: 'happy-hour', title: 'Happy hour', icon: '🍻', mood: 'busy', weight: 5, minutes: [60, 120],
    description: 'Drinks are 20% cheaper. The bar fills up fast.',
    effects: { pay: .8, arrival: .55, tipChance: -.05, drinkChance: .08, drunkChance: .05 } },
  { id: 'student-night', title: 'Student night', icon: '🎓', mood: 'risky', weight: 2, minutes: [90, 150],
    description: 'Young, loud and short of money: lower prices, lots of guests, more people already drunk.',
    effects: { pay: .75, arrival: .5, drunkChance: .12, chatty: .2, emotions: { excited: 3, happy: 1 }, situations: { threat: 1.4, breakage: 1.4, payment: 1.4 } } },
  { id: 'whisky-wednesday', title: 'Whisky night', icon: '🥃', mood: 'good', weight: 2, minutes: [90, 150],
    description: 'Whisky lovers arrive: more bottle and brand orders, and they pay a little more.',
    effects: { pay: 1.1, bottleShare: .5, serveShare: .5, arrival: .9, tipChance: .05 } },
  { id: 'jazz-night', title: 'Jazz night', icon: '🎷', mood: 'quiet', weight: 3, minutes: [90, 180],
    description: 'Live jazz: guests are relaxed, stay longer and enjoy a good chat.',
    effects: { pay: 1.1, stays: 1, chatty: .25, arrival: 1.1, tipChance: .08, emotions: { relaxed: 3, lonely: 1 }, situations: { threat: .5 } } },
  { id: 'football-night', title: 'Big match on TV', icon: '⚽', mood: 'risky', weight: 3, minutes: [90, 130],
    description: 'A big football match: a crowd of loud fans. They drink fast, cheer, and sometimes argue.',
    effects: { arrival: .55, drunkChance: .1, drinkChance: .1, foodChance: .08, tipChance: .05, emotions: { excited: 4, angry: 2, upset: 1 }, situations: { threat: 1.8, breakage: 1.6 } } },
  { id: 'date-night', title: 'Date night', icon: '💘', mood: 'good', weight: 2, minutes: [90, 150],
    description: 'Couples and first dates: nervous, romantic guests who like to share food.',
    effects: { foodChance: .12, drinkChance: .05, emotions: { nervous: 3, excited: 2, happy: 2 }, chatty: .15, situations: { good: 1.6 } } },
  { id: 'quiet-night', title: 'A quiet night', icon: '🌙', mood: 'quiet', weight: 4, minutes: [90, 150],
    description: 'Few guests tonight. Use the time to talk to the ones who came.',
    effects: { arrival: 1.5, chatty: .2, stays: 1, emotions: { lonely: 2, tired: 1 } } },
  { id: 'tourist-night', title: 'Tourists in town', icon: '🧳', mood: 'busy', weight: 3, minutes: [90, 180],
    description: 'Visitors from abroad: they pay well and often pay with foreign cards or money.',
    effects: { pay: 1.12, arrival: .8, tipChance: .06, situations: { payment: 1.8, good: 1.3 } } },
  { id: 'birthday-rush', title: 'Birthday evening', icon: '🎂', mood: 'good', weight: 2, minutes: [90, 150],
    description: 'Several birthday groups tonight. Celebrate with them!',
    effects: { arrival: .75, emotions: { excited: 3, happy: 3 }, situations: { good: 2 }, foodChance: .08 } },
  { id: 'rainy-evening', title: 'Rainy evening', icon: '🌧️', mood: 'quiet', weight: 3, minutes: [60, 150],
    description: 'Rain outside: fewer guests, but those who come stay and warm up with a drink.',
    effects: { arrival: 1.35, stays: 1, emotions: { tired: 2, lonely: 1 }, chatty: .1 } },
  { id: 'inspection-week', title: 'Inspection week', icon: '🕵️', mood: 'risky', weight: 1, minutes: [120, 240],
    description: 'Inspectors are in the area: follow every rule, and check ID for everyone.',
    effects: { situations: { payment: 1.3, good: 1.5 } } }
];

export const barEventById = (id: string) => BAR_EVENTS.find((event) => event.id === id);
