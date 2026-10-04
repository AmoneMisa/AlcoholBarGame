import { collectionBonuses } from '../domain/collectionBonuses';
import { RECIPES, REGIONS } from '../domain/catalog';
import { CUSTOMER_ARRIVAL_MIN_MS, CUSTOMER_ARRIVAL_MAX_MS, MAX_CUSTOMER_SEATS } from '../domain/customerTiming';
import { levelPerks } from '../domain/progression';
import { coins } from '../domain/economy';
import type { PlayerState } from './state';

export const TIP_ACCUMULATION_MS = 12 * 60 * 60 * 1000;
// Fixed starting capacity: expected starter tips over 12 hours, rounded up to ten coins.
// Keep independent of temporary events, city changes and recipe purchases; upgrades can extend this later.
const starterPrice = RECIPES.slice(0, 10).reduce((sum, recipe) => sum + recipe.price, 0) / 10 * REGIONS[0]!.marketFactor * levelPerks(1).pay;
export const BASE_TIP_CAP = Math.ceil(MAX_CUSTOMER_SEATS * TIP_ACCUMULATION_MS / ((CUSTOMER_ARRIVAL_MIN_MS + CUSTOMER_ARRIVAL_MAX_MS) / 2) * levelPerks(1).tipChance * Math.ceil(starterPrice * .1) / 10) * 10;
export const TIP_THEFT_RATE = .05;
export const TIP_PROTECTED_SHARE = .30;
export const tipAccumulationMs = (state: PlayerState) => Math.round(TIP_ACCUMULATION_MS * (1 + collectionBonuses(state).offlineRate));
export const tipCapacity = (state: PlayerState) => Math.round(BASE_TIP_CAP * (1 + collectionBonuses(state).rate) * (1 + collectionBonuses(state).offlineRate));

export function normalizeTips(state: PlayerState) {
  // Existing saves may predate the cap: preserve their earned coins, but pause new deposits.
  state.tipJar = coins(Math.max(0, Number.isFinite(state.tipJar) ? state.tipJar! : 0));
  if (!Number.isFinite(state.tipJarStartedAt)) state.tipJarStartedAt = state.lastClockAt;
  state.tipJarDeposited = coins(Math.max(state.tipJar, Number.isFinite(state.tipJarDeposited) ? state.tipJarDeposited! : state.tipJar));
  state.tipJarPassiveAccrued = Math.floor(Math.max(0, Number.isFinite(state.tipJarPassiveAccrued) ? state.tipJarPassiveAccrued! : 0));
}

export function depositTips(state: PlayerState, amount: number, now: number) {
  normalizeTips(state);
  if (now - state.tipJarStartedAt! >= tipAccumulationMs(state)) return 0;
  // Theft does not reopen a filled jar's earning budget; only the owner's collection does.
  const accepted = coins(Math.min(Math.max(0, amount), Math.max(0, tipCapacity(state) - state.tipJarDeposited!)));
  state.tipJar = coins(state.tipJar! + accepted);
  state.tipJarDeposited = coins(state.tipJarDeposited! + accepted);
  return accepted;
}

export function accrueTips(state: PlayerState, now: number) {
  normalizeTips(state);
  const elapsed = Math.min(tipAccumulationMs(state), Math.max(0, now - state.tipJarStartedAt!));
  const total = Math.floor(tipCapacity(state) * elapsed / tipAccumulationMs(state));
  const delta = Math.max(0, total - state.tipJarPassiveAccrued!);
  // The final slice is accepted at the 12-hour boundary; later guest tips stay paused.
  if (delta > 0) depositTips(state, delta, Math.min(now, state.tipJarStartedAt! + tipAccumulationMs(state) - 1));
  state.tipJarPassiveAccrued = Math.max(state.tipJarPassiveAccrued!, total);
}

export function resetTips(state: PlayerState, now: number) {
  state.tipJar = 0;
  state.tipJarStartedAt = now;
  state.tipJarDeposited = 0;
  state.tipJarPassiveAccrued = 0;
}

export function stealableTips(state: PlayerState) {
  normalizeTips(state);
  const protectedCoins = Math.ceil(state.tipJarDeposited! * TIP_PROTECTED_SHARE);
  return Math.max(0, Math.floor(Math.min(state.tipJar! * TIP_THEFT_RATE, state.tipJar! - protectedCoins)));
}
