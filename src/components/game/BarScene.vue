<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue';
import { CUSTOMER_ART_BY_SLOT } from '../../data/cosmetics/artCatalog';
import { INGREDIENTS, RECIPES } from '../../domain/catalog';
import { ALCOHOL_PRODUCTS } from '../../domain/bottleCatalog';
import { buildProfile, shortWish } from '../../domain/conversation/customerTalk';
import type { Customer } from '../../domain/types';
import type { CharacterExpression } from '../../domain/dialogue/types';
import { useGameStore } from '../../stores/game';
import { haptic } from '../../telegram/webapp';
import BottleModel from '../cocktails/BottleModel.vue';
import GlassModel from '../cocktails/GlassModel.vue';
import CharacterModel from '../characters/CharacterModel.vue';
import CityEvent from './CityEvent.vue';

const game = useGameStore();
withDefaults(defineProps<{ active?: boolean }>(), { active: true });
const glassTarget = ref<HTMLElement>();
const freshPickerOpen = ref(false);
const draggingIngredientId = ref<string>();
const dragOverGlass = ref(false);
const dragAdded = ref(false);
const pointerX = ref(0);
const pointerY = ref(0);
let activePointerId: number | undefined;
let pourInterval: number | undefined;

const liquidIngredients = computed(() => INGREDIENTS.filter((item) => item.unit === 'ml'));
// The back bar has four shelf lines, all visible at once, so every bottle can be reached without scrolling.
const SHELF_LINES = [
  { id: 'spirits', label: 'Spirits & wine', ids: ['white-rum', 'dark-rum', 'gin', 'vodka', 'tequila', 'whiskey', 'sparkling-wine', 'fruit-wine'] },
  { id: 'liqueurs', label: 'Liqueurs & aperitifs', ids: ['orange-liqueur', 'vermouth', 'bitter-aperitif', 'coffee-liqueur', 'blue-curacao', 'herbal-liqueur', 'specialty-liqueur'] },
  { id: 'juices', label: 'Juices, syrups & cream', ids: ['lime-juice', 'lemon-juice', 'pineapple-juice', 'cranberry-juice', 'sugar-syrup', 'coconut-cream', 'milk', 'coconut-milk'] },
  { id: 'mixers', label: 'Mixers & sodas', ids: ['tonic', 'soda', 'cola', 'ginger-beer', 'grapefruit-soda', 'alcohol-free-beer'] }
];
const shelfLines = computed(() => {
  const liquids = liquidIngredients.value;
  const placed = new Set(SHELF_LINES.flatMap((line) => line.ids));
  const lines = SHELF_LINES.map((line) => ({ ...line, bottles: line.ids.map((id) => liquids.find((item) => item.id === id)).filter((item): item is NonNullable<typeof item> => !!item) }));
  // A liquid added to the catalog later still gets a place: on the mixers line.
  lines[lines.length - 1]!.bottles.push(...liquids.filter((item) => !placed.has(item.id)));
  return lines.filter((line) => line.bottles.length);
});
// What is left in the bar for pouring: stock minus what is already in the glass.
function pourable(id: string) {
  const stock = game.inventory.find((item) => item.ingredientId === id)?.amount ?? 0;
  const inGlass = game.currentMix.find((item) => item.ingredientId === id)?.amount ?? 0;
  return Math.max(0, stock - inGlass);
}
const freshIngredients = computed(() => INGREDIENTS.filter((item) => item.unit === 'piece'));
const buildingEnabled = computed(() => game.hasCustomer && game.customer.orderKind !== 'bottle');
const totalAmount = computed(() => game.currentMix.reduce((sum, item) => sum + (INGREDIENTS.find((entry) => entry.id === item.ingredientId)?.unit === 'ml' ? item.amount : 0), 0));
const itemCount = computed(() => game.currentMix.reduce((sum, item) => sum + (INGREDIENTS.find((entry) => entry.id === item.ingredientId)?.unit === 'piece' ? item.amount : 0), 0));
const fill = computed(() => Math.min(91, totalAmount.value / 240 * 91));
const ice = computed(() => game.currentMix.find((item) => item.ingredientId === 'ice')?.amount ?? 0);
const hasBubbles = computed(() => game.currentMix.some((item) => ['soda', 'tonic', 'ginger-beer', 'grapefruit-soda', 'sparkling-wine'].includes(item.ingredientId)));
const garnish = computed(() => game.currentMix.some((item) => item.ingredientId === 'mint') ? 'mint' : game.currentMix.some((item) => ['lime-wedge', 'orange', 'pineapple-wedge'].includes(item.ingredientId)) ? 'citrus' : '');
const selectedIngredient = computed(() => INGREDIENTS.find((item) => item.id === draggingIngredientId.value));
const selectedAmount = computed(() => draggingIngredientId.value ? game.currentMix.find((item) => item.ingredientId === draggingIngredientId.value)?.amount : undefined);

const colorMap: Record<string, string> = {
  'white-rum': '#e9e1b5', 'dark-rum': '#8a3e1f', gin: '#dce8d7', vodka: '#dce7ed', tequila: '#e5c675', whiskey: '#a94e21',
  'orange-liqueur': '#ed8c28', vermouth: '#d9b071', 'bitter-aperitif': '#cb3740', 'sparkling-wine': '#f1d784', 'coffee-liqueur': '#4a2119',
  'lime-juice': '#a9cf54', 'lemon-juice': '#ead45a', 'pineapple-juice': '#edbd3c', 'cranberry-juice': '#cc3152', 'sugar-syrup': '#f2e6c0',
  'blue-curacao': '#169bd5', 'herbal-liqueur': '#557137', 'specialty-liqueur': '#8cbf39', 'fruit-wine': '#cb526e', 'alcohol-free-beer': '#d6aa32',
  'coconut-cream': '#efe6d4', milk: '#f4f0e8', 'coconut-milk': '#eee5d7', tonic: '#d8e8dc', soda: '#dbe9e8', cola: '#572a1e', 'ginger-beer': '#d59535', 'grapefruit-soda': '#e88779'
};
const liquidColor = computed(() => {
  const liquids = game.currentMix.filter((item) => INGREDIENTS.find((ingredient) => ingredient.id === item.ingredientId)?.unit === 'ml');
  if (!liquids.length) return '#b86b36';
  const total = liquids.reduce((sum, item) => sum + item.amount, 0) || 1;
  const rgb = liquids.reduce((channels, item) => {
    const hex = colorMap[item.ingredientId] ?? '#d7c88c';
    channels[0] += parseInt(hex.slice(1, 3), 16) * item.amount;
    channels[1] += parseInt(hex.slice(3, 5), 16) * item.amount;
    channels[2] += parseInt(hex.slice(5, 7), 16) * item.amount;
    return channels;
  }, [0, 0, 0]);
  return `rgb(${rgb.map((channel) => Math.round(channel / total)).join(',')})`;
});

const expressionFor = (mood: string): CharacterExpression => ({
  calm: 'neutral', friendly: 'smile', impatient: 'impatient', angry: 'angry', sad: 'worried', tired: 'thinking', shy: 'embarrassed', confused: 'confused', wealthy: 'impressed', vip: 'smile'
}[mood] as CharacterExpression ?? 'neutral');
function bubbleText(customer: Customer) {
  if (customer.orderRevealed) return customer.request;
  if (customer.wish) return customer.wish;
  if (customer.orderKind === 'bottle') return `I need bottles for a ${customer.bottleRequest?.occasion ?? 'special occasion'}.`;
  const recipe = RECIPES.find((item) => item.id === customer.orderRecipeId);
  return recipe ? shortWish(buildProfile(recipe)) : customer.request;
}
function patience(value: number, total: number) { return Math.max(0, Math.min(100, value / total * 100)); }
function setRequestedBrand(id: string) {
  if (game.customer.orderKind !== 'serve') return;
  const product = ALCOHOL_PRODUCTS.find((item) => item.id === game.customer.serveRequest?.productId);
  if (product?.ingredientId === id) game.setPourBrand(id, product.id);
}
function addLiquid(id: string) {
  if (pourable(id) < 5) return false;
  setRequestedBrand(id);
  game.addIngredient(id, 5);
  dragAdded.value = true;
  haptic('light');
  return true;
}
function addFresh(id: string) {
  game.addIngredient(id, 1);
  freshPickerOpen.value = false;
  haptic('light');
}
// A press on a shelf bottle is a scroll or a grab, decided by the first few pixels of movement:
// mostly sideways scrolls that shelf line, mostly up or down lifts the bottle towards the glass.
const GESTURE_SLOP = 7;
let pending: { id: string; startX: number; startY: number; row?: HTMLElement; box?: HTMLElement; scrollLeft: number; scrollTop: number; mode?: 'scroll' } | undefined;

function beginBottleDrag(id: string, event: PointerEvent) {
  if (event.button !== 0 || !buildingEnabled.value) return;
  // No native image drag, text selection or page scroll while a bottle is under the finger.
  event.preventDefault();
  const target = event.currentTarget as HTMLElement;
  const row = target.closest<HTMLElement>('.live-bottle-shelf') ?? undefined;
  const box = target.closest<HTMLElement>('.live-shelf-lines') ?? undefined;
  pending = { id, startX: event.clientX, startY: event.clientY, row, box, scrollLeft: row?.scrollLeft ?? 0, scrollTop: box?.scrollTop ?? 0 };
  activePointerId = event.pointerId;
  // Capture keeps the gesture alive outside the button; if the browser refuses it, window listeners still track the pointer.
  try { target.setPointerCapture?.(event.pointerId); } catch { /* not capturable */ }
}
function liftBottle(id: string, event: PointerEvent) {
  if (pourable(id) < 5) {
    game.message = `The ${INGREDIENTS.find((item) => item.id === id)?.name ?? 'bottle'} is empty. Restock it in the market.`;
    haptic('light');
    activePointerId = undefined;
    return;
  }
  draggingIngredientId.value = id;
  dragAdded.value = false;
  pointerX.value = event.clientX;
  pointerY.value = event.clientY;
  haptic('light');
  window.clearInterval(pourInterval);
  pourInterval = window.setInterval(() => {
    if (!dragOverGlass.value || !draggingIngredientId.value) return;
    // The bottle ran dry mid-pour: stop, once, instead of repeating the warning.
    if (!addLiquid(draggingIngredientId.value)) {
      window.clearInterval(pourInterval);
      game.message = `The ${selectedIngredient.value?.name ?? 'bottle'} is empty.`;
    }
  }, 180);
}
function moveBottle(event: PointerEvent) {
  if (activePointerId !== event.pointerId) return;
  if (pending) {
    const dx = event.clientX - pending.startX;
    const dy = event.clientY - pending.startY;
    if (!pending.mode) {
      if (Math.max(Math.abs(dx), Math.abs(dy)) < GESTURE_SLOP) return;
      if (Math.abs(dx) > Math.abs(dy)) pending.mode = 'scroll';
      else {
        const id = pending.id;
        pending = undefined;
        liftBottle(id, event);
        if (!draggingIngredientId.value) return;
      }
    }
    if (pending?.mode === 'scroll') {
      if (pending.row) pending.row.scrollLeft = pending.scrollLeft - dx;
      return;
    }
  }
  if (!glassTarget.value || !draggingIngredientId.value) return;
  pointerX.value = event.clientX;
  pointerY.value = event.clientY;
  const rect = glassTarget.value.getBoundingClientRect();
  dragOverGlass.value = event.clientX >= rect.left && event.clientX <= rect.right && event.clientY >= rect.top && event.clientY <= rect.bottom;
}
function endBottle(event: PointerEvent) {
  if (activePointerId !== event.pointerId) return;
  pending = undefined;
  window.clearInterval(pourInterval);
  if (event.type !== 'pointercancel' && dragOverGlass.value && !dragAdded.value && draggingIngredientId.value) addLiquid(draggingIngredientId.value);
  draggingIngredientId.value = undefined;
  dragOverGlass.value = false;
  activePointerId = undefined;
}

const interval = window.setInterval(() => { if (!document.hidden) game.tickGameClock(); }, 1000);
onMounted(() => {
  window.addEventListener('pointermove', moveBottle);
  window.addEventListener('pointerup', endBottle);
  window.addEventListener('pointercancel', endBottle);
});
onBeforeUnmount(() => {
  window.clearInterval(interval);
  window.clearInterval(pourInterval);
  window.removeEventListener('pointermove', moveBottle);
  window.removeEventListener('pointerup', endBottle);
  window.removeEventListener('pointercancel', endBottle);
});
</script>

<template>
  <section class="bar-scene" :class="{ 'is-building': buildingEnabled }" :data-wall="game.decor.wall" :data-counter="game.decor.counter" :data-counter-color="game.decor.counterColor" :data-counter-size="game.decor.counterSize" :data-lighting="game.decor.lighting" :data-highlight-strength="game.decor.highlightStrength" :style="game.barInteriorStyle">
    <div class="scene-light scene-light-left"></div><div class="scene-light scene-light-right"></div>
    <CityEvent compact />
    <section v-if="buildingEnabled" class="live-backbar" aria-label="Bottle shelf">
      <header><span><b>BACK BAR</b><small>Swipe a line sideways to browse · pull a bottle down to the glass (+5 ml while held)</small></span></header>
      <div class="live-shelf-lines">
        <div v-for="line in shelfLines" :key="line.id" class="live-shelf-line" :data-line="line.id">
          <small class="live-shelf-label">{{ line.label }}</small>
          <div class="live-bottle-shelf">
            <button v-for="ingredient in line.bottles" :key="ingredient.id" type="button" :class="{ empty: pourable(ingredient.id) < 5, poured: game.currentMix.some((item) => item.ingredientId === ingredient.id) }" :aria-disabled="pourable(ingredient.id) < 5" :aria-label="`Drag ${ingredient.name} to the glass, ${pourable(ingredient.id)} ml left`" @pointerdown="beginBottleDrag(ingredient.id, $event)" @keydown.enter.prevent="addLiquid(ingredient.id)" @keydown.space.prevent="addLiquid(ingredient.id)">
              <BottleModel :ingredient="ingredient" :amount="game.currentMix.find((item) => item.ingredientId === ingredient.id)?.amount" />
              <span>{{ ingredient.name }}</span>
              <em>{{ pourable(ingredient.id) }} ml</em>
            </button>
          </div>
        </div>
      </div>
    </section>
    <div class="bartender-layer">
      <CharacterModel role="bartender" :character-id="game.decor.bartenderCharacter ?? 'noa'" :outfit="game.decor.bartender" :face-style="game.decor.face" :hair-style="game.decor.hairStyle" :hair-color="game.decor.hairColor" :body-shape="game.decor.bodyShape" :skin-detail="game.decor.skinDetail" :bust="game.decor.bust" :pose="game.decor.pose" :makeup="game.decor.makeup" animation="idle" />
      <span class="name-ribbon">{{ (game.decor.bartenderNickname || (game.decor.bartenderCharacter === 'leo' ? 'Leo' : 'Noa')).toUpperCase() }} · BARTENDER</span>
    </div>
    <div class="counter-glow"></div>
    <div class="bar-cast">
      <button v-for="(customer, index) in game.customers" :key="customer.id" type="button" class="scene-customer" :class="{ active: customer.id === game.activeCustomerId, waiting: customer.id !== game.activeCustomerId }" @click="game.openConversation(customer.id)">
        <div class="speech-bubble"><span>{{ customer.greeting }}</span><b>{{ bubbleText(customer) }}</b><em>{{ customer.orderRevealed ? 'Order confirmed' : 'Tap to talk' }}</em></div>
        <CharacterModel role="customer" :character-id="customer.characterId ?? CUSTOMER_ART_BY_SLOT[index % CUSTOMER_ART_BY_SLOT.length]" :seed="customer.id" :mood="customer.mood" :expression="expressionFor(customer.mood)" :animation="customer.id === game.activeCustomerId ? 'talk' : 'idle'" />
        <div class="customer-plate"><div><b>{{ customer.name }}</b><small>{{ customer.mood }}</small></div><span class="mini-patience"><i :style="{ width: patience(customer.patienceRemaining, customer.patience) + '%' }"></i><em>{{ game.orderCountdown }}</em></span></div>
      </button>
      <div v-if="!game.hasCustomer" class="empty-bar-wait"><small>NEXT CUSTOMER</small><b>{{ game.nextCustomerCountdown }}</b><p>Use the quiet time to restock, learn recipes, or customize this bar.</p><button type="button" :disabled="game.crystals < game.nextCustomerCrystalCost" @click="game.expediteCustomer()">Welcome now · ◆ {{ game.nextCustomerCrystalCost }}</button></div>
    </div>
    <div v-if="buildingEnabled" ref="glassTarget" class="live-glass-station" :class="{ 'drag-over': dragOverGlass }">
      <div class="live-glass-copy"><b>{{ dragOverGlass ? 'POURING' : totalAmount ? `${totalAmount} ML` : 'YOUR GLASS' }}</b><small>{{ itemCount ? `+ ${itemCount} fresh item${itemCount === 1 ? '' : 's'}` : 'Drag bottle over the glass' }}</small></div>
      <div class="live-glass-wrap">
        <div v-if="dragOverGlass" class="live-pour-stream" :style="{ '--stream-color': selectedIngredient ? colorMap[selectedIngredient.id] : liquidColor }"></div>
        <GlassModel type="highball" :fill="fill" :color="liquidColor" :ice="ice" :garnish="garnish" :bubbles="hasBubbles" animation="idle" />
        <button class="fresh-plus" type="button" :aria-expanded="freshPickerOpen" aria-label="Add fruit, ice, herb, or garnish" @click="freshPickerOpen = !freshPickerOpen"><span>+</span><small>fresh</small></button>
      </div>
      <div v-if="freshPickerOpen" class="fresh-picker" role="dialog" aria-label="Choose fresh ingredient">
        <header><b>ADD TO THE GLASS</b><button type="button" aria-label="Close" @click="freshPickerOpen = false">×</button></header>
        <div><button v-for="ingredient in freshIngredients" :key="ingredient.id" type="button" @click="addFresh(ingredient.id)"><BottleModel :ingredient="ingredient" /><span>{{ ingredient.name }}</span><small>+1</small></button></div>
      </div>
    </div>
    <div v-if="draggingIngredientId && selectedIngredient" class="drag-bottle-ghost" :class="{ pouring: dragOverGlass }" :style="{ left: `${pointerX}px`, top: `${pointerY}px` }" aria-hidden="true">
      <BottleModel :ingredient="selectedIngredient" :amount="selectedAmount" /><i v-if="dragOverGlass" :style="{ '--stream-color': colorMap[selectedIngredient.id] ?? '#d7c88c' }"></i>
    <b class="ghost-name">{{ selectedIngredient.name }} · {{ pourable(selectedIngredient.id) }} ml</b></div>
    <div class="scene-status"><span :class="{ waiting: !game.hasCustomer }"></span>{{ game.message }}<b>{{ game.hasCustomer ? (game.orderTimerPaused ? 'Paused in dialogue' : game.orderCountdown) : game.nextCustomerCountdown }}</b></div>
  </section>
</template>
