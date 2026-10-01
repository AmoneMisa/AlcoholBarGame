import type { BoxKind } from './loot';

// Weekly quests and lifetime achievements. Both read the same counters (`loot.stats`), which only server rules increase.
export const STAT_IDS = ['serves', 'servesCoins', 'vips', 'bottles', 'boxes', 'draws', 'upgrades', 'tasted', 'perfectTalks', 'lessons', 'signatures',
  'coinsSpent', 'crystalsSpent', 'backgrounds', 'bars', 'skins', 'visitedBy', 'visitedFriends', 'prestiges', 'giftsSent', 'giftsGot', 'barUpgrades', 'level', 'staffHired', 'staffLevels', 'loginDays', 'companions', 'bonds'] as const;
export type StatId = typeof STAT_IDS[number];
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
  { stat: 'tasted', name: 'Sommelier', rows: [['a-taste-8', 'Taster: taste 8 recipes', 8, 'bronze', 8], ['a-taste-20', 'Sommelier: taste 20 recipes', 20, 'silver', 25], ['a-taste-40', 'Connoisseur: taste 40 recipes', 40, 'silver', 45], ['a-taste-60', 'Master of flavours: taste 60 recipes', 60, 'choice', 80]] },
  { stat: 'coinsSpent', name: 'Big spender', rows: [['a-coins-1k', 'Pocket money: spend 1,000 coins', 1000, 'bronze', 5], ['a-coins-25k', 'Investor: spend 25,000 coins', 25000, 'silver', 20], ['a-coins-250k', 'Magnate: spend 250,000 coins', 250000, 'silver', 45], ['a-coins-2m', 'Tycoon: spend 2,000,000 coins', 2000000, 'choice', 100]] },
  { stat: 'crystalsSpent', name: 'Crystal spender', rows: [['a-crystals-50', 'Sparkle: use 50 crystals', 50, 'bronze', 5], ['a-crystals-300', 'Jeweller: use 300 crystals', 300, 'silver', 20], ['a-crystals-1500', 'Gem collector: use 1,500 crystals', 1500, 'silver', 45], ['a-crystals-6000', 'Crystal baron: use 6,000 crystals', 6000, 'choice', 100]] },
  { stat: 'backgrounds', name: 'Interior designer', rows: [['a-bg-4', 'Decorator: own 4 backgrounds', 4, 'bronze', 8], ['a-bg-8', 'Designer: own 8 backgrounds', 8, 'silver', 25], ['a-bg-12', 'Curator: own 12 backgrounds', 12, 'silver', 45], ['a-bg-16', 'Gallery owner: own 16 backgrounds', 16, 'choice', 90]] },
  { stat: 'bars', name: 'Bar owner', rows: [['a-bars-2', 'Second home: open 2 bars', 2, 'bronze', 10], ['a-bars-3', 'Small chain: open 3 bars', 3, 'silver', 25], ['a-bars-4', 'Big chain: open 4 bars', 4, 'silver', 45], ['a-bars-6', 'Bar empire: open all 6 bars', 6, 'choice', 100]] },
  { stat: 'skins', name: 'Collector', rows: [['a-skins-10', 'New wardrobe: collect 10 styles', 10, 'bronze', 8], ['a-skins-25', 'Stylist: collect 25 styles', 25, 'silver', 25], ['a-skins-50', 'Wardrobe master: collect 50 styles', 50, 'silver', 45], ['a-skins-80', 'Museum of style: collect 80 styles', 80, 'choice', 90]] },
  { stat: 'visitedBy', name: 'Popular bar', rows: [['a-visited-1', 'First guest: 1 friend visit to your bar', 1, 'bronze', 5], ['a-visited-5', 'Open doors: 5 friend visits', 5, 'silver', 15], ['a-visited-20', 'Meeting place: 20 friend visits', 20, 'silver', 35], ['a-visited-60', 'Neighbourhood landmark: 60 friend visits', 60, 'choice', 80]] },
  { stat: 'visitedFriends', name: 'Good neighbour', rows: [['a-visits-1', 'Say hello: visit a friend 1 time', 1, 'bronze', 5], ['a-visits-5', 'Regular visitor: 5 visits', 5, 'silver', 15], ['a-visits-20', 'Bar hopper: 20 visits', 20, 'silver', 35], ['a-visits-60', 'Guest of honour: 60 visits', 60, 'choice', 80]] },
  { stat: 'prestiges', name: 'Grand opening', rows: [['a-prestige-1', 'Fresh start: 1 Grand Opening', 1, 'bronze', 20], ['a-prestige-3', 'Reborn: 3 Grand Openings', 3, 'silver', 40], ['a-prestige-7', 'Phoenix: 7 Grand Openings', 7, 'choice', 70], ['a-prestige-15', 'Eternal: 15 Grand Openings', 15, 'choice', 120]] },
  { stat: 'giftsSent', name: 'Generous', rows: [['a-sent-1', 'Kind gesture: send 1 gift', 1, 'bronze', 5], ['a-sent-10', 'Gift giver: send 10 gifts', 10, 'silver', 20], ['a-sent-40', 'Santa: send 40 gifts', 40, 'silver', 40], ['a-sent-120', 'Patron of friends: send 120 gifts', 120, 'choice', 90]] },
  { stat: 'giftsGot', name: 'Beloved', rows: [['a-got-1', 'Surprise: get 1 gift', 1, 'bronze', 5], ['a-got-10', 'Well liked: get 10 gifts', 10, 'silver', 20], ['a-got-40', 'Spoiled: get 40 gifts', 40, 'silver', 40], ['a-got-120', 'Friend of all: get 120 gifts', 120, 'choice', 90]] },
  { stat: 'barUpgrades', name: 'Well equipped', rows: [['a-equipped-1', 'Fitted out: 1 bar with all equipment at level 5', 1, 'bronze', 15], ['a-equipped-2', '2 bars with all equipment at level 5', 2, 'silver', 30], ['a-equipped-4', '4 bars with all equipment at level 5', 4, 'silver', 55], ['a-equipped-6', 'Perfect chain: all 6 bars at level 5', 6, 'choice', 110]] },
  { stat: 'level', name: 'Rising star', rows: [['a-level-15', 'Rising star: reach level 15', 15, 'silver', 25], ['a-level-25', 'Established: reach level 25', 25, 'silver', 45], ['a-level-40', 'Renowned: reach level 40', 40, 'choice', 80], ['a-level-50', 'Legend: reach level 50', 50, 'choice', 150]] },
  { stat: 'staffHired', name: 'Employer', rows: [['a-staff-1', 'First hire: hire 1 server', 1, 'bronze', 10], ['a-staff-4', 'Small staff: hire 4 servers in all bars', 4, 'silver', 20], ['a-staff-12', 'Busy bars: hire 12 servers in all bars', 12, 'silver', 40], ['a-staff-24', 'Full house: a full team of 4 in all 6 bars', 24, 'choice', 100]] },
  { stat: 'staffLevels', name: 'Trainer', rows: [['a-train-5', 'Trainer: 5 server levels in all bars', 5, 'bronze', 10], ['a-train-20', 'Coach: 20 server levels in all bars', 20, 'silver', 25], ['a-train-60', 'Mentor: 60 server levels in all bars', 60, 'silver', 50], ['a-train-120', 'Grand master: every server fully trained in every bar', 120, 'choice', 100]] },
  { stat: 'loginDays', name: 'Loyal player', rows: [['a-login-3', 'Coming back: 3 days in a row', 3, 'bronze', 8], ['a-login-7', 'A full week: 7 days in a row', 7, 'silver', 25], ['a-login-14', 'Two weeks: 14 days in a row', 14, 'silver', 45], ['a-login-30', 'A whole month: 30 days in a row', 30, 'choice', 100]] },
  { stat: 'companions', name: 'Inner circle', rows: [['a-circle-1', 'New friend: 1 person joins your circle', 1, 'bronze', 10], ['a-circle-4', 'Good company: 4 people in your circle', 4, 'silver', 30], ['a-circle-8', 'Full table: 8 people in your circle', 8, 'silver', 60], ['a-circle-15', 'Everyone is here: all 15 people in your circle', 15, 'choice', 150]] },
  { stat: 'bonds', name: 'Close bonds', rows: [['a-bond-1', 'Close friends: 1 person at bond level 4', 1, 'bronze', 15], ['a-bond-3', 'Three close friends', 3, 'silver', 35], ['a-bond-6', 'Six close friends', 6, 'silver', 70], ['a-bond-15', 'Close friends with all 15 people', 15, 'choice', 200]] }
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
