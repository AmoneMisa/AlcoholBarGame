import type { Choice, Effects, Outcome, Payment, SituationContext, Tone } from './types';
import type { RegionId } from '../types';

// Small constructors that keep the situation scripts short and readable.

export const out = (say: string, effects: Effects = {}, extra: Partial<Outcome> = {}): Outcome => ({ say, effects, ...extra });
export const pick = (id: string, say: string, tone: Tone, outcomes: Outcome[], extra: Partial<Choice> = {}): Choice => ({ id, say, tone, outcomes, ...extra });

// Which payment methods each city's bars accept. A guest may offer one the bar cannot take, and the bartender has to
// say so politely and offer another way to pay.
export const ACCEPTED_PAYMENTS: Record<RegionId, Payment[]> = {
  'new-york': ['cash', 'card', 'qr', 'visa', 'amex', 'usd'],
  london: ['cash', 'card', 'qr', 'visa', 'amex'],
  berlin: ['cash', 'card', 'iban', 'visa', 'eur'],
  tashkent: ['cash', 'card', 'qr', 'uzcard', 'humo', 'visa', 'usd'],
  bucharest: ['cash', 'card', 'qr', 'iban', 'visa', 'eur'],
  tokyo: ['cash', 'card', 'qr', 'visa', 'union']
};
export const accepts = (region: RegionId, payment: Payment) => ACCEPTED_PAYMENTS[region].includes(payment);

// Weight helpers for outcomes.
export const whenAccepted = (payment: Payment, yes: number, no = 0) => (context: SituationContext) => (context.accepts(payment) ? yes : no);
// Calm, friendly guests behave; drunk and angry ones push their luck.
export const behaves = (base: number) => (context: SituationContext) => Math.max(.05, Math.min(.95, base + (context.rapport - 50) / 200 - context.drunk / 250 - (context.emotion === 'angry' ? .15 : 0)));
export const misbehaves = (base: number) => (context: SituationContext) => 1 - behaves(1 - base)(context);
export const money = (amount: number) => amount.toFixed(2).replace(/\.00$/, '');
