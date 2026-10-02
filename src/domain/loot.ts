import { BOX_STYLE_CHANCE } from '../data/cosmetics/styleSources';

// Pure tables for the loot layer: equipment, consumables, boxes, and the style draw.
// Nothing here touches state; sim/loot.ts applies these rules on the server.

// ---- Bar equipment ----
export type EquipmentId = 'shaker' | 'ice-machine' | 'fridge' | 'speakers' | 'register' | 'cellar';
export type EquipmentTier = 'common' | 'rare' | 'legendary';
export const TIER_ORDER: EquipmentTier[] = ['common', 'rare', 'legendary'];
export const TIER_LEVEL_CAP: Record<EquipmentTier, number> = { common: 5, rare: 8, legendary: 10 };
// Item shards needed to raise a tier (common → rare, rare → legendary).
export const TIER_SHARD_COST: Record<EquipmentTier, number | undefined> = { common: 8, rare: 20, legendary: undefined };
export const EQUIPMENT_MAX_LEVEL = 10;

export interface EquipmentDef {
  id: EquipmentId; name: string; icon: string; description: string;
  // Effect per level; every effect is capped by level 10 so no single item breaks the economy.
  perLevel: number; unit: string;
}
export const EQUIPMENT: EquipmentDef[] = [
  { id: 'shaker', name: 'Pro shaker', icon: '🍸', description: 'Guests tip more often.', perLevel: .02, unit: 'tip chance' },
  { id: 'ice-machine', name: 'Ice machine', icon: '🧊', description: 'Every drink pours a little less liquid from stock.', perLevel: .015, unit: 'liquid saved' },
  { id: 'fridge', name: 'Back-bar fridge', icon: '❄️', description: 'Deliveries arrive sooner (3% per level). It also raises storeroom capacity (+10% per level) and slows spoilage of fresh produce.', perLevel: .03, unit: 'faster deliveries' },
  { id: 'speakers', name: 'Sound system', icon: '🎷', description: 'Guests wait longer before they leave.', perLevel: .025, unit: 'guest patience' },
  { id: 'register', name: 'Cash register', icon: '💰', description: 'Guests pay more for every drink.', perLevel: .015, unit: 'drink price' },
  { id: 'cellar', name: 'Wine cellar', icon: '🍾', description: 'Bottle restocking costs fewer crystals.', perLevel: .02, unit: 'bottle cost' }
];
export const equipmentDef = (id: string) => EQUIPMENT.find((item) => item.id === id);

export interface EquipmentSlot { level: number; tier: EquipmentTier; }
export const newSlot = (): EquipmentSlot => ({ level: 0, tier: 'common' });

export function levelCap(tier: EquipmentTier) {
  return Math.min(EQUIPMENT_MAX_LEVEL, TIER_LEVEL_CAP[tier]);
}
// Coins and workshop parts needed to go from `level` to `level + 1`.
export function upgradeCostFor(level: number) {
  const next = level + 1;
  return { coins: Math.round(35 * Math.pow(next, 1.5)), parts: 1 + Math.ceil(next * 1.5) };
}

// ---- Materials and consumables ----
export type ConsumableId = 'happy-hour' | 'golden-ice' | 'voucher' | 'courier' | 'scroll' | 'second-chance' | 'calm-charm' | 'whisper' | 'steady-hand' | 'xp-boost' | 'coin-boost' | 'tip-boost' | 'vip-magnet';
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
  { id: 'calm-charm', name: 'Calm Charm', icon: '🕊️', kind: 'charge', crystalPrice: 35, description: 'The next problem with a guest cannot go badly: nobody leaves angry, and no fine, damage or complaint counts.' },
  { id: 'whisper', name: 'Whisper', icon: '💬', kind: 'charge', crystalPrice: 30, description: 'In the next guest situation the best answers are marked, so you can learn the right words.' },
  { id: 'steady-hand', name: 'Steady Hand', icon: '🎯', kind: 'charge', crystalPrice: 30, description: 'Your next drink counts as perfect if every ingredient is right and the amounts are within 25%.' },
  { id: 'courier', name: 'Express Courier', icon: '🚚', kind: 'instant', crystalPrice: 35, description: 'The next delivery of this bar arrives right now.' },
  { id: 'scroll', name: 'Recipe Scroll', icon: '📜', kind: 'instant', crystalPrice: 70, description: 'A mastery card for a recipe you already know.' }
];
export const consumableDef = (id: string) => CONSUMABLES.find((item) => item.id === id);
export const BOOST_KINDS = ['happy-hour', 'xp-boost', 'coin-boost', 'tip-boost'] as const;

// ---- Boxes ----
export type BoxKind = 'bronze' | 'silver' | 'gold' | 'choice';
export const BOXES: { id: BoxKind; name: string; icon: string; crystalPrice?: number; description: string }[] = [
  { id: 'bronze', name: 'Bronze box', icon: '📦', crystalPrice: 30, description: 'Random: parts, coins and common consumables.' },
  { id: 'silver', name: 'Silver box', icon: '🎁', crystalPrice: 90, description: 'Random: better rolls, item shards and boosters.' },
  { id: 'gold', name: 'Gold box', icon: '🏆', crystalPrice: 240, description: 'Random: crystals, skin shards, recipe cards, mystery bottles and special-event backgrounds.' },
  { id: 'choice', name: 'Choice box', icon: '🧭', description: 'Pick one of three rewards. Earned from achievements and level milestones.' }
];
export const boxDef = (id: string) => BOXES.find((item) => item.id === id);

export type Reward =
  | { kind: 'coins'; amount: number }
  | { kind: 'crystals'; amount: number }
  | { kind: 'parts'; amount: number }
  | { kind: 'skinShards'; amount: number }
  | { kind: 'stylePieces'; amount: number }   // style shards
  | { kind: 'xp'; amount: number }
  | { kind: 'box'; box: Exclude<BoxKind, 'choice'> }
  | { kind: 'companionShards'; amount: number }   // shards of one Circle person who has not joined yet
  | { kind: 'prestige'; amount: number }   // bar prestige (popularity)
  | { kind: 'supplies'; size: 'small' | 'medium' | 'large' }   // stock of every ingredient the player's recipes use
  | { kind: 'style' }   // a whole painted style that only boxes give, picked at random from those you do not own
  | { kind: 'itemShards'; id: EquipmentId; amount: number }
  | { kind: 'consumable'; id: ConsumableId; amount: number }
  | { kind: 'recipeCard' }
  | { kind: 'mysteryBottle' }
  | { kind: 'eventInterior' };   // a special-event background, picked at random from those you do not own

interface Entry { weight: number; make: (level: number, random: () => number) => Reward; }
export const between = (random: () => number, min: number, max: number) => min + Math.floor(random() * (max - min + 1));
const pick = <T,>(items: readonly T[], random: () => number) => items[Math.min(items.length - 1, Math.floor(random() * items.length))]!;
const consumable = (ids: ConsumableId[], amount = 1): Entry['make'] => (_l, random) => ({ kind: 'consumable', id: pick(ids, random), amount });
const shards = (min: number, max: number): Entry['make'] => (_l, random) => ({ kind: 'itemShards', id: pick(EQUIPMENT, random).id, amount: between(random, min, max) });

export const BOX_TABLES: Record<Exclude<BoxKind, 'choice'>, Entry[]> = {
  bronze: [
    { weight: 30, make: (_l, r) => ({ kind: 'parts', amount: between(r, 3, 6) }) },
    { weight: 26, make: (l, r) => ({ kind: 'coins', amount: Math.round(between(r, 25, 50) * (1 + l / 25)) }) },
    { weight: 20, make: consumable(['golden-ice', 'voucher', 'second-chance', 'whisper']) },
    { weight: 10, make: consumable(['tip-boost', 'happy-hour']) },
    { weight: 8, make: shards(1, 2) },
    { weight: 4, make: (_l, r) => ({ kind: 'skinShards', amount: between(r, 2, 4) }) },
    { weight: 2, make: (_l, r) => ({ kind: 'crystals', amount: between(r, 5, 10) }) }
  ],
  silver: [
    { weight: 24, make: (_l, r) => ({ kind: 'parts', amount: between(r, 6, 12) }) },
    { weight: 20, make: (l, r) => ({ kind: 'coins', amount: Math.round(between(r, 60, 120) * (1 + l / 25)) }) },
    { weight: 16, make: shards(3, 6) },
    { weight: 14, make: consumable(['xp-boost', 'coin-boost', 'tip-boost', 'happy-hour']) },
    { weight: 10, make: consumable(['courier', 'golden-ice', 'voucher', 'calm-charm', 'steady-hand']) },
    { weight: 8, make: (_l, r) => ({ kind: 'skinShards', amount: between(r, 4, 9) }) },
    { weight: 6, make: (_l, r) => ({ kind: 'crystals', amount: between(r, 12, 25) }) },
    { weight: 2, make: () => ({ kind: 'recipeCard' }) },
    { weight: 2, make: () => ({ kind: 'eventInterior' }) }
  ],
  gold: [
    { weight: 22, make: (_l, r) => ({ kind: 'crystals', amount: between(r, 30, 60) }) },
    { weight: 18, make: shards(6, 12) },
    { weight: 16, make: (_l, r) => ({ kind: 'skinShards', amount: between(r, 10, 20) }) },
    { weight: 14, make: () => ({ kind: 'recipeCard' }) },
    { weight: 10, make: () => ({ kind: 'mysteryBottle' }) },
    { weight: 8, make: consumable(['vip-magnet', 'scroll']) },
    { weight: 8, make: () => ({ kind: 'eventInterior' }) },
    { weight: 8, make: (l, r) => ({ kind: 'coins', amount: Math.round(between(r, 200, 350) * (1 + l / 25)) }) },
    { weight: 4, make: (_l, r) => ({ kind: 'parts', amount: between(r, 20, 30) }) }
  ]
};

// Extra drops, each given as its exact chance per box (the older entries share what is left). Style shards drip out
// of every box: 1 shard is 22%, and bigger piles of 2, 5, 10 and 25 are rarer. Every box also has a 0.5% chance of a
// whole style, and a small chance of XP, a prestige star, a coin jackpot, a double booster or a pile of upgrade items.
type Chance = [percent: number, make: Entry['make']];
const shardsOf = (amount: number): Entry['make'] => () => ({ kind: 'stylePieces', amount });
const anyBooster = (amount: number): Entry['make'] => consumable(['xp-boost', 'coin-boost', 'tip-boost', 'happy-hour'], amount);
const LOW_CHANCE: Record<Exclude<BoxKind, 'choice'>, Chance[]> = {
  bronze: [
    [22, shardsOf(1)], [6, shardsOf(2)], [1.5, shardsOf(5)], [.4, shardsOf(10)], [.1, shardsOf(25)],
    [BOX_STYLE_CHANCE * 100, () => ({ kind: 'style' })],
    [6, () => ({ kind: 'companionShards', amount: 1 })],
    [3, (_l, r) => ({ kind: 'xp', amount: between(r, 30, 60) })]
  ],
  silver: [
    [22, shardsOf(1)], [8, shardsOf(2)], [3, shardsOf(5)], [1, shardsOf(10)], [.3, shardsOf(25)],
    [BOX_STYLE_CHANCE * 100, () => ({ kind: 'style' })],
    [8, (_l, r) => ({ kind: 'companionShards', amount: between(r, 1, 2) })],
    [4, (_l, r) => ({ kind: 'xp', amount: between(r, 100, 200) })],
    [1.5, (l, r) => ({ kind: 'coins', amount: Math.round(between(r, 400, 700) * (1 + l / 25)) })],
    [3, anyBooster(2)],
    [3, shards(10, 18)],
    [.3, () => ({ kind: 'prestige', amount: 1 })]
  ],
  gold: [
    [22, shardsOf(1)], [12, shardsOf(2)], [6, shardsOf(5)], [2.5, shardsOf(10)], [.8, shardsOf(25)],
    [BOX_STYLE_CHANCE * 100, () => ({ kind: 'style' })],
    [10, (_l, r) => ({ kind: 'companionShards', amount: between(r, 2, 3) })],
    [5, (_l, r) => ({ kind: 'xp', amount: between(r, 300, 600) })],
    [3, (l, r) => ({ kind: 'coins', amount: Math.round(between(r, 800, 1500) * (1 + l / 25)) })],
    [5, anyBooster(3)],
    [5, shards(20, 30)],
    [1.5, () => ({ kind: 'prestige', amount: 1 })]
  ]
};
for (const kind of Object.keys(LOW_CHANCE) as (keyof typeof LOW_CHANCE)[]) {
  const table = BOX_TABLES[kind];
  const extra = LOW_CHANCE[kind];
  const share = extra.reduce((sum, [percent]) => sum + percent, 0) / 100;
  const total = table.reduce((sum, entry) => sum + entry.weight, 0) / (1 - share);
  for (const [percent, make] of extra) table.push({ weight: total * percent / 100, make });
}

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
    case 'stylePieces': return `${reward.amount} style shard${reward.amount === 1 ? '' : 's'}`;
    case 'xp': return `${reward.amount} XP`;
    case 'box': return `a ${reward.box} box`;
    case 'companionShards': return `${reward.amount} Circle shard${reward.amount === 1 ? '' : 's'}`;
    case 'prestige': return `${reward.amount} bar prestige`;
    case 'supplies': return `a ${reward.size} pack of supplies`;
    case 'style': return 'a full bartender style'; 
    case 'itemShards': return `${reward.amount} ${names.equipment(reward.id)} shards`;
    case 'consumable': return `${reward.amount} × ${names.consumable(reward.id)}`;
    case 'recipeCard': return 'a recipe card';
    case 'mysteryBottle': return 'a mystery bottle';
    case 'eventInterior': return 'a special background with its matching style';
  }
}

// ---- Style draw (skins gacha) ----
export const DRAW_COST = { single: 50, ten: 450 } as const;
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
export const ARMED_CHARGES = ['golden-ice', 'voucher', 'second-chance', 'calm-charm', 'whisper', 'steady-hand'] as const;

export const STARTING_COINS = 600;
