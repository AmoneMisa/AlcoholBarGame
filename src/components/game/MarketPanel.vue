<script setup lang="ts">
import PanelHeading from '../ui/PanelHeading.vue';
import { computed, ref } from 'vue';
import { INGREDIENTS } from '../../domain/catalog';
import { useGameStore } from '../../stores/game';
import BottleModel from '../cocktails/BottleModel.vue';
import UiIcon from '../ui/UiIcon.vue';
import { AUTO_SUPPLY_LEVEL, formatDeliveryTime } from '../../domain/progression';
import TradeTalk from './TradeTalk.vue';

const game = useGameStore();
const mode = ref<'buy'|'sell'>('buy');
const category = ref('all');
const ingredient = (id:string) => INGREDIENTS.find((item) => item.id === id)!;
const group = (id:string) => ingredient(id).category === 'spirit' ? 'spirit' : ingredient(id).category === 'mixer' && !['sugar-syrup','coconut-cream'].includes(id) ? 'mixer' : 'fresh';
const offers = computed(() => game.market.filter((offer) => offer.supplierId === game.selectedSupplier && (category.value === 'all' || group(offer.ingredientId) === category.value)));
const stock = computed(() => game.inventory.filter((item) => category.value === 'all' || group(item.ingredientId) === category.value));
const available = (id:string) => Math.max(0,(game.inventory.find((item) => item.ingredientId === id)?.amount ?? 0) - (game.currentMix.find((item) => item.ingredientId === id)?.amount ?? 0));
const buyback = (id:string,quantity:number) => (ingredient(id).basePrice * quantity * game.region.marketFactor * .55 * game.economy.buybackFactor(id)).toFixed(2);
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
    <div class="auto-supply" :class="{ locked: game.level < AUTO_SUPPLY_LEVEL, on: game.autoSupply }">
      <div><b>Auto-supply</b><small>{{ game.level < AUTO_SUPPLY_LEVEL ? `Unlocks at level ${AUTO_SUPPLY_LEVEL}` : 'Reorders anything that runs low from the cheapest supplier, with normal prices and delivery fees.' }}</small></div>
      <button type="button" role="switch" :aria-checked="game.autoSupply" :disabled="game.level < AUTO_SUPPLY_LEVEL" @click="game.setAutoSupply(!game.autoSupply)">{{ game.level < AUTO_SUPPLY_LEVEL ? `Lv ${AUTO_SUPPLY_LEVEL}` : game.autoSupply ? 'On' : 'Off' }}</button>
    </div>
    <div class="top-up-row">
      <div><b>Top up low stock</b><small>Orders everything that is running low from the cheapest supplier, in one tap. Deliveries still take time.</small></div>
      <button type="button" data-guide="top-up" @click="game.topUp()">Top up</button>
    </div>
    <TradeTalk />
    <div class="market-modes"><button :class="{active:mode === 'buy'}" type="button" @click="mode = 'buy'">Buy supplies</button><button :class="{active:mode === 'sell'}" type="button" @click="mode = 'sell'">Sell stock</button><span>City prices {{ game.region.marketFactor.toFixed(2) }}× · prices change each shift</span></div>
    <div v-if="mode === 'buy'" class="supplier-picker polished-suppliers">
      <button v-for="supplier in game.localSuppliers" :key="supplier.id" :class="{ active:game.selectedSupplier === supplier.id }" type="button" @click="game.selectSupplier(supplier.id)">
        <span class="supplier-icon" :class="supplier.id"><UiIcon :name="supplier.icon" /></span>
        <div><h3>{{ supplier.name }}</h3><p>{{ supplier.description }}</p><small>Delivery {{ formatDeliveryTime(supplier.deliveryDays * game.economy.delivery) }} · {{ supplier.reputation }}/5 reputation</small><em>Fee {{ supplier.deliveryFee }} coins · free from {{ supplier.freeDeliveryAt }} coins</em></div>
      </button>
    </div>
    <div class="category-tabs market-filter"><button v-for="item in ['all','spirit','mixer','fresh']" :key="item" :class="{active:category === item}" type="button" @click="category = item">{{ {all:'All',spirit:'Spirits',mixer:'Mixers',fresh:'Fresh & food'}[item] }}</button></div>
    <div class="market-trading-layout">
      <div class="market-products">
        <article v-for="offer in mode === 'buy' ? offers : []" :key="offer.ingredientId" class="market-product">
          <BottleModel :ingredient="ingredient(offer.ingredientId)" />
          <div class="market-product-copy"><small>{{ offer.quality }} · {{ packageDescription(offer.ingredientId, offer.quantity) }}</small><h3>{{ ingredient(offer.ingredientId).name }}</h3><span>{{ available(offer.ingredientId) }} {{ ingredient(offer.ingredientId).unit }} in stock</span><span class="stock-conversion">1 {{ buyUnit(offer.ingredientId) }} adds {{ offer.quantity }} {{ ingredient(offer.ingredientId).unit }} to stock</span><b>{{ offer.price.toFixed(2) }} coins <del v-if="offer.discountPercent">{{ offer.listPrice.toFixed(2) }}</del></b><em v-if="offer.discountPercent">Today’s deal −{{ offer.discountPercent }}%</em></div>
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
          <small>YOUR ORDER</small><h3>{{ game.purchaseQuote.packs }} supplier units</h3><p>To {{ game.decor.name }} · {{ game.region.name }}</p>
          <div v-for="line in game.purchaseQuote.lines" :key="line.ingredientId" class="checkout-line"><span>{{ ingredient(line.ingredientId).name }} · {{ line.packs }} {{ buyUnit(line.ingredientId, line.packs !== 1) }}<em>+{{ receivedAmount(line.ingredientId, line.packs) }} stock</em></span><b>{{ line.subtotal.toFixed(2) }}</b></div>
          <p v-if="!game.purchaseQuote.lines.length" class="cart-empty">Choose bottles or packs with +, or type a quantity.</p>
          <dl><div><dt>Supplies</dt><dd>{{ game.purchaseQuote.subtotal.toFixed(2) }}</dd></div><div><dt>Bulk discount {{ game.purchaseQuote.discountRate * 100 }}%</dt><dd>−{{ game.purchaseQuote.discount.toFixed(2) }}</dd></div><div><dt>Delivery</dt><dd>{{ game.purchaseQuote.delivery ? game.purchaseQuote.delivery.toFixed(2) : 'Free' }}</dd></div><div class="checkout-total"><dt>Total coins</dt><dd>{{ game.purchaseQuote.total.toFixed(2) }}</dd></div></dl>
          <div class="delivery-progress"><span>{{ game.purchaseQuote.freeDeliveryRemaining ? `${game.purchaseQuote.freeDeliveryRemaining.toFixed(2)} more coins for free delivery` : 'Free delivery unlocked' }}</span><progress :max="game.supplier.freeDeliveryAt" :value="game.purchaseQuote.subtotal - game.purchaseQuote.discount"></progress></div>
          <p class="discount-help">5+ supplier units: 5% off · 10+: 10% off<br />Arrives in {{ game.supplier.deliveryDays }} shifts.</p>
          <button class="secondary-button negotiate-button" type="button" :disabled="!game.purchaseQuote.lines.length" title="Talk to the sales rep in English to lower the price" @click="game.startNegotiation()">Negotiate</button>
          <button class="primary-button" type="button" data-guide="market-order" :disabled="!game.purchaseQuote.lines.length || game.purchaseQuote.total > game.money" @click="game.checkoutPurchase()">Place order</button>
          <button class="checkout-clear" type="button" @click="game.purchaseCart = {}">Clear</button>
        </template>
        <template v-else>
          <small>STOCK BUYBACK</small><h3>Sell by volume</h3><p>Liquids are sold from open stock in 5 ml steps. Fresh items are sold one piece at a time. Payment is immediate.</p>
          <div v-for="line in game.saleQuote" :key="line.ingredientId" class="checkout-line"><span>{{ ingredient(line.ingredientId).name }} · {{ line.quantity }} {{ ingredient(line.ingredientId).unit }}</span><b>{{ line.revenue.toFixed(2) }}</b></div>
          <dl><div class="checkout-total"><dt>Receive coins</dt><dd>{{ game.saleRevenue.toFixed(2) }}</dd></div></dl>
          <button class="primary-button" type="button" :disabled="!game.saleQuote.length || game.saleQuote.some(line => line.quantity > line.available)" @click="game.checkoutSale()">Sell</button>
          <button class="checkout-clear" type="button" @click="sellAll">Select all</button><button class="checkout-clear" type="button" @click="game.saleCart = {}">Clear</button>
        </template>
        <p class="trade-feedback" aria-live="polite">{{ game.message }}</p>
      </aside>
    </div>
    <section class="incoming-deliveries"><div><small>SUPPLY ROUTES · REAL TIME</small><h3>Incoming deliveries</h3></div><p v-if="!game.deliveryOrders.length">No orders in transit.</p><article v-for="order in game.deliveryOrders" :key="order.id"><UiIcon name="truck" /><div><b>{{ order.supplier }}</b><span>{{ game.bars[order.barId].name }} · {{ order.items.length }} products</span></div><strong>{{ game.deliveryCountdown(order.dueAt) }}</strong></article></section>
    <div v-if="game.tradeLog.length" class="trade-log"><small>RECENT TRADES</small><span v-for="(entry,index) in game.tradeLog.slice(0,3)" :key="index">{{ entry }}</span></div>
  </article>
</template>
