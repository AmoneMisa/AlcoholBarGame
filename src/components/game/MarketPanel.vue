<script setup lang="ts">
import UiCheckbox from '../ui/UiCheckbox.vue';
import PanelHeading from '../ui/PanelHeading.vue';
import { computed, ref, watch } from 'vue';
import { INGREDIENTS } from '../../domain/catalog';
import { useGameStore } from '../../stores/game';
import BottleModel from '../cocktails/BottleModel.vue';
import UiIcon from '../ui/UiIcon.vue';
import { AUTO_SUPPLY_LEVEL, formatDeliveryTime } from '../../domain/progression';
import TradeTalk from './TradeTalk.vue';
import UiButton from '../ui/UiButton.vue';
import UiInput from '../ui/UiInput.vue';
import SpeakButton from '../ui/SpeakButton.vue';
import ConfirmDialog from '../ui/ConfirmDialog.vue';

const game = useGameStore();
const mode = ref<'buy'|'sell'>('buy');
const category = ref('all');
// One window for supplies: it shows what a top-up would order now and the switch for doing it automatically.
const confirm = ref(false);
// Opens at level 5 (the training lesson may use it earlier, as practice).
const supplyLocked = computed(() => game.level < AUTO_SUPPLY_LEVEL);
const autoChoice = ref(false);
const topUp = computed(() => (confirm.value ? game.topUpPreview() : { orders: [], total: 0 } as ReturnType<typeof game.topUpPreview>));
const openSupply = () => { autoChoice.value = game.autoSupply; confirm.value = true; };
function doSupply() {
  const orders = topUp.value.orders.length;
  confirm.value = false;
  if (autoChoice.value !== game.autoSupply) game.setAutoSupply(autoChoice.value);
  if (orders) game.topUp();
}
const ingredient = (id:string) => INGREDIENTS.find((item) => item.id === id)!;
const group = (id:string) => ingredient(id).category === 'spirit' ? 'spirit' : ingredient(id).category === 'mixer' && !['sugar-syrup','coconut-cream'].includes(id) ? 'mixer' : 'fresh';
const search = ref('');
watch(() => game.trainingActive, active => { if (active) { mode.value = 'buy'; category.value = 'all'; search.value = ''; } }, { immediate:true });
const byName = (id: string) => !search.value.trim() || ingredient(id).name.toLowerCase().includes(search.value.trim().toLowerCase());
const offers = computed(() => game.market.filter((offer) => offer.supplierId === game.selectedSupplier && (category.value === 'all' || group(offer.ingredientId) === category.value) && byName(offer.ingredientId)));
const stock = computed(() => game.visibleInventory.filter((item) => (category.value === 'all' || group(item.ingredientId) === category.value) && byName(item.ingredientId)));
const available = (id:string) => Math.max(0,(game.inventory.find((item) => item.ingredientId === id)?.amount ?? 0) - (game.currentMix.find((item) => item.ingredientId === id)?.amount ?? 0));
const buyback = (id:string,quantity:number) => (ingredient(id).basePrice * quantity * game.region.marketFactor * .55 * game.economy.buybackFactor(id)).toFixed(0);
const offerFor = (id:string) => game.market.find((offer) => offer.supplierId === game.selectedSupplier && offer.ingredientId === id);
const buyUnit = (id:string, plural = false) => ingredient(id).unit === 'ml' ? (plural ? 'bottles' : 'bottle') : (plural ? 'packs' : 'pack');
const packageDescription = (id:string, quantity:number) => ingredient(id).unit === 'ml' ? `${quantity} ml bottle` : `${quantity} ${ingredient(id).unit} pack`;
const receivedAmount = (id:string, count:number) => {
  const offer = offerFor(id);
  return offer ? `${offer.quantity * count} ${ingredient(id).unit}` : '';
};
function adjust(id:string,delta:number) { game.purchaseCart[id] = Math.min(99,Math.max(0,(game.purchaseCart[id] ?? 0) + delta)); }
function adjustSale(id:string,delta:number) {
  const step = ingredient(id).unit === 'ml' ? 5 : 1;
  game.saleCart[id] = Math.min(Math.floor(available(id)),Math.max(0,(game.saleCart[id] ?? 0) + delta * step));
}
function sellAll() { game.saleCart = Object.fromEntries(game.inventory.map((item) => [item.ingredientId,Math.floor(available(item.ingredientId))])); }
</script>

<template>
  <article class="game-panel market-panel">
    <PanelHeading :eyebrow="`TRADE FLOOR · ${game.region.name}`" title="Stock your next shift" />
    <!-- Level perks live on the bar scene's city chip; the market only shows what changes buying here. -->
    <!-- One supply card, one button: the window shows what would be ordered now and lets the player keep it automatic. -->
    <p v-if="supplyLocked" class="supply-hint">Supply (one-tap restock) unlocks at level {{ AUTO_SUPPLY_LEVEL }}.</p>
    <div v-else class="auto-supply" :class="{ on: game.autoSupply }">
      <div><b>Supply</b><small>{{ supplyLocked ? `Unlocks at level ${AUTO_SUPPLY_LEVEL}.` : game.autoSupply ? 'Auto-supply is on: anything that runs low is reordered for you.' : 'Reorders what runs low from the cheapest supplier, at normal prices and delivery fees.' }}</small></div>
      <UiButton variant="solid" data-guide="top-up" :disabled="supplyLocked" @click="openSupply">{{ supplyLocked ? `Level ${AUTO_SUPPLY_LEVEL}` : 'Supply low stock' }}</UiButton>
    </div>
    <ConfirmDialog v-if="confirm" title="Supply low stock" :confirm-label="topUp.orders.length ? 'Place the orders' : 'Save'" :disabled="!topUp.orders.length && autoChoice === game.autoSupply" :reason="topUp.orders.length && game.money < topUp.total ? `Not enough coins: you need ${topUp.total.toFixed(0)}, you have ${Math.floor(game.money)}.` : ''" @cancel="confirm = false" @confirm="doSupply">
      <template v-if="topUp.orders.length">
        <p>These are running low. This orders one pack of each from the cheapest supplier. Nothing changes until you confirm.</p>
        <ul><li v-for="order in topUp.orders" :key="order.supplier"><span>{{ order.supplier }}: {{ order.items.map((item) => ingredient(item.ingredientId).name).join(', ') }}</span><b>{{ order.total.toFixed(0) }} coins</b></li></ul>
        <p><b>Total {{ topUp.total.toFixed(0) }} coins.</b> Deliveries still take time{{ topUp.days !== undefined ? ` (about ${formatDeliveryTime(topUp.days)})` : '' }}.</p>
      </template>
      <p v-else>Nothing is running low, or an order is already on its way.</p>
      <UiCheckbox v-model="autoChoice" label="Keep doing this automatically" :disabled="game.level < AUTO_SUPPLY_LEVEL" :hint="game.level < AUTO_SUPPLY_LEVEL ? `Unlocks at level ${AUTO_SUPPLY_LEVEL}.` : 'From now on anything that runs low is reordered without asking. It pauses when coins run out.'" />
    </ConfirmDialog>
    <TradeTalk />
    <div class="market-modes"><button :class="{active:mode === 'buy'}" type="button" @click="mode = 'buy'">Buy supplies</button><button :class="{active:mode === 'sell'}" type="button" @click="mode = 'sell'">Sell stock</button><span>City prices {{ game.region.marketFactor.toFixed(2) }}× · prices change each shift</span></div>
    <div v-if="mode === 'buy'" class="supplier-picker polished-suppliers">
      <button v-for="supplier in game.localSuppliers" :key="supplier.id" :class="{ active:game.selectedSupplier === supplier.id }" type="button" @click="game.selectSupplier(supplier.id)">
        <span class="supplier-icon" :class="supplier.id"><UiIcon :name="supplier.icon" /></span>
        <div><h3>{{ supplier.name }}</h3><p>{{ supplier.description }}</p><small>Delivery {{ formatDeliveryTime(supplier.deliveryDays * game.economy.delivery) }} · {{ supplier.reputation }}/5 reputation</small><em>Fee {{ supplier.deliveryFee }} coins · free from {{ supplier.freeDeliveryAt }} coins</em></div>
      </button>
    </div>
    <div class="category-tabs market-filter"><button v-for="item in ['all','spirit','mixer','fresh']" :key="item" :class="{active:category === item}" type="button" @click="category = item">{{ {all:'All',spirit:'Spirits',mixer:'Mixers',fresh:'Fresh & food'}[item] }}</button></div>
    <div class="market-search"><UiInput v-model="search" label="Find a product" placeholder="Type a name, e.g. rum or lime" autocomplete="off" /></div>
    <div class="market-trading-layout">
      <div class="market-products">
        <article v-for="offer in mode === 'buy' ? offers : []" :key="offer.ingredientId" class="market-product">
          <BottleModel :ingredient="ingredient(offer.ingredientId)" />
          <div class="market-product-copy"><small>{{ offer.quality }} · {{ packageDescription(offer.ingredientId, offer.quantity) }}</small><h3>{{ ingredient(offer.ingredientId).name }} <SpeakButton :text="ingredient(offer.ingredientId).name" /></h3><span>{{ available(offer.ingredientId) }} {{ ingredient(offer.ingredientId).unit }} in stock</span><span class="stock-conversion">1 {{ buyUnit(offer.ingredientId) }} adds {{ offer.quantity }} {{ ingredient(offer.ingredientId).unit }} to stock</span><b>{{ offer.price.toFixed(0) }} coins <del v-if="offer.discountPercent">{{ offer.listPrice.toFixed(0) }}</del></b><em v-if="offer.discountPercent">Today’s deal −{{ offer.discountPercent }}%</em></div>
          <div class="pack-stepper"><button type="button" :aria-label="`Remove one ${ingredient(offer.ingredientId).name} ${buyUnit(offer.ingredientId)}`" @click="adjust(offer.ingredientId,-1)">−</button><input v-model.number="game.purchaseCart[offer.ingredientId]" type="number" min="0" max="99" :placeholder="'0'" :aria-label="`${ingredient(offer.ingredientId).name} ${buyUnit(offer.ingredientId, true)}`" /><button type="button" data-guide="market-plus" :aria-label="`Add one ${ingredient(offer.ingredientId).name} ${buyUnit(offer.ingredientId)}`" @click="adjust(offer.ingredientId,1)">+</button><small>{{ buyUnit(offer.ingredientId, true) }}</small></div>
        </article>
        <article v-for="item in mode === 'sell' ? stock : []" :key="item.ingredientId" class="market-product">
          <BottleModel :ingredient="ingredient(item.ingredientId)" />
          <div class="market-product-copy"><small>BUYBACK DESK</small><h3>{{ ingredient(item.ingredientId).name }}</h3><span>{{ available(item.ingredientId) }} {{ ingredient(item.ingredientId).unit }} available</span><b>{{ buyback(item.ingredientId,ingredient(item.ingredientId).unit === 'ml' ? 100 : 1) }} coins / {{ ingredient(item.ingredientId).unit === 'ml' ? '100 ml' : 'item' }}</b></div>
          <div class="sell-quantity"><button type="button" :aria-label="`Reduce ${ingredient(item.ingredientId).name} sale quantity`" @click="adjustSale(item.ingredientId,-1)">−</button><input v-model.number="game.saleCart[item.ingredientId]" type="number" min="0" :max="available(item.ingredientId)" :step="ingredient(item.ingredientId).unit === 'ml' ? 5 : 1" placeholder="0" :aria-label="`${ingredient(item.ingredientId).name} sale quantity`" /><button type="button" :aria-label="`Increase ${ingredient(item.ingredientId).name} sale quantity`" @click="adjustSale(item.ingredientId,1)">+</button><small>{{ ingredient(item.ingredientId).unit }}</small><button type="button" class="quantity-all" @click="game.saleCart[item.ingredientId] = Math.floor(available(item.ingredientId))">All</button></div>
        </article>
      </div>
      <aside class="trade-checkout">
        <template v-if="mode === 'buy'">
          <small>YOUR ORDER</small><h3>{{ game.purchaseQuote.packs }} supplier {{ game.purchaseQuote.packs === 1 ? 'unit' : 'units' }}</h3><p>To {{ game.decor.name }} · {{ game.region.name }}</p>
          <div v-for="line in game.purchaseQuote.lines" :key="line.ingredientId" class="checkout-line"><span>{{ ingredient(line.ingredientId).name }} · {{ line.packs }} {{ buyUnit(line.ingredientId, line.packs !== 1) }}<em>+{{ receivedAmount(line.ingredientId, line.packs) }} stock</em></span><b>{{ line.subtotal.toFixed(0) }}</b></div>
          <p v-if="!game.purchaseQuote.lines.length" class="cart-empty">Choose bottles or packs with +, or type a quantity.</p>
          <dl><div><dt>Supplies</dt><dd>{{ game.purchaseQuote.subtotal.toFixed(0) }}</dd></div><div><dt>Bulk discount {{ game.purchaseQuote.discountRate * 100 }}%</dt><dd>−{{ game.purchaseQuote.discount.toFixed(0) }}</dd></div><div><dt>Delivery</dt><dd>{{ game.purchaseQuote.delivery ? game.purchaseQuote.delivery.toFixed(0) : 'Free' }}</dd></div><div class="checkout-total"><dt>Total coins</dt><dd>{{ game.purchaseQuote.total.toFixed(0) }}</dd></div></dl>
          <div class="delivery-progress"><span>{{ game.purchaseQuote.freeDeliveryRemaining ? `${game.purchaseQuote.freeDeliveryRemaining.toFixed(0)} more coins for free delivery` : 'Free delivery unlocked' }}</span><progress :max="game.supplier.freeDeliveryAt" :value="game.purchaseQuote.subtotal - game.purchaseQuote.discount"></progress></div>
          <p v-if="game.trainingActive" class="discount-help">Practice delivery arrives immediately. Your real coins and stock remain unchanged.</p>
          <p v-else class="discount-help">5+ supplier units: 5% off · 10+: 10% off<br />Arrives in {{ game.supplier.deliveryDays }} {{ game.supplier.deliveryDays === 1 ? 'shift' : 'shifts' }}.</p>
          <UiButton variant="secondary" class="negotiate-button" :disabled="!game.purchaseQuote.lines.length" title="Talk to the sales rep in English to lower the price" @click="game.startNegotiation()">Negotiate</UiButton>
          <UiButton variant="solid" data-guide="market-order" :disabled="!game.purchaseQuote.lines.length || game.purchaseQuote.total > game.money" @click="game.checkoutPurchase()">Place order</UiButton>
          <UiButton variant="secondary" size="sm" @click="game.purchaseCart = {}">Clear</UiButton>
        </template>
        <template v-else>
          <small>STOCK BUYBACK</small><h3>Sell by volume</h3><p>Liquids are sold from open stock in 5 ml steps. Fresh items are sold one piece at a time. Payment is immediate.</p>
          <div v-for="line in game.saleQuote" :key="line.ingredientId" class="checkout-line"><span>{{ ingredient(line.ingredientId).name }} · {{ line.quantity }} {{ ingredient(line.ingredientId).unit }}</span><b>{{ line.revenue.toFixed(0) }}</b></div>
          <dl><div class="checkout-total"><dt>Receive coins</dt><dd>{{ game.saleRevenue.toFixed(0) }}</dd></div></dl>
          <UiButton variant="solid" :disabled="!game.saleQuote.length || game.saleQuote.some(line => line.quantity > line.available)" @click="game.checkoutSale()">Sell</UiButton>
          <UiButton variant="secondary" size="sm" @click="sellAll">Select all</UiButton><UiButton variant="secondary" size="sm" @click="game.saleCart = {}">Clear</UiButton>
        </template>
        <p class="trade-feedback" aria-live="polite">{{ game.message }}</p>
      </aside>
    </div>
    <section class="incoming-deliveries"><div><small>SUPPLY ROUTES · REAL TIME</small><h3>Incoming deliveries</h3></div><p v-if="!game.deliveryOrders.length">No orders in transit.</p><article v-for="order in game.deliveryOrders" :key="order.id"><UiIcon name="truck" /><div><b>{{ order.supplier }}</b><span>{{ game.bars[order.barId].name }} · {{ order.items.length }} products</span></div><strong>{{ game.deliveryCountdown(order.dueAt) }}</strong></article></section>
    <div v-if="game.tradeLog.length" class="trade-log"><small>RECENT TRADES</small><span v-for="(entry,index) in game.tradeLog.slice(0,3)" :key="index">{{ entry }}</span></div>
  </article>
</template>
