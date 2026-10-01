import { INGREDIENTS } from './catalog';
import { createMarket } from './engine';
import type { Region, RegionId } from './types';

// Levels and the economy that grows with them. Shared by the server (authoritative) and the client (display),
// so every number the player sees is the number the rules use.

// ---- Levels ----
export const MAX_LEVEL = 50;
// XP needed to go from `level` to the next one: 60, 80, 100, …
const stepFor = (level: number) => 60 + (level - 1) * 20;
// Total XP at which a level starts (level 1 starts at 0 XP).
export function xpForLevel(level: number) {
  const steps = Math.max(0, Math.min(MAX_LEVEL, level) - 1);
  return 60 * steps + 10 * steps * (steps - 1);
}
export function levelFor(xp: number) {
  let level = 1;
  while (level < MAX_LEVEL && xp >= xpForLevel(level + 1)) level++;
  return level;
}
export function levelProgress(xp: number) {
  const level = levelFor(xp);
  if (level >= MAX_LEVEL) return { level, into: 0, needed: 0, percent: 100 };
  const into = Math.max(0, xp - xpForLevel(level));
  const needed = stepFor(level);
  return { level, into, needed, percent: Math.min(100, into / needed * 100) };
}

// ---- What a level changes ----
// Perks grow slowly and cap early enough that a high level helps without breaking the economy.
export const MAX_VIP_CHANCE = .25;
// Level unlocks: automation is earned, not given.
export const AUTO_SUPPLY_LEVEL = 5;
export const AUTO_SERVE_LEVEL = 10;
export function levelPerks(level: number) {
  const steps = Math.max(0, Math.min(MAX_LEVEL, level) - 1);
  return {
    // Chance that an arriving guest is a VIP: 5% at level 1, +0.5% per level, never above 25%.
    vipChance: Math.min(MAX_VIP_CHANCE, .05 + steps * .005),
    // A new bar is unknown, so guests pay 85% of list prices at first: +1% per level, up to 130%.
    pay: Math.min(1.3, .85 + steps * .01),
    // Suppliers give regular customers better terms: −0.4% per level, down to 85% of the list price.
    supply: Math.max(.85, 1 - steps * .004),
    // Deliveries get priority as the bar grows: −0.8% delivery time per level, down to 65%.
    delivery: Math.max(.65, 1 - steps * .008),
    // Tips are never guaranteed: 45% of guests tip at level 1, +0.6% per level, up to 75%.
    tipChance: Math.min(.75, .45 + steps * .006),
    // The wait for the next guest shrinks: −1% per level, down to 60% of the base wait.
    arrival: Math.max(.6, 1 - steps * .01),
    // VIPs come back sooner too.
    vipCooldown: Math.max(.5, 1 - steps * .012),
    autoSupply: level >= AUTO_SUPPLY_LEVEL,
    autoServe: level >= AUTO_SERVE_LEVEL
  };
}

// Delivery time as players read it (orders log and supplier cards use the same wording).
export const formatDeliveryTime = (days: number) => days >= 1.95 ? `${Math.round(days * 10) / 10} days` : `${Math.round(days * 24)} hours`;

// ---- City events: buffs and disasters ----
// Each city rolls its own event for every two-hour window from the server clock, so nobody can pick or fake one.
export const EVENT_WINDOW_MS = 2 * 60 * 60 * 1000;
export interface EventEffects {
  arrival?: number;      // multiplies the wait for the next guest
  tips?: number;         // multiplies tips
  pay?: number;          // multiplies what arriving guests pay
  supply?: number;       // multiplies all supplier prices
  vipBonus?: number;     // added to the VIP chance (the 25% cap still applies)
  shortage?: number;     // supplier price multiplier for the ingredients in short supply
  buyback?: number;      // what other bars pay for those ingredients
}
export interface MarketEvent {
  id: string; name: string; kind: 'buff' | 'disaster'; icon: string; description: string;
  effects: EventEffects; shortageIds: string[]; startsAt: number; endsAt: number;
}

const EVENTS: (Omit<MarketEvent, 'shortageIds' | 'startsAt' | 'endsAt'> & { weight: number })[] = [
  { id: 'hot-time', name: 'Hot Time', kind: 'buff', icon: '🔥', weight: 3, description: 'The whole city is out tonight: guests arrive twice as fast and tip 50% more.', effects: { arrival: .5, tips: 1.5 } },
  { id: 'discounts', name: 'Supplier Discounts', kind: 'buff', icon: '🏷️', weight: 3, description: 'Suppliers clear their warehouses: every pack costs 20% less.', effects: { supply: .8 } },
  { id: 'vip-night', name: 'VIP Night', kind: 'buff', icon: '💎', weight: 2, description: 'A gala nearby: VIP guests are 15% more likely (up to 25%).', effects: { vipBonus: .15 } },
  { id: 'festival', name: 'City Festival', kind: 'buff', icon: '🎉', weight: 2, description: 'Festival crowds: new guests pay 15% more and tip 30% more.', effects: { pay: 1.15, tips: 1.3, arrival: .8 } },
  { id: 'shortage', name: 'Product Shortage', kind: 'disaster', icon: '📦', weight: 3, description: 'A delivery failed: some ingredients cost 80% more — but other bars pay 50% more for yours.', effects: { shortage: 1.8, buyback: 1.5 } },
  { id: 'tourists', name: 'Tourist Season', kind: 'buff', icon: '🧳', weight: 2, description: 'Visitors fill the city: guests arrive 30% faster and pay 10% more.', effects: { arrival: .7, pay: 1.1 } },
  { id: 'wine-festival', name: 'Wine Festival', kind: 'buff', icon: '🍷', weight: 1, description: 'The city celebrates its harvest: guests are generous (tips +25%) and suppliers give 10% off.', effects: { tips: 1.25, supply: .9 } },
  { id: 'holiday', name: 'Public Holiday', kind: 'buff', icon: '🎊', weight: 2, description: 'Nobody is at work: guests arrive 35% faster and tip 20% more.', effects: { arrival: .65, tips: 1.2 } },
  { id: 'harvest', name: 'Good Harvest', kind: 'buff', icon: '🌾', weight: 2, description: 'Fruit and sugar are plentiful: every pack costs 15% less.', effects: { supply: .85 } },
  { id: 'fuel-strike', name: 'Fuel Strike', kind: 'disaster', icon: '⛽', weight: 2, description: 'Trucks are stuck: some goods cost 50% more, and other bars pay 30% more for yours.', effects: { shortage: 1.5, buyback: 1.3 } },
  { id: 'import-ban', name: 'Import Ban', kind: 'disaster', icon: '🚫', weight: 1, description: 'Imported goods are held at the border: some cost double, other bars pay 80% more for yours.', effects: { shortage: 2, buyback: 1.8 } },
  { id: 'competitor', name: 'New Competitor', kind: 'disaster', icon: '🏪', weight: 2, description: 'A new bar opened down the street: guests arrive 30% slower and pay 5% less.', effects: { arrival: 1.3, pay: .95 } },
  { id: 'heatwave', name: 'Heat Wave', kind: 'disaster', icon: '🥵', weight: 1, description: 'Too hot to go out: guests arrive 40% slower.', effects: { arrival: 1.4 } },
  { id: 'storm', name: 'Storm Warning', kind: 'disaster', icon: '⛈️', weight: 2, description: 'Heavy rain keeps people at home: guests take 70% longer to arrive.', effects: { arrival: 1.7 } }
];
export const EVENT_CATALOG = EVENTS.map(({ weight: _weight, ...event }) => event);
const EVENT_CHANCE = .6;

// Small deterministic hash → [0, 1).
function seeded(text: string) {
  let hash = 2166136261;
  for (let index = 0; index < text.length; index++) hash = Math.imul(hash ^ text.charCodeAt(index), 16777619);
  return () => {
    hash = Math.imul(hash ^ (hash >>> 15), 2246822507);
    hash = Math.imul(hash ^ (hash >>> 13), 3266489909);
    return ((hash ^= hash >>> 16) >>> 0) / 4294967296;
  };
}

export function eventAt(regionId: RegionId, now: number): MarketEvent | undefined {
  const window = Math.floor(now / EVENT_WINDOW_MS);
  const random = seeded(`${regionId}:${window}`);
  if (random() >= EVENT_CHANCE) return undefined;
  const total = EVENTS.reduce((sum, event) => sum + event.weight, 0);
  let roll = random() * total;
  const picked = EVENTS.find((event) => (roll -= event.weight) < 0) ?? EVENTS[0]!;
  const { weight: _weight, ...event } = picked;
  // A shortage hits one kind of ingredient (fruit, herbs, a spirit family…): up to four of them.
  let shortageIds: string[] = [];
  if (event.effects.shortage) {
    const categories = [...new Set(INGREDIENTS.map((item) => item.category))];
    const category = categories[Math.floor(random() * categories.length)];
    shortageIds = INGREDIENTS.filter((item) => item.category === category).sort(() => random() - .5).slice(0, 4).map((item) => item.id);
  }
  return { ...event, shortageIds, startsAt: window * EVENT_WINDOW_MS, endsAt: (window + 1) * EVENT_WINDOW_MS };
}

// ---- The numbers the rules use ----
export function economyAt(regionId: RegionId, marketFactor: number, xp: number, now: number) {
  const level = levelFor(xp);
  const perks = levelPerks(level);
  const event = eventAt(regionId, now);
  const effects = event?.effects ?? {};
  const shortage = new Set(event?.shortageIds ?? []);
  return {
    level, perks, event,
    vipChance: Math.min(MAX_VIP_CHANCE, perks.vipChance + (effects.vipBonus ?? 0)),
    // What a guest arriving now will pay, relative to catalog prices.
    guestPriceFactor: Number((marketFactor * perks.pay * (effects.pay ?? 1)).toFixed(4)),
    arrival: perks.arrival * (effects.arrival ?? 1),
    vipCooldown: perks.vipCooldown,
    tips: effects.tips ?? 1,
    tipChance: perks.tipChance,
    delivery: perks.delivery,
    supplyFactor: (ingredientId: string) => perks.supply * (effects.supply ?? 1) * (shortage.has(ingredientId) ? effects.shortage ?? 1 : 1),
    buybackFactor: (ingredientId: string) => shortage.has(ingredientId) ? effects.buyback ?? 1 : 1
  };
}

// The supplier market as the rules price it: the day's market, then level and event multipliers per ingredient.
export function marketFor(region: Region, now: number, xp: number) {
  const economy = economyAt(region.id, region.marketFactor, xp, now);
  return createMarket(region, new Date(now).getDate()).map((offer) => {
    const factor = economy.supplyFactor(offer.ingredientId);
    return factor === 1 ? offer : { ...offer, listPrice: Number((offer.listPrice * factor).toFixed(2)), price: Number((offer.price * factor).toFixed(2)) };
  });
}
