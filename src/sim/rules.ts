import { INGREDIENTS, RECIPES, REGIONS, SUPPLIERS } from '../domain/catalog';
import { ALCOHOL_PRODUCTS, bottleTotal } from '../domain/bottleCatalog';
import { calendarDate, coins, consecutiveDays, dailyCoinsFor, quotePurchase } from '../domain/economy';
import { withArticle } from '../domain/english/articles';
import { BAR_PROFILE_OPTIONS } from '../data/cosmetics/bars';
import { consumeMix, createMarket, generateCustomer, judgeMix, requiredRecipe } from '../domain/engine';
import type { Customer, InventoryItem, Recipe, RegionId } from '../domain/types';
import { pourableBrand, serveRequestText, substitutesFor } from '../domain/brandServe';
import { signatureBonus } from '../domain/brandPours';
import { bottleMatchesRequest } from '../domain/conversation/bottleTalk';
import { canWelcomeVip, nextCustomerArrival, nextVipAvailability, orderTimeSeconds, vipCarriesRecipe } from '../domain/customerTiming';
import { DELIVERY_DAY_MS, levelFor, withUniqueLook, type PlayerState, type UnlockSource } from './state';

// Game rules as pure state transitions. The server runs these for every request, so the client can only
// ask for an action — it can never set coins, stock, XP or timers itself. Every payload is treated as untrusted.

export type GameAction =
  | { type: 'tick' }
  | { type: 'serve'; mix: InventoryItem[]; shaken: boolean; pourBrands: Record<string, string> }
  | { type: 'buy'; supplierId: string; cart: Record<string, number> }
  | { type: 'sell'; cart: Record<string, number> }
  | { type: 'transfer'; ingredientId: string; targetId: RegionId; amount?: number }
  | { type: 'claimDaily' }
  | { type: 'buyRecipe'; recipeId: string }
  | { type: 'switchBar'; regionId: RegionId }
  | { type: 'renameBar'; name: string }
  | { type: 'renameBartender'; name: string }
  | { type: 'setDecor'; key: string; value: string }
  | { type: 'selectCustomer'; customerId: string }
  | { type: 'openConversation'; customerId: string }
  | { type: 'closeConversation' }
  | { type: 'sentence'; text: string }
  | { type: 'wrongGuess' }
  | { type: 'confirmOrder'; customerId: string; recipeId: string }
  | { type: 'confirmBottle'; customerId: string; productId: string }
  | { type: 'sellBottle' }
  | { type: 'switchServeBrand'; customerId: string; productId: string }
  | { type: 'offerSimilar'; customerId: string }
  | { type: 'rejectCustomer'; customerId: string };

export class RuleError extends Error {}

export interface RuleContext {
  now: number;
  random?: () => number;
  // Grammar check used to decide whether a sentence earns XP (the server runs its own copy).
  isCorrectEnglish: (text: string) => boolean;
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

function makeArrivingCustomer(state: PlayerState, now: number, random: () => number) {
  const level = levelFor(state.xp);
  const marketFactor = REGIONS.find((region) => region.id === state.regionId)!.marketFactor;
  if (canWelcomeVip(now, state.vipCooldownUntil, random)) {
    state.vipCooldownUntil = nextVipAvailability(now, random);
    const locked = lockedRecipes(state);
    if (vipCarriesRecipe(locked.length > 0, random)) return withUniqueLook(makeSpecialCustomer(locked[Math.floor(random() * locked.length)]!, level), []);
    const vip = withUniqueLook(generateCustomer(level, knownRecipes(state), .35, marketFactor), []);
    vip.mood = 'vip';
    vip.greeting = 'Good evening. I was told this bar is exceptional.';
    vip.patience = orderTimeSeconds('vip', vip.orderKind);
    vip.patienceRemaining = vip.patience;
    return vip;
  }
  return withUniqueLook(generateCustomer(level, knownRecipes(state), .35, marketFactor), []);
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
  if (state.customers[0]) delete state.rewardedSentences[state.customers[0].id];
  state.customers = [];
  state.activeCustomerId = '';
  state.nextCustomerAt = nextCustomerArrival(now, random);
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
  const now = context.now;
  const random = context.random ?? Math.random;
  processDeliveries(state, now);
  if (!state.customers.length) {
    state.lastClockAt = now;
    if (context.spawnCustomers !== false && state.nextCustomerAt && now >= state.nextCustomerAt) welcomeNextCustomer(state, now, random);
    else if (!state.nextCustomerAt) state.nextCustomerAt = nextCustomerArrival(now, random);
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
  const guest = currentCustomer(state);
  const region = REGIONS.find((item) => item.id === state.regionId)!;

  switch (action.type) {
    case 'tick': break;

    case 'selectCustomer':
    case 'openConversation': {
      if (!state.customers.some((item) => item.id === action.customerId)) throw new RuleError('This guest is no longer here.');
      state.activeCustomerId = action.customerId;
      if (action.type === 'openConversation') state.conversationCustomerId = action.customerId;
      break;
    }
    case 'closeConversation': state.conversationCustomerId = undefined; break;

    case 'sentence': {
      if (!guest || state.conversationCustomerId !== guest.id) throw new RuleError('Open a conversation first.');
      const text = cleanText(action.text, 240);
      if (text.length < 3) throw new RuleError('Write a sentence first.');
      state.languageStats.sentences++;
      // The server checks the English itself — the client cannot claim a sentence was correct.
      if (context.isCorrectEnglish(text)) {
        state.languageStats.correct++;
        const rewarded = state.rewardedSentences[guest.id] ?? 0;
        if (rewarded < MAX_REWARDED_SENTENCES) {
          state.rewardedSentences[guest.id] = rewarded + 1;
          state.xp += 3;
        }
      } else {
        guest.patienceRemaining = Math.max(1, guest.patienceRemaining - 15);
      }
      break;
    }
    case 'wrongGuess': if (guest) guest.patienceRemaining = Math.max(1, guest.patienceRemaining - 30); break;

    case 'confirmOrder': {
      const target = state.customers.find((item) => item.id === action.customerId);
      if (!target || target.orderKind === 'bottle') throw new RuleError('This guest has no cocktail order.');
      // Proof of the conversation: the player must name the drink the guest actually wants.
      if (target.orderRecipeId !== action.recipeId) throw new RuleError('That is not what the guest ordered.');
      if (!target.orderRevealed) { target.orderRevealed = true; state.xp += 10; }
      state.message = `${target.name} ordered: ${RECIPES.find((item) => item.id === target.orderRecipeId)?.name ?? 'a drink'}. Time to mix!`;
      break;
    }
    case 'confirmBottle': {
      const target = state.customers.find((item) => item.id === action.customerId);
      const product = ALCOHOL_PRODUCTS.find((item) => item.id === action.productId);
      if (!target?.bottleRequest || !product) throw new RuleError('This guest is not buying bottles.');
      if (!bottleMatchesRequest(product, target.bottleRequest, region.marketFactor)) throw new RuleError('That bottle does not fit what the customer asked for.');
      if (!target.orderRevealed) state.xp += 10;
      target.selectedBottleId = product.id;
      target.orderRevealed = true;
      state.message = `${target.name} chose ${target.bottleRequest.quantity} × ${product.name}. Complete the sealed-bottle sale.`;
      break;
    }
    case 'sellBottle': {
      const request = guest?.bottleRequest;
      const product = ALCOHOL_PRODUCTS.find((item) => item.id === guest?.selectedBottleId);
      if (!guest || guest.orderKind !== 'bottle' || !guest.orderRevealed || !request || !product) throw new RuleError('Confirm the customer’s bottle choice first.');
      const stock = bottleStock(state, product.id);
      if (!stock || stock.quantity < request.quantity) throw new RuleError(`Only ${stock?.quantity ?? 0} bottles of ${product.name} are in this bar.`);
      const revenue = bottleTotal(product, request.quantity, region.marketFactor);
      if (revenue > request.budget) throw new RuleError(`The ${revenue} coin total is over the customer’s ${request.budget} coin budget.`);
      stock.quantity -= request.quantity;
      const tip = guest.mood === 'vip' || guest.mood === 'wealthy' ? Math.ceil(revenue * .1) : Math.ceil(revenue * .04);
      state.money = coins(state.money + revenue + tip);
      state.xp += 28 + Math.min(state.streak * 2, 14);
      state.streak += 1;
      const note = `Sold ${request.quantity} × ${product.name} for ${revenue.toFixed(2)} coins. Tip +${tip}.`;
      scheduleNextCustomer(state, now, random);
      state.message = note;
      break;
    }
    case 'switchServeBrand': {
      const target = state.customers.find((item) => item.id === action.customerId);
      const product = ALCOHOL_PRODUCTS.find((item) => item.id === action.productId);
      if (!target?.serveRequest || !product) throw new RuleError('This guest did not order a brand.');
      const allowed = substitutesFor(target.serveRequest, (id) => (bottleStock(state, id)?.quantity ?? 0) > 0).some((item) => item.id === product.id);
      if (!allowed) throw new RuleError('The guest will only accept the same spirit from your shelf.');
      target.serveRequest = { ...target.serveRequest, substitutedFrom: target.serveRequest.substitutedFrom ?? target.serveRequest.productId, productId: product.id };
      target.request = serveRequestText(target.serveRequest);
      state.message = `${target.name} will have ${target.request.replace(/, please\.$/, '')} instead.`;
      break;
    }
    case 'offerSimilar': {
      const target = state.customers.find((item) => item.id === action.customerId);
      if (!target) throw new RuleError('This guest is no longer here.');
      offerSimilar(state, target, region.marketFactor);
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
        const revenue = coins(verdict.recipe.price * region.marketFactor);
        const bonus = guest.orderKind === 'serve' ? undefined : signatureBonus(verdict.recipe.id, pourBrands);
        const tip = (guest.mood === 'vip' || guest.mood === 'wealthy' ? Math.ceil(revenue * .25) : Math.ceil(revenue * .12)) + (bonus ? 2 : 0);
        state.money = coins(state.money + revenue + tip);
        state.xp += 22 + Math.min(state.streak * 2, 14);
        state.streak += 1;
        const unlocked = guest.specialRecipeRewardId ? unlockRecipe(state, guest.specialRecipeRewardId, 'special-client') : false;
        const note = unlocked ? `Perfect service. ${verdict.recipe.name} was added to your recipe book!`
          : bonus ? `Perfect service — classic touch with ${bonus}! Tip +${tip} coins.` : `Perfect service. Tip +${tip} coins.`;
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
      // Prices come from the server's own market for this bar and day, never from the client.
      const quote = quotePurchase(createMarket(region, new Date(now).getDate()), cleanCart(action.cart, 99), supplier);
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
      const lines = Object.entries(cart).map(([ingredientId, quantity]) => {
        const item = INGREDIENTS.find((entry) => entry.id === ingredientId)!;
        const available = inventoryOf(state).find((stock) => stock.ingredientId === ingredientId)?.amount ?? 0;
        return { ingredientId, quantity, available, revenue: coins(item.basePrice * quantity * region.marketFactor * .55) };
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
      state.dailyGiftClaimedKey = today;
      const locked = lockedRecipes(state);
      if (locked.length && random() < .12) {
        const recipe = locked[Math.floor(random() * locked.length)]!;
        unlockRecipe(state, recipe.id, 'daily-gift');
        state.dailyGiftResult = `Day ${state.loginStreak}: +${reward} coins and a lucky ${recipe.name} recipe!`;
      } else {
        state.dailyGiftResult = `Day ${state.loginStreak}: +${reward} coins. Come back tomorrow to grow your streak.`;
      }
      state.message = state.dailyGiftResult;
      break;
    }
    case 'buyRecipe': {
      const recipe = RECIPES.find((item) => item.id === action.recipeId);
      if (!recipe || state.knownRecipeIds.includes(recipe.id)) throw new RuleError('This recipe is not for sale.');
      const price = Math.round(recipe.price * 18);
      if (state.money < price) throw new RuleError(`You need ${price} coins to buy this recipe.`);
      state.money = coins(state.money - price);
      unlockRecipe(state, recipe.id, 'shop');
      state.message = `${recipe.name} added to your recipe book.`;
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
      (state.bars[state.regionId] as unknown as Record<string, string>)[action.key] = action.value;
      break;
    }

    default: throw new RuleError('Unknown action.');
  }

  if (!Number.isFinite(state.money) || state.money < 0) throw new RuleError('Not enough money.');
  return { moneyDelta: coins(state.money - moneyBefore) };
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

