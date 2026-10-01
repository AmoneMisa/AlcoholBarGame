import type { BoxKind } from './loot';

// Weekly quests and lifetime achievements. Both read the same counters (`loot.stats`), which only server rules increase.
export type StatId = 'serves' | 'servesCoins' | 'vips' | 'bottles' | 'boxes' | 'draws' | 'upgrades' | 'tasted' | 'perfectTalks' | 'lessons' | 'signatures';
export interface Goal { id: string; name: string; stat: StatId; target: number; box: BoxKind; crystals: number; }

export const WEEK_MS = 7 * 24 * 60 * 60 * 1000;
export const weekOf = (now: number) => Math.floor(now / WEEK_MS);

const QUEST_POOL: Goal[] = [
  { id: 'q-serve', name: 'Serve 15 perfect drinks', stat: 'serves', target: 15, box: 'bronze', crystals: 10 },
  { id: 'q-earn', name: 'Earn 1,500 coins from drinks', stat: 'servesCoins', target: 1500, box: 'bronze', crystals: 10 },
  { id: 'q-vip', name: 'Serve 3 VIP guests', stat: 'vips', target: 3, box: 'silver', crystals: 15 },
  { id: 'q-bottles', name: 'Sell 3 sealed bottles', stat: 'bottles', target: 3, box: 'bronze', crystals: 10 },
  { id: 'q-upgrade', name: 'Upgrade equipment twice', stat: 'upgrades', target: 2, box: 'bronze', crystals: 10 },
  { id: 'q-talk', name: 'Have 5 perfect English conversations', stat: 'perfectTalks', target: 5, box: 'bronze', crystals: 10 },
  { id: 'q-lessons', name: 'Finish 3 daily English lesson sets', stat: 'lessons', target: 3, box: 'silver', crystals: 15 },
  { id: 'q-taste', name: 'Serve 3 recipes for the first time', stat: 'tasted', target: 3, box: 'silver', crystals: 15 }
];
// Three quests per week, rotating deterministically from the server clock.
export function questsForWeek(week: number): Goal[] {
  return [0, 2, 4].map((step) => QUEST_POOL[(week + step) % QUEST_POOL.length]!);
}
export const questById = (id: string) => QUEST_POOL.find((quest) => quest.id === id);

// Achievements come in series, one per counter, and every series has four tiers that unlock one after another.
export const TIER_NAMES = ['Bronze', 'Silver', 'Gold', 'Platinum'] as const;
export interface Achievement extends Goal { series: StatId; tier: number; tierName: string; seriesName: string }
// [id, name of the tier, target, box, crystals]
type Row = [string, string, number, BoxKind, number];
const SERIES: { stat: StatId; name: string; rows: Row[] }[] = [
  { stat: 'serves', name: 'Bartender', rows: [['a-serve-10', 'Regular bartender: 10 drinks', 10, 'bronze', 5], ['a-serve-100', 'Seasoned: 100 drinks', 100, 'silver', 20], ['a-serve-500', 'Legend of the bar: 500 drinks', 500, 'choice', 60], ['a-serve-2000', 'Master of the house: 2,000 drinks', 2000, 'choice', 120]] },
  { stat: 'vips', name: 'Host', rows: [['a-vip-3', 'Good host: 3 VIP guests', 3, 'bronze', 5], ['a-vip-10', 'Host of honour: 10 VIP guests', 10, 'silver', 20], ['a-vip-30', 'Royal host: 30 VIP guests', 30, 'silver', 35], ['a-vip-100', 'Keeper of the guest list: 100 VIP guests', 100, 'choice', 80]] },
  { stat: 'bottles', name: 'Merchant', rows: [['a-bottles-5', 'First bottles: 5 bottles', 5, 'bronze', 5], ['a-bottles-25', 'Bottle merchant: 25 bottles', 25, 'silver', 20], ['a-bottles-100', 'Cellar baron: 100 bottles', 100, 'silver', 40], ['a-bottles-300', 'Spirits tycoon: 300 bottles', 300, 'choice', 90]] },
  { stat: 'boxes', name: 'Treasure hunter', rows: [['a-boxes-5', 'Curious: open 5 boxes', 5, 'bronze', 5], ['a-boxes-20', 'Treasure hunter: open 20 boxes', 20, 'silver', 15], ['a-boxes-60', 'Vault breaker: open 60 boxes', 60, 'silver', 35], ['a-boxes-150', 'Dragon hoard: open 150 boxes', 150, 'choice', 80]] },
  { stat: 'draws', name: 'Fashionista', rows: [['a-draws-10', 'New look: 10 style draws', 10, 'bronze', 10], ['a-draws-30', 'Fashionista: 30 style draws', 30, 'choice', 30], ['a-draws-80', 'Trendsetter: 80 style draws', 80, 'choice', 50], ['a-draws-200', 'Icon of style: 200 style draws', 200, 'choice', 90]] },
  { stat: 'upgrades', name: 'Builder', rows: [['a-upgrades-10', 'Handyman: 10 upgrades', 10, 'bronze', 10], ['a-upgrades-30', 'Master builder: 30 upgrades', 30, 'choice', 30], ['a-upgrades-75', 'Chief engineer: 75 upgrades', 75, 'choice', 50], ['a-upgrades-150', 'Architect of the bar: 150 upgrades', 150, 'choice', 90]] },
  { stat: 'perfectTalks', name: 'Conversationalist', rows: [['a-talk-5', 'Friendly voice: 5 perfect conversations', 5, 'bronze', 8], ['a-talk-25', 'Silver tongue: 25 perfect conversations', 25, 'silver', 25], ['a-talk-75', 'Golden tongue: 75 perfect conversations', 75, 'silver', 45], ['a-talk-200', 'Poet of the bar: 200 perfect conversations', 200, 'choice', 90]] },
  { stat: 'lessons', name: 'Student', rows: [['a-lessons-3', 'First lessons: 3 daily lesson sets', 3, 'bronze', 8], ['a-lessons-14', 'Dedicated student: 14 daily lesson sets', 14, 'choice', 40], ['a-lessons-30', 'Top of the class: 30 daily lesson sets', 30, 'choice', 60], ['a-lessons-90', 'Professor: 90 daily lesson sets', 90, 'choice', 100]] },
  { stat: 'signatures', name: 'Signature', rows: [['a-sig-10', 'Own recipe: serve your signature 10 times', 10, 'bronze', 10], ['a-sig-50', 'House favourite: serve your signature 50 times', 50, 'silver', 30], ['a-sig-150', 'Local legend: serve your signature 150 times', 150, 'silver', 50], ['a-sig-500', 'Famous cocktail: serve your signature 500 times', 500, 'choice', 100]] },
  { stat: 'tasted', name: 'Sommelier', rows: [['a-taste-8', 'Taster: taste 8 recipes', 8, 'bronze', 8], ['a-taste-20', 'Sommelier: taste 20 recipes', 20, 'silver', 25], ['a-taste-40', 'Connoisseur: taste 40 recipes', 40, 'silver', 45], ['a-taste-60', 'Master of flavours: taste 60 recipes', 60, 'choice', 80]] }
];
export const ACHIEVEMENTS: Achievement[] = SERIES.flatMap((series) => series.rows.map(([id, name, target, box, crystals], index) => ({ id, name, stat: series.stat, target, box, crystals, series: series.stat, tier: index + 1, tierName: TIER_NAMES[index]!, seriesName: series.name })));
export const achievementById = (id: string) => ACHIEVEMENTS.find((item) => item.id === id);
export const achievementSeries = (stat: StatId) => ACHIEVEMENTS.filter((item) => item.series === stat);
/** From the earned ids, the highest earned tier of every series, in the order the series were last advanced. */
export function bestTiers(earnedIds: string[]): Achievement[] {
  const best = new Map<StatId, Achievement>();
  const order: StatId[] = [];
  for (const id of earnedIds) {
    const goal = achievementById(id);
    if (!goal) continue;
    const current = best.get(goal.series);
    if (!current || goal.tier > current.tier) best.set(goal.series, goal);
    const at = order.indexOf(goal.series);
    if (at >= 0) order.splice(at, 1);
    order.push(goal.series);
  }
  return order.map((series) => best.get(series)!);
}
export const TASTING_REWARD = { parts: 2, skinShards: 3, brandShards: 1 } as const;
