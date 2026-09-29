<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref } from 'vue';
import { useGuide } from '../../composables/useGuide';
import { INGREDIENTS } from '../../domain/catalog';
import { ALCOHOL_PRODUCTS, ALCOHOL_TYPE_LABELS, bottleTotal } from '../../domain/bottleCatalog';
import BrandBottle from '../knowledge/BrandBottle.vue';
import { guideIdForProduct } from '../../data/knowledge/alcohol';
import { sameBrand, signatureFor } from '../../domain/brandPours';
import { useGameStore } from '../../stores/game';
import { haptic } from '../../telegram/webapp';
import BottleModel from './BottleModel.vue';
import GlassModel from './GlassModel.vue';

const game = useGameStore();
const { openGuide } = useGuide();
const selectedIngredient = ref<string>();
const ingredientCategory = ref<'all' | 'spirit' | 'mixer' | 'fresh'>('all');
const action = ref<'idle' | 'pouring' | 'shaking' | 'garnishing' | 'serving'>('idle');
const tray = ref<HTMLElement>();
const glassTarget = ref<HTMLElement>();
const glassStage = ref<HTMLElement>();
const pourGeometry = ref<Record<string, string>>({});
const draggingIngredientId = ref<string>();
const dragOverGlass = ref(false);
const dragAdded = ref(false);
let activePointerId: number | undefined;
let pourInterval: number | undefined;
let actionTimer: number | undefined;

const categoryOf = (id: string) => {
  const ingredient = INGREDIENTS.find((item) => item.id === id)!;
  if (ingredient.category === 'spirit') return 'spirit';
  if (ingredient.category === 'mixer' && !['sugar-syrup', 'coconut-cream', 'milk', 'coconut-milk'].includes(id)) return 'mixer';
  return 'fresh';
};
const ingredients = computed(() => INGREDIENTS.filter((item) => ingredientCategory.value === 'all' || categoryOf(item.id) === ingredientCategory.value));
const totalAmount = computed(() => game.currentMix.reduce((sum, item) => {
  const ingredient = INGREDIENTS.find((entry) => entry.id === item.ingredientId);
  return sum + (ingredient?.unit === 'ml' ? item.amount : 0);
}, 0));
const itemCount = computed(() => game.currentMix.reduce((sum, item) => {
  const ingredient = INGREDIENTS.find((entry) => entry.id === item.ingredientId);
  return sum + (ingredient?.unit === 'piece' ? item.amount : 0);
}, 0));
const fill = computed(() => Math.min(91, (totalAmount.value / 240) * 91));
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
const ice = computed(() => game.currentMix.find((item) => item.ingredientId === 'ice')?.amount ?? 0);
const selected = computed(() => INGREDIENTS.find((item) => item.id === selectedIngredient.value));
// Brand choice for spirits: “House” pour or a brand bottle from the shelf.
const brandChoices = computed(() => selectedIngredient.value ? game.shelfBrandsFor(selectedIngredient.value) : []);
const servedProduct = computed(() => game.customer.orderKind === 'serve' ? ALCOHOL_PRODUCTS.find((item) => item.id === game.customer.serveRequest?.productId) : undefined);
const pourProduct = (ingredientId: string) => ALCOHOL_PRODUCTS.find((item) => item.id === game.pourBrands[ingredientId]);
const bottleStockOf = (productId: string) => game.bottleInventory.find((item) => item.productId === productId)?.quantity ?? 0;
const classicBrand = (ingredientId: string) => game.customer.orderRevealed && game.customer.orderKind !== 'serve' ? signatureFor(game.recipe.id, ingredientId)?.brand : undefined;
const selectedPour = computed(() => selectedIngredient.value ? pourProduct(selectedIngredient.value) : undefined);
const currentStep = computed(() => !game.currentMix.length ? 1 : !game.shaken && game.recipe.needsShake ? 2 : 3);
const hasBubbles = computed(() => game.currentMix.some((item) => ['soda', 'tonic', 'ginger-beer', 'grapefruit-soda', 'sparkling-wine'].includes(item.ingredientId)));
const garnish = computed(() => game.currentMix.some((item) => item.ingredientId === 'mint') ? 'mint' : game.currentMix.some((item) => ['lime-wedge', 'orange', 'pineapple-wedge'].includes(item.ingredientId)) ? 'citrus' : '');
const activeBottle = computed(() => ALCOHOL_PRODUCTS.find((item) => item.id === game.customer.selectedBottleId));
const activeBottleStock = computed(() => game.bottleInventory.find((item) => item.productId === activeBottle.value?.id)?.quantity ?? 0);

// One timer for every station action, so a new tap never gets cut off by an older reset.
function setAction(next: typeof action.value, resetAfter?: number) {
  window.clearTimeout(actionTimer);
  action.value = next;
  if (resetAfter) actionTimer = window.setTimeout(() => action.value = 'idle', resetAfter);
}

// Anchor the bottle neck over the rim and end the stream exactly on the liquid surface.
function measurePour() {
  const stage = glassStage.value;
  const bowl = stage?.querySelector<HTMLElement>('.glass-bowl');
  const liquid = stage?.querySelector<HTMLElement>('.glass-liquid');
  if (!stage || !bowl || !liquid) return;
  const stageRect = stage.getBoundingClientRect();
  const bowlRect = bowl.getBoundingClientRect();
  const surface = liquid.getBoundingClientRect().bottom - bowl.clientHeight * Math.min(92, fill.value) / 100 - stageRect.top;
  const tipX = bowlRect.left + bowlRect.width * .4 - stageRect.left;
  const tipY = bowlRect.top - stageRect.top - 16;
  pourGeometry.value = {
    '--pour-x': `${Math.round(tipX)}px`,
    '--pour-y': `${Math.round(tipY)}px`,
    '--stream-height': `${Math.round(Math.max(14, surface - tipY))}px`
  };
}

function incrementFor(id: string) {
  return INGREDIENTS.find((item) => item.id === id)?.unit === 'ml' ? 5 : 1;
}

function addOne(id: string) {
  selectedIngredient.value = id;
  const ingredient = INGREDIENTS.find((item) => item.id === id)!;
  const next = ingredient.unit === 'piece' ? 'garnishing' : 'pouring';
  // Keep an ongoing pour running; restart the drop animation for each garnish.
  if (next !== action.value || next === 'garnishing') {
    window.clearTimeout(actionTimer);
    action.value = 'idle';
    void glassStage.value?.offsetWidth;
  }
  setAction(next, activePointerId === undefined ? 420 : undefined);
  game.addIngredient(id, incrementFor(id));
  nextTick(measurePour);
  dragAdded.value = true;
  haptic('light');
}

function beginIngredientGesture(id: string, event: PointerEvent) {
  if (event.button !== 0) return;
  selectedIngredient.value = id;
  draggingIngredientId.value = id;
  activePointerId = event.pointerId;
  dragAdded.value = false;
  dragOverGlass.value = false;
  (event.currentTarget as HTMLElement).setPointerCapture?.(event.pointerId);
  window.clearInterval(pourInterval);
  pourInterval = window.setInterval(() => {
    if (dragOverGlass.value && draggingIngredientId.value) addOne(draggingIngredientId.value);
  }, 130);
}

function moveIngredientGesture(event: PointerEvent) {
  if (activePointerId !== event.pointerId || !glassTarget.value) return;
  const rect = glassTarget.value.getBoundingClientRect();
  dragOverGlass.value = event.clientX >= rect.left && event.clientX <= rect.right && event.clientY >= rect.top && event.clientY <= rect.bottom;
}

function endIngredientGesture(event: PointerEvent) {
  if (activePointerId !== event.pointerId) return;
  window.clearInterval(pourInterval);
  if (event.type !== 'pointercancel' && !dragAdded.value && draggingIngredientId.value) addOne(draggingIngredientId.value);
  draggingIngredientId.value = undefined;
  dragOverGlass.value = false;
  activePointerId = undefined;
  if (action.value !== 'idle') setAction(action.value, 420);
}

function scrollIngredients(direction: number) {
  tray.value?.scrollBy({ left: direction * Math.max(320, tray.value.clientWidth * .72), behavior: 'smooth' });
}

function shake() {
  setAction('shaking', 640);
  haptic('medium');
  game.shakeCurrentMix();
}

function serve() {
  setAction('serving', 620);
  haptic('medium');
  game.serveMix();
}

onMounted(() => {
  measurePour();
  window.addEventListener('resize', measurePour);
  window.addEventListener('pointermove', moveIngredientGesture);
  window.addEventListener('pointerup', endIngredientGesture);
  window.addEventListener('pointercancel', endIngredientGesture);
});
onBeforeUnmount(() => {
  window.clearInterval(pourInterval);
  window.clearTimeout(actionTimer);
  window.removeEventListener('resize', measurePour);
  window.removeEventListener('pointermove', moveIngredientGesture);
  window.removeEventListener('pointerup', endIngredientGesture);
  window.removeEventListener('pointercancel', endIngredientGesture);
});
</script>

<template>
  <section v-if="!game.hasCustomer" class="cocktail-workspace waiting-station game-panel">
    <div class="waiting-station-clock"><small>NEXT CUSTOMER</small><b>{{ game.nextCustomerCountdown }}</b></div>
    <div><small>BAR PREP TIME</small><h2>The station is ready</h2><p>A new guest will arrive between five minutes and two hours after the previous customer leaves. Inventory, learning, recipes, market, and bar design remain available while you wait.</p></div>
  </section>
  <section v-else-if="game.customer.orderKind === 'bottle'" class="cocktail-workspace bottle-order-station game-panel">
    <header class="panel-heading ornate-heading">
      <div><small>BOTTLE RETAIL</small><h2>{{ game.customer.orderRevealed && activeBottle ? `Prepare ${activeBottle.brand}` : 'Customer consultation' }}</h2></div>
      <span>{{ game.customer.orderRevealed ? 'Choice confirmed' : 'Ask · match · recommend' }}</span>
    </header>
    <div v-if="!game.customer.orderRevealed || !activeBottle" class="bottle-consultation-empty">
      <div class="sealed-bottle-placeholder"><i></i><b>?</b></div>
      <div><small>THE CUSTOMER NEEDS FULL, SEALED BOTTLES</small><h3>Discover the complete request</h3><p>Ask how many bottles they need, their total budget, preferred alcohol type and flavour, the occasion, and whether they have a favourite brand.</p><button class="primary-button" type="button" @click="game.openConversation(game.customer.id)">Continue the dialogue <span>→</span></button></div>
    </div>
    <div v-else class="confirmed-bottle-station">
      <div class="hero-brand-model"><BrandBottle :brand="activeBottle.brand" :category="guideIdForProduct(activeBottle)" :color="activeBottle.color" /><em>{{ activeBottle.abv }}%</em></div>
      <div><small>MOST COVERED MATCH</small><h3>{{ activeBottle.name }}</h3><p>{{ activeBottle.description }}</p><div class="bottle-sale-facts"><span>{{ ALCOHOL_TYPE_LABELS[activeBottle.type] }}</span><span>{{ activeBottle.volumeMl }} ml</span><span>{{ activeBottle.abv }}% ABV</span><span>{{ activeBottleStock }} in stock</span></div><strong>{{ game.customer.bottleRequest?.quantity }} bottle{{ game.customer.bottleRequest?.quantity === 1 ? '' : 's' }} · {{ bottleTotal(activeBottle, game.customer.bottleRequest?.quantity ?? 1, game.region.marketFactor) }} coins</strong><button class="primary-button" type="button" @click="game.openConversation(game.customer.id)">Return to customer and sell <span>→</span></button></div>
    </div>
  </section>
  <section v-else class="cocktail-workspace game-panel">
    <header class="panel-heading ornate-heading">
      <div><small>ORDER STATION</small><h2>{{ game.customer.orderRevealed ? `Craft ${game.recipe.name}` : 'Mystery order' }}</h2><button v-if="servedProduct" type="button" class="guide-open" @click="openGuide('ingredient', guideIdForProduct(servedProduct))">About {{ servedProduct.brand }}</button><button v-else-if="game.customer.orderRevealed" type="button" class="guide-open" @click="openGuide('cocktail', game.recipe.id)">About this drink</button></div>
      <span>Step {{ currentStep }} / 3</span>
    </header>
    <div class="ingredient-shelf-toolbar">
      <div class="shelf-caption"><small>INGREDIENT SHELF</small><span>Tap or drag · liquids +5 ml · items +1</span></div>
      <nav aria-label="Ingredient filters"><button v-for="category in ['all','spirit','mixer','fresh'] as const" :key="category" :class="{ active: ingredientCategory === category }" type="button" @click="ingredientCategory = category">{{ category === 'all' ? 'All' : category === 'fresh' ? 'Fresh & food' : category + 's' }}</button></nav>
      <div class="shelf-arrows"><button type="button" aria-label="Previous ingredients" @click="scrollIngredients(-1)">←</button><button type="button" aria-label="Next ingredients" @click="scrollIngredients(1)">→</button></div>
    </div>
    <div ref="tray" class="ingredient-tray" aria-label="Ingredients">
      <button v-for="ingredient in ingredients" :key="ingredient.id" class="ingredient-button" :class="{ selected: selectedIngredient === ingredient.id, dragging: draggingIngredientId === ingredient.id }" type="button" @pointerdown="beginIngredientGesture(ingredient.id, $event)" @click="($event.detail === 0) && addOne(ingredient.id)">
        <BottleModel :ingredient="ingredient" :active="selectedIngredient === ingredient.id" :amount="game.currentMix.find((item) => item.ingredientId === ingredient.id)?.amount" />
        <span>{{ ingredient.name }}</span><small>+{{ incrementFor(ingredient.id) }} {{ ingredient.unit }}</small>
      </button>
    </div>
    <div v-if="brandChoices.length && selected" class="brand-picker" role="group" :aria-label="`Brand for ${selected.name}`">
      <small>BRAND FOR {{ selected.name.toUpperCase() }}</small>
      <button type="button" :class="{ active: !game.pourBrands[selected.id] }" @click="game.setPourBrand(selected.id)"><b>House</b><em>bar stock</em></button>
      <button v-for="product in brandChoices" :key="product.id" type="button" :class="{ active: game.pourBrands[selected.id] === product.id, wanted: servedProduct?.id === product.id, classic: !!classicBrand(selected.id) && sameBrand(product.brand, classicBrand(selected.id)!) }" @click="game.setPourBrand(selected.id, product.id)">
        <span class="picker-bottle"><BrandBottle :brand="product.brand" :category="guideIdForProduct(product)" :color="product.color" /></span>
        <b>{{ product.brand }}</b><em>{{ bottleStockOf(product.id) }} on shelf{{ servedProduct?.id === product.id ? ' · guest’s choice' : '' }}</em>
      </button>
    </div>
    <div class="workspace-main">
      <div ref="glassTarget" class="mixing-board" :class="{ 'drag-ready': draggingIngredientId, 'drag-over': dragOverGlass }">
        <div class="drop-instruction"><b>{{ dragOverGlass ? 'Pouring — release to stop' : draggingIngredientId ? 'Move over the glass' : 'Drag an ingredient here' }}</b><span>The glass calculates every measure</span></div>
        <div ref="glassStage" class="glass-stage" :style="pourGeometry">
          <div class="action-prop" :class="[`action-${action}`, { visible: selected && (action === 'pouring' || action === 'garnishing') }]">
            <BrandBottle v-if="selected && selectedPour" class="pour-brand" :brand="selectedPour.brand" :category="guideIdForProduct(selectedPour)" :color="selectedPour.color" />
            <BottleModel v-else-if="selected" :ingredient="selected" />
          </div>
          <div class="shaker-prop" :class="{ active: action === 'shaking' }"><i></i><i></i><i></i></div>
          <div class="pour-stream" :class="{ active: action === 'pouring' }" :style="{ '--stream-color': selected ? colorMap[selected.id] ?? '#d7c88c' : liquidColor }"></div>
          <GlassModel type="highball" :fill="fill" :color="liquidColor" :ice="ice" :garnish="garnish" :bubbles="hasBubbles" :animation="action" />
          <div class="amount-readout"><b>{{ totalAmount }}</b><span>ml</span><em v-if="itemCount">+ {{ itemCount }} item{{ itemCount === 1 ? '' : 's' }}</em></div>
        </div>
        <div v-if="!game.customer.orderRevealed" class="recipe-progress recipe-locked">
          <p>Talk to <b>{{ game.customer.name }}</b> in English to find out what they want.</p>
          <button class="primary-button compact" type="button" @click="game.openConversation(game.customer.id)">Talk to {{ game.customer.name }}</button>
        </div>
        <div v-else class="recipe-progress">
          <div v-for="part in game.recipe.ingredients" :key="part.ingredientId" :class="{ done: game.currentMix.find((item) => item.ingredientId === part.ingredientId)?.amount === part.amount, wrong: (game.currentMix.find((item) => item.ingredientId === part.ingredientId)?.amount ?? 0) > part.amount }">
            <span>{{ INGREDIENTS.find((item) => item.id === part.ingredientId)?.name }}<i v-if="pourProduct(part.ingredientId)" class="progress-brand">{{ pourProduct(part.ingredientId)!.brand }}</i><i v-else-if="servedProduct?.ingredientId === part.ingredientId" class="progress-brand need">choose {{ servedProduct.brand }}</i><i v-else-if="classicBrand(part.ingredientId)" class="progress-brand hint">classic: {{ classicBrand(part.ingredientId) }}</i></span>
            <b>{{ game.currentMix.find((item) => item.ingredientId === part.ingredientId)?.amount ?? 0 }} / {{ part.amount }}</b>
          </div>
        </div>
      </div>
    </div>
    <footer class="workspace-actions">
      <button class="secondary-button" type="button" @click="game.resetMix">Clear</button>
      <button class="secondary-button" type="button" :class="{ active: action === 'shaking' }" @click="shake">Shake</button>
      <button class="primary-button" type="button" :disabled="game.serving" @click="serve">Serve drink <span>→</span></button>
    </footer>
  </section>
</template>
