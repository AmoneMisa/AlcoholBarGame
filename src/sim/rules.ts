import { INGREDIENTS, MODIFIERS, RECIPES, REGIONS, SUPPLIERS, estimateRecipeAbv } from '../domain/catalog';
import { ALCOHOL_PRODUCTS, bottleRestockCrystalCost, bottleSaleCrystalReward, bottleTotal, brandedServeCrystalReward } from '../domain/bottleCatalog';
import { arrivalSkipCrystalCost, calendarDate, coins, specialtyFactor, supplierInCity, consecutiveDays, conversationCrystalReward, conversationDifficulty, crystalExchange, dailyCoinsFor, dailyCrystalsFor, quotePurchase, recipePurchase } from '../domain/economy';
import { withArticle } from '../domain/english/articles';
import { PassError, buyPassPremium, claimPass, syncPass } from './pass';
import { ROULETTE_SPINS_PER_DAY, spinWheel } from '../domain/roulette';
import { STYLE_SHOP_PRICE, styleForInterior, styleSource } from '../data/cosmetics/styleSources';
import { BAR_PROFILE_OPTIONS, DEFAULT_BARS, INTERIORS, isEventInterior } from '../data/cosmetics/bars';
import { consumeMix, generateCustomer, judgeMix, nearMiss, requiredRecipe } from '../domain/engine';
import type { Customer, InventoryItem, Recipe, RegionId, Supplier } from '../domain/types';
import { pourableBrand, replyToServe, serveName, serveRequestText, substitutesFor } from '../domain/brandServe';
import { signatureBonus } from '../domain/brandPours';
import { bottleMatchesRequest, bottleOpeningLine, findBottleMention, replyToBottle } from '../domain/conversation/bottleTalk';
import { buildProfile, findRecipeMention, openingLine, replyTo, shortWish, type CustomerReply } from '../domain/conversation/customerTalk';
import { serviceReply } from '../domain/conversation/serviceTalk';
import { canWelcomeVip, nextCustomerArrival, nextVipAvailability, orderTimeSeconds, vipCarriesRecipe } from '../domain/customerTiming';
import { AUTO_SERVE_LEVEL, AUTO_SUPPLY_LEVEL, economyAt, formatDeliveryTime, marketFor } from '../domain/progression';
import { BAR_PURCHASE_LEVEL, barUnlockPrice } from '../domain/barUnlocks';
import { DAILY_LESSON_COUNT, DAILY_LESSON_RECIPE_CHANCE, dailyLessonsFor, learningStreakBonus, normalizeLessonAnswer } from '../domain/dailyLessons';
import { COSMETICS, canUseCosmetic } from '../domain/cosmetics';
import { LootError, orderDiscount, claimSpark, grantCosmetic, grantReward, craftStyle, addWeeklyScore, claimLeaderboardReward, applySignatureGuest, designSignature, signatureFameFactor, signatureServed, applySpoilage, capacityOf, roomFor, earnLoyalty, regularPriceBonus, dailyLessonsBox, englishTalkReward, buyBox, claimAchievement, claimQuest, tasteFirst, track, buyConsumable, craftSkin, dailyStreakBox, dropAfterServe, drawStyle, grantLevelBoxes, lootBonuses, openBox, pickChoice, promoteEquipment, upgradeEquipment, useConsumable, xpGain } from './loot';
import { usableIngredientIds } from '../domain/usableStock';
import { acceptDeal, haggle, makeOffer, startNegotiation, TradeError } from './trade';
import { actsIn } from '../domain/social/acts';
import { backToOrder, withoutTrailingQuestion, enjoyingOpening, openingFor, socialReply, voice, type Expression } from '../domain/social/talk';
import { ensureSocial, genderOf, rollSocial } from '../domain/social/generate';
import { guestLine, hasSituation, matchChoice, overdue, pickSituation, resolveChoice, resolveIgnored, startSituation, visibleChoices, type Resolution } from './situations';
import { FEATURED_MAX } from '../domain/profile';
import { collectChatter, reactionToServed } from './chatter';
import { addStat, raiseStat, syncDerivedStats } from '../domain/achievementStats';
import { accrueStaff, hireStaff, upgradeStaff } from './staff';
import { CompanionError, assignCompanion, buyKeepsake, companionVisit, dismissCompanion, giveKeepsake, recruitCompanion, spotlightCompanion, levelUpCompanion } from './companions';
import { COMPANIONS, companionName } from '../domain/companions';
import { applyPromo, barEventFor, tickBarEvent } from './events';
import { adjustPitch, askPitch, cancelPitch, pitchChance, startPitch } from './pitch';
import { pitchActsIn } from '../domain/social/pitchActs';
import { foodById } from '../domain/foods';
import { discardQuarantine, expireStock, fileClaim, goodAmount, receiveOrder, takeLowGrade } from './stockQuality';
import { situationById } from '../domain/situations/catalog';
import { MAX_SEATS, afterServed, holdForPayment, recordDrink, settleGuest, applySocialReply, askToLeave, callTaxi, cleanAshtrays, drunkGain, giveAshtray, giveWater, isOrdering, orderingGuests, removeGuest, scheduleArrival, tickGuests, ashtraysOf, type GuestContext } from './guests';
import { addSpareCopy, RECIPE_MAX_LEVEL, recipeBonus, recipeCardsRequired, recipeCopies, recipeLevel, upgradeCost } from './recipes';
import { DELIVERY_DAY_MS, createInitialState, levelFor, normalizePlayerState, wishFor, withUniqueLook, type PlayerState, type Transcript, type UnlockSource } from './state';

// Game rules as pure state transitions. The server runs these for every request, so the client can only
// ask for an action — it can never set coins, stock, XP or timers itself. Every payload is treated as untrusted.

export type GameAction =
  | { type: 'tick' }
  | { type: 'serve'; mix: InventoryItem[]; shaken: boolean; pourBrands: Record<string, string>; auto?: boolean }
  | { type: 'buy'; supplierId: string; cart: Record<string, number> }
  | { type: 'sell'; cart: Record<string, number> }
  | { type: 'transfer'; ingredientId: string; targetId: RegionId; amount?: number }
  | { type: 'claimDaily' }
  | { type: 'completeDailyLesson'; lessonId: string; answer: string }
  | { type: 'exchangeCrystals'; crystals: number }
  | { type: 'buyRecipe'; recipeId: string }
  | { type: 'upgradeRecipe'; recipeId: string }
  | { type: 'buyInterior'; interiorId: string }
  | { type: 'buyStyle'; cosmeticId: string }
  | { type: 'buyBottleStock'; productId: string; quantity?: number }
  | { type: 'expediteCustomer' }
  | { type: 'switchBar'; regionId: RegionId }
  | { type: 'chooseStartingBar'; regionId: RegionId }
  | { type: 'buyBar'; regionId: RegionId }
  | { type: 'renameBar'; name: string }
  | { type: 'renameBartender'; name: string }
  | { type: 'setDecor'; key: string; value: string }
  | { type: 'spinRoulette' }
  | { type: 'claimPass'; track: 'free' | 'premium'; level: number }
  | { type: 'buyPassPremium' }
  | { type: 'activatePopularityBoost'; boost: 'no-cooldown' | 'vip-run' }
  | { type: 'selectCustomer'; customerId: string }
  | { type: 'openConversation'; customerId: string }
  | { type: 'closeConversation' }
  // The player says one sentence to the guest; the server checks the English and decides the guest's answer.
  | { type: 'say'; text: string }
  // Haggling with a supplier: open with the current cart, talk in English, then accept or leave.
  | { type: 'startNegotiation'; supplierId: string; cart: Record<string, number> }
  | { type: 'haggle'; text: string }
  | { type: 'makeOffer'; price: number }
  | { type: 'acceptDeal' }
  | { type: 'leaveNegotiation' }
  | { type: 'sellBottle' }
  | { type: 'offerSimilar'; customerId: string }
  | { type: 'rejectCustomer'; customerId: string }
  | { type: 'setAutoSupply'; enabled: boolean }
  | { type: 'autoServe' }
  // Looking after the people at the bar: each names the guest it is for.
  | { type: 'giveAshtray'; customerId: string }
  | { type: 'cleanAshtrays' }
  | { type: 'setTour'; value: 'done' | 'skipped' }
  // One-tap restock.
  | { type: 'topUp' }
  | { type: 'recruitCompanion'; id: string }
  | { type: 'giveKeepsake'; id: string; kind: string }
  | { type: 'buyKeepsake'; kind: string; quantity?: number }
  | { type: 'assignCompanion'; id: string }
  | { type: 'dismissCompanion'; id: string }
  | { type: 'spotlightCompanion'; id: string }
  | { type: 'levelUpCompanion'; id: string }
  | { type: 'hireStaff' }
  | { type: 'upgradeStaff'; index: number }
  // Offering a guest another drink or some food: start the offer, talk, then ask (the chance is shown and changes as you talk).
  | { type: 'pitchStart'; customerId: string; kind: 'drink' | 'food'; itemId: string }
  | { type: 'pitchAsk'; customerId: string }
  | { type: 'pitchCancel'; customerId: string }
  // Telling a supplier about a problem with a delivery (in English), and throwing away goods that can not be used.
  | { type: 'reportIssue'; issueId: string; text: string }
  | { type: 'discardStock'; id: string }
  // Answering a situation (a payment problem, a broken glass, an emergency…) with one of the offered sentences.
  | { type: 'situationChoice'; customerId: string; choiceId: string }
  | { type: 'giveWater'; customerId: string }
  | { type: 'callTaxi'; customerId: string }
  | { type: 'askToLeave'; customerId: string; tone: 'gentle' | 'firm' | 'aggressive' }
  | { type: 'upgradeEquipment'; item: string; regionId?: string }
  | { type: 'promoteEquipment'; item: string; regionId?: string }
  | { type: 'openBox'; box: string }
  | { type: 'pickReward'; index: number }
  | { type: 'buyBox'; box: string; quantity?: number }
  | { type: 'buyConsumable'; id: string; quantity?: number }
  | { type: 'useConsumable'; id: string; recipeId?: string }
  | { type: 'drawStyle'; count: 1 | 10; banner?: 'standard' | 'seasonal' }
  | { type: 'claimSpark'; cosmeticId: string }
  | { type: 'craftSkin'; cosmeticId: string }
  | { type: 'wipeAccount'; confirm: true }
  | { type: 'craftStyle'; cosmeticId: string }
  | { type: 'designSignature'; name: string; items: { ingredientId: string; amount: number }[]; needsShake: boolean }
  | { type: 'claimLeaderboardReward' }
  | { type: 'setFeaturedAchievements'; ids: string[] }
  | { type: 'claimQuest'; questId: string }
  | { type: 'claimAchievement'; id: string }

export class RuleError extends Error {}

export interface RuleContext {
  now: number;
  random?: () => number;
  // Grammar check (the server runs its own copy): correctness decides XP; the corrected text is what the guest “hears”.
  checkEnglish: (text: string) => { ok: boolean; corrected: string; note?: string };
  // Offline practice spawns guests locally; online clients wait for the server's guest.
  spawnCustomers?: boolean;
  // Last week's final standing, looked up by the server (never sent by the client).
  leaderboard?: import('./loot').LeaderboardStanding;
}

const MAX_REWARDED_SENTENCES = 6;
const MAX_TRADE_LOG = 40;
const isRegion = (id: unknown): id is RegionId => REGIONS.some((region) => region.id === id);
const currentCustomer = (state: PlayerState) => state.customers.find((item) => item.id === state.activeCustomerId) ?? state.customers[0];
const inventoryOf = (state: PlayerState) => state.inventories[state.regionId];
const bottleStock = (state: PlayerState, productId: string) => state.bottleInventories[state.regionId].find((item) => item.productId === productId);
const knownRecipes = (state: PlayerState) => RECIPES.filter((recipe) => state.knownRecipeIds.includes(recipe.id));
const lockedRecipes = (state: PlayerState) => RECIPES.filter((recipe) => !state.knownRecipeIds.includes(recipe.id));
const log = (state: PlayerState, note: string) => { state.tradeLog = [note, ...state.tradeLog].slice(0, MAX_TRADE_LOG); state.message = note; };
const cleanText = (text: unknown, max: number) => typeof text === 'string' ? text.replace(/[\u0000-\u001f\u007f]/g, '').trim().slice(0, max) : '';

function unlockRecipe(state: PlayerState, recipeId: string, source: UnlockSource) {
  // A recipe you already know becomes a spare copy (for gifting to friends).
  if (state.knownRecipeIds.includes(recipeId)) { addSpareCopy(state, recipeId); return false; }
  state.knownRecipeIds.push(recipeId);
  state.recipeUnlockSources[recipeId] = source;
  return true;
}

function makeSpecialCustomer(recipe: Recipe, level: number): Customer {
  return {
    ...generateCustomer(level, [recipe], 0, 1.35, 0),
    name: 'Celeste', mood: 'vip', greeting: 'I collect forgotten recipes.',
    request: `Make me ${withArticle(recipe.name)}. Impress me and I will teach you the recipe.`,
    specialRecipeRewardId: recipe.id, orderKind: 'cocktail', bottleRequest: undefined, orderRevealed: true,
    patience: orderTimeSeconds('vip', 'cocktail'), patienceRemaining: orderTimeSeconds('vip', 'cocktail')
  };
}

const economyOf = (state: PlayerState, now: number) => {
  const region = REGIONS.find((item) => item.id === state.regionId)!;
  return economyAt(region.id, region.marketFactor, state.xp, now);
};
// Tips are a chance: the level sets the base rate, VIP and wealthy guests are more generous, and a guest who likes the
// bartender (or is a little drunk and happy) tips more often.
function rollTip(state: PlayerState, guest: Customer, now: number, random: () => number) {
  const bonus = (guest.mood === 'vip' || guest.mood === 'wealthy' ? .2 : 0) + (barEventFor(state, now)?.effects.tipChance ?? 0);
  const social = guest.social;
  const warmth = social ? (social.rapport - 50) / 250 + (social.drunk >= 25 && social.drunk < 75 ? .06 : 0) : 0;
  const loot = lootBonuses(state, now);
  return loot.alwaysTips || random() < Math.min(.95, Math.max(.05, economyOf(state, now).tipChance + bonus + warmth + loot.tipChance));
}
// Delivery time in days after the level's delivery perk.
const deliveryDaysFor = (state: PlayerState, supplier: Supplier, now: number) => supplier.deliveryDays * economyOf(state, now).delivery * lootBonuses(state, now).deliveryFactor;

// Auto-supply (level 5+): anything running low is reordered, one pack from the cheapest supplier that sells it,
// paying normal prices and delivery fees. Nothing is ordered twice while a delivery for it is on the way.
const LOW_STOCK = { ml: 150, piece: 4 } as const;
// Pays for a quote and puts the delivery on its way (shared by a manual order and by Top-up / Auto-supply). Returns the days it takes.
function placeDeliveryOrder(state: PlayerState, supplier: ReturnType<typeof supplierInCity>, quote: ReturnType<typeof quotePurchase>, now: number) {
  state.money = coins(state.money - quote.total);
  const days = deliveryDaysFor(state, supplier, now);
  state.deliveryOrders.push({ id: crypto.randomUUID(), supplier: supplier.name, barId: state.regionId, dueAt: now + Math.round(days * DELIVERY_DAY_MS),
    items: quote.lines.map((line) => ({ ingredientId: line.ingredientId, amount: line.amount })), total: quote.total });
  return days;
}
// Orders what is running low from the cheapest suppliers. Automatic (from level 5, when switched on) or by the player with one tap.
function autoRestock(state: PlayerState, now: number, manual = false): number {
  if (!manual && (!state.autoSupply || levelFor(state.xp) < AUTO_SUPPLY_LEVEL)) return 0;
  let ordered = 0;
  const region = REGIONS.find((item) => item.id === state.regionId)!;
  const pending = new Set(state.deliveryOrders.filter((order) => order.barId === state.regionId).flatMap((order) => order.items.map((item) => item.ingredientId)));
  const usable = usableIngredientIds(state.knownRecipeIds);
  const low = inventoryOf(state).filter((stock) => {
    if (!usable.has(stock.ingredientId)) return false;
    const ingredient = INGREDIENTS.find((item) => item.id === stock.ingredientId);
    return ingredient && !pending.has(stock.ingredientId) && stock.amount < (ingredient.unit === 'ml' ? LOW_STOCK.ml : LOW_STOCK.piece);
  });
  if (!low.length) return 0;
  const market = marketFor(region, now, state.xp);
  const carts = new Map<string, Record<string, number>>();
  for (const stock of low) {
    const cheapest = market.filter((offer) => offer.ingredientId === stock.ingredientId).sort((a, b) => a.price - b.price)[0];
    if (cheapest) carts.set(cheapest.supplierId, { ...carts.get(cheapest.supplierId), [stock.ingredientId]: 1 });
  }
  for (const [supplierId, cart] of carts) {
    const supplier = supplierInCity(SUPPLIERS.find((item) => item.id === supplierId)!, region.marketFactor);
    const quote = quotePurchase(market, cart, supplier);
    if (!quote.lines.length) continue;
    if (state.money < quote.total) { state.message = `${manual ? 'Top-up' : 'Auto-supply'} paused: ${quote.total.toFixed(2)} coins needed for ${supplier.name}.`; continue; }
    ordered++;
    placeDeliveryOrder(state, supplier, quote, now);
    log(state, `${manual ? 'Top-up' : 'Auto-supply'} ordered ${quote.lines.map((line) => INGREDIENTS.find((item) => item.id === line.ingredientId)?.name).join(', ')} from ${supplier.name} for ${quote.total.toFixed(2)} coins.`);
  }
  return ordered;
}

/** What "Top up" would order right now (nothing changes): per supplier, the items and the price. */
export interface TopUpPreview { orders: { supplier: string; items: { ingredientId: string; amount: number }[]; total: number }[]; total: number; days?: number }
export function previewTopUp(state: PlayerState, now: number): TopUpPreview {
  const copy = JSON.parse(JSON.stringify(state)) as PlayerState;
  const before = new Set(copy.deliveryOrders.map((order) => order.id));
  autoRestock(copy, now, true);
  const orders = copy.deliveryOrders.filter((order) => !before.has(order.id)).map((order) => ({ supplier: order.supplier, items: order.items.map((item) => ({ ingredientId: item.ingredientId, amount: item.amount })), total: order.total }));
  const days = orders.length ? (copy.deliveryOrders.filter((order) => !before.has(order.id)).map((order) => order.dueAt).sort((a, b) => a - b)[0]! - now) / DELIVERY_DAY_MS : undefined;
  return { orders, total: orders.reduce((sum, order) => sum + order.total, 0), days };
}

// What this guest pays relative to catalog prices (fixed when they walked in, so budgets always match).
const priceFactorOf = (guest: Customer | undefined, marketFactor: number) => guest?.priceFactor ?? marketFactor;

// Higher levels bring guests sooner; city events (Hot Time, storms...) speed them up or slow them down.
function nextArrival(state: PlayerState, now: number, random: () => number) {
  if (state.popularityBoost?.kind === 'no-cooldown' && state.popularityBoost.until > now) return now + 1000;
  return now + Math.round((nextCustomerArrival(now, random) - now) * economyOf(state, now).arrival * (barEventFor(state, now)?.effects.arrival ?? 1) * lootBonuses(state, now).arrivalFactor);
}

function makeVipCustomer(state: PlayerState, level: number, priceFactor: number) {
  const vip = withUniqueLook(generateCustomer(level, knownRecipes(state), .35, priceFactor), []);
  vip.mood = 'vip';
  vip.greeting = 'Good evening. I was told this bar is exceptional.';
  vip.patience = orderTimeSeconds('vip', vip.orderKind);
  vip.patienceRemaining = vip.patience;
  vip.priceFactor = priceFactor;
  return vip;
}

function makeArrivingCustomer(state: PlayerState, now: number, random: () => number) {
  const level = levelFor(state.xp);
  const economy = economyOf(state, now);
  const night = barEventFor(state, now)?.effects;
  const priceFactor = Number((economy.guestPriceFactor * (night?.pay ?? 1)).toFixed(4));
  const priced = (customer: Customer) => { customer.priceFactor = priceFactor; return customer; };
  if (state.popularityBoost?.kind === 'vip-run' && state.popularityBoost.remaining > 0) {
    state.popularityBoost.remaining -= 1;
    if (state.popularityBoost.remaining <= 0) state.popularityBoost = undefined;
    return makeVipCustomer(state, level, priceFactor);
  }
  if (canWelcomeVip(now, state.vipCooldownUntil, random, economy.vipChance)) {
    state.vipCooldownUntil = now + Math.round((nextVipAvailability(now, random) - now) * economy.vipCooldown);
    const locked = lockedRecipes(state);
    const learnedAdvanced = knownRecipes(state);
    // VIPs usually teach something new, but can also bring duplicate cards needed for mastery.
    const recipeRewards = learnedAdvanced.length && random() < .35 ? learnedAdvanced : (locked.length ? locked : learnedAdvanced);
    if (vipCarriesRecipe(recipeRewards.length > 0, random)) return priced(withUniqueLook(makeSpecialCustomer(recipeRewards[Math.floor(random() * recipeRewards.length)]!, level), []));
    return makeVipCustomer(state, level, priceFactor);
  }
  const make = () => priced(withUniqueLook(generateCustomer(level, knownRecipes(state), Math.min(.8, Math.max(.05, .35 + (night?.bottleShare ?? 0) * .3)), priceFactor, Math.min(.8, .25 + (night?.serveShare ?? 0) * .3)), []));
  let arriving = make();
  // Some nights bring more women (ladies’ night): look again for a few tries.
  if (night?.womenShare !== undefined && random() < night.womenShare) for (let attempt = 0; attempt < 10 && genderOf(arriving.characterId) !== 'f'; attempt++) arriving = make();
  // Circle guests have a separate cast and visit occasionally; ordinary customer rolls never use their art.
  if (random() < .15) {
    const available = COMPANIONS.filter((person) => !state.customers.some((guest) => guest.characterId === person.id));
    if (available.length) {
      const person = available[Math.floor(random() * available.length)]!;
      arriving.characterId = person.id;
      arriving.name = companionName(person.id);
    }
  }
  return arriving;
}

// What the guest rules need from this file: the arrival pace, and a fresh order for a guest who stays.
function guestContext(state: PlayerState, now: number, random: () => number): GuestContext {
  return {
    now, random,
    nextArrivalAt: () => nextArrival(state, now, random),
    freshOrder: (guest) => {
      const economy = economyOf(state, now);
      const next = generateCustomer(levelFor(state.xp), knownRecipes(state), 0, economy.guestPriceFactor, .25);
      const order: Partial<Customer> = {
        orderRecipeId: next.orderRecipeId, modifierId: next.modifierId, request: next.request, orderKind: next.orderKind,
        serveRequest: next.serveRequest, bottleRequest: undefined, selectedBottleId: undefined, specialRecipeRewardId: undefined,
        budget: next.budget, patience: next.patience, patienceRemaining: next.patience, priceFactor: economy.guestPriceFactor
      };
      order.wish = wishFor({ ...guest, ...order } as Customer);
      return order;
    }
  };
}

function welcomeNextCustomer(state: PlayerState, now: number, random: () => number) {
  const arrival = makeArrivingCustomer(state, now, random);
  // The sound system keeps guests happy for longer; a guest may come for the bar's own signature cocktail.
  const patienceFactor = lootBonuses(state, now).patienceFactor;
  applySignatureGuest(state, arrival, random);
  arrival.patience = Math.round(arrival.patience * patienceFactor);
  arrival.patienceRemaining = Math.round(arrival.patienceRemaining * patienceFactor);
  const night = barEventFor(state, now)?.effects;
  arrival.social ??= rollSocial(arrival, now, random, { drunkChance: night?.drunkChance, emotionWeights: night?.emotions, chattyBonus: night?.chatty, extraStays: night?.stays });
  // Dirty ashtrays make a bar smell of old smoke: new guests like it a little less.
  const dirty = ashtraysOf(state).dirty;
  if (dirty) arrival.social.rapport = Math.max(0, arrival.social.rapport - Math.min(12, dirty * 4));
  state.customers.push(arrival);
  const trouble = pickSituation(state, arrival, 'arrival', random);
  if (trouble) startSituation(state, arrival, trouble, now, random);
  state.activeCustomerId = arrival.id;
  state.nextCustomerAt = 0;
  state.lastClockAt = now;
  state.message = arrival.specialRecipeRewardId ? `VIP guest ${arrival.name} arrived with a recipe challenge.`
    : `${arrival.mood === 'vip' ? 'VIP guest' : 'A new customer'} ${arrival.name} arrived${dirty ? ' — and wrinkled their nose at the dirty ashtrays' : ''}.`;
}

// The current guest leaves (served, declined or out of time). Guests still seated keep waiting and the next
// one in the row is served; only a bar with nobody waiting to order schedules the next arrival.
function scheduleNextCustomer(state: PlayerState, now: number, random: () => number) {
  const leaving = currentCustomer(state);
  const guests = guestContext(state, now, random);
  if (leaving) removeGuest(state, leaving, guests);
  else scheduleArrival(state, guests);
}

function processDeliveries(state: PlayerState, now: number, random: () => number) {
  const arrived = state.deliveryOrders.filter((order) => order.dueAt <= now);
  const notes: string[] = [];
  for (const order of arrived) {
    const before = new Map(order.items.map((item) => [item.ingredientId, state.inventories[order.barId].find((entry) => entry.ingredientId === item.ingredientId)?.amount ?? 0]));
    notes.push(...receiveOrder(state, order, now, random));
    // The storeroom is full at its capacity: anything beyond it is lost on arrival.
    for (const item of order.items) {
      const stock = state.inventories[order.barId].find((entry) => entry.ingredientId === item.ingredientId);
      if (stock) stock.amount = Math.min(Math.max(before.get(item.ingredientId) ?? 0, capacityOf(state, order.barId, item.ingredientId)), stock.amount);
    }
  }
  if (arrived.length) {
    state.deliveryOrders = state.deliveryOrders.filter((order) => order.dueAt > now);
    log(state, `${arrived.length} supplier ${arrived.length === 1 ? 'delivery has' : 'deliveries have'} arrived.${notes.length ? ` Problems: ${notes.join(' ')}` : ''}`);
  }
}

// Time passes on the server clock only: deliveries arrive, guests sober up, ask for things and order again,
// patience runs down, the next guest walks in.
export function advanceClock(state: PlayerState, context: Pick<RuleContext, 'now' | 'random' | 'spawnCustomers'>) {
  normalizePlayerState(state);
  syncPass(state, context.now);
  state.conversations ??= {};
  const now = context.now;
  const random = context.random ?? Math.random;
  if (state.popularityBoost?.kind === 'no-cooldown' && state.popularityBoost.until <= now) state.popularityBoost = undefined;
  processDeliveries(state, now, random);
  expireStock(state, now);
  applySpoilage(state, now);
  const night = tickBarEvent(state, now, random);
  if (night) state.message = night;
  const known = knownRecipes(state);
  const economy = economyOf(state, now);
  // Every bar's own team works while the player is away, each in its own market.
  const averagePrice = (factor: number) => known.length ? known.reduce((sum, recipe) => sum + recipe.price, 0) / known.length * factor : 0;
  const teamNews: string[] = [];
  for (const region of REGIONS) {
    if (!state.ownedBarIds.includes(region.id)) continue;
    const here = region.id === state.regionId;
    const market = here ? { averagePrice: averagePrice(economy.guestPriceFactor), arrival: economy.arrival * (barEventFor(state, now)?.effects.arrival ?? 1) } : (() => { const other = economyAt(region.id, region.marketFactor, state.xp, now); return { averagePrice: averagePrice(other.guestPriceFactor), arrival: other.arrival }; })();
    const text = accrueStaff(state, now, random, market, region.id);
    if (text) teamNews.push(text);
  }
  if (teamNews.length) state.message = teamNews.join(' ');
  autoRestock(state, now);
  const guests = guestContext(state, now, random);
  tickGuests(state, guests, Math.max(0, (now - state.lastClockAt) / 1000));
  // Guests who sit at the bar say things on their own; if the chat is already open the line appears in it.
  for (const item of collectChatter(state, now, random)) {
    const talk = state.conversations?.[item.guest.id];
    if (talk) addLine(talk, 'customer', voice(item.guest, item.text, talk.lines.length));
  }
  for (const waiting of [...state.customers]) {
    if (!overdue(waiting, now)) continue;
    const resolution = resolveIgnored(state, waiting, now, random);
    if (resolution) applyResolution(state, waiting, resolution, guests);
  }
  // A guest walks in only while nobody is waiting to order and a seat is free.
  if (!orderingGuests(state).length) {
    if (context.spawnCustomers !== false && state.nextCustomerAt && now >= state.nextCustomerAt && state.customers.length < MAX_SEATS) welcomeNextCustomer(state, now, random);
    else if (!state.nextCustomerAt) scheduleArrival(state, guests);
  }
  const waiting = orderingGuests(state);
  const guest = waiting.find((item) => item.id === state.activeCustomerId) ?? waiting[0];
  if (!guest) { state.lastClockAt = now; return; }
  // Whole seconds only; the remainder carries over to the next tick.
  const elapsed = Math.max(0, Math.floor((now - state.lastClockAt) / 1000));
  state.lastClockAt = elapsed > 0 ? state.lastClockAt + elapsed * 1000 : Math.min(state.lastClockAt, now);
  // Reading and writing in the customer dialogue is learning time, so the order clock pauses.
  if (state.conversationCustomerId) return;
  guest.patienceRemaining = Math.max(0, guest.patienceRemaining - elapsed);
  if (guest.patienceRemaining <= 0) {
    const name = guest.name;
    state.activeCustomerId = guest.id;
    scheduleNextCustomer(state, now, random);
    state.message = `${name} left because the order timer ran out.`;
  }
}

// Clients send small, trusted-by-nobody numbers: whole, finite, within sane bounds.
function cleanAmount(value: unknown, max: number) {
  const number = typeof value === 'number' ? value : NaN;
  return Number.isFinite(number) && number > 0 ? Math.min(max, Math.floor(number)) : 0;
}
function cleanCart(cart: unknown, max: number) {
  const result: Record<string, number> = {};
  if (!cart || typeof cart !== 'object') return result;
  for (const [id, value] of Object.entries(cart as Record<string, unknown>)) {
    if (!INGREDIENTS.some((item) => item.id === id)) continue;
    const amount = cleanAmount(value, max);
    if (amount) result[id] = amount;
  }
  return result;
}

export function applyAction(state: PlayerState, action: GameAction, context: RuleContext) {
  const now = context.now;
  const random = context.random ?? Math.random;
  if (!action || typeof action !== 'object' || typeof action.type !== 'string') throw new RuleError('Unknown action.');
  advanceClock(state, context);
  const moneyBefore = state.money;
  const xpBefore = state.xp;
  const crystalsBefore = state.crystals;
  const guest = currentCustomer(state);
  const region = REGIONS.find((item) => item.id === state.regionId)!;

  switch (action.type) {
    case 'tick': break;

    case 'selectCustomer':
    case 'openConversation': {
      if (!state.customers.some((item) => item.id === action.customerId)) throw new RuleError('This guest is no longer here.');
      state.activeCustomerId = action.customerId;
      if (action.type === 'openConversation') {
        state.conversationCustomerId = action.customerId;
        ensureTranscript(state, state.customers.find((item) => item.id === action.customerId)!);
      }
      break;
    }
    case 'closeConversation': state.conversationCustomerId = undefined; break;

    case 'say': {
      if (!guest || state.conversationCustomerId !== guest.id) throw new RuleError('Open a conversation first.');
      const text = cleanText(action.text, 240);
      if (text.length < 3) throw new RuleError('Write a sentence first.');
      say(state, guest, text, context, priceFactorOf(guest, region.marketFactor));
      break;
    }

    case 'startNegotiation':
    case 'haggle':
    case 'makeOffer':
    case 'acceptDeal':
    case 'leaveNegotiation': {
      try {
        if (action.type === 'startNegotiation') startNegotiation(state, action.supplierId, action.cart, now);
        else if (action.type === 'haggle') {
          const text = cleanText(action.text, 240);
          if (text.length < 3) throw new RuleError('Write a sentence first.');
          haggle(state, text, { checkEnglish: context.checkEnglish, random, now });
        } else if (action.type === 'makeOffer') makeOffer(state, action.price, { random, now });
        else if (action.type === 'acceptDeal') acceptDeal(state, now, DELIVERY_DAY_MS);
        else state.negotiation = undefined;
      } catch (error) {
        if (error instanceof TradeError) throw new RuleError(error.message);
        throw error;
      }
      break;
    }

    case 'sellBottle': {
      if (guest && hasSituation(guest)) throw new RuleError(`Deal with ${guest.name}’s situation first.`);
      const request = guest?.bottleRequest;
      const product = ALCOHOL_PRODUCTS.find((item) => item.id === guest?.selectedBottleId);
      if (!guest || guest.orderKind !== 'bottle' || !guest.orderRevealed || !request || !product) throw new RuleError('Confirm the customer’s bottle choice first.');
      const stock = bottleStock(state, product.id);
      if (!stock || stock.quantity < request.quantity) throw new RuleError(`Only ${stock?.quantity ?? 0} bottles of ${product.name} are in this bar.`);
      const revenue = bottleTotal(product, request.quantity, priceFactorOf(guest, region.marketFactor));
      if (revenue > request.budget) throw new RuleError(`The ${revenue} coin total is over the customer’s ${request.budget} coin budget.`);
      stock.quantity -= request.quantity;
      const tip = rollTip(state, guest, now, random) ? Math.ceil(revenue * (guest.mood === 'vip' || guest.mood === 'wealthy' ? .08 : .03) * economyOf(state, now).tips) : 0;
      const paid = coins(revenue * lootBonuses(state, now).bottleSaleFactor);
      state.money = coins(state.money + paid + tip);
      const crystalPayment = bottleSaleCrystalReward(product, request.quantity);
      state.crystals += crystalPayment;
      state.xp += xpGain(state, 110 + Math.min(state.streak * 2, 14), now);
      state.streak += 1;
      track(state, 'bottles', request.quantity, now);
      countServed(state);
      const note = `Sold ${request.quantity} × ${product.name} for ${paid.toFixed(2)} coins and ${crystalPayment} crystals.${tip ? ` Tip +${tip}.` : ' No tip this time.'}`;
      scheduleNextCustomer(state, now, random);
      state.message = note;
      break;
    }
    case 'offerSimilar': {
      const target = state.customers.find((item) => item.id === action.customerId);
      if (!target) throw new RuleError('This guest is no longer here.');
      offerSimilar(state, target, priceFactorOf(target, region.marketFactor));
      const transcript = ensureTranscript(state, target);
      addLine(transcript, 'bartender', 'I’m sorry, we cannot serve that order. May I offer you something similar?', { ok: true });
      addLine(transcript, 'customer', target.request);
      transcript.expression = 'smile';
      target.wish = wishFor(target);
      break;
    }
    case 'rejectCustomer': {
      const target = state.customers.find((item) => item.id === action.customerId);
      if (!target) throw new RuleError('This guest is no longer here.');
      scheduleNextCustomer(state, now, random);
      state.message = `${target.name} left without ordering.`;
      break;
    }

    case 'serve': {
      const auto = action.auto === true;
      if (!guest) throw new RuleError('There is no order to serve.');
      if (hasSituation(guest)) throw new RuleError(`Deal with ${guest.name}’s situation first.`);
      if (!isOrdering(guest)) throw new RuleError(`${guest.name} is still enjoying the last drink.`);
      if (guest.signature && !guest.orderRevealed) throw new RuleError('Talk to the guest first: ask about your house special.');
      if (guest.orderKind === 'bottle') throw new RuleError('This customer wants sealed bottles. Complete the sale in the conversation.');
      const mix = Array.isArray(action.mix) ? action.mix.filter((item) => INGREDIENTS.some((ingredient) => ingredient.id === item?.ingredientId))
        .map((item) => ({ ingredientId: item.ingredientId, amount: cleanAmount(item.amount, 1000) })).filter((item) => item.amount > 0) : [];
      if (!mix.length) throw new RuleError('Build the drink first.');
      // The glass can only contain what the bar actually has.
      for (const item of mix) {
        const stock = inventoryOf(state).find((entry) => entry.ingredientId === item.ingredientId);
        if (!stock || stock.amount < item.amount) throw new RuleError(`Not enough ${INGREDIENTS.find((entry) => entry.id === item.ingredientId)!.name} in stock.`);
        // Damaged and expiring goods can go into cocktails, but never into a brand pour.
        if (guest.orderKind === 'serve' && goodAmount(state, item.ingredientId) < item.amount) throw new RuleError(`Only damaged or old ${INGREDIENTS.find((entry) => entry.id === item.ingredientId)!.name} is left. It can only be used in cocktails.`);
      }
      // Brand choices must be real bottles on this bar's shelf, of the right spirit.
      const pourBrands: Record<string, string> = {};
      for (const [ingredientId, productId] of Object.entries(action.pourBrands ?? {})) {
        const product = ALCOHOL_PRODUCTS.find((item) => item.id === productId);
        if (product && product.ingredientId === ingredientId && pourableBrand(product) && (bottleStock(state, product.id)?.quantity ?? 0) > 0) pourBrands[ingredientId] = product.id;
      }
      const serve = guest.orderKind === 'serve' ? guest.serveRequest : undefined;
      if (serve) {
        const product = ALCOHOL_PRODUCTS.find((item) => item.id === serve.productId);
        if (product && (bottleStock(state, product.id)?.quantity ?? 0) <= 0) throw new RuleError(`There is no ${product.brand} on the shelf. Offer another brand in the conversation.`);
        if (product && pourBrands[product.ingredientId] !== product.id) throw new RuleError(`The guest asked for ${product.brand}. Choose that brand before you pour.`);
      }
      const stockBefore = inventoryOf(state).map((item) => ({ ...item }));
      // The ice machine saves a little liquid from stock on every pour (whole millilitres, never below 1).
      const saved = lootBonuses(state, now).liquidSaved;
      const poured = saved > 0 ? mix.map((item) => INGREDIENTS.find((entry) => entry.id === item.ingredientId)?.unit === 'ml' ? { ...item, amount: Math.max(1, Math.round(item.amount * (1 - saved))) } : item) : mix;
      state.inventories[state.regionId] = consumeMix(inventoryOf(state), poured);
      const lowGradeUsed = guest.orderKind === 'serve' ? new Set<'damaged' | 'expiring'>() : takeLowGrade(state, mix);
      let verdict = judgeMix(mix, guest, action.shaken === true);
      // Steady Hand turns a drink that is close into a perfect one (and is only used up when it was needed).
      const steady = !auto && !verdict.success && (state.loot.armed['steady-hand'] ?? 0) > 0 && nearMiss(verdict);
      if (steady) { delete state.loot.armed['steady-hand']; verdict = { ...verdict, success: true }; }
      if (verdict.success) {
        // Upgraded recipes earn more: +6% price and +10% tips per level.
        const mastery = recipeBonus(guest.orderKind === 'serve' ? 1 : recipeLevel(state, verdict.recipe.id));
        // City signature cocktails earn a premium in their city (brand serves are not cocktails).
        const specialty = guest.orderKind === 'serve' ? 1 : specialtyFactor(state.regionId, verdict.recipe.id);
        const golden = !auto && (state.loot.armed['golden-ice'] ?? 0) > 0;
        if (golden) delete state.loot.armed['golden-ice'];
        const revenue = coins(verdict.recipe.price * priceFactorOf(guest, region.marketFactor) * mastery.pay * specialty * lootBonuses(state, now).payFactor * (golden ? 1.5 : 1) * (guest.orderKind === 'serve' ? 1 : regularPriceBonus(state, guest.characterId, verdict.recipe.id)) * (guest.signature ? signatureFameFactor(state) : 1));
        const bonus = guest.orderKind === 'serve' ? undefined : signatureBonus(verdict.recipe.id, pourBrands);
        // Tips are a chance, never a given; drinks made with Auto-serve are paid but never tipped.
        const tipped = !auto && (golden || rollTip(state, guest, now, random));
        const tip = tipped ? Math.ceil(revenue * (guest.mood === 'vip' || guest.mood === 'wealthy' ? .2 : .1) * economyOf(state, now).tips * mastery.tips) + (bonus ? 2 : 0) : 0;
        // Sometimes the guest has a problem with paying: then the bill is held until it is sorted out.
        // A drink made with damaged or old goods can bring a complaint instead.
        const promo = applyPromo(state, guest, verdict.recipe, now);
        const complaint = !promo.free && lowGradeUsed.size && random() < (lowGradeUsed.has('expiring') ? .4 : .2) ? situationById('complaint-quality') : undefined;
        const payTrouble = promo.free ? undefined : complaint ?? pickSituation(state, guest, 'payment', random);
        if (!payTrouble && !promo.free) state.money = coins(state.money + revenue + tip);
        // About 170 successful orders reach level 25 and about 700 reach the level 50 cap.
        state.xp += xpGain(state, 100 + Math.min(state.streak * 2, 14), now);
        state.streak += 1;
        // Hands-on play earns the Workshop rewards; Auto-serve is paid and gives XP, but no drops, quest progress or loyalty.
        let found = '';
        countServed(state);
        if (!auto) {
          track(state, 'serves', 1, now);
          track(state, 'servesCoins', Math.floor(revenue + tip), now);
          if (guest.mood === 'vip' || guest.specialRecipeRewardId) track(state, 'vips', 1, now);
          found = dropAfterServe(state, guest.mood === 'vip', !!guest.specialRecipeRewardId, random);
          if (guest.signature) found += signatureServed(state, now);
          if (guest.orderKind !== 'serve' && !guest.signature) found += tasteFirst(state, verdict.recipe.id, 'recipe', now);
          if (guest.orderKind !== 'serve') found += earnLoyalty(state, guest.characterId, guest.name, verdict.recipe.id, guest.mood === 'vip');
          // A person of the Circle at the bar: shards if they have not joined yet, bond points if they have.
          found += companionVisit(state, guest.characterId, { eventId: barEventFor(state, now)?.id }, now, random);
          for (const productId of Object.values(pourBrands)) found += tasteFirst(state, productId, 'brand', now);
        }
        const serveProduct = serve ? ALCOHOL_PRODUCTS.find((item) => item.id === serve.productId) : undefined;
        ensureSocial(guest, now).lastDrink = serveProduct ? { productId: serveProduct.id } : { recipeId: verdict.recipe.id };
        // A word about the drink, in the bubble and (if the chat is open) in the conversation.
        const reaction = reactionToServed(guest, now, `${guest.id}:${state.streak}`);
        const openTalk = state.conversations?.[guest.id];
        if (reaction && openTalk) addLine(openTalk, 'customer', voice(guest, reaction, openTalk.lines.length));
        const brandedPayment = serveProduct ? brandedServeCrystalReward(serveProduct) : 0;
        const specialPayment = guest.specialRecipeRewardId || guest.mood === 'vip' ? conversationCrystalReward(guest, verdict.recipe) : 0;
        const crystalPayment = brandedPayment + specialPayment;
        state.crystals += crystalPayment;
        const duplicateRecipe = !!guest.specialRecipeRewardId && state.knownRecipeIds.includes(guest.specialRecipeRewardId);
        const unlocked = guest.specialRecipeRewardId ? unlockRecipe(state, guest.specialRecipeRewardId, 'special-client') : false;
        const crystalNote = crystalPayment ? ` +${crystalPayment} crystals.` : '';
        const note = unlocked ? `Perfect service. ${verdict.recipe.name} was added to your recipe book!${crystalNote}`
          : duplicateRecipe ? `Perfect service. You earned one ${verdict.recipe.name} recipe card for mastery.${crystalNote}`
          : auto ? `Auto-served ${verdict.recipe.name}. Paid ${revenue.toFixed(2)} coins (no tip for automated drinks).${crystalNote}`
          : steady ? `Steady Hand: close enough counts as perfect! Paid ${revenue.toFixed(2)} coins${tip ? `, tip +${tip}` : ''}.${crystalNote}`
          : !tip ? `Perfect service. No tip this time.${crystalNote}`
          : bonus ? `Perfect service — classic touch with ${bonus}! Tip +${tip} coins.${crystalNote}` : `Perfect service. Tip +${tip} coins.${crystalNote}`;
        // Alcohol raises the guest's level; a guest who likes the bar may stay for another drink.
        const abv = serveProduct ? serveProduct.abv * .8 : estimateRecipeAbv(verdict.recipe);
        if (payTrouble) {
          recordDrink(guest, drunkGain(abv), now);
          holdForPayment(guest, now);
          addGuestLine(state, guest, startSituation(state, guest, payTrouble, now, random, { amount: coins(revenue + tip), afterServe: true, data: complaint ? { reason: lowGradeUsed.has('expiring') ? 'expiring' : 'damaged' } : undefined }));
          state.message = `${note} But there is a problem with the payment.${found}`;
        } else {
          const outcome = afterServed(state, guest, drunkGain(abv), guestContext(state, now, random));
          state.message = `${outcome === 'stays' ? `${note} ${guest.name} stays to enjoy the drink.` : note}${promo.notes.length ? ` ${promo.notes.join(' ')}` : ''}${found}`;
        }
      } else if ((state.loot.armed['second-chance'] ?? 0) > 0) {
        // Second Chance: the ingredients come back and the streak survives.
        delete state.loot.armed['second-chance'];
        state.inventories[state.regionId] = stockBefore;
        guest.patienceRemaining = Math.max(0, guest.patienceRemaining - 60);
        state.message = 'Wrong drink — Second Chance refunded your ingredients and kept your streak.';
      } else {
        state.streak = 0;
        guest.patienceRemaining = Math.max(0, guest.patienceRemaining - 60);
        state.message = verdict.shakeOk ? 'Wrong drink. Check the ingredients.' : 'This recipe needs shaking.';
      }
      break;
    }

    // Level 10+: the confirmed order is made from stock in one step (the dialogue still has to reveal it).
    case 'autoServe': {
      if (levelFor(state.xp) < AUTO_SERVE_LEVEL) throw new RuleError(`Auto-serve unlocks at level ${AUTO_SERVE_LEVEL}.`);
      if (!guest || guest.orderKind === 'bottle') throw new RuleError('There is no drink order to serve.');
      if (!guest.orderRevealed) throw new RuleError('Talk to the guest first: Auto-serve needs the confirmed order.');
      const recipe = requiredRecipe(guest);
      const product = guest.orderKind === 'serve' && guest.serveRequest ? ALCOHOL_PRODUCTS.find((item) => item.id === guest.serveRequest!.productId) : undefined;
      return applyAction(state, { type: 'serve', mix: recipe.ingredients.map((item) => ({ ...item })), shaken: true, pourBrands: product ? { [product.ingredientId]: product.id } : {}, auto: true }, context);
    }
    case 'setAutoSupply': {
      if (action.enabled && levelFor(state.xp) < AUTO_SUPPLY_LEVEL) throw new RuleError(`Auto-supply unlocks at level ${AUTO_SUPPLY_LEVEL}.`);
      state.autoSupply = action.enabled === true;
      if (state.autoSupply) autoRestock(state, now);
      state.message = state.autoSupply ? 'Auto-supply is on: low stock is reordered automatically.' : 'Auto-supply is off.';
      break;
    }
    case 'buy': {
      const listed = SUPPLIERS.find((item) => item.id === action.supplierId);
      if (!listed) throw new RuleError('Unknown supplier.');
      const supplier = supplierInCity(listed, region.marketFactor);
      // Prices come from the server's own market for this bar, day, level and city event, never from the client.
      const quote = quotePurchase(marketFor(region, now, state.xp), cleanCart(action.cart, 99), supplier);
      if (!quote.lines.length) throw new RuleError('Add packs to your order first.');
      // Prestige trade contacts and an armed Supplier Voucher lower the final total.
      const { factor: discount, voucher } = orderDiscount(state, now);
      if (discount < 1) quote.total = coins(quote.total * discount);
      for (const line of quote.lines) {
        const room = roomFor(state, state.regionId, line.ingredientId);
        if (line.amount > room) throw new RuleError(`No room for ${INGREDIENTS.find((item) => item.id === line.ingredientId)!.name}: storeroom holds ${capacityOf(state, state.regionId, line.ingredientId)} in total and has space for ${room} more. A better fridge raises capacity.`);
      }
      if (state.money < quote.total) throw new RuleError('You do not have enough money.');
      if (voucher) { delete state.loot.armed['voucher']; state.message = 'Supplier Voucher used: 20% off.'; }
      const days = placeDeliveryOrder(state, supplier, quote, now);
      log(state, `Ordered ${quote.packs} packs from ${supplier.name} for ${quote.total.toFixed(2)} coins. Delivery in ${formatDeliveryTime(days)}.`);
      break;
    }
    case 'sell': {
      const cart = cleanCart(action.cart, 100_000);
      const economy = economyOf(state, now);
      const lines = Object.entries(cart).map(([ingredientId, quantity]) => {
        const item = INGREDIENTS.find((entry) => entry.id === ingredientId)!;
        const available = inventoryOf(state).find((stock) => stock.ingredientId === ingredientId)?.amount ?? 0;
        return { ingredientId, quantity, available, revenue: coins(item.basePrice * quantity * region.marketFactor * .55 * economy.buybackFactor(ingredientId)) };
      });
      if (!lines.length) throw new RuleError('Choose stock to sell first.');
      if (lines.some((line) => line.quantity > line.available)) throw new RuleError('Some stock is no longer available. Adjust your sale.');
      const revenue = coins(lines.reduce((sum, line) => sum + line.revenue, 0));
      for (const line of lines) inventoryOf(state).find((stock) => stock.ingredientId === line.ingredientId)!.amount -= line.quantity;
      state.money = coins(state.money + revenue);
      log(state, `Sold ${lines.length} products for ${revenue.toFixed(2)} coins.`);
      break;
    }
    case 'transfer': {
      if (!isRegion(action.targetId) || action.targetId === state.regionId) throw new RuleError('Choose another bar.');
      if (!state.ownedBarIds.includes(action.targetId)) throw new RuleError('Unlock that bar before transferring stock to it.');
      const ingredient = INGREDIENTS.find((item) => item.id === action.ingredientId);
      const source = inventoryOf(state).find((item) => item.ingredientId === action.ingredientId);
      const target = state.inventories[action.targetId].find((item) => item.ingredientId === action.ingredientId);
      if (!ingredient || !source || !target) throw new RuleError('Unknown ingredient.');
      // At most 100 ml / 3 items per transfer; the client may ask for less (stock reserved in its glass).
      const cap = Math.min(ingredient.unit === 'ml' ? 100 : 3, source.amount);
      const quantity = action.amount === undefined ? cap : Math.min(cap, cleanAmount(action.amount, cap));
      if (quantity <= 0) throw new RuleError(`No ${ingredient.name} available to transfer.`);
      source.amount -= quantity;
      target.amount += quantity;
      log(state, `Transferred ${quantity} ${ingredient.unit} ${ingredient.name} to ${REGIONS.find((item) => item.id === action.targetId)!.name}.`);
      break;
    }

    case 'claimDaily': {
      // The calendar day comes from the server clock, so changing the device date does nothing.
      const today = calendarDate(new Date(now));
      if (state.dailyGiftClaimedKey === today) throw new RuleError('Today’s gift has already been claimed.');
      state.loginStreak = consecutiveDays(state.dailyGiftClaimedKey, state.loginStreak, new Date(now));
      raiseStat(state, 'loginDays', state.loginStreak);
      const reward = dailyCoinsFor(state.loginStreak);
      state.money = coins(state.money + reward);
      const crystalReward = dailyCrystalsFor(state.loginStreak);
      state.crystals += crystalReward;
      state.dailyGiftClaimedKey = today;
      const locked = lockedRecipes(state);
      const learnedAdvanced = knownRecipes(state);
      const recipeRewards = [...locked, ...learnedAdvanced];
      if (recipeRewards.length && random() < .12) {
        const recipe = recipeRewards[Math.floor(random() * recipeRewards.length)]!;
        unlockRecipe(state, recipe.id, 'daily-gift');
        state.dailyGiftResult = `Day ${state.loginStreak}: +${reward} coins${crystalReward ? `, +${crystalReward} crystals` : ''} and a lucky ${recipe.name} recipe card!`;
      } else {
        state.dailyGiftResult = `Day ${state.loginStreak}: +${reward} coins${crystalReward ? ` and +${crystalReward} crystals` : ''}. Come back tomorrow to grow your streak.`;
      }
      state.dailyGiftResult += dailyStreakBox(state);
      state.message = state.dailyGiftResult;
      break;
    }
    case 'completeDailyLesson': {
      const today = calendarDate(new Date(now));
      const lesson = dailyLessonsFor(today).find((item) => item.id === action.lessonId);
      if (!lesson) throw new RuleError('This lesson is not part of today’s practice.');
      if (state.dailyLessonKey !== today) {
        state.dailyLessonKey = today;
        state.dailyLessonCompletedIds = [];
      }
      if (state.dailyLessonCompletedIds.includes(lesson.id)) throw new RuleError('This lesson has already been completed today.');
      if (normalizeLessonAnswer(action.answer) !== normalizeLessonAnswer(lesson.answer)) throw new RuleError('Not quite. Review the choices and try again.');

      const prospectiveStreak = consecutiveDays(state.lastLearningDayKey, state.learningStreak, new Date(now));
      const multiplier = 1 + learningStreakBonus(prospectiveStreak);
      const xpReward = Math.round(lesson.xp * multiplier);
      const crystalReward = Math.round(lesson.crystals * multiplier);
      state.xp += xpReward;
      state.crystals += crystalReward;
      state.dailyLessonCompletedIds.push(lesson.id);

      let recipeNote = '';
      if (state.dailyLessonCompletedIds.length >= DAILY_LESSON_COUNT) {
        state.learningStreak = prospectiveStreak;
        state.lastLearningDayKey = today;
        const rewards = [...lockedRecipes(state), ...knownRecipes(state)];
        if (rewards.length && random() < DAILY_LESSON_RECIPE_CHANCE) {
          const recipe = rewards[Math.floor(random() * rewards.length)]!;
          const learned = unlockRecipe(state, recipe.id, 'daily-lesson');
          recipeNote = learned ? ` Lucky drop: ${recipe.name} was learned!` : ` Lucky drop: +1 ${recipe.name} recipe card!`;
        }
        recipeNote += dailyLessonsBox(state, state.learningStreak, now);
      }
      const bonus = Math.round((multiplier - 1) * 100);
      state.dailyLessonResult = `${lesson.kind} complete: +${xpReward} XP and +${crystalReward} crystals${bonus ? ` (${bonus}% streak bonus)` : ''}.${recipeNote}`;
      state.message = state.dailyLessonResult;
      break;
    }
    case 'buyRecipe': {
      const recipe = RECIPES.find((item) => item.id === action.recipeId);
      // A known recipe can be bought again as a duplicate card for mastery or gifting.
      if (!recipe) throw new RuleError('This recipe is not for sale.');
      const spare = state.knownRecipeIds.includes(recipe.id);
      const price = recipePurchase(recipe, RECIPES.indexOf(recipe));
      if (price.currency === 'crystals') {
        if (state.crystals < price.amount) throw new RuleError(`You need ${price.amount} crystals to buy this recipe.`);
        state.crystals -= price.amount;
      } else {
        if (state.money < price.amount) throw new RuleError(`You need ${price.amount} coins to buy this recipe.`);
        state.money = coins(state.money - price.amount);
      }
      unlockRecipe(state, recipe.id, 'shop');
      state.message = spare ? `A spare ${recipe.name} recipe card is ready to gift.` : `${recipe.name} added to your recipe book.`;
      break;
    }
    case 'upgradeRecipe': {
      const recipe = RECIPES.find((item) => item.id === action.recipeId);
      if (!recipe || !state.knownRecipeIds.includes(recipe.id)) throw new RuleError('Learn this recipe first.');
      const level = recipeLevel(state, recipe.id);
      const cost = upgradeCost(recipe, level);
      const cards = recipeCardsRequired(level);
      if (cost === undefined || level >= RECIPE_MAX_LEVEL) throw new RuleError(`${recipe.name} is already at the top level.`);
      if (cards && recipeCopies(state, recipe.id) < cards) throw new RuleError(`You need ${cards} ${recipe.name} recipe cards to reach level ${level + 1}.`);
      if (state.money < cost) throw new RuleError(`You need ${cost} coins to upgrade ${recipe.name}.`);
      state.money = coins(state.money - cost);
      state.recipeCopies = { ...(state.recipeCopies ?? {}), [recipe.id]: recipeCopies(state, recipe.id) - cards };
      state.recipeLevels = { ...(state.recipeLevels ?? {}), [recipe.id]: level + 1 };
      state.message = `${recipe.name} is now level ${level + 1}: guests pay ${Math.round((recipeBonus(level + 1).pay - 1) * 100)}% more for it.`;
      break;
    }
    case 'exchangeCrystals': {
      const amount = cleanAmount(action.crystals, 250);
      const bundle = crystalExchange(amount);
      if (!bundle) throw new RuleError('Choose one of the available crystal exchange bundles.');
      if (state.crystals < bundle.crystals) throw new RuleError(`You need ${bundle.crystals} crystals for this exchange.`);
      state.crystals -= bundle.crystals;
      state.money = coins(state.money + bundle.coins);
      log(state, `Exchanged ${bundle.crystals} crystals for ${bundle.coins.toLocaleString('en-US')} coins.`);
      break;
    }
    case 'buyInterior': {
      const interior = INTERIORS.find((item) => item.id === action.interiorId);
      if (!interior || interior.crystalCost <= 0 || state.ownedInteriorIds.includes(interior.id)) throw new RuleError('This background is not for sale.');
      if (isEventInterior(interior.id)) throw new RuleError(`${interior.name} is a special event reward: find it in Gold and Choice boxes.`);
      if (state.crystals < interior.crystalCost) throw new RuleError(`You need ${interior.crystalCost} crystals for ${interior.name}.`);
      state.crystals -= interior.crystalCost;
      state.ownedInteriorIds.push(interior.id);
      state.bars[state.regionId].interior = interior.id;
      // The background's own style comes with it (it cannot be bought on its own).
      const linked = styleForInterior(interior.id);
      const styleName = linked ? grantCosmetic(state, `bartender:${linked.value}:${linked.character}`) : '';
      state.message = `${interior.name} purchased and applied to ${state.bars[state.regionId].name}.${styleName ? ` Its style ${styleName} is yours too.` : ''}`;
      break;
    }
    case 'buyStyle': {
      const style = COSMETICS.find((entry) => entry.id === action.cosmeticId);
      if (!style || style.key !== 'bartender' || !style.character || styleSource(style.character, style.value) !== 'shop') throw new RuleError('This style is not for sale.');
      if (state.ownedCosmeticIds.includes(style.id)) throw new RuleError('You already own this style.');
      if (state.crystals < STYLE_SHOP_PRICE) throw new RuleError(`You need ${STYLE_SHOP_PRICE} crystals for ${style.label}.`);
      state.crystals -= STYLE_SHOP_PRICE;
      state.message = `${grantCosmetic(state, style.id)} unlocked.`;
      break;
    }
    case 'buyBottleStock': {
      const product = ALCOHOL_PRODUCTS.find((item) => item.id === action.productId);
      const quantity = cleanAmount(action.quantity ?? 1, 10);
      const unitCost = product ? bottleRestockCrystalCost(product) : 0;
      if (!product || !unitCost || !quantity) throw new RuleError('This bottle is not available in the crystal reserve market.');
      const cost = Math.max(1, Math.ceil(unitCost * quantity * lootBonuses(state, now).bottleCostFactor));
      if (state.crystals < cost) throw new RuleError(`You need ${cost} crystals to restock ${quantity} × ${product.name}.`);
      state.crystals -= cost;
      const stock = bottleStock(state, product.id);
      if (stock) stock.quantity += quantity;
      else state.bottleInventories[state.regionId].push({ productId: product.id, quantity });
      log(state, `Restocked ${quantity} × ${product.name} for ${cost} crystals.`);
      break;
    }
    case 'expediteCustomer': {
      if (state.customers.length || !state.nextCustomerAt) throw new RuleError('A customer is already at the bar.');
      const cost = arrivalSkipCrystalCost(state.nextCustomerAt - now);
      if (cost <= 0) throw new RuleError('The next customer is already arriving.');
      if (state.crystals < cost) throw new RuleError(`You need ${cost} crystals to welcome the next customer now.`);
      state.crystals -= cost;
      welcomeNextCustomer(state, now, random);
      state.message = `The next customer arrived early for ${cost} crystals.`;
      break;
    }

    case 'switchBar': {
      if (!isRegion(action.regionId)) throw new RuleError('Unknown city.');
      if (!state.ownedBarIds.includes(action.regionId)) throw new RuleError('Purchase this bar before managing it.');
      state.regionId = action.regionId;
      state.message = `Now managing the ${REGIONS.find((item) => item.id === action.regionId)!.name} bar.`;
      break;
    }
    case 'chooseStartingBar': {
      if (!isRegion(action.regionId)) throw new RuleError('Unknown city.');
      if (state.startingBarChosen) throw new RuleError('Your first bar has already been chosen.');
      state.ownedBarIds = [action.regionId];
      state.regionId = action.regionId;
      state.startingBarChosen = true;
      const starterInterior = DEFAULT_BARS[action.regionId].interior;
      state.bars[action.regionId].interior = starterInterior;
      if (!state.ownedInteriorIds.includes(starterInterior)) state.ownedInteriorIds.push(starterInterior);
      // The starter guests now drink in the chosen city, at its prices.
      const cityRate = economyOf(state, now).guestPriceFactor;
      for (const waiting of state.customers) waiting.priceFactor = cityRate;
      state.message = `${REGIONS.find((item) => item.id === action.regionId)!.name} is now your first bar.`;
      break;
    }
    case 'buyBar': {
      if (!isRegion(action.regionId)) throw new RuleError('Unknown city.');
      if (!state.startingBarChosen) throw new RuleError('Choose your first bar before expanding.');
      if (state.ownedBarIds.includes(action.regionId)) throw new RuleError('You already own this bar.');
      if (levelFor(state.xp) < BAR_PURCHASE_LEVEL) throw new RuleError(`Reach level ${BAR_PURCHASE_LEVEL} to buy another bar.`);
      const price = barUnlockPrice(state.ownedBarIds);
      if (price.currency === 'coins') {
        if (state.money < price.amount) throw new RuleError(`You need ${price.amount} coins to buy this bar.`);
        state.money = coins(state.money - price.amount);
      } else {
        if (state.crystals < price.amount) throw new RuleError(`You need ${price.amount} crystals to buy this bar.`);
        state.crystals -= price.amount;
      }
      state.ownedBarIds.push(action.regionId);
      state.regionId = action.regionId;
      const includedInterior = DEFAULT_BARS[action.regionId].interior;
      state.bars[action.regionId].interior = includedInterior;
      if (!state.ownedInteriorIds.includes(includedInterior)) state.ownedInteriorIds.push(includedInterior);
      state.message = `${REGIONS.find((item) => item.id === action.regionId)!.name} bar unlocked.`;
      break;
    }
    case 'renameBar': {
      const name = cleanText(action.name, 32);
      if (!name) throw new RuleError('Enter a bar name first.');
      state.bars[state.regionId].name = name;
      state.message = `${region.name} is now home to ${name}.`;
      break;
    }
    case 'renameBartender': {
      const name = cleanText(action.name, 18);
      if (!name) throw new RuleError('Enter a bartender nickname first.');
      state.bars[state.regionId].bartenderNickname = name;
      state.message = `${name} is now working at ${state.bars[state.regionId].name}.`;
      break;
    }
    case 'setDecor': {
      const allowed = (BAR_PROFILE_OPTIONS as Record<string, readonly string[]>)[action.key];
      if (!allowed || !allowed.includes(action.value)) throw new RuleError('That style is not available.');
      if (action.key === 'interior' && !state.ownedInteriorIds.includes(action.value)) throw new RuleError('Purchase this background before using it.');
      if (!canUseCosmetic(state.ownedCosmeticIds, action.key, action.value, state.bars[state.regionId].bartenderCharacter)) throw new RuleError('Unlock this style first: buy it, earn it from an achievement or a box, or win it in a style draw.');
      (state.bars[state.regionId] as unknown as Record<string, string>)[action.key] = action.value;
      break;
    }
    case 'claimPass':
    case 'buyPassPremium': {
      try {
        state.message = action.type === 'claimPass' ? claimPass(state, action.track, action.level, random, now) : buyPassPremium(state, now);
      } catch (error) {
        if (error instanceof PassError) throw new RuleError(error.message);
        throw error;
      }
      break;
    }
    case 'spinRoulette': {
      const today = calendarDate(new Date(now));
      if (state.roulette.day !== today) state.roulette = { day: today, spins: 0, last: state.roulette.last };
      if (state.roulette.spins >= ROULETTE_SPINS_PER_DAY) throw new RuleError(`You used all ${ROULETTE_SPINS_PER_DAY} spins today. Come back tomorrow.`);
      const { index, reward } = spinWheel(levelFor(state.xp), random);
      const text = grantReward(state, reward, random);
      state.roulette.spins += 1;
      state.roulette.last = { index, text: `Wheel: ${text}.`, n: (state.roulette.last?.n ?? 0) + 1 };
      state.message = state.roulette.last.text;
      break;
    }
    case 'giveAshtray':
    case 'giveWater':
    case 'callTaxi':
    case 'askToLeave': {
      const target = state.customers.find((item) => item.id === action.customerId);
      if (!target) throw new RuleError('This guest is no longer here.');
      const guests = guestContext(state, now, random);
      if (action.type === 'giveAshtray') {
        const result = giveAshtray(state, target, now);
        if (!result.ok) throw new RuleError(result.text);
        state.message = result.text;
      } else if (action.type === 'giveWater') state.message = giveWater(target, now);
      else if (action.type === 'callTaxi') state.message = `${target.name}: “${callTaxi(target, guests)}”`;
      else {
        if (!['gentle', 'firm', 'aggressive'].includes(action.tone)) throw new RuleError('Choose how to ask.');
        askToLeave(state, target, action.tone, guests);
      }
      break;
    }
    case 'situationChoice': {
      const target = state.customers.find((item) => item.id === action.customerId);
      if (!target || !hasSituation(target)) throw new RuleError('There is nothing to answer.');
      const choice = visibleChoices(state, target, random).find((item) => item.id === action.choiceId);
      if (!choice) throw new RuleError('That answer is not possible now.');
      applyResolution(state, target, resolveChoice(state, target, choice, now, random), guestContext(state, now, random));
      break;
    }
    case 'reportIssue': {
      const text = cleanText(action.text, 240);
      if (text.length < 3) throw new RuleError('Write what went wrong first.');
      const english = context.checkEnglish(text);
      state.languageStats.sentences++;
      if (english.ok) { state.languageStats.correct++; state.xp += 2; }
      const result = fileClaim(state, String(action.issueId), english.corrected, english, now, random);
      state.message = `${result.line}${result.note ? ` ${result.note}` : ''}${english.ok ? '' : ` (Better: “${english.corrected}”)`}`;
      break;
    }
    case 'discardStock': {
      if (!discardQuarantine(state, String(action.id))) throw new RuleError('There is nothing to throw away.');
      state.message = 'You threw away the unusable goods.';
      break;
    }
    case 'pitchStart':
    case 'pitchAsk':
    case 'pitchCancel': {
      const target = state.customers.find((item) => item.id === action.customerId);
      if (!target) throw new RuleError('This guest is no longer here.');
      if (action.type === 'pitchCancel') { cancelPitch(target); break; }
      if (action.type === 'pitchStart') {
        const problem = startPitch(state, target, action.kind, String(action.itemId), now);
        if (problem) throw new RuleError(problem);
        const food = action.kind === 'food' ? foodById(String(action.itemId)) : undefined;
        const recipeName = RECIPES.find((item) => item.id === action.itemId)?.name;
        addLine(ensureTranscript(state, target), 'bartender', food ? `Would you like ${food.name.toLowerCase()} with your drink?` : `Would you like ${withArticle(recipeName ?? 'another drink')} next?`, { ok: true });
        break;
      }
      if (!pitchChance(state, target, now)) throw new RuleError('Choose what to offer first.');
      const result = askPitch(state, target, now, random);
      const transcript = ensureTranscript(state, target);
      addLine(transcript, 'customer', voice(target, result.text, transcript.lines.length));
      break;
    }
    case 'wipeAccount': {
      // Starts the account over from nothing, at any level. Only the "tour done" mark is kept, so nobody sees it again.
      if (action.confirm !== true) throw new RuleError('Confirm the reset first.');
      const keep = { tour: state.tour };
      const fresh = createInitialState(now);
      for (const key of Object.keys(state)) delete (state as unknown as Record<string, unknown>)[key];
      Object.assign(state, fresh, keep);
      state.message = 'Your account was reset. Choose your first bar to begin again.';
      return { moneyDelta: 0, crystalDelta: 0, weekly: { week: state.loot.weekly.week, score: 0, label: '', level: 1 } };
    }
    case 'topUp': {
      // Supplying stock opens at the same level as auto-supply.
      if (levelFor(state.xp) < AUTO_SUPPLY_LEVEL) throw new RuleError(`Supplying stock unlocks at level ${AUTO_SUPPLY_LEVEL}.`);
      const ordered = autoRestock(state, now, true);
      if (!ordered) throw new RuleError(state.message.includes('paused') ? state.message : 'Nothing is running low, or an order for it is already on the way.');
      break;
    }
    case 'setFeaturedAchievements': {
      // Only achievements the player has earned can be shown, at most four; an empty list goes back to "the last four".
      const earned = new Set(state.loot.achievements);
      const ids = Array.isArray(action.ids) ? [...new Set(action.ids.filter((id) => typeof id === 'string' && earned.has(id)))].slice(0, FEATURED_MAX) : [];
      state.featuredAchievements = ids.length ? ids : undefined;
      state.message = ids.length ? 'Your profile shows the achievements you picked.' : 'Your profile shows your latest achievements.';
      break;
    }
    case 'setTour':
      state.tour = action.value === 'done' ? 'done' : 'skipped';
      break;
    case 'recruitCompanion':
    case 'giveKeepsake':
    case 'buyKeepsake':
    case 'assignCompanion':
    case 'spotlightCompanion':
    case 'levelUpCompanion':
    case 'dismissCompanion': {
      try {
        state.message = action.type === 'recruitCompanion' ? recruitCompanion(state, action.id)
          : action.type === 'giveKeepsake' ? giveKeepsake(state, action.id, action.kind)
          : action.type === 'buyKeepsake' ? buyKeepsake(state, action.kind, action.quantity)
          : action.type === 'assignCompanion' ? assignCompanion(state, action.id)
          : action.type === 'spotlightCompanion' ? spotlightCompanion(state, action.id, now)
          : action.type === 'levelUpCompanion' ? levelUpCompanion(state, action.id) : dismissCompanion(state, action.id);
      } catch (error) {
        if (error instanceof CompanionError) throw new RuleError(error.message);
        throw error;
      }
      break;
    }
    case 'hireStaff':
    case 'upgradeStaff': {
      try { state.message = action.type === 'hireStaff' ? hireStaff(state) : upgradeStaff(state, Number(action.index)); }
      catch (error) { throw new RuleError((error as Error).message); }
      break;
    }
    case 'cleanAshtrays': {
      const cleaned = cleanAshtrays(state);
      if (!cleaned) throw new RuleError('There is nothing to clean.');
      state.message = `You cleaned ${cleaned} dirty ashtray${cleaned === 1 ? '' : 's'}.`;
      break;
    }
    case 'activatePopularityBoost': {
      if (state.popularity < 30) throw new RuleError('You need 30 popularity to activate a guest boost.');
      if (state.popularityBoost) throw new RuleError('A popularity boost is already active.');
      state.popularity -= 30;
      if (action.boost === 'no-cooldown') {
        state.popularityBoost = { kind: 'no-cooldown', until: now + 15 * 60 * 1000 };
        if (!state.customers.length) state.nextCustomerAt = now + 1000;
        state.message = 'Popularity boost active: guests arrive without cooldown for 15 minutes.';
      } else if (action.boost === 'vip-run') {
        const remaining = 3 + Math.floor(random() * 3);
        state.popularityBoost = { kind: 'vip-run', remaining };
        if (!state.customers.length) state.nextCustomerAt = now + 1000;
        state.message = `Popularity boost active: the next ${remaining} guests are VIPs.`;
      } else throw new RuleError('Unknown popularity boost.');
      break;
    }

    case 'upgradeEquipment':
    case 'promoteEquipment':
    case 'openBox':
    case 'pickReward':
    case 'buyBox':
    case 'buyConsumable':
    case 'useConsumable':
    case 'drawStyle':
    case 'claimSpark':
    case 'craftSkin':
    case 'craftStyle':
    case 'designSignature':
    case 'claimLeaderboardReward':
    case 'claimQuest':
    case 'claimAchievement': {
      try {
        switch (action.type) {
          case 'upgradeEquipment': upgradeEquipment(state, action.item, now, action.regionId); break;
          case 'promoteEquipment': promoteEquipment(state, action.item, action.regionId); break;
          case 'openBox': openBox(state, action.box, random, now); break;
          case 'pickReward': pickChoice(state, action.index, random); break;
          case 'buyBox': buyBox(state, action.box, action.quantity); break;
          case 'buyConsumable': buyConsumable(state, action.id, action.quantity); break;
          case 'useConsumable': useConsumable(state, action.id, action.recipeId, now); break;
          case 'drawStyle': drawStyle(state, action.count, action.banner, now, random); break;
          case 'claimSpark': claimSpark(state, action.cosmeticId, now); break;
          case 'craftSkin': craftSkin(state, action.cosmeticId); break;
          case 'craftStyle': craftStyle(state, action.cosmeticId); break;
          case 'designSignature': designSignature(state, { name: action.name, items: action.items, needsShake: action.needsShake }); break;
          case 'claimLeaderboardReward': claimLeaderboardReward(state, context.leaderboard, now); break;
          case 'claimQuest': claimQuest(state, action.questId, now); break;
          case 'claimAchievement': claimAchievement(state, action.id); break;
        }
      } catch (error) {
        if (error instanceof LootError) throw new RuleError(error.message);
        throw error;
      }
      break;
    }

    default: throw new RuleError('Unknown action.');
  }

  // Achievements count what the player spent in all.
  addStat(state, 'coinsSpent', Math.floor(moneyBefore - state.money));
  addStat(state, 'crystalsSpent', crystalsBefore - state.crystals);
  grantLevelBoxes(state);
  syncDerivedStats(state);
  // Auto-serve XP does not count for the leaderboard: the ranking rewards hands-on service.
  addWeeklyScore(state, (action.type === 'serve' && action.auto) ? 0 : state.xp - xpBefore, now);
  if (!Number.isFinite(state.money) || state.money < 0) throw new RuleError('Not enough money.');
  if (!Number.isFinite(state.crystals) || state.crystals < 0) throw new RuleError('Not enough crystals.');
  return { moneyDelta: coins(state.money - moneyBefore), crystalDelta: state.crystals - crystalsBefore, audit: auditEntry(state, action),
    weekly: { week: state.loot.weekly.week, score: state.loot.weekly.score, label: state.bars[state.regionId].name, level: levelFor(state.xp) } };
}

// Loot actions leave a trail (what was rolled, pity) for the server's loot ledger.
const AUDITED = new Set<GameAction['type']>(['openBox', 'pickReward', 'buyBox', 'buyConsumable', 'drawStyle', 'claimSpark', 'craftSkin', 'craftStyle', 'claimLeaderboardReward', 'claimQuest', 'claimAchievement']);
export interface LootAudit { action: string; message: string; detail: Record<string, unknown>; }
function auditEntry(state: PlayerState, action: GameAction): LootAudit | undefined {
  if (!AUDITED.has(action.type)) return undefined;
  const detail: Record<string, unknown> = {};
  if (action.type === 'drawStyle') Object.assign(detail, { banner: (action as { banner?: string }).banner ?? 'standard', results: state.loot.lastDraw, pity: state.loot.pity, season: state.loot.season });
  else if (action.type === 'openBox' && state.loot.pendingChoice) Object.assign(detail, { offered: state.loot.pendingChoice });
  return { action: action.type, message: state.message, detail };
}

// A guest was served (a drink or a bottle): the profile counts all bars and each bar.
function countServed(state: PlayerState) {
  state.served += 1;
  state.servedByBar[state.regionId] = (state.servedByBar[state.regionId] ?? 0) + 1;
}

function offerSimilar(state: PlayerState, target: Customer, marketFactor: number) {
  if (target.signature) throw new RuleError('This guest came for your signature cocktail and will not swap it.');
  const onShelf = (id: string) => (bottleStock(state, id)?.quantity ?? 0) > 0;
  if (target.orderKind === 'serve' && target.serveRequest) {
    const substitute = substitutesFor(target.serveRequest, onShelf)[0];
    if (!substitute) throw new RuleError('There is no similar stocked brand to offer.');
    target.serveRequest = { ...target.serveRequest, substitutedFrom: target.serveRequest.substitutedFrom ?? target.serveRequest.productId, productId: substitute.id };
    target.request = serveRequestText(target.serveRequest);
    target.orderRevealed = true;
    target.specialRecipeRewardId = undefined;
    state.message = `${target.name} will have ${target.request.replace(/, please\.$/, '')} instead.`;
    return;
  }
  if (target.orderKind === 'bottle' && target.bottleRequest) {
    const request = target.bottleRequest;
    const substitute = ALCOHOL_PRODUCTS
      .filter((product) => product.id !== request.productId && product.type === request.type)
      .filter((product) => (bottleStock(state, product.id)?.quantity ?? 0) >= request.quantity)
      .filter((product) => bottleTotal(product, request.quantity, marketFactor) <= request.budget)
      .sort((a, b) => b.popularity - a.popularity)[0];
    if (!substitute) throw new RuleError('There is no similar bottle within this customer’s budget.');
    target.bottleRequest = { ...request, productId: substitute.id };
    target.selectedBottleId = substitute.id;
    target.orderRevealed = true;
    target.specialRecipeRewardId = undefined;
    state.message = `${target.name} accepted ${substitute.name} as a similar option.`;
    return;
  }
  const original = requiredRecipe(target);
  const originalIds = new Set(original.ingredients.map((item) => item.ingredientId));
  const substitute = knownRecipes(state)
    .filter((candidate) => candidate.id !== target.orderRecipeId)
    .filter((candidate) => candidate.ingredients.every((part) => (inventoryOf(state).find((stock) => stock.ingredientId === part.ingredientId)?.amount ?? 0) >= part.amount))
    .map((candidate) => {
      const overlap = candidate.ingredients.filter((part) => originalIds.has(part.ingredientId)).length;
      const notes = candidate.tastingNotes.filter((note) => original.tastingNotes.includes(note)).length;
      return { candidate, score: overlap * 5 + notes * 3 + (candidate.category === original.category ? 2 : 0) - Math.abs(candidate.price - original.price) * .15 };
    })
    .sort((a, b) => b.score - a.score)[0]?.candidate;
  if (!substitute) throw new RuleError('No similar cocktail can be made from the current stock.');
  target.orderRecipeId = substitute.id;
  target.modifierId = undefined;
  target.orderKind = 'cocktail';
  target.orderRevealed = true;
  target.specialRecipeRewardId = undefined;
  target.request = `I’ll have ${withArticle(substitute.name)} instead, please.`;
  state.message = `${target.name} accepted ${substitute.name} as a similar drink.`;
}


// ---- Conversation (server side: the hidden order never leaves the server) ----

const MAX_LINES = 60;
function addLine(transcript: Transcript, speaker: 'customer' | 'bartender', text: string, extra: { note?: string; ok?: boolean } = {}) {
  transcript.lines.push({ id: (transcript.lines.at(-1)?.id ?? -1) + 1, speaker, text, ...extra });
  if (transcript.lines.length > MAX_LINES) transcript.lines.splice(0, transcript.lines.length - MAX_LINES);
}

// A line the guest says on their own (a payment problem, a new situation), written into their conversation.
function addGuestLine(state: PlayerState, guest: Customer, text: string) {
  addLine(ensureTranscript(state, guest), 'customer', text);
}

// What a situation outcome does to the conversation and the seat: lines, a guest who leaves, a guest who stays on.
function applyResolution(state: PlayerState, guest: Customer, resolution: Resolution, guests: GuestContext, bartenderAlreadyShown = false) {
  const transcript = ensureTranscript(state, guest);
  if (resolution.bartender && !bartenderAlreadyShown) addLine(transcript, 'bartender', resolution.bartender, { ok: resolution.tone !== 'rude', note: resolution.tip && resolution.tone !== 'good' ? resolution.tip : undefined });
  else if (resolution.bartender && resolution.tip && resolution.tone !== 'good') { const last = transcript.lines.at(-1); if (last && last.speaker === 'bartender') last.note = resolution.tip; }
  if (resolution.guest) addLine(transcript, 'customer', resolution.guest);
  if (resolution.followUp) addLine(transcript, 'customer', resolution.followUp);
  if (resolution.tone === 'good') state.xp += 1;
  if (resolution.leave) removeGuest(state, guest, guests);
  else if (resolution.remake) {
    guest.orderRevealed = true;
    guest.patienceRemaining = guest.patience;
    ensureSocial(guest, guests.now).phase = 'ordering';
    state.activeCustomerId = guest.id;
    state.message = `Make ${guest.name} a fresh drink.`;
  } else if (resolution.afterServe) settleGuest(state, guest, guests);
}

// How a guest who already knows what they want still sounds like a person: their feeling first.
function feelingFirst(guest: Customer) {
  const lively = openingFor(guest);
  return lively ? `${lively.text} ` : '';
}

function ensureTranscript(state: PlayerState, guest: Customer, now = state.lastClockAt): Transcript {
  state.conversations ??= {};
  const existing = state.conversations[guest.id];
  if (existing) return existing;
  const recipe = RECIPES.find((item) => item.id === guest.orderRecipeId);
  const opening = guestLine(state, guest) ?? (guest.social?.phase === 'enjoying' ? enjoyingOpening(guest, now)
    : guest.orderKind === 'bottle' ? `${feelingFirst(guest)}${bottleOpeningLine(guest)}`
    : guest.orderKind === 'serve' || !recipe ? `${guest.social ? feelingFirst(guest) : `${guest.greeting} `}${guest.request}`
      : openingLine(guest, buildProfile(recipe)));
  // A bottle customer names the occasion in the opening line, so it is already known and never asked again.
  const bottleFacts: Transcript['bottleFacts'] = guest.orderKind === 'bottle' ? { occasion: guest.bottleRequest?.occasion ?? 'party' } : {};
  const transcript: Transcript = { lines: [], facts: [], bottleFacts, expression: 'thinking', attempts: 0, correct: 0 };
  addLine(transcript, 'customer', opening);
  state.conversations[guest.id] = transcript;
  return transcript;
}

function say(state: PlayerState, guest: Customer, text: string, context: RuleContext, marketFactor: number) {
  const transcript = ensureTranscript(state, guest);
  if (guest.social) guest.social.spokenAt = context.now;
  // A signature cocktail's name is invented, so the spell checker cannot know it: it is swapped for a real drink
  // word while the grammar is checked, and put back in the correction.
  const signatureName = guest.signature?.name;
  // The mask is a real drink word that does not already occur in the sentence, so it can be swapped back unambiguously.
  const maskChoices = signatureName && /^[aeiou]/i.test(signatureName) ? ['Orange', 'Olive', 'Oolong'] : ['Mojito', 'Daiquiri', 'Margarita'];
  const mask = maskChoices.find((word) => !new RegExp(`\\b${word}\\b`, 'i').test(text)) ?? maskChoices[0]!;
  // The name must stand alone: "Gin" is not found inside "begin".
  const nameRegex = signatureName ? new RegExp(`(?<![\\p{L}\\p{N}])${signatureName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&').replace(/\s+/g, '\\s+')}(?![\\p{L}\\p{N}])`, 'iu') : undefined;
  const namesSignature = !!nameRegex && nameRegex.test(text);
  const checked = context.checkEnglish(nameRegex ? text.replace(nameRegex, mask) : text);
  const english = signatureName ? { ...checked, corrected: checked.corrected.replace(new RegExp(mask, 'g'), signatureName) } : checked;
  transcript.attempts++;
  state.languageStats.sentences++;
  if (english.ok) {
    state.languageStats.correct++;
    transcript.correct++;
    const rewarded = state.rewardedSentences[guest.id] ?? 0;
    if (rewarded < MAX_REWARDED_SENTENCES) {
      state.rewardedSentences[guest.id] = rewarded + 1;
      state.xp += 3;
    }
  } else {
    guest.patienceRemaining = Math.max(1, guest.patienceRemaining - 15);
  }
  addLine(transcript, 'bartender', text, { ok: english.ok, note: english.ok ? english.note : `Better: “${english.corrected}”` });

  // While a situation is open, the guest answers the situation: a typed sentence that means one of the offered replies counts as it.
  if (hasSituation(guest)) {
    const choice = matchChoice(state, guest, english.corrected) ?? matchChoice(state, guest, text);
    if (choice) { applyResolution(state, guest, resolveChoice(state, guest, choice, context.now, context.random ?? Math.random), guestContext(state, context.now, context.random ?? Math.random), true); return; }
    addLine(transcript, 'customer', `I need your help with this. ${guestLine(state, guest) ?? ''}`.trim());
    transcript.expression = 'confused';
    return;
  }
  // The guest answers what they understood: the corrected sentence.
  const heard = english.corrected;
  const sellTalk = guest.social?.pitch ? adjustPitch(guest, pitchActsIn(heard), `${guest.id}:${transcript.lines.length}`) : undefined;
  const onShelf = (id: string) => (bottleStock(state, id)?.quantity ?? 0) > 0;
  const recipe = RECIPES.find((item) => item.id === guest.orderRecipeId);
  const profile = guest.orderKind === 'cocktail' && recipe ? buildProfile(recipe) : undefined;
  const serveAnswer = guest.orderKind === 'serve' ? replyToServe(heard, guest, onShelf) : undefined;
  const namesOrder = !!findRecipeMention(heard, RECIPES) || !!findBottleMention(heard);
  // The bartender has to bring up the house special (by name, or as "the house special") before the guest confirms.
  const signatureAnswer: CustomerReply | undefined = guest.signature && !guest.orderRevealed && (namesSignature || /\b(house special|signature)\b/i.test(heard))
    ? { text: `Yes! ${guest.signature.name} is exactly what I came for. Thank you!`, expression: 'very-happy', facts: [], confirmed: true } : undefined;
  // A person answers like a person first: small talk, kindness, offers, refusals and “time to go” come before order talk.
  const turn = transcript.lines.length;
  const lifelike = !serveAnswer && (!namesOrder || !!guest.social?.pitch) ? socialReply(guest, actsIn(heard), turn, heard) : undefined;
  const leaveTone = lifelike?.intent === 'leave-gentle' ? 'gentle' : lifelike?.intent === 'leave-firm' ? 'firm' : lifelike?.intent === 'leave-rude' ? 'aggressive' : undefined;
  const leaving = leaveTone ? askToLeave(state, guest, leaveTone, guestContext(state, context.now, context.random ?? Math.random)) : undefined;
  if (sellTalk && guest.social) guest.social.rapport = Math.max(0, Math.min(100, guest.social.rapport + sellTalk.rapport));
  const social: (CustomerReply & { expression: Expression }) | undefined = leaving
    ? { text: leaving.text, expression: leaving.outcome === 'leaves' ? 'smile' : 'disappointed', facts: [] }
    : lifelike ? { text: lifelike.text, expression: lifelike.expression, facts: [] }
      : sellTalk ? { text: sellTalk.text, expression: sellTalk.expression, facts: [] } : undefined;
  if (lifelike && !leaving) {
    applySocialReply(guest, lifelike);
    if (lifelike.intent === 'refuse') ensureSocial(guest, context.now).refused = true;
  }
  const service = social || signatureAnswer || serveAnswer || (namesOrder && guest.orderKind !== 'serve') ? undefined
    : serviceReply(heard, { customer: guest, kind: guest.orderKind === 'bottle' ? 'bottle' : 'drink', confirmed: !!guest.orderRevealed, wish: profile ? shortWish(profile) : undefined });
  const reply: CustomerReply & { bottleFacts?: Transcript['bottleFacts']; selectedBottleId?: string } =
    signatureAnswer
    ?? (serveAnswer ? { text: serveAnswer.text, expression: serveAnswer.expression, facts: [] } : undefined)
    ?? social
    ?? service
    ?? (guest.signature ? (guest.orderRevealed ? { text: `Just your ${guest.signature.name}, please.`, expression: 'smile' as const, facts: [] }
      : { text: 'I heard this bar has a wonderful house special. Do you know which one I mean?', expression: 'thinking' as const, facts: [] })
    : guest.orderKind === 'serve' && guest.serveRequest ? { text: `Just ${serveName(guest.serveRequest)}, please.`, expression: 'smile', facts: [] }
      : guest.orderKind === 'bottle' ? replyToBottle(heard, guest, transcript.bottleFacts, marketFactor)
        : profile ? replyTo(heard, guest, profile, RECIPES, transcript.facts, MODIFIERS.find((item) => item.id === guest.modifierId)?.label)
          : { text: 'Sorry, I don’t understand.', expression: 'confused', facts: [] });
  // After a little chat the guest remembers why they came: they nudge the order along.
  const guestSocial = guest.social;
  // After a few words the guest comes back to the order: this is a bar, not a chat room.
  if (social && !leaving && guestSocial && !guest.orderRevealed && guestSocial.phase === 'ordering' && !guestSocial.refused && reply.text) {
    reply.text = `${withoutTrailingQuestion(reply.text)} ${backToOrder(`${guest.id}:${transcript.lines.length}`)}`;
  }

  // Effects happen here, on the server — the client cannot trigger them directly.
  if (serveAnswer?.switchTo && guest.serveRequest && substitutesFor(guest.serveRequest, onShelf).some((item) => item.id === serveAnswer.switchTo)) {
    guest.serveRequest = { ...guest.serveRequest, substitutedFrom: guest.serveRequest.substitutedFrom ?? guest.serveRequest.productId, productId: serveAnswer.switchTo };
    guest.request = serveRequestText(guest.serveRequest);
    guest.wish = guest.request;
    state.message = `${guest.name} will have ${guest.request.replace(/, please\.$/, '')} instead.`;
  }
  for (const fact of reply.facts) if (!transcript.facts.some((known) => known.topic === fact.topic)) transcript.facts.push(fact);
  if (reply.bottleFacts) Object.assign(transcript.bottleFacts, reply.bottleFacts);
  if (reply.confirmed) {
    if (guest.orderKind === 'bottle' && guest.bottleRequest && reply.selectedBottleId) {
      const product = ALCOHOL_PRODUCTS.find((item) => item.id === reply.selectedBottleId);
      if (product && bottleMatchesRequest(product, guest.bottleRequest, marketFactor)) {
        if (!guest.orderRevealed) state.xp += 10;
        guest.selectedBottleId = product.id;
        guest.orderRevealed = true;
        state.message = `${guest.name} chose ${guest.bottleRequest.quantity} × ${product.name}. Complete the sealed-bottle sale.`;
      }
    } else if (guest.orderKind !== 'bottle') {
      if (!guest.orderRevealed) state.xp += 10;
      guest.orderRevealed = true;
      if (guest.signature) { guest.request = `I heard about your ${guest.signature.name}. One, please.`; guest.wish = guest.request; }
      state.message = `${guest.name} ordered: ${recipe?.name ?? guest.signature?.name ?? 'a drink'}. Time to mix!`;
    }
    if (!transcript.perfectRewardClaimed && transcript.attempts > 0 && transcript.correct === transcript.attempts) {
      const reward = conversationCrystalReward(guest, recipe);
      state.crystals += reward;
      transcript.perfectRewardClaimed = true;
      state.message += ` Perfect English: +${reward} crystals.${englishTalkReward(state, conversationDifficulty(guest, recipe), context.now)}`;
    }
  }
  if (reply.wrongGuess) {
    guest.patienceRemaining = Math.max(1, guest.patienceRemaining - 30);
    const refused = guest.orderKind === 'bottle' ? findBottleMention(heard)?.id : findRecipeMention(heard, RECIPES)?.id;
    if (refused && !(transcript.rejected ??= []).includes(refused)) transcript.rejected.push(refused);
  }
  // A drunk guest sounds drunk.
  // Answers that give a clue are not dressed up with local words: the learner must read them clearly.
  const clue = !!reply.facts.length || !!reply.bottleFacts || !!reply.wrongGuess || !!reply.confirmed || reply.expression === 'confused';
  addLine(transcript, 'customer', voice(guest, reply.text, turn, !clue));
  transcript.expression = reply.expression;
}
