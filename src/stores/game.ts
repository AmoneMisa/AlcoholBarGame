import { computed, ref } from 'vue';
import { defineStore } from 'pinia';
import { INGREDIENTS, RECIPES, REGIONS, STARTING_INVENTORY } from '../domain/catalog';
import { canMake, consumeMix, createMarket, generateCustomer, judgeMix } from '../domain/engine';
import type { InventoryItem, Recipe, RegionId, SupplierOffer } from '../domain/types';

const BASIC_RECIPE_COUNT = 10;
const makeQueue = (level = 0, recipes: Recipe[] = RECIPES) => Array.from({ length: 5 }, () => generateCustomer(level, recipes));
const makeSpecialCustomer = (recipe: Recipe, level = 0) => ({
  ...generateCustomer(level, [recipe]),
  name: 'Celeste',
  mood: 'vip' as const,
  greeting: 'I collect forgotten recipes.',
  request: `Make me a ${recipe.name}. Impress me and I will teach you the recipe.`,
  specialRecipeRewardId: recipe.id
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
  const gems = ref(35);
  const energy = ref(76);
  const xp = ref(720);
  const streak = ref(0);
  const serving = ref(false);
  const decor = ref({ wall: 'neon', counter: 'classic', bartender: 'vest' });
  const knownRecipeIds = ref<string[]>(RECIPES.slice(0, BASIC_RECIPE_COUNT).map((recipe) => recipe.id));
  const recipeUnlockSources = ref<Record<string, 'starter' | 'shop' | 'special-client' | 'daily-gift'>>(
    Object.fromEntries(knownRecipeIds.value.map((id) => [id, 'starter']))
  );
  const dailyGiftClaimedKey = ref('');
  const dailyGiftResult = ref('A new gift is available today.');
  const inventories = ref<Record<RegionId, InventoryItem[]>>(structuredClone(initialInventories));
  const inventory = computed<InventoryItem[]>({
    get: () => inventories.value[regionId.value],
    set: (value) => { inventories.value[regionId.value] = value; }
  });
  const currentMix = ref<InventoryItem[]>([]);
  const shaken = ref(false);
  const initialCustomers = makeQueue(2, RECIPES.slice(0, BASIC_RECIPE_COUNT));
  if (RECIPES[BASIC_RECIPE_COUNT]) initialCustomers[initialCustomers.length - 1] = makeSpecialCustomer(RECIPES[BASIC_RECIPE_COUNT]!, 2);
  const customers = ref(initialCustomers);
  const activeCustomerId = ref(customers.value[0]!.id);
  const message = ref('Choose a customer, read the request and build the cocktail.');
  const selectedSupplier = ref('global');
  const transferTargetId = ref<RegionId>('london');
  const tradeLog = ref<string[]>(['Each city bar now keeps its own stock.']);
  const recipeCategory = ref<'all' | 'classic' | 'cocktail'>('all');
  const bartenderGender = ref<'female' | 'male'>('female');

  const level = computed(() => Math.max(1, Math.floor(xp.value / 60)));
  const region = computed(() => REGIONS.find((item) => item.id === regionId.value)!);
  const market = computed(() => createMarket(region.value, day.value));
  const knownRecipes = computed(() => RECIPES.filter((recipe) => knownRecipeIds.value.includes(recipe.id)));
  const lockedRecipes = computed(() => RECIPES.filter((recipe) => !knownRecipeIds.value.includes(recipe.id)));
  const dailyGiftAvailable = computed(() => dailyGiftClaimedKey.value !== `${week.value}-${day.value}`);
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
      message.value = `You need ${region.value.currencySymbol}${price} to buy this recipe.`;
      return;
    }
    money.value = Number((money.value - price).toFixed(2));
    unlockRecipe(recipeId, 'shop');
    message.value = `${recipe.name} added to your recipe book.`;
  }

  function claimDailyGift() {
    if (!dailyGiftAvailable.value) {
      dailyGiftResult.value = 'Today’s gift has already been claimed.';
      return;
    }
    dailyGiftClaimedKey.value = `${week.value}-${day.value}`;
    const candidates = lockedRecipes.value;
    if (candidates.length && Math.random() < .12) {
      const recipe = candidates[Math.floor(Math.random() * candidates.length)]!;
      unlockRecipe(recipe.id, 'daily-gift');
      dailyGiftResult.value = `Lucky find: ${recipe.name} recipe unlocked!`;
      message.value = dailyGiftResult.value;
      return;
    }
    const coins = 25;
    money.value += coins;
    dailyGiftResult.value = `No recipe this time. You received ${coins} coins.`;
    message.value = dailyGiftResult.value;
  }

  function resetMix() {
    currentMix.value = [];
    shaken.value = false;
  }

  function selectCustomer(id: string) {
    activeCustomerId.value = id;
    resetMix();
    message.value = 'Customer selected. Read the order carefully.';
  }

  function replaceCustomer(id: string) {
    const index = customers.value.findIndex((item) => item.id === id);
    if (index < 0) return;
    customers.value.splice(index, 1, generateCustomer(level.value, knownRecipes.value));
    if (activeCustomerId.value === id) activeCustomerId.value = customers.value[index]!.id;
    resetMix();
  }

  function addIngredient(ingredientId: string) {
    const ingredient = INGREDIENTS.find((item) => item.id === ingredientId);
    if (!ingredient) return;
    const stock = inventory.value.find((item) => item.ingredientId === ingredientId);
    const used = currentMix.value.find((item) => item.ingredientId === ingredientId)?.amount ?? 0;
    if (!stock || stock.amount - used < ingredient.pourStep) {
      message.value = 'Not enough ' + ingredient.name + '.';
      return;
    }
    const current = currentMix.value.find((item) => item.ingredientId === ingredientId);
    if (current) current.amount += ingredient.pourStep;
    else currentMix.value.push({ ingredientId, amount: ingredient.pourStep });
    message.value = ingredient.name + ': +' + ingredient.pourStep + ' ' + ingredient.unit + '.';
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
      energy.value = Math.max(0, energy.value - 2);
      streak.value += 1;
      const rewardId = customer.value.specialRecipeRewardId;
      const unlocked = rewardId ? unlockRecipe(rewardId, 'special-client') : false;
      message.value = unlocked
        ? `Perfect service. ${verdict.recipe.name} was added to your recipe book!`
        : 'Perfect service. Tip +' + region.value.currencySymbol + tip + '.';
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
      item.patienceRemaining = Math.max(0, item.patienceRemaining - (item.id === activeCustomerId.value ? 1 : 0.35));
      if (item.patienceRemaining <= 0) expired.push(item.id);
    }
    for (const id of expired) replaceCustomer(id);
    if (expired.length) message.value = 'A customer left because the wait was too long.';
  }

  function buy(offer: SupplierOffer) {
    if (money.value < offer.price) {
      message.value = 'You do not have enough money.';
      return;
    }
    money.value = Number((money.value - offer.price).toFixed(2));
    const stock = inventory.value.find((item) => item.ingredientId === offer.ingredientId);
    if (stock) stock.amount += offer.quantity;
    const ingredient = INGREDIENTS.find((item) => item.id === offer.ingredientId)!;
    const note = `Bought ${offer.quantity} ${ingredient.unit} ${ingredient.name} from ${offer.supplier}.`;
    tradeLog.value.unshift(note);
    message.value = note;
  }

  function sell(ingredientId: string) {
    const ingredient = INGREDIENTS.find((item) => item.id === ingredientId);
    const stock = inventory.value.find((item) => item.ingredientId === ingredientId);
    if (!ingredient || !stock) return;
    const quantity = ingredient.unit === 'ml' ? Math.min(250, stock.amount) : Math.min(6, stock.amount);
    if (quantity <= 0) {
      message.value = `No ${ingredient.name} available to sell.`;
      return;
    }
    const revenue = Number((ingredient.basePrice * quantity * region.value.marketFactor * .55).toFixed(2));
    stock.amount -= quantity;
    money.value = Number((money.value + revenue).toFixed(2));
    const note = `Sold ${quantity} ${ingredient.unit} ${ingredient.name} for ${region.value.currencySymbol}${revenue.toFixed(2)}.`;
    tradeLog.value.unshift(note);
    message.value = note;
  }

  function switchBar(id: RegionId) {
    if (id === regionId.value) return;
    regionId.value = id;
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
    const quantity = ingredient.unit === 'ml' ? Math.min(100, source.amount) : Math.min(3, source.amount);
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
    money.value = Number((money.value - region.value.rentPerDay).toFixed(2));
    day.value += 1;
    if (day.value > 7) { day.value = 1; week.value += 1; }
    energy.value = 100;
    customers.value = makeQueue(level.value, knownRecipes.value);
    if (lockedRecipes.value.length && Math.random() < .35) {
      customers.value[customers.value.length - 1] = makeSpecialCustomer(lockedRecipes.value[0]!, level.value);
    }
    activeCustomerId.value = customers.value[0]!.id;
    resetMix();
    message.value = 'New shift started.';
  }

  return {
    regionId, region, day, week, money, gems, energy, xp, streak, level, serving, decor,
    inventories, inventory, currentMix, shaken, customers, activeCustomerId, customer, recipe, mixJudge,
    knownRecipeIds, recipeUnlockSources, knownRecipes, lockedRecipes, dailyGiftAvailable, dailyGiftResult,
    message, market, selectedSupplier, transferTargetId, tradeLog, recipeCategory, filteredRecipes, bartenderGender,
    selectCustomer, addIngredient, resetMix, shakeCurrentMix, serveMix, tickPatience, buy, sell, switchBar, transferStock,
    buyRecipe, claimDailyGift, nextDay
  };
});
