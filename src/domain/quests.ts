import type { BoxKind } from './loot';

// Weekly quests and lifetime achievements. Both read the same counters (`loot.stats`), which only server rules increase.
export type StatId = 'serves' | 'servesCoins' | 'vips' | 'bottles' | 'boxes' | 'draws' | 'upgrades' | 'tasted';
export interface Goal { id: string; name: string; stat: StatId; target: number; box: BoxKind; crystals: number; }

export const WEEK_MS = 7 * 24 * 60 * 60 * 1000;
export const weekOf = (now: number) => Math.floor(now / WEEK_MS);

const QUEST_POOL: Goal[] = [
  { id: 'q-serve', name: 'Serve 15 perfect drinks', stat: 'serves', target: 15, box: 'bronze', crystals: 10 },
  { id: 'q-earn', name: 'Earn 1,500 coins from drinks', stat: 'servesCoins', target: 1500, box: 'bronze', crystals: 10 },
  { id: 'q-vip', name: 'Serve 3 VIP guests', stat: 'vips', target: 3, box: 'silver', crystals: 15 },
  { id: 'q-bottles', name: 'Sell 3 sealed bottles', stat: 'bottles', target: 3, box: 'bronze', crystals: 10 },
  { id: 'q-upgrade', name: 'Upgrade equipment twice', stat: 'upgrades', target: 2, box: 'bronze', crystals: 10 },
  { id: 'q-taste', name: 'Serve 3 recipes for the first time', stat: 'tasted', target: 3, box: 'silver', crystals: 15 }
];
// Three quests per week, rotating deterministically from the server clock.
export function questsForWeek(week: number): Goal[] {
  return [0, 2, 4].map((step) => QUEST_POOL[(week + step) % QUEST_POOL.length]!);
}
export const questById = (id: string) => QUEST_POOL.find((quest) => quest.id === id);

export const ACHIEVEMENTS: Goal[] = [
  { id: 'a-serve-10', name: 'Regular bartender: 10 drinks', stat: 'serves', target: 10, box: 'bronze', crystals: 5 },
  { id: 'a-serve-100', name: 'Seasoned: 100 drinks', stat: 'serves', target: 100, box: 'silver', crystals: 20 },
  { id: 'a-serve-500', name: 'Legend of the bar: 500 drinks', stat: 'serves', target: 500, box: 'choice', crystals: 60 },
  { id: 'a-vip-10', name: 'Host of honour: 10 VIP guests', stat: 'vips', target: 10, box: 'silver', crystals: 20 },
  { id: 'a-bottles-25', name: 'Bottle merchant: 25 bottles', stat: 'bottles', target: 25, box: 'silver', crystals: 20 },
  { id: 'a-boxes-20', name: 'Treasure hunter: open 20 boxes', stat: 'boxes', target: 20, box: 'silver', crystals: 15 },
  { id: 'a-draws-30', name: 'Fashionista: 30 style draws', stat: 'draws', target: 30, box: 'choice', crystals: 30 },
  { id: 'a-upgrades-30', name: 'Master builder: 30 upgrades', stat: 'upgrades', target: 30, box: 'choice', crystals: 30 },
  { id: 'a-taste-20', name: 'Sommelier: taste 20 recipes', stat: 'tasted', target: 20, box: 'silver', crystals: 25 }
];
export const achievementById = (id: string) => ACHIEVEMENTS.find((item) => item.id === id);
export const TASTING_REWARD = { parts: 2, skinShards: 3, brandShards: 1 } as const;
