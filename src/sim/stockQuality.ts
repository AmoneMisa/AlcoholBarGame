import { INGREDIENTS, SUPPLIERS } from '../domain/catalog';
import { coins } from '../domain/economy';
import type { InventoryItem, RegionId } from '../domain/types';
import { SELLERS } from './trade';
import { DELIVERY_DAY_MS, type DeliveryOrder, type PlayerState } from './state';
import { ingredientName as nameOf } from '../domain/catalog';

// Deliveries do not always arrive in perfect shape. A small share of every order is lost, damaged, wrong, fake,
// close to its date or past it. The player must notice, decide what to do with it, and may report it to the supplier
// (in English) for a refund or a replacement. Guests who get a drink made from bad stock may complain.
//
//  - damaged: part of the goods are usable, but only in cocktails (never in brand pours or sealed-bottle sales);
//  - expiring: usable, but they go off at a set time (and guests may notice the taste);
//  - lost: never arrives; wrong: a different product arrives (rare); counterfeit and expired: unusable quarantine.

export type IssueKind = 'lost' | 'damaged' | 'wrong' | 'counterfeit' | 'expiring' | 'expired';
export const ISSUE_LABEL: Record<IssueKind, string> = {
  lost: 'Lost in delivery', damaged: 'Damaged', wrong: 'Wrong product', counterfeit: 'Not original (fake)', expiring: 'Close to its date', expired: 'Past its date'
};

export interface DeliveryIssue {
  id: string; barId: RegionId; supplier: string; supplierId: string; ingredientId: string;
  /** For a wrong delivery: what arrived instead. */
  deliveredId?: string;
  amount: number; kind: IssueKind; value: number; at: number;
  status: 'open' | 'refunded' | 'replaced' | 'rejected' | 'closed';
  tries: number;
}
export interface LowGrade { damaged: number; expiring: number; expiringAt: number }
export interface QuarantineItem { id: string; barId: RegionId; ingredientId: string; amount: number; kind: 'counterfeit' | 'expired'; value: number }

const CLAIM_WINDOW_MS = 3 * DELIVERY_DAY_MS;
const FRESH = new Set(['fruit', 'herb', 'mixer']);

export const lowGradeOf = (state: PlayerState, barId: RegionId = state.regionId) => ((state.lowGrade ??= {} as Record<RegionId, Record<string, LowGrade>>)[barId] ??= {});
const lowFor = (state: PlayerState, barId: RegionId, ingredientId: string) => (lowGradeOf(state, barId)[ingredientId] ??= { damaged: 0, expiring: 0, expiringAt: 0 });
export const goodAmount = (state: PlayerState, ingredientId: string) => {
  const stock = state.inventories[state.regionId].find((item) => item.ingredientId === ingredientId)?.amount ?? 0;
  const low = lowGradeOf(state)[ingredientId];
  return Math.max(0, stock - (low?.damaged ?? 0) - (low?.expiring ?? 0));
};

function addStock(state: PlayerState, barId: RegionId, ingredientId: string, amount: number) {
  const stock = state.inventories[barId].find((item) => item.ingredientId === ingredientId);
  if (stock) stock.amount += amount;
  else state.inventories[barId].push({ ingredientId, amount });
}

// A supplier with a good reputation has fewer problems.
const trouble = (supplierName: string) => {
  const reputation = SUPPLIERS.find((item) => item.name === supplierName)?.reputation ?? 4;
  return Math.max(.4, 1.6 - reputation * .2);
};

// What happens to each line of an order that has just arrived. Returns notes for the message and the trade log.
export function receiveOrder(state: PlayerState, order: DeliveryOrder, now: number, random: () => number): string[] {
  const notes: string[] = [];
  // Problems are uncommon, but not rare: roughly one order in five has one.
  const factor = trouble(order.supplier) * .5;
  const supplierId = SUPPLIERS.find((item) => item.name === order.supplier)?.id ?? 'global';
  const issues = (state.deliveryIssues ??= []);
  for (const item of order.items) {
    const ingredient = INGREDIENTS.find((entry) => entry.id === item.ingredientId);
    if (!ingredient) { addStock(state, order.barId, item.ingredientId, item.amount); continue; }
    const unitValue = ingredient.basePrice * 1.15;
    const issue = (kind: IssueKind, amount: number, extra: Partial<DeliveryIssue> = {}) => {
      issues.unshift({ id: crypto.randomUUID(), barId: order.barId, supplier: order.supplier, supplierId, ingredientId: ingredient.id, amount, kind, value: coins(amount * unitValue), at: now, status: 'open', tries: 0, ...extra });
    };
    const spirit = ingredient.category === 'spirit';
    const thresholds: [IssueKind, number][] = [['lost', .025], ['damaged', .06], ['wrong', .008], ['counterfeit', spirit ? .015 : 0], ['expiring', FRESH.has(ingredient.category) ? .04 : .01], ['expired', FRESH.has(ingredient.category) ? .01 : .004]];
    let roll = random();
    let kind: IssueKind | undefined;
    for (const [candidate, chance] of thresholds) { roll -= chance * factor; if (roll < 0) { kind = candidate; break; } }
    const name = ingredient.name;
    if (!kind) { addStock(state, order.barId, ingredient.id, item.amount); continue; }
    if (kind === 'lost') { issue('lost', item.amount); notes.push(`${name} was lost in delivery.`); }
    else if (kind === 'damaged') {
      const damaged = Math.max(1, Math.round(item.amount * (.3 + random() * .4)));
      addStock(state, order.barId, ingredient.id, item.amount);
      lowFor(state, order.barId, ingredient.id).damaged += damaged;
      issue('damaged', damaged);
      notes.push(`Part of the ${name} arrived damaged (cocktails only).`);
    } else if (kind === 'wrong') {
      const others = INGREDIENTS.filter((entry) => entry.category === ingredient.category && entry.id !== ingredient.id);
      const wrong = others[Math.floor(random() * others.length)];
      if (!wrong) { addStock(state, order.barId, ingredient.id, item.amount); continue; }
      addStock(state, order.barId, wrong.id, item.amount);
      issue('wrong', item.amount, { deliveredId: wrong.id });
      notes.push(`The supplier sent ${wrong.name} instead of ${name}.`);
    } else if (kind === 'counterfeit' || kind === 'expired') {
      (state.quarantine ??= []).unshift({ id: crypto.randomUUID(), barId: order.barId, ingredientId: ingredient.id, amount: item.amount, kind, value: coins(item.amount * unitValue) });
      issue(kind, item.amount);
      notes.push(kind === 'counterfeit' ? `The ${name} is not original. It is set aside.` : `The ${name} is past its date. It is set aside.`);
    } else {
      addStock(state, order.barId, ingredient.id, item.amount);
      const low = lowFor(state, order.barId, ingredient.id);
      low.expiring += item.amount;
      low.expiringAt = low.expiringAt ? Math.min(low.expiringAt, now + (1 + random()) * DELIVERY_DAY_MS) : now + (1 + random()) * DELIVERY_DAY_MS;
      issue('expiring', item.amount);
      notes.push(`The ${name} is close to its date. Use it soon.`);
    }
  }
  if (issues.length > 40) issues.length = 40;
  return notes;
}

// Goods past their date leave the shelf and wait in quarantine.
export function expireStock(state: PlayerState, now: number) {
  for (const barId of Object.keys(state.lowGrade ?? {}) as RegionId[]) {
    for (const [ingredientId, low] of Object.entries(lowGradeOf(state, barId))) {
      if (!low.expiring || !low.expiringAt || low.expiringAt > now) continue;
      const stock = state.inventories[barId].find((item) => item.ingredientId === ingredientId);
      const amount = Math.min(low.expiring, stock?.amount ?? 0);
      if (stock) stock.amount -= amount;
      low.expiring = 0;
      low.expiringAt = 0;
      if (amount > 0) {
        const unitValue = (INGREDIENTS.find((item) => item.id === ingredientId)?.basePrice ?? 0) * 1.15;
        (state.quarantine ??= []).unshift({ id: crypto.randomUUID(), barId, ingredientId, amount, kind: 'expired', value: coins(amount * unitValue) });
        state.message = `${nameOf(ingredientId)} went off and was set aside.`;
      }
    }
  }
}

// Lower-grade goods are used first (so they are not wasted). Returns what quality the drink was made with.
export function takeLowGrade(state: PlayerState, mix: InventoryItem[]): Set<'damaged' | 'expiring'> {
  const used = new Set<'damaged' | 'expiring'>();
  const low = lowGradeOf(state);
  for (const item of mix) {
    const grade = low[item.ingredientId];
    if (!grade) continue;
    let need = item.amount;
    const damaged = Math.min(need, grade.damaged);
    if (damaged > 0) { grade.damaged -= damaged; need -= damaged; used.add('damaged'); }
    const expiring = Math.min(need, grade.expiring);
    if (expiring > 0) { grade.expiring -= expiring; used.add('expiring'); }
  }
  return used;
}

// ---- Telling the supplier ----
const KIND_WORDS: Record<IssueKind, RegExp> = {
  lost: /\b(missing|lost|never (arrived|came)|did not (arrive|come)|not (arrived|here))\b/,
  damaged: /\b(damaged|broken|crushed|leak|leaking|wet|smashed)\b/,
  wrong: /\b(wrong|different|instead|not what (i|we) ordered|mistake)\b/,
  counterfeit: /\b(fake|counterfeit|not original|false|copy)\b/,
  expiring: /\b(old|date|expire|expiring|almost|fresh)\b/,
  expired: /\b(expired|past (its|the) date|bad|rotten|off)\b/
};
const POLITE = /\b(please|could|would|may|kindly|thank|thanks|sorry)\b/;
const EVIDENCE = /\b(photo|picture|invoice|receipt|order number|proof)\b/;

export interface ClaimResult { ok: boolean; line: string; outcome: 'refunded' | 'replaced' | 'rejected' | 'retry'; note: string }

export function fileClaim(state: PlayerState, issueId: string, text: string, english: { ok: boolean }, now: number, random: () => number): ClaimResult {
  const issue = state.deliveryIssues?.find((item) => item.id === issueId);
  if (!issue) return { ok: false, line: 'I can not find that delivery. Please check the order number.', outcome: 'retry', note: '' };
  const seller = SELLERS[issue.supplierId]?.name ?? 'The seller';
  if (issue.status !== 'open') return { ok: false, line: `We already dealt with that, ${seller === 'The seller' ? 'sorry' : 'sorry'}.`, outcome: 'retry', note: '' };
  if (now - issue.at > CLAIM_WINDOW_MS) { issue.status = 'closed'; return { ok: false, line: 'I am sorry, but problems must be reported within three days.', outcome: 'rejected', note: 'The claim period is over.' }; }
  if (issue.tries >= 2) { issue.status = 'rejected'; return { ok: false, line: 'I am sorry. I can not do more for this order.', outcome: 'rejected', note: '' }; }
  issue.tries++;
  const said = text.toLowerCase().replace(/’/g, "'");
  const names = KIND_WORDS[issue.kind].test(said);
  const chance = Math.max(.1, Math.min(.92, .35 + (english.ok ? .15 : -.1) + (POLITE.test(said) ? .08 : 0) + (EVIDENCE.test(said) ? .12 : 0) + (names ? .15 : -.08) + (now - issue.at < DELIVERY_DAY_MS ? .05 : 0)));
  if (random() >= chance) {
    if (issue.tries >= 2) issue.status = 'rejected';
    return { ok: false, line: names ? 'I understand, but I need more proof. Could you send a photo, and the invoice number?' : 'Sorry, I do not understand the problem. Could you say it again, please?', outcome: issue.tries >= 2 ? 'rejected' : 'retry', note: '' };
  }
  const refund = issue.kind === 'counterfeit' || issue.kind === 'expired' || random() < .55;
  if (refund) {
    state.money = coins(state.money + issue.value);
    issue.status = 'refunded';
    state.quarantine = state.quarantine?.filter((item) => !(item.ingredientId === issue.ingredientId && item.barId === issue.barId && item.kind === issue.kind && item.amount === issue.amount));
    return { ok: true, line: `${seller === 'The seller' ? 'We are' : 'I am'} very sorry. We will refund ${issue.value.toFixed(2)} coins today.`, outcome: 'refunded', note: `Refund: ${issue.value.toFixed(2)} coins.` };
  }
  const supplier = SUPPLIERS.find((item) => item.id === issue.supplierId);
  state.deliveryOrders.push({ id: crypto.randomUUID(), supplier: issue.supplier, barId: issue.barId, dueAt: now + Math.round((supplier?.deliveryDays ?? 3) * DELIVERY_DAY_MS * .7), items: [{ ingredientId: issue.ingredientId, amount: issue.amount }], total: 0 });
  // A wrong product is taken back when the right one is sent.
  if (issue.kind === 'wrong' && issue.deliveredId) {
    const stock = state.inventories[issue.barId].find((item) => item.ingredientId === issue.deliveredId);
    if (stock) stock.amount = Math.max(0, stock.amount - issue.amount);
  }
  issue.status = 'replaced';
  return { ok: true, line: 'I am very sorry. A replacement is on its way, and it is free of charge.', outcome: 'replaced', note: 'A free replacement is on its way.' };
}

export function discardQuarantine(state: PlayerState, id: string) {
  const index = state.quarantine?.findIndex((item) => item.id === id) ?? -1;
  if (index < 0) return false;
  state.quarantine!.splice(index, 1);
  return true;
}
