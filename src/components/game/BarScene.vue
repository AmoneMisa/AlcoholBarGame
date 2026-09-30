<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue';
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
import { INTERIORS, shelfStyleFor } from '../../data/cosmetics/bars';
import { sceneLayout } from '../../data/cosmetics/barLines';

const game = useGameStore();
withDefaults(defineProps<{ active?: boolean }>(), { active: true });
const glassTarget = ref<HTMLElement>();
// Everything lives in the painting: our bottles stand on the background's own back-bar planks, the bartender
// is cut at the back edge of its counter, the glass stands on the counter and guests sit on its stools.
// The positions come from each background's measured geometry (data/cosmetics/barLines.ts).
const sceneRef = ref<HTMLElement>();
const sceneBox = ref({ width: 0, height: 0 });
const sceneObserver = typeof ResizeObserver === 'undefined' ? undefined : new ResizeObserver(() => measureScene());
function measureScene() {
  const element = sceneRef.value;
  if (element) sceneBox.value = { width: element.clientWidth, height: element.clientHeight };
}
const layout = computed(() => {
  const { width, height } = sceneBox.value;
  if (!width || !height) return undefined;
  const interior = INTERIORS.find((item) => item.id === game.decor.interior) ?? INTERIORS[0];
  const position = /(\d+)%\s*$/.exec(interior.position)?.[1];
  return sceneLayout(interior.id, width, height, position ? Number(position) / 100 : .5);
});
const people = computed(() => {
  const current = layout.value;
  const { width } = sceneBox.value;
  if (!current) return undefined;
  // People are scaled by the room's perspective: back-bar planks are about 40 cm apart, a seated guest shows
  // about 90 cm above the stool and a bartender's visible upper body is about 70 cm.
  const planks = current.shelf.planks;
  const plankGap = planks.length > 1 ? (planks[planks.length - 1]! - planks[0]!) / (planks.length - 1) : current.drawnHeight * .1;
  // Phones show a compact scene, so people get smaller limits there.
  const phone = width < 760;
  const guest = Math.round(phone ? Math.min(190, Math.max(110, plankGap * 2.3)) : Math.min(300, Math.max(150, plankGap * 2.3)));
  const bartender = Math.round(phone ? Math.min(260, Math.max(150, plankGap * 3.4)) : Math.min(440, Math.max(240, plankGap * 3.4)));
  // The bartender works on the side away from the bottle shelf, so they never hide the bottles.
  const shelfOnRight = (current.shelf.left + current.shelf.right) / 2 > width * .6;
  const side = phone ? .84 : .86;
  const bartenderX = current.bartenderX ?? Math.round(width * (shelfOnRight ? 1 - side : side));
  // The glass stands at the bartender's left hand; only at the scene's left edge does it move to the right.
  const glassOffset = bartender * (phone ? .5 : .46);
  const glassX = bartenderX - glassOffset < 60 ? bartenderX + glassOffset : bartenderX - glassOffset;
  return { guest, bartender, bartenderX, glassX, shelfOnRight, bartenderHalfWidth: bartender * .24 };
});
const sceneVars = computed(() => {
  const current = layout.value;
  const sizes = people.value;
  if (!current || !sizes) return {};
  return {
    '--back': `${current.back}px`, '--seat-top': `${current.seat}px`, '--guest-h': `${sizes.guest}px`, '--bt-h': `${sizes.bartender}px`,
    '--bt-x': `${sizes.bartenderX}px`, '--glass-x': `${Math.round(sizes.glassX)}px`,
    '--glass-y': `${Math.round(current.back + current.drawnHeight * .03)}px`
  };
});
// Guests take painted stools near the middle, but not in front of the bottle shelf or where the bartender works,
// so they never hide bottles; those stools are used only when there is no other.
const seatXs = computed(() => {
  const { width } = sceneBox.value;
  const current = layout.value;
  const sizes = people.value;
  // A guest hides bottles only when their head reaches the height of the lowest shelf row.
  const lowestRow = Math.max(0, ...shelfRows.value.map((row) => parseFloat(row.style.top) + parseFloat(row.style.height)));
  const headReachesShelf = !!current && !!sizes && current.seat - sizes.guest < lowestRow;
  const blocked = (x: number) => (headReachesShelf && current ? x > current.shelf.left - 40 && x < current.shelf.right + 40 : false)
    || (sizes ? Math.abs(x - sizes.bartenderX) < sizes.bartenderHalfWidth + 60 || Math.abs(x - sizes.glassX) < 90 : false);
  // Free spots at the counter for when every visible stool is taken (narrow phones show only one or two).
  const spots = [width * .28, width * .5, width * .18].filter((x) => !blocked(x));
  const stools = [...(current?.stools ?? [])].sort((a, b) =>
    Number(blocked(a)) - Number(blocked(b)) || Math.abs(a - width / 2) - Math.abs(b - width / 2));
  const free = stools.filter((x) => !blocked(x));
  const order = [...free, ...spots, ...stools.filter(blocked)];
  return order.length ? order : [width * .5];
});
const customerStyle = (index: number) => ({ left: `${Math.round(seatXs.value[index % seatXs.value.length] ?? sceneBox.value.width / 2)}px` });
// The speech bubble sits beside the guest's head, on the side away from the bartender and the glass,
// so it covers neither the shelves nor the pouring station.
const bartenderOnRight = computed(() => {
  const current = layout.value;
  return !current || (current.shelf.left + current.shelf.right) / 2 <= sceneBox.value.width * .6;
});
// …unless there is no room on that side (guests near the edge of a narrow phone scene).
const bubbleOnLeft = (index: number) => {
  const x = seatXs.value[index % seatXs.value.length] ?? 0;
  const room = 170;
  return bartenderOnRight.value ? x > room : x > sceneBox.value.width - room;
};
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
// One row per painted plank; with fewer planks than lines, neighbouring lines share a plank.
// The span of a shelf row at `plank` height: it stops where the bartender and the glass work. `fits` is false when
// too little of the row would be left (small screens) — then that plank is not used.
function rowSpan(plank: number) {
  const current = layout.value!;
  const sizes = people.value;
  let left = current.shelf.left;
  let right = current.shelf.right;
  if (sizes && plank > current.back - sizes.bartender * .58) {
    const workLeft = Math.min(sizes.bartenderX - sizes.bartenderHalfWidth, sizes.glassX - 70);
    const workRight = Math.max(sizes.bartenderX + sizes.bartenderHalfWidth, sizes.glassX + 70);
    if ((workLeft + workRight) / 2 > (left + right) / 2) right = Math.min(right, workLeft);
    else left = Math.max(left, workRight);
  }
  return { left, right, fits: right - left >= 140 };
}
// One row per usable painted plank; with fewer planks than lines, neighbouring lines share a plank.
const shelfRows = computed(() => {
  const current = layout.value;
  if (!current) return [];
  // Planks cropped off the top of the scene, or squeezed out by the bartender's work area, are skipped;
  // their bottles move to the other planks.
  const visible = current.shelf.planks.filter((plank) => plank - 56 >= 24);
  const usable = visible.filter((plank) => rowSpan(plank).fits);
  const planks = usable.length ? usable : visible.length ? visible.slice(0, 1) : current.shelf.planks.slice(-1);
  // Small screens: when lower planks were squeezed out, stack rows upward above the top plank while there is room.
  const wanted = Math.min(3, Math.max(visible.length, 1));
  while (planks.length < wanted && planks[0]! - 58 - 56 >= 24) planks.unshift(planks[0]! - 58);
  const lines = shelfLines.value;
  const groups = planks.length >= lines.length ? lines.map((line) => [line])
    : planks.length === 3 ? [[lines[0]!], [lines[1]!], lines.slice(2)]
      : planks.length === 2 ? [lines.slice(0, 2), lines.slice(2)] : [lines];
  return groups.map((group, index) => {
    const plank = planks[index]!;
    const gap = index > 0 ? plank - planks[index - 1]! : (planks[1] ?? plank + 90) - plank;
    const height = Math.round(Math.max(56, Math.min(118, gap - 4)));
    const bottle = Math.round(Math.max(34, Math.min(76, height - 16)));
    const span = rowSpan(plank);
    const left = span.fits ? span.left : current.shelf.left;
    const right = span.fits ? span.right : current.shelf.right;
    return {
      id: group.map((line) => line.id).join('-'),
      label: group.map((line) => line.label).join(' · '),
      bottles: group.flatMap((line) => line.bottles),
      style: { left: `${left}px`, width: `${right - left}px`, top: `${plank - height}px`, height: `${height}px`, '--bottle': `${bottle}px` }
    };
  });
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
  const row = target.closest<HTMLElement>('.pshelf-bottles') ?? undefined;
  const box = target.closest<HTMLElement>('.pshelf-box') ?? undefined;
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
      if (pending.row) { pending.row.scrollLeft = pending.scrollLeft - dx; markEdges(pending.row); }
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
watch(sceneRef, (element, previous) => {
  if (previous) sceneObserver?.unobserve(previous);
  if (element) { sceneObserver?.observe(element); measureScene(); }
});
watch(() => [buildingEnabled.value, game.decor.interior], () => nextTick(measureScene));
onBeforeUnmount(() => sceneObserver?.disconnect());
// Scroll edges: rows and the shelf box fade out where more bottles are hidden, and arrows appear only when useful.
const lineElements = new Map<string, HTMLElement>();
const edgeObserver = typeof ResizeObserver === 'undefined' ? undefined : new ResizeObserver((entries) => entries.forEach((entry) => markEdges(entry.target as HTMLElement)));
function markEdges(element: HTMLElement) {
  const axis = element.dataset.axis === 'y' ? 'y' : 'x';
  const start = axis === 'x' ? element.scrollLeft : element.scrollTop;
  const size = axis === 'x' ? element.scrollWidth - element.clientWidth : element.scrollHeight - element.clientHeight;
  element.dataset.scrollable = String(size > 2);
  element.dataset.atStart = String(start <= 2);
  element.dataset.atEnd = String(start >= size - 2);
}
function trackLine(id: string, element: HTMLElement | null) {
  const previous = lineElements.get(id);
  if (previous === element) return;
  if (previous) edgeObserver?.unobserve(previous);
  if (!element) { lineElements.delete(id); return; }
  lineElements.set(id, element);
  edgeObserver?.observe(element);
  markEdges(element);
}
function nudgeLine(id: string, direction: number) {
  const element = lineElements.get(id);
  if (!element) return;
  element.scrollBy({ left: direction * Math.max(120, element.clientWidth * .6), behavior: 'smooth' });
  // Smooth scrolling ends later; refresh the fades and arrows once it has settled.
  window.setTimeout(() => markEdges(element), 400);
}
onBeforeUnmount(() => edgeObserver?.disconnect());

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
  <section ref="sceneRef" class="bar-scene" :class="{ 'is-building': buildingEnabled, 'shelf-right': people?.shelfOnRight }" :data-wall="game.decor.wall" :data-counter="game.decor.counter" :data-counter-color="game.decor.counterColor" :data-counter-size="game.decor.counterSize" :data-lighting="game.decor.lighting" :data-highlight-strength="game.decor.highlightStrength" :style="[game.barInteriorStyle, sceneVars]">
    <div class="scene-light scene-light-left"></div><div class="scene-light scene-light-right"></div>
    <CityEvent compact />
    <div v-if="buildingEnabled" class="pshelf-box" :data-shelf="shelfStyleFor(game.decor)" aria-label="Back bar bottles">
      <small v-if="shelfRows.length" class="pshelf-hint" :style="{ left: shelfRows[0]!.style.left, top: `calc(${shelfRows[0]!.style.top} - 18px)` }">Swipe a shelf sideways · pull a bottle down to the glass</small>
      <div v-for="row in shelfRows" :key="row.id" class="pshelf-row" :style="row.style">
        <small class="pshelf-label">{{ row.label }}</small>
        <div :ref="(element) => trackLine(row.id, element as HTMLElement | null)" class="pshelf-bottles" @scroll="markEdges($event.currentTarget as HTMLElement)">
          <button v-for="ingredient in row.bottles" :key="ingredient.id" type="button" :title="`${ingredient.name} · ${pourable(ingredient.id)} ml`" :class="{ empty: pourable(ingredient.id) < 5, poured: game.currentMix.some((item) => item.ingredientId === ingredient.id) }" :aria-disabled="pourable(ingredient.id) < 5" :aria-label="`Drag ${ingredient.name} to the glass, ${pourable(ingredient.id)} ml left`" @pointerdown="beginBottleDrag(ingredient.id, $event)" @keydown.enter.prevent="addLiquid(ingredient.id)" @keydown.space.prevent="addLiquid(ingredient.id)">
            <BottleModel :ingredient="ingredient" :amount="game.currentMix.find((item) => item.ingredientId === ingredient.id)?.amount" />
            <span>{{ ingredient.name }}</span>
          </button>
        </div>
        <span class="shelf-nudge"><button type="button" :aria-label="`Scroll ${row.label} left`" @click="nudgeLine(row.id, -1)">‹</button><button type="button" :aria-label="`Scroll ${row.label} right`" @click="nudgeLine(row.id, 1)">›</button></span>
      </div>
    </div>
    <div class="bartender-layer">
      <CharacterModel role="bartender" :character-id="game.decor.bartenderCharacter ?? 'noa'" :outfit="game.decor.bartender" :face-style="game.decor.face" :hair-style="game.decor.hairStyle" :hair-color="game.decor.hairColor" :body-shape="game.decor.bodyShape" :skin-detail="game.decor.skinDetail" :skin-tone="game.decor.skinTone" :tan-level="game.decor.tanLevel" :bust="game.decor.bust" :pose="game.decor.pose" :eye-shape="game.decor.eyeShape" :brow-shape="game.decor.browShape" :nose-shape="game.decor.noseShape" :lip-shape="game.decor.lipShape" :cheek-shape="game.decor.cheekShape" :eye-color="game.decor.eyeColor" :eyeliner="game.decor.eyeliner" :eyeshadow="game.decor.eyeshadow" :lip-color="game.decor.lipColor" :blush="game.decor.blush" :facial-hair="game.decor.facialHair" animation="idle" />
      <span class="name-ribbon">{{ (game.decor.bartenderNickname || (game.decor.bartenderCharacter === 'leo' ? 'Leo' : 'Noa')).toUpperCase() }} · BARTENDER</span>
    </div>
    <div class="bar-line-tint" aria-hidden="true"></div>
    <div class="bar-cast">
      <button v-for="(customer, index) in game.customers" :key="customer.id" type="button" class="scene-customer" :class="{ active: customer.id === game.activeCustomerId, waiting: customer.id !== game.activeCustomerId, 'bubble-left': bubbleOnLeft(index) }" :style="customerStyle(index)" @click="game.openConversation(customer.id)">
        <div class="speech-bubble"><span>{{ customer.greeting }}</span><b>{{ bubbleText(customer) }}</b><em>{{ customer.orderRevealed ? 'Order confirmed' : 'Tap to talk' }}</em></div>
        <CharacterModel role="customer" :character-id="customer.characterId ?? CUSTOMER_ART_BY_SLOT[index % CUSTOMER_ART_BY_SLOT.length]" :seed="customer.id" :mood="customer.mood" :expression="expressionFor(customer.mood)" :animation="customer.id === game.activeCustomerId ? 'talk' : 'idle'" />
        <span v-if="customer.smoker" class="customer-ashtray" aria-hidden="true"><i></i></span>
        <div class="customer-plate"><div><b>{{ customer.name }}</b><small>{{ customer.mood }}</small></div><span class="mini-patience"><i :style="{ width: patience(customer.patienceRemaining, customer.patience) + '%' }"></i><em>{{ game.orderCountdown }}</em></span></div>
      </button>
      <!-- The wait for the next guest is shown once, in the panel below the scene (with “Welcome now”). -->
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
    <div class="scene-status"><span :class="{ waiting: !game.hasCustomer }"></span>{{ game.message }}<b v-if="game.hasCustomer">{{ game.orderTimerPaused ? 'Paused in dialogue' : game.orderCountdown }}</b></div>
  </section>
</template>
