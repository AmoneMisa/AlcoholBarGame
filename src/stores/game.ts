import { computed, ref, watch } from 'vue';
import { defineStore } from 'pinia';
import { INGREDIENTS, RECIPES, REGIONS, STARTING_INVENTORY, SUPPLIERS } from '../domain/catalog';
import { ALCOHOL_PRODUCTS, bottleTotal } from '../domain/bottleCatalog';
import { calendarDate, coins, consecutiveDays, dailyCoinsFor, quotePurchase } from '../domain/economy';
import { withArticle } from '../domain/english/articles';
import { BAR_PROFILE_OPTIONS, DEFAULT_BARS, INTERIORS, interiorStyle, type BarProfile } from '../data/cosmetics/bars';
import { CHARACTER_ART, CUSTOMER_ART_BY_SLOT } from '../data/cosmetics/artCatalog';
import { canMake, consumeMix, createMarket, generateCustomer, judgeMix, requiredRecipe } from '../domain/engine';
import type { BottleInventoryItem, Customer, InventoryItem, Recipe, RegionId, SupplierOffer } from '../domain/types';
import { pourableBrand, serveRequestText, substitutesFor } from '../domain/brandServe';
import { signatureBonus } from '../domain/brandPours';
import {
  canWelcomeVip, formatCountdown, nextCustomerArrival, nextVipAvailability, orderTimeSeconds, vipCarriesRecipe
} from '../domain/customerTiming';

const BASIC_RECIPE_COUNT = 10;
const DELIVERY_DAY_MS = 24 * 60 * 60 * 1000;
interface DeliveryOrder { id:string; supplier:string; barId:RegionId; dueAt:number; items:InventoryItem[]; total:number }
// A guest's name comes from their portrait, so names are unique in the queue and match the face.
// Special guests (Celeste) keep their story name.
function nameFromLook(customer: Customer) {
  if (!customer.specialRecipeRewardId) customer.name = CHARACTER_ART.find((art) => art.id === customer.characterId)?.name ?? customer.name;
  return customer;
}
function uniqueLook(customer: Customer, others: Customer[]) {
  const used = new Set(others.map((item) => item.characterId));
  if (!customer.characterId || used.has(customer.characterId)) customer.characterId = CUSTOMER_ART_BY_SLOT.find((id) => !used.has(id));
  return nameFromLook(customer);
}
const makeSpecialCustomer = (recipe: Recipe, level = 0) => ({
  ...generateCustomer(level, [recipe], 0),
  name: 'Celeste',
  mood: 'vip' as const,
  greeting: 'I collect forgotten recipes.',
  request: `Make me ${withArticle(recipe.name)}. Impress me and I will teach you the recipe.`,
  specialRecipeRewardId: recipe.id,
  orderKind: 'cocktail' as const,
  bottleRequest: undefined,
  orderRevealed: true,
  patience: orderTimeSeconds('vip', 'cocktail'),
  patienceRemaining: orderTimeSeconds('vip', 'cocktail')
});
const EMPTY_CUSTOMER: Customer = {
  id: 'waiting-for-customer', name: 'Next guest', mood: 'calm', patience: 1, patienceRemaining: 1,
  budget: 0, orderRecipeId: RECIPES[0]!.id, greeting: '', request: '', paymentMethod: 'cash', orderKind: 'cocktail'
};
const makeBarInventory = (barIndex: number) => STARTING_INVENTORY.map((item, ingredientIndex) => {
  const ingredient = INGREDIENTS.find((entry) => entry.id === item.ingredientId)!;
  const factor = .48 + ((barIndex * 3 + ingredientIndex) % 6) * .11;
  const floor = ingredient.unit === 'ml' ? 90 : 4;
  return { ...item, amount: Math.max(floor, Math.round(item.amount * factor)) };
});
const initialInventories = Object.fromEntries(REGIONS.map((region, index) => [region.id, makeBarInventory(index)])) as Record<RegionId, InventoryItem[]>;
const initialBottleInventories = Object.fromEntries(REGIONS.map((region, barIndex) => [region.id, ALCOHOL_PRODUCTS.map((product, productIndex) => ({
  productId: product.id,
  quantity: 1 + ((barIndex + productIndex * 2) % 4)
}))])) as Record<RegionId, BottleInventoryItem[]>;

export const useGameStore = defineStore('game', () => {
  const regionId = ref<RegionId>('new-york');
  const money = ref(1240);
  const xp = ref(720);
  const streak = ref(0);
  const serving = ref(false);
  const bars = ref<Record<RegionId, BarProfile>>(structuredClone(DEFAULT_BARS));
  const decor = computed(() => bars.value[regionId.value]);
  const barBackground = computed(() => INTERIORS.find((item) => item.id === decor.value.interior)?.asset ?? INTERIORS[0].asset);
  const barInteriorStyle = computed(() => interiorStyle(decor.value.interior));
  const knownRecipeIds = ref<string[]>(RECIPES.slice(0, BASIC_RECIPE_COUNT).map((recipe) => recipe.id));
  const recipeUnlockSources = ref<Record<string, 'starter' | 'shop' | 'special-client' | 'daily-gift'>>(
    Object.fromEntries(knownRecipeIds.value.map((id) => [id, 'starter']))
  );
  const dailyGiftClaimedKey = ref('');
  const loginStreak = ref(0);
  const today = ref(calendarDate());
  const upcomingLoginDay = computed(() => consecutiveDays(dailyGiftClaimedKey.value, loginStreak.value, new Date(`${today.value}T12:00:00`)));
  const dailyCoinReward = computed(() => dailyCoinsFor(upcomingLoginDay.value));
  const dailyGiftResult = ref('A new gift is available today.');
  const inventories = ref<Record<RegionId, InventoryItem[]>>(structuredClone(initialInventories));
  const inventory = computed<InventoryItem[]>({
    get: () => inventories.value[regionId.value],
    set: (value) => { inventories.value[regionId.value] = value; }
  });
  const currentMix = ref<InventoryItem[]>([]);
  const bottleInventories = ref<Record<RegionId, BottleInventoryItem[]>>(structuredClone(initialBottleInventories));
  const bottleInventory = computed<BottleInventoryItem[]>(() => bottleInventories.value[regionId.value]);
  const shaken = ref(false);
  // Brand chosen for each spirit in the drink being mixed (ingredientId → shop productId). Missing = house pour.
  const pourBrands = ref<Record<string, string>>({});
  // One guest is served at a time. After they leave, the next arrival is
  // scheduled in real time rather than silently replacing them.
  const initialCustomer = uniqueLook(generateCustomer(2, RECIPES.slice(0, BASIC_RECIPE_COUNT), .35, REGIONS[0]!.marketFactor), []);
  const customers = ref<Customer[]>([initialCustomer]);
  const activeCustomerId = ref(customers.value[0]!.id);
  const conversationCustomerId = ref<string>();
  const nowMs = ref(Date.now());
  const nextCustomerAt = ref(0);
  const vipCooldownUntil = ref(0);
  let lastClockAt = nowMs.value;
  const languageStats = ref({ sentences: 0, correct: 0 });
  const message = ref('Tap a customer to talk, find out what they want, then build the cocktail.');
  const selectedSupplier = ref('global');
  const purchaseCart = ref<Record<string,number>>({});
  const saleCart = ref<Record<string,number>>({});
  const deliveryOrders = ref<DeliveryOrder[]>([]);
  const transferTargetId = ref<RegionId>('london');
  const tradeLog = ref<string[]>(['Each city bar now keeps its own stock.']);
  const recipeCategory = ref<'all' | 'classic' | 'cocktail'>('all');

  const level = computed(() => Math.max(1, Math.floor(xp.value / 60)));
  const region = computed(() => REGIONS.find((item) => item.id === regionId.value)!);
  const market = computed(() => createMarket(region.value, new Date(nowMs.value).getDate()));
  const knownRecipes = computed(() => RECIPES.filter((recipe) => knownRecipeIds.value.includes(recipe.id)));
  const lockedRecipes = computed(() => RECIPES.filter((recipe) => !knownRecipeIds.value.includes(recipe.id)));
  const dailyGiftAvailable = computed(() => dailyGiftClaimedKey.value !== today.value);
  const supplier = computed(() => SUPPLIERS.find((item) => item.id === selectedSupplier.value) ?? SUPPLIERS[0]!);
  const purchaseQuote = computed(() => quotePurchase(market.value, purchaseCart.value, supplier.value));
  const saleQuote = computed(() => INGREDIENTS.filter((item) => Number.isFinite(saleCart.value[item.id]) && saleCart.value[item.id] >= 1).map((item) => {
    const quantity = Math.max(0, Math.floor(saleCart.value[item.id]!));
    const available = Math.max(0, (inventory.value.find((stock) => stock.ingredientId === item.id)?.amount ?? 0) - (currentMix.value.find((mix) => mix.ingredientId === item.id)?.amount ?? 0));
    return { ingredientId:item.id,quantity,available,revenue:coins(item.basePrice * quantity * region.value.marketFactor * .55) };
  }));
  const saleRevenue = computed(() => coins(saleQuote.value.reduce((sum,line) => sum + line.revenue,0)));
  const hasCustomer = computed(() => customers.value.length > 0);
  const customer = computed(() => customers.value.find((item) => item.id === activeCustomerId.value) ?? customers.value[0] ?? EMPTY_CUSTOMER);
  const nextCustomerInSeconds = computed(() => nextCustomerAt.value ? Math.max(0, Math.ceil((nextCustomerAt.value - nowMs.value) / 1000)) : 0);
  const nextCustomerCountdown = computed(() => formatCountdown(nextCustomerInSeconds.value));
  const orderCountdown = computed(() => formatCountdown(customer.value.patienceRemaining));
  const orderTimerPaused = computed(() => !!conversationCustomerId.value);
  const recipe = computed(() => judgeMix(currentMix.value, customer.value, shaken.value).recipe);
  const mixJudge = computed(() => judgeMix(currentMix.value, customer.value, shaken.value));
  const filteredRecipes = computed(() => recipeCategory.value === 'all' ? knownRecipes.value : knownRecipes.value.filter((item) => item.category === recipeCategory.value));

  function unlockRecipe(recipeId: string, source: 'shop' | 'special-client' | 'daily-gift') {
    if (knownRecipeIds.value.includes(recipeId)) return false;
    knownRecipeIds.value.push(recipeId);
    recipeUnlockSources.value[recipeId] = source;
    return true;
  }

  function buyRecipe(recipeId: string) {
    const recipe = RECIPES.find((item) => item.id === recipeId);
    if (!recipe || knownRecipeIds.value.includes(recipeId)) return;
    const price = Math.round(recipe.price * 18);
    if (money.value < price) {
      message.value = `You need ${price} coins to buy this recipe.`;
      return;
    }
    money.value = Number((money.value - price).toFixed(2));
    unlockRecipe(recipeId, 'shop');
    message.value = `${recipe.name} added to your recipe book.`;
  }

  function refreshDailyGift() {
    today.value = calendarDate();
  }

  function claimDailyGift() {
    refreshDailyGift();
    if (!dailyGiftAvailable.value) {
      dailyGiftResult.value = 'Today’s gift has already been claimed.';
      return;
    }
    loginStreak.value = upcomingLoginDay.value;
    const reward = dailyCoinsFor(loginStreak.value);
    money.value = coins(money.value + reward);
    dailyGiftClaimedKey.value = today.value;
    const candidates = lockedRecipes.value;
    if (candidates.length && Math.random() < .12) {
      const recipe = candidates[Math.floor(Math.random() * candidates.length)]!;
      unlockRecipe(recipe.id, 'daily-gift');
      dailyGiftResult.value = `Day ${loginStreak.value}: +${reward} coins and a lucky ${recipe.name} recipe!`;
      message.value = dailyGiftResult.value;
      return;
    }
    dailyGiftResult.value = `Day ${loginStreak.value}: +${reward} coins. Come back tomorrow to grow your streak.`;
    message.value = dailyGiftResult.value;
  }

  function resetMix() {
    currentMix.value = [];
    shaken.value = false;
    pourBrands.value = {};
  }

  // A brand is “on the shelf” when the bar has at least one bottle of it.
  function brandOnShelf(productId: string) {
    return (bottleInventory.value.find((item) => item.productId === productId)?.quantity ?? 0) > 0;
  }
  function shelfBrandsFor(ingredientId: string) {
    return ALCOHOL_PRODUCTS.filter((product) => product.ingredientId === ingredientId && pourableBrand(product) && brandOnShelf(product.id));
  }
  function setPourBrand(ingredientId: string, productId?: string) {
    const next = { ...pourBrands.value };
    if (productId) next[ingredientId] = productId;
    else delete next[ingredientId];
    pourBrands.value = next;
  }
  // The guest accepted another brand (“Jameson is fine”).
  function switchServeBrand(customerId: string, productId: string) {
    const target = customers.value.find((item) => item.id === customerId);
    if (!target?.serveRequest) return;
    target.serveRequest = { ...target.serveRequest, substitutedFrom: target.serveRequest.substitutedFrom ?? target.serveRequest.productId, productId };
    target.request = serveRequestText(target.serveRequest);
    message.value = `${target.name} will have ${target.request.replace(/, please\.$/, '')} instead.`;
  }

  function makeArrivingCustomer(now = Date.now()) {
    if (canWelcomeVip(now, vipCooldownUntil.value)) {
      vipCooldownUntil.value = nextVipAvailability(now);
      if (vipCarriesRecipe(lockedRecipes.value.length > 0)) {
        const reward = lockedRecipes.value[Math.floor(Math.random() * lockedRecipes.value.length)]!;
        return uniqueLook(makeSpecialCustomer(reward, level.value), []);
      }
      const vip = uniqueLook(generateCustomer(level.value, knownRecipes.value, .35, region.value.marketFactor), []);
      vip.mood = 'vip';
      vip.greeting = 'Good evening. I was told this bar is exceptional.';
      vip.patience = orderTimeSeconds('vip', vip.orderKind);
      vip.patienceRemaining = vip.patience;
      return vip;
    }
    return uniqueLook(generateCustomer(level.value, knownRecipes.value, .35, region.value.marketFactor), []);
  }

  function welcomeNextCustomer(now = Date.now()) {
    const arrival = makeArrivingCustomer(now);
    customers.value = [arrival];
    activeCustomerId.value = arrival.id;
    nextCustomerAt.value = 0;
    lastClockAt = now;
    resetMix();
    message.value = arrival.specialRecipeRewardId
      ? `VIP guest ${arrival.name} arrived with a recipe challenge.`
      : `${arrival.mood === 'vip' ? 'VIP guest' : 'A new customer'} ${arrival.name} arrived.`;
    return arrival;
  }

  function scheduleNextCustomer(now = Date.now()) {
    customers.value = [];
    activeCustomerId.value = '';
    nextCustomerAt.value = nextCustomerArrival(now);
    nowMs.value = now;
    lastClockAt = now;
    closeConversation();
    resetMix();
  }

  function processDeliveries(now = Date.now()) {
    const arrived = deliveryOrders.value.filter((order) => order.dueAt <= now);
    for (const order of arrived) for (const item of order.items) {
      const stock = inventories.value[order.barId].find((entry) => entry.ingredientId === item.ingredientId);
      if (stock) stock.amount += item.amount;
    }
    if (arrived.length) {
      deliveryOrders.value = deliveryOrders.value.filter((order) => order.dueAt > now);
      tradeLog.value.unshift(`${arrived.length} supplier ${arrived.length === 1 ? 'delivery has' : 'deliveries have'} arrived.`);
    }
    return arrived.length;
  }

  function deliveryCountdown(dueAt: number) {
    const seconds = Math.max(0, Math.ceil((dueAt - nowMs.value) / 1000));
    const days = Math.floor(seconds / 86_400);
    const hours = Math.floor((seconds % 86_400) / 3600);
    if (days) return `${days}d ${hours}h`;
    return formatCountdown(seconds);
  }

  function tickGameClock(now = Date.now()) {
    nowMs.value = now;
    const arrived = processDeliveries(now);
    if (arrived) message.value = `${arrived} supplier ${arrived === 1 ? 'delivery has' : 'deliveries have'} arrived.`;
    if (!hasCustomer.value) {
      lastClockAt = now;
      if (nextCustomerAt.value && now >= nextCustomerAt.value) welcomeNextCustomer(now);
      return;
    }
    const elapsed = Math.max(0, Math.min(60, (now - lastClockAt) / 1000));
    lastClockAt = now;
    // Reading and composing inside the customer dialogue is learning time, so
    // the shared order clock is explicitly paused for the whole popup.
    if (serving.value || conversationCustomerId.value || elapsed <= 0) return;
    customer.value.patienceRemaining = Math.max(0, customer.value.patienceRemaining - elapsed);
    if (customer.value.patienceRemaining <= 0) {
      const name = customer.value.name;
      scheduleNextCustomer(now);
      message.value = `${name} left because the order timer ran out. Next guest in ${nextCustomerCountdown.value}.`;
    }
  }

  function selectCustomer(id: string) {
    if (!customers.value.some((item) => item.id === id)) return;
    if (activeCustomerId.value === id) return;
    activeCustomerId.value = id;
    resetMix();
    message.value = 'Customer selected. Talk to them to find the right drink.';
  }

  function openConversation(id: string) {
    if (!customers.value.some((item) => item.id === id)) return;
    selectCustomer(id);
    conversationCustomerId.value = id;
  }

  function closeConversation() {
    conversationCustomerId.value = undefined;
  }

  // Every sentence the player sends is scored; correct English earns XP, mistakes cost a little patience.
  function recordSentence(correct: boolean) {
    if (!hasCustomer.value) return;
    languageStats.value.sentences++;
    if (correct) {
      languageStats.value.correct++;
      xp.value += 3;
    } else {
      customer.value.patienceRemaining = Math.max(1, customer.value.patienceRemaining - 15);
    }
  }

  function penalizeWrongGuess() {
    if (hasCustomer.value) customer.value.patienceRemaining = Math.max(1, customer.value.patienceRemaining - 30);
  }

  function confirmOrder(id: string) {
    const target = customers.value.find((item) => item.id === id);
    if (!target) return;
    target.orderRevealed = true;
    xp.value += 10;
    message.value = `${target.name} ordered: ${RECIPES.find((item) => item.id === target.orderRecipeId)?.name ?? 'a drink'}. Time to mix!`;
  }

  function confirmBottleOrder(id: string, productId: string) {
    const target = customers.value.find((item) => item.id === id);
    const product = ALCOHOL_PRODUCTS.find((item) => item.id === productId);
    if (!target?.bottleRequest || !product) return false;
    target.selectedBottleId = productId;
    target.orderRevealed = true;
    xp.value += 10;
    message.value = `${target.name} chose ${target.bottleRequest.quantity} × ${product.name}. Complete the sealed-bottle sale.`;
    return true;
  }

  function sellBottleToCustomer() {
    const target = customer.value;
    const request = target.bottleRequest;
    const product = ALCOHOL_PRODUCTS.find((item) => item.id === target.selectedBottleId);
    if (target.orderKind !== 'bottle' || !target.orderRevealed || !request || !product) {
      message.value = 'Confirm the customer’s bottle choice first.';
      return false;
    }
    const stock = bottleInventory.value.find((item) => item.productId === product.id);
    if (!stock || stock.quantity < request.quantity) {
      message.value = `Only ${stock?.quantity ?? 0} bottles of ${product.name} are in this bar.`;
      return false;
    }
    const revenue = bottleTotal(product, request.quantity, region.value.marketFactor);
    if (revenue > request.budget) {
      message.value = `The ${revenue} coin total is over the customer’s ${request.budget} coin budget.`;
      return false;
    }
    stock.quantity -= request.quantity;
    const tip = target.mood === 'vip' || target.mood === 'wealthy' ? Math.ceil(revenue * .1) : Math.ceil(revenue * .04);
    money.value = coins(money.value + revenue + tip);
    xp.value += 28 + Math.min(streak.value * 2, 14);
    streak.value += 1;
    message.value = `Sold ${request.quantity} × ${product.name} for ${revenue.toFixed(2)} coins. Tip +${tip}.`;
    const servedId = target.id;
    serving.value = true;
    window.setTimeout(() => {
      replaceCustomer(servedId);
      serving.value = false;
    }, 650);
    return true;
  }

  function similarCocktailFor(target: Customer) {
    const original = requiredRecipe(target);
    const originalIds = new Set(original.ingredients.map((item) => item.ingredientId));
    return knownRecipes.value
      .filter((candidate) => candidate.id !== target.orderRecipeId)
      .filter((candidate) => candidate.ingredients.every((part) => (inventory.value.find((stock) => stock.ingredientId === part.ingredientId)?.amount ?? 0) >= part.amount))
      .map((candidate) => {
        const overlap = candidate.ingredients.filter((part) => originalIds.has(part.ingredientId)).length;
        const notes = candidate.tastingNotes.filter((note) => original.tastingNotes.includes(note)).length;
        const score = overlap * 5 + notes * 3 + (candidate.category === original.category ? 2 : 0) - Math.abs(candidate.price - original.price) * .15;
        return { candidate, score };
      })
      .sort((a, b) => b.score - a.score)[0]?.candidate;
  }

  function offerSimilarOrder(id: string) {
    const target = customers.value.find((item) => item.id === id);
    if (!target) return false;
    if (target.orderKind === 'serve' && target.serveRequest) {
      const substitute = substitutesFor(target.serveRequest, brandOnShelf)[0];
      if (!substitute) {
        message.value = 'There is no similar stocked brand to offer.';
        return false;
      }
      switchServeBrand(target.id, substitute.id);
      target.orderRevealed = true;
      target.specialRecipeRewardId = undefined;
      return true;
    }
    if (target.orderKind === 'bottle' && target.bottleRequest) {
      const request = target.bottleRequest;
      const substitute = ALCOHOL_PRODUCTS
        .filter((product) => product.id !== request.productId && product.type === request.type)
        .filter((product) => (bottleInventory.value.find((stock) => stock.productId === product.id)?.quantity ?? 0) >= request.quantity)
        .filter((product) => bottleTotal(product, request.quantity, region.value.marketFactor) <= request.budget)
        .sort((a, b) => b.popularity - a.popularity)[0];
      if (!substitute) {
        message.value = 'There is no similar bottle within this customer’s budget.';
        return false;
      }
      target.bottleRequest = { ...request, productId: substitute.id };
      target.selectedBottleId = substitute.id;
      target.orderRevealed = true;
      target.specialRecipeRewardId = undefined;
      message.value = `${target.name} accepted ${substitute.name} as a similar option.`;
      return true;
    }
    const substitute = similarCocktailFor(target);
    if (!substitute) {
      message.value = 'No similar cocktail can be made from the current stock.';
      return false;
    }
    target.orderRecipeId = substitute.id;
    target.modifierId = undefined;
    target.orderKind = 'cocktail';
    target.orderRevealed = true;
    target.specialRecipeRewardId = undefined;
    target.request = `I’ll have ${withArticle(substitute.name)} instead, please.`;
    resetMix();
    message.value = `${target.name} accepted ${substitute.name} as a similar drink.`;
    return true;
  }

  function rejectCustomer(id: string) {
    const target = customers.value.find((item) => item.id === id);
    if (!target) return false;
    const name = target.name;
    scheduleNextCustomer();
    message.value = `${name} left without ordering. Next customer in ${nextCustomerCountdown.value}.`;
    return true;
  }

  function replaceCustomer(id: string) {
    const index = customers.value.findIndex((item) => item.id === id);
    if (index < 0) return;
    scheduleNextCustomer();
  }

  function addIngredient(ingredientId: string, requestedAmount?: number) {
    if (!hasCustomer.value) {
      message.value = `The bar is ready. The next customer arrives in ${nextCustomerCountdown.value}.`;
      return;
    }
    const ingredient = INGREDIENTS.find((item) => item.id === ingredientId);
    if (!ingredient) return;
    const amount = requestedAmount ?? (ingredient.unit === 'ml' ? 5 : 1);
    const stock = inventory.value.find((item) => item.ingredientId === ingredientId);
    const used = currentMix.value.find((item) => item.ingredientId === ingredientId)?.amount ?? 0;
    if (!stock || stock.amount - used < amount) {
      message.value = 'Not enough ' + ingredient.name + '.';
      return;
    }
    const current = currentMix.value.find((item) => item.ingredientId === ingredientId);
    if (current) current.amount += amount;
    else currentMix.value.push({ ingredientId, amount });
    message.value = ingredient.name + ': +' + amount + ' ' + ingredient.unit + '.';
  }

  function shakeCurrentMix() {
    if (!currentMix.value.length) {
      message.value = 'The shaker is empty.';
      return;
    }
    shaken.value = true;
    message.value = 'Shaken. Now serve the drink.';
  }

  function serveMix() {
    if (!hasCustomer.value) {
      message.value = `There is no order to serve. Next customer in ${nextCustomerCountdown.value}.`;
      return;
    }
    if (customer.value.orderKind === 'bottle') {
      message.value = 'This customer wants sealed bottles. Complete the sale in the conversation.';
      return;
    }
    if (!currentMix.value.length) {
      message.value = 'Build the drink first.';
      return;
    }
    // Brand calls: the requested brand must be on the shelf and actually chosen for the pour.
    const serve = customer.value.orderKind === 'serve' ? customer.value.serveRequest : undefined;
    if (serve) {
      const product = ALCOHOL_PRODUCTS.find((item) => item.id === serve.productId);
      if (product && !brandOnShelf(product.id)) {
        message.value = `There is no ${product.brand} on the shelf. Offer another brand in the conversation.`;
        return;
      }
      if (product && pourBrands.value[product.ingredientId] !== product.id) {
        message.value = `The guest asked for ${product.brand}. Choose that brand before you pour.`;
        return;
      }
    }
    if (!canMake(inventory.value, customer.value)) {
      message.value = 'Not enough ingredients in stock.';
      return;
    }

    serving.value = true;
    inventory.value = consumeMix(inventory.value, currentMix.value);
    const verdict = judgeMix(currentMix.value, customer.value, shaken.value);

    if (verdict.success) {
      const revenue = Number((verdict.recipe.price * region.value.marketFactor).toFixed(2));
      const bonus = customer.value.orderKind === 'serve' ? undefined : signatureBonus(verdict.recipe.id, pourBrands.value);
      const tip = (customer.value.mood === 'vip' || customer.value.mood === 'wealthy' ? Math.ceil(revenue * 0.25) : Math.ceil(revenue * 0.12)) + (bonus ? 2 : 0);
      money.value = Number((money.value + revenue + tip).toFixed(2));
      xp.value += 22 + Math.min(streak.value * 2, 14);
      streak.value += 1;
      const rewardId = customer.value.specialRecipeRewardId;
      const unlocked = rewardId ? unlockRecipe(rewardId, 'special-client') : false;
      message.value = unlocked
        ? `Perfect service. ${verdict.recipe.name} was added to your recipe book!`
        : bonus ? `Perfect service — classic touch with ${bonus}! Tip +${tip} coins.` : 'Perfect service. Tip +' + tip + ' coins.';
      const servedId = customer.value.id;
      window.setTimeout(() => {
        replaceCustomer(servedId);
        serving.value = false;
      }, 650);
      return;
    }

    streak.value = 0;
    customer.value.patienceRemaining = Math.max(0, customer.value.patienceRemaining - 60);
    message.value = verdict.shakeOk ? 'Wrong drink. Check the ingredients.' : 'This recipe needs shaking.';
    resetMix();
    serving.value = false;
  }

  function tickPatience() {
    tickGameClock();
  }

  function selectSupplier(id: string) {
    if (!SUPPLIERS.some((item) => item.id === id)) return;
    if (selectedSupplier.value !== id) purchaseCart.value = {};
    selectedSupplier.value = id;
  }

  function buy(offer: SupplierOffer, packs = 1) {
    selectSupplier(offer.supplierId);
    purchaseCart.value[offer.ingredientId] = Math.min(99,Math.max(0,Math.floor(packs)));
    checkoutPurchase();
  }

  function checkoutPurchase() {
    const quote = purchaseQuote.value;
    if (!quote.lines.length) { message.value = 'Add packs to your order first.'; return false; }
    if (money.value < quote.total) {
      message.value = 'You do not have enough money.';
      return false;
    }
    money.value = coins(money.value - quote.total);
    deliveryOrders.value.push({ id:crypto.randomUUID(),supplier:supplier.value.name,barId:regionId.value,dueAt:Date.now() + supplier.value.deliveryDays * DELIVERY_DAY_MS,items:quote.lines.map((line) => ({ingredientId:line.ingredientId,amount:line.amount})),total:quote.total });
    const note = `Ordered ${quote.packs} packs from ${supplier.value.name} for ${quote.total.toFixed(2)} coins. Delivery in ${supplier.value.deliveryDays} days.`;
    tradeLog.value.unshift(note);
    message.value = note;
    purchaseCart.value = {};
    return true;
  }

  function sell(ingredientId: string, amount?: number) {
    const ingredient = INGREDIENTS.find((item) => item.id === ingredientId);
    const stock = inventory.value.find((item) => item.ingredientId === ingredientId);
    if (!ingredient || !stock) return;
    saleCart.value[ingredientId] = amount ?? (ingredient.unit === 'ml' ? Math.min(250, stock.amount) : Math.min(6, stock.amount));
    checkoutSale();
  }

  function checkoutSale() {
    if (!saleQuote.value.length) { message.value = 'Choose stock to sell first.'; return false; }
    if (saleQuote.value.some((line) => line.quantity > line.available)) { message.value = 'Some stock is no longer available. Adjust your sale.'; return false; }
    const revenue = saleRevenue.value;
    const count = saleQuote.value.length;
    for (const line of saleQuote.value) inventory.value.find((stock) => stock.ingredientId === line.ingredientId)!.amount -= line.quantity;
    money.value = coins(money.value + revenue);
    const note = `Sold ${count} products for ${revenue.toFixed(2)} coins.`;
    tradeLog.value.unshift(note);
    message.value = note;
    saleCart.value = {};
    return true;
  }

  function renameBar(name: string) {
    const clean = name.replace(/[\u0000-\u001f\u007f]/g,'').trim().slice(0,32);
    if (!clean) { message.value = 'Enter a bar name first.'; return false; }
    decor.value.name = clean;
    message.value = `${region.value.name} is now home to ${clean}.`;
    return true;
  }

  function renameBartender(name: string) {
    const clean = name.replace(/[\u0000-\u001f\u007f]/g,'').trim().slice(0,18);
    if (!clean) { message.value = 'Enter a bartender nickname first.'; return false; }
    decor.value.bartenderNickname = clean;
    message.value = `${clean} is now working at ${decor.value.name}.`;
    return true;
  }

  function switchBar(id: RegionId) {
    if (id === regionId.value) return;
    regionId.value = id;
    purchaseCart.value = {};
    saleCart.value = {};
    transferTargetId.value = REGIONS.find((item) => item.id !== id)?.id ?? 'london';
    resetMix();
    message.value = `Now managing the ${region.value.name} bar.`;
  }

  function transferStock(ingredientId: string, targetId: RegionId) {
    if (targetId === regionId.value) return;
    const ingredient = INGREDIENTS.find((item) => item.id === ingredientId);
    const source = inventory.value.find((item) => item.ingredientId === ingredientId);
    const target = inventories.value[targetId].find((item) => item.ingredientId === ingredientId);
    if (!ingredient || !source || !target) return;
    const reserved = currentMix.value.find((item) => item.ingredientId === ingredientId)?.amount ?? 0;
    const available = Math.max(0, source.amount - reserved);
    const quantity = ingredient.unit === 'ml' ? Math.min(100, available) : Math.min(3, available);
    if (quantity <= 0) {
      message.value = `No ${ingredient.name} available to transfer.`;
      return;
    }
    source.amount -= quantity;
    target.amount += quantity;
    const destination = REGIONS.find((item) => item.id === targetId)!;
    const note = `Transferred ${quantity} ${ingredient.unit} ${ingredient.name} to ${destination.name}.`;
    tradeLog.value.unshift(note);
    message.value = note;
  }

  // Local save: login gifts, supplier routes, customer arrivals and VIP cooldowns all use real timestamps.
  const saveKey = 'barlingo-economy-v1';
  try {
    const saved = JSON.parse(localStorage.getItem(saveKey) ?? 'null');
    if (saved?.version === 1) {
      if (Number.isFinite(saved.money) && saved.money >= 0) money.value = saved.money;
      if (Number.isFinite(saved.xp) && saved.xp >= 0) xp.value = saved.xp;
      if (REGIONS.some((item) => item.id === saved.regionId)) regionId.value = saved.regionId;
      for (const region of REGIONS) {
        const profile = saved.bars?.[region.id];
        if (profile && typeof profile.name === 'string') {
          bars.value[region.id].name = profile.name.trim().slice(0,32) || DEFAULT_BARS[region.id].name;
          for (const [key, allowed] of Object.entries(BAR_PROFILE_OPTIONS)) {
            const value = profile[key];
            if (typeof value === 'string' && (allowed as readonly string[]).includes(value)) (bars.value[region.id] as unknown as Record<string,string>)[key] = value;
          }
          const savedNickname = typeof profile.bartenderNickname === 'string' ? profile.bartenderNickname.replace(/[\u0000-\u001f\u007f]/g,'').trim().slice(0,18) : '';
          bars.value[region.id].bartenderNickname = savedNickname || (bars.value[region.id].bartenderCharacter === 'leo' ? 'Leo' : 'Noa');
        }
        for (const stock of inventories.value[region.id]) {
          const amount = saved.inventories?.[region.id]?.find((item:InventoryItem) => item.ingredientId === stock.ingredientId)?.amount;
          if (Number.isFinite(amount) && amount >= 0) stock.amount = amount;
        }
        for (const bottle of bottleInventories.value[region.id]) {
          const quantity = saved.bottleInventories?.[region.id]?.find((item:BottleInventoryItem) => item.productId === bottle.productId)?.quantity;
          if (Number.isInteger(quantity) && quantity >= 0) bottle.quantity = quantity;
        }
      }
      if (typeof saved.dailyGiftClaimedKey === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(saved.dailyGiftClaimedKey)) dailyGiftClaimedKey.value = saved.dailyGiftClaimedKey;
      if (Number.isInteger(saved.loginStreak) && saved.loginStreak >= 0) loginStreak.value = saved.loginStreak;
      if (Array.isArray(saved.knownRecipeIds)) knownRecipeIds.value = [...new Set([...knownRecipeIds.value,...saved.knownRecipeIds.filter((id:string) => RECIPES.some((recipe) => recipe.id === id))])] as string[];
      if (saved.recipeUnlockSources) recipeUnlockSources.value = { ...recipeUnlockSources.value,...saved.recipeUnlockSources };
      if (Array.isArray(saved.deliveryOrders)) {
        const legacyShift = (Number.isInteger(saved.week) ? Math.max(1, saved.week) - 1 : 0) * 7 + (Number.isInteger(saved.day) ? Math.max(1, saved.day) : 1);
        deliveryOrders.value = saved.deliveryOrders
          .filter((order:DeliveryOrder & { dueShift?:number }) => REGIONS.some((item) => item.id === order.barId) && Array.isArray(order.items) && order.items.every((item) => INGREDIENTS.some((ingredient) => ingredient.id === item.ingredientId) && Number.isFinite(item.amount) && item.amount > 0))
          .map((order:DeliveryOrder & { dueShift?:number }) => ({
            id:order.id,supplier:order.supplier,barId:order.barId,items:order.items,total:order.total,
            dueAt:Number.isFinite(order.dueAt) ? order.dueAt : nowMs.value + Math.max(1,(order.dueShift ?? legacyShift + 1) - legacyShift) * DELIVERY_DAY_MS
          }));
      }
      if (Number.isFinite(saved.vipCooldownUntil) && saved.vipCooldownUntil >= 0) vipCooldownUntil.value = saved.vipCooldownUntil;
      if (Number.isFinite(saved.nextCustomerAt) && saved.nextCustomerAt >= 0) nextCustomerAt.value = saved.nextCustomerAt;
      if (Array.isArray(saved.customers)) {
        customers.value = saved.customers.filter((item:Customer) => item && typeof item.id === 'string' && RECIPES.some((recipe) => recipe.id === item.orderRecipeId)).slice(0, 1);
        activeCustomerId.value = customers.value[0]?.id ?? '';
        if (!customers.value.length && !nextCustomerAt.value) nextCustomerAt.value = nextCustomerArrival(nowMs.value);
      }
    }
  } catch { /* Corrupt or unavailable storage starts a fresh local game. */ }
  processDeliveries(nowMs.value);
  watch([money,xp,regionId,bars,inventories,bottleInventories,knownRecipeIds,recipeUnlockSources,dailyGiftClaimedKey,loginStreak,deliveryOrders,customers,nextCustomerAt,vipCooldownUntil], () => {
    try { localStorage.setItem(saveKey,JSON.stringify({version:1,money:money.value,xp:xp.value,regionId:regionId.value,bars:bars.value,inventories:inventories.value,bottleInventories:bottleInventories.value,knownRecipeIds:knownRecipeIds.value,recipeUnlockSources:recipeUnlockSources.value,dailyGiftClaimedKey:dailyGiftClaimedKey.value,loginStreak:loginStreak.value,deliveryOrders:deliveryOrders.value,customers:customers.value,activeCustomerId:activeCustomerId.value,nextCustomerAt:nextCustomerAt.value,vipCooldownUntil:vipCooldownUntil.value})); } catch { /* Gameplay remains available without storage. */ }
  }, { deep:true });

  return {
    regionId, region, money, xp, streak, level, serving, decor, bars, barBackground, barInteriorStyle,
    inventories, inventory, bottleInventories, bottleInventory, currentMix, shaken, customers, activeCustomerId, customer, hasCustomer, recipe, mixJudge,
    knownRecipeIds, recipeUnlockSources, knownRecipes, lockedRecipes, dailyGiftAvailable, dailyGiftResult, loginStreak, upcomingLoginDay, dailyCoinReward,
    conversationCustomerId, languageStats, nextCustomerAt, nextCustomerInSeconds, nextCustomerCountdown, vipCooldownUntil, orderCountdown, orderTimerPaused,
    message, market, selectedSupplier, transferTargetId, tradeLog, recipeCategory, filteredRecipes,
    pourBrands, brandOnShelf, shelfBrandsFor, setPourBrand, switchServeBrand,
    selectCustomer, addIngredient, resetMix, shakeCurrentMix, serveMix, tickPatience, tickGameClock, welcomeNextCustomer, offerSimilarOrder, rejectCustomer, buy, sell, switchBar, transferStock,
    supplier,purchaseCart,saleCart,purchaseQuote,saleQuote,saleRevenue,deliveryOrders,deliveryCountdown,selectSupplier,checkoutPurchase,checkoutSale,renameBar,renameBartender,
    buyRecipe, claimDailyGift, refreshDailyGift, openConversation, closeConversation, recordSentence, penalizeWrongGuess, confirmOrder, confirmBottleOrder, sellBottleToCustomer
  };
});
