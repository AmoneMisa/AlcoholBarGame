import { calendarDate } from '../domain/economy';
import {
  BONUSES, COMPANIONS, SPOTLIGHT_COOLDOWN_MS, SPOTLIGHT_MIN_BOND, SPOTLIGHT_MS, KEEPSAKE_CRYSTAL_PRICE, KEEPSAKE_LIKED_POINTS, KEEPSAKE_POINTS, KEEPSAKE_VISIT_CHANCE, MAX_BOND, BOND_STEPS, VISITS_PER_DAY, VISIT_POINTS,
  bondLevel, bonusAmount, describeBonus, companionById, companionName, companionSlots, keepsakeDef, KEEPSAKE_IDS, type BonusId, type KeepsakeId
} from '../domain/companions';
import { levelFor, type PlayerState } from './state';

// The Circle: recruiting, bonds, keepsakes and which companions work in which bar (see domain/companions.ts).
export class CompanionError extends Error {}

export interface CompanionState {
  /** Bond points of everyone who has joined. */
  owned: Record<string, number>;
  /** Shards collected towards people who have not joined yet. */
  shards: Record<string, number>;
  keepsakes: Record<string, number>;
  /** Who works in each bar (a person can be in one bar at a time). */
  assigned: Record<string, string[]>;
  /** Visits already rewarded today, per companion. */
  visits: { day: string; counts: Record<string, number> };
  /** Spotlight: until when a person gives double, and when they can be asked again. */
  spotlights?: Record<string, { until: number; ready: number }>;
}
export const emptyCompanions = (): CompanionState => ({ owned: {}, shards: {}, keepsakes: {}, assigned: {}, visits: { day: '', counts: {} } });
const circle = (state: PlayerState): CompanionState => (state.companions ??= emptyCompanions());

export const bondOf = (state: PlayerState, id: string) => (id in (state.companions?.owned ?? {}) ? bondLevel(state.companions!.owned[id]!) : 0);
export const hasJoined = (state: PlayerState, id: string) => id in (state.companions?.owned ?? {});
/** Who works in a bar now (the bar being managed unless another is named). */
export const crewOf = (state: PlayerState, regionId: string = state.regionId): string[] => (state.companions?.assigned[regionId] ?? []).filter((id) => hasJoined(state, id));
/** The sum of one bonus over the companions working in this bar, each at their own bond. */
export const spotlightActive = (state: PlayerState, id: string, now: number = state.lastClockAt) => (state.companions?.spotlights?.[id]?.until ?? 0) > now;
export const companionBonus = (state: PlayerState, bonus: BonusId, regionId: string = state.regionId): number =>
  crewOf(state, regionId).reduce((sum, id) => (companionById(id)?.bonus === bonus ? sum + bonusAmount(bonus, bondOf(state, id)) * (spotlightActive(state, id) ? 2 : 1) : sum), 0);
export const companionBonuses = (state: PlayerState, regionId: string = state.regionId) => Object.fromEntries(BONUSES.map((item) => [item.id, companionBonus(state, item.id, regionId)])) as Record<BonusId, number>;

const known = (id: unknown) => {
  const companion = companionById(String(id));
  if (!companion) throw new CompanionError('Unknown person.');
  return companion;
};

/** Someone joins at once (an achievement reached). Someone already there turns the invitation into a keepsake. */
export function joinCompanion(state: PlayerState, id: string): string {
  const companion = known(id);
  const data = circle(state);
  const name = companionName(companion.id);
  if (id in data.owned) {
    data.keepsakes[companion.likes] = (data.keepsakes[companion.likes] ?? 0) + 1;
    return `${name} is already your friend: they left a keepsake they know you will like.`;
  }
  data.owned[id] = 0;
  delete data.shards[id];
  return `${name} (${companion.title}) joined your circle!`;
}

export function recruitCompanion(state: PlayerState, id: unknown): string {
  const companion = known(id);
  const data = circle(state);
  if (companion.id in data.owned) throw new CompanionError('This person is already in your circle.');
  const have = data.shards[companion.id] ?? 0;
  if (have < companion.shards) throw new CompanionError(`You need ${companion.shards} shards of ${companionName(companion.id)} (you have ${have}).`);
  data.shards[companion.id] = have - companion.shards;
  if (!data.shards[companion.id]) delete data.shards[companion.id];
  data.owned[companion.id] = 0;
  return `${companionName(companion.id)} (${companion.title}) joined your circle!`;
}

export function addKeepsakes(state: PlayerState, kind: KeepsakeId, amount = 1) {
  const data = circle(state);
  data.keepsakes[kind] = (data.keepsakes[kind] ?? 0) + amount;
}

export function buyKeepsake(state: PlayerState, kind: unknown, quantity: unknown): string {
  const item = keepsakeDef(String(kind));
  const count = Math.max(1, Math.min(10, Math.floor(Number(quantity) || 1)));
  if (!item) throw new CompanionError('Unknown keepsake.');
  const cost = KEEPSAKE_CRYSTAL_PRICE * count;
  if (state.crystals < cost) throw new CompanionError(`You need ${cost} crystals.`);
  state.crystals -= cost;
  addKeepsakes(state, item.id, count);
  return `${count} × ${item.name} for ${cost} crystals.`;
}

export function giveKeepsake(state: PlayerState, id: unknown, kind: unknown): string {
  const companion = known(id);
  const item = keepsakeDef(String(kind));
  const data = circle(state);
  if (!item) throw new CompanionError('Unknown keepsake.');
  if (!(companion.id in data.owned)) throw new CompanionError('This person has not joined your circle yet.');
  if ((data.keepsakes[item.id] ?? 0) < 1) throw new CompanionError(`You have no ${item.name.toLowerCase()}.`);
  const top = BOND_STEPS[MAX_BOND - 1]!;
  const before = data.owned[companion.id]!;
  if (before >= top) throw new CompanionError(`${companionName(companion.id)} is already fully bonded with you.`);
  data.keepsakes[item.id]! -= 1;
  const liked = companion.likes === item.id;
  data.owned[companion.id] = Math.min(top, before + (liked ? KEEPSAKE_LIKED_POINTS : KEEPSAKE_POINTS));
  const level = bondLevel(data.owned[companion.id]!);
  const name = companionName(companion.id);
  return `${name} ${liked ? 'loved' : 'liked'} the ${item.name.toLowerCase()}.${level > bondLevel(before) ? ` Your bond is now level ${level}: a new chapter of their story is open.` : ''}`;
}

export function assignCompanion(state: PlayerState, id: unknown): string {
  const companion = known(id);
  const data = circle(state);
  if (!(companion.id in data.owned)) throw new CompanionError('This person has not joined your circle yet.');
  const here = (data.assigned[state.regionId] ??= []).filter((item) => item in data.owned);
  if (here.includes(companion.id)) throw new CompanionError(`${companionName(companion.id)} already works in this bar.`);
  if (here.length >= companionSlots(levelFor(state.xp))) throw new CompanionError(`This bar has room for ${companionSlots(levelFor(state.xp))} people. Send someone home first.`);
  for (const [bar, list] of Object.entries(data.assigned)) data.assigned[bar] = list.filter((item) => item !== companion.id);
  data.assigned[state.regionId] = [...here, companion.id];
  return `${companionName(companion.id)} now works in this bar: ${describeBonus(companion.bonus, bondOf(state, companion.id))}.`;
}

export function dismissCompanion(state: PlayerState, id: unknown): string {
  const companion = known(id);
  const data = circle(state);
  let removed = false;
  for (const [bar, list] of Object.entries(data.assigned)) {
    if (list.includes(companion.id)) { data.assigned[bar] = list.filter((item) => item !== companion.id); removed = true; }
  }
  if (!removed) throw new CompanionError(`${companionName(companion.id)} is not working in a bar.`);
  return `${companionName(companion.id)} is off duty.`;
}

/** A person who works in this bar gives double for half an hour, then rests for six hours. */
export function spotlightCompanion(state: PlayerState, id: unknown, now: number): string {
  const companion = known(id);
  if (!crewOf(state).includes(companion.id)) throw new CompanionError(`${companionName(companion.id)} has to work in this bar first.`);
  if (bondOf(state, companion.id) < SPOTLIGHT_MIN_BOND) throw new CompanionError(`Reach bond level ${SPOTLIGHT_MIN_BOND} with ${companionName(companion.id)} first.`);
  const slot = ((circle(state).spotlights ??= {})[companion.id] ??= { until: 0, ready: 0 });
  if (slot.until > now) throw new CompanionError(`${companionName(companion.id)} is already in the spotlight.`);
  if (slot.ready > now) throw new CompanionError(`${companionName(companion.id)} is resting: ready in ${Math.ceil((slot.ready - now) / 3_600_000)} h.`);
  slot.until = now + SPOTLIGHT_MS;
  slot.ready = now + SPOTLIGHT_COOLDOWN_MS;
  return `${companionName(companion.id)} is in the spotlight for ${SPOTLIGHT_MS / 60_000} minutes: ${describeBonus(companion.bonus, bondOf(state, companion.id) * 2)}.`;
}

/** A guest who is a companion was served well: shards if they have not joined, bond points if they have. */
export function companionVisit(state: PlayerState, characterId: string | undefined, bar: { eventId?: string }, now: number, random: () => number): string {
  const companion = characterId ? companionById(characterId) : undefined;
  if (!companion) return '';
  const data = circle(state);
  const day = calendarDate(new Date(now));
  if (data.visits.day !== day) data.visits = { day, counts: {} };
  const seen = data.visits.counts[companion.id] ?? 0;
  if (seen >= VISITS_PER_DAY) return '';
  data.visits.counts[companion.id] = seen + 1;
  const name = companionName(companion.id);
  const parts: string[] = [];
  if (companion.id in data.owned) {
    const before = data.owned[companion.id]!;
    const top = BOND_STEPS[MAX_BOND - 1]!;
    data.owned[companion.id] = Math.min(top, before + VISIT_POINTS);
    parts.push(`${name} enjoyed the visit (+${VISIT_POINTS} bond)`);
    if (bondLevel(data.owned[companion.id]!) > bondLevel(before)) parts.push(`bond level ${bondLevel(data.owned[companion.id]!)}: a new chapter is open`);
  } else {
    const amount = bar.eventId && companion.eventId === bar.eventId ? 2 : 1;
    data.shards[companion.id] = (data.shards[companion.id] ?? 0) + amount;
    parts.push(`${name} left ${amount} shard${amount > 1 ? 's' : ''} (${data.shards[companion.id]} / ${companion.shards})`);
  }
  if (random() < KEEPSAKE_VISIT_CHANCE) {
    const kind = KEEPSAKE_IDS[Math.floor(random() * KEEPSAKE_IDS.length)]!;
    addKeepsakes(state, kind, 1);
    parts.push(`and a keepsake: ${keepsakeDef(kind)!.name.toLowerCase()}`);
  }
  return ` ${parts.join(', ')}.`;
}
