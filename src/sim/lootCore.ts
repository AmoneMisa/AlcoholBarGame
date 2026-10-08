import { collectionBonuses } from '../domain/collectionBonuses';
// Common state helpers needed by the opening bar.
import { INGREDIENTS, RECIPES } from '../domain/catalog';
import { ALCOHOL_PRODUCTS } from '../domain/bottleCatalog';
import { coins } from '../domain/economy';
import { COSMETICS, interiorForCosmetic } from '../domain/cosmetics';
import { randomCosmeticAllowed } from '../data/cosmetics/themeDistribution';
import { STYLE_PIECES_TO_CRAFT, styleForInterior } from '../data/cosmetics/styleSources';
import { BOX_INTERIOR_IDS, DUPLICATE_INTERIOR_SHARDS, INTERIORS } from '../data/cosmetics/bars';
import { levelFor } from '../domain/progression';
import { boxDef, consumableDef, describeReward, equipmentDef, type BoxKind, type EquipmentId, type Reward } from '../domain/loot';
import { FAME_PRICE_BONUS, SIGNATURE_GUEST_CHANCE, fameLevel } from '../domain/signature';
import { usableIngredientIds } from '../domain/usableStock';
import { SPOIL_MAX_DAYS, SPOIL_START_LEVEL, capacityFor, isPerishable, spoiledAmount } from '../domain/warehouse';
import { REGULAR_FAVORITE_BONUS, REGULAR_REWARDS, favoriteRecipeId, regularLevel } from '../domain/regulars';
import { CUSTOMER_ART_BY_SLOT } from '../data/cosmetics/artCatalog';
import type { Customer } from '../domain/types';
import { companionBonus, addCompanionShards } from './companions';
import { TASTING_REWARD, weekOf, type StatId } from '../domain/quests';
import { addSpareCopy, isStarterRecipe } from './recipes';
import type { PlayerState } from './state';
export class LootError extends Error {}

export const MAX_LOG = 20;

export const names = { consumable: (id: string) => consumableDef(id)?.name ?? id, equipment: (id: string) => equipmentDef(id)?.name ?? id };

export const note = (state: PlayerState, text: string) => { state.loot.log = [text, ...state.loot.log].slice(0, MAX_LOG); state.message = text; };

export const add = (map: Record<string, number>, key: string, amount: number) => { map[key] = (map[key] ?? 0) + amount; };

export const has = (map: Record<string, number>, key: string, amount = 1) => (map[key] ?? 0) >= amount;

export const boostActive = (state: PlayerState, kind: string, now: number) => (state.loot.boosts[kind] ?? 0) > now;

export const equipmentLevel = (state: PlayerState, id: EquipmentId, regionId = state.regionId) => state.loot.equipment[regionId]?.[id]?.level ?? 0;

export const effect = (state: PlayerState, id: EquipmentId) => equipmentLevel(state, id) * equipmentDef(id)!.perLevel;

export function lootBonuses(state: PlayerState, now: number) {
  // People of the Circle who work in this bar add their own bonus on top of the equipment.
  const c = (bonus: Parameters<typeof companionBonus>[1]) => companionBonus(state, bonus);
  return {
    tipChance: effect(state, 'shaker') + c('tips'),
    liquidSaved: effect(state, 'ice-machine') + c('saved'),
    deliveryFactor: Math.max(.2, 1 - effect(state, 'fridge') - c('delivery')),
    patienceFactor: 1 + effect(state, 'speakers') + c('patience'),
    bottleSaleFactor: 1 + c('bottles'),
    staffFactor: 1 + c('staff'),
    crystalFactor: 1 + c('crystals'),
    upgradeDiscount: c('upgrade'),
    tasteParts: c('parts'),
    // Cash register and the Coin Booster multiply what guests pay.
    payFactor: (1 + effect(state, 'register') + c('pay')) * (boostActive(state, 'coin-boost', now) ? 1.25 : 1),
    supplyFactor: 1 - c('supply'),
    bottleCostFactor: 1 - effect(state, 'cellar') - c('restock'),
    xpFactor: (boostActive(state, 'xp-boost', now) ? 1.5 : 1) * (1 + c('xp')),
    arrivalFactor: (boostActive(state, 'happy-hour', now) ? .5 : 1) * (1 - c('arrival')),
    alwaysTips: boostActive(state, 'tip-boost', now)
  };
}

export const xpGain = (state: PlayerState, base: number, now: number) => Math.round(base * lootBonuses(state, now).xpFactor);

export function randomBottle(random: () => number) {
  const top = [...ALCOHOL_PRODUCTS].sort((a, b) => b.price - a.price).slice(0, Math.max(1, Math.ceil(ALCOHOL_PRODUCTS.length * .3)));
  return top[Math.min(top.length - 1, Math.floor(random() * top.length))]!;
}

export function grantReward(state: PlayerState, reward: Reward, random: () => number): string {
  const loot = state.loot;
  switch (reward.kind) {
    case 'coins': state.money = coins(state.money + reward.amount); break;
    case 'crystals': state.crystals += reward.amount; break;
    case 'parts': loot.parts += reward.amount; break;
    case 'backgroundShards': return addBackgroundShards(state, reward.id, reward.amount);
    case 'skinShards': if (reward.id) { if (!shardStyles().some(item=>item.id===reward.id)) throw new LootError('Unknown costume fragments.'); add(loot.styleShards,reward.id,reward.amount); return `${reward.amount} ${COSMETICS.find(item=>item.id===reward.id)!.label} fragments`; } return addStyleShards(state, reward.amount, random);
    case 'stylePieces': return addStyleShards(state, reward.amount, random);
    case 'xp': state.xp += reward.amount; break;
    case 'box': grantBox(state, reward.box); break;
    case 'companionShards': return addCompanionShards(state, reward.amount, random);
    case 'prestige': state.popularity += reward.amount; break;
    case 'supplies': {
      // Stock for the recipes this player knows (liquids in ml, fresh things in pieces), only as much as fits.
      const per = { small: { ml: 150, piece: 6 }, medium: { ml: 300, piece: 12 }, large: { ml: 600, piece: 24 } }[reward.size];
      const shelf = state.inventories[state.regionId];
      let lines = 0;
      for (const id of usableIngredientIds(state.knownRecipeIds)) {
        const ingredient = INGREDIENTS.find((item) => item.id === id);
        const entry = shelf.find((item) => item.ingredientId === id);
        if (!ingredient || !entry) continue;
        const add = Math.min(ingredient.unit === 'ml' ? per.ml : per.piece, roomFor(state, state.regionId, id));
        if (add > 0) { entry.amount += add; lines++; }
      }
      return lines ? `a ${reward.size} pack of supplies for ${state.bars[state.regionId].name} (${lines} ingredients)` : 'a pack of supplies (your storeroom is already full)';
    }
    case 'style': {
      const missing = boxStyles().filter((entry) => !state.ownedCosmeticIds.includes(entry.id));
      // Every box style owned: the drop turns into pieces instead of being wasted.
      if (!missing.length) { const pool=boxStyles(); const item=pool[Math.min(pool.length-1,Math.floor(random()*pool.length))]!; add(loot.styleShards,item.id,STYLE_PIECES_TO_CRAFT); return `${STYLE_PIECES_TO_CRAFT} ${item.label} fragments`; }
      const chosen = missing[Math.min(missing.length - 1, Math.floor(random() * missing.length))]!;
      grantCosmetic(state, chosen.id);
      return `the full style “${chosen.label}”`;
    }
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
      const missing = BOX_INTERIOR_IDS.filter((id) => !state.ownedInteriorIds.includes(id));
      if (!missing.length) return addBackgroundShards(state, BOX_INTERIOR_IDS[Math.min(BOX_INTERIOR_IDS.length-1,Math.floor(random()*BOX_INTERIOR_IDS.length))]!, DUPLICATE_INTERIOR_SHARDS);
      const id = missing[Math.min(missing.length - 1, Math.floor(random() * missing.length))]!;
      state.ownedInteriorIds.push(id);
      // The background's own style comes with it.
      const style = styleForInterior(id);
      const styleName = style ? grantCosmetic(state, `bartender:${style.value}:${style.character}`) : '';
      return `the background “${INTERIORS.find((item) => item.id === id)!.name}”${styleName ? ` and its style ${styleName}` : ''}`;
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

export function grantCosmetic(state: PlayerState, cosmeticId: string): string {
  const parts: string[] = [];
  const item = COSMETICS.find((entry) => entry.id === cosmeticId);
  if (item && !state.ownedCosmeticIds.includes(item.id)) { state.ownedCosmeticIds.push(item.id); parts.push(item.label); }
  const interiorId = interiorForCosmetic(cosmeticId);
  const interior = interiorId ? INTERIORS.find((entry) => entry.id === interiorId) : undefined;
  if (interior && !state.ownedInteriorIds.includes(interior.id)) { state.ownedInteriorIds.push(interior.id); parts.push(`the matching background “${interior.name}”`); }
  return parts.join(' + ');
}

export const boxStyles = () => COSMETICS.filter((entry) => entry.source === 'box' && randomCosmeticAllowed(entry.id));

// Only full costumes drop as fragments; the face/makeup/hair-option pieces (shown on a basic suit) are no longer in chests.
export const shardStyles = () => COSMETICS.filter(entry => entry.key === 'bartender');

export const ownedAside = (state: PlayerState) => shardStyles().filter(item => !state.ownedCosmeticIds.includes(item.id) && randomCosmeticAllowed(item.id));

export function addStyleShards(state: PlayerState, amount: number, random: () => number): string {
  const missing = ownedAside(state);
  const pool = missing.length ? missing : shardStyles().filter(item=>randomCosmeticAllowed(item.id));
  const chosen = pool[Math.min(pool.length - 1, Math.floor(random() * pool.length))]!;
  add(state.loot.styleShards, chosen.id, amount);
  return `${amount} ${chosen.label} fragments`;
}

export function addBackgroundShards(state: PlayerState, id: string, amount: number): string {
  const item = INTERIORS.find(entry => entry.id === id);
  if (!item) throw new LootError('Unknown background.');
  add(state.loot.styleShards, `background:${id}`, amount);
  return `${amount} ${item.name} background fragments`;
}

export function migrateStylePool(state: PlayerState, random: () => number = () => 0) {
  let left = state.loot.stylePieces + state.loot.skinShards;
  state.loot.stylePieces = 0;
  state.loot.skinShards = 0;
  while (left > 0) { const part = Math.min(10, left); addStyleShards(state, part, random); left -= part; }
}

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

export function track(state: PlayerState, stat: StatId, amount: number, now: number) {
  const loot = state.loot;
  const week = weekOf(now);
  if (loot.quests.week !== week) loot.quests = { week, progress: {}, claimed: [] };
  add(loot.stats, stat, amount);
  add(loot.quests.progress, stat, amount);
}

export function tasteFirst(state: PlayerState, key: string, kind: 'recipe' | 'brand', now: number) {
  const id = `${kind}:${key}`;
  if (state.loot.tasted.includes(id)) return '';
  state.loot.tasted.push(id);
  if (kind === 'recipe') {
    track(state, 'tasted', 1, now);
    const extra = Math.round(companionBonus(state, 'parts'));
    state.loot.parts += TASTING_REWARD.parts + extra;
    addStyleShards(state, TASTING_REWARD.skinShards, () => 0);
    return ` First time serving this recipe: +${TASTING_REWARD.parts + extra} parts, +${TASTING_REWARD.skinShards} skin shards.`;
  }
  addStyleShards(state, TASTING_REWARD.brandShards, () => 0);
  return ` New brand poured: +${TASTING_REWARD.brandShards} skin shard.`;
}

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

export function dailyLessonsBox(state: PlayerState, learningStreak: number, now: number) {
  track(state, 'lessons', 1, now);
  const kind: BoxKind = learningStreak > 0 && learningStreak % 7 === 0 ? 'silver' : 'bronze';
  grantBox(state, kind);
  return ` Daily set finished: a ${boxDef(kind)!.name}!`;
}

export const CUSTOMER_IDS = new Set(CUSTOMER_ART_BY_SLOT);

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
    if (reward.skinShards) { addStyleShards(state, reward.skinShards, () => 0); parts.push(`${reward.skinShards} skin shards`); }
    if (reward.crystals) { state.crystals += reward.crystals; parts.push(`${reward.crystals} crystals`); }
    gained.push(`${name} is now a level ${level + 1} regular (${parts.join(', ')})`);
  }
  return gained.length ? ` ${gained.join('. ')}.` : '';
}

export const DAY = 24 * 60 * 60 * 1000;

export const fridgeLevelOf = (state: PlayerState, regionId: string) => state.loot.equipment[regionId]?.['fridge']?.level ?? 0;

export const capacityOf = (state: PlayerState, regionId: string, ingredientId: string) => {
  const ingredient = INGREDIENTS.find((item) => item.id === ingredientId);
  return ingredient ? capacityFor(ingredient, fridgeLevelOf(state, regionId)) : 0;
};

export function roomFor(state: PlayerState, regionId: string, ingredientId: string) {
  const stock = state.inventories[regionId as keyof typeof state.inventories]?.find((item) => item.ingredientId === ingredientId)?.amount ?? 0;
  const pending = state.deliveryOrders.filter((order) => order.barId === regionId).flatMap((order) => order.items).filter((item) => item.ingredientId === ingredientId).reduce((sum, item) => sum + item.amount, 0);
  return Math.max(0, capacityOf(state, regionId, ingredientId) - stock - pending);
}

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

export const signatureFameFactor = (state: PlayerState) => 1 + FAME_PRICE_BONUS * (1 + companionBonus(state, 'fame')) * fameLevel(state.loot.signatures[state.regionId]?.served ?? 0);

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

export function addWeeklyScore(state: PlayerState, xpGained: number, now: number) {
  const week = weekOf(now);
  if (state.loot.weekly.week !== week) state.loot.weekly = { week, score: 0 };
  if (xpGained > 0) state.loot.weekly.score += Math.floor(xpGained);
}

export const deliveryFactorFor = (state: PlayerState, regionId: string) => (1 - fridgeLevelOf(state, regionId) * equipmentDef('fridge')!.perLevel) * (1 - collectionBonuses(state).rate);

export function orderDiscount(state: PlayerState, now: number) {
  const voucher = (state.loot.armed['voucher'] ?? 0) > 0;
  return { factor: lootBonuses(state, now).supplyFactor * (voucher ? .8 : 1), voucher };
}
