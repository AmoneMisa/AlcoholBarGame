import { INGREDIENTS, MODIFIERS, RECIPES, REGIONS, SUPPLIERS } from '../domain/catalog';
import { ALCOHOL_PRODUCTS, bottleRestockCrystalCost, bottleSaleCrystalReward, bottleTotal, brandedServeCrystalReward } from '../domain/bottleCatalog';
import { arrivalSkipCrystalCost, calendarDate, coins, specialtyFactor, supplierInCity, consecutiveDays, conversationCrystalReward, conversationDifficulty, crystalExchange, dailyCoinsFor, dailyCrystalsFor, quotePurchase, recipePurchase } from '../domain/economy';
import { withArticle } from '../domain/english/articles';
import { BAR_PROFILE_OPTIONS, DEFAULT_BARS, INTERIORS, isEventInterior } from '../data/cosmetics/bars';
import { consumeMix, generateCustomer, judgeMix, requiredRecipe } from '../domain/engine';
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
import { LootError, orderDiscount, claimSpark, addWeeklyScore, claimLeaderboardReward, applySignatureGuest, designSignature, signatureFameFactor, signatureServed, applySpoilage, capacityOf, roomFor, earnLoyalty, regularPriceBonus, dailyLessonsBox, englishTalkReward, buyBox, claimAchievement, claimQuest, tasteFirst, track, buyConsumable, buyPrestigePerk, craftSkin, dailyStreakBox, dropAfterServe, drawStyle, grantLevelBoxes, lootBonuses, openBox, pickChoice, prestige, promoteEquipment, upgradeEquipment, useConsumable, xpGain } from './loot';
import { usableIngredientIds } from '../domain/usableStock';
import { acceptDeal, haggle, makeOffer, startNegotiation, TradeError } from './trade';
import { addSpareCopy, RECIPE_MAX_LEVEL, recipeBonus, recipeCardsRequired, recipeCopies, recipeLevel, upgradeCost } from './recipes';
import { DELIVERY_DAY_MS, levelFor, normalizePlayerState, wishFor, withUniqueLook, type PlayerState, type Transcript, type UnlockSource } from './state';

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
  | { type: 'buyBottleStock'; productId: string; quantity?: number }
  | { type: 'expediteCustomer' }
  | { type: 'switchBar'; regionId: RegionId }
  | { type: 'chooseStartingBar'; regionId: RegionId }
  | { type: 'buyBar'; regionId: RegionId }
  | { type: 'renameBar'; name: string }
  | { type: 'renameBartender'; name: string }
  | { type: 'setDecor'; key: string; value: string }
  | { type: 'spinCosmeticRoulette' }
  | { type: 'giftCosmetic'; cosmeticId: string; recipient: string }
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
  | { type: 'upgradeEquipment'; item: string }
  | { type: 'promoteEquipment'; item: string }
  | { type: 'openBox'; box: string }
  | { type: 'pickReward'; index: number }
  | { type: 'buyBox'; box: string; quantity?: number }
  | { type: 'buyConsumable'; id: string; quantity?: number }
  | { type: 'useConsumable'; id: string; recipeId?: string }
  | { type: 'drawStyle'; count: 1 | 10; banner?: 'standard' | 'seasonal' }
  | { type: 'claimSpark'; cosmeticId: string }
  | { type: 'craftSkin'; cosmeticId: string }
  | { type: 'prestige' }
  | { type: 'designSignature'; name: string; items: { ingredientId: string; amount: number }[]; needsShake: boolean }
  | { type: 'claimLeaderboardReward' }
  | { type: 'claimQuest'; questId: string }
  | { type: 'claimAchievement'; id: string }
  | { type: 'buyPrestigePerk'; perk: string };

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
// Tips are a chance: the level sets the base rate, VIP and wealthy guests are more generous.
function rollTip(state: PlayerState, guest: Customer, now: number, random: () => number) {
  const bonus = guest.mood === 'vip' || guest.mood === 'wealthy' ? .2 : 0;
  const loot = lootBonuses(state, now);
  return loot.alwaysTips || random() < Math.min(.95, economyOf(state, now).tipChance + bonus + loot.tipChance);
}
// Delivery time in days after the level's delivery perk.
const deliveryDaysFor = (state: PlayerState, supplier: Supplier, now: number) => supplier.deliveryDays * economyOf(state, now).delivery * lootBonuses(state, now).deliveryFactor;

// Auto-supply (level 5+): anything running low is reordered, one pack from the cheapest supplier that sells it,
// paying normal prices and delivery fees. Nothing is ordered twice while a delivery for it is on the way.
const LOW_STOCK = { ml: 150, piece: 4 } as const;
function autoRestock(state: PlayerState, now: number) {
  if (!state.autoSupply || levelFor(state.xp) < AUTO_SUPPLY_LEVEL) return;
  const region = REGIONS.find((item) => item.id === state.regionId)!;
  const pending = new Set(state.deliveryOrders.filter((order) => order.barId === state.regionId).flatMap((order) => order.items.map((item) => item.ingredientId)));
  const usable = usableIngredientIds(state.knownRecipeIds);
  const low = inventoryOf(state).filter((stock) => {
    if (!usable.has(stock.ingredientId)) return false;
    const ingredient = INGREDIENTS.find((item) => item.id === stock.ingredientId);
    return ingredient && !pending.has(stock.ingredientId) && stock.amount < (ingredient.unit === 'ml' ? LOW_STOCK.ml : LOW_STOCK.piece);
  });
  if (!low.length) return;
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
    if (state.money < quote.total) { state.message = `Auto-supply paused: ${quote.total.toFixed(2)} coins needed for ${supplier.name}.`; continue; }
    state.money = coins(state.money - quote.total);
    const days = deliveryDaysFor(state, supplier, now);
    state.deliveryOrders.push({ id: crypto.randomUUID(), supplier: supplier.name, barId: state.regionId, dueAt: now + Math.round(days * DELIVERY_DAY_MS),
      items: quote.lines.map((line) => ({ ingredientId: line.ingredientId, amount: line.amount })), total: quote.total });
    log(state, `Auto-supply ordered ${quote.lines.map((line) => INGREDIENTS.find((item) => item.id === line.ingredientId)?.name).join(', ')} from ${supplier.name} for ${quote.total.toFixed(2)} coins.`);
  }
}

// What this guest pays relative to catalog prices (fixed when they walked in, so budgets always match).
const priceFactorOf = (guest: Customer | undefined, marketFactor: number) => guest?.priceFactor ?? marketFactor;

// Higher levels bring guests sooner; city events (Hot Time, storms...) speed them up or slow them down.
function nextArrival(state: PlayerState, now: number, random: () => number) {
  if (state.popularityBoost?.kind === 'no-cooldown' && state.popularityBoost.until > now) return now + 1000;
  return now + Math.round((nextCustomerArrival(now, random) - now) * economyOf(state, now).arrival * lootBonuses(state, now).arrivalFactor);
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
  const priceFactor = economy.guestPriceFactor;
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
  return priced(withUniqueLook(generateCustomer(level, knownRecipes(state), .35, priceFactor), []));
}

function welcomeNextCustomer(state: PlayerState, now: number, random: () => number) {
  const arrival = makeArrivingCustomer(state, now, random);
  // The sound system keeps guests happy for longer.
  const patienceFactor = lootBonuses(state, now).patienceFactor;
  applySignatureGuest(state, arrival, random);
  arrival.patience = Math.round(arrival.patience * patienceFactor);
  arrival.patienceRemaining = Math.round(arrival.patienceRemaining * patienceFactor);
  state.customers = [arrival];
  state.activeCustomerId = arrival.id;
  state.nextCustomerAt = 0;
  state.lastClockAt = now;
  state.message = arrival.specialRecipeRewardId ? `VIP guest ${arrival.name} arrived with a recipe challenge.`
    : `${arrival.mood === 'vip' ? 'VIP guest' : 'A new customer'} ${arrival.name} arrived.`;
}

// The current guest leaves (served, declined or out of time). Guests still seated keep waiting and the next
// one in the row is served; only an empty bar schedules the next arrival.
function scheduleNextCustomer(state: PlayerState, now: number, random: () => number) {
  const leaving = currentCustomer(state);
  if (leaving) {
    delete state.rewardedSentences[leaving.id];
    delete state.conversations[leaving.id];
  }
  // Removed in place: on the client these rules run on reactive state, and re-assigning a filtered copy
  // would store reactive proxies that structuredClone cannot save.
  const seat = leaving ? state.customers.indexOf(leaving) : -1;
  if (seat >= 0) state.customers.splice(seat, 1);
  state.activeCustomerId = state.customers[0]?.id ?? '';
  state.nextCustomerAt = state.customers.length ? 0 : nextArrival(state, now, random);
  state.lastClockAt = now;
  state.conversationCustomerId = undefined;
}

function processDeliveries(state: PlayerState, now: number) {
  const arrived = state.deliveryOrders.filter((order) => order.dueAt <= now);
  for (const order of arrived) for (const item of order.items) {
    const stock = state.inventories[order.barId].find((entry) => entry.ingredientId === item.ingredientId);
    // The storeroom is full at its capacity: anything beyond it is lost on arrival.
    if (stock) stock.amount = Math.min(Math.max(stock.amount, capacityOf(state, order.barId, item.ingredientId)), stock.amount + item.amount);
  }
  if (arrived.length) {
    state.deliveryOrders = state.deliveryOrders.filter((order) => order.dueAt > now);
    log(state, `${arrived.length} supplier ${arrived.length === 1 ? 'delivery has' : 'deliveries have'} arrived.`);
  }
}

// Time passes on the server clock only: deliveries arrive, patience runs down, the next guest walks in.
export function advanceClock(state: PlayerState, context: Pick<RuleContext, 'now' | 'random' | 'spawnCustomers'>) {
  normalizePlayerState(state);
  state.conversations ??= {};
  const now = context.now;
  const random = context.random ?? Math.random;
  if (state.popularityBoost?.kind === 'no-cooldown' && state.popularityBoost.until <= now) state.popularityBoost = undefined;
  processDeliveries(state, now);
  applySpoilage(state, now);
  autoRestock(state, now);
  if (!state.customers.length) {
    state.lastClockAt = now;
    if (context.spawnCustomers !== false && state.nextCustomerAt && now >= state.nextCustomerAt) welcomeNextCustomer(state, now, random);
    else if (!state.nextCustomerAt) state.nextCustomerAt = nextArrival(state, now, random);
    return;
  }
  // Whole seconds only; the remainder carries over to the next tick.
  const elapsed = Math.max(0, Math.floor((now - state.lastClockAt) / 1000));
  state.lastClockAt = elapsed > 0 ? state.lastClockAt + elapsed * 1000 : Math.min(state.lastClockAt, now);
  // Reading and writing in the customer dialogue is learning time, so the order clock pauses.
  if (state.conversationCustomerId) return;
  const guest = currentCustomer(state)!;
  guest.patienceRemaining = Math.max(0, guest.patienceRemaining - elapsed);
  if (guest.patienceRemaining <= 0) {
    const name = guest.name;
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
      const request = guest?.bottleRequest;
      const product = ALCOHOL_PRODUCTS.find((item) => item.id === guest?.selectedBottleId);
      if (!guest || guest.orderKind !== 'bottle' || !guest.orderRevealed || !request || !product) throw new RuleError('Confirm the customer’s bottle choice first.');
      const stock = bottleStock(state, product.id);
      if (!stock || stock.quantity < request.quantity) throw new RuleError(`Only ${stock?.quantity ?? 0} bottles of ${product.name} are in this bar.`);
      const revenue = bottleTotal(product, request.quantity, priceFactorOf(guest, region.marketFactor));
      if (revenue > request.budget) throw new RuleError(`The ${revenue} coin total is over the customer’s ${request.budget} coin budget.`);
      stock.quantity -= request.quantity;
      const tip = rollTip(state, guest, now, random) ? Math.ceil(revenue * (guest.mood === 'vip' || guest.mood === 'wealthy' ? .08 : .03) * economyOf(state, now).tips) : 0;
      state.money = coins(state.money + revenue + tip);
      const crystalPayment = bottleSaleCrystalReward(product, request.quantity);
      state.crystals += crystalPayment;
      state.xp += xpGain(state, 110 + Math.min(state.streak * 2, 14), now);
      state.streak += 1;
      track(state, 'bottles', request.quantity, now);
      const note = `Sold ${request.quantity} × ${product.name} for ${revenue.toFixed(2)} coins and ${crystalPayment} crystals.${tip ? ` Tip +${tip}.` : ' No tip this time.'}`;
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
      if (guest.signature && !guest.orderRevealed) throw new RuleError('Talk to the guest first: ask about your house special.');
      if (guest.orderKind === 'bottle') throw new RuleError('This customer wants sealed bottles. Complete the sale in the conversation.');
      const mix = Array.isArray(action.mix) ? action.mix.filter((item) => INGREDIENTS.some((ingredient) => ingredient.id === item?.ingredientId))
        .map((item) => ({ ingredientId: item.ingredientId, amount: cleanAmount(item.amount, 1000) })).filter((item) => item.amount > 0) : [];
      if (!mix.length) throw new RuleError('Build the drink first.');
      // The glass can only contain what the bar actually has.
      for (const item of mix) {
        const stock = inventoryOf(state).find((entry) => entry.ingredientId === item.ingredientId);
        if (!stock || stock.amount < item.amount) throw new RuleError(`Not enough ${INGREDIENTS.find((entry) => entry.id === item.ingredientId)!.name} in stock.`);
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
      const verdict = judgeMix(mix, guest, action.shaken === true);
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
        state.money = coins(state.money + revenue + tip);
        // About 170 successful orders reach level 25 and about 700 reach the level 50 cap.
        state.xp += xpGain(state, 100 + Math.min(state.streak * 2, 14), now);
        state.streak += 1;
        // Hands-on play earns the Workshop rewards; Auto-serve is paid and gives XP, but no drops, quest progress or loyalty.
        let found = '';
        if (!auto) {
          track(state, 'serves', 1, now);
          track(state, 'servesCoins', Math.floor(revenue + tip), now);
          if (guest.mood === 'vip' || guest.specialRecipeRewardId) track(state, 'vips', 1, now);
          found = dropAfterServe(state, guest.mood === 'vip', !!guest.specialRecipeRewardId, random);
          if (guest.signature) found += signatureServed(state, now);
          if (guest.orderKind !== 'serve' && !guest.signature) found += tasteFirst(state, verdict.recipe.id, 'recipe', now);
          if (guest.orderKind !== 'serve') found += earnLoyalty(state, guest.characterId, guest.name, verdict.recipe.id, guest.mood === 'vip');
          for (const productId of Object.values(pourBrands)) found += tasteFirst(state, productId, 'brand', now);
        }
        const serveProduct = serve ? ALCOHOL_PRODUCTS.find((item) => item.id === serve.productId) : undefined;
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
          : !tip ? `Perfect service. No tip this time.${crystalNote}`
          : bonus ? `Perfect service — classic touch with ${bonus}! Tip +${tip} coins.${crystalNote}` : `Perfect service. Tip +${tip} coins.${crystalNote}`;
        scheduleNextCustomer(state, now, random);
        state.message = note + found;
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
      state.money = coins(state.money - quote.total);
      const days = deliveryDaysFor(state, supplier, now);
      state.deliveryOrders.push({ id: crypto.randomUUID(), supplier: supplier.name, barId: state.regionId, dueAt: now + Math.round(days * DELIVERY_DAY_MS),
        items: quote.lines.map((line) => ({ ingredientId: line.ingredientId, amount: line.amount })), total: quote.total });
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
      state.message = `${interior.name} purchased and applied to ${state.bars[state.regionId].name}.`;
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
      if (!canUseCosmetic(state.ownedCosmeticIds, action.key, action.value, state.bars[state.regionId].bartenderCharacter)) throw new RuleError('Unlock this style in the daily roulette first.');
      (state.bars[state.regionId] as unknown as Record<string, string>)[action.key] = action.value;
      break;
    }
    case 'spinCosmeticRoulette': {
      const today = calendarDate(new Date(now));
      if (state.cosmeticRouletteKey === today) throw new RuleError('Today’s style draw is already claimed.');
      const locked = COSMETICS.filter((entry) => !state.ownedCosmeticIds.includes(entry.id));
      const pool = locked.length ? locked : COSMETICS;
      const reward = pool[Math.min(pool.length - 1, Math.floor(random() * pool.length))]!;
      state.cosmeticRouletteKey = today;
      if (state.ownedCosmeticIds.includes(reward.id)) state.cosmeticCopies[reward.id] = (state.cosmeticCopies[reward.id] ?? 0) + 1;
      else state.ownedCosmeticIds.push(reward.id);
      state.cosmeticRouletteResult = `${reward.label} ${reward.character ? `for ${reward.character === 'noa' ? 'woman' : 'man'}` : ''} unlocked${state.cosmeticCopies[reward.id] ? ' as a giftable duplicate' : ''}.`;
      state.message = state.cosmeticRouletteResult;
      break;
    }
    case 'giftCosmetic': {
      const reward = COSMETICS.find((entry) => entry.id === action.cosmeticId);
      const recipient = cleanText(action.recipient, 32);
      if (!reward) throw new RuleError('Unknown cosmetic item.');
      if (!recipient) throw new RuleError('Enter your friend’s code or nickname.');
      if ((state.cosmeticCopies[reward.id] ?? 0) < 1) throw new RuleError('Only duplicate cosmetic items can be gifted.');
      state.cosmeticCopies[reward.id] = (state.cosmeticCopies[reward.id] ?? 0) - 1;
      state.cosmeticGiftLog.unshift({ cosmeticId:reward.id,recipient,at:now });
      state.cosmeticGiftLog = state.cosmeticGiftLog.slice(0,30);
      state.message = `${reward.label} sent to ${recipient}.`;
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
    case 'prestige':
    case 'designSignature':
    case 'claimLeaderboardReward':
    case 'claimQuest':
    case 'claimAchievement':
    case 'buyPrestigePerk': {
      try {
        switch (action.type) {
          case 'upgradeEquipment': upgradeEquipment(state, action.item, now); break;
          case 'promoteEquipment': promoteEquipment(state, action.item); break;
          case 'openBox': openBox(state, action.box, random, now); break;
          case 'pickReward': pickChoice(state, action.index, random); break;
          case 'buyBox': buyBox(state, action.box, action.quantity); break;
          case 'buyConsumable': buyConsumable(state, action.id, action.quantity); break;
          case 'useConsumable': useConsumable(state, action.id, action.recipeId, now); break;
          case 'drawStyle': drawStyle(state, action.count, action.banner, now, random); break;
          case 'claimSpark': claimSpark(state, action.cosmeticId, now); break;
          case 'craftSkin': craftSkin(state, action.cosmeticId); break;
          case 'prestige': prestige(state, now); break;
          case 'designSignature': designSignature(state, { name: action.name, items: action.items, needsShake: action.needsShake }); break;
          case 'claimLeaderboardReward': claimLeaderboardReward(state, context.leaderboard, now); break;
          case 'claimQuest': claimQuest(state, action.questId, now); break;
          case 'claimAchievement': claimAchievement(state, action.id); break;
          case 'buyPrestigePerk': buyPrestigePerk(state, action.perk); break;
        }
      } catch (error) {
        if (error instanceof LootError) throw new RuleError(error.message);
        throw error;
      }
      break;
    }

    default: throw new RuleError('Unknown action.');
  }

  // Coins earned by serving and selling bottles decide the stars of the next Grand Opening.
  if (['serve', 'autoServe', 'sellBottle'].includes(action.type) && state.money > moneyBefore) state.loot.runEarned += Math.floor(state.money - moneyBefore);
  grantLevelBoxes(state);
  // Auto-serve XP does not count for the leaderboard: the ranking rewards hands-on service.
  addWeeklyScore(state, action.type === 'prestige' || (action.type === 'serve' && action.auto) ? 0 : state.xp - xpBefore, now);
  if (!Number.isFinite(state.money) || state.money < 0) throw new RuleError('Not enough money.');
  if (!Number.isFinite(state.crystals) || state.crystals < 0) throw new RuleError('Not enough crystals.');
  return { moneyDelta: coins(state.money - moneyBefore), crystalDelta: state.crystals - crystalsBefore, audit: auditEntry(state, action),
    weekly: { week: state.loot.weekly.week, score: state.loot.weekly.score, label: state.bars[state.regionId].name, level: levelFor(state.xp) } };
}

// Loot actions leave a trail (what was rolled, pity, prestige) for the server's loot ledger.
const AUDITED = new Set<GameAction['type']>(['openBox', 'pickReward', 'buyBox', 'buyConsumable', 'drawStyle', 'claimSpark', 'craftSkin', 'prestige', 'buyPrestigePerk', 'claimLeaderboardReward', 'claimQuest', 'claimAchievement']);
export interface LootAudit { action: string; message: string; detail: Record<string, unknown>; }
function auditEntry(state: PlayerState, action: GameAction): LootAudit | undefined {
  if (!AUDITED.has(action.type)) return undefined;
  const detail: Record<string, unknown> = {};
  if (action.type === 'drawStyle') Object.assign(detail, { banner: (action as { banner?: string }).banner ?? 'standard', results: state.loot.lastDraw, pity: state.loot.pity, season: state.loot.season });
  else if (action.type === 'prestige') Object.assign(detail, { prestige: state.loot.prestige });
  else if (action.type === 'openBox' && state.loot.pendingChoice) Object.assign(detail, { offered: state.loot.pendingChoice });
  return { action: action.type, message: state.message, detail };
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

function ensureTranscript(state: PlayerState, guest: Customer): Transcript {
  state.conversations ??= {};
  const existing = state.conversations[guest.id];
  if (existing) return existing;
  const recipe = RECIPES.find((item) => item.id === guest.orderRecipeId);
  const opening = guest.orderKind === 'bottle' ? bottleOpeningLine(guest)
    : guest.orderKind === 'serve' || !recipe ? `${guest.greeting} ${guest.request}`
      : openingLine(guest, buildProfile(recipe));
  // A bottle customer names the occasion in the opening line, so it is already known and never asked again.
  const bottleFacts: Transcript['bottleFacts'] = guest.orderKind === 'bottle' ? { occasion: guest.bottleRequest?.occasion ?? 'party' } : {};
  const transcript: Transcript = { lines: [], facts: [], bottleFacts, expression: 'thinking', attempts: 0, correct: 0 };
  addLine(transcript, 'customer', opening);
  state.conversations[guest.id] = transcript;
  return transcript;
}

function say(state: PlayerState, guest: Customer, text: string, context: RuleContext, marketFactor: number) {
  const transcript = ensureTranscript(state, guest);
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

  // The guest answers what they understood: the corrected sentence.
  const heard = english.corrected;
  const onShelf = (id: string) => (bottleStock(state, id)?.quantity ?? 0) > 0;
  const recipe = RECIPES.find((item) => item.id === guest.orderRecipeId);
  const profile = guest.orderKind === 'cocktail' && recipe ? buildProfile(recipe) : undefined;
  const serveAnswer = guest.orderKind === 'serve' ? replyToServe(heard, guest, onShelf) : undefined;
  const namesOrder = !!findRecipeMention(heard, RECIPES) || !!findBottleMention(heard);
  // The bartender has to bring up the house special (by name, or as "the house special") before the guest confirms.
  const signatureAnswer: CustomerReply | undefined = guest.signature && !guest.orderRevealed && (namesSignature || /\b(house special|signature)\b/i.test(heard))
    ? { text: `Yes! ${guest.signature.name} is exactly what I came for. Thank you!`, expression: 'very-happy', facts: [], confirmed: true } : undefined;
  const service = signatureAnswer || serveAnswer || (namesOrder && guest.orderKind !== 'serve') ? undefined
    : serviceReply(heard, { customer: guest, kind: guest.orderKind === 'bottle' ? 'bottle' : 'drink', confirmed: !!guest.orderRevealed, wish: profile ? shortWish(profile) : undefined });
  const reply: CustomerReply & { bottleFacts?: Transcript['bottleFacts']; selectedBottleId?: string } =
    signatureAnswer
    ?? (serveAnswer ? { text: serveAnswer.text, expression: serveAnswer.expression, facts: [] } : undefined)
    ?? service
    ?? (guest.signature ? (guest.orderRevealed ? { text: `Just your ${guest.signature.name}, please.`, expression: 'smile' as const, facts: [] }
      : { text: 'I heard this bar has a wonderful house special. Do you know which one I mean?', expression: 'thinking' as const, facts: [] })
    : guest.orderKind === 'serve' && guest.serveRequest ? { text: `Just ${serveName(guest.serveRequest)}, please.`, expression: 'smile', facts: [] }
      : guest.orderKind === 'bottle' ? replyToBottle(heard, guest, transcript.bottleFacts, marketFactor)
        : profile ? replyTo(heard, guest, profile, RECIPES, transcript.facts, MODIFIERS.find((item) => item.id === guest.modifierId)?.label)
          : { text: 'Sorry, I don’t understand.', expression: 'confused', facts: [] });

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
  if (reply.wrongGuess) guest.patienceRemaining = Math.max(1, guest.patienceRemaining - 30);
  addLine(transcript, 'customer', reply.text);
  transcript.expression = reply.expression;
}
