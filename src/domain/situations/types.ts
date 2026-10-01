import type { RegionId } from '../types';
import type { Emotion } from '../social/model';

// Situations are small scripts that happen to a guest: a payment problem, a broken glass, a medical emergency, a
// threat, good news. Each has stages. At each stage the guest says something and the bartender picks (or types) an
// English reply; the reply has weighted outcomes that change money, popularity, the guest's feelings and what comes
// next. Because every reply is real English, playing a situation is also a lesson (see situations/learning.ts).

export type SituationCategory = 'payment' | 'breakage' | 'threat' | 'security' | 'medical' | 'good' | 'advice' | 'delivery';

// How good the bartender's answer is: used for the feedback, the XP and the learning cards.
export type Tone = 'good' | 'ok' | 'bad' | 'rude';

export type Payment = 'cash' | 'card' | 'qr' | 'iban' | 'uzcard' | 'humo' | 'visa' | 'amex' | 'union' | 'usd' | 'eur';

export interface Effects {
  /** Coins that reach (positive) or leave (negative) the bar's cash. */
  money?: number;
  /** The share (0–1) of the held bill that is paid; 'have' means what the guest has with them. */
  paid?: number | 'have';
  /** The guest owes this share (0–1) of the held bill and it is written on the tab; 'rest' means what is not paid. */
  owes?: number | 'rest';
  xp?: number;
  popularity?: number;
  /** Change in how much the guest likes the bartender. */
  rapport?: number;
  emotion?: Emotion;
  crystals?: number;
  /** The guest leaves the bar. */
  leave?: boolean;
  /** The guest's alcohol level changes (negative = they sober up). */
  drunk?: number;
  /** An item is lost: a glass, a bottle, a stool… (coins). */
  breakage?: number;
  /** Starts another situation straight away (a cut hand after broken glass, a fight after a threat). */
  spawn?: string;
  /** A short note for the message line. */
  note?: string;
  /** The bar broke a rule (served a minor, accepted cash where only cards are allowed…). Inspectors count these. */
  violation?: number;
  /** The guest stays and the drink is made again (a complaint about a bad drink). */
  remake?: boolean;
  /** A guest who owed money pays the oldest tab back, with a small tip. */
  settleTab?: boolean;
  /** The inspector's visit clears the record. */
  resetViolations?: boolean;
  /** Marks the situation as resolved well, badly or neutrally for the statistics. */
  result?: 'solved' | 'failed' | 'neutral';
}

export interface SituationContext {
  region: RegionId;
  /** What the held bill is worth (payment situations) or what the guest is carrying in coins. */
  amount: number;
  random: () => number;
  rapport: number;
  drunk: number;
  emotion: Emotion;
  /** What the guest wants to buy: a cocktail, a sealed bottle or a brand pour. */
  orderKind?: string;
  /** Free data stored with the situation. */
  data: Record<string, string | number | boolean>;
  accepts: (payment: Payment) => boolean;
}

export interface Outcome {
  /** Relative chance; a function can look at the guest, the region and the data. */
  weight?: number | ((context: SituationContext) => number);
  say: string;
  effects: Effects;
  /** The next stage; leave undefined to end the situation. */
  next?: number;
}

export interface Choice {
  id: string;
  /** The English sentence the bartender says. */
  say: string;
  /** Other ways of typing the same idea that count as this choice. */
  match?: RegExp;
  tone: Tone;
  /** What the learner should remember about this answer. */
  tip?: string;
  outcomes: Outcome[];
  requires?: (context: SituationContext) => boolean;
}

export interface Stage {
  /** What the guest says as this stage begins. */
  guest: string;
  choices: Choice[];
}

export interface SituationDef {
  id: string;
  category: SituationCategory;
  title: string;
  icon: string;
  /** 1 = a small thing, 2 = needs care, 3 = an emergency. */
  severity: 1 | 2 | 3;
  /** How often it is picked among the situations that apply. */
  weight: number;
  applies?: (context: SituationContext) => boolean;
  stages: Stage[];
  /** When the situation can start: as a guest arrives, while they enjoy a drink, or when they pay the bill. */
  triggers: ('arrival' | 'enjoying' | 'payment')[];
  /** Minutes before doing nothing counts as an answer, and what that answer is. */
  timeoutMin: number;
  ignored: Outcome;
  /** Words worth learning, shown in the lesson cards. */
  vocab?: string[];
  /** Sets up the data for a new situation (the amount to pay, what is broken). */
  setup?: (context: SituationContext) => Record<string, string | number | boolean>;
  /** Payment situations hold the guest's bill until they are resolved. */
  holdsPayment?: boolean;
}
