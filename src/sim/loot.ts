import { INGREDIENTS, RECIPES, REGIONS } from '../domain/catalog';
import { ALCOHOL_PRODUCTS } from '../domain/bottleCatalog';
import { coins } from '../domain/economy';
import { COSMETICS } from '../domain/cosmetics';
import { DUPLICATE_INTERIOR_SHARDS, EVENT_INTERIOR_IDS, INTERIORS } from '../data/cosmetics/bars';
import { economyAt, levelFor, MAX_LEVEL } from '../domain/progression';
import {
  BOOST_KINDS, BOXES, CONSUMABLES, DRAW_COST, DUPLICATE_SHARDS, EQUIPMENT, FEATURED_SHARE, PRESTIGE_LEVEL, PRESTIGE_PERKS, SHARD_CRAFT_COST, STARTING_COINS,
  TIER_ORDER, TIER_SHARD_COST, boxDef, choiceOptions, consumableDef, describeReward, equipmentDef, featuredIndex, levelCap, perkCost, prestigeStarsFor, rollBox, rollRarity,
  upgradeCostFor, type BoxKind, type EquipmentId, type PrestigePerkId, type Reward
} from '../domain/loot';
import { SEASON_FEATURED_SHARE, SEASON_MILESTONES, SPARK_DRAWS, seasonAt } from '../domain/seasons';
import { MIN_WEEKLY_SCORE, describeLeaderboardReward, leaderboardReward } from '../domain/leaderboard';
import { FAME_PRICE_BONUS, FAME_STEPS, SIGNATURE_FEE, SIGNATURE_GUEST_CHANCE, SIGNATURE_LEVEL, SignatureError, fameLevel, validateSignature } from '../domain/signature';
import { usableIngredientIds } from '../domain/usableStock';
import { SPOIL_MAX_DAYS, SPOIL_START_LEVEL, capacityFor, isPerishable, spoiledAmount } from '../domain/warehouse';
import { REGULAR_FAVORITE_BONUS, REGULAR_LEVELS, REGULAR_REWARDS, favoriteRecipeId, regularLevel } from '../domain/regulars';
import { CUSTOMER_ART_BY_SLOT } from '../data/cosmetics/artCatalog';
import type { Customer } from '../domain/types';
import { ACHIEVEMENTS, TASTING_REWARD, achievementById, achievementSeries, questById, questsForWeek, weekOf, type StatId } from '../domain/quests';
import type { DrawResult } from '../domain/lootState';
import { createLoot } from '../domain/lootState';
import { addSpareCopy, isStarterRecipe } from './recipes';
import { createInitialState, type PlayerState } from './state';

// Rules of the loot layer. They only run inside applyAction (server side); every input is checked here.

export class LootError extends Error {}
const MAX_LOG = 20;
const names = { consumable: (id: string) => consumableDef(id)?.name ?? id, equipment: (id: string) => equipmentDef(id)?.name ?? id };
const note = (state: PlayerState, text: string) => { state.loot.log = [text, ...state.loot.log].slice(0, MAX_LOG); state.message = text; };
const add = (map: Record<string, number>, key: string, amount: number) => { map[key] = (map[key] ?? 0) + amount; };
const take = (map: Record<string, number>, key: string, amount: number) => {
  map[key] = (map[key] ?? 0) - amount;
  if (map[key]! <= 0) delete map[key];
};
const has = (map: Record<string, number>, key: string, amount = 1) => (map[key] ?? 0) >= amount;
const slotOf = (state: PlayerState, id: string) => {
  const slot = state.loot.equipment[state.regionId]?.[id];
  if (!slot || !equipmentDef(id)) throw new LootError('Unknown equipment.');
  return slot;
};

// ---- Bonuses the other rules read ----
export const perkRank = (state: PlayerState, id: PrestigePerkId) => state.loot.prestige.perks[id] ?? 0;
export const boostActive = (state: PlayerState, kind: string, now: number) => (state.loot.boosts[kind] ?? 0) > now;
export const equipmentLevel = (state: PlayerState, id: EquipmentId, regionId = state.regionId) => state.loot.equipment[regionId]?.[id]?.level ?? 0;
const effect = (state: PlayerState, id: EquipmentId) => equipmentLevel(state, id) * equipmentDef(id)!.perLevel;

export function lootBonuses(state: PlayerState, now: number) {
  return {
    tipChance: effect(state, 'shaker'),
    liquidSaved: effect(state, 'ice-machine'),
    deliveryFactor: 1 - effect(state, 'fridge'),
    patienceFactor: 1 + effect(state, 'speakers'),
    // Cash register, prestige name and the Coin Booster multiply what guests pay.
    payFactor: (1 + effect(state, 'register')) * (1 + perkRank(state, 'pay') * .015) * (boostActive(state, 'coin-boost', now) ? 1.25 : 1),
    supplyFactor: 1 - perkRank(state, 'supply') * .02,
    bottleCostFactor: 1 - effect(state, 'cellar'),
    xpFactor: boostActive(state, 'xp-boost', now) ? 1.5 : 1,
    arrivalFactor: boostActive(state, 'happy-hour', now) ? .5 : 1,
    alwaysTips: boostActive(state, 'tip-boost', now)
  };
}
export const xpGain = (state: PlayerState, base: number, now: number) => Math.round(base * lootBonuses(state, now).xpFactor);

// ---- Rewards ----
function randomBottle(random: () => number) {
  const top = [...ALCOHOL_PRODUCTS].sort((a, b) => b.price - a.price).slice(0, Math.max(1, Math.ceil(ALCOHOL_PRODUCTS.length * .3)));
  return top[Math.min(top.length - 1, Math.floor(random() * top.length))]!;
}

export function grantReward(state: PlayerState, reward: Reward, random: () => number): string {
  const loot = state.loot;
  switch (reward.kind) {
    case 'coins': state.money = coins(state.money + reward.amount); break;
    case 'crystals': state.crystals += reward.amount; break;
    case 'parts': loot.parts += reward.amount; break;
    case 'skinShards': loot.skinShards += reward.amount; break;
    case 'itemShards': add(loot.itemShards, reward.id, reward.amount); break;
    case 'consumable': add(loot.consumables, reward.id, reward.amount); break;
    case 'recipeCard': {
      const known = RECIPES.filter((recipe) => state.knownRecipeIds.includes(recipe.id));
      const advanced = known.filter((recipe) => !isStarterRecipe(recipe.id));
      const pool = advanced.length ? advanced : known;
      const recipe = pool[Math.min(pool.length - 1, Math.floor(random() * pool.length))]!;
      addSpareCopy(state, recipe.id);
      return `a ${recipe.name} recipe card`;
    }
    case 'eventInterior': {
      const missing = EVENT_INTERIOR_IDS.filter((id) => !state.ownedInteriorIds.includes(id));
      if (!missing.length) { loot.skinShards += DUPLICATE_INTERIOR_SHARDS; return `${DUPLICATE_INTERIOR_SHARDS} skin shards (you own every event background)`; }
      const id = missing[Math.min(missing.length - 1, Math.floor(random() * missing.length))]!;
      state.ownedInteriorIds.push(id);
      return `the special event background “${INTERIORS.find((item) => item.id === id)!.name}”`;
    }
    case 'mysteryBottle': {
      const product = randomBottle(random);
      const shelf = state.bottleInventories[state.regionId];
      const stock = shelf.find((item) => item.productId === product.id);
      if (stock) stock.quantity += 1; else shelf.push({ productId: product.id, quantity: 1 });
      return `a sealed bottle of ${product.name}`;
    }
  }
  return describeReward(reward, names);
}

export function grantBox(state: PlayerState, kind: BoxKind, amount = 1) { add(state.loot.boxes, kind, amount); }

export function openBox(state: PlayerState, kind: string, random: () => number, now: number) {
  if (!boxDef(kind)) throw new LootError('Unknown box.');
  if (state.loot.pendingChoice) throw new LootError('Pick your reward from the open choice box first.');
  if (!has(state.loot.boxes, kind)) throw new LootError('You do not have this box.');
  const level = levelFor(state.xp);
  take(state.loot.boxes, kind, 1);
  track(state, 'boxes', 1, now);
  if (kind === 'choice') {
    state.loot.pendingChoice = choiceOptions(level, random);
    state.message = 'Choice box opened: pick one of three rewards.';
    return;
  }
  // The very first box a player opens always holds enough parts for a first equipment upgrade.
  const first = kind === 'bronze' && !state.loot.firstBoxOpened;
  if (kind === 'bronze') state.loot.firstBoxOpened = true;
  const reward: Reward = first ? { kind: 'parts', amount: 8 } : rollBox(kind as Exclude<BoxKind, 'choice'>, level, random);
  note(state, `${boxDef(kind)!.name}: ${grantReward(state, reward, random)}.`);
}

export function pickChoice(state: PlayerState, index: number, random: () => number) {
  const options = state.loot.pendingChoice;
  if (!options) throw new LootError('There is no open choice box.');
  const reward = options[Math.floor(index)];
  if (!reward) throw new LootError('Pick one of the three rewards.');
  state.loot.pendingChoice = undefined;
  note(state, `Choice box: ${grantReward(state, reward, random)}.`);
}

// ---- Shops ----
const quantityOf = (value: unknown, max: number) => Number.isFinite(value) ? Math.min(max, Math.max(1, Math.floor(value as number))) : 1;
export function buyBox(state: PlayerState, kind: string, quantity: unknown) {
  const box = boxDef(kind);
  if (!box?.crystalPrice) throw new LootError('This box is not for sale.');
  const amount = quantityOf(quantity, 10);
  const cost = box.crystalPrice * amount;
  if (state.crystals < cost) throw new LootError(`You need ${cost} crystals for ${amount} × ${box.name}.`);
  state.crystals -= cost;
  grantBox(state, box.id, amount);
  note(state, `Bought ${amount} × ${box.name} for ${cost} crystals.`);
}
export function buyConsumable(state: PlayerState, id: string, quantity: unknown) {
  const item = consumableDef(id);
  if (!item) throw new LootError('Unknown item.');
  const amount = quantityOf(quantity, 10);
  const cost = item.crystalPrice * amount;
  if (state.crystals < cost) throw new LootError(`You need ${cost} crystals for ${amount} × ${item.name}.`);
  state.crystals -= cost;
  add(state.loot.consumables, id, amount);
  note(state, `Bought ${amount} × ${item.name} for ${cost} crystals.`);
}

// ---- Consumables ----
export function useConsumable(state: PlayerState, id: string, recipeId: unknown, now: number) {
  const item = consumableDef(id);
  if (!item) throw new LootError('Unknown item.');
  if (!has(state.loot.consumables, id)) throw new LootError(`You have no ${item.name}.`);
  if ((BOOST_KINDS as readonly string[]).includes(id)) {
    if (boostActive(state, id, now)) throw new LootError(`${item.name} is already active.`);
    state.loot.boosts[id] = now + item.durationMs!;
    if (id === 'happy-hour' && !state.customers.length) state.nextCustomerAt = now + 1000;
    note(state, `${item.name} active: ${item.description}`);
  } else if (item.kind === 'charge') {
    if (has(state.loot.armed, id)) throw new LootError(`${item.name} is already armed.`);
    add(state.loot.armed, id, 1);
    note(state, `${item.name} armed: ${item.description}`);
  } else if (id === 'vip-magnet') {
    if (state.popularityBoost) throw new LootError('A guest boost is already active.');
    state.popularityBoost = { kind: 'vip-run', remaining: 5 };
    if (!state.customers.length) state.nextCustomerAt = now + 1000;
    note(state, 'VIP Magnet: the next 5 guests are VIPs.');
  } else if (id === 'courier') {
    const order = state.deliveryOrders.filter((entry) => entry.barId === state.regionId).sort((a, b) => a.dueAt - b.dueAt)[0];
    if (!order) throw new LootError('There is no delivery on its way to this bar.');
    order.dueAt = now;
    note(state, `Express Courier: the ${order.supplier} delivery is arriving now.`);
  } else if (id === 'scroll') {
    if (typeof recipeId !== 'string' || !state.knownRecipeIds.includes(recipeId) || !RECIPES.some((recipe) => recipe.id === recipeId)) throw new LootError('Choose a recipe you already know.');
    addSpareCopy(state, recipeId);
    note(state, `Recipe Scroll: +1 ${RECIPES.find((recipe) => recipe.id === recipeId)!.name} mastery card.`);
  }
  take(state.loot.consumables, id, 1);
}

// ---- Equipment ----
export function upgradeEquipment(state: PlayerState, id: string, now: number) {
  const slot = slotOf(state, id);
  const cap = levelCap(slot.tier, perkRank(state, 'cap'));
  if (slot.level >= cap) throw new LootError(TIER_SHARD_COST[slot.tier] ? 'Raise the item’s tier with shards to unlock more levels.' : 'This item is at its top level.');
  const cost = upgradeCostFor(slot.level);
  if (state.money < cost.coins) throw new LootError(`You need ${cost.coins} coins.`);
  if (state.loot.parts < cost.parts) throw new LootError(`You need ${cost.parts} workshop parts.`);
  state.money = coins(state.money - cost.coins);
  state.loot.parts -= cost.parts;
  slot.level += 1;
  track(state, 'upgrades', 1, now);
  note(state, `${equipmentDef(id)!.name} is now level ${slot.level} in this bar.`);
}
export function promoteEquipment(state: PlayerState, id: string) {
  const slot = slotOf(state, id);
  const cost = TIER_SHARD_COST[slot.tier];
  if (!cost) throw new LootError('This item is already legendary.');
  if (!has(state.loot.itemShards, id, cost)) throw new LootError(`You need ${cost} ${equipmentDef(id)!.name} shards.`);
  take(state.loot.itemShards, id, cost);
  slot.tier = TIER_ORDER[TIER_ORDER.indexOf(slot.tier) + 1]!;
  note(state, `${equipmentDef(id)!.name} is now ${slot.tier} tier (level cap ${levelCap(slot.tier, perkRank(state, 'cap'))}).`);
}

// ---- Style draw ----
export const featuredLegendary = (now: number) => {
  const legendary = COSMETICS.filter((item) => item.rarity === 'legendary');
  return legendary[featuredIndex(now, legendary.length)];
};
export type Banner = 'standard' | 'seasonal';
// The season's progress restarts when the UTC month changes.
function currentSeason(state: PlayerState, now: number) {
  const season = seasonAt(now);
  if (state.loot.season.id !== season.id) state.loot.season = { id: season.id, draws: 0, rewarded: [], spark: false };
  return season;
}
export function drawStyle(state: PlayerState, count: unknown, banner: unknown, now: number, random: () => number) {
  if (count !== 1 && count !== 10) throw new LootError('Choose a single draw or a ten-draw.');
  if (banner !== undefined && banner !== 'standard' && banner !== 'seasonal') throw new LootError('Unknown banner.');
  const seasonal = banner === 'seasonal';
  const cost = count === 1 ? DRAW_COST.single : DRAW_COST.ten;
  if (state.crystals < cost) throw new LootError(`You need ${cost} crystals for this draw.`);
  state.crystals -= cost;
  const loot = state.loot;
  const season = currentSeason(state, now);
  const results: DrawResult[] = [];
  const weekly = featuredLegendary(now);
  const featuredList = seasonal ? season.featuredIds.map((id) => COSMETICS.find((item) => item.id === id)!).filter(Boolean) : weekly ? [weekly] : [];
  const share = seasonal ? SEASON_FEATURED_SHARE : FEATURED_SHARE;
  for (let pull = 0; pull < count; pull++) {
    const rarity = rollRarity(loot.pity, random);
    loot.pity.sinceRare = rarity === 'common' ? loot.pity.sinceRare + 1 : 0;
    loot.pity.sinceLegendary = rarity === 'legendary' ? 0 : loot.pity.sinceLegendary + 1;
    const pool = COSMETICS.filter((item) => item.rarity === rarity);
    const reward = rarity === 'legendary' && featuredList.length && random() < share
      ? featuredList[Math.min(featuredList.length - 1, Math.floor(random() * featuredList.length))]!
      : pool[Math.min(pool.length - 1, Math.floor(random() * pool.length))]!;
    const duplicate = state.ownedCosmeticIds.includes(reward.id);
    const shards = duplicate ? DUPLICATE_SHARDS[rarity] : 0;
    if (duplicate) loot.skinShards += shards; else state.ownedCosmeticIds.push(reward.id);
    results.push({ id: reward.id, label: reward.label, rarity, duplicate, shards });
  }
  loot.lastDraw = results;
  track(state, 'draws', count, now);
  const best = results.find((item) => item.rarity === 'legendary') ?? results.find((item) => item.rarity === 'rare') ?? results[0]!;
  let text = `${seasonal ? `${season.name} banner` : 'Style draw'}: ${results.map((item) => item.label).join(', ')}${results.some((item) => item.duplicate) ? ` (duplicates became ${results.reduce((sum, item) => sum + item.shards, 0)} skin shards)` : ''}. Best: ${best.label}.`;
  if (seasonal) {
    const before = loot.season.draws;
    loot.season.draws += count;
    for (const step of SEASON_MILESTONES) {
      if (before < step.draws && loot.season.draws >= step.draws && !loot.season.rewarded.includes(step.draws)) {
        loot.season.rewarded.push(step.draws);
        grantBox(state, step.box);
        text += ` Season milestone ${step.draws} draws: ${step.label}!`;
      }
    }
    if (before < SPARK_DRAWS && loot.season.draws >= SPARK_DRAWS) text += ' You can now pick a featured style for free (Spark).';
  }
  note(state, text);
}
// Spark: after SPARK_DRAWS banner draws in a season the player may take one of that season's featured styles.
export function claimSpark(state: PlayerState, cosmeticId: unknown, now: number) {
  const season = currentSeason(state, now);
  if (state.loot.season.draws < SPARK_DRAWS) throw new LootError(`Draw ${SPARK_DRAWS} times on the season banner first (now ${state.loot.season.draws}).`);
  if (state.loot.season.spark) throw new LootError('You already used this season’s Spark.');
  const item = COSMETICS.find((entry) => entry.id === cosmeticId);
  if (!item || !season.featuredIds.includes(item.id)) throw new LootError('Pick one of this season’s featured styles.');
  if (state.ownedCosmeticIds.includes(item.id)) throw new LootError('You already own this style.');
  state.loot.season.spark = true;
  state.ownedCosmeticIds.push(item.id);
  note(state, `${item.label} claimed with Spark!`);
}
export function craftSkin(state: PlayerState, cosmeticId: unknown) {
  const item = COSMETICS.find((entry) => entry.id === cosmeticId);
  if (!item) throw new LootError('Unknown style.');
  if (state.ownedCosmeticIds.includes(item.id)) throw new LootError('You already own this style.');
  const cost = SHARD_CRAFT_COST[item.rarity];
  if (state.loot.skinShards < cost) throw new LootError(`You need ${cost} skin shards for ${item.label}.`);
  state.loot.skinShards -= cost;
  state.ownedCosmeticIds.push(item.id);
  note(state, `${item.label} crafted from ${cost} skin shards.`);
}

// ---- Drops from normal play ----
// Small, capped drops keep serving rewarding without a farmable exploit: everything is bound to a served guest.
export function dropAfterServe(state: PlayerState, vip: boolean, special: boolean, random: () => number) {
  const found: string[] = [];
  if (random() < .35) { const amount = 1 + Math.floor(random() * 3); state.loot.parts += amount; found.push(`${amount} workshop parts`); }
  if (special && random() < .4) { grantBox(state, 'silver'); found.push('a silver box'); }
  else if (vip && random() < .3) { grantBox(state, 'bronze'); found.push('a bronze box'); }
  return found.length ? ` Found ${found.join(' and ')}.` : '';
}
export function grantLevelBoxes(state: PlayerState) {
  const level = levelFor(state.xp);
  const gained: string[] = [];
  for (let next = state.loot.levelRewarded + 1; next <= level; next++) {
    // Every second level gives a bronze box, every fifth a silver one, every tenth a choice box.
    const kind: BoxKind | undefined = next % 10 === 0 ? 'choice' : next % 5 === 0 ? 'silver' : next % 2 === 0 ? 'bronze' : undefined;
    if (!kind) continue;
    grantBox(state, kind);
    gained.push(boxDef(kind)!.name);
  }
  state.loot.levelRewarded = Math.max(state.loot.levelRewarded, level);
  if (gained.length) state.message += ` Level ${level}! You earned ${gained.join(', ')}.`;
}
export function dailyStreakBox(state: PlayerState) {
  if (state.loginStreak > 0 && state.loginStreak % 7 === 0) {
    grantBox(state, 'silver');
    return ' Week streak bonus: a silver box!';
  }
  return '';
}

// ---- Prestige ----
export const canPrestige = (state: PlayerState) => levelFor(state.xp) >= PRESTIGE_LEVEL;
export function prestige(state: PlayerState, now: number) {
  if (!canPrestige(state)) throw new LootError(`Reach level ${PRESTIGE_LEVEL} for a Grand Opening.`);
  const stars = prestigeStarsFor(state.loot.runEarned);
  const fresh = createInitialState(now);
  const bank = perkRank(state, 'bank') * 300;
  const loot = state.loot;
  loot.prestige.stars += stars;
  loot.prestige.earned += stars;
  loot.prestige.count += 1;
  const reset = createLoot();
  loot.equipment = reset.equipment;
  loot.boosts = {}; loot.armed = {}; loot.pendingChoice = undefined; loot.runEarned = 0; loot.levelRewarded = 1;
  grantBox(state, 'choice');
  // Recipes, styles, crystals, bars, friends and materials survive; the business starts over.
  Object.assign(state, {
    money: STARTING_COINS + bank, xp: 0, streak: 0, inventories: fresh.inventories, bottleInventories: fresh.bottleInventories,
    customers: fresh.customers, activeCustomerId: fresh.activeCustomerId, conversationCustomerId: undefined, nextCustomerAt: 0, vipCooldownUntil: 0,
    lastClockAt: now, deliveryOrders: [], autoSupply: undefined, popularityBoost: undefined, negotiation: undefined, conversations: {}, rewardedSentences: {}, tradeLog: []
  });
  const region = REGIONS.find((item) => item.id === state.regionId)!;
  const priceFactor = economyAt(region.id, region.marketFactor, 0, now).guestPriceFactor;
  for (const guest of state.customers) guest.priceFactor = priceFactor;
  note(state, `Grand Opening #${loot.prestige.count}! +${stars} prestige stars and a Choice box. Your bars start over with permanent bonuses.`);
}
export function buyPrestigePerk(state: PlayerState, perkId: unknown) {
  const perk = PRESTIGE_PERKS.find((item) => item.id === perkId);
  if (!perk) throw new LootError('Unknown prestige perk.');
  const rank = perkRank(state, perk.id);
  if (rank >= perk.maxRank) throw new LootError(`${perk.name} is at its top rank.`);
  const cost = perkCost(rank);
  if (state.loot.prestige.stars < cost) throw new LootError(`You need ${cost} prestige stars.`);
  state.loot.prestige.stars -= cost;
  state.loot.prestige.perks[perk.id] = rank + 1;
  note(state, `${perk.name} rank ${rank + 1}: ${perk.description}`);
}

export { BOXES, CONSUMABLES, EQUIPMENT, MAX_LEVEL };

// ---- Quests, achievements and the tasting log ----
// Counters only ever go up from server rules; this week's quest progress restarts when the week changes.
export function track(state: PlayerState, stat: StatId, amount: number, now: number) {
  const loot = state.loot;
  const week = weekOf(now);
  if (loot.quests.week !== week) loot.quests = { week, progress: {}, claimed: [] };
  add(loot.stats, stat, amount);
  add(loot.quests.progress, stat, amount);
}
const goalProgress = (state: PlayerState, stat: StatId) => state.loot.stats[stat] ?? 0;

export function claimQuest(state: PlayerState, questId: unknown, now: number) {
  const week = weekOf(now);
  if (state.loot.quests.week !== week) state.loot.quests = { week, progress: {}, claimed: [] };
  const quest = questsForWeek(week).find((item) => item.id === questId);
  if (!quest) throw new LootError('This quest is not active this week.');
  if (state.loot.quests.claimed.includes(quest.id)) throw new LootError('Quest reward already claimed.');
  if ((state.loot.quests.progress[quest.stat] ?? 0) < quest.target) throw new LootError('This quest is not finished yet.');
  state.loot.quests.claimed.push(quest.id);
  state.crystals += quest.crystals;
  grantBox(state, quest.box);
  note(state, `Quest done: ${quest.name}. +${quest.crystals} crystals and a ${boxDef(quest.box)!.name}.`);
}
export function claimAchievement(state: PlayerState, id: unknown) {
  const goal = achievementById(String(id));
  if (!goal) throw new LootError('Unknown achievement.');
  if (state.loot.achievements.includes(goal.id)) throw new LootError('Achievement reward already claimed.');
  const before = achievementSeries(goal.series).find((item) => item.tier === goal.tier - 1);
  if (before && !state.loot.achievements.includes(before.id)) throw new LootError(`Claim ${before.tierName} first.`);
  if (goalProgress(state, goal.stat) < goal.target) throw new LootError('This achievement is not finished yet.');
  state.loot.achievements.push(goal.id);
  state.crystals += goal.crystals;
  grantBox(state, goal.box);
  note(state, `Achievement: ${goal.name}. +${goal.crystals} crystals and a ${boxDef(goal.box)!.name}.`);
}
// First time a recipe is served (or a brand poured) pays a small one-time reward.
export function tasteFirst(state: PlayerState, key: string, kind: 'recipe' | 'brand', now: number) {
  const id = `${kind}:${key}`;
  if (state.loot.tasted.includes(id)) return '';
  state.loot.tasted.push(id);
  if (kind === 'recipe') {
    track(state, 'tasted', 1, now);
    state.loot.parts += TASTING_REWARD.parts;
    state.loot.skinShards += TASTING_REWARD.skinShards;
    return ` First time serving this recipe: +${TASTING_REWARD.parts} parts, +${TASTING_REWARD.skinShards} skin shards.`;
  }
  state.loot.skinShards += TASTING_REWARD.brandShards;
  return ` New brand poured: +${TASTING_REWARD.brandShards} skin shard.`;
}
export { ACHIEVEMENTS, questsForWeek, weekOf };

// ---- English rewards ----
// Perfect conversations pay parts by difficulty; every third one (or any hard one) also drops a box.
export function englishTalkReward(state: PlayerState, difficulty: number, now: number) {
  track(state, 'perfectTalks', 1, now);
  state.loot.parts += difficulty;
  const streak = state.loot.stats['perfectTalks'] ?? 0;
  const hard = difficulty >= 4;
  if (hard || streak % 3 === 0) {
    const kind: BoxKind = hard ? 'silver' : 'bronze';
    grantBox(state, kind);
    return ` +${difficulty} parts and a ${boxDef(kind)!.name}${hard ? ' for hard English' : ' for your perfect streak'}.`;
  }
  return ` +${difficulty} parts.`;
}
// A finished set of daily lessons pays a box; a week of learning pays a silver one.
export function dailyLessonsBox(state: PlayerState, learningStreak: number, now: number) {
  track(state, 'lessons', 1, now);
  const kind: BoxKind = learningStreak > 0 && learningStreak % 7 === 0 ? 'silver' : 'bronze';
  grantBox(state, kind);
  return ` Daily set finished: a ${boxDef(kind)!.name}!`;
}

const CUSTOMER_IDS = new Set(CUSTOMER_ART_BY_SLOT);
// ---- Regulars ----
// Multiplier a regular pays when served their favourite drink (only once they have reached loyalty level 1).
export function regularPriceBonus(state: PlayerState, characterId: string | undefined, recipeId: string) {
  if (!characterId) return 1;
  return regularLevel(state.loot.regulars[characterId] ?? 0) >= 1 && favoriteRecipeId(characterId) === recipeId ? REGULAR_FAVORITE_BONUS : 1;
}
export function earnLoyalty(state: PlayerState, characterId: string | undefined, name: string, recipeId: string, vip: boolean) {
  if (!characterId || !(characterId in state.loot.regulars) && !CUSTOMER_IDS.has(characterId)) return '';
  const favorite = favoriteRecipeId(characterId) === recipeId;
  const before = state.loot.regulars[characterId] ?? 0;
  const points = 1 + (vip ? 1 : 0) + (favorite ? 1 : 0);
  state.loot.regulars[characterId] = before + points;
  const gained: string[] = [];
  for (let level = regularLevel(before); level < regularLevel(before + points); level++) {
    const reward = REGULAR_REWARDS[level]!;
    const parts: string[] = [];
    if (reward.box) { grantBox(state, reward.box); parts.push(`a ${boxDef(reward.box)!.name}`); }
    if (reward.parts) { state.loot.parts += reward.parts; parts.push(`${reward.parts} parts`); }
    if (reward.skinShards) { state.loot.skinShards += reward.skinShards; parts.push(`${reward.skinShards} skin shards`); }
    if (reward.crystals) { state.crystals += reward.crystals; parts.push(`${reward.crystals} crystals`); }
    gained.push(`${name} is now a level ${level + 1} regular (${parts.join(', ')})`);
  }
  return gained.length ? ` ${gained.join('. ')}.` : '';
}
export { REGULAR_LEVELS };

// ---- Storeroom: capacity and spoilage ----
const DAY = 24 * 60 * 60 * 1000;
export const fridgeLevelOf = (state: PlayerState, regionId: string) => state.loot.equipment[regionId]?.['fridge']?.level ?? 0;
export const capacityOf = (state: PlayerState, regionId: string, ingredientId: string) => {
  const ingredient = INGREDIENTS.find((item) => item.id === ingredientId);
  return ingredient ? capacityFor(ingredient, fridgeLevelOf(state, regionId)) : 0;
};
// Room left for one ingredient in a bar, counting deliveries already on their way.
export function roomFor(state: PlayerState, regionId: string, ingredientId: string) {
  const stock = state.inventories[regionId as keyof typeof state.inventories]?.find((item) => item.ingredientId === ingredientId)?.amount ?? 0;
  const pending = state.deliveryOrders.filter((order) => order.barId === regionId).flatMap((order) => order.items).filter((item) => item.ingredientId === ingredientId).reduce((sum, item) => sum + item.amount, 0);
  return Math.max(0, capacityOf(state, regionId, ingredientId) - stock - pending);
}
// Once a day, fresh produce in every owned bar loses a share of its stock (see domain/warehouse.ts).
export function applySpoilage(state: PlayerState, now: number) {
  if (levelFor(state.xp) < SPOIL_START_LEVEL) { state.loot.spoiledAt = now; return; }
  if (!state.loot.spoiledAt) { state.loot.spoiledAt = now; return; }
  const days = Math.min(SPOIL_MAX_DAYS, Math.floor((now - state.loot.spoiledAt) / DAY));
  if (days < 1) return;
  state.loot.spoiledAt = Math.min(now, state.loot.spoiledAt + Math.floor((now - state.loot.spoiledAt) / DAY) * DAY);
  const lost: string[] = [];
  for (const regionId of state.ownedBarIds) {
    const fridge = fridgeLevelOf(state, regionId);
    for (const stock of state.inventories[regionId]) {
      const ingredient = INGREDIENTS.find((item) => item.id === stock.ingredientId);
      if (!ingredient || !isPerishable(ingredient)) continue;
      let spoiled = 0;
      for (let day = 0; day < days; day++) {
        const loss = spoiledAmount(stock.amount, fridge);
        stock.amount -= loss;
        spoiled += loss;
      }
      if (spoiled > 0 && regionId === state.regionId) lost.push(`${spoiled} ${ingredient.unit === 'ml' ? 'ml ' : '× '}${ingredient.name}`);
    }
  }
  if (lost.length) note(state, `Spoilage: ${lost.join(', ')} went off. A better fridge slows it.`);
}

// ---- Signature cocktail ----
export function designSignature(state: PlayerState, input: unknown) {
  if (levelFor(state.xp) < SIGNATURE_LEVEL) throw new LootError(`Signature cocktails unlock at level ${SIGNATURE_LEVEL}.`);
  let clean;
  try { clean = validateSignature(input, usableIngredientIds(state.knownRecipeIds)); }
  catch (error) { if (error instanceof SignatureError) throw new LootError(error.message); throw error; }
  const previous = state.loot.signatures[state.regionId];
  if (previous && previous.name === clean.name && previous.needsShake === clean.needsShake && JSON.stringify(previous.items) === JSON.stringify(clean.items)) throw new LootError('This is already your signature cocktail.');
  if (state.money < SIGNATURE_FEE) throw new LootError(`You need ${SIGNATURE_FEE} coins to develop a signature cocktail.`);
  state.money = coins(state.money - SIGNATURE_FEE);
  // A new recipe starts unknown again: fame is earned per creation.
  state.loot.signatures[state.regionId] = { ...clean, served: 0 };
  note(state, `${clean.name} is now the signature cocktail of ${state.bars[state.regionId].name}: guests will pay ${clean.price.toFixed(2)} coins.`);
}
// Some arriving guests come for the house special, and it is announced up front (no detective work).
export function applySignatureGuest(state: PlayerState, guest: Customer, random: () => number) {
  const signature = state.loot.signatures[state.regionId];
  if (!signature || guest.specialRecipeRewardId || random() >= SIGNATURE_GUEST_CHANCE) return;
  const { served: _served, ...snapshot } = signature;
  guest.signature = snapshot;
  guest.orderKind = 'cocktail';
  guest.orderRecipeId = 'signature';
  guest.modifierId = undefined; guest.bottleRequest = undefined; guest.serveRequest = undefined; guest.selectedBottleId = undefined;
  // Not announced: the bartender has to bring up the house special in English before the guest confirms it.
  guest.orderRevealed = false;
  guest.request = 'I heard this bar has a famous house special. What would you recommend?';
  guest.wish = guest.request;
  guest.budget = signature.price * 1.5 + 4;
}
export const signatureFameFactor = (state: PlayerState) => 1 + FAME_PRICE_BONUS * fameLevel(state.loot.signatures[state.regionId]?.served ?? 0);
export function signatureServed(state: PlayerState, now: number) {
  const signature = state.loot.signatures[state.regionId];
  if (!signature) return '';
  const before = fameLevel(signature.served);
  signature.served += 1;
  track(state, 'signatures', 1, now);
  const after = fameLevel(signature.served);
  if (after <= before) return '';
  const kind: BoxKind = ['bronze', 'silver', 'choice'][after - 1] as BoxKind;
  grantBox(state, kind);
  return ` ${signature.name} reached fame level ${after} (+${Math.round(FAME_PRICE_BONUS * after * 100)}% price) and earned a ${boxDef(kind)!.name}!`;
}
export { FAME_STEPS };

// ---- Weekly leaderboard ----
// The score is the XP gained this UTC week. It restarts when the week changes and is never lowered.
export function addWeeklyScore(state: PlayerState, xpGained: number, now: number) {
  const week = weekOf(now);
  if (state.loot.weekly.week !== week) state.loot.weekly = { week, score: 0 };
  if (xpGained > 0) state.loot.weekly.score += Math.floor(xpGained);
}
export interface LeaderboardStanding { week: number; rank: number; size: number; score: number; }
export function claimLeaderboardReward(state: PlayerState, standing: LeaderboardStanding | undefined, now: number) {
  if (!standing) throw new LootError('The leaderboard is only available online.');
  if (standing.week !== weekOf(now) - 1) throw new LootError('Only last week’s result can be claimed.');
  if (state.loot.leaderboardClaimed >= standing.week) throw new LootError('Last week’s reward was already claimed.');
  const reward = leaderboardReward(standing.rank, standing.score);
  if (!reward) throw new LootError(`You needed ${MIN_WEEKLY_SCORE} XP last week to earn a leaderboard reward.`);
  state.loot.leaderboardClaimed = standing.week;
  for (const [kind, amount] of Object.entries(reward.boxes)) grantBox(state, kind as BoxKind, amount!);
  state.crystals += reward.crystals;
  note(state, `Leaderboard ${reward.tier} (rank ${standing.rank} of ${standing.size}): ${describeLeaderboardReward(reward)}.`);
}

// Delivery speed of the fridge in a specific bar (negotiated orders go to the bar that placed them).
export const deliveryFactorFor = (state: PlayerState, regionId: string) => 1 - fridgeLevelOf(state, regionId) * equipmentDef('fridge')!.perLevel;
// Prestige trade contacts and an armed Supplier Voucher lower the total of any supplier order.
export function orderDiscount(state: PlayerState, now: number) {
  const voucher = (state.loot.armed['voucher'] ?? 0) > 0;
  return { factor: lootBonuses(state, now).supplyFactor * (voucher ? .8 : 1), voucher };
}
