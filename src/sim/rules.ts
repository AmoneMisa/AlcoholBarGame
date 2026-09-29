import { INGREDIENTS, MODIFIERS, RECIPES, REGIONS, SUPPLIERS } from '../domain/catalog';
import { ALCOHOL_PRODUCTS, bottleRestockCrystalCost, bottleSaleCrystalReward, bottleTotal, brandedServeCrystalReward } from '../domain/bottleCatalog';
import { arrivalSkipCrystalCost, calendarDate, coins, consecutiveDays, conversationCrystalReward, crystalExchange, dailyCoinsFor, dailyCrystalsFor, quotePurchase, recipePurchase } from '../domain/economy';
import { withArticle } from '../domain/english/articles';
import { BAR_PROFILE_OPTIONS, INTERIORS } from '../data/cosmetics/bars';
import { consumeMix, generateCustomer, judgeMix, requiredRecipe } from '../domain/engine';
import type { Customer, InventoryItem, Recipe, RegionId } from '../domain/types';
import { pourableBrand, replyToServe, serveName, serveRequestText, substitutesFor } from '../domain/brandServe';
import { signatureBonus } from '../domain/brandPours';
import { bottleMatchesRequest, bottleOpeningLine, findBottleMention, replyToBottle } from '../domain/conversation/bottleTalk';
import { buildProfile, findRecipeMention, openingLine, replyTo, shortWish, type CustomerReply } from '../domain/conversation/customerTalk';
import { serviceReply } from '../domain/conversation/serviceTalk';
import { canWelcomeVip, nextCustomerArrival, nextVipAvailability, orderTimeSeconds, vipCarriesRecipe } from '../domain/customerTiming';
import { economyAt, marketFor } from '../domain/progression';
import { DELIVERY_DAY_MS, levelFor, normalizePlayerState, wishFor, withUniqueLook, type PlayerState, type Transcript, type UnlockSource } from './state';

// Game rules as pure state transitions. The server runs these for every request, so the client can only
// ask for an action — it can never set coins, stock, XP or timers itself. Every payload is treated as untrusted.

export type GameAction =
  | { type: 'tick' }
  | { type: 'serve'; mix: InventoryItem[]; shaken: boolean; pourBrands: Record<string, string> }
  | { type: 'buy'; supplierId: string; cart: Record<string, number> }
  | { type: 'sell'; cart: Record<string, number> }
  | { type: 'transfer'; ingredientId: string; targetId: RegionId; amount?: number }
  | { type: 'claimDaily' }
  | { type: 'exchangeCrystals'; crystals: number }
  | { type: 'buyRecipe'; recipeId: string }
  | { type: 'buyInterior'; interiorId: string }
  | { type: 'buyBottleStock'; productId: string; quantity?: number }
  | { type: 'expediteCustomer' }
  | { type: 'switchBar'; regionId: RegionId }
  | { type: 'renameBar'; name: string }
  | { type: 'renameBartender'; name: string }
  | { type: 'setDecor'; key: string; value: string }
  | { type: 'selectCustomer'; customerId: string }
  | { type: 'openConversation'; customerId: string }
  | { type: 'closeConversation' }
  // The player says one sentence to the guest; the server checks the English and decides the guest's answer.
  | { type: 'say'; text: string }
  | { type: 'sellBottle' }
  | { type: 'offerSimilar'; customerId: string }
  | { type: 'rejectCustomer'; customerId: string };

export class RuleError extends Error {}

export interface RuleContext {
  now: number;
  random?: () => number;
  // Grammar check (the server runs its own copy): correctness decides XP; the corrected text is what the guest “hears”.
  checkEnglish: (text: string) => { ok: boolean; corrected: string; note?: string };
  // Offline practice spawns guests locally; online clients wait for the server's guest.
  spawnCustomers?: boolean;
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
  if (state.knownRecipeIds.includes(recipeId)) return false;
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
// What this guest pays relative to catalog prices (fixed when they walked in, so budgets always match).
const priceFactorOf = (guest: Customer | undefined, marketFactor: number) => guest?.priceFactor ?? marketFactor;

// Higher levels bring guests sooner; city events (Hot Time, storms...) speed them up or slow them down.
function nextArrival(state: PlayerState, now: number, random: () => number) {
  return now + Math.round((nextCustomerArrival(now, random) - now) * economyOf(state, now).arrival);
}

function makeArrivingCustomer(state: PlayerState, now: number, random: () => number) {
  const level = levelFor(state.xp);
  const economy = economyOf(state, now);
  const priceFactor = economy.guestPriceFactor;
  const priced = (customer: Customer) => { customer.priceFactor = priceFactor; return customer; };
  if (canWelcomeVip(now, state.vipCooldownUntil, random, economy.vipChance)) {
    state.vipCooldownUntil = now + Math.round((nextVipAvailability(now, random) - now) * economy.vipCooldown);
    const locked = lockedRecipes(state);
    if (vipCarriesRecipe(locked.length > 0, random)) return priced(withUniqueLook(makeSpecialCustomer(locked[Math.floor(random() * locked.length)]!, level), []));
    const vip = withUniqueLook(generateCustomer(level, knownRecipes(state), .35, priceFactor), []);
    vip.mood = 'vip';
    vip.greeting = 'Good evening. I was told this bar is exceptional.';
    vip.patience = orderTimeSeconds('vip', vip.orderKind);
    vip.patienceRemaining = vip.patience;
    return priced(vip);
  }
  return priced(withUniqueLook(generateCustomer(level, knownRecipes(state), .35, priceFactor), []));
}

function welcomeNextCustomer(state: PlayerState, now: number, random: () => number) {
  const arrival = makeArrivingCustomer(state, now, random);
  state.customers = [arrival];
  state.activeCustomerId = arrival.id;
  state.nextCustomerAt = 0;
  state.lastClockAt = now;
  state.message = arrival.specialRecipeRewardId ? `VIP guest ${arrival.name} arrived with a recipe challenge.`
    : `${arrival.mood === 'vip' ? 'VIP guest' : 'A new customer'} ${arrival.name} arrived.`;
}

function scheduleNextCustomer(state: PlayerState, now: number, random: () => number) {
  if (state.customers[0]) {
    delete state.rewardedSentences[state.customers[0].id];
    delete state.conversations[state.customers[0].id];
  }
  state.customers = [];
  state.activeCustomerId = '';
  state.nextCustomerAt = nextArrival(state, now, random);
  state.lastClockAt = now;
  state.conversationCustomerId = undefined;
}

function processDeliveries(state: PlayerState, now: number) {
  const arrived = state.deliveryOrders.filter((order) => order.dueAt <= now);
  for (const order of arrived) for (const item of order.items) {
    const stock = state.inventories[order.barId].find((entry) => entry.ingredientId === item.ingredientId);
    if (stock) stock.amount += item.amount;
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
  processDeliveries(state, now);
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

    case 'sellBottle': {
      const request = guest?.bottleRequest;
      const product = ALCOHOL_PRODUCTS.find((item) => item.id === guest?.selectedBottleId);
      if (!guest || guest.orderKind !== 'bottle' || !guest.orderRevealed || !request || !product) throw new RuleError('Confirm the customer’s bottle choice first.');
      const stock = bottleStock(state, product.id);
      if (!stock || stock.quantity < request.quantity) throw new RuleError(`Only ${stock?.quantity ?? 0} bottles of ${product.name} are in this bar.`);
      const revenue = bottleTotal(product, request.quantity, priceFactorOf(guest, region.marketFactor));
      if (revenue > request.budget) throw new RuleError(`The ${revenue} coin total is over the customer’s ${request.budget} coin budget.`);
      stock.quantity -= request.quantity;
      const tip = Math.ceil(revenue * (guest.mood === 'vip' || guest.mood === 'wealthy' ? .1 : .04) * economyOf(state, now).tips);
      state.money = coins(state.money + revenue + tip);
      const crystalPayment = bottleSaleCrystalReward(product, request.quantity);
      state.crystals += crystalPayment;
      state.xp += 28 + Math.min(state.streak * 2, 14);
      state.streak += 1;
      const note = `Sold ${request.quantity} × ${product.name} for ${revenue.toFixed(2)} coins and ${crystalPayment} crystals. Tip +${tip}.`;
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
      if (!guest) throw new RuleError('There is no order to serve.');
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
      state.inventories[state.regionId] = consumeMix(inventoryOf(state), mix);
      const verdict = judgeMix(mix, guest, action.shaken === true);
      if (verdict.success) {
        const revenue = coins(verdict.recipe.price * priceFactorOf(guest, region.marketFactor));
        const bonus = guest.orderKind === 'serve' ? undefined : signatureBonus(verdict.recipe.id, pourBrands);
        const tip = Math.ceil(revenue * (guest.mood === 'vip' || guest.mood === 'wealthy' ? .25 : .12) * economyOf(state, now).tips) + (bonus ? 2 : 0);
        state.money = coins(state.money + revenue + tip);
        state.xp += 22 + Math.min(state.streak * 2, 14);
        state.streak += 1;
        const serveProduct = serve ? ALCOHOL_PRODUCTS.find((item) => item.id === serve.productId) : undefined;
        const brandedPayment = serveProduct ? brandedServeCrystalReward(serveProduct) : 0;
        const specialPayment = guest.specialRecipeRewardId || guest.mood === 'vip' ? conversationCrystalReward(guest, verdict.recipe) : 0;
        const crystalPayment = brandedPayment + specialPayment;
        state.crystals += crystalPayment;
        const unlocked = guest.specialRecipeRewardId ? unlockRecipe(state, guest.specialRecipeRewardId, 'special-client') : false;
        const crystalNote = crystalPayment ? ` +${crystalPayment} crystals.` : '';
        const note = unlocked ? `Perfect service. ${verdict.recipe.name} was added to your recipe book!${crystalNote}`
          : bonus ? `Perfect service — classic touch with ${bonus}! Tip +${tip} coins.${crystalNote}` : `Perfect service. Tip +${tip} coins.${crystalNote}`;
        scheduleNextCustomer(state, now, random);
        state.message = note;
      } else {
        state.streak = 0;
        guest.patienceRemaining = Math.max(0, guest.patienceRemaining - 60);
        state.message = verdict.shakeOk ? 'Wrong drink. Check the ingredients.' : 'This recipe needs shaking.';
      }
      break;
    }

    case 'buy': {
      const supplier = SUPPLIERS.find((item) => item.id === action.supplierId);
      if (!supplier) throw new RuleError('Unknown supplier.');
      // Prices come from the server's own market for this bar, day, level and city event, never from the client.
      const quote = quotePurchase(marketFor(region, now, state.xp), cleanCart(action.cart, 99), supplier);
      if (!quote.lines.length) throw new RuleError('Add packs to your order first.');
      if (state.money < quote.total) throw new RuleError('You do not have enough money.');
      state.money = coins(state.money - quote.total);
      state.deliveryOrders.push({ id: crypto.randomUUID(), supplier: supplier.name, barId: state.regionId, dueAt: now + supplier.deliveryDays * DELIVERY_DAY_MS,
        items: quote.lines.map((line) => ({ ingredientId: line.ingredientId, amount: line.amount })), total: quote.total });
      log(state, `Ordered ${quote.packs} packs from ${supplier.name} for ${quote.total.toFixed(2)} coins. Delivery in ${supplier.deliveryDays} days.`);
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
      if (locked.length && random() < .12) {
        const recipe = locked[Math.floor(random() * locked.length)]!;
        unlockRecipe(state, recipe.id, 'daily-gift');
        state.dailyGiftResult = `Day ${state.loginStreak}: +${reward} coins${crystalReward ? `, +${crystalReward} crystals` : ''} and a lucky ${recipe.name} recipe!`;
      } else {
        state.dailyGiftResult = `Day ${state.loginStreak}: +${reward} coins${crystalReward ? ` and +${crystalReward} crystals` : ''}. Come back tomorrow to grow your streak.`;
      }
      state.message = state.dailyGiftResult;
      break;
    }
    case 'buyRecipe': {
      const recipe = RECIPES.find((item) => item.id === action.recipeId);
      if (!recipe || state.knownRecipeIds.includes(recipe.id)) throw new RuleError('This recipe is not for sale.');
      const price = recipePurchase(recipe, RECIPES.indexOf(recipe));
      if (price.currency === 'crystals') {
        if (state.crystals < price.amount) throw new RuleError(`You need ${price.amount} crystals to buy this recipe.`);
        state.crystals -= price.amount;
      } else {
        if (state.money < price.amount) throw new RuleError(`You need ${price.amount} coins to buy this recipe.`);
        state.money = coins(state.money - price.amount);
      }
      unlockRecipe(state, recipe.id, 'shop');
      state.message = `${recipe.name} added to your recipe book.`;
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
      const cost = unitCost * quantity;
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
      state.regionId = action.regionId;
      state.message = `Now managing the ${REGIONS.find((item) => item.id === action.regionId)!.name} bar.`;
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
      (state.bars[state.regionId] as unknown as Record<string, string>)[action.key] = action.value;
      break;
    }

    default: throw new RuleError('Unknown action.');
  }

  if (!Number.isFinite(state.money) || state.money < 0) throw new RuleError('Not enough money.');
  if (!Number.isFinite(state.crystals) || state.crystals < 0) throw new RuleError('Not enough crystals.');
  return { moneyDelta: coins(state.money - moneyBefore), crystalDelta: state.crystals - crystalsBefore };
}

function offerSimilar(state: PlayerState, target: Customer, marketFactor: number) {
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
  const transcript: Transcript = { lines: [], facts: [], bottleFacts: {}, expression: 'thinking', attempts: 0, correct: 0 };
  addLine(transcript, 'customer', opening);
  state.conversations[guest.id] = transcript;
  return transcript;
}

function say(state: PlayerState, guest: Customer, text: string, context: RuleContext, marketFactor: number) {
  const transcript = ensureTranscript(state, guest);
  const english = context.checkEnglish(text);
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
  const service = serveAnswer || (namesOrder && guest.orderKind !== 'serve') ? undefined
    : serviceReply(heard, { customer: guest, kind: guest.orderKind === 'bottle' ? 'bottle' : 'drink', confirmed: !!guest.orderRevealed, wish: profile ? shortWish(profile) : undefined });
  const reply: CustomerReply & { bottleFacts?: Transcript['bottleFacts']; selectedBottleId?: string } =
    (serveAnswer ? { text: serveAnswer.text, expression: serveAnswer.expression, facts: [] } : undefined)
    ?? service
    ?? (guest.orderKind === 'serve' && guest.serveRequest ? { text: `Just ${serveName(guest.serveRequest)}, please.`, expression: 'smile', facts: [] }
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
      state.message = `${guest.name} ordered: ${recipe?.name ?? 'a drink'}. Time to mix!`;
    }
    if (!transcript.perfectRewardClaimed && transcript.attempts > 0 && transcript.correct === transcript.attempts) {
      const reward = conversationCrystalReward(guest, recipe);
      state.crystals += reward;
      transcript.perfectRewardClaimed = true;
      state.message += ` Perfect English: +${reward} crystals.`;
    }
  }
  if (reply.wrongGuess) guest.patienceRemaining = Math.max(1, guest.patienceRemaining - 30);
  addLine(transcript, 'customer', reply.text);
  transcript.expression = reply.expression;
}
