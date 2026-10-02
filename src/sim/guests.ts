import type { Customer } from '../domain/types';
import { drunkStage, clampPercent, type Emotion, type GuestNeed, type NeedKind } from '../domain/social/model';
import { ensureSocial } from '../domain/social/generate';
import { TAXI_ACCEPTED, TAXI_ARRIVED, choose, leaveLine, type LeaveOutcome, type LeaveTone, type SocialReply } from '../domain/social/talk';
import { pickSituation, startSituation } from './situations';
import type { PlayerState } from './state';
import { MINUTE } from '../domain/time';
import { MAX_CUSTOMER_SEATS } from '../domain/customerTiming';

// The life of the guests at the bar, run by the shared rules (so on the server): who sits, who stays for another
// drink, who is getting drunk or asking for something, and what happens when the bartender asks someone to leave.
// Nothing here knows about drinks or prices; rules.ts passes in what it needs through `GuestContext`.

export const MAX_SEATS = MAX_CUSTOMER_SEATS;
const ASHTRAYS_AT_START = 4;

export interface GuestContext {
  now: number;
  random: () => number;
  /** When the next arrival should come, after the usual waits and event effects. */
  nextArrivalAt: () => number;
  /** The next order for a guest who stays: recipe, request, budget and timers. */
  freshOrder: (guest: Customer) => Partial<Customer>;
}

export const ashtraysOf = (state: PlayerState) => (state.ashtrays ??= { clean: ASHTRAYS_AT_START, dirty: 0 });
export const isOrdering = (guest: Customer) => (guest.social?.phase ?? 'ordering') === 'ordering';
export const orderingGuests = (state: PlayerState) => state.customers.filter(isOrdering);
const pickActive = (state: PlayerState) => orderingGuests(state)[0] ?? state.customers[0];
const bumpPopularity = (state: PlayerState, amount: number) => { state.popularity = Math.max(0, state.popularity + amount); };

// ---- Seats ----
// A guest leaves: an ashtray they used becomes dirty, their conversation ends, and the bar looks for the next guest.
export function removeGuest(state: PlayerState, guest: Customer, context: GuestContext) {
  if (guest.social?.ashtray === 'given') ashtraysOf(state).dirty++;
  delete state.rewardedSentences[guest.id];
  delete state.conversations[guest.id];
  const seat = state.customers.indexOf(guest);
  if (seat >= 0) state.customers.splice(seat, 1);
  if (state.conversationCustomerId === guest.id) state.conversationCustomerId = undefined;
  if (state.activeCustomerId === guest.id) state.activeCustomerId = pickActive(state)?.id ?? '';
  scheduleArrival(state, context);
  state.lastClockAt = context.now;
}

// Every seat keeps its own clock. Legacy saves assign seats once, preserving the old earliest arrival.
export function scheduleArrival(state: PlayerState, context: GuestContext) {
  const occupied = new Set<number>();
  for (const guest of state.customers) {
    if (!Number.isInteger(guest.seatId) || guest.seatId! < 0 || guest.seatId! >= MAX_SEATS || occupied.has(guest.seatId!)) guest.seatId = Array.from({length:MAX_SEATS}, (_,i)=>i).find(i=>!occupied.has(i));
    if (guest.seatId !== undefined) occupied.add(guest.seatId);
  }
  const legacy = !state.seatNextCustomerAt && state.nextCustomerAt > 0 ? state.nextCustomerAt : 0;
  const clocks = state.seatNextCustomerAt ??= Array(MAX_SEATS).fill(0);
  clocks.length = MAX_SEATS;
  let migrated = false;
  for (let seat=0; seat<MAX_SEATS; seat++) {
    if (occupied.has(seat)) clocks[seat] = 0;
    else if (!Number.isFinite(clocks[seat]) || clocks[seat]! <= 0) {
      clocks[seat] = legacy && !migrated ? legacy : context.nextArrivalAt();
      migrated = true;
    }
  }
  state.nextCustomerAt = Math.min(...clocks.filter(time=>time>0)) || 0;
  if (!Number.isFinite(state.nextCustomerAt)) state.nextCustomerAt = 0;
}

// ---- Feelings ----
export function applySocialReply(guest: Customer, reply: SocialReply) {
  const social = ensureSocial(guest, 0);
  social.rapport = clampPercent(social.rapport + reply.rapport);
  if (reply.emotion) social.emotion = reply.emotion;
  if (reply.told) social.told = true;
  if (reply.thread) social.thread = { ...reply.thread, depth: 0, seen: [] };
  if (reply.heard) { const heard = (social.heard ??= []); if (!heard.some((item) => item.thing === reply.heard!.thing)) heard.push(reply.heard); if (heard.length > 5) heard.shift(); }
  social.asked = !!reply.asked;
  if (reply.chatted && !social.chatted.includes(reply.chatted)) social.chatted.push(reply.chatted);
  // Being rude to a guest makes them angry; being kind to an angry guest is how you calm them.
  if (social.rapport < 22 && social.emotion !== 'angry') social.emotion = 'angry';
  if (social.rapport >= 62 && (social.emotion === 'angry' || social.emotion === 'upset')) social.emotion = 'relaxed';
}

// Emotions drift over an evening: drink makes people louder, kindness makes them warmer, neglect makes them upset.
function driftEmotion(guest: Customer, random: () => number) {
  const social = ensureSocial(guest, 0);
  let next: Emotion = social.emotion;
  if (social.rapport < 22) next = 'angry';
  else if (social.drunk >= 60) next = random() < .5 ? 'excited' : random() < .5 ? 'upset' : 'lonely';
  else if (social.drunk >= 30) next = random() < .5 ? 'happy' : social.emotion;
  else if (social.rapport >= 65 && (social.emotion === 'upset' || social.emotion === 'tired' || social.emotion === 'lonely' || social.emotion === 'nervous')) next = random() < .6 ? 'relaxed' : 'happy';
  else if (random() < .25) next = (['relaxed', 'tired', 'happy'] as Emotion[])[Math.floor(random() * 3)]!;
  social.emotion = next;
}

// ---- After a drink ----
// Alcohol level rises with the drink's strength: a light cocktail adds about ten points, a neat spirit nearly thirty.
export const drunkGain = (abv: number) => abv <= 0 ? 0 : Math.round(4 + abv * .6);

// The drink is in the guest's hands: it counts, and it raises their alcohol level.
export function recordDrink(guest: Customer, gain: number, now: number) {
  const social = ensureSocial(guest, now);
  social.rounds++;
  social.drunk = clampPercent(social.drunk + gain);
  social.refused = false;
}

// After the drink and the payment: the guest either sits on for another round or leaves.
export function settleGuest(state: PlayerState, guest: Customer, context: GuestContext): 'stays' | 'leaves' {
  const social = ensureSocial(guest, context.now);
  const stays = social.staysFor > 0 && social.rapport >= 20 && !social.taxiAt && social.event?.kind !== 'aggression';
  if (!stays) { removeGuest(state, guest, context); return 'leaves'; }
  social.staysFor--;
  social.phase = 'enjoying';
  social.nextOrderAt = context.now + Math.round((3 + context.random() * 7) * MINUTE);
  guest.orderRevealed = false;
  guest.patienceRemaining = guest.patience;
  delete state.conversations[guest.id];
  delete state.rewardedSentences[guest.id];
  if (state.conversationCustomerId === guest.id) state.conversationCustomerId = undefined;
  rollEnjoyingNeed(guest, context);
  // Something may happen to a guest who sits for a while.
  const trouble = pickSituation(state, guest, 'enjoying', context.random);
  if (trouble) startSituation(state, guest, trouble, context.now, context.random);
  if (state.activeCustomerId === guest.id) state.activeCustomerId = pickActive(state)?.id ?? guest.id;
  scheduleArrival(state, context);
  return 'stays';
}

export function afterServed(state: PlayerState, guest: Customer, gain: number, context: GuestContext): 'stays' | 'leaves' {
  recordDrink(guest, gain, context.now);
  return settleGuest(state, guest, context);
}

// A guest who has not paid yet stays where they are: the bill is held until the payment is sorted out.
export function holdForPayment(guest: Customer, now: number) {
  const social = ensureSocial(guest, now);
  social.phase = 'enjoying';
  social.nextOrderAt = now + 120 * MINUTE;
}

// While the guest enjoys the drink they may ask for something, a little after they settle.
function rollEnjoyingNeed(guest: Customer, context: GuestContext) {
  const social = ensureSocial(guest, context.now);
  if (social.need) return;
  const span = Math.max(MINUTE, social.nextOrderAt - context.now);
  const when = context.now + Math.round(span * (.25 + context.random() * .45));
  const stage = drunkStage(social.drunk);
  let kind: NeedKind | undefined;
  if (guest.smoker && social.ashtray !== 'given' && context.random() < .55) kind = 'ashtray';
  else if (social.drunk >= 55 && context.random() < .5) kind = social.gender === 'f' && context.random() < .6 ? 'taxi' : 'water';
  else if (stage === 'tipsy' && context.random() < .3) kind = 'water';
  else if (social.chatty && context.random() < .6) kind = 'chat';
  if (kind) social.need = { kind, since: when };
}

export const activeNeed = (guest: Customer, now: number): GuestNeed | undefined => {
  const need = guest.social?.need;
  return need && need.since <= now ? need : undefined;
};

// The enjoying guest wants another drink: a new order, a new mood, maybe a drunker guest.
export function startNextRound(state: PlayerState, guest: Customer, context: GuestContext) {
  const social = ensureSocial(guest, context.now);
  Object.assign(guest, context.freshOrder(guest));
  guest.orderRevealed = guest.orderKind === 'serve';
  guest.patienceRemaining = guest.patience;
  social.phase = 'ordering';
  social.pitchTries = 0;
  delete social.pitch;
  driftEmotion(guest, context.random);
  if (!state.activeCustomerId || !state.customers.some((item) => item.id === state.activeCustomerId && isOrdering(item))) state.activeCustomerId = guest.id;
  scheduleArrival(state, context);
  // The order clock starts now, not when the guest sat down.
  state.lastClockAt = context.now;
  state.message = `${guest.name} would like another drink.`;
}

// ---- Time passes for everyone at the bar ----
export function tickGuests(state: PlayerState, context: GuestContext, seconds: number) {
  const minutes = Math.min(360, Math.max(0, seconds)) / 60;
  for (const guest of [...state.customers]) {
    const social = ensureSocial(guest, context.now);
    social.drunk = clampPercent(social.drunk - minutes * .45);
    // A taxi that has arrived takes the guest home.
    if (social.taxiAt && context.now >= social.taxiAt) {
      state.message = `${guest.name}: “${choose(TAXI_ARRIVED, guest.id)}” The taxi took ${guest.name} home safely.`;
      bumpPopularity(state, 1);
      state.xp += 6;
      removeGuest(state, guest, context);
      continue;
    }
    // A request that is ignored for too long makes the guest feel unseen.
    const need = activeNeed(guest, context.now);
    if (need && !need.ignored && context.now - need.since > 6 * MINUTE) {
      need.ignored = true;
      social.rapport = clampPercent(social.rapport - 12);
      if (social.rapport < 30 && social.emotion !== 'angry') social.emotion = 'upset';
      state.message = `${guest.name} has been waiting for your attention for a while.`;
    }
    if (social.phase === 'enjoying' && context.now >= social.nextOrderAt) startNextRound(state, guest, context);
  }
}

// ---- What the bartender can do ----
const needDone = (guest: Customer, kind: NeedKind) => { if (guest.social?.need?.kind === kind) delete guest.social.need; };

export function giveAshtray(state: PlayerState, guest: Customer, now: number) {
  const social = ensureSocial(guest, now);
  const stock = ashtraysOf(state);
  if (social.ashtray === 'given') return { ok: false as const, text: `${guest.name} already has an ashtray.` };
  if (stock.clean < 1) return { ok: false as const, text: 'You have no clean ashtrays left. Clean the dirty ones first.' };
  stock.clean--;
  social.ashtray = 'given';
  const wanted = social.need?.kind === 'ashtray';
  needDone(guest, 'ashtray');
  social.rapport = clampPercent(social.rapport + (wanted ? 9 : guest.smoker ? 4 : -3));
  return { ok: true as const, text: wanted ? `${guest.name} thanks you for the ashtray.` : `You put an ashtray in front of ${guest.name}.` };
}

// Cleaning takes no time but must be done: dirty ashtrays make new guests like the bar less.
export function cleanAshtrays(state: PlayerState) {
  const stock = ashtraysOf(state);
  if (!stock.dirty) return 0;
  const cleaned = stock.dirty;
  stock.clean += cleaned;
  stock.dirty = 0;
  state.xp += cleaned;
  return cleaned;
}

export function giveWater(guest: Customer, now: number) {
  const social = ensureSocial(guest, now);
  const wanted = social.need?.kind === 'water';
  social.drunk = clampPercent(social.drunk - 12);
  social.rapport = clampPercent(social.rapport + (wanted ? 9 : 4));
  needDone(guest, 'water');
  return `${guest.name} drinks the water. ${drunkStage(social.drunk) === 'sober' ? 'They look much better.' : 'It helps a little.'}`;
}

export function callTaxi(guest: Customer, context: GuestContext) {
  const social = ensureSocial(guest, context.now);
  social.taxiAt = context.now + Math.round((3 + context.random() * 2) * MINUTE);
  social.staysFor = 0;
  social.rapport = clampPercent(social.rapport + 8);
  needDone(guest, 'taxi');
  return `${choose(TAXI_ACCEPTED, guest.id)} The taxi will be here in a few minutes.`;
}

// ---- Asking a guest to leave ----
// The chance rises with kindness and falls with drink and anger. A gentle request almost never starts a fight; a rude one can.
export function leaveChance(guest: Customer, tone: LeaveTone) {
  const social = ensureSocial(guest, 0);
  const base = tone === 'gentle' ? 44 : tone === 'firm' ? 52 : 36;
  const emotion = social.emotion === 'angry' ? -14 : social.emotion === 'upset' ? -4 : social.emotion === 'tired' ? 10 : 0;
  const chance = base + (social.rapport - 50) * .5 - social.drunk * .28 + emotion + (social.taxiAt ? 40 : 0) + (tone === 'aggressive' && social.drunk < 40 ? -10 : 0);
  return Math.max(5, Math.min(92, Math.round(chance)));
}

export function askToLeave(state: PlayerState, guest: Customer, tone: LeaveTone, context: GuestContext): { outcome: LeaveOutcome; text: string } {
  const social = ensureSocial(guest, context.now);
  const chance = leaveChance(guest, tone);
  const roll = context.random() * 100;
  const outcome: LeaveOutcome = roll < chance ? 'leaves' : tone === 'gentle' || roll < chance + (100 - chance) * .6 ? 'stays' : 'escalates';
  const text = leaveLine(outcome, tone, `${guest.id}:${social.rounds}:${tone}`);
  if (outcome === 'leaves') {
    bumpPopularity(state, tone === 'gentle' ? 1 : tone === 'aggressive' ? -1 : 0);
    if (social.drunk >= 50 && tone === 'gentle') state.xp += 4;
    state.message = `${guest.name}: “${text}” ${guest.name} left.`;
    removeGuest(state, guest, context);
  } else if (outcome === 'stays') {
    social.rapport = clampPercent(social.rapport - (tone === 'gentle' ? 4 : tone === 'firm' ? 8 : 14));
    social.refused = true;
    state.message = `${guest.name} does not want to leave.`;
  } else {
    social.rapport = clampPercent(social.rapport - 18);
    social.emotion = 'angry';
    social.event = { kind: 'aggression', stage: 0, startedAt: context.now, data: {} };
    state.message = `${guest.name} is getting aggressive! Calm them down or call the police.`;
  }
  return { outcome, text };
}

