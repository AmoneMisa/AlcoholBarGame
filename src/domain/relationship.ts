import { BOND_NAMES, BOND_STEPS } from './companions';

// How well the bar knows one of the special people (the Circle: critics, friends, notable clients): a ladder of grades
// with a point threshold for each. They are separate characters from the common guests, who have their own loyalty.
export interface Ladder { thresholds: number[]; names: string[] }
export interface Standing { index: number; name: string; points: number; nextAt?: number; nextName?: string; /** 0-1 along the whole line. */ along: number }

/** Circle: Acquaintance … Bonded. */
export const COMPANION_LADDER: Ladder = { thresholds: [...BOND_STEPS], names: BOND_NAMES.slice(1) as unknown as string[] };

export function standing(ladder: Ladder, points: number): Standing {
  const index = ladder.thresholds.filter((step) => points >= step).length - 1;
  const nextAt = ladder.thresholds[index + 1];
  const top = ladder.thresholds[ladder.thresholds.length - 1]!;
  return {
    index: Math.max(0, index), name: ladder.names[Math.max(0, index)]!, points, nextAt, nextName: nextAt === undefined ? undefined : ladder.names[index + 1],
    along: Math.max(0, Math.min(1, points / top))
  };
}
