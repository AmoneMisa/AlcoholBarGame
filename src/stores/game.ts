import { computed, ref, watch } from 'vue';
import { defineStore } from 'pinia';
import { INGREDIENTS, RECIPES, REGIONS, STARTING_INVENTORY, SUPPLIERS } from '../domain/catalog';
import { calendarDate, coins, consecutiveDays, dailyCoinsFor, quotePurchase } from '../domain/economy';
import { withArticle } from '../domain/english/articles';
import { DEFAULT_BARS, INTERIORS, type BarProfile } from '../data/cosmetics/bars';
import { CUSTOMER_ART_BY_SLOT } from '../data/cosmetics/artCatalog';
import { canMake, consumeMix, createMarket, generateCustomer, judgeMix } from '../domain/engine';
import type { Customer, InventoryItem, Recipe, RegionId, SupplierOffer } from '../domain/types';

const BASIC_RECIPE_COUNT = 10;
function uniqueLook(customer: Customer, others: Customer[]) {
  const used = new Set(others.map((item) => item.characterId));
  if (!customer.characterId || used.has(customer.characterId)) customer.characterId = CUSTOMER_ART_BY_SLOT.find((id) => !used.has(id));
  return customer;
}
const makeQueue = (level = 0, recipes: Recipe[] = RECIPES) => {
  const queue = Array.from({ length: 5 }, () => generateCustomer(level, recipes));
  const used = new Set<string>();
  for (const customer of queue) {
    if (!customer.characterId || used.has(customer.characterId)) customer.characterId = CUSTOMER_ART_BY_SLOT.find((id) => !used.has(id));
    if (customer.characterId) used.add(customer.characterId);
  }
  return queue;
};
const makeSpecialCustomer = (recipe: Recipe, level = 0) => ({
  ...generateCustomer(level, [recipe]),
  name: 'Celeste',
  mood: 'vip' as const,
  greeting: 'I collect forgotten recipes.',
  request: `Make me ${withArticle(recipe.name)}. Impress me and I will teach you the recipe.`,
  specialRecipeRewardId: recipe.id,
  orderRevealed: true
});
const makeBarInventory = (barIndex: number) => STARTING_INVENTORY.map((item, ingredientIndex) => {
  const ingredient = INGREDIENTS.find((entry) => entry.id === item.ingredientId)!;
  const factor = .48 + ((barIndex * 3 + ingredientIndex) % 6) * .11;
  const floor = ingredient.unit === 'ml' ? 90 : 4;
  return { ...item, amount: Math.max(floor, Math.round(item.amount * factor)) };
});
const initialInventories = Object.fromEntries(REGIONS.map((region, index) => [region.id, makeBarInventory(index)])) as Record<RegionId, InventoryItem[]>;

export const useGameStore = defineStore('game', () => {
  const regionId = ref<RegionId>('new-york');
  const day = ref(1);
  const week = ref(2);
  const money = ref(1240);
  const xp = ref(720);
  const streak = ref(0);
  const serving = ref(false);
  const bars = ref<Record<RegionId, BarProfile>>(structuredClone(DEFAULT_BARS));
  const decor = computed(() => bars.value[regionId.value]);
  const barBackground = computed(() => INTERIORS.find((item) => item.id === decor.value.interior)?.asset ?? INTERIORS[0].asset);
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
  const shaken = ref(false);
  const initialCustomers = makeQueue(2, RECIPES.slice(0, BASIC_RECIPE_COUNT));
  if (RECIPES[BASIC_RECIPE_COUNT]) initialCustomers[initialCustomers.length - 1] = uniqueLook(makeSpecialCustomer(RECIPES[BASIC_RECIPE_COUNT]!, 2), initialCustomers.slice(0,-1));
  const customers = ref(initialCustomers);
  const activeCustomerId = ref(customers.value[0]!.id);
  const conversationCustomerId = ref<string>();
  const languageStats = ref({ sentences: 0, correct: 0 });
  const message = ref('Tap a customer to talk, find out what they want, then build the cocktail.');
  const selectedSupplier = ref('global');
  const purchaseCart = ref<Record<string,number>>({});
  const saleCart = ref<Record<string,number>>({});
  const deliveryOrders = ref<{ id:string; supplier:string; barId:RegionId; dueShift:number; items:InventoryItem[]; total:number }[]>([]);
  const transferTargetId = ref<RegionId>('london');
  const tradeLog = ref<string[]>(['Each city bar now keeps its own stock.']);
  const recipeCategory = ref<'all' | 'classic' | 'cocktail'>('all');
  const bartenderGender = ref<'female' | 'male'>('female');

  const level = computed(() => Math.max(1, Math.floor(xp.value / 60)));
  const region = computed(() => REGIONS.find((item) => item.id === regionId.value)!);
  const market = computed(() => createMarket(region.value, day.value));
  const knownRecipes = computed(() => RECIPES.filter((recipe) => knownRecipeIds.value.includes(recipe.id)));
  const lockedRecipes = computed(() => RECIPES.filter((recipe) => !knownRecipeIds.value.includes(recipe.id)));
  const dailyGiftAvailable = computed(() => dailyGiftClaimedKey.value !== today.value);
  const currentShift = computed(() => (week.value - 1) * 7 + day.value);
  const supplier = computed(() => SUPPLIERS.find((item) => item.id === selectedSupplier.value) ?? SUPPLIERS[0]!);
  const purchaseQuote = computed(() => quotePurchase(market.value, purchaseCart.value, supplier.value));
  const saleQuote = computed(() => INGREDIENTS.filter((item) => Number.isFinite(saleCart.value[item.id]) && saleCart.value[item.id] >= 1).map((item) => {
    const quantity = Math.max(0, Math.floor(saleCart.value[item.id]!));
    const available = Math.max(0, (inventory.value.find((stock) => stock.ingredientId === item.id)?.amount ?? 0) - (currentMix.value.find((mix) => mix.ingredientId === item.id)?.amount ?? 0));
    return { ingredientId:item.id,quantity,available,revenue:coins(item.basePrice * quantity * region.value.marketFactor * .55) };
  }));
  const saleRevenue = computed(() => coins(saleQuote.value.reduce((sum,line) => sum + line.revenue,0)));
  const customer = computed(() => customers.value.find((item) => item.id === activeCustomerId.value) ?? customers.value[0]!);
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
  }

  function selectCustomer(id: string) {
    if (activeCustomerId.value === id) return;
    activeCustomerId.value = id;
    resetMix();
    message.value = 'Customer selected. Talk to them to find the right drink.';
  }

  function openConversation(id: string) {
    selectCustomer(id);
    conversationCustomerId.value = id;
  }

  function closeConversation() {
    conversationCustomerId.value = undefined;
  }

  // Every sentence the player sends is scored; correct English earns XP, mistakes cost a little patience.
  function recordSentence(correct: boolean) {
    languageStats.value.sentences++;
    if (correct) {
      languageStats.value.correct++;
      xp.value += 3;
    } else {
      customer.value.patienceRemaining = Math.max(1, customer.value.patienceRemaining - 3);
    }
  }

  function penalizeWrongGuess() {
    customer.value.patienceRemaining = Math.max(1, customer.value.patienceRemaining - 6);
  }

  function confirmOrder(id: string) {
    const target = customers.value.find((item) => item.id === id);
    if (!target) return;
    target.orderRevealed = true;
    xp.value += 10;
    message.value = `${target.name} ordered: ${RECIPES.find((item) => item.id === target.orderRecipeId)?.name ?? 'a drink'}. Time to mix!`;
  }

  function replaceCustomer(id: string) {
    const index = customers.value.findIndex((item) => item.id === id);
    if (index < 0) return;
    const replacement = uniqueLook(generateCustomer(level.value, knownRecipes.value), customers.value.filter((item) => item.id !== id));
    customers.value.splice(index, 1, replacement);
    if (activeCustomerId.value === id) {
      activeCustomerId.value = replacement.id;
      resetMix();
    }
  }

  function addIngredient(ingredientId: string, requestedAmount?: number) {
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
    if (!currentMix.value.length) {
      message.value = 'Build the drink first.';
      return;
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
      const tip = customer.value.mood === 'vip' || customer.value.mood === 'wealthy' ? Math.ceil(revenue * 0.25) : Math.ceil(revenue * 0.12);
      money.value = Number((money.value + revenue + tip).toFixed(2));
      xp.value += 22 + Math.min(streak.value * 2, 14);
      streak.value += 1;
      const rewardId = customer.value.specialRecipeRewardId;
      const unlocked = rewardId ? unlockRecipe(rewardId, 'special-client') : false;
      message.value = unlocked
        ? `Perfect service. ${verdict.recipe.name} was added to your recipe book!`
        : 'Perfect service. Tip +' + tip + ' coins.';
      const servedId = customer.value.id;
      window.setTimeout(() => {
        replaceCustomer(servedId);
        serving.value = false;
      }, 650);
      return;
    }

    streak.value = 0;
    customer.value.patienceRemaining = Math.max(0, customer.value.patienceRemaining - 18);
    message.value = verdict.shakeOk ? 'Wrong drink. Check the ingredients.' : 'This recipe needs shaking.';
    resetMix();
    serving.value = false;
  }

  function tickPatience() {
    if (serving.value) return;
    const expired: string[] = [];
    for (const item of customers.value) {
      if (item.id === conversationCustomerId.value) continue;
      item.patienceRemaining = Math.max(0, item.patienceRemaining - (item.id === activeCustomerId.value ? 1 : 0.35));
      if (item.patienceRemaining <= 0) expired.push(item.id);
    }
    for (const id of expired) replaceCustomer(id);
    if (expired.length) message.value = 'A customer left because the wait was too long.';
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
    deliveryOrders.value.push({ id:crypto.randomUUID(),supplier:supplier.value.name,barId:regionId.value,dueShift:currentShift.value + supplier.value.deliveryDays,items:quote.lines.map((line) => ({ingredientId:line.ingredientId,amount:line.amount})),total:quote.total });
    const note = `Ordered ${quote.packs} packs from ${supplier.value.name} for ${quote.total.toFixed(2)} coins. Delivery in ${supplier.value.deliveryDays} shifts.`;
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

  function nextDay() {
    if (money.value < region.value.rentPerDay) { message.value = 'You need enough coins to pay rent before the next shift.'; return; }
    money.value = Number((money.value - region.value.rentPerDay).toFixed(2));
    day.value += 1;
    if (day.value > 7) { day.value = 1; week.value += 1; }
    const arrived = deliveryOrders.value.filter((order) => order.dueShift <= currentShift.value);
    for (const order of arrived) for (const item of order.items) {
      const stock = inventories.value[order.barId].find((entry) => entry.ingredientId === item.ingredientId);
      if (stock) stock.amount += item.amount;
    }
    deliveryOrders.value = deliveryOrders.value.filter((order) => order.dueShift > currentShift.value);
    purchaseCart.value = {};
    saleCart.value = {};
    customers.value = makeQueue(level.value, knownRecipes.value);
    if (lockedRecipes.value.length && Math.random() < .35) {
      customers.value[customers.value.length - 1] = uniqueLook(makeSpecialCustomer(lockedRecipes.value[0]!, level.value), customers.value.slice(0,-1));
    }
    activeCustomerId.value = customers.value[0]!.id;
    closeConversation();
    resetMix();
    message.value = arrived.length ? `${arrived.length} deliveries arrived. New shift started.` : 'New shift started.';
  }

  // Local save: login gifts use the calendar, while supplier routes use game shifts.
  const saveKey = 'barlingo-economy-v1';
  try {
    const saved = JSON.parse(localStorage.getItem(saveKey) ?? 'null');
    if (saved?.version === 1) {
      if (Number.isFinite(saved.money) && saved.money >= 0) money.value = saved.money;
      if (Number.isFinite(saved.xp) && saved.xp >= 0) xp.value = saved.xp;
      if (Number.isInteger(saved.day) && saved.day >= 1 && saved.day <= 7) day.value = saved.day;
      if (Number.isInteger(saved.week) && saved.week >= 1) week.value = saved.week;
      if (REGIONS.some((item) => item.id === saved.regionId)) regionId.value = saved.regionId;
      for (const region of REGIONS) {
        const profile = saved.bars?.[region.id];
        if (profile && typeof profile.name === 'string') {
          bars.value[region.id].name = profile.name.trim().slice(0,32) || DEFAULT_BARS[region.id].name;
          for (const key of ['wall','counter','lighting','bartender','interior'] as const) {
            const allowed = { wall:['neon','burgundy','emerald'],counter:['classic','marble','brass'],lighting:['amber','rose','blue'],bartender:['vest','shirt','apron'],interior:['velvet','garden','skyline'] }[key];
            if (allowed.includes(profile[key])) (bars.value[region.id] as unknown as Record<string,string>)[key] = profile[key];
          }
        }
        for (const stock of inventories.value[region.id]) {
          const amount = saved.inventories?.[region.id]?.find((item:InventoryItem) => item.ingredientId === stock.ingredientId)?.amount;
          if (Number.isFinite(amount) && amount >= 0) stock.amount = amount;
        }
      }
      if (typeof saved.dailyGiftClaimedKey === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(saved.dailyGiftClaimedKey)) dailyGiftClaimedKey.value = saved.dailyGiftClaimedKey;
      if (Number.isInteger(saved.loginStreak) && saved.loginStreak >= 0) loginStreak.value = saved.loginStreak;
      if (Array.isArray(saved.knownRecipeIds)) knownRecipeIds.value = [...new Set([...knownRecipeIds.value,...saved.knownRecipeIds.filter((id:string) => RECIPES.some((recipe) => recipe.id === id))])] as string[];
      if (saved.recipeUnlockSources) recipeUnlockSources.value = { ...recipeUnlockSources.value,...saved.recipeUnlockSources };
      if (Array.isArray(saved.deliveryOrders)) deliveryOrders.value = saved.deliveryOrders.filter((order:typeof deliveryOrders.value[number]) => REGIONS.some((item) => item.id === order.barId) && Number.isInteger(order.dueShift) && Array.isArray(order.items) && order.items.every((item) => INGREDIENTS.some((ingredient) => ingredient.id === item.ingredientId) && Number.isFinite(item.amount) && item.amount > 0));
    }
  } catch { /* Corrupt or unavailable storage starts a fresh local game. */ }
  watch([money,xp,day,week,regionId,bars,inventories,knownRecipeIds,recipeUnlockSources,dailyGiftClaimedKey,loginStreak,deliveryOrders], () => {
    try { localStorage.setItem(saveKey,JSON.stringify({version:1,money:money.value,xp:xp.value,day:day.value,week:week.value,regionId:regionId.value,bars:bars.value,inventories:inventories.value,knownRecipeIds:knownRecipeIds.value,recipeUnlockSources:recipeUnlockSources.value,dailyGiftClaimedKey:dailyGiftClaimedKey.value,loginStreak:loginStreak.value,deliveryOrders:deliveryOrders.value})); } catch { /* Gameplay remains available without storage. */ }
  }, { deep:true });

  return {
    regionId, region, day, week, money, xp, streak, level, serving, decor, bars, barBackground,
    inventories, inventory, currentMix, shaken, customers, activeCustomerId, customer, recipe, mixJudge,
    knownRecipeIds, recipeUnlockSources, knownRecipes, lockedRecipes, dailyGiftAvailable, dailyGiftResult, loginStreak, upcomingLoginDay, dailyCoinReward,
    conversationCustomerId, languageStats,
    message, market, selectedSupplier, transferTargetId, tradeLog, recipeCategory, filteredRecipes, bartenderGender,
    selectCustomer, addIngredient, resetMix, shakeCurrentMix, serveMix, tickPatience, buy, sell, switchBar, transferStock,
    supplier,purchaseCart,saleCart,purchaseQuote,saleQuote,saleRevenue,deliveryOrders,currentShift,selectSupplier,checkoutPurchase,checkoutSale,renameBar,
    buyRecipe, claimDailyGift, refreshDailyGift, nextDay, openConversation, closeConversation, recordSentence, penalizeWrongGuess, confirmOrder
  };
});
