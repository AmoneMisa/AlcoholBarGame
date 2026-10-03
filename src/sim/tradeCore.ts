// Common state helpers needed by the opening bar.
import { REGIONS, SUPPLIERS } from '../domain/catalog';
import { coins, quotePurchase } from '../domain/economy';
import { marketFor } from '../domain/progression';
import type { RegionId } from '../domain/types';
import type { PlayerState } from './state';
export const MAX_TRADE_DISCOUNT = .30;

export type TacticId = 'ask' | 'bulk' | 'loyalty' | 'competitor' | 'cash' | 'delivery';

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

export const SELLERS: Record<string, { name: string; greeting: string }> = {
  global: { name: 'Marcus', greeting: 'Good afternoon! Marcus from Global Drinks. I have your order here — what can I do for you?' },
  local: { name: 'Rosa', greeting: 'Hi there, Rosa from the Local Market. Your basket looks good! Anything you want to talk about?' },
  premium: { name: 'Victor', greeting: 'Good evening. Victor, Premium Spirits. Our prices reflect our quality, but I am listening.' },
  fresh: { name: 'Amina', greeting: 'Hello! Amina from Fresh & Green. Everything was picked this morning. How can I help?' }
};
