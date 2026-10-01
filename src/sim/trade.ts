import { INGREDIENTS, REGIONS, SUPPLIERS } from '../domain/catalog';
import { coins, quotePurchase } from '../domain/economy';
import { marketFor } from '../domain/progression';
import { deliveryFactorFor, orderDiscount, roomFor } from './loot';
import type { RegionId } from '../domain/types';
import type { PlayerState } from './state';
import { supplierInfoReply } from './tradeTalk';
import { ingredientName as nameOf } from '../domain/catalog';

// Haggling with a supplier's sales rep. Runs in the shared rules, so on the server.
// The player makes up to three price offers; each has a success chance that falls as the offer drops.
// Correct, polite bargaining in English raises that chance, and every refused offer adds a retry bonus.
// Hard English mistakes make the seller misunderstand the order (higher price, another bar, another product).

// A refused trade request; the rules turn it into a RuleError (HTTP 409 with the saved state).
export class TradeError extends Error {}

export const MAX_TRADE_DISCOUNT = .30;          // the lowest offer is 70% of the price
export const MAX_OFFERS = 3;
export const RETRY_BONUS = .10;                 // added to the chance after every refused offer
export const MAX_ENGLISH_BONUS = .20;
export const NEGOTIATION_COOLDOWN_MS = 60 * 60 * 1000;
const MAX_BUYER_LINES = 10;
const MAX_REWARDED = 5;
const MISTAKES_PER_MISUNDERSTANDING = 2;

export const SELLERS: Record<string, { name: string; greeting: string }> = {
  global: { name: 'Marcus', greeting: 'Good afternoon! Marcus from Global Drinks. I have your order here — what can I do for you?' },
  local: { name: 'Rosa', greeting: 'Hi there, Rosa from the Local Market. Your basket looks good! Anything you want to talk about?' },
  premium: { name: 'Victor', greeting: 'Good evening. Victor, Premium Spirits. Our prices reflect our quality, but I am listening.' },
  fresh: { name: 'Amina', greeting: 'Hello! Amina from Fresh & Green. Everything was picked this morning. How can I help?' }
};

export type TacticId = 'ask' | 'bulk' | 'loyalty' | 'competitor' | 'cash' | 'delivery';
export const TACTICS: { id: TacticId; label: string; example: string; value: number }[] = [
  { id: 'ask', label: 'Ask for a better price', example: 'Could you give me a discount, please?', value: .04 },
  { id: 'bulk', label: 'Mention a big order', example: 'We are buying a large order. Can you lower the price?', value: .05 },
  { id: 'loyalty', label: 'Promise regular orders', example: 'We will order from you every week.', value: .04 },
  { id: 'competitor', label: 'Mention another supplier', example: 'Another supplier offers a cheaper price.', value: .05 },
  { id: 'cash', label: 'Offer to pay now', example: 'We can pay today if the price is right.', value: .04 },
  { id: 'delivery', label: 'Ask for free delivery', example: 'Could you include free delivery, please?', value: 0 }
];

export interface TradeLine { id: number; speaker: 'seller' | 'buyer'; text: string; note?: string; ok?: boolean; }
export type Misunderstanding =
  | { kind: 'price'; percent: number; text: string }
  | { kind: 'bar'; barId: RegionId; text: string }
  | { kind: 'product'; from: string; to: string; text: string };
export interface Negotiation {
  supplierId: string;
  barId: RegionId;
  cart: Record<string, number>;
  startedAt: number;
  lines: TradeLine[];
  // Success-chance bonus earned with correct, polite bargaining sentences.
  englishBonus: number;
  // Offers made so far, and the bonus that grows after each refusal.
  offers: { price: number; rate: number; success: boolean }[];
  retryBonus: number;
  // The goods price the seller accepted, if any.
  agreedGoods?: number;
  freeDelivery: boolean;
  tactics: TacticId[];
  mistakes: number;
  misunderstandings: Misunderstanding[];
  rewarded: number;
  mood: 'neutral' | 'pleased' | 'confused' | 'done';
}

const has = (text: string, pattern: RegExp) => pattern.test(text.toLowerCase());
const PATTERNS: Record<TacticId, RegExp> = {
  ask: /\b(discount|lower (the |your )?prices?|better (price|deal)|cheaper|reduce|reduction|special price|good price|match (the |their |that |your )?prices?)\b/,
  bulk: /\b(bulk|large order|big order|a lot|lots of|wholesale|many (packs|bottles|boxes))\b/,
  loyalty: /\b(regular|every (week|month|day|monday|tuesday|wednesday|thursday|friday)|weekly|monthly|long[- ]term|loyal|again and again|often|standing orders?)\b/,
  competitor: /\b(another supplier|other suppliers?|competitors?|elsewhere|somewhere else|other shop)\b/,
  cash: /\b(cash|pay (now|today|upfront|in advance|immediately|right away)|advance payment)\b/,
  delivery: /\b(free delivery|free shipping|deliver (it )?for free|waive|no delivery (fee|charge|cost))\b/
};
const POLITE = /\b(please|could|would|may|kindly|thank|thanks)\b/;

function addLine(negotiation: Negotiation, speaker: TradeLine['speaker'], text: string, extra: { note?: string; ok?: boolean } = {}) {
  negotiation.lines.push({ id: (negotiation.lines.at(-1)?.id ?? -1) + 1, speaker, text, ...extra });
}

// Clean, whole-pack cart with only what this supplier sells.
export function supplierCart(state: PlayerState, supplierId: string, cart: unknown, now: number) {
  const region = REGIONS.find((item) => item.id === state.regionId)!;
  const offers = marketFor(region, now, state.xp).filter((offer) => offer.supplierId === supplierId);
  const result: Record<string, number> = {};
  if (!cart || typeof cart !== 'object') return result;
  for (const [id, value] of Object.entries(cart as Record<string, unknown>)) {
    const packs = typeof value === 'number' && Number.isFinite(value) ? Math.min(99, Math.floor(value)) : 0;
    if (packs >= 1 && offers.some((offer) => offer.ingredientId === id)) result[id] = packs;
  }
  return result;
}

export function startNegotiation(state: PlayerState, supplierId: unknown, cart: unknown, now: number) {
  const supplier = SUPPLIERS.find((item) => item.id === supplierId);
  if (!supplier) throw new TradeError('Unknown supplier.');
  const last = state.lastNegotiatedAt?.[supplier.id] ?? 0;
  if (now - last < NEGOTIATION_COOLDOWN_MS) {
    const minutes = Math.ceil((NEGOTIATION_COOLDOWN_MS - (now - last)) / 60000);
    throw new TradeError(`${SELLERS[supplier.id]?.name ?? 'The seller'} will talk about prices again in ${minutes} min.`);
  }
  const clean = supplierCart(state, supplier.id, cart, now);
  if (!Object.keys(clean).length) throw new TradeError('Add packs to your order first.');
  const negotiation: Negotiation = {
    supplierId: supplier.id, barId: state.regionId, cart: clean, startedAt: now, lines: [], englishBonus: 0, offers: [], retryBonus: 0, freeDelivery: false,
    tactics: [], mistakes: 0, misunderstandings: [], rewarded: 0, mood: 'neutral'
  };
  addLine(negotiation, 'seller', SELLERS[supplier.id]?.greeting ?? 'Hello! How can I help you?');
  state.negotiation = negotiation;
}

// The deal as it stands: the market price for the (possibly misunderstood) order, then the negotiated terms.
export function negotiatedQuote(state: PlayerState, negotiation: Negotiation, now: number) {
  const supplier = SUPPLIERS.find((item) => item.id === negotiation.supplierId)!;
  const region = REGIONS.find((item) => item.id === negotiation.barId)!;
  const base = quotePurchase(marketFor(region, now, state.xp), negotiation.cart, supplier);
  const surcharge = negotiation.misunderstandings.reduce((sum, item) => sum + (item.kind === 'price' ? item.percent : 0), 0);
  const goods = coins(base.subtotal - base.discount);
  const price = Math.min(goods, negotiation.agreedGoods ?? goods);
  const discount = coins(goods - price);
  const extra = coins(price * surcharge);
  const delivery = negotiation.freeDelivery ? 0 : base.delivery;
  const barId = [...negotiation.misunderstandings].reverse().find((item) => item.kind === 'bar')?.barId ?? negotiation.barId;
  const minOffer = coins(goods * (1 - MAX_TRADE_DISCOUNT));
  return { base, supplier, goods, minOffer, discountRate: goods ? discount / goods : 0, discount, surcharge, extra, delivery, barId, total: coins(price + extra + delivery) };
}

// The chance that the seller accepts `price` for the goods, with the parts shown to the player.
export function offerChance(negotiation: Negotiation, goods: number, price: number) {
  const ratio = goods > 0 ? price / goods : 1;
  const t = Math.min(1, Math.max(0, (ratio - (1 - MAX_TRADE_DISCOUNT)) / MAX_TRADE_DISCOUNT));
  const base = ratio >= 1 ? 1 : .08 + .8 * Math.pow(t, 1.4);
  const mood = negotiation.mood === 'pleased' ? .03 : negotiation.mood === 'confused' ? -.05 : 0;
  const rate = ratio >= 1 ? 1 : Math.min(.97, Math.max(.02, base + negotiation.englishBonus + negotiation.retryBonus + mood));
  return { rate, base, english: negotiation.englishBonus, retry: negotiation.retryBonus, mood };
}

export function makeOffer(state: PlayerState, price: unknown, context: { random: () => number; now: number }) {
  const negotiation = state.negotiation;
  if (!negotiation) throw new TradeError('Start a negotiation first.');
  if (negotiation.agreedGoods !== undefined) throw new TradeError('The price is agreed. Accept the deal.');
  if (negotiation.offers.length >= MAX_OFFERS) throw new TradeError('No offers left. Buy at the list price or leave.');
  const quote = negotiatedQuote(state, negotiation, context.now);
  const offered = typeof price === 'number' && Number.isFinite(price) ? coins(price) : NaN;
  if (!(offered >= quote.minOffer && offered <= quote.goods)) throw new TradeError(`Offer between ${quote.minOffer.toFixed(2)} and ${quote.goods.toFixed(2)} coins.`);
  const { rate } = offerChance(negotiation, quote.goods, offered);
  const success = context.random() < rate;
  negotiation.offers.push({ price: offered, rate, success });
  const seller = SELLERS[negotiation.supplierId]?.name ?? 'The seller';
  addLine(negotiation, 'buyer', `I can offer ${offered.toFixed(2)} coins for the goods.`, { ok: true });
  if (success) {
    negotiation.agreedGoods = offered;
    negotiation.mood = 'pleased';
    addLine(negotiation, 'seller', offered >= quote.goods ? 'The full price — of course!' : `Deal! ${offered.toFixed(2)} coins it is.`);
  } else {
    negotiation.retryBonus = Number((negotiation.retryBonus + RETRY_BONUS).toFixed(3));
    const left = MAX_OFFERS - negotiation.offers.length;
    if (left > 0) {
      addLine(negotiation, 'seller', left === 1 ? 'Still too low. You have one more try — think carefully.' : 'Hmm, that is too low for me. Try again.');
    } else {
      negotiation.mood = 'done';
      addLine(negotiation, 'seller', 'Sorry, I can’t go that low. The list price stays.');
    }
  }
  state.message = `${seller}: ${negotiation.lines.at(-1)!.text}`;
}

// The seller hears something wrong: prices go up, the delivery goes to another bar, or a product changes.
function misunderstand(state: PlayerState, negotiation: Negotiation, random: () => number, now: number): Misunderstanding | undefined {
  const kinds: Misunderstanding['kind'][] = ['price', 'bar', 'product'];
  const start = Math.floor(random() * kinds.length);
  for (let step = 0; step < kinds.length; step++) {
    const kind = kinds[(start + step) % kinds.length]!;
    if (kind === 'price') {
      return { kind, percent: .08, text: 'Ah, you want the express price list? That is 8% more — no problem, I have added it.' };
    }
    if (kind === 'bar') {
      const others = REGIONS.filter((region) => state.ownedBarIds.includes(region.id) && region.id !== negotiation.barId && !negotiation.misunderstandings.some((item) => item.kind === 'bar' && item.barId === region.id));
      const target = others[Math.floor(random() * others.length)];
      if (target) return { kind, barId: target.id, text: `Oh, you want it delivered to your ${target.name} bar? Of course, I changed the address.` };
    }
    if (kind === 'product') {
      const lines = Object.keys(negotiation.cart);
      const from = lines[Math.floor(random() * lines.length)];
      const category = INGREDIENTS.find((item) => item.id === from)?.category;
      const region = REGIONS.find((item) => item.id === negotiation.barId)!;
      const sold = new Set(marketFor(region, now, state.xp).filter((offer) => offer.supplierId === negotiation.supplierId).map((offer) => offer.ingredientId));
      const options = INGREDIENTS.filter((item) => item.category === category && item.id !== from && sold.has(item.id) && !(item.id in negotiation.cart));
      const to = options[Math.floor(random() * options.length)];
      if (from && to) return { kind, from, to: to.id, text: `Right, so ${to.name} instead of ${nameOf(from)}. I have changed it on the order.` };
    }
  }
  return undefined;
}

export function haggle(state: PlayerState, text: string, context: { checkEnglish: (text: string) => { ok: boolean; corrected: string }; random: () => number; now: number }) {
  const negotiation = state.negotiation;
  if (!negotiation) throw new TradeError('Start a negotiation first.');
  if (negotiation.mood === 'done') throw new TradeError('No offers left. Buy at the list price or leave.');
  if (negotiation.agreedGoods !== undefined) throw new TradeError('The price is agreed. Accept the deal.');
  if (negotiation.lines.filter((line) => line.speaker === 'buyer' && !line.text.startsWith('I can offer')).length >= MAX_BUYER_LINES) throw new TradeError('Enough talking — make your offer.');
  const english = context.checkEnglish(text);
  state.languageStats.sentences++;
  // Only offer a correction that really changes the words; otherwise point to the phrase ideas.
  const words = (value: string) => value.toLowerCase().replace(/[^\p{L}\p{N}' ]/gu, '').trim();
  const hint = words(english.corrected) !== words(text) ? `Better: “${english.corrected}”` : 'Try one of the phrase ideas under the deal.';
  addLine(negotiation, 'buyer', text, { ok: english.ok, note: english.ok ? undefined : hint });
  const seller = SELLERS[negotiation.supplierId]?.name ?? 'The seller';

  if (!english.ok) {
    // A hard mistake: nothing is gained, and every second one the seller understands something else.
    negotiation.mistakes++;
    negotiation.mood = 'confused';
    const slip = negotiation.mistakes % MISTAKES_PER_MISUNDERSTANDING === 0 ? misunderstand(state, negotiation, context.random, context.now) : undefined;
    if (slip) {
      negotiation.misunderstandings.push(slip);
      if (slip.kind === 'product') {
        const packs = negotiation.cart[slip.from]!;
        delete negotiation.cart[slip.from];
        negotiation.cart[slip.to] = packs;
      }
      addLine(negotiation, 'seller', slip.text);
    } else {
      addLine(negotiation, 'seller', 'Sorry, I didn’t quite understand. Could you say that again?');
    }
  } else {
    state.languageStats.correct++;
    if (negotiation.rewarded < MAX_REWARDED) { negotiation.rewarded++; state.xp += 2; }
    const said = english.corrected.toLowerCase();
    const polite = has(said, POLITE);
    const found = TACTICS.filter((tactic) => has(said, PATTERNS[tactic.id]));
    const fresh = found.filter((tactic) => !negotiation.tactics.includes(tactic.id));
    const packs = Object.values(negotiation.cart).reduce((sum, value) => sum + value, 0);
    const replies: string[] = [];
    for (const tactic of fresh) {
      if (tactic.id === 'bulk' && packs < 5) { replies.push('Five packs or more is a big order. This one is quite small.'); continue; }
      negotiation.tactics.push(tactic.id);
      if (tactic.id === 'delivery') {
        negotiation.freeDelivery = true;
        replies.push('Fine, the delivery is on us.');
        continue;
      }
      const gain = tactic.value * (polite ? 1 : .5);
      negotiation.englishBonus = Math.min(MAX_ENGLISH_BONUS, Number((negotiation.englishBonus + gain).toFixed(3)));
      replies.push({
        ask: 'Hmm, maybe I can take a little off.',
        bulk: 'A big order? That changes things.',
        loyalty: 'Regular clients are important to us. I will remember that.',
        competitor: 'Really? Well, I don’t want to lose you.',
        cash: 'Payment today helps me. OK.',
        delivery: ''
      }[tactic.id]);
    }
    if (fresh.length && !polite) replies.push('A little more politely next time, please.');
    const supplier = SUPPLIERS.find((item) => item.id === negotiation.supplierId);
    const info = !found.length && supplier ? supplierInfoReply(said, { company: supplier.name, deliveryDays: supplier.deliveryDays }) : undefined;
    if (info) replies.push(info);
    else if (!found.length && has(said, /\b(deal|agree|accept|sounds good|that works|ok(ay)?)\b/)) replies.push('Good. Make me an offer.');
    else if (!found.length && has(said, /\b(hello|hi|good (morning|afternoon|evening))\b/)) replies.push('Hello! Let’s talk about your order.');
    else if (!found.length) replies.push('I see. We can talk about the price, the order size, payment or delivery.');
    else if (!fresh.length) replies.push('You already told me that.');
    if (fresh.length) replies.push('Make me an offer and we will see.');
    negotiation.mood = fresh.length ? 'pleased' : 'neutral';
    addLine(negotiation, 'seller', replies.join(' '));
  }
  state.message = `${seller}: ${negotiation.lines.at(-1)!.text}`;
}

export function acceptDeal(state: PlayerState, now: number, dayMs: number) {
  const negotiation = state.negotiation;
  if (!negotiation) throw new TradeError('There is no deal to accept.');
  const quote = negotiatedQuote(state, negotiation, now);
  if (!quote.base.lines.length) throw new TradeError('The order is empty.');
  // Storeroom capacity, the fridge and the order discounts apply to negotiated orders exactly as to normal ones.
  for (const line of quote.base.lines) {
    const room = roomFor(state, quote.barId, line.ingredientId);
    if (line.amount > room) throw new TradeError(`No room for ${INGREDIENTS.find((item) => item.id === line.ingredientId)!.name}: the storeroom has space for ${room} more. A better fridge raises capacity.`);
  }
  const discount = orderDiscount(state, now);
  const total = discount.factor < 1 ? coins(quote.total * discount.factor) : quote.total;
  if (state.money < total) throw new TradeError('You do not have enough money.');
  state.money = coins(state.money - total);
  if (discount.voucher) delete state.loot.armed['voucher'];
  state.deliveryOrders.push({
    id: crypto.randomUUID(), supplier: quote.supplier.name, barId: quote.barId, dueAt: now + Math.round(quote.supplier.deliveryDays * dayMs * deliveryFactorFor(state, quote.barId)),
    items: quote.base.lines.map((line) => ({ ingredientId: line.ingredientId, amount: line.amount })), total
  });
  state.lastNegotiatedAt = { ...(state.lastNegotiatedAt ?? {}), [negotiation.supplierId]: now };
  const bar = REGIONS.find((item) => item.id === quote.barId)!.name;
  const note = `Negotiated ${quote.base.packs} packs from ${quote.supplier.name}: ${total.toFixed(2)} coins (${Math.round(quote.discountRate * 100)}% off${quote.surcharge ? `, +${Math.round(quote.surcharge * 100)}% surcharge` : ''}), delivery to ${bar}.`;
  state.tradeLog = [note, ...state.tradeLog].slice(0, 40);
  state.message = note;
  state.negotiation = undefined;
}
