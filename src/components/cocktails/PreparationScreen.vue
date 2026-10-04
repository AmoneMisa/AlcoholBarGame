<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue';
import { useGameStore } from '../../stores/game';
import { INGREDIENTS } from '../../domain/catalog';
import { ALCOHOL_PRODUCTS, ALCOHOL_TYPE_LABELS } from '../../domain/bottleCatalog';
import { preparationMatches } from '../../domain/preparationSearch';
import BottleModel from './BottleModel.vue';
import GlassModel from './GlassModel.vue';
import BrandBottle from '../knowledge/BrandBottle.vue';
import UiInput from '../ui/UiInput.vue';
import UiButton from '../ui/UiButton.vue';
import UiIcon from '../ui/UiIcon.vue';
import { guideIdForProduct } from '../../data/knowledge/alcohol';

const game = useGameStore();
const props = defineProps<{ workbench?: boolean }>();
const emit = defineEmits<{ close: [] }>();
const search = ref('');
const portion = ref(15);
const foodOpen = ref(false);
const glassTarget = ref<HTMLElement>();
const bottleRow = ref<HTMLElement>();
function scrollBottles(direction:number) { bottleRow.value?.scrollBy({left:direction * bottleRow.value.clientWidth,behavior:'smooth'}); }
const close = () => { game.preparationCustomerId = ''; emit('close'); };
const targetGuest = computed(() => game.customers.find(customer => customer.id === game.preparationCustomerId));
watch(() => [targetGuest.value?.id,targetGuest.value?.social?.phase,targetGuest.value?.orderRevealed], () => {
  const guest = targetGuest.value;
  if (!props.workbench && (!guest || guest.social?.phase === 'enjoying' || !guest.orderRevealed)) close();
});
const inMix = (id: string) => game.currentMix.find(item => item.ingredientId === id)?.amount ?? 0;
const stock = (id: string) => Math.max(0, (game.inventory.find(item => item.ingredientId === id)?.amount ?? 0) - inMix(id));
const needed = (id:string) => !props.workbench && game.recipe.ingredients.some(item => item.ingredientId === id && inMix(id) < item.amount);
const prioritize = (a:string,b:string) => Number(needed(b)) - Number(needed(a));
const amount = computed(() => game.currentMix.filter(item => INGREDIENTS.find(ingredient => ingredient.id === item.ingredientId)?.unit === 'ml').reduce((sum, item) => sum + item.amount, 0));
const ice = computed(() => inMix('ice'));
const garnish = computed(() => ['lime-wedge','orange','mint','pineapple-wedge'].find(id => inMix(id) > 0));
const requestedBottle = computed(() => game.customer.orderKind === 'serve' ? ALCOHOL_PRODUCTS.find(product => product.id === game.customer.serveRequest?.productId) : undefined);
const ready = computed(() => game.mixJudge.success && (!requestedBottle.value || game.pourBrands[requestedBottle.value.ingredientId] === requestedBottle.value.id));
const quest = computed(() => game.mixJudge.details.map(item => ({...item, ingredient:INGREDIENTS.find(ingredient => ingredient.id === item.ingredientId)!})));
const bottles = computed(() => ALCOHOL_PRODUCTS.filter(item => item.ingredientId && game.shelfBrandsFor(item.ingredientId).some(product => product.id === item.id) && stock(item.ingredientId) > 0 && preparationMatches(search.value,[item.name,item.brand,item.type,ALCOHOL_TYPE_LABELS[item.type]])).sort((a,b) => prioritize(a.ingredientId!,b.ingredientId!)));
const unbranded = computed(() => INGREDIENTS.filter(item => item.category === 'spirit' && (stock(item.id) > 0 || needed(item.id)) && !game.shelfBrandsFor(item.id).length && preparationMatches(search.value,[item.name,item.id])).sort((a,b)=>prioritize(a.id,b.id)));
const ingredients = computed(() => INGREDIENTS.filter(item => (foodOpen.value ? item.category === 'food' : item.category !== 'spirit' && item.category !== 'food') && (stock(item.id) > 0 || needed(item.id)) && preparationMatches(search.value,[item.name,item.id,item.category])).sort((a,b)=>prioritize(a.id,b.id)));
const drag = ref<{id:string;brand?:string;x:number;y:number;startX:number;startY:number;moved:boolean;pointerId:number;over:boolean}>();
const draggedIngredient = computed(() => INGREDIENTS.find(item => item.id === drag.value?.id));
const draggedBottle = computed(() => ALCOHOL_PRODUCTS.find(item => item.id === drag.value?.brand));
const feedback = ref('');
let feedbackTimer: ReturnType<typeof setTimeout>;
function clearMix() { clearTimeout(feedbackTimer); feedback.value = ''; cancelDrag(); game.resetMix(); }
function add(id:string,brand?:string) {
  const ingredient = INGREDIENTS.find(item => item.id === id);
  if (!ingredient) return;
  if (ingredient.category === 'food') { if (!props.workbench) game.act({type:'serveFood',ingredientId:id}); return; }
  const before = inMix(id);
  game.addIngredient(id,ingredient.unit === 'ml' ? portion.value : 1);
  if (inMix(id) > before) {
    game.setPourBrand(id,brand);
    game.shaken = false;
    feedback.value = `+${inMix(id)-before} ${ingredient.unit} · ${ingredient.name}`;
    clearTimeout(feedbackTimer);
    feedbackTimer = setTimeout(() => feedback.value = '',1800);
  }
}
function startDrag(event:PointerEvent,id:string,brand?:string) {
  if (event.button !== 0 || drag.value) return;
  const ingredient = INGREDIENTS.find(item => item.id === id);
  if (!ingredient || stock(id) < (ingredient.unit === 'ml' ? portion.value : 1)) return;
  event.preventDefault();
  (event.currentTarget as HTMLElement).setPointerCapture(event.pointerId);
  drag.value = {id,brand,x:event.clientX,y:event.clientY,startX:event.clientX,startY:event.clientY,moved:false,pointerId:event.pointerId,over:false};
}
function moveDrag(event:PointerEvent) {
  if (!drag.value || drag.value.pointerId !== event.pointerId) return;
  const box = glassTarget.value?.getBoundingClientRect();
  if (Math.hypot(event.clientX - drag.value.startX, event.clientY - drag.value.startY) > 10) drag.value.moved = true;
  Object.assign(drag.value,{x:event.clientX,y:event.clientY,over:!!box && event.clientX >= box.left && event.clientX <= box.right && event.clientY >= box.top && event.clientY <= box.bottom});
}
function endDrag(event:PointerEvent) {
  if (!drag.value || drag.value.pointerId !== event.pointerId) return;
  moveDrag(event);
  if (drag.value.over || !drag.value.moved) add(drag.value.id,drag.value.brand);
  drag.value = undefined;
}
function cancelDrag() { drag.value = undefined; }
function onKey(event:KeyboardEvent) { if (event.key === 'Escape') { if (drag.value) cancelDrag(); else close(); } }
onMounted(() => {
  window.addEventListener('keydown',onKey);
  window.addEventListener('pointermove',moveDrag);
  window.addEventListener('pointerup',endDrag);
  window.addEventListener('pointercancel',cancelDrag);
});
onBeforeUnmount(() => {
  clearTimeout(feedbackTimer);
  window.removeEventListener('keydown',onKey);
  window.removeEventListener('pointermove',moveDrag);
  window.removeEventListener('pointerup',endDrag);
  window.removeEventListener('pointercancel',cancelDrag);
});
</script>

<template>
  <Teleport to="body">
    <section class="preparation-screen counter-preparation" role="dialog" aria-modal="true" :aria-label="workbench ? 'Mixing counter' : `Prepare the guest's order`">
      <header class="counter-prep-head">
        <UiButton size="sm" variant="secondary" data-guide="prep-back" @click="close"><UiIcon name="chevron-left" />Back to bar</UiButton>
        <div class="counter-prep-title"><small>{{ workbench ? 'YOUR BAR' : `ORDER FOR ${targetGuest?.name}` }}</small><h1>{{ workbench ? 'Mixing counter' : game.recipe.name }}</h1></div>
        <UiInput data-guide="prep-search" v-model="search" label="Find a bottle or ingredient" aria-label="Find a bottle or ingredient" placeholder="Wine, Jack Daniel’s, lime…" type="search" />
      </header>
      <div class="counter-prep-room">
        <section class="counter-bottle-rack" aria-label="Bottle shelf">
          <div class="counter-rack-heading"><span>BACK BAR</span><small>Tap a bottle or drag it to the glass</small><span class="counter-shelf-nav"><button type="button" aria-label="Show previous bottles" @click="scrollBottles(-1)"><UiIcon name="chevron-left" /></button><button type="button" aria-label="Show more bottles" @click="scrollBottles(1)"><UiIcon name="chevron-right" /></button></span></div>
          <div ref="bottleRow" class="counter-bottle-row">
            <button v-for="product in bottles" :key="product.id" type="button" class="counter-bottle" data-guide="prep-bottle" :class="{ needed:needed(product.ingredientId!) }" :disabled="stock(product.ingredientId!) < portion" :aria-label="`Pour ${product.brand} into glass`" @pointerdown="startDrag($event,product.ingredientId!,product.id)" @keydown.enter.prevent="add(product.ingredientId!,product.id)" @keydown.space.prevent="add(product.ingredientId!,product.id)">
              <span class="counter-bottle-art"><BrandBottle :brand="product.brand" :category="guideIdForProduct(product)" :color="product.color" /></span><b>{{ product.brand }}</b><small>{{ stock(product.ingredientId!) }} ml</small>
            </button>
            <button v-for="item in unbranded" :key="item.id" type="button" class="counter-bottle" data-guide="prep-bottle" :class="{ needed:needed(item.id) }" :disabled="stock(item.id) < portion" :aria-label="`Pour ${item.name} into glass`" @pointerdown="startDrag($event,item.id)" @keydown.enter.prevent="add(item.id)" @keydown.space.prevent="add(item.id)"><span class="counter-bottle-art"><BottleModel :ingredient="item" /></span><b>{{ item.name }}</b><small>{{ stock(item.id) }} ml</small></button>
            <p v-if="!bottles.length && !unbranded.length" class="counter-empty">No bottles match your search.</p>
          </div>
        </section>
        <div class="counter-stage">
          <div class="counter-drink-station">
            <div ref="glassTarget" class="counter-glass-target" :class="{ receiving:drag?.over, complete:ready }" aria-label="Cocktail glass drop zone" data-guide="glass">
              <GlassModel type="highball" :fill="Math.min(92, amount / 3)" :ice="ice" :garnish="garnish" :animation="game.shaken ? 'shake' : 'idle'" />
              <span class="counter-drink-amount">{{ amount }} ml<template v-if="ice"> · {{ ice }} ice</template></span>
              <span v-if="drag" class="counter-drop-hint">{{ drag.over ? 'Release to pour' : 'Bring it here' }}</span>
              <span v-if="feedback" class="counter-pour-feedback" role="status">{{ feedback }}</span>
            </div>
            <div class="counter-tools"><UiButton variant="secondary" data-guide="prep-clear" :disabled="!game.currentMix.length" @click="clearMix">Clear</UiButton><UiButton variant="secondary" data-guide="shake" :disabled="!game.currentMix.length" @click="game.shakeCurrentMix()">Mix</UiButton></div>
          </div>
          <aside class="counter-order-quest" aria-label="Order ingredients" aria-live="polite">
            <template v-if="workbench"><small>COCKTAIL COUNTER</small><h2>Choose a guest</h2><p>Confirm a cocktail order in a conversation, then return here to prepare it.</p><UiButton v-for="guest in game.customers.filter(item=>!item.pendingPayment && item.social?.phase !== 'enjoying')" :key="guest.id" size="sm" @click="close(); game.openConversation(guest.id)">Talk to {{ guest.name }}</UiButton><p v-if="!game.customers.length">Your next guest will arrive soon.</p></template>
            <template v-else>
            <small>YOUR ORDER</small><h2>{{ game.recipe.name }}</h2>
            <template v-if="!ready">
              <p class="counter-quest-progress">{{ quest.filter(item=>item.ok).length }} / {{ quest.length }} ingredients</p>
              <ul><li v-for="item in quest" :key="item.ingredientId" :class="{ done:item.ok, excess:item.actual > item.expected }"><span class="counter-quest-check">{{ item.ok ? '✓' : '○' }}</span><span><b>{{ item.ingredient.name }}</b><small>{{ item.actual }} / {{ item.expected }} {{ item.ingredient.unit }}</small></span></li></ul>
              <p v-if="game.recipe.needsShake" class="counter-mix-task" :class="{ done:game.shaken }">{{ game.shaken ? '✓ Mixed' : '○ Mix the cocktail' }}</p>
              <p v-if="requestedBottle && game.pourBrands[requestedBottle.ingredientId] !== requestedBottle.id" class="counter-mix-task">Use {{ requestedBottle.brand }} for this order.</p>
              <p v-if="quest.some(item=>item.actual > item.expected)" class="counter-quest-error">Too much added. Clear the glass and try again.</p>
            </template>
            <div v-else class="counter-order-ready"><span>✓</span><p>Ready for {{ targetGuest?.name }}</p><UiButton variant="solid" data-guide="serve" :disabled="game.serving" @click="game.serveMix()">Serve order <UiIcon name="arrow-right" /></UiButton></div>
            </template>
          </aside>
        </div>
        <section class="counter-ingredient-drawer" aria-label="Ingredients under the counter">
          <div class="counter-drawer-heading"><div class="counter-drawer-tabs"><UiButton size="sm" :variant="!foodOpen ? 'solid' : 'secondary'" @click="foodOpen=false">Ingredients</UiButton><UiButton v-if="!workbench" size="sm" data-guide="prep-food" :variant="foodOpen ? 'solid' : 'secondary'" @click="foodOpen=true">Food</UiButton></div><div class="counter-pour-sizes"><small>Pour</small><UiButton v-for="size in [5,15,30]" :key="size" size="sm" :variant="portion===size ? 'solid' : 'secondary'" @click="portion=size">{{ size }} ml</UiButton></div></div>
          <div class="counter-ingredient-row">
            <button v-for="item in ingredients" :key="item.id" type="button" class="counter-ingredient" data-guide="prep-ingredient" :class="{ needed:needed(item.id) }" :disabled="stock(item.id) < (item.unit==='ml' ? portion : 1)" :aria-label="`${item.category==='food' ? 'Serve' : 'Add'} ${item.name}`" @click="add(item.id)"><BottleModel :ingredient="item" /><span><b>{{ item.name }}</b><small>{{ item.category==='food' ? 'Serve food' : item.unit==='ml' ? `+${portion} ml` : '+1 piece' }} · {{ stock(item.id) }} left</small></span></button>
            <p v-if="!ingredients.length" class="counter-empty">{{ search ? 'No matching ingredients.' : foodOpen ? 'No food in stock.' : 'No ingredients in stock.' }}</p>
          </div>
        </section>
      </div>
      <div v-if="drag && draggedIngredient" class="counter-drag-bottle" :class="{ pouring:drag.over }" :style="{left:`${drag.x}px`,top:`${drag.y}px`}" aria-hidden="true"><BrandBottle v-if="draggedBottle" :brand="draggedBottle.brand" :category="guideIdForProduct(draggedBottle)" /><BottleModel v-else :ingredient="draggedIngredient" /></div>
    </section>
  </Teleport>
</template>

<style>
.counter-preparation { position:fixed; z-index:1200; inset:0; display:grid; background:linear-gradient(#15121bd9,#140e19b8),url('/assets/bar/backgrounds/velvet-hour-bar.webp') center 48%/cover; color:#f6e6cc; }
.counter-prep-head { display:flex; align-items:center; gap:16px; padding:12px 24px; border-bottom:1px solid #b38b514f; background:#101421e6; }
.counter-prep-title { flex:1; min-width:0; }
.counter-prep-title small { color:#cdb07a; font-size:13px; letter-spacing:.1em; }
.counter-prep-title h1 { margin:4px 0 0; font:700 22px Georgia,serif; }
.counter-prep-head .ui-input-field { flex:0 0 280px; min-width:0; }
.counter-prep-head .ui-input { width:100%; }
.counter-preparation { grid-template-rows:auto minmax(0,1fr); }
.counter-prep-room { min-height:0; display:grid; grid-template-rows:auto minmax(300px,1fr) auto; overflow-y:auto; padding:16px clamp(12px,5vw,80px) 0; }
.counter-bottle-rack { min-width:0; padding:10px 14px 0; background:linear-gradient(#1c1012bb,#281a16b3); border:1px solid #99714170; border-radius:14px 14px 0 0; box-shadow:0 14px 24px #0007; }
.counter-rack-heading { display:flex; align-items:center; justify-content:space-between; gap:12px; color:#e0bd77; font-size:13px; letter-spacing:.12em; }
.counter-rack-heading small { color:#bcb1a2; letter-spacing:0; font-size:13px; }
.counter-shelf-nav { display:flex; gap:6px; }
.counter-shelf-nav button { display:grid; place-items:center; width:26px; height:26px; padding:3px; border:1px solid #a77c4b66; border-radius:7px; background:#241a19; color:#d8b97d; cursor:pointer; }
.counter-shelf-nav .ui-icon { width:16px; height:16px; }
.counter-bottle-row { display:grid; grid-auto-flow:column; grid-auto-columns:calc((100% - 9 * 12px)/10); gap:12px; overflow-x:auto; align-items:end; padding:12px 0 8px; border-bottom:12px solid #63402a; box-shadow:0 3px #b98a4c,0 7px 9px #0007; scrollbar-width:thin; scrollbar-color:#b88a51 #241b19; scroll-snap-type:x mandatory; }
.counter-bottle { display:grid; justify-items:center; gap:4px; flex:0 0 88px; padding:0 2px; border:0; background:none; color:#dac9ac; cursor:grab; touch-action:none; user-select:none; }
.counter-bottle:disabled { opacity:.4; cursor:default; }
.counter-bottle { min-width:0; scroll-snap-align:start; }
.counter-bottle-art { display:grid; place-items:center; width:80px; height:80px; pointer-events:none; }
.counter-bottle-art .brand-bottle { width:80px; height:80px; }
.counter-bottle-art .brand-bottle i { width:115%; }
.counter-bottle-art .bottle-visual { width:80px; height:100px; margin:0; }
.counter-bottle b { width:100%; font-size:13px; line-height:1.25; text-align:center; overflow-wrap:anywhere; }
.counter-bottle small { font-size:13px; color:#b5a68f; }
.counter-bottle.needed b,.counter-ingredient.needed b { color:#f6d58a; }
.counter-bottle:focus-visible,.counter-ingredient:focus-visible { outline:2px solid #f1c575; outline-offset:2px; border-radius:8px; }
.counter-stage { position:relative; min-height:0; display:grid; grid-template-columns:minmax(0,1fr) clamp(220px,26vw,340px); grid-template-rows:minmax(0,1fr); align-items:center; gap:32px; padding:12px 24px; isolation:isolate; }
.counter-stage::before { content:''; position:absolute; z-index:-1; inset:42% -5vw 0; border-top:2px solid #cb9a58; border-bottom:12px solid #28140e; background:repeating-linear-gradient(0deg,#ffffff03 0 1px,transparent 1px 5px),linear-gradient(165deg,#9c6240,#492e24 55%,#211513); box-shadow:0 -10px 25px #0007,inset 0 4px 0 #e1b97a55; }
.counter-drink-station { min-width:0; min-height:0; height:100%; display:grid; align-content:center; justify-items:center; gap:8px; }
.counter-glass-target { position:relative; display:grid; justify-items:center; align-content:end; width:min(100%,280px); min-height:180px; border-radius:24px; padding:12px; }
.counter-glass-target .glass-model { width:130px !important; height:clamp(160px,23vh,240px) !important; max-width:100%; filter:drop-shadow(0 12px 10px #0009); }
.counter-glass-target.receiving { background:#e2c16f16; box-shadow:inset 0 0 0 2px #f3c770,0 0 32px #e5a83f33; }
.counter-drink-amount { padding:6px 12px; background:#1c1418d9; border:1px solid #be935c66; border-radius:20px; font-size:13px; color:#eed3a0; }
.counter-drop-hint,.counter-pour-feedback { position:absolute; top:0; left:50%; translate:-50% 0; width:max-content; max-width:100%; padding:6px 10px; border-radius:8px; background:#191d29ed; font-size:13px; color:#f5d58e; text-align:center; }
.counter-tools { display:flex; gap:10px; justify-content:center; width:100%; }
.counter-tools .ui-btn { min-width:100px; }
.counter-order-quest { align-self:center; min-width:0; min-height:0; max-height:100%; overflow-y:auto; padding:16px; background:linear-gradient(140deg,#171c29ef,#11131cee); border:1px solid #be9659; border-radius:14px; box-shadow:0 8px 28px #0006; }
.counter-order-quest > small { color:#caaa6b; font-size:13px; letter-spacing:.15em; }
.counter-order-quest h2 { margin:6px 0 12px; font:700 22px Georgia,serif; overflow-wrap:anywhere; }
.counter-quest-progress { margin:0 0 12px; font-size:13px; color:#b4a899; }
.counter-order-quest ul { display:grid; gap:8px; list-style:none; padding:0; margin:0; }
.counter-order-quest li { display:flex; align-items:center; gap:9px; font-size:13px; }
.counter-quest-check { flex:none; width:18px; font-size:18px; color:#baa681; }
.counter-order-quest li small { display:block; margin-top:4px; color:#aeaca8; font-size:13px; font-variant-numeric:tabular-nums; }
.counter-order-quest li.done .counter-quest-check,.counter-order-quest .done { color:#91d6ae; }
.counter-order-quest li.excess small,.counter-quest-error { color:#efa392; }
.counter-mix-task,.counter-quest-error { margin:12px 0 0; font-size:13px; line-height:1.4; }
.counter-order-ready { display:grid; justify-items:center; gap:12px; text-align:center; }
.counter-order-ready > span { font-size:40px; color:#8be4b1; }
.counter-order-ready p { margin:0; font-size:13px; }
.counter-order-ready .ui-btn { width:100%; }
.counter-order-ready .ui-btn-label { white-space:normal; }
.counter-ingredient-drawer { min-width:0; padding:14px 16px max(16px,env(safe-area-inset-bottom)); border:1px solid #8e633e; border-top:5px solid #bc9058; background:linear-gradient(#3e2922f5,#1c1516); border-radius:8px 8px 0 0; box-shadow:0 -5px 18px #0006; }
.counter-drawer-heading { display:flex; justify-content:space-between; gap:12px; align-items:center; margin-bottom:12px; }
.counter-drawer-tabs,.counter-pour-sizes { display:flex; align-items:center; gap:6px; }
.counter-pour-sizes small { color:#b9aa94; font-size:13px; }
.counter-ingredient-row { display:grid; grid-auto-flow:column; grid-auto-columns:calc((100% - 7 * 10px)/8); gap:10px; overflow-x:auto; padding:3px 0 8px; scrollbar-width:thin; scrollbar-color:#b98a51 #241b19; scroll-snap-type:x mandatory; }
.counter-ingredient { flex:0 0 116px; display:grid; justify-items:center; gap:5px; padding:8px; border:1px solid #a97f4e5e; border-radius:10px; background:#18151a70; color:#dac9ac; text-align:center; cursor:pointer; }
.counter-ingredient:disabled { opacity:.4; cursor:default; }
.counter-ingredient { min-width:0; scroll-snap-align:start; }
.counter-ingredient .bottle-visual { width:76px; height:50px; margin:0; pointer-events:none; }
.counter-ingredient b { display:block; font-size:13px; line-height:1.25; }
.counter-ingredient small { display:block; margin-top:5px; color:#b2a593; font-size:13px; }
.counter-empty { color:#baa98d; font-size:13px; padding:12px; }
.counter-drag-bottle { position:fixed; z-index:2; width:100px; height:130px; translate:-50% -75%; pointer-events:none; filter:drop-shadow(0 12px 8px #0008); }
.counter-drag-bottle.pouring { transform:rotate(-35deg); }
.counter-drag-bottle .brand-bottle,.counter-drag-bottle .bottle-visual { width:100%; height:100%; margin:0; }
@media(max-width:600px) {
  .counter-prep-head { flex-wrap:wrap; gap:8px 12px; padding:10px 12px; }
  .counter-prep-head > .ui-btn { padding:8px; }
  .counter-prep-title h1 { font-size:18px; }
  .counter-prep-head .ui-input-field { flex-basis:100%; }
  .counter-prep-head .ui-field-label { display:none; }
  .counter-prep-room { padding:10px 10px 0; grid-template-rows:auto minmax(300px,1fr) auto; }
  .counter-bottle-rack { padding:8px 8px 0; }
  .counter-rack-heading { font-size:13px; gap:6px; }
  .counter-rack-heading small { font-size:13px; }
  .counter-bottle-row { grid-auto-columns:calc((100% - 3 * 12px)/4); gap:12px; padding:6px 0; border-bottom-width:8px; }
  .counter-bottle { flex-basis:70px; }
  .counter-bottle-art,.counter-bottle-art .brand-bottle { width:65px; height:74px; }
  .counter-bottle-art .bottle-visual { width:65px; height:74px; }
  .counter-bottle b { font-size:13px; }
  .counter-stage { grid-template-columns:minmax(0,1fr) 142px; gap:8px; padding:12px 0; }
  .counter-glass-target { width:100%; padding:6px; }
  .counter-glass-target .glass-model { width:100px !important; height:clamp(150px,22vh,200px) !important; }
  .counter-order-quest { padding:12px 10px; border-radius:10px; }
  .counter-order-quest h2 { font-size:17px; margin-bottom:8px; }
  .counter-order-quest li { font-size:13px; gap:6px; }
  .counter-order-quest li small { font-size:13px; }
  .counter-order-quest ul { gap:8px; }
  .counter-quest-progress { font-size:13px; margin-bottom:10px; }
  .counter-tools { gap:6px; }
  .counter-tools .ui-btn { min-width:0; padding:9px 12px; }
  .counter-ingredient-drawer { padding:10px 8px max(8px,env(safe-area-inset-bottom)); }
  .counter-drawer-heading { flex-wrap:wrap; gap:8px; margin-bottom:6px; }
  .counter-drawer-heading .ui-btn { padding:7px 8px; font-size:13px; }
  .counter-pour-sizes { margin-left:auto; gap:4px; }
  .counter-pour-sizes > small { display:none; }
  .counter-ingredient { flex-basis:90px; padding:6px; }
  .counter-ingredient-row { grid-auto-columns:calc((100% - 2 * 10px)/3); }
  .counter-ingredient .bottle-visual { width:65px; height:50px; }
}
@media(min-width:601px) and (max-width:1000px) { .counter-bottle-row { grid-auto-columns:calc((100% - 5 * 12px)/6); } .counter-ingredient-row { grid-auto-columns:calc((100% - 4 * 10px)/5); } }
@media(max-width:360px) { .counter-bottle-row { grid-auto-columns:calc((100% - 2 * 12px)/3); } .counter-stage { grid-template-columns:minmax(0,1fr) 130px; } }
@media(min-width:601px) and (max-height:760px) {
  .counter-prep-head { padding:8px 16px; }
  .counter-prep-head .ui-field-label { display:none; }
  .counter-prep-room { grid-template-rows:auto minmax(280px,1fr) auto; padding-top:10px; }
  .counter-bottle-art,.counter-bottle-art .brand-bottle,.counter-bottle-art .bottle-visual { width:60px; height:60px; }
  .counter-bottle-row { padding-top:6px; }
  .counter-ingredient-drawer { padding-top:8px; padding-bottom:8px; }
  .counter-drawer-heading { margin-bottom:6px; }
  .counter-ingredient .bottle-visual { height:40px; }
  .counter-order-quest { padding:12px; }
  .counter-order-quest h2 { margin-bottom:8px; }
  .counter-quest-progress { margin-bottom:8px; }
}
@media(max-height:650px) { .counter-prep-room { overflow-y:auto; grid-template-rows:auto minmax(260px,1fr) auto; } }
</style>

