import type { Customer } from '../types';
import { genderOf } from './generate';
import { fnvHash as hash } from '../text';

// Where a guest comes from and who they are, worked out from their look (so the same person always sounds the same):
// the way they spell, how fast they talk, a few local words (always written in English letters), and what their
// voice is like: a woman or a man, young, adult or old.

export type AgeGroup = 'young' | 'adult' | 'old';

export interface Origin {
  id: string;
  name: string;
  /** The device voice language that fits the accent best. */
  lang: string;
  spelling: 'us' | 'uk';
  /** How fast people from there talk, next to a typical speaker (1). */
  speed: number;
  /** Short words said at the start of a sentence. */
  openers: string[];
  /** A local remark that may follow a sentence. */
  remarks: string[];
}

export const ORIGINS: Origin[] = [
  { id: 'us', name: 'American', lang: 'en-US', spelling: 'us', speed: 1.05, openers: ['Hey buddy,', 'Alright,', 'Man,'], remarks: ['That is like ten bucks, right?', 'Awesome, dude.'] },
  { id: 'uk', name: 'British', lang: 'en-GB', spelling: 'uk', speed: 1, openers: ['Cheers,', 'Right then,', 'Alright mate,'], remarks: ['Lovely stuff.', 'It is a bit chilly out, innit?'] },
  { id: 'uz', name: 'Uzbek', lang: 'en-IN', spelling: 'uk', speed: .95, openers: ['Aka,', 'Brother,', 'Listen, friend,'], remarks: ['At home my ariston is broken again, so I came here.', 'After this I want a big plov, you know.', 'My mother makes the best non.'] },
  { id: 'de', name: 'German', lang: 'en-GB', spelling: 'uk', speed: .95, openers: ['So,', 'Well,', 'Prost,'], remarks: ['Finally Feierabend!', 'It is very gemutlich here.', 'In Berlin it is later, but okay.'] },
  { id: 'ro', name: 'Romanian', lang: 'en-GB', spelling: 'uk', speed: 1.05, openers: ['Noroc,', 'Listen,', 'Hey,'], remarks: ['At home we drink tuica with everything.', 'My grandmother says one glass is nothing.'] },
  { id: 'jp', name: 'Japanese', lang: 'en-US', spelling: 'us', speed: .88, openers: ['Sumimasen,', 'Excuse me,', 'Ah,'], remarks: ['Kampai!', 'It is like a small izakaya, I like it.'] },
  { id: 'in', name: 'Indian', lang: 'en-IN', spelling: 'uk', speed: 1.12, openers: ['Yaar,', 'Listen,', 'See,'], remarks: ['A chai after this would be perfect.', 'No problem at all, yaar.'] },
  { id: 'au', name: 'Australian', lang: 'en-AU', spelling: 'uk', speed: 1.02, openers: ['G’day,', 'Mate,', 'No worries,'], remarks: ['See you this arvo, mate.', 'She’ll be right.'] }
];

const key = (customer: Pick<Customer, 'id' | 'characterId'>) => customer.characterId ?? customer.id;

export const originOf = (customer: Pick<Customer, 'id' | 'characterId'>): Origin => ORIGINS[hash(`origin:${key(customer)}`) % ORIGINS.length]!;
export const ageGroupOf = (customer: Pick<Customer, 'id' | 'characterId'>): AgeGroup => { const roll = hash(`age:${key(customer)}`) % 10; return roll < 3 ? 'young' : roll < 8 ? 'adult' : 'old'; };

export interface GuestVoiceProfile {
  seed: string;
  gender: 'f' | 'm' | 'x';
  age: AgeGroup;
  /** 0.8–1.25: how fast this person talks. */
  speed: number;
  lang: string;
  emotion?: string;
  drunk?: number;
}

export function voiceProfileOf(customer: Customer): GuestVoiceProfile {
  const origin = originOf(customer);
  const age = ageGroupOf(customer);
  const personal = .88 + (hash(`speed:${key(customer)}`) % 25) / 100;
  const byAge = age === 'young' ? 1.1 : age === 'old' ? .82 : 1;
  return { seed: key(customer), gender: genderOf(customer.characterId), age, speed: Math.max(.7, Math.min(1.4, personal * origin.speed * byAge)), lang: origin.lang, emotion: customer.social?.emotion, drunk: customer.social?.drunk };
}

// ---- Spelling ----
const PAIRS: [string, string][] = [['colour', 'color'], ['favourite', 'favorite'], ['flavour', 'flavor'], ['neighbour', 'neighbor'], ['centre', 'center'], ['honour', 'honor'], ['realise', 'realize'], ['organise', 'organize'], ['grey', 'gray'], ['litre', 'liter'], ['theatre', 'theater'], ['whisky', 'whiskey'], ['programme', 'program']];
const matchCase = (from: string, to: string) => from[0] === from[0]!.toUpperCase() ? to[0]!.toUpperCase() + to.slice(1) : to;

export function spellFor(origin: Origin, text: string) {
  let result = text;
  for (const [uk, us] of PAIRS) {
    const [from, to] = origin.spelling === 'us' ? [uk, us] : [us, uk];
    result = result.replace(new RegExp(`\\b${from}(s?)\\b`, 'gi'), (match, plural: string) => matchCase(match, to) + plural);
  }
  return result;
}

// Spelling, and now and then a local word at the start or the end, so people from different places do not all talk alike.
export function localize(customer: Pick<Customer, 'id' | 'characterId' | 'social'>, text: string, turn: number) {
  const origin = originOf(customer);
  let result = spellFor(origin, text);
  const roll = hash(`${key(customer)}:${turn}:local`) % 100;
  if (roll < 14 && /^[A-Z]/.test(result) && !/^(Hmm|…)/.test(result)) {
    const opener = origin.openers[hash(`${turn}:o`) % origin.openers.length]!;
    result = `${opener} ${/^I/.test(result) ? result : result.charAt(0).toLowerCase() + result.slice(1)}`;
  } else if (roll >= 94 && /[.!]$/.test(result) && result.length < 90 && ['happy', 'relaxed', 'excited'].includes(customer.social?.emotion ?? '')) result = `${result} ${origin.remarks[hash(`${turn}:r`) % origin.remarks.length]}`;
  return result;
}
