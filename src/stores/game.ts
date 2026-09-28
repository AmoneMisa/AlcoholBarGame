import { computed, ref } from 'vue';
import { defineStore } from 'pinia';
import { INGREDIENTS, RECIPES, REGIONS, STARTING_INVENTORY } from '../domain/catalog';
import { canMake, consumeMix, createMarket, generateCustomer, judgeMix } from '../domain/engine';
import type { InventoryItem, RegionId, SupplierOffer } from '../domain/types';

const makeQueue = (level = 0) => Array.from({ length: 5 }, () => generateCustomer(level));

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
  const inventory = ref<InventoryItem[]>(structuredClone(STARTING_INVENTORY));
  const currentMix = ref<InventoryItem[]>([]);
  const shaken = ref(false);
  const customers = ref(makeQueue(2));
  const activeCustomerId = ref(customers.value[0]!.id);
  const message = ref('Choose a customer, read the request and build the cocktail.');
  const selectedSupplier = ref('global');
  const recipeCategory = ref<'all' | 'classic' | 'cocktail'>('all');
  const bartenderGender = ref<'female' | 'male'>('female');

  const level = computed(() => Math.max(1, Math.floor(xp.value / 60)));
  const region = computed(() => REGIONS.find((item) => item.id === regionId.value)!);
  const market = computed(() => createMarket(region.value, day.value));
  const customer = computed(() => customers.value.find((item) => item.id === activeCustomerId.value) ?? customers.value[0]!);
  const recipe = computed(() => judgeMix(currentMix.value, customer.value, shaken.value).recipe);
  const mixJudge = computed(() => judgeMix(currentMix.value, customer.value, shaken.value));
  const filteredRecipes = computed(() => recipeCategory.value === 'all' ? RECIPES : RECIPES.filter((item) => item.category === recipeCategory.value));

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
    customers.value.splice(index, 1, generateCustomer(level.value));
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
      message.value = 'Perfect service. Tip +' + region.value.currencySymbol + tip + '.';
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
    message.value = 'Stock updated.';
  }

  function nextDay() {
    money.value = Number((money.value - region.value.rentPerDay).toFixed(2));
    day.value += 1;
    if (day.value > 7) { day.value = 1; week.value += 1; }
    energy.value = 100;
    customers.value = makeQueue(level.value);
    activeCustomerId.value = customers.value[0]!.id;
    resetMix();
    message.value = 'New shift started.';
  }

  return {
    regionId, region, day, week, money, gems, energy, xp, streak, level, serving, decor,
    inventory, currentMix, shaken, customers, activeCustomerId, customer, recipe, mixJudge,
    message, market, selectedSupplier, recipeCategory, filteredRecipes, bartenderGender,
    selectCustomer, addIngredient, resetMix, shakeCurrentMix, serveMix, tickPatience, buy, nextDay
  };
});