import { REGIONS } from './catalog';
import { EQUIPMENT } from './loot';
import { levelFor } from './progression';
import type { StatId } from './quests';

// What every achievement counter is worth for a save. Some are counted when they happen (coins spent, gifts, visits,
// login days); the others are read from what the player owns now. Both kinds keep a high-water mark in `loot.stats`,
// so progress never falls when a Grand Opening starts the business over.

export interface StatSource {
  xp: number;
  ownedInteriorIds: string[];
  ownedBarIds: string[];
  ownedCosmeticIds: string[];
  staffByBar?: Record<string, { level: number }[]>;
  loot: {
    stats: Record<string, number>;
    prestige: { count: number };
    equipment: Record<string, Record<string, { level: number }>>;
  };
}

/** Equipment level every piece of a bar must reach for it to count as fully equipped. */
export const EQUIPPED_LEVEL = 5;

const DERIVED: Partial<Record<StatId, (state: StatSource) => number>> = {
  backgrounds: (state) => state.ownedInteriorIds.length,
  bars: (state) => state.ownedBarIds.length,
  skins: (state) => state.ownedCosmeticIds.length,
  prestiges: (state) => state.loot.prestige.count,
  level: (state) => levelFor(state.xp),
  staffHired: (state) => Object.values(state.staffByBar ?? {}).reduce((sum, team) => sum + team.length, 0),
  staffLevels: (state) => Object.values(state.staffByBar ?? {}).reduce((sum, team) => sum + team.reduce((total, member) => total + Math.max(0, member.level), 0), 0),
  barUpgrades: (state) => REGIONS.filter((region) => state.ownedBarIds.includes(region.id) && EQUIPMENT.every((item) => (state.loot.equipment[region.id]?.[item.id]?.level ?? 0) >= EQUIPPED_LEVEL)).length
};

export const isDerived = (stat: StatId) => stat in DERIVED;

/** The progress for one counter: the larger of what was counted and what the player has now. */
export function statValue(state: StatSource, stat: StatId): number {
  const stored = state.loot.stats[stat] ?? 0;
  const derived = DERIVED[stat]?.(state);
  return Math.floor(Math.max(stored, derived ?? 0));
}

/** Saves the current value of every derived counter as its high-water mark. */
export function syncDerivedStats(state: StatSource) {
  for (const stat of Object.keys(DERIVED) as StatId[]) {
    const value = statValue(state, stat);
    if (value > (state.loot.stats[stat] ?? 0)) state.loot.stats[stat] = value;
  }
}

/** Adds to a counter that is counted when it happens. */
export function addStat(state: Pick<StatSource, 'loot'>, stat: StatId, amount: number) {
  if (!(amount > 0)) return;
  state.loot.stats[stat] = (state.loot.stats[stat] ?? 0) + amount;
}

/** A counter that keeps the best value it ever had (the longest login streak). */
export function raiseStat(state: Pick<StatSource, 'loot'>, stat: StatId, value: number) {
  if (value > (state.loot.stats[stat] ?? 0)) state.loot.stats[stat] = value;
}
