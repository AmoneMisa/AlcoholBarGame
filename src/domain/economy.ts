import type { Supplier, SupplierOffer } from './types';

export const coins = (value: number) => Math.round(value * 100) / 100;
export const bulkDiscount = (packs: number) => packs >= 10 ? .10 : packs >= 5 ? .05 : 0;
export const DAILY_COINS = [150, 250, 400, 550, 700, 850, 1000] as const;
export const dailyCoinsFor = (streak: number) => DAILY_COINS[Math.min(6, Math.max(0, Math.floor(streak) - 1))]!;

export function calendarDate(date = new Date()) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

export function consecutiveDays(lastDate: string, streak: number, date = new Date()) {
  const yesterday = new Date(date.getFullYear(), date.getMonth(), date.getDate() - 1);
  return lastDate === calendarDate(date) ? Math.max(1, streak) : lastDate === calendarDate(yesterday) ? streak + 1 : 1;
}

export function quotePurchase(offers: SupplierOffer[], cart: Record<string, number>, supplier: Supplier) {
  const lines = offers.filter((offer) => offer.supplierId === supplier.id && Number.isFinite(cart[offer.ingredientId]) && cart[offer.ingredientId] >= 1).map((offer) => {
    const packs = Math.min(99, Math.max(1, Math.floor(cart[offer.ingredientId]!)));
    return { ...offer, packs, amount: offer.quantity * packs, subtotal: coins(offer.price * packs) };
  });
  const packs = lines.reduce((sum, line) => sum + line.packs, 0);
  const subtotal = coins(lines.reduce((sum, line) => sum + line.subtotal, 0));
  const discountRate = bulkDiscount(packs);
  const discount = coins(subtotal * discountRate);
  const discountedSubtotal = coins(subtotal - discount);
  const delivery = lines.length && discountedSubtotal < supplier.freeDeliveryAt ? supplier.deliveryFee : 0;
  return { lines, packs, subtotal, discountRate, discount, delivery, total: coins(discountedSubtotal + delivery), freeDeliveryRemaining: coins(Math.max(0, supplier.freeDeliveryAt - discountedSubtotal)) };
}
