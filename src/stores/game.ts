import { computed, ref } from 'vue';
import { defineStore } from 'pinia';
import { INGREDIENTS, RECIPES, REGIONS, STARTING_INVENTORY } from '../domain/catalog';
import { canMake, createMarket, generateCustomer, useIngredients } from '../domain/engine';
import type { InventoryItem, RegionId, SupplierOffer } from '../domain/types';

export const useGameStore = defineStore('game', () => {
  const regionId = ref<RegionId>('london');
  const day = ref(1);
  const money = ref(120);
  const xp = ref(0);
  const streak = ref(0);
  const serving = ref(false);
  const tab = ref<'bar' | 'market' | 'learn' | 'design'>('bar');
  const decor = ref({ wall: 'burgundy', counter: 'classic', bartender: 'vest' });
  const inventory = ref<InventoryItem[]>(structuredClone(STARTING_INVENTORY));
  const level = computed(() => Math.floor(xp.value / 80));
  const customer = ref(generateCustomer(level.value));
  const message = ref('Read the customer request. Then make the drink.');
  const region = computed(() => REGIONS.find((item) => item.id === regionId.value)!);
  const market = computed(() => createMarket(region.value, day.value));

  function serve() {
    if (!canMake(inventory.value, customer.value)) {
      message.value = 'Not enough ingredients. Go to Market.';
      streak.value = 0;
      return;
    }
    serving.value = true;
    inventory.value = useIngredients(inventory.value, customer.value);
    const recipe = RECIPES.find((item) => item.id === customer.value.orderRecipeId)!;
    const revenue = Number((recipe.price * region.value.marketFactor).toFixed(2));
    money.value = Number((money.value + revenue).toFixed(2));
    xp.value += 18 + Math.min(streak.value * 2, 12);
    streak.value += 1;
    message.value = 'Correct. “Here you are.” +' + region.value.currencySymbol + revenue;
    window.setTimeout(() => {
      customer.value = generateCustomer(level.value);
      serving.value = false;
    }, 650);
  }

  function buy(offer: SupplierOffer) {
    if (money.value < offer.price) {
      message.value = 'You do not have enough money.';
      return;
    }
    money.value = Number((money.value - offer.price).toFixed(2));
    const stock = inventory.value.find((item) => item.ingredientId === offer.ingredientId);
    if (stock) stock.amount += offer.quantity;
    else inventory.value.push({ ingredientId: offer.ingredientId, amount: offer.quantity });
    message.value = 'Bought ' + INGREDIENTS.find((item) => item.id === offer.ingredientId)?.name + '.';
  }

  function nextDay() {
    money.value = Number((money.value - region.value.rentPerDay).toFixed(2));
    day.value += 1;
    streak.value = 0;
    customer.value = generateCustomer(level.value);
    message.value = 'Day ' + day.value + '. New market prices are available.';
  }

  return { regionId, region, day, money, xp, streak, level, serving, tab, decor, inventory, customer, message, market, serve, buy, nextDay };
});
