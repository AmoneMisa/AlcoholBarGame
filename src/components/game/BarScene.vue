<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue';
import { CUSTOMER_ART_BY_SLOT } from '../../data/cosmetics/artCatalog';
import { INGREDIENTS, RECIPES } from '../../domain/catalog';
import { ALCOHOL_PRODUCTS } from '../../domain/bottleCatalog';
import { buildProfile, shortWish } from '../../domain/conversation/customerTalk';
import type { Customer } from '../../domain/types';
import { DRUNK_LABEL, EMOTION_ICON, EMOTION_LABEL, drunkStage } from '../../domain/social/model';
import type { CharacterExpression } from '../../domain/dialogue/types';
import { useGameStore } from '../../stores/game';
import { haptic } from '../../telegram/webapp';
import BottleModel from '../cocktails/BottleModel.vue';
import GlassModel from '../cocktails/GlassModel.vue';
import CharacterModel from '../characters/CharacterModel.vue';
import CityEvent from './CityEvent.vue';
import PopoverPanel from '../ui/PopoverPanel.vue';
import UiIcon from '../ui/UiIcon.vue';
import { INTERIORS, shelfStyleFor } from '../../data/cosmetics/bars';
import { sceneLayout } from '../../data/cosmetics/barLines';

const game = useGameStore();
// `preview` renders the bar exactly as decorated (shelves always on, no guests or glass) for the Design tab.
const props = withDefaults(defineProps<{ active?: boolean; preview?: boolean }>(), { active: true, preview: false });
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
    ...(phoneTrack.value ? { '--cast-left': `${phoneTrack.value.start}px`, '--cast-right': `${sceneBox.value.width - phoneTrack.value.end}px` } : {}),
    '--back': `${current.back}px`, '--seat-top': `${current.seat}px`, '--guest-h': `${sizes.guest}px`, '--bt-h': `${sizes.bartender}px`,
    '--bt-x': `${sizes.bartenderX}px`, '--glass-x': `${Math.round(sizes.glassX)}px`,
    '--glass-y': `${Math.round(current.back + current.drawnHeight * .03)}px`
  };
});
// Guests take the painted stool nearest the middle, avoiding only the bartender and glass.
// The old shelf-overlap heuristic pushed a single guest to the extreme edge even when the centre stool was free.
const seatXs = computed(() => {
  const { width } = sceneBox.value;
  const current = layout.value;
  const sizes = people.value;
  const blocked = (x: number) => sizes
    ? Math.abs(x - sizes.bartenderX) < sizes.bartenderHalfWidth + 60 || Math.abs(x - sizes.glassX) < 90
    : false;
  // Free spots at the counter for when every visible stool is taken (narrow phones show only one or two).
  const spots = [width * .28, width * .5, width * .18].filter((x) => !blocked(x));
  const stools = [...(current?.stools ?? [])].sort((a, b) =>
    Number(blocked(a)) - Number(blocked(b)) || Math.abs(a - width / 2) - Math.abs(b - width / 2));
  const free = stools.filter((x) => !blocked(x));
  const order = [...free, ...spots, ...stools.filter(blocked)];
  return order.length ? order : [width * .5];
});
// Phones have room for one or two stools beside the bartender, so every guest sits on a horizontal track
// in the free space next to them; a sideways swipe over the guests (or the ‹ › buttons) scrolls it.
// The counter space guests may use: everything beside the bartender (and, while pouring, beside the glass).
const guestZone = computed(() => {
  const sizes = people.value;
  const { width } = sceneBox.value;
  if (!sizes || !width) return undefined;
  const reserve = sizes.bartenderHalfWidth + 14;
  const bartenderOnLeft = sizes.bartenderX < width / 2;
  // While pouring, the glass stands between the guests and the bartender and needs its own room.
  const glassEdge = buildingEnabled.value ? (width < 760 ? 48 : 70) : 0;
  const start = bartenderOnLeft ? Math.min(width - 80, Math.round(Math.max(sizes.bartenderX + reserve, glassEdge ? sizes.glassX + glassEdge : 0))) : 0;
  const end = bartenderOnLeft ? width : Math.max(80, Math.round(Math.min(sizes.bartenderX - reserve, glassEdge ? sizes.glassX - glassEdge : width)));
  return { start, end };
});
const phoneTrack = computed(() => {
  const sizes = people.value;
  const zone = guestZone.value;
  if (!sizes || !zone || sceneBox.value.width >= 760 || !game.customers.length) return undefined;
  const spacing = Math.round(sizes.guest * .8) + 4;
  return { ...zone, zone: zone.end - zone.start, spacing, content: game.customers.length * spacing };
});
// Wider screens seat everyone at once: on the painted stools while there are enough distinct ones,
// otherwise evenly along the free counter so no two guests share a spot.
const wideSeats = computed(() => {
  const zone = guestZone.value;
  const sizes = people.value;
  const count = game.customers.length;
  if (!zone || !sizes || !count) return [];
  const gap = sizes.guest * .62;
  const stools: number[] = [];
  for (const x of seatXs.value) {
    if (x >= zone.start && x <= zone.end && stools.every((taken) => Math.abs(taken - x) >= gap)) stools.push(x);
  }
  if (stools.length >= count) return stools.slice(0, count);
  const spacing = (zone.end - zone.start) / count;
  return Array.from({ length: count }, (_, index) => zone.start + spacing * (index + .5));
});
const castRef = ref<HTMLElement>();
const guestScroll = ref(0);
const guestsOverflow = computed(() => !!phoneTrack.value && phoneTrack.value.content > phoneTrack.value.zone + 4);
const trackX = (index: number) => phoneTrack.value!.spacing * (index + .5);
function onGuestScroll() { guestScroll.value = castRef.value?.scrollLeft ?? 0; }
// The track always stops on whole guests, so no one is left cut in half at the edge.
const guestsPerView = () => Math.max(1, Math.floor((phoneTrack.value?.zone ?? 0) / (phoneTrack.value?.spacing ?? 1)));
function scrollToFirstGuest(first: number, behavior: ScrollBehavior = 'smooth') {
  const track = phoneTrack.value;
  if (!track || !castRef.value) return;
  const index = Math.min(Math.max(0, first), Math.max(0, game.customers.length - guestsPerView()));
  castRef.value.scrollTo({ left: Math.max(0, Math.min(index * track.spacing, track.content - track.zone)), behavior });
}
function showGuest(index: number, behavior: ScrollBehavior = 'smooth') {
  if (index >= 0) scrollToFirstGuest(index - Math.floor((guestsPerView() - 1) / 2), behavior);
}
function nudgeGuests(direction: number) {
  if (!phoneTrack.value || !castRef.value) return;
  scrollToFirstGuest(Math.round(castRef.value.scrollLeft / phoneTrack.value.spacing) + direction * guestsPerView());
}
// Bring the guest being served into view, also when the phone track first appears or its width changes.
watch([() => game.activeCustomerId, () => phoneTrack.value?.zone], ([id], previous) => {
  void nextTick(() => showGuest(game.customers.findIndex((item) => item.id === id), previous[1] === undefined ? 'auto' : 'smooth'));
});
const customerStyle = (index: number) => phoneTrack.value
  ? { left: `${Math.round(trackX(index))}px` }
  : { left: `${Math.round(wideSeats.value[index] ?? seatXs.value[index % seatXs.value.length] ?? sceneBox.value.width / 2)}px` };
const freshPickerOpen = ref(false);
// The dragged bottle follows the finger, but while pouring it sits just above and left of the glass rim,
// so the glass's stream starts at the bottle's neck instead of wherever the finger happens to be.
const ghostStyle = computed(() => {
  const glass = dragOverGlass.value ? glassTarget.value?.querySelector('.live-glass-wrap')?.getBoundingClientRect() : undefined;
  if (!glass) return { left: `${pointerX.value}px`, top: `${pointerY.value}px` };
  // The tipped bottle's neck sits about 55% of the bottle's width right of its anchor and 13% of its height above.
  const phone = sceneBox.value.width < 760;
  const [width, height] = phone ? [74, 105] : [92, 125];
  const neckX = glass.left + glass.width * .42;
  return { left: `${Math.round(neckX - width * .55)}px`, top: `${Math.round(glass.top - 18 + height * .13)}px` };
});
const draggingIngredientId = ref<string>();
const dragOverGlass = ref(false);
const dragAdded = ref(false);
const pointerX = ref(0);
const pointerY = ref(0);
let activePointerId: number | undefined;
let pourInterval: number | undefined;
let dragStartX = 0;
let dragStartY = 0;
let dragTravelled = false;

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
const garnish = computed(() => ['mint', 'lime-wedge', 'orange', 'pineapple-wedge'].find((id) => game.currentMix.some((item) => item.ingredientId === id)) ?? '');
const selectedIngredient = computed(() => INGREDIENTS.find((item) => item.id === draggingIngredientId.value));

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
// A guest's feelings show on their face; the older mood only matters when a guest has none.
const EMOTION_FACE: Record<string, CharacterExpression> = { happy: 'happy', upset: 'sad', angry: 'angry', tired: 'thinking', excited: 'very-happy', lonely: 'worried', nervous: 'embarrassed', relaxed: 'smile' };
const faceOf = (customer: Customer): CharacterExpression => (customer.social ? EMOTION_FACE[customer.social.emotion] : undefined) ?? expressionFor(customer.mood);
const NEED_ICON: Record<string, string> = { ashtray: '🚬', water: '💧', taxi: '🚕', chat: '💬' };
// Small status icons above a guest: what they feel, how drunk they are, what they are waiting for.
function badges(customer: Customer) {
  const social = customer.social;
  if (!social) return [];
  const list: { icon: string; label: string }[] = [{ icon: EMOTION_ICON[social.emotion], label: EMOTION_LABEL[social.emotion] }];
  const stage = drunkStage(social.drunk);
  if (stage !== 'sober') list.push({ icon: '🥴', label: DRUNK_LABEL[stage] });
  const need = social.need && social.need.since <= game.nowMs ? social.need.kind : undefined;
  if (need) list.push({ icon: NEED_ICON[need] ?? '❗', label: 'Needs ' + need });
  if (social.taxiAt) list.push({ icon: '🚕', label: 'Taxi on the way' });
  if (social.event) list.push({ icon: '⚠️', label: 'Needs help' });
  return list;
}
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
function beginBottleDrag(id: string, event: PointerEvent) {
  if (event.button !== 0 || !buildingEnabled.value) return;
  event.preventDefault();
  const target = event.currentTarget as HTMLElement;
  activePointerId = event.pointerId;
  dragStartX = event.clientX;
  dragStartY = event.clientY;
  dragTravelled = false;
  try { target.setPointerCapture?.(event.pointerId); } catch { /* not capturable */ }
  // Bottles are always grabbed immediately. Shelf navigation has dedicated arrow controls,
  // so a diagonal pull can never be mistaken for horizontal scrolling.
  liftBottle(id, event);
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
  if (!glassTarget.value || !draggingIngredientId.value) return;
  if (Math.hypot(event.clientX - dragStartX, event.clientY - dragStartY) > 6) dragTravelled = true;
  pointerX.value = event.clientX;
  pointerY.value = event.clientY;
  const rect = glassTarget.value.getBoundingClientRect();
  dragOverGlass.value = event.clientX >= rect.left && event.clientX <= rect.right && event.clientY >= rect.top && event.clientY <= rect.bottom;
}
function endBottle(event: PointerEvent) {
  if (activePointerId !== event.pointerId) return;
  window.clearInterval(pourInterval);
  if (event.type !== 'pointercancel' && draggingIngredientId.value) {
    if (dragOverGlass.value && !dragAdded.value) addLiquid(draggingIngredientId.value);
    else if (!dragTravelled) addLiquid(draggingIngredientId.value);
  }
  draggingIngredientId.value = undefined;
  dragOverGlass.value = false;
  activePointerId = undefined;
}

// Only the live scene runs the game clock; a Design preview must not tick it a second time.
const interval = props.preview ? undefined : window.setInterval(() => { if (!document.hidden) game.tickGameClock(); }, 1000);
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
  const distance = Math.max(120, element.clientWidth * .6);
  const maximum = Math.max(0, element.scrollWidth - element.clientWidth);
  element.scrollLeft = Math.max(0, Math.min(maximum, element.scrollLeft + direction * distance));
  markEdges(element);
  window.requestAnimationFrame(() => markEdges(element));
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
  <section ref="sceneRef" class="bar-scene" :class="{ 'is-building': buildingEnabled, 'shelf-right': people?.shelfOnRight, 'phone-guests': !!phoneTrack && !preview, 'is-preview': preview }" :data-wall="game.decor.wall" :data-counter="game.decor.counter" :data-counter-color="game.decor.counterColor" :data-counter-size="game.decor.counterSize" :data-lighting="game.decor.lighting" :data-highlight-strength="game.decor.highlightStrength" :style="[game.barInteriorStyle, sceneVars]">
    <div class="scene-light scene-light-left"></div><div class="scene-light scene-light-right"></div>
    <CityEvent v-if="!preview" compact />
    <div v-if="buildingEnabled || preview" class="pshelf-box" :data-shelf="shelfStyleFor(game.decor)" aria-label="Back bar bottles">
      <small v-if="shelfRows.length && !preview" class="pshelf-hint" :style="{ left: shelfRows[0]!.style.left, top: `calc(${shelfRows[0]!.style.top} - 18px)` }">Use ‹ › to browse a shelf · pull a bottle down to the glass</small>
      <div v-for="row in shelfRows" :key="row.id" class="pshelf-row" :style="row.style">
        <small class="pshelf-label">{{ row.label }}</small>
        <div :ref="(element) => trackLine(row.id, element as HTMLElement | null)" class="pshelf-bottles" @scroll="markEdges($event.currentTarget as HTMLElement)">
          <button v-for="ingredient in row.bottles" :key="ingredient.id" type="button" :title="`${ingredient.name} · ${pourable(ingredient.id)} ml`" :class="{ empty: pourable(ingredient.id) < 5, poured: game.currentMix.some((item) => item.ingredientId === ingredient.id) }" :aria-disabled="pourable(ingredient.id) < 5" :aria-label="`Drag ${ingredient.name} to the glass, ${pourable(ingredient.id)} ml left`" @pointerdown="beginBottleDrag(ingredient.id, $event)" @keydown.enter.prevent="addLiquid(ingredient.id)" @keydown.space.prevent="addLiquid(ingredient.id)">
            <BottleModel :ingredient="ingredient" :amount="game.currentMix.find((item) => item.ingredientId === ingredient.id)?.amount" />
            <span>{{ ingredient.name }}</span>
          </button>
        </div>
        <span class="shelf-nudge"><button type="button" :aria-label="`Scroll ${row.label} left`" @pointerdown.stop @click.stop="nudgeLine(row.id, -1)"><UiIcon name="chevron-left" /></button><button type="button" :aria-label="`Scroll ${row.label} right`" @pointerdown.stop @click.stop="nudgeLine(row.id, 1)"><UiIcon name="chevron-right" /></button></span>
      </div>
    </div>
    <div class="bartender-layer">
      <CharacterModel role="bartender" :character-id="game.decor.bartenderCharacter ?? 'noa'" :outfit="game.decor.bartender" :face-style="game.decor.face" :hair-style="game.decor.hairStyle" :hair-color="game.decor.hairColor" :body-shape="game.decor.bodyShape" :skin-detail="game.decor.skinDetail" :skin-tone="game.decor.skinTone" :tan-level="game.decor.tanLevel" :bust="game.decor.bust" :pose="game.decor.pose" :eye-shape="game.decor.eyeShape" :brow-shape="game.decor.browShape" :nose-shape="game.decor.noseShape" :lip-shape="game.decor.lipShape" :cheek-shape="game.decor.cheekShape" :eye-color="game.decor.eyeColor" :eyeliner="game.decor.eyeliner" :eyeshadow="game.decor.eyeshadow" :lip-color="game.decor.lipColor" :blush="game.decor.blush" :facial-hair="game.decor.facialHair" :outfit-color="game.decor.outfitColor" animation="idle" />
      <span class="name-ribbon">{{ (game.decor.bartenderNickname || (game.decor.bartenderCharacter === 'leo' ? 'Leo' : 'Noa')).toUpperCase() }} · BARTENDER</span>
    </div>
    <div v-if="!preview" ref="castRef" class="bar-cast" @scroll.passive="onGuestScroll">
      <!-- Only the figure and the card take taps; the rest of the guest's column lets presses reach the shelves. -->
      <button v-for="(customer, index) in game.customers" :key="customer.id" type="button" class="scene-customer" :class="{ active: customer.id === game.activeCustomerId, waiting: customer.id !== game.activeCustomerId }" :style="customerStyle(index)" :aria-label="`Talk to ${customer.name}`" @click="game.openConversation(customer.id)">
        <CharacterModel role="customer" :character-id="customer.characterId ?? CUSTOMER_ART_BY_SLOT[index % CUSTOMER_ART_BY_SLOT.length]" :seed="customer.id" :mood="customer.mood" :expression="faceOf(customer)" :animation="customer.id === game.activeCustomerId ? 'talk' : 'idle'" />
        <div class="guest-card">
          <header><b>{{ customer.name }}</b><time v-if="customer.id === game.activeCustomerId">{{ game.orderCountdown }}</time></header>
          <small class="guest-badges"><span v-for="badge in badges(customer)" :key="badge.label" :title="badge.label">{{ badge.icon }}</span><i v-if="!customer.social">{{ customer.mood }}</i><i v-else>{{ customer.social.phase === 'enjoying' ? 'enjoying' : EMOTION_LABEL[customer.social.emotion].toLowerCase() }}</i></small>
          <p>{{ bubbleText(customer) }}</p>
          <footer><span class="mini-patience"><i :style="{ width: patience(customer.patienceRemaining, customer.patience) + '%' }"></i></span><em :class="{ confirmed: customer.orderRevealed && customer.social?.phase !== 'enjoying' }">{{ customer.social?.phase === 'enjoying' ? 'Enjoying the drink' : customer.orderRevealed ? 'Order confirmed' : 'Tap to talk' }}</em></footer>
        </div>
      </button>
      <button v-if="game.ashtrays.dirty" type="button" class="clean-ashtrays" @click="game.cleanAshtrays()">🧹 Clean {{ game.ashtrays.dirty }} ashtray{{ game.ashtrays.dirty === 1 ? '' : 's' }}</button>
      <!-- The wait for the next guest is shown once, in the panel below the scene (with “Welcome now”). -->
    </div>
    <template v-if="guestsOverflow && !preview">
      <button class="guest-nudge prev" type="button" aria-label="Show earlier guests" :disabled="guestScroll <= 2" @click="nudgeGuests(-1)"><UiIcon name="chevron-left" /></button>
      <button class="guest-nudge next" type="button" aria-label="Show more guests" :disabled="guestScroll >= phoneTrack!.content - phoneTrack!.zone - 2" @click="nudgeGuests(1)"><UiIcon name="chevron-right" /></button>
    </template>
    <div v-if="buildingEnabled && !preview" ref="glassTarget" class="live-glass-station" :class="{ 'drag-over': dragOverGlass }">
      <div v-if="dragOverGlass || totalAmount || itemCount" class="live-glass-copy"><b>{{ dragOverGlass ? 'POURING' : totalAmount ? `${totalAmount} ML` : 'FRESH' }}</b><small v-if="itemCount">+ {{ itemCount }} fresh item{{ itemCount === 1 ? '' : 's' }}</small></div>
      <div class="live-glass-wrap">
        <div v-if="dragOverGlass" class="live-pour-stream" :style="{ '--stream-color': selectedIngredient ? colorMap[selectedIngredient.id] : liquidColor }"></div>
        <GlassModel type="highball" :fill="fill" :color="liquidColor" :ice="ice" :garnish="garnish" :bubbles="hasBubbles" animation="idle" />
        <button class="fresh-plus" type="button" :aria-expanded="freshPickerOpen" aria-label="Add fruit, ice, herb, or garnish" @click="freshPickerOpen = !freshPickerOpen"><UiIcon name="plus" /></button>
      </div>
      <!-- Rendered on <body>: the glass station is scaled down on phones, which would shrink and trap a fixed popup. -->
      <Teleport to="body">
        <PopoverPanel v-if="freshPickerOpen" class="fresh-picker" eyebrow="FRESH INGREDIENTS" title="Add to the glass" close-label="Close fresh ingredients" @close="freshPickerOpen = false">
          <div><button v-for="ingredient in freshIngredients" :key="ingredient.id" type="button" @click="addFresh(ingredient.id)"><BottleModel :ingredient="ingredient" /><span>{{ ingredient.name }}</span><small>+1</small></button></div>
        </PopoverPanel>
      </Teleport>
    </div>
    <!-- Over the glass the bottle settles above its rim and tips; the glass draws the single pour stream. -->
    <div v-if="draggingIngredientId && selectedIngredient" class="drag-bottle-ghost" :class="{ pouring: dragOverGlass }" :style="ghostStyle" aria-hidden="true">
      <span class="ghost-bottle"><BottleModel :ingredient="selectedIngredient" /></span>
      <b class="ghost-name">{{ selectedIngredient.name }} · {{ pourable(selectedIngredient.id) }} ml</b>
    </div>
  </section>
</template>
