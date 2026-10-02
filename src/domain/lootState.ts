import { ARMED_CHARGES, BOOST_KINDS, EQUIPMENT, TIER_ORDER, newSlot, type EquipmentSlot, type Pity, type Reward } from './loot';
import { INGREDIENTS, REGIONS } from './catalog';
import { SEASON_MILESTONES } from './seasons';
import { SignatureError, validateSignature, type Signature } from './signature';
import { STAT_IDS, achievementById } from './quests';
import { CUSTOMER_ART_BY_SLOT } from '../data/cosmetics/artCatalog';

// The loot layer of a player's save: materials, consumables, boxes, per-bar equipment, gacha pity.
export interface DrawResult { id: string; label: string; rarity: 'common' | 'rare' | 'legendary'; duplicate: boolean; shards: number; }
export interface LootState {
  parts: number;
  skinShards: number;
  // Style shards are kept per style: each style (and the background that comes with it) has its own pile, 50 craft it.
  styleShards: Record<string, number>;
  // Old saves had one shared pool; it is split into per-style piles on load (see migrateStylePool) and then stays 0.
  stylePieces: number;
  itemShards: Record<string, number>;
  consumables: Record<string, number>;
  boxes: Record<string, number>;
  // One-shot charges armed by consumables: see ARMED_CHARGES.
  armed: Record<string, number>;
  // Timed boosters: kind → end time.
  boosts: Record<string, number>;
  equipment: Record<string, Record<string, EquipmentSlot>>;
  pity: Pity;
  pendingChoice?: Reward[];
  lastDraw: DrawResult[];
  // Highest level whose level-up box was already granted.
  levelRewarded: number;
  log: string[];
  // Lifetime counters, this week's quest progress, claimed achievements and the tasting log (first serves).
  stats: Record<string, number>;
  quests: { week: number; progress: Record<string, number>; claimed: string[] };
  achievements: string[];
  tasted: string[];
  // Loyalty points per guest portrait id (see domain/regulars.ts).
  regulars: Record<string, number>;
  // When spoilage last ran (server clock); 0 until the bar is old enough.
  spoiledAt: number;
  // Workshop gifts sent today (limit enforced in sim/gifts.ts).
  giftsSent?: { day: string; count: number };
  // One signature cocktail per bar, invented by the player.
  signatures: Record<string, Signature | undefined>;
  // XP earned in the current UTC week (the leaderboard score) and the last week whose reward was claimed.
  weekly: { week: number; score: number };
  leaderboardClaimed: number;
  // Seasonal banner progress: draws on this season's banner, milestone boxes already paid, and the spark pick.
  season: { id: string; draws: number; rewarded: number[]; spark: boolean };
  // The first bronze box a player opens always holds enough parts for a first upgrade.
  firstBoxOpened: boolean;
}

export const createLoot = (): LootState => ({
  parts: 0, skinShards: 0, styleShards: {}, stylePieces: 0, itemShards: {}, consumables: {}, boxes: {}, armed: {}, boosts: {},
  equipment: Object.fromEntries(REGIONS.map((region) => [region.id, Object.fromEntries(EQUIPMENT.map((item) => [item.id, newSlot()]))])),
  pity: { sinceRare: 0, sinceLegendary: 0 }, lastDraw: [],
  levelRewarded: 1, log: [],
  stats: {}, quests: { week: 0, progress: {}, claimed: [] }, achievements: [], tasted: [], regulars: {}, spoiledAt: 0, signatures: {}, weekly: { week: 0, score: 0 }, leaderboardClaimed: 0, season: { id: '', draws: 0, rewarded: [], spark: false }, firstBoxOpened: false
});

const count = (value: unknown, max = 1_000_000) => Number.isFinite(value) && (value as number) > 0 ? Math.min(max, Math.floor(value as number)) : 0;
// Piles of style shards: the key is the id of a style (cosmetic), so it only has to look like one.
function cleanPiles(value: unknown) {
  const result: Record<string, number> = {};
  if (!value || typeof value !== 'object') return result;
  for (const [key, amount] of Object.entries(value as Record<string, unknown>).slice(0, 400)) {
    if (!/^[\w:.-]{1,80}$/.test(key)) continue;
    const clean = count(amount);
    if (clean) result[key] = clean;
  }
  return result;
}
function counts(value: unknown, allowed?: readonly string[], max = 1_000_000) {
  const result: Record<string, number> = {};
  if (!value || typeof value !== 'object') return result;
  for (const [key, amount] of Object.entries(value as Record<string, unknown>)) {
    if (allowed && !allowed.includes(key)) continue;
    const clean = count(amount, max);
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
  return {
    parts: count(source.parts), skinShards: count(source.skinShards), styleShards: cleanPiles(source.styleShards), stylePieces: count(source.stylePieces),
    itemShards: counts(source.itemShards, EQUIPMENT.map((item) => item.id)),
    consumables: counts(source.consumables), boxes: counts(source.boxes, ['bronze', 'silver', 'gold', 'choice']),
    armed: counts(source.armed, ARMED_CHARGES), boosts, equipment,
    pity: { sinceRare: count(source.pity?.sinceRare, 1000), sinceLegendary: count(source.pity?.sinceLegendary, 1000) },
    pendingChoice: Array.isArray(source.pendingChoice) && source.pendingChoice.length === 3 ? source.pendingChoice : undefined,
    lastDraw: Array.isArray(source.lastDraw) ? source.lastDraw.slice(0, 10) : [],
    levelRewarded: Math.max(1, count(source.levelRewarded, 50) || currentLevel),
    stats: counts(source.stats, STAT_IDS, 1_000_000_000),
    quests: { week: count(source.quests?.week, 1e6), progress: counts(source.quests?.progress), claimed: Array.isArray(source.quests?.claimed) ? source.quests!.claimed.filter((id) => typeof id === 'string').slice(0, 10) : [] },
    // Only achievements that exist are kept (one that was removed from the game disappears), and there is room for all of them.
    achievements: Array.isArray(source.achievements) ? [...new Set(source.achievements.filter((id) => typeof id === 'string' && !!achievementById(id)))] : [],
    tasted: Array.isArray(source.tasted) ? [...new Set(source.tasted.filter((id) => typeof id === 'string'))].slice(0, 400) : [],
    regulars: counts(source.regulars, CUSTOMER_ART_BY_SLOT),
    spoiledAt: count(source.spoiledAt, 1e14),
    signatures: cleanSignatures(source.signatures),
    weekly: { week: count(source.weekly?.week, 1e6), score: count(source.weekly?.score, 1e9) },
    leaderboardClaimed: count(source.leaderboardClaimed, 1e6),
    // Older saves that already opened boxes do not get the welcome bonus later.
    firstBoxOpened: typeof source.firstBoxOpened === 'boolean' ? source.firstBoxOpened : count(source.stats?.boxes) > 0,
    season: {
      id: typeof source.season?.id === 'string' && /^\d{4}-\d{2}$/.test(source.season.id) ? source.season.id : '',
      draws: count(source.season?.draws, 1e5),
      rewarded: Array.isArray(source.season?.rewarded) ? source.season!.rewarded.filter((value) => SEASON_MILESTONES.some((step) => step.draws === value)) : [],
      spark: source.season?.spark === true
    },
    giftsSent: typeof source.giftsSent?.day === 'string' ? { day: source.giftsSent.day.slice(0, 10), count: count(source.giftsSent.count, 1000) } : undefined,
    log: Array.isArray(source.log) ? source.log.filter((line) => typeof line === 'string').slice(0, 20) : []
  };
}

// Signatures are re-validated on load; anything invalid is dropped. Ingredient availability is not re-checked
// (a player who learned the recipes once keeps their creation), only names, amounts and structure.
function cleanSignatures(value: unknown): Record<string, Signature | undefined> {
  const result: Record<string, Signature | undefined> = {};
  if (!value || typeof value !== 'object') return result;
  const everything = new Set(INGREDIENTS.map((item) => item.id));
  for (const region of REGIONS) {
    const saved = (value as Record<string, Signature | undefined>)[region.id];
    if (!saved) continue;
    try {
      const clean = validateSignature(saved, everything);
      result[region.id] = { ...clean, served: count(saved.served, 1e6) };
    } catch (error) { if (!(error instanceof SignatureError)) throw error; }
  }
  return result;
}
