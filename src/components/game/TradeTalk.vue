<script setup lang="ts">
import UiButton from '../ui/UiButton.vue';
import UiInput from '../ui/UiInput.vue';
import { ingredientName as nameOf } from '../../domain/catalog';
import UiIcon from '../ui/UiIcon.vue';
import { computed, nextTick, ref, watch } from 'vue';
import { REGIONS } from '../../domain/catalog';
import { checkText } from '../../domain/english/checker';
import { MAX_OFFERS, SELLERS, TACTICS, offerChance } from '../../sim/trade';
import { useGameStore } from '../../stores/game';
import { useLearningStore } from '../../stores/learning';
import { haptic } from '../../telegram/webapp';
import CloseButton from '../ui/CloseButton.vue';

// Haggling with a supplier's sales rep: talk in English to raise your chances, then make up to three offers.
// The server checks every sentence and rolls every offer; hard mistakes make the seller misunderstand.
const game = useGameStore();
const learning = useLearningStore();
const talk = computed(() => game.negotiation);
const quote = computed(() => game.negotiationQuote);
const seller = computed(() => SELLERS[talk.value?.supplierId ?? ''] ?? { name: 'Seller', greeting: '' });
const draft = ref('');
const pending = ref('');
const waiting = ref(false);
const log = ref<HTMLElement>();
const input = ref<{ focus: () => void }>();
const barName = (id: string) => REGIONS.find((item) => item.id === id)?.name ?? id;
const swapped = computed(() => new Map((talk.value?.misunderstandings ?? []).flatMap((item) => item.kind === 'product' ? [[item.to, item.from] as const] : [])));
const done = computed(() => talk.value?.mood === 'done');
const untilSlip = computed(() => talk.value ? 2 - (talk.value.mistakes % 2) : 2);
const agreed = computed(() => talk.value?.agreedGoods !== undefined);
const offersLeft = computed(() => MAX_OFFERS - (talk.value?.offers.length ?? 0));
// The offer being prepared: kept between the lowest allowed offer and the full price.
const offer = ref(0);
const step = computed(() => Math.max(1, Math.round((quote.value?.goods ?? 0) * .05)));
const clampOffer = (value: number) => quote.value ? Math.round(Math.min(quote.value.goods, Math.max(quote.value.minOffer, value)) * 100) / 100 : value;
watch(() => [quote.value?.goods, quote.value?.minOffer], () => {
  if (quote.value) offer.value = clampOffer(offer.value || quote.value.goods * .85);
}, { immediate: true });
const chance = computed(() => talk.value && quote.value ? offerChance(talk.value, quote.value.goods, offer.value) : undefined);
const percent = (value: number) => `${value >= 0 ? '+' : '−'}${Math.abs(value * 100).toFixed(0)}%`;
async function placeOffer() {
  if (waiting.value || !quote.value) return;
  waiting.value = true;
  const before = talk.value?.offers.length ?? 0;
  await Promise.all([game.makeOffer(clampOffer(offer.value)), new Promise((resolve) => window.setTimeout(resolve, 650))]);
  waiting.value = false;
  const result = talk.value?.offers[before];
  haptic(result?.success ? 'medium' : 'light');
}

watch(() => talk.value?.lines.length, () => nextTick(() => log.value?.scrollTo({ top: log.value.scrollHeight, behavior: 'smooth' })), { immediate: true });

function useExample(text: string) {
  draft.value = text;
  nextTick(() => input.value?.focus());
}
async function send() {
  const sentence = draft.value.replace(/\s+/g, ' ').trim();
  if (!sentence || waiting.value || done.value) return;
  // Learning progress only; the server makes its own decision.
  const result = checkText(sentence);
  if (result.ok) learning.recordCorrect(sentence);
  else learning.recordMistakes(sentence, result.corrected, result.issues);
  draft.value = '';
  pending.value = sentence;
  waiting.value = true;
  await Promise.all([game.haggle(sentence), new Promise((resolve) => window.setTimeout(resolve, 450))]);
  waiting.value = false;
  pending.value = '';
  const last = [...(talk.value?.lines ?? [])].reverse().find((line) => line.speaker === 'buyer');
  haptic(last?.ok ? 'light' : 'medium');
}
function accept() {
  if (game.acceptDeal()) haptic('medium');
}
</script>

<template>
  <div v-if="talk && quote" class="haggle-backdrop" @click.self="game.leaveNegotiation()">
    <section class="haggle-popup" role="dialog" aria-modal="true" :aria-label="`Negotiation with ${seller.name}`">
      <header class="haggle-header">
        <span class="haggle-avatar" :class="talk.mood" aria-hidden="true">{{ seller.name.charAt(0) }}</span>
        <div><small>NEGOTIATION · {{ quote.supplier.name }}</small><b>{{ seller.name }}</b><em>{{ { neutral: 'Listening', pleased: 'Pleased', confused: 'Confused', done: 'No more offers' }[talk.mood] }}</em></div>
        <CloseButton class="haggle-close" label="Leave the negotiation" @click="game.leaveNegotiation()" />
      </header>

      <div class="haggle-body">
        <div ref="log" class="haggle-log" aria-live="polite">
          <div v-for="line in talk.lines" :key="line.id" class="haggle-line" :class="line.speaker">
            <p>{{ line.text }}</p>
            <small v-if="line.speaker === 'buyer'" :class="line.ok ? 'good' : 'fix'"><template v-if="line.ok"><UiIcon class="inline-icon" name="check" /> Correct English</template><template v-else><UiIcon class="inline-icon" name="close" /> Hard mistake · {{ line.note }}</template></small>
          </div>
          <div v-if="pending" class="haggle-line buyer"><p>{{ pending }}</p></div>
          <div v-if="waiting" class="haggle-line seller typing"><p><i></i><i></i><i></i></p></div>
        </div>

        <aside class="haggle-deal">
          <small>THE DEAL</small>
          <ul>
            <li v-for="line in quote.base.lines" :key="line.ingredientId" :class="{ swapped: swapped.has(line.ingredientId) }">
              <span>{{ line.packs }} × {{ nameOf(line.ingredientId) }}<em v-if="swapped.has(line.ingredientId)">instead of {{ nameOf(swapped.get(line.ingredientId)!) }}</em></span><b>{{ line.subtotal.toFixed(2) }}</b>
            </li>
          </ul>
          <!-- The offer: price controls, success chance and its bonuses. -->
          <section v-if="!agreed && !done" class="haggle-offer">
            <header><small>OFFER {{ MAX_OFFERS - offersLeft + 1 }} / {{ MAX_OFFERS }}</small><span>Success rate</span></header>
            <div class="haggle-chance" :style="{ '--chance': `${(chance?.rate ?? 0) * 360}deg` }" :class="{ low: (chance?.rate ?? 0) < .35, high: (chance?.rate ?? 0) >= .7 }">
              <b>{{ ((chance?.rate ?? 0) * 100).toFixed(2) }}%</b>
            </div>
            <div class="haggle-bonuses">
              <span :class="{ on: (chance?.english ?? 0) > 0 }" title="Correct, polite bargaining sentences">English {{ percent(chance?.english ?? 0) }}</span>
              <span :class="{ on: (chance?.retry ?? 0) > 0 }" title="Grows after every refused offer">Retry {{ percent(chance?.retry ?? 0) }}</span>
              <span :class="{ on: (chance?.mood ?? 0) > 0, off: (chance?.mood ?? 0) < 0 }" title="How the seller feels">Mood {{ percent(chance?.mood ?? 0) }}</span>
            </div>
            <div class="haggle-price">
              <UiButton variant="secondary" size="sm" @click="offer = clampOffer(quote.minOffer)">Min</UiButton>
              <UiButton variant="secondary" size="sm" :aria-label="`Lower the offer by ${step} coins`" @click="offer = clampOffer(offer - step)">−{{ step }}</UiButton>
              <output>{{ offer.toFixed(2) }}</output>
              <UiButton variant="secondary" size="sm" :aria-label="`Raise the offer by ${step} coins`" @click="offer = clampOffer(offer + step)">+{{ step }}</UiButton>
              <UiButton variant="secondary" size="sm" @click="offer = clampOffer(quote.goods)">Max</UiButton>
            </div>
            <input v-model.number="offer" class="haggle-slider" type="range" :min="quote.minOffer" :max="quote.goods" step="0.5" aria-label="Your offer for the goods" :style="{ '--fill': `${(offer - quote.minOffer) / Math.max(.01, quote.goods - quote.minOffer) * 100}%` }" />
            <div class="haggle-range"><span>{{ quote.minOffer.toFixed(2) }}</span><span>list {{ quote.goods.toFixed(2) }}</span></div>
            <UiButton variant="solid" :disabled="waiting" @click="placeOffer()">Offer <em>{{ offersLeft }}/{{ MAX_OFFERS }}</em></UiButton>
          </section>
          <p v-else-if="agreed" class="haggle-agreed"><UiIcon class="inline-icon" name="check" /> Agreed: {{ talk.agreedGoods!.toFixed(2) }} coins for the goods <em>(−{{ Math.round(quote.discountRate * 100) }}%)</em></p>
          <p v-else class="haggle-agreed failed">No offers left — the list price stays.</p>
          <ol v-if="talk.offers.length" class="haggle-history">
            <li v-for="(item, index) in talk.offers" :key="index" :class="item.success ? 'yes' : 'no'"><UiIcon class="inline-icon" :name="item.success ? 'check' : 'close'" /> {{ item.price.toFixed(2) }} <small>{{ (item.rate * 100).toFixed(0) }}%</small></li>
          </ol>
          <dl>
            <div><dt>Goods (list)</dt><dd>{{ quote.goods.toFixed(2) }}</dd></div>
            <div v-if="quote.discount" class="good"><dt>Negotiated −{{ Math.round(quote.discountRate * 100) }}%</dt><dd>−{{ quote.discount.toFixed(2) }}</dd></div>
            <div v-if="quote.surcharge" class="bad"><dt>Misunderstood +{{ Math.round(quote.surcharge * 100) }}%</dt><dd>+{{ quote.extra.toFixed(2) }}</dd></div>
            <div :class="{ good: talk.freeDelivery && quote.base.delivery }"><dt>Delivery</dt><dd>{{ quote.delivery ? quote.delivery.toFixed(2) : 'free' }}</dd></div>
            <div class="total"><dt>Total</dt><dd>{{ quote.total.toFixed(2) }}</dd></div>
          </dl>
          <p class="haggle-address" :class="{ bad: quote.barId !== talk.barId }">Delivery to <b>{{ barName(quote.barId) }}</b><template v-if="quote.barId !== talk.barId"> — not your {{ barName(talk.barId) }} bar!</template></p>
          <small class="haggle-hint">Talk first: every bargaining idea in correct, polite English raises your chance. Hard mistakes: {{ talk.mistakes }} · the next {{ untilSlip === 1 ? 'one' : 'two' }} will confuse {{ seller.name }}.</small>
          <div class="haggle-tactics">
            <button v-for="tactic in TACTICS" :key="tactic.id" type="button" :class="{ used: talk.tactics.includes(tactic.id) }" :disabled="done || agreed" :title="tactic.example" @click="useExample(tactic.example)"><UiIcon v-if="talk.tactics.includes(tactic.id)" class="inline-icon" name="check" /> {{ tactic.label }}</button>
          </div>
        </aside>
      </div>

      <footer class="haggle-compose">
        <form @submit.prevent="send()">
          <UiInput label="Your reply" ref="input" v-model="draft" type="text" maxlength="240" :disabled="done || agreed || waiting" :placeholder="agreed ? 'The price is agreed.' : done ? 'No offers left.' : 'Write to ' + seller.name + ' in English…'" autocomplete="off" />
          <UiButton variant="primary" type="submit" :disabled="!draft.trim() || done || agreed || waiting">Say</UiButton>
        </form>
        <div class="haggle-actions">
          <UiButton variant="ghost" @click="game.leaveNegotiation()">Leave</UiButton>
          <UiButton :variant="agreed ? 'solid' : 'secondary'" :class="{ 'quick-buy': !agreed }" :disabled="quote.total > game.money" @click="accept()">{{ agreed ? 'Accept deal' : 'Buy at list price' }} · {{ quote.total.toFixed(2) }} coins</UiButton>
        </div>
      </footer>
    </section>
  </div>
</template>

<style scoped>
.haggle-backdrop { position: fixed; z-index: 400; inset: 0; display: grid; place-items: center; padding: 16px; background: #04070dcc; backdrop-filter: blur(6px); }
.haggle-popup { display: grid; grid-template-columns: minmax(0, 1fr); grid-template-rows: auto minmax(0, 1fr) auto; min-width: 0; width: min(920px, 100%); max-height: min(720px, calc(100vh - 32px)); overflow: hidden; border: 1px solid #b78649; border-radius: 18px; background: linear-gradient(160deg, #1a2336, #0c1320 70%); color: #eef1f5; box-shadow: 0 30px 80px #000c; }
.haggle-header { display: flex; align-items: center; gap: 12px; padding: 12px 16px; border-bottom: 1px solid #34435a; background: #0e1726; }
.haggle-header > div { display: grid; flex: 1; }
.haggle-header small { color: var(--gold, #f1c26b); font-size: 8px; font-weight: 900; letter-spacing: .14em; }
.haggle-header b { font: 700 18px Georgia, serif; }
.haggle-header em { color: #9fb0c4; font-size: 9px; font-style: normal; }
.haggle-avatar { display: grid; width: 44px; height: 44px; place-items: center; border: 2px solid #d6a54e; border-radius: 50%; background: radial-gradient(circle at 35% 30%, #7a5230, #2b1b14); color: #ffe2a8; font: 700 20px Georgia, serif; transition: border-color .2s; }
.haggle-avatar.pleased { border-color: #6ee0a2; }
.haggle-avatar.confused { border-color: #ff9ca5; }
.haggle-body { display: grid; grid-template-columns: minmax(0, 1fr) 300px; min-height: 0; min-width: 0; }
.haggle-body > * { min-width: 0; }
.haggle-log { display: flex; flex-direction: column; gap: 8px; min-height: 260px; overflow-y: auto; padding: 14px 16px; scrollbar-width: thin; scrollbar-color: #a87943 transparent; }
.haggle-line { max-width: 82%; }
.haggle-line p { margin: 0; padding: 9px 12px; border-radius: 14px; font-size: 12px; line-height: 1.4; }
.haggle-line.seller { align-self: flex-start; }
.haggle-line.seller p { border: 1px solid #d9cdbb; border-bottom-left-radius: 4px; background: #fffaf0; color: #182033; }
.haggle-line.buyer { align-self: flex-end; text-align: right; }
.haggle-line.buyer p { border: 1px solid #6a5238; border-bottom-right-radius: 4px; background: #3a2a1f; color: #fff1dc; }
.haggle-line small { display: block; margin-top: 3px; font-size: 9px; }
.haggle-line small.good { color: #6ee0a2; }
.haggle-line small.fix { color: #ff9ca5; }
.haggle-line.typing p { display: flex; gap: 4px; }
.haggle-line.typing i { width: 6px; height: 6px; border-radius: 50%; background: #9a8f80; animation: haggleDot 1s infinite; }
.haggle-line.typing i:nth-child(2) { animation-delay: .15s; }
.haggle-line.typing i:nth-child(3) { animation-delay: .3s; }
@keyframes haggleDot { 50% { opacity: .3; transform: translateY(-2px); } }
.haggle-deal { display: grid; align-content: start; gap: 8px; overflow-y: auto; padding: 14px; border-left: 1px solid #34435a; background: #0b1220; }
.haggle-deal > small { color: var(--gold, #f1c26b); font-size: 8px; font-weight: 900; letter-spacing: .14em; }
.haggle-deal ul { display: grid; gap: 4px; margin: 0; padding: 0; list-style: none; font-size: 10px; }
.haggle-deal li { display: flex; justify-content: space-between; gap: 8px; padding: 5px 7px; border: 1px solid #2d3b50; border-radius: 7px; }
.haggle-deal li.swapped { border-color: #c2505c; background: #3a1a22; }
.haggle-deal li em { display: block; color: #ff9ca5; font-size: 8px; font-style: normal; }
.haggle-deal dl { display: grid; gap: 3px; margin: 0; font-size: 10px; }
.haggle-deal dl div { display: flex; justify-content: space-between; }
.haggle-deal dt { color: #a9b3c1; }
.haggle-deal dd { margin: 0; }
.haggle-deal .good dd, .haggle-deal .good dt { color: #6ee0a2; }
.haggle-deal .bad dd, .haggle-deal .bad dt { color: #ff9ca5; }
.haggle-deal .total { margin-top: 3px; padding-top: 5px; border-top: 1px solid #34435a; font-weight: 800; }
.haggle-deal .total dd { color: #ffd98b; font-size: 13px; }
.haggle-address { margin: 0; font-size: 10px; }
.haggle-address.bad { color: #ff9ca5; }
.haggle-meter { height: 6px; overflow: hidden; border-radius: 4px; background: #1c2a40; }
.haggle-meter i { display: block; height: 100%; background: linear-gradient(90deg, #d6a54e, #6ee0a2); transition: width .3s; }
.haggle-hint { color: #8f9bab; font-size: 8px; line-height: 1.4; }
.haggle-tactics { display: flex; flex-wrap: wrap; gap: 4px; }
.haggle-tactics button { padding: 4px 7px; border: 1px solid #4a5c75; border-radius: 12px; background: #142238; color: #cfd8e4; font-size: 9px; cursor: pointer; }
.haggle-tactics button.used { border-color: #3b8c62; color: #91dbad; }
.haggle-compose { display: grid; gap: 8px; padding: 12px 16px; border-top: 1px solid #34435a; background: #0e1726; }
.haggle-compose form { display: flex; gap: 8px; }
.haggle-compose input { flex: 1; min-width: 0; padding: 10px 12px; border: 1px solid #4a5c75; border-radius: 10px; background: #0a111d; color: #eef1f5; font-size: 13px; }
.haggle-actions { display: flex; justify-content: flex-end; gap: 8px; }
.haggle-offer { display: grid; gap: 7px; padding: 10px; border: 1px solid #5d4a2e; border-radius: 12px; background: radial-gradient(120% 90% at 50% 0%, #2c2418, #121821 70%); }
.haggle-offer > header { display: flex; flex-direction: column; align-items: center; gap: 1px; }
.haggle-offer > header small { padding: 1px 8px; border-radius: 8px; background: #3a2d1a; color: #f3d38c; font-size: 8px; font-weight: 900; letter-spacing: .12em; }
.haggle-offer > header span { color: #dfe6ef; font-size: 11px; }
.haggle-chance { --chance: 0deg; display: grid; width: 118px; height: 118px; margin: 0 auto; place-items: center; border-radius: 50%;
  background: radial-gradient(circle, #121821 58%, transparent 59%), conic-gradient(#f2c35f var(--chance), #2a3446 0); box-shadow: 0 0 18px rgba(242, 195, 95, .25); transition: background .2s; }
.haggle-chance.low { background: radial-gradient(circle, #121821 58%, transparent 59%), conic-gradient(#ff8a7a var(--chance), #2a3446 0); box-shadow: 0 0 18px rgba(255, 120, 110, .2); }
.haggle-chance.high { background: radial-gradient(circle, #121821 58%, transparent 59%), conic-gradient(#6ee0a2 var(--chance), #2a3446 0); box-shadow: 0 0 18px rgba(110, 224, 162, .25); }
.haggle-chance b { color: #ffe3a3; font: 800 22px Georgia, serif; text-shadow: 0 2px 6px #000; }
.haggle-bonuses { display: flex; flex-wrap: wrap; justify-content: center; gap: 4px; }
.haggle-bonuses span { padding: 3px 8px; border: 1px solid #3c4d64; border-radius: 10px; background: #16233a; color: #8f9bab; font-size: 9px; }
.haggle-bonuses span.on { border-color: #3b8c62; color: #91dbad; }
.haggle-bonuses span.off { border-color: #98535b; color: #ffb6bd; }
.haggle-price { display: grid; grid-template-columns: auto auto 1fr auto auto; gap: 4px; }
.haggle-price output { display: grid; place-items: center; border: 1px solid #b78649; border-radius: 7px; background: #0b1220; color: #ffe3a3; font-weight: 800; }
.haggle-slider { width: 100%; height: 6px; appearance: none; -webkit-appearance: none; border-radius: 4px; background: linear-gradient(90deg, #f2c35f var(--fill, 50%), #2a3446 var(--fill, 50%)); cursor: pointer; }
.haggle-slider::-webkit-slider-thumb { width: 16px; height: 16px; appearance: none; -webkit-appearance: none; border: 2px solid #fff4d2; border-radius: 3px; background: #f2c35f; transform: rotate(45deg); box-shadow: 0 0 8px rgba(242, 195, 95, .7); }
.haggle-slider::-moz-range-thumb { width: 14px; height: 14px; border: 2px solid #fff4d2; border-radius: 3px; background: #f2c35f; transform: rotate(45deg); }
.haggle-range { display: flex; justify-content: space-between; color: #8f9bab; font-size: 9px; }
.haggle-offer-button em { margin-left: 6px; padding: 1px 6px; border-radius: 8px; background: rgba(0, 0, 0, .2); font-style: normal; font-size: 10px; }
.haggle-agreed { margin: 0; padding: 9px; border: 1px solid #3b8c62; border-radius: 10px; background: #12301f; color: #91dbad; font-size: 11px; font-weight: 800; }
.haggle-agreed.failed { border-color: #98535b; background: #32191e; color: #ffb6bd; }
.haggle-agreed em { font-style: normal; font-weight: 400; }
.haggle-history { display: flex; gap: 4px; margin: 0; padding: 0; list-style: none; font-size: 9px; }
.haggle-history li { padding: 2px 6px; border-radius: 8px; background: #16233a; }
.haggle-history li.yes { color: #91dbad; }
.haggle-history li.no { color: #ffb6bd; }
.haggle-history small { opacity: .7; }
@media (max-width: 760px) {
  .haggle-backdrop { padding: 0; }
  .haggle-popup { max-height: 100vh; height: 100%; border-radius: 0; }
  .haggle-body { grid-template-columns: minmax(0, 1fr); grid-template-rows: minmax(160px, 1fr) auto; overflow-y: auto; }
  .haggle-log { min-height: 180px; }
  .haggle-deal { border-top: 1px solid #34435a; border-left: 0; }
  .haggle-actions button { flex: 1; }
    .haggle-actions .ui-btn-solid { flex: 2; }
}
</style>
