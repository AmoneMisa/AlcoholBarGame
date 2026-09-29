import type { RegionId } from './types';

export const BAR_PURCHASE_LEVEL = 25;
export const SECOND_BAR_COIN_COST = 2400;
const CRYSTAL_COSTS = [650, 950, 1400, 2000] as const;

export type BarUnlockPrice = { currency: 'coins' | 'crystals'; amount: number };

// The first location is chosen for free. Location two uses coins; every later location uses crystals.
export function barUnlockPrice(ownedBarIds: readonly RegionId[]): BarUnlockPrice {
  if (ownedBarIds.length <= 1) return { currency: 'coins', amount: SECOND_BAR_COIN_COST };
  return { currency: 'crystals', amount: CRYSTAL_COSTS[Math.min(CRYSTAL_COSTS.length - 1, ownedBarIds.length - 2)]! };
}
