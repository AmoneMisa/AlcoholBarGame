// Optional actions, loaded only when their screen or action is used.
import { fragmentChoiceOptions } from '../domain/fragmentChoices';
import { THEME_DRAW_POOLS, randomCosmeticAllowed } from '../data/cosmetics/themeDistribution';
import { RECIPES, REGIONS } from '../domain/catalog';
import { coins } from '../domain/economy';
import { COSMETICS, DRAWABLE_COSMETICS } from '../domain/cosmetics';
import { ACHIEVEMENT_STYLES, STYLE_PIECES_TO_CRAFT } from '../data/cosmetics/styleSources';
import { INTERIORS } from '../data/cosmetics/bars';
import { levelFor, MAX_LEVEL } from '../domain/progression';
import { BOOST_KINDS, BOXES, CONSUMABLES, DRAW_COST, DUPLICATE_SHARDS, EQUIPMENT, FEATURED_SHARE, SHARD_CRAFT_COST, TIER_ORDER, TIER_SHARD_COST, boxDef, choiceOptions, consumableDef, equipmentDef, featuredIndex, levelCap, rollBox, rollRarity, upgradeCostFor, type BoxKind, type Reward } from '../domain/loot';
import { SEASON_FEATURED_SHARE, SEASON_MILESTONES, SPARK_DRAWS, seasonAt } from '../domain/seasons';
import { MIN_WEEKLY_SCORE, describeLeaderboardReward, leaderboardReward } from '../domain/leaderboard';
import { FAME_STEPS, SIGNATURE_FEE, SIGNATURE_LEVEL, SignatureError, validateSignature } from '../domain/signature';
import { usableIngredientIds } from '../domain/usableStock';
import { REGULAR_LEVELS } from '../domain/regulars';
import { statValue } from '../domain/achievementStats';
import { emptyCompanions, companionBonus, joinCompanion, addKeepsakes } from './companions';
import { companionJoiningWith, keepsakeFor } from '../domain/companions';
import { ACHIEVEMENTS, achievementById, achievementSeries, questsForWeek, weekOf, type StatId } from '../domain/quests';
import type { DrawResult } from '../domain/lootState';
import { addSpareCopy } from './recipes';
import type { PlayerState } from './state';
import { LootError, note, add, has, boostActive, grantReward, grantBox, grantCosmetic, shardStyles, ownedAside, track } from './lootCore';
export const take = (map: Record<string, number>, key: string, amount: number) => {
  map[key] = (map[key] ?? 0) - amount;
  if (map[key]! <= 0) delete map[key];
};

export const slotOf = (state: PlayerState, id: string, regionId: string = state.regionId) => {
  if (!(state.ownedBarIds as string[]).includes(regionId)) throw new LootError('You do not own this bar yet.');
  const slot = state.loot.equipment[regionId]?.[id];
  if (!slot || !equipmentDef(id)) throw new LootError('Unknown equipment.');
  return slot;
};

export const barLabel = (regionId: string) => REGIONS.find((item) => item.id === regionId)?.name ?? 'this bar';

export function resolveFragmentReward(state: PlayerState, reward: Reward, random: () => number): Reward {
  if (!['skinShards','stylePieces'].includes(reward.kind) || ('id' in reward && reward.id)) return reward;
  const pool = (ownedAside(state).length ? ownedAside(state) : shardStyles()).filter(item=>randomCosmeticAllowed(item.id));
  const item = pool[Math.min(pool.length - 1, Math.floor(random() * pool.length))]!;
  return {kind:'skinShards',id:item.id,amount:'amount' in reward ? reward.amount : 0};
}

export function openBox(state: PlayerState, kind: string, random: () => number, now: number) {
  if (!boxDef(kind)) throw new LootError('Unknown box.');
  if (state.loot.pendingChoice) throw new LootError('Pick your reward from the open choice box first.');
  if (!has(state.loot.boxes, kind)) throw new LootError('You do not have this box.');
  const level = levelFor(state.xp);
  take(state.loot.boxes, kind, 1);
  track(state, 'boxes', 1, now);
  if (kind === 'choice') {
    state.loot.pendingChoice = choiceOptions(level, random).map(reward => resolveFragmentReward(state, reward, random));
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

export const quantityOf = (value: unknown, max: number) => Number.isFinite(value) ? Math.min(max, Math.max(1, Math.floor(value as number))) : 1;

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
  if (!item || item.kind === 'choice') throw new LootError('This item is only found in chests.');
  const amount = quantityOf(quantity, 10);
  const cost = item.crystalPrice * amount;
  if (state.crystals < cost) throw new LootError(`You need ${cost} crystals for ${amount} × ${item.name}.`);
  state.crystals -= cost;
  add(state.loot.consumables, id, amount);
  note(state, `Bought ${amount} × ${item.name} for ${cost} crystals.`);
}

export function useConsumable(state: PlayerState, id: string, recipeId: unknown, now: number) {
  const item = consumableDef(id);
  if (!item) throw new LootError('Unknown item.');
  if (!has(state.loot.consumables, id)) throw new LootError(`You have no ${item.name}.`);
  if(item.kind === 'choice') throw new LootError('Choose a specific fragment first.');
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

export function upgradeEquipment(state: PlayerState, id: string, now: number, regionId: string = state.regionId) {
  const slot = slotOf(state, id, regionId);
  const cap = levelCap(slot.tier);
  if (slot.level >= cap) throw new LootError(TIER_SHARD_COST[slot.tier] ? 'Raise the item’s tier with shards to unlock more levels.' : 'This item is at its top level.');
  const cost = upgradeCostFor(slot.level);
  if (state.money < cost.coins) throw new LootError(`You need ${cost.coins} coins.`);
  const partsCost = Math.max(1, Math.ceil(cost.parts * (1 - companionBonus(state, 'upgrade', regionId))));
  if (state.loot.parts < partsCost) throw new LootError(`You need ${partsCost} workshop parts.`);
  state.money = coins(state.money - cost.coins);
  state.loot.parts -= partsCost;
  slot.level += 1;
  track(state, 'upgrades', 1, now);
  note(state, `${equipmentDef(id)!.name} is now level ${slot.level} in ${barLabel(regionId)}.`);
}

export function promoteEquipment(state: PlayerState, id: string, regionId: string = state.regionId) {
  const slot = slotOf(state, id, regionId);
  const cost = TIER_SHARD_COST[slot.tier];
  if (!cost) throw new LootError('This item is already legendary.');
  if (!has(state.loot.itemShards, id, cost)) throw new LootError(`You need ${cost} ${equipmentDef(id)!.name} shards.`);
  take(state.loot.itemShards, id, cost);
  slot.tier = TIER_ORDER[TIER_ORDER.indexOf(slot.tier) + 1]!;
  note(state, `${equipmentDef(id)!.name} in ${barLabel(regionId)} is now ${slot.tier} tier (level cap ${levelCap(slot.tier)}).`);
}

export const featuredLegendary = (now: number) => {
  const legendary = DRAWABLE_COSMETICS.filter((item) => item.rarity === 'legendary');
  return legendary[featuredIndex(now, legendary.length)];
};

export function currentSeason(state: PlayerState, now: number) {
  const season = seasonAt(now);
  if (state.loot.season.id !== season.id) state.loot.season = { id: season.id, draws: 0, rewarded: [], spark: false };
  return season;
}

export function drawStyle(state: PlayerState, count: unknown, banner: unknown, now: number, random: () => number) {
  if (count !== 1 && count !== 10) throw new LootError('Choose a single draw or a ten-draw.');
  const collection=THEME_DRAW_POOLS.find(item=>item.id===banner);
  if(collection) {
    const cost=count===1?DRAW_COST.single:DRAW_COST.ten;
    if(state.crystals<cost) throw new LootError(`You need ${cost} crystals for this draw.`);
    const pool=collection.styleIds.map(id=>COSMETICS.find(item=>item.id===id)!);
    if(pool.some(item=>!item)) throw new LootError('Collection is unavailable.');
    state.crystals-=cost;
    const results:DrawResult[]=[];
    for(let i=0;i<count;i++) {
      const item=pool[Math.min(pool.length-1,Math.floor(random()*pool.length))]!;
      const duplicate=state.ownedCosmeticIds.includes(item.id);
      const shards=duplicate?DUPLICATE_SHARDS.rare:0;
      if(duplicate) add(state.loot.styleShards,item.id,shards);
      grantCosmetic(state,item.id);
      results.push({id:item.id,label:item.label,rarity:item.rarity,duplicate,shards});
    }
    state.loot.lastDraw=results;track(state,'draws',count,now);
    note(state,`${collection.name}: ${results.map(item=>item.label).join(', ')}.`);
    return;
  }
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
    const pool = DRAWABLE_COSMETICS.filter((item) => item.rarity === rarity);
    const reward = rarity === 'legendary' && featuredList.length && random() < share
      ? featuredList[Math.min(featuredList.length - 1, Math.floor(random() * featuredList.length))]!
      : pool[Math.min(pool.length - 1, Math.floor(random() * pool.length))]!;
    const duplicate = state.ownedCosmeticIds.includes(reward.id);
    const shards = duplicate ? DUPLICATE_SHARDS[rarity] : 0;
    if (duplicate) add(loot.styleShards, reward.id, shards); else grantCosmetic(state, reward.id);
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

export function claimSpark(state: PlayerState, cosmeticId: unknown, now: number) {
  const season = currentSeason(state, now);
  if (state.loot.season.draws < SPARK_DRAWS) throw new LootError(`Draw ${SPARK_DRAWS} times on the season banner first (now ${state.loot.season.draws}).`);
  if (state.loot.season.spark) throw new LootError('You already used this season’s Spark.');
  const item = COSMETICS.find((entry) => entry.id === cosmeticId);
  if (!item || !season.featuredIds.includes(item.id)) throw new LootError('Pick one of this season’s featured styles.');
  if (state.ownedCosmeticIds.includes(item.id)) throw new LootError('You already own this style.');
  state.loot.season.spark = true;
  const gained = grantCosmetic(state, item.id);
  note(state, `${item.label} claimed with Spark!${gained.includes('background') ? ` You also got ${gained.split(' + ')[1]}.` : ''}`);
}

export function craftSkin(state: PlayerState, cosmeticId: unknown) {
  const item = DRAWABLE_COSMETICS.find((entry) => entry.id === cosmeticId);
  if (!item) throw new LootError('Unknown style.');
  if (state.ownedCosmeticIds.includes(item.id)) throw new LootError('You already own this style.');
  const cost = SHARD_CRAFT_COST[item.rarity];
  if ((state.loot.styleShards[item.id] ?? 0) < cost) throw new LootError(`You need ${cost} ${item.label} ${item.label} skin shards.`);
  take(state.loot.styleShards, item.id, cost);
  state.ownedCosmeticIds.push(item.id);
  const gained = item.label;
  note(state, `${item.label} crafted from ${cost} skin shards.${gained.includes('background') ? ` You also got ${gained.split(' + ')[1]}.` : ''}`);
}

export const styleShardCost = (id: string) => {
  const item = COSMETICS.find(entry => entry.id === id);
  return item && !item.source ? SHARD_CRAFT_COST[item.rarity] : STYLE_PIECES_TO_CRAFT;
};

export function craftStyle(state: PlayerState, cosmeticId: unknown) {
  const id = String(cosmeticId);
  const background = id.startsWith('background:') ? INTERIORS.find(entry => entry.id === id.slice(11)) : undefined;
  const item = shardStyles().find(entry => entry.id === id);
  if (!item && !background) throw new LootError('Unknown fragment item.');
  if (background ? state.ownedInteriorIds.includes(background.id) : state.ownedCosmeticIds.includes(id)) throw new LootError('You already own this item.');
  const cost = background ? STYLE_PIECES_TO_CRAFT : styleShardCost(id);
  const have = state.loot.styleShards[id] ?? 0;
  const label = background?.name ?? item!.label;
  if (have < cost) throw new LootError(`You need ${cost} ${label} shards (you have ${have}).`);
  take(state.loot.styleShards, id, cost);
  if (background) state.ownedInteriorIds.push(background.id); else state.ownedCosmeticIds.push(id);
  note(state, `${label} crafted from ${cost} of its own fragments.`);
}

export { BOXES, CONSUMABLES, EQUIPMENT, MAX_LEVEL };

export const goalProgress = (state: PlayerState, stat: StatId) => statValue(state, stat);

export function claimQuest(state: PlayerState, questId: unknown, now: number) {
  const week = weekOf(now);
  if (state.loot.quests.week !== week) state.loot.quests = { week, progress: {}, claimed: [] };
  const quest = questsForWeek(week).find((item) => item.id === questId);
  if (!quest) throw new LootError('This quest is not active this week.');
  if (state.loot.quests.claimed.includes(quest.id)) throw new LootError('Quest reward already claimed.');
  if ((state.loot.quests.progress[quest.stat] ?? 0) < quest.target) throw new LootError('This quest is not finished yet.');
  state.loot.quests.claimed.push(quest.id);
  const crystals = Math.round(quest.crystals * (1 + companionBonus(state, 'crystals')));
  state.crystals += crystals;
  grantBox(state, quest.box);
  const keepsake = keepsakeFor(quest.id + week);
  addKeepsakes(state, keepsake, 1);
  note(state, `Quest done: ${quest.name}. +${crystals} crystals, a ${boxDef(quest.box)!.name} and a keepsake.`);
}

export function claimAchievement(state: PlayerState, id: unknown) {
  const goal = achievementById(String(id));
  if (!goal) throw new LootError('Unknown achievement.');
  if (state.loot.achievements.includes(goal.id)) throw new LootError('Achievement reward already claimed.');
  const before = achievementSeries(goal.series).find((item) => item.tier === goal.tier - 1);
  if (before && !state.loot.achievements.includes(before.id)) throw new LootError(`Claim ${before.tierName} first.`);
  if (goalProgress(state, goal.stat) < goal.target) throw new LootError('This achievement is not finished yet.');
  state.loot.achievements.push(goal.id);
  const crystals = Math.round(goal.crystals * (1 + companionBonus(state, 'crystals')));
  state.crystals += crystals;
  grantBox(state, goal.box);
  // Higher tiers bring more keepsakes, and some achievements bring a person to the bar.
  const keepsakes = goal.tier >= 3 ? 2 : 1;
  addKeepsakes(state, keepsakeFor(goal.id), keepsakes);
  const joining = companionJoiningWith(goal.id);
  const joined = joining ? ` ${joinCompanion(state, joining.id)}` : '';
  const pair = ACHIEVEMENT_STYLES[goal.id];
  const styles = pair ? Object.entries(pair).map(([character, value]) => grantCosmetic(state, `bartender:${value}:${character}`)).filter(Boolean) : [];
  note(state, `Achievement: ${goal.name}. +${crystals} crystals, a ${boxDef(goal.box)!.name} and ${keepsakes} keepsake${keepsakes > 1 ? 's' : ''}.${joined}${styles.length ? ` Styles: ${styles.join('; ')}.` : ''}`);
}

export { ACHIEVEMENTS, questsForWeek, weekOf };

export { REGULAR_LEVELS };

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
  note(state, `${clean.name} is now the signature cocktail of ${state.bars[state.regionId].name}: guests will pay ${clean.price.toFixed(0)} coins.`);
}

export { FAME_STEPS };

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

export const DISCARD_KINDS = ['box', 'consumable', 'styleShards', 'itemShards', 'skinShards', 'parts'] as const;

export type DiscardKind = typeof DISCARD_KINDS[number];

export function discardLoot(state: PlayerState, kindInput: unknown, idInput: unknown, amountInput: unknown) {
  const kind = DISCARD_KINDS.find((item) => item === kindInput);
  const id = typeof idInput === 'string' ? idInput : '';
  const amount = Math.floor(Number(amountInput));
  if (!kind || !Number.isInteger(amount) || amount < 1) throw new LootError('Choose what to throw away.');
  const loot = state.loot;
  const pile: Record<string, number> | undefined = kind === 'box' ? loot.boxes : kind === 'consumable' ? loot.consumables : kind === 'styleShards' ? loot.styleShards : kind === 'itemShards' ? loot.itemShards : undefined;
  const have = pile ? pile[id] ?? 0 : kind === 'skinShards' ? loot.skinShards : loot.parts;
  if (have < 1) throw new LootError('You do not have that.');
  const taken = Math.min(amount, have);
  if (pile) { if (have === taken) delete pile[id]; else pile[id] = have - taken; }
  else if (kind === 'skinShards') loot.skinShards -= taken;
  else loot.parts -= taken;
  note(state, `You threw away ${taken}.`);
}

export function useFragmentChoice(state: PlayerState, id: string, targetId: string) {
  const item = consumableDef(id);
  if(item?.kind!=='choice') throw new LootError('Unknown fragment choice.');
  if(!has(state.loot.consumables,id)) throw new LootError('You do not own this choice puzzle.');
  const target = fragmentChoiceOptions(id).find(option=>option.id===targetId);
  if(!target) throw new LootError('This fragment is not available for selection.');
  switch(id) {
    case 'style-choice': add(state.loot.styleShards,targetId,1); break;
    case 'background-choice': add(state.loot.styleShards,`background:${targetId}`,1); break;
    case 'friend-choice': { const circle=state.companions ??= emptyCompanions(); if(targetId in circle.owned) throw new LootError('This friend has already joined your Circle.'); add(circle.shards,targetId,1); break; }
    case 'equipment-choice': add(state.loot.itemShards,targetId,1); break;
  }
  take(state.loot.consumables,id,1);
  note(state,`Selected 1 ${target.text} fragment.`);
}
