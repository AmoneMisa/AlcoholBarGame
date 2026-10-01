import { REGIONS } from '../domain/catalog';
import { coins } from '../domain/economy';
import { ensureSocial } from '../domain/social/generate';
import { clampPercent } from '../domain/social/model';
import { SITUATIONS, situationById } from '../domain/situations/catalog';
import { accepts } from '../domain/situations/helpers';
import type { Choice, Effects, Outcome, SituationContext, SituationDef, Stage, Tone } from '../domain/situations/types';
import type { Customer } from '../domain/types';
import { barEventFor } from './events';
import type { PlayerState } from './state';

// Runs situations (see domain/situations): starting one, listing the replies, resolving a reply into an outcome,
// matching a typed sentence, and what happens when nobody answers. Runs in the shared rules, so on the server.

export type Trigger = 'arrival' | 'enjoying' | 'payment';
const MIN_GAP = 4;
const CHANCE: Record<Trigger, number> = { arrival: .10, enjoying: .16, payment: .10 };

export interface Resolution {
  /** What the bartender said (the chosen sentence). */
  bartender: string;
  /** The guest's answer. */
  guest: string;
  tone: Tone;
  tip?: string;
  ended: boolean;
  leave: boolean;
  /** A payment situation ended and the guest stays: the rules decide whether they sit on or go. */
  afterServe: boolean;
  /** The guest stays and the drink must be made again. */
  remake?: boolean;
  /** The first line of a follow-up situation, if one started. */
  followUp?: string;
  note?: string;
}

const symbolOf = (state: PlayerState) => REGIONS.find((region) => region.id === state.regionId)?.currencySymbol ?? '';
const AMOUNT_KEYS = new Set(['amount', 'have', 'short']);

export function fill(text: string, data: Record<string, string | number | boolean>, symbol = '') {
  return text.replace(/\{(\w+)\}/g, (_match, key: string) => {
    const value = data[key];
    if (value === undefined) return '';
    if (typeof value === 'number' && AMOUNT_KEYS.has(key)) return `${symbol}${value.toFixed(2).replace(/\.00$/, '')}`;
    return String(value);
  });
}

export function contextOf(state: PlayerState, guest: Customer, random: () => number, data: Record<string, string | number | boolean> = guest.social?.event?.data ?? {}): SituationContext {
  const social = ensureSocial(guest, 0);
  return {
    region: state.regionId, amount: Number(data.amount ?? 0), random, rapport: social.rapport, drunk: social.drunk, emotion: social.emotion, data, orderKind: guest.orderKind,
    accepts: (payment) => accepts(state.regionId, payment)
  };
}

export const hasSituation = (guest: Customer) => !!guest.social?.event && !!situationById(guest.social.event.kind);
export const anySituation = (state: PlayerState) => state.customers.some(hasSituation);

export function currentStage(guest: Customer): { def: SituationDef; stage: Stage } | undefined {
  const event = guest.social?.event;
  const def = event ? situationById(event.kind) : undefined;
  const stage = def?.stages[event!.stage];
  return def && stage ? { def, stage } : undefined;
}

export function visibleChoices(state: PlayerState, guest: Customer, random: () => number = () => .5): Choice[] {
  const current = currentStage(guest);
  if (!current) return [];
  const context = contextOf(state, guest, random);
  return current.stage.choices.filter((choice) => !choice.requires || choice.requires(context));
}

// The guest's words for the current stage, with the amounts filled in.
export function guestLine(state: PlayerState, guest: Customer) {
  const current = currentStage(guest);
  return current ? fill(current.stage.guest, guest.social!.event!.data, symbolOf(state)) : undefined;
}

// Starts a situation on a guest and returns what they say first.
export function startSituation(state: PlayerState, guest: Customer, def: SituationDef, now: number, random: () => number, extra: { amount?: number; afterServe?: boolean; data?: Record<string, string | number | boolean> } = {}) {
  noteSituationStarted(state, random);
  const social = ensureSocial(guest, now);
  const data: Record<string, string | number | boolean> = { amount: extra.amount ?? 0, _tabs: state.tabs?.length ?? 0, _violations: state.ruleViolations ?? 0 };
  if (extra.afterServe) data.afterServe = 1;
  Object.assign(data, extra.data ?? {});
  Object.assign(data, def.setup?.({ ...contextOf(state, guest, random, data), data }) ?? {});
  social.event = { kind: def.id, stage: 0, startedAt: now, data };
  state.message = `${guest.name}: ${def.icon} ${def.title}.`;
  return fill(def.stages[0]!.guest, data, symbolOf(state));
}

// Which situation (if any) starts for this guest now.
export function pickSituation(state: PlayerState, guest: Customer, trigger: Trigger, random: () => number): SituationDef | undefined {
  // Something happens at least once in every 10–12 guests, and never more often than every 4th guest.
  if (trigger === 'arrival') state.guestsSinceEvent = (state.guestsSinceEvent ?? 0) + 1;
  if (anySituation(state)) return undefined;
  const since = state.guestsSinceEvent ?? 0;
  const gap = state.eventGap ??= 10 + Math.floor(random() * 3);
  if (since < MIN_GAP) return undefined;
  const social = ensureSocial(guest, 0);
  const chance = since >= gap && trigger === 'arrival' ? 1 : CHANCE[trigger] + (trigger === 'payment' ? social.drunk / 600 : 0);
  if (random() >= chance) return undefined;
  const context = contextOf(state, guest, random, { amount: 0, _tabs: state.tabs?.length ?? 0, _violations: state.ruleViolations ?? 0 });
  const options = SITUATIONS.filter((def) => def.triggers.includes(trigger) && (!def.applies || def.applies(context)));
  // The night changes what is likely: a big match brings trouble, date night brings good news.
  const shifts = barEventFor(state, state.lastClockAt)?.effects.situations ?? {};
  const weightOf = (def: SituationDef) => def.weight * (shifts[def.category] ?? 1);
  const total = options.reduce((sum, def) => sum + weightOf(def), 0);
  if (!total) return undefined;
  let roll = random() * total;
  for (const def of options) { roll -= weightOf(def); if (roll < 0) return def; }
  return options[0];
}

// The count starts again when a situation really begins.
export function noteSituationStarted(state: PlayerState, random: () => number) {
  state.guestsSinceEvent = 0;
  state.eventGap = 10 + Math.floor(random() * 3);
}

function pickOutcome(outcomes: Outcome[], context: SituationContext) {
  const weights = outcomes.map((outcome) => Math.max(0, typeof outcome.weight === 'function' ? outcome.weight(context) : outcome.weight ?? 1));
  const total = weights.reduce((sum, weight) => sum + weight, 0);
  if (!total) return outcomes[0]!;
  let roll = context.random() * total;
  for (let index = 0; index < outcomes.length; index++) { roll -= weights[index]!; if (roll < 0) return outcomes[index]!; }
  return outcomes[outcomes.length - 1]!;
}

const receive = (state: PlayerState, amount: number) => { state.money = coins(Math.max(0, state.money + amount)); };

// Applies what an outcome does. Returns true when the guest leaves.
function applyEffects(state: PlayerState, guest: Customer, effects: Effects, data: Record<string, string | number | boolean>) {
  const social = ensureSocial(guest, 0);
  const held = Number(data.amount ?? 0);
  const have = Number(data.have ?? 0);
  const paidShare = effects.paid === undefined ? 0 : effects.paid === 'have' ? Math.min(1, have / Math.max(.01, held)) : effects.paid;
  if (paidShare > 0 && held > 0) receive(state, coins(held * paidShare));
  const owesShare = effects.owes === undefined ? 0 : effects.owes === 'rest' ? Math.max(0, 1 - paidShare) : effects.owes;
  if (owesShare > 0 && held > 0) (state.tabs ??= []).push({ guest: guest.name, amount: coins(held * owesShare), since: state.lastClockAt });
  if (effects.settleTab && state.tabs?.length) {
    const tab = state.tabs.shift()!;
    receive(state, coins(tab.amount * 1.1));
    state.message = `${tab.guest} paid back ${tab.amount.toFixed(2)} coins and left a tip.`;
  }
  if (effects.violation) state.ruleViolations = (state.ruleViolations ?? 0) + effects.violation;
  if (effects.resetViolations) state.ruleViolations = 0;
  if (effects.money) receive(state, effects.money);
  if (effects.breakage) receive(state, -Math.abs(effects.breakage));
  if (effects.xp) state.xp += effects.xp;
  if (effects.crystals) state.crystals += effects.crystals;
  if (effects.popularity) state.popularity = Math.max(0, state.popularity + effects.popularity);
  if (effects.rapport) social.rapport = clampPercent(social.rapport + effects.rapport);
  if (effects.emotion) social.emotion = effects.emotion;
  if (effects.drunk) social.drunk = clampPercent(social.drunk + effects.drunk);
  if (effects.note) state.message = effects.note;
  if (effects.result) {
    const stats = (state.situationStats ??= { solved: 0, failed: 0, neutral: 0 });
    stats[effects.result]++;
  }
  return !!effects.leave;
}

function finish(state: PlayerState, guest: Customer, def: SituationDef, outcome: Outcome, tone: Tone, bartender: string, tip: string | undefined, now: number, random: () => number): Resolution {
  const social = ensureSocial(guest, now);
  const event = social.event!;
  const data = event.data;
  const symbol = symbolOf(state);
  // Calm Charm: a reply that would end badly (an angry guest leaving, a fine, damage, a fight) ends calmly instead.
  const bad = outcome.effects;
  const harmful = !!(bad.leave || bad.violation || bad.breakage || bad.spawn || (bad.popularity ?? 0) < 0 || (bad.money ?? 0) < 0 || bad.result === 'failed');
  const calmed = harmful && (state.loot.armed['calm-charm'] ?? 0) > 0;
  let effects = outcome.effects;
  if (calmed) {
    delete state.loot.armed['calm-charm'];
    effects = { ...bad, leave: false, violation: 0, breakage: 0, spawn: undefined, popularity: Math.max(0, bad.popularity ?? 0), money: Math.max(0, bad.money ?? 0), emotion: 'relaxed', result: 'neutral', note: 'Calm Charm: the guest settled down and nothing bad happened.' };
  }
  const leave = applyEffects(state, guest, effects, data);
  // Whisper lasts for one situation: it is used up when that situation ends.
  const spawned0 = effects.spawn;
  const spawned = spawned0 ? situationById(spawned0) : undefined;
  const guestText = fill(outcome.say, data, symbol);
  let followUp: string | undefined;
  if (spawned) followUp = startSituation(state, guest, spawned, now, random);
  else if (outcome.next === undefined) delete social.event;
  else event.stage = outcome.next;
  const ended = !social.event;
  if (ended && (state.loot.armed['whisper'] ?? 0) > 0) delete state.loot.armed['whisper'];
  return {
    bartender, guest: guestText, tone, tip, ended, leave, followUp, note: effects.note,
    remake: ended && !!effects.remake && !leave,
    afterServe: ended && !!def.holdsPayment && data.afterServe === 1 && !leave && !effects.remake
  };
}

export function resolveChoice(state: PlayerState, guest: Customer, choice: Choice, now: number, random: () => number): Resolution {
  const current = currentStage(guest)!;
  const context = contextOf(state, guest, random);
  const outcome = pickOutcome(choice.outcomes, context);
  const data = guest.social!.event!.data;
  return finish(state, guest, current.def, outcome, choice.tone, fill(choice.say, data, symbolOf(state)), choice.tip, now, random);
}

// A sentence the player typed counts as a choice when it says the same thing.
const normalize = (text: string) => text.toLowerCase().replace(/’/g, "'").replace(/[^a-z0-9' ]+/g, ' ').replace(/\s+/g, ' ').trim();
export function matchChoice(state: PlayerState, guest: Customer, text: string): Choice | undefined {
  const spoken = normalize(text);
  const data = guest.social?.event?.data ?? {};
  const choices = visibleChoices(state, guest);
  const exact = choices.find((choice) => normalize(fill(choice.say, data)) === spoken || choice.match?.test(text));
  if (exact) return exact;
  // “Call an ambulance”, “call 102”… finds the reply that calls that service.
  const call = SERVICES.find((service) => service.said.test(spoken));
  return call ? choices.find((choice) => call.reply.test(choice.say.toLowerCase())) : undefined;
}

const SERVICES = [
  { said: /\b(call|phone|dial|ring)\b.*\b(103|ambulance|doctor|paramedics)\b|\b103\b/, reply: /\b(103|ambulance)\b/ },
  { said: /\b(call|phone|dial|ring)\b.*\b(102|police|policeman)\b|\b102\b/, reply: /\b(102|police)\b/ },
  { said: /\b(call|phone|dial|ring)\b.*\b(101|fire brigade|firefighters)\b|\b101\b/, reply: /\b(101|fire brigade|fire extinguisher)\b/ },
  { said: /\b(call|phone|dial|ring)\b.*\b(104|gas)\b|\b104\b/, reply: /\b(104|gas)\b/ },
  { said: /\b(call|phone|dial|ring)\b.*\b112\b|\b112\b/, reply: /\b(112)\b/ }
];

export function resolveIgnored(state: PlayerState, guest: Customer, now: number, random: () => number): Resolution | undefined {
  const current = currentStage(guest);
  if (!current) return undefined;
  return finish(state, guest, current.def, current.def.ignored, 'bad', '', 'Do not leave a guest waiting: answer quickly, even if you only say you need a moment.', now, random);
}

export function overdue(guest: Customer, now: number) {
  const event = guest.social?.event;
  const def = event ? situationById(event.kind) : undefined;
  return !!event && !!def && now - event.startedAt > def.timeoutMin * 60_000;
}
