// Pure tables for the loot layer: equipment, consumables, boxes, the style draw and prestige.
// Nothing here touches state; sim/loot.ts applies these rules on the server.

// ---- Bar equipment ----
export type EquipmentId = 'shaker' | 'ice-machine' | 'fridge' | 'speakers' | 'register' | 'cellar';
export type EquipmentTier = 'common' | 'rare' | 'legendary';
export const TIER_ORDER: EquipmentTier[] = ['common', 'rare', 'legendary'];
export const TIER_LEVEL_CAP: Record<EquipmentTier, number> = { common: 5, rare: 8, legendary: 10 };
// Item shards needed to raise a tier (common → rare, rare → legendary).
export const TIER_SHARD_COST: Record<EquipmentTier, number | undefined> = { common: 10, rare: 25, legendary: undefined };
export const EQUIPMENT_MAX_LEVEL = 10;

export interface EquipmentDef {
  id: EquipmentId; name: string; icon: string; description: string;
  // Effect per level; every effect is capped by level 10 so no single item breaks the economy.
  perLevel: number; unit: string;
}
export const EQUIPMENT: EquipmentDef[] = [
  { id: 'shaker', name: 'Pro shaker', icon: '🍸', description: 'Guests tip more often.', perLevel: .015, unit: 'tip chance' },
  { id: 'ice-machine', name: 'Ice machine', icon: '🧊', description: 'Every drink pours a little less liquid from stock.', perLevel: .015, unit: 'liquid saved' },
  { id: 'fridge', name: 'Back-bar fridge', icon: '❄️', description: 'Supplier deliveries arrive sooner.', perLevel: .03, unit: 'faster deliveries' },
  { id: 'speakers', name: 'Sound system', icon: '🎷', description: 'Guests wait longer before they leave.', perLevel: .025, unit: 'guest patience' },
  { id: 'register', name: 'Cash register', icon: '💰', description: 'Guests pay more for every drink.', perLevel: .012, unit: 'drink price' },
  { id: 'cellar', name: 'Wine cellar', icon: '🍾', description: 'Bottle restocking costs fewer crystals.', perLevel: .02, unit: 'bottle cost' }
];
export const equipmentDef = (id: string) => EQUIPMENT.find((item) => item.id === id);

export interface EquipmentSlot { level: number; tier: EquipmentTier; }
export const newSlot = (): EquipmentSlot => ({ level: 0, tier: 'common' });

export function levelCap(tier: EquipmentTier, prestigeCapBonus = 0) {
  return Math.min(EQUIPMENT_MAX_LEVEL, TIER_LEVEL_CAP[tier] + prestigeCapBonus);
}
// Coins and workshop parts needed to go from `level` to `level + 1`.
export function upgradeCostFor(level: number) {
  const next = level + 1;
  return { coins: Math.round(90 * Math.pow(next, 1.7)), parts: 2 + next * 2 };
}

// ---- Materials and consumables ----
export type ConsumableId = 'happy-hour' | 'golden-ice' | 'voucher' | 'courier' | 'scroll' | 'second-chance' | 'xp-boost' | 'coin-boost' | 'tip-boost' | 'vip-magnet';
export interface ConsumableDef { id: ConsumableId; name: string; icon: string; description: string; crystalPrice: number; kind: 'boost' | 'charge' | 'instant'; durationMs?: number; }
const MIN = 60_000;
export const CONSUMABLES: ConsumableDef[] = [
  { id: 'happy-hour', name: 'Happy Hour Token', icon: '🎉', kind: 'boost', durationMs: 30 * MIN, crystalPrice: 45, description: 'Guests arrive twice as fast for 30 minutes.' },
  { id: 'xp-boost', name: 'XP Booster', icon: '📈', kind: 'boost', durationMs: 60 * MIN, crystalPrice: 60, description: '+50% XP from serving and bottle sales for 1 hour.' },
  { id: 'coin-boost', name: 'Coin Booster', icon: '🪙', kind: 'boost', durationMs: 60 * MIN, crystalPrice: 60, description: 'Guests pay 25% more for 1 hour.' },
  { id: 'tip-boost', name: 'Tip Booster', icon: '💵', kind: 'boost', durationMs: 30 * MIN, crystalPrice: 40, description: 'Every guest tips for 30 minutes.' },
  { id: 'vip-magnet', name: 'VIP Magnet', icon: '💎', kind: 'instant', crystalPrice: 80, description: 'The next 5 guests are VIPs.' },
  { id: 'golden-ice', name: 'Golden Ice', icon: '✨', kind: 'charge', crystalPrice: 30, description: 'Your next perfect serve pays +50% and always tips.' },
  { id: 'voucher', name: 'Supplier Voucher', icon: '🏷️', kind: 'charge', crystalPrice: 25, description: 'Your next supplier order costs 20% less.' },
  { id: 'second-chance', name: 'Second Chance', icon: '🛟', kind: 'charge', crystalPrice: 25, description: 'Your next wrong drink refunds its ingredients and keeps your streak.' },
  { id: 'courier', name: 'Express Courier', icon: '🚚', kind: 'instant', crystalPrice: 35, description: 'The next delivery of this bar arrives right now.' },
  { id: 'scroll', name: 'Recipe Scroll', icon: '📜', kind: 'instant', crystalPrice: 70, description: 'A mastery card for a recipe you already know.' }
];
export const consumableDef = (id: string) => CONSUMABLES.find((item) => item.id === id);
export const BOOST_KINDS = ['happy-hour', 'xp-boost', 'coin-boost', 'tip-boost'] as const;
export type BoostKind = typeof BOOST_KINDS[number];

// ---- Boxes ----
export type BoxKind = 'bronze' | 'silver' | 'gold' | 'choice';
export const BOXES: { id: BoxKind; name: string; icon: string; crystalPrice?: number; description: string }[] = [
  { id: 'bronze', name: 'Bronze box', icon: '📦', crystalPrice: 30, description: 'Random: parts, coins and common consumables.' },
  { id: 'silver', name: 'Silver box', icon: '🎁', crystalPrice: 90, description: 'Random: better rolls, item shards and boosters.' },
  { id: 'gold', name: 'Gold box', icon: '🏆', crystalPrice: 240, description: 'Random: crystals, skin shards, recipe cards and mystery bottles.' },
  { id: 'choice', name: 'Choice box', icon: '🧭', description: 'Pick one of three rewards. Earned from prestige, achievements and level milestones.' }
];
export const boxDef = (id: string) => BOXES.find((item) => item.id === id);

export type Reward =
  | { kind: 'coins'; amount: number }
  | { kind: 'crystals'; amount: number }
  | { kind: 'parts'; amount: number }
  | { kind: 'skinShards'; amount: number }
  | { kind: 'itemShards'; id: EquipmentId; amount: number }
  | { kind: 'consumable'; id: ConsumableId; amount: number }
  | { kind: 'recipeCard' }
  | { kind: 'mysteryBottle' };

interface Entry { weight: number; make: (level: number, random: () => number) => Reward; }
const between = (random: () => number, min: number, max: number) => min + Math.floor(random() * (max - min + 1));
const pick = <T,>(items: readonly T[], random: () => number) => items[Math.min(items.length - 1, Math.floor(random() * items.length))]!;
const consumable = (ids: ConsumableId[], amount = 1): Entry['make'] => (_l, random) => ({ kind: 'consumable', id: pick(ids, random), amount });
const shards = (min: number, max: number): Entry['make'] => (_l, random) => ({ kind: 'itemShards', id: pick(EQUIPMENT, random).id, amount: between(random, min, max) });

export const BOX_TABLES: Record<Exclude<BoxKind, 'choice'>, Entry[]> = {
  bronze: [
    { weight: 30, make: (_l, r) => ({ kind: 'parts', amount: between(r, 3, 6) }) },
    { weight: 26, make: (l, r) => ({ kind: 'coins', amount: Math.round(between(r, 60, 120) * (1 + l / 10)) }) },
    { weight: 20, make: consumable(['golden-ice', 'voucher', 'second-chance']) },
    { weight: 10, make: consumable(['tip-boost', 'happy-hour']) },
    { weight: 8, make: shards(1, 2) },
    { weight: 4, make: (_l, r) => ({ kind: 'skinShards', amount: between(r, 2, 4) }) },
    { weight: 2, make: (_l, r) => ({ kind: 'crystals', amount: between(r, 5, 10) }) }
  ],
  silver: [
    { weight: 24, make: (_l, r) => ({ kind: 'parts', amount: between(r, 6, 12) }) },
    { weight: 20, make: (l, r) => ({ kind: 'coins', amount: Math.round(between(r, 150, 320) * (1 + l / 10)) }) },
    { weight: 16, make: shards(2, 5) },
    { weight: 14, make: consumable(['xp-boost', 'coin-boost', 'tip-boost', 'happy-hour']) },
    { weight: 10, make: consumable(['courier', 'golden-ice', 'voucher']) },
    { weight: 8, make: (_l, r) => ({ kind: 'skinShards', amount: between(r, 4, 9) }) },
    { weight: 6, make: (_l, r) => ({ kind: 'crystals', amount: between(r, 12, 25) }) },
    { weight: 2, make: () => ({ kind: 'recipeCard' }) }
  ],
  gold: [
    { weight: 22, make: (_l, r) => ({ kind: 'crystals', amount: between(r, 30, 60) }) },
    { weight: 18, make: shards(5, 10) },
    { weight: 16, make: (_l, r) => ({ kind: 'skinShards', amount: between(r, 10, 20) }) },
    { weight: 14, make: () => ({ kind: 'recipeCard' }) },
    { weight: 10, make: () => ({ kind: 'mysteryBottle' }) },
    { weight: 8, make: consumable(['vip-magnet', 'scroll']) },
    { weight: 8, make: (l, r) => ({ kind: 'coins', amount: Math.round(between(r, 500, 900) * (1 + l / 10)) }) },
    { weight: 4, make: (_l, r) => ({ kind: 'parts', amount: between(r, 20, 30) }) }
  ]
};

export function rollFromTable(entries: Entry[], level: number, random: () => number): Reward {
  const total = entries.reduce((sum, entry) => sum + entry.weight, 0);
  let roll = random() * total;
  const chosen = entries.find((entry) => (roll -= entry.weight) < 0) ?? entries[0]!;
  return chosen.make(level, random);
}
export const rollBox = (kind: Exclude<BoxKind, 'choice'>, level: number, random: () => number) => rollFromTable(BOX_TABLES[kind], level, random);
// A choice box offers three different rewards from the silver and gold tables.
export function choiceOptions(level: number, random: () => number): Reward[] {
  const options: Reward[] = [];
  for (let attempt = 0; options.length < 3 && attempt < 40; attempt++) {
    const reward = rollBox(attempt % 2 ? 'gold' : 'silver', level, random);
    if (!options.some((item) => item.kind === reward.kind && ('id' in item && 'id' in reward ? item.id === reward.id : true))) options.push(reward);
  }
  while (options.length < 3) options.push({ kind: 'parts', amount: 10 + options.length });
  return options;
}

export function describeReward(reward: Reward, names: { consumable: (id: string) => string; equipment: (id: string) => string }) {
  switch (reward.kind) {
    case 'coins': return `${reward.amount} coins`;
    case 'crystals': return `${reward.amount} crystals`;
    case 'parts': return `${reward.amount} workshop parts`;
    case 'skinShards': return `${reward.amount} skin shards`;
    case 'itemShards': return `${reward.amount} ${names.equipment(reward.id)} shards`;
    case 'consumable': return `${reward.amount} × ${names.consumable(reward.id)}`;
    case 'recipeCard': return 'a recipe card';
    case 'mysteryBottle': return 'a mystery bottle';
  }
}

// ---- Style draw (skins gacha) ----
export const DRAW_COST = { single: 60, ten: 540 } as const;
export const LEGENDARY_PITY = 50;
export const RARE_PITY = 10;
// Base odds; shown in the interface. A duplicate becomes skin shards instead of a lost pull.
export const DRAW_ODDS = { common: .70, rare: .27, legendary: .03 } as const;
export const DUPLICATE_SHARDS = { common: 4, rare: 10, legendary: 25 } as const;
export const SHARD_CRAFT_COST = { common: 20, rare: 40, legendary: 100 } as const;
export const FEATURED_SHARE = .5;
const WEEK_MS = 7 * 24 * 60 * 60 * 1000;
// One featured legendary per week, chosen from the server clock.
export const featuredIndex = (now: number, count: number) => count ? Math.floor(now / WEEK_MS) % count : 0;

export interface Pity { sinceRare: number; sinceLegendary: number; }
export function rollRarity(pity: Pity, random: () => number): 'common' | 'rare' | 'legendary' {
  if (pity.sinceLegendary + 1 >= LEGENDARY_PITY) return 'legendary';
  const roll = random();
  if (roll < DRAW_ODDS.legendary) return 'legendary';
  if (pity.sinceRare + 1 >= RARE_PITY || roll < DRAW_ODDS.legendary + DRAW_ODDS.rare) return 'rare';
  return 'common';
}

// ---- Boosters that are not consumables ----
export const ARMED_CHARGES = ['golden-ice', 'voucher', 'second-chance'] as const;

// ---- Prestige ("Grand Opening") ----
export const PRESTIGE_LEVEL = 50;
export type PrestigePerkId = 'pay' | 'supply' | 'cap' | 'bank';
export const PRESTIGE_PERKS: { id: PrestigePerkId; name: string; description: string; maxRank: number }[] = [
  { id: 'pay', name: 'Renowned name', description: '+2% guest pay per rank.', maxRank: 10 },
  { id: 'supply', name: 'Trade contacts', description: '−2% supplier prices per rank.', maxRank: 8 },
  { id: 'cap', name: 'Master craftsmen', description: '+1 equipment level cap per rank.', maxRank: 3 },
  { id: 'bank', name: 'Family fortune', description: '+300 starting coins after each Grand Opening per rank.', maxRank: 5 }
];
export const perkCost = (rank: number) => rank + 1;
export const prestigeStarsFor = (runEarned: number) => 2 + Math.floor(Math.sqrt(Math.max(0, runEarned) / 400));
export const STARTING_COINS = 600;
