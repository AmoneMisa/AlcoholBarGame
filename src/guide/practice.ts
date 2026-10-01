import { trainingById, type TrainingEvent } from '../domain/training';
import { bottleSelector, freshSelector, selector, type PointerSpec } from './pointer';

// What the practice should point at next. A pure function of what the player has done and what is on the screen
// (given as plain values), so it is easy to test. It returns the one-line instruction and the pointer candidates.

export interface PracticeContext {
  moduleId: string;
  seen: TrainingEvent[];
  /** The practice guest is at the bar. */
  guestHere: boolean;
  /** The conversation window is open. */
  convOpen: boolean;
  /** The drink the practice guest ordered. */
  recipe?: { name: string; needsShake: boolean; ingredients: { id: string; name: string; amount: number }[] };
  mix: { id: string; amount: number }[];
  shaken: boolean;
  /** How many words are already in the sentence being built. */
  placedWords: number;
  /** Is the bar (service) screen showing? */
  onBar: boolean;
  onMarket: boolean;
}

export interface PracticePointer { instruction: string; candidates: PointerSpec[] }

const tap = (target: string, label: string, extra: Partial<PointerSpec> = {}): PointerSpec => ({ target, gesture: 'tap', label, ...extra });
const article = (name: string) => (/^[aeiou]/i.test(name) ? 'an' : 'a');

export function practicePointer(ctx: PracticeContext): PracticePointer | undefined {
  const module = trainingById(ctx.moduleId);
  const needs = module?.practice?.needs ?? [];
  const next = needs.find((need) => !ctx.seen.includes(need));
  if (!module || !next) return undefined;

  if (next === 'bought' || next === 'toppedUp') {
    if (!ctx.onMarket) return { instruction: 'Open the Market tab.', candidates: [tap(selector('nav-market'), '{Tap} Market')] };
    if (next === 'bought') return {
      instruction: 'Add a pack with + and press Place order.',
      candidates: [tap('[data-guide="market-order"]:not(:disabled)', '{Tap} Place order'), tap(selector('market-plus'), '{Tap} + to add one pack to your order')]
    };
    return { instruction: 'Press Top up low stock.', candidates: [tap(selector('top-up'), '{Tap} Top up: it orders everything that is low')] };
  }

  const wantsGuest = ['asked', 'confirmed', 'water', 'ashtray', 'offered', 'situationSolved'].includes(next);
  if (wantsGuest && ctx.guestHere && !ctx.convOpen) {
    return { instruction: 'Tap the practice guest.', candidates: [tap(selector('practice-guest'), '{Tap} the practice guest to open the conversation')] };
  }

  if (next === 'asked') return {
    instruction: 'Ask a question: build one from the words and press Check & send.',
    candidates: [
      tap(selector('talk-send') + ':not(:disabled)', '{Tap} Check & send', { when: () => ctx.placedWords >= 3 }),
      tap(`${selector('tile-bank')} .word-tile:not(:disabled)`, '{Tap} the words one by one to build a question, e.g. “Do you like sweet drinks?”'),
      tap(selector('phrase-idea'), '{Tap} a ready question to ask it'),
      { target: selector('talk-input'), gesture: 'type', label: 'Type a question, e.g. “Do you like sweet drinks?”' }
    ]
  };

  if (next === 'confirmed') {
    const name = ctx.recipe?.name ?? 'the drink';
    const sentence = `Would you like ${article(name)} ${name}?`;
    return {
      instruction: `Name the drink: “${sentence}”`,
      candidates: [
        tap(selector('talk-send') + ':not(:disabled)', '{Tap} Check & send', { when: () => ctx.placedWords >= 3 }),
        tap(`${selector('tile-bank')} .word-tile:not(:disabled)`, `{Tap} “${name}”, then build “${sentence}”`, { hasText: name }),
        tap(selector('new-question'), `{Tap} New question until the word “${name}” appears`),
        { target: selector('talk-input'), gesture: 'type', label: `Type: ${sentence}` }
      ]
    };
  }

  if (next === 'water') return { instruction: 'Press the Water button.', candidates: [tap(selector('give-water'), '{Tap} Water')] };
  if (next === 'ashtray') return { instruction: 'Press the Ashtray button.', candidates: [tap(selector('give-ashtray'), '{Tap} Ashtray')] };
  if (next === 'offered') return {
    instruction: 'Press Offer, choose something, then Make the offer.',
    candidates: [tap(selector('offer-ask'), '{Tap} Make the offer'), tap(selector('offer-item'), '{Tap} something to offer'), tap(selector('offer-open'), '{Tap} Offer')]
  };
  if (next === 'situationSolved') return { instruction: 'Choose a polite answer.', candidates: [tap(selector('situation-choice'), '{Tap} a polite answer')] };

  // 'served': close the conversation, pour every ingredient, shake if the recipe asks for it, serve.
  if (ctx.convOpen) return { instruction: 'Close the conversation to reach the bar.', candidates: [tap(selector('talk-close'), '{Tap} ✕ to go back to the bar')] };
  const recipe = ctx.recipe;
  const back = tap(selector('nav-service'), '{Tap} Bar', { when: () => !ctx.onBar });
  if (!ctx.onBar || !recipe) return { instruction: 'Go to the bar.', candidates: [back] };
  const missing = recipe.ingredients.find((part) => (ctx.mix.find((item) => item.id === part.id)?.amount ?? 0) < part.amount);
  if (missing) {
    const poured = ctx.mix.find((item) => item.id === missing.id)?.amount ?? 0;
    const left = missing.amount - poured;
    return {
      instruction: `Add ${missing.name}: ${missing.amount} in all.`,
      candidates: [
        tap(freshSelector(missing.id), `{Tap} ${missing.name}`),
        { target: bottleSelector(missing.id), to: selector('glass'), gesture: 'drag', label: `Drag ${missing.name} onto the glass and hold to pour (${left} more)` },
        tap(selector('fresh-plus'), `{Tap} + and choose ${missing.name}`)
      ]
    };
  }
  if (recipe.needsShake && !ctx.shaken) return { instruction: 'Press Shake.', candidates: [tap(selector('shake'), '{Tap} Shake')] };
  return { instruction: 'Press Serve drink.', candidates: [tap(selector('serve'), '{Tap} Serve drink')] };
}
