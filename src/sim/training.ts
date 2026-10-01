import { RECIPES } from '../domain/catalog';
import { generateCustomer } from '../domain/engine';
import { TRAINING_REWARD, trainingById, type TrainingEvent } from '../domain/training';
import { rollSocial } from '../domain/social/generate';
import { situationById } from '../domain/situations/catalog';
import type { Customer } from '../domain/types';
import { MAX_SEATS } from './guests';
import { startSituation } from './situations';
import { levelFor, withUniqueLook, type PlayerState } from './state';

// The academy (domain/training.ts): starting a practice, noticing what the player has done, and the reward.
// A practice guest ("practice" flag) never pays, never brings crystals, and never has a random problem.

export interface TrainingState {
  done: string[];
  progress: Record<string, TrainingEvent[]>;
  active?: { moduleId: string; guestId?: string };
}

export const trainingOf = (state: PlayerState): TrainingState => (state.training ??= { done: [], progress: {} });
export const isPractice = (guest: Customer | undefined) => !!guest?.training;

function practiceGuest(state: PlayerState, kind: 'talk' | 'mix' | 'care' | 'offer' | 'situation', now: number, random: () => number): Customer {
  const known = RECIPES.filter((recipe) => state.knownRecipeIds.includes(recipe.id));
  const easy = known.find((recipe) => recipe.id === 'mojito') ?? known[0] ?? RECIPES[0]!;
  const guest = withUniqueLook(generateCustomer(levelFor(state.xp), [easy], 0, 1, 0), state.customers);
  guest.name = `${guest.name} (practice)`;
  guest.training = true;
  guest.mood = 'calm';
  guest.orderKind = 'cocktail';
  guest.orderRecipeId = easy.id;
  guest.modifierId = undefined;
  guest.serveRequest = undefined;
  guest.bottleRequest = undefined;
  guest.smoker = kind === 'care';
  guest.greeting = 'Hello! This is my first time here.';
  guest.patience = guest.patienceRemaining = 36_000;
  guest.budget = 30;
  guest.priceFactor = 1;
  guest.orderRevealed = kind === 'mix' || kind === 'situation';
  const social = rollSocial(guest, now, random, { arrivesDrunk: kind === 'care' ? 38 : 0 });
  Object.assign(social, { emotion: 'happy', rapport: 62, chatty: false, staysFor: kind === 'offer' ? 1 : 0, hungry: kind === 'offer', allergy: undefined, event: undefined, need: undefined, ashtray: undefined });
  guest.social = social;
  return guest;
}

export function startTraining(state: PlayerState, moduleId: string, now: number, random: () => number): string {
  const module = trainingById(moduleId);
  if (!module?.practice) throw new Error('This lesson has no practice.');
  const training = trainingOf(state);
  // Only one practice at a time.
  for (const old of state.customers.filter((guest) => guest.training)) { state.customers = state.customers.filter((guest) => guest !== old); delete state.conversations[old.id]; }
  training.progress[moduleId] = [];
  training.active = { moduleId };
  if (module.practice.guest !== 'none') {
    if (state.customers.length >= MAX_SEATS) throw new Error('All seats are taken. Wait for a guest to leave, then try again.');
    const guest = practiceGuest(state, module.practice.guest, now, random);
    state.customers.push(guest);
    state.activeCustomerId = guest.id;
    training.active.guestId = guest.id;
    if (module.practice.guest === 'situation') {
      guest.orderRevealed = true;
      const def = situationById('pay-short');
      if (def) startSituation(state, guest, def, now, () => .5, { amount: 8 });
    }
    if (module.practice.guest === 'offer') {
      // The guest has a drink in front of them already.
      guest.social!.phase = 'enjoying';
      guest.social!.lastDrink = { recipeId: guest.orderRecipeId };
      guest.orderRevealed = true;
      for (const food of ['fries', 'cheese-plate']) { const stock = state.inventories[state.regionId].find((item) => item.ingredientId === food); if (stock && stock.amount < 2) stock.amount = 2; }
    }
  }
  state.message = `Practice: ${module.title}. ${module.practice.hint}`;
  return state.message;
}

export function endTraining(state: PlayerState) {
  const training = trainingOf(state);
  for (const guest of state.customers.filter((item) => item.training)) { delete state.conversations[guest.id]; }
  state.customers = state.customers.filter((guest) => !guest.training);
  if (state.activeCustomerId && !state.customers.some((guest) => guest.id === state.activeCustomerId)) state.activeCustomerId = state.customers[0]?.id;
  if (state.conversationCustomerId && !state.customers.some((guest) => guest.id === state.conversationCustomerId)) state.conversationCustomerId = undefined;
  training.active = undefined;
}

function complete(state: PlayerState, moduleId: string): string {
  const training = trainingOf(state);
  const first = !training.done.includes(moduleId);
  if (first) {
    training.done.push(moduleId);
    state.xp += TRAINING_REWARD.xp;
    state.crystals += TRAINING_REWARD.crystals;
  }
  if (training.active?.moduleId === moduleId) training.active = undefined;
  const title = trainingById(moduleId)?.title ?? 'Lesson';
  return first ? `Training complete: ${title}. +${TRAINING_REWARD.xp} XP, +${TRAINING_REWARD.crystals} crystals.` : `Practice complete: ${title}.`;
}

// Something the player did: count it for the lesson that is on, and finish the lesson when everything is done.
export function noteTraining(state: PlayerState, event: TrainingEvent) {
  const training = state.training;
  const active = training?.active;
  if (!training || !active) return;
  const module = trainingById(active.moduleId);
  if (!module?.practice?.needs.includes(event)) return;
  const seen = (training.progress[active.moduleId] ??= []);
  if (!seen.includes(event)) seen.push(event);
  if (module.practice.needs.every((need) => seen.includes(need))) {
    state.message = complete(state, active.moduleId);
    // The practice guest has done their job and leaves.
    if (active.guestId) for (const guest of state.customers.filter((item) => item.id === active.guestId)) { if (guest.social) guest.social.staysFor = 0; }
  }
}

// A guide-only lesson is finished with "Got it".
export function finishGuide(state: PlayerState, moduleId: string) {
  const module = trainingById(moduleId);
  if (!module) throw new Error('Unknown lesson.');
  if (module.practice) throw new Error('Finish the practice to complete this lesson.');
  state.message = complete(state, moduleId);
}

// If the practice guest is gone (served and left, or sent away) the practice is over.
export function tidyTraining(state: PlayerState) {
  const active = state.training?.active;
  if (active?.guestId && !state.customers.some((guest) => guest.id === active.guestId)) state.training!.active = undefined;
}

