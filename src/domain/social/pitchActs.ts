import { choose } from './talk';
import type { Expression } from './talk';

// Selling talk. While the bartender is offering something (another drink, some food), what they say changes the
// guest's willingness: telling a drink's story, praising it, offering a discount, or a free taste helps; pushing hurts.

export type PitchAct = 'story' | 'quality' | 'pairing' | 'discount' | 'free' | 'push';

const RULES: [PitchAct, RegExp][] = [
  ['free', /\b(on the house|for free|my treat|a free (taste|sample|drink|plate)|it is free|it's free)\b/i],
  ['push', /\b(you (must|have to)|come on|just buy|buy it|take it now|hurry|last chance|you need this)\b/i],
  ['discount', /\b(discount|cheaper|special price|half price|\d+ percent off|good price|better price)\b/i],
  ['pairing', /\b(goes (very |really )?well with|pairs? (very |really )?well with|perfect with|a good match|goes with)\b/i],
  ['story', /\b(history|story|invented|created|classic|famous|legend|comes from|originally|was born)\b/i],
  ['quality', /\b(delicious|best|popular|favou?rite|fresh|perfect|lovely|tasty|wonderful|everyone loves|excellent)\b/i]
];

export const pitchActsIn = (text: string): PitchAct[] => RULES.filter(([, pattern]) => pattern.test(text)).map(([act]) => act);

// How much each kind of talk moves the chance (each counts once per offer), and what the guest says.
export const PITCH_EFFECT: Record<PitchAct, { bonus: number; rapport: number; discount?: number; lines: string[]; expression: Expression }> = {
  story: { bonus: .06, rapport: 3, lines: ['Oh, that is interesting! I did not know that.', 'Ha, I like a drink with a story.'], expression: 'thinking' },
  quality: { bonus: .04, rapport: 2, lines: ['Hmm, it does sound good.', 'You make it sound delicious.'], expression: 'smile' },
  pairing: { bonus: .08, rapport: 3, lines: ['I like how you think. That sounds like a good match.', 'You know your pairings. I am impressed.'], expression: 'happy' },
  discount: { bonus: .10, rapport: 3, discount: .15, lines: ['A discount? That is nice of you.', 'Ten percent off? Now we are talking.'], expression: 'happy' },
  free: { bonus: .24, rapport: 8, discount: 1, lines: ['On the house? You are too kind!', 'A free taste? How can I say no?'], expression: 'very-happy' },
  push: { bonus: -.12, rapport: -6, lines: ['Hey, do not push me. I will decide myself.', 'Slow down. I do not like being rushed.'], expression: 'disappointed' }
};

export const pitchLine = (act: PitchAct, seed: string) => choose(PITCH_EFFECT[act].lines, seed);
