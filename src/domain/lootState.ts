import { BOOST_KINDS, EQUIPMENT, TIER_ORDER, PRESTIGE_PERKS, newSlot, type EquipmentSlot, type Pity, type Reward } from './loot';
import { REGIONS } from './catalog';

// The loot layer of a player's save: materials, consumables, boxes, per-bar equipment, gacha pity and prestige.
export interface DrawResult { id: string; label: string; rarity: 'common' | 'rare' | 'legendary'; duplicate: boolean; shards: number; }
export interface LootState {
  parts: number;
  skinShards: number;
  itemShards: Record<string, number>;
  consumables: Record<string, number>;
  boxes: Record<string, number>;
  // One-shot charges armed by consumables: golden-ice, voucher, second-chance.
  armed: Record<string, number>;
  // Timed boosters: kind → end time.
  boosts: Record<string, number>;
  equipment: Record<string, Record<string, EquipmentSlot>>;
  pity: Pity;
  pendingChoice?: Reward[];
  lastDraw: DrawResult[];
  prestige: { stars: number; earned: number; count: number; perks: Record<string, number> };
  // Coins earned since the last Grand Opening; sets the stars for the next one.
  runEarned: number;
  // Highest level whose level-up box was already granted.
  levelRewarded: number;
  log: string[];
  // Lifetime counters, this week's quest progress, claimed achievements and the tasting log (first serves).
  stats: Record<string, number>;
  quests: { week: number; progress: Record<string, number>; claimed: string[] };
  achievements: string[];
  tasted: string[];
}

export const createLoot = (): LootState => ({
  parts: 0, skinShards: 0, itemShards: {}, consumables: {}, boxes: {}, armed: {}, boosts: {},
  equipment: Object.fromEntries(REGIONS.map((region) => [region.id, Object.fromEntries(EQUIPMENT.map((item) => [item.id, newSlot()]))])),
  pity: { sinceRare: 0, sinceLegendary: 0 }, lastDraw: [],
  prestige: { stars: 0, earned: 0, count: 0, perks: {} }, runEarned: 0, levelRewarded: 1, log: [],
  stats: {}, quests: { week: 0, progress: {}, claimed: [] }, achievements: [], tasted: []
});

const count = (value: unknown, max = 1_000_000) => Number.isFinite(value) && (value as number) > 0 ? Math.min(max, Math.floor(value as number)) : 0;
function counts(value: unknown, allowed?: readonly string[]) {
  const result: Record<string, number> = {};
  if (!value || typeof value !== 'object') return result;
  for (const [key, amount] of Object.entries(value as Record<string, unknown>)) {
    if (allowed && !allowed.includes(key)) continue;
    const clean = count(amount);
    if (clean) result[key] = clean;
  }
  return result;
}

// Upgrades old or hand-edited saves in place: every field is checked, so a bad number can never become a balance.
export function normalizeLoot(input: unknown, currentLevel: number): LootState {
  const source = (input && typeof input === 'object' ? input : {}) as Partial<LootState>;
  const base = createLoot();
  const equipment = base.equipment;
  for (const region of REGIONS) for (const item of EQUIPMENT) {
    const saved = source.equipment?.[region.id]?.[item.id];
    const tier = TIER_ORDER.includes(saved?.tier as never) ? saved!.tier : 'common';
    equipment[region.id]![item.id] = { tier, level: Math.min(10, count(saved?.level, 10)) };
  }
  const boosts: Record<string, number> = {};
  for (const kind of BOOST_KINDS) if (Number.isFinite(source.boosts?.[kind])) boosts[kind] = source.boosts![kind]!;
  const perks: Record<string, number> = {};
  for (const perk of PRESTIGE_PERKS) perks[perk.id] = Math.min(perk.maxRank, count(source.prestige?.perks?.[perk.id], perk.maxRank));
  return {
    parts: count(source.parts), skinShards: count(source.skinShards),
    itemShards: counts(source.itemShards, EQUIPMENT.map((item) => item.id)),
    consumables: counts(source.consumables), boxes: counts(source.boxes, ['bronze', 'silver', 'gold', 'choice']),
    armed: counts(source.armed, ['golden-ice', 'voucher', 'second-chance']), boosts, equipment,
    pity: { sinceRare: count(source.pity?.sinceRare, 1000), sinceLegendary: count(source.pity?.sinceLegendary, 1000) },
    pendingChoice: Array.isArray(source.pendingChoice) && source.pendingChoice.length === 3 ? source.pendingChoice : undefined,
    lastDraw: Array.isArray(source.lastDraw) ? source.lastDraw.slice(0, 10) : [],
    prestige: { stars: count(source.prestige?.stars), earned: count(source.prestige?.earned), count: count(source.prestige?.count, 1000), perks },
    runEarned: count(source.runEarned, 1e12),
    levelRewarded: Math.max(1, count(source.levelRewarded, 50) || currentLevel),
    stats: counts(source.stats, ['serves', 'servesCoins', 'vips', 'bottles', 'boxes', 'draws', 'upgrades', 'tasted', 'perfectTalks', 'lessons']),
    quests: { week: count(source.quests?.week, 1e6), progress: counts(source.quests?.progress), claimed: Array.isArray(source.quests?.claimed) ? source.quests!.claimed.filter((id) => typeof id === 'string').slice(0, 10) : [] },
    achievements: Array.isArray(source.achievements) ? [...new Set(source.achievements.filter((id) => typeof id === 'string'))].slice(0, 50) : [],
    tasted: Array.isArray(source.tasted) ? [...new Set(source.tasted.filter((id) => typeof id === 'string'))].slice(0, 400) : [],
    log: Array.isArray(source.log) ? source.log.filter((line) => typeof line === 'string').slice(0, 20) : []
  };
}
