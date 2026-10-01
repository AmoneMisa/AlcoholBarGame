// The human side of a guest: how they feel, how much they like the bartender tonight, how much they have drunk,
// whether they want to talk, and what they need. The old `mood` (calm, wealthy, VIP…) still drives money and
// patience; this adds feelings and a life, so the same drink order can start a very different conversation.

export type Emotion = 'happy' | 'upset' | 'angry' | 'tired' | 'excited' | 'lonely' | 'nervous' | 'relaxed';
export const EMOTIONS: Emotion[] = ['happy', 'upset', 'angry', 'tired', 'excited', 'lonely', 'nervous', 'relaxed'];
export const EMOTION_LABEL: Record<Emotion, string> = {
  happy: 'Happy', upset: 'Upset', angry: 'Angry', tired: 'Tired', excited: 'Excited', lonely: 'Lonely', nervous: 'Nervous', relaxed: 'Relaxed'
};
export const EMOTION_ICON: Record<Emotion, string> = {
  happy: '😊', upset: '😢', angry: '😠', tired: '😴', excited: '🤩', lonely: '🥺', nervous: '😬', relaxed: '😌'
};

// What the guest's life is about tonight; it decides which stories they tell.
export type TalkTopic = 'work' | 'relationship' | 'money' | 'family' | 'sports' | 'celebration' | 'travel' | 'health' | 'weather';
export const TALK_TOPICS: TalkTopic[] = ['work', 'relationship', 'money', 'family', 'sports', 'celebration', 'travel', 'health', 'weather'];

export type Gender = 'f' | 'm' | 'x';

// Something the guest is waiting for the bartender to do.
export type NeedKind = 'ashtray' | 'taxi' | 'water' | 'chat';
export interface GuestNeed { kind: NeedKind; since: number; ignored?: boolean }

// A guest sits in one of two phases: waiting to be served, or enjoying the drink until they want another.
export type GuestPhase = 'ordering' | 'enjoying';

export interface GuestSocial {
  emotion: Emotion;
  /** 0–100: how much the guest likes the bartender tonight. Kindness raises it, rudeness lowers it. */
  rapport: number;
  /** 0–100 alcohol level. Under 25 sober, under 50 tipsy, under 75 drunk, above that very drunk. */
  drunk: number;
  /** Wants to talk before (or instead of) ordering. */
  chatty: boolean;
  topic: TalkTopic;
  /** The guest has already told the story behind their mood. */
  told?: boolean;
  gender: Gender;
  phase: GuestPhase;
  /** When an enjoying guest wants the next drink. */
  nextOrderAt: number;
  /** Drinks served so far, and how many more rounds the guest plans to stay for. */
  rounds: number;
  staysFor: number;
  need?: GuestNeed;
  /** 'given' while the guest has an ashtray on the bar; it turns dirty when they leave. */
  ashtray?: 'given';
  /** The bartender refused more alcohol; asking again makes the guest angrier. */
  refused?: boolean;
  /** Set when the bartender has called a taxi: when it arrives, the guest leaves. */
  taxiAt?: number;
  /** Topics already talked about, so small talk does not repeat itself. */
  chatted: string[];
  /** An open special situation (medical, danger, advice…); see sim/situations.ts. */
  event?: GuestEvent;
  /** Hungry guests are glad to be offered food. */
  hungry?: boolean;
  /** A hidden allergy: serving the food it hides in starts a medical emergency unless the guest said so first. */
  allergy?: 'nuts' | 'dairy';
  allergyKnown?: boolean;
  /** What the guest is drinking now, for pairing food with it. */
  lastDrink?: { recipeId?: string; productId?: string };
  ate?: string[];
  /** Drinks counted towards a promotion tonight. */
  promo?: { drinks: number; wine: number };
  /** An offer in progress: another drink or some food, and how the dialogue has changed the chance. */
  pitch?: Pitch;
  /** When the last offer was refused (a short pause before the next one) and how many were made this round. */
  pitchedAt?: number;
  pitchTries?: number;
}

// Special situations have their own small state machine; `kind` selects the rules that run them.
export interface GuestEvent {
  kind: string;
  stage: number;
  startedAt: number;
  /** Free data for the situation (what hurts, what has been tried…). */
  data: Record<string, string | number | boolean>;
}

// Offering something (another drink, food) is a chance the bartender can improve by talking to the guest.
export interface Pitch {
  kind: 'drink' | 'food';
  itemId: string;
  /** Change to the chance from what the bartender has said so far. */
  bonus: number;
  /** Which kinds of sales talk were already used (each counts once). */
  used: string[];
  /** 0 = full price, 1 = free (a sample on the house). */
  discount: number;
}

export type DrunkStage = 'sober' | 'tipsy' | 'drunk' | 'very-drunk';
export const drunkStage = (level: number): DrunkStage => level < 25 ? 'sober' : level < 50 ? 'tipsy' : level < 75 ? 'drunk' : 'very-drunk';
export const DRUNK_LABEL: Record<DrunkStage, string> = { sober: 'Sober', tipsy: 'Tipsy', drunk: 'Drunk', 'very-drunk': 'Very drunk' };

export const clampPercent = (value: number) => Math.max(0, Math.min(100, Math.round(value)));
