// Economy simulation: many bot players run through the game's real rule engine (src/sim/rules.ts) on a
// virtual clock, and pay with Telegram Stars according to an assumed spending profile.
//
//   node --import ./tests/register.mjs scripts/simulate-economy.mjs [players=500] [days=60] [payerShare=0.10] [seed=1]
//
// What is real: every action goes through applyAction (prices, rewards, timers, exchange, shop costs) and
// the Star packs come from src/domain/economy.ts. What is ASSUMED: how often people play, how many of them
// pay and what they buy. Conversations are skipped (the order is simply revealed), so XP runs slower than
// for a real player. Treat the output as a model for comparing price changes, not a forecast.

import { RECIPES, REGIONS } from '../src/domain/catalog.ts';
import { INTERIORS } from '../src/data/cosmetics/bars.ts';
import { STAR_CRYSTAL_PACKS, recipePurchase, CRYSTAL_EXCHANGE_BUNDLES } from '../src/domain/economy.ts';
import { requiredRecipe } from '../src/domain/engine.ts';
import { dailyLessonsFor } from '../src/domain/dailyLessons.ts';
import { recipeLevel, upgradeCost } from '../src/sim/recipes.ts';
import { levelFor } from '../src/sim/state.ts';
import { applyAction, RuleError } from '../src/sim/rules.ts';
import { createInitialState, normalizePlayerState } from '../src/sim/state.ts';
import { ALCOHOL_PRODUCTS } from '../src/domain/bottleCatalog.ts';
import { calendarDate } from '../src/domain/economy.ts';

const [PLAYERS = 500, DAYS = 60, PAYER_SHARE = 0.10, SEED = 1] = process.argv.slice(2).map(Number);
const DAY = 86_400_000;
const START = Date.UTC(2026, 9, 1, 0, 0, 0);

function rng(seed) {
  let a = seed >>> 0;
  return () => { a = (a + 0x6D2B79F5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
}
const random = rng(SEED * 7919);
const pick = (table) => { let r = random(), total = 0; for (const [key, weight] of table) { total += weight; if (r < total) return key; } return table.at(-1)[0]; };

// ---- Assumed player profiles ----
const ENGAGEMENT = {
  casual:   { playDay: 0.55, minutes: 20 },
  regular:  { playDay: 0.85, minutes: 45 },
  hardcore: { playDay: 1.00, minutes: 120 }
};
// Payers: what they buy and how often (mean days between purchases). Shares are of ALL players.
const PAYERS = {
  free:   { share: 1 - PAYER_SHARE, buys: [], every: Infinity },
  minnow: { share: PAYER_SHARE * 0.60, buys: ['starter', 'pinch'], every: 21 },
  dolphin:{ share: PAYER_SHARE * 0.30, buys: ['handful', 'chest'], every: 12 },
  whale:  { share: PAYER_SHARE * 0.10, buys: ['chest', 'vault'], every: 8 }
};

const ctx = (now) => ({ now, random, checkEnglish: (text) => ({ ok: true, corrected: text }), spawnCustomers: true });
const flows = { crystalIn: {}, crystalOut: {}, coinIn: {}, coinOut: {} };
const add = (table, key, value) => { table[key] = (table[key] ?? 0) + value; };

function act(player, action, now) {
  const state = player.state;
  const money = state.money, crystals = state.crystals;
  try { applyAction(state, action, ctx(now)); } catch (error) { if (error instanceof RuleError) return false; throw error; }
  const dc = state.crystals - crystals, dm = state.money - money;
  if (dc > 0) add(flows.crystalIn, action.type, dc); else if (dc < 0) add(flows.crystalOut, action.type, -dc);
  if (dm > 0) add(flows.coinIn, action.type, dm); else if (dm < 0) add(flows.coinOut, action.type, -dm);
  return true;
}

function haveIngredients(state, recipe) {
  const stock = state.inventories[state.regionId];
  return recipe.ingredients.every((need) => (stock.find((item) => item.ingredientId === need.ingredientId)?.amount ?? 0) >= need.amount);
}

function serveGuest(player, now) {
  const { state } = player;
  const guest = state.customers.find((item) => item.id === state.activeCustomerId) ?? state.customers[0];
  if (!guest) return false;
  guest.orderRevealed = true; // skips the English dialogue
  if (guest.orderKind === 'bottle') {
    const request = guest.bottleRequest;
    guest.selectedBottleId = request.productId;
    const stock = state.bottleInventories[state.regionId].find((item) => item.productId === request.productId);
    if ((stock?.quantity ?? 0) < request.quantity) {
      const need = request.quantity - (stock?.quantity ?? 0);
      if (!act(player, { type: 'buyBottleStock', productId: request.productId, quantity: need }, now)) return act(player, { type: 'rejectCustomer', customerId: guest.id }, now);
    }
    return act(player, { type: 'sellBottle' }, now) || act(player, { type: 'rejectCustomer', customerId: guest.id }, now);
  }
  const recipe = requiredRecipe(guest);
  if (!haveIngredients(state, recipe)) {
    const missing = recipe.ingredients.filter((need) => !haveIngredients(state, { ingredients: [need] })).map((need) => need.ingredientId);
    const inFlight = new Set(state.deliveryOrders.flatMap((order) => order.items.map((item) => item.ingredientId)));
    const cart = Object.fromEntries(missing.filter((id) => !inFlight.has(id)).map((id) => [id, 3]));
    if (Object.keys(cart).length) act(player, { type: 'buy', supplierId: 'global', cart }, now);
    return false;
  }
  const product = guest.orderKind === 'serve' && guest.serveRequest ? ALCOHOL_PRODUCTS.find((item) => item.id === guest.serveRequest.productId) : undefined;
  return act(player, { type: 'serve', mix: recipe.ingredients.map((item) => ({ ...item })), shaken: true, pourBrands: product ? { [product.ingredientId]: product.id } : {} }, now);
}

// Crystals are spent on the cheapest thing the player still wants: recipes, then interiors, then new bars.
function spendCrystals(player, now) {
  const { state } = player;
  const recipes = RECIPES.map((recipe, index) => ({ recipe, price: recipePurchase(recipe, index) }))
    .filter(({ recipe, price }) => price.currency === 'crystals' && !state.knownRecipeIds.includes(recipe.id))
    .sort((a, b) => a.price.amount - b.price.amount);
  const interiors = INTERIORS.filter((item) => item.crystalCost > 0 && !state.ownedInteriorIds.includes(item.id)).sort((a, b) => a.crystalCost - b.crystalCost);
  for (let guard = 0; guard < 6; guard++) {
    const options = [
      ...recipes.map(({ recipe, price }) => ({ price: price.amount, action: { type: 'buyRecipe', recipeId: recipe.id } })),
      ...interiors.map((item) => ({ price: item.crystalCost, action: { type: 'buyInterior', interiorId: item.id } }))
    ].filter((option) => option.price <= state.crystals).sort((a, b) => a.price - b.price);
    const next = options.find((option) => act(player, option.action, now));
    if (!next) break;
    if (next.action.type === 'buyRecipe') recipes.splice(recipes.findIndex((r) => r.recipe.id === next.action.recipeId), 1);
    else interiors.splice(interiors.findIndex((i) => i.id === next.action.interiorId), 1);
  }
  if (levelFor(state.xp) >= 25) for (const region of REGIONS) if (!state.ownedBarIds.includes(region.id) && act(player, { type: 'buyBar', regionId: region.id }, now)) break;
  // Coins go into recipe upgrades (+6% price, +10% tips per level), cheapest first, while a coin reserve is kept for supplies.
  for (let guard = 0; guard < 4; guard++) {
    const options = state.knownRecipeIds.map((id) => RECIPES.find((r) => r.id === id)).map((recipe) => ({ recipe, cost: upgradeCost(recipe, recipeLevel(state, recipe.id)) }))
      .filter((o) => o.cost !== undefined && o.cost + 300 <= state.money).sort((a, b) => a.cost - b.cost);
    if (!options.some((o) => act(player, { type: 'upgradeRecipe', recipeId: o.recipe.id }, now))) break;
  }
  // Paying players who run short of coins turn spare crystals into coins.
  if (player.payer !== 'free' && state.money < 400) for (const bundle of [...CRYSTAL_EXCHANGE_BUNDLES].reverse()) if (state.crystals >= bundle.crystals + 120 && act(player, { type: 'exchangeCrystals', crystals: bundle.crystals }, now)) break;
}

const players = [];
for (let index = 0; index < PLAYERS; index++) {
  const payer = pick(Object.entries(PAYERS).map(([key, value]) => [key, value.share]));
  const engagement = pick([['casual', .5], ['regular', .35], ['hardcore', .15]]);
  const state = normalizePlayerState(createInitialState(START));
  act({ state }, { type: 'chooseStartingBar', regionId: 'new-york' }, START);
  players.push({ id: index, payer, engagement, state, stars: 0, purchases: 0, nextBuy: payer === 'free' ? Infinity : Math.floor(random() * 3), bought: new Set() });
}

const weekly = [];
let starsTotal = 0;
const starsByPack = {};
for (let day = 0; day < DAYS; day++) {
  for (const player of players) {
    const profile = ENGAGEMENT[player.engagement];
    if (random() > profile.playDay) continue;
    const dayStart = START + day * DAY;
    let now = dayStart + Math.floor((8 + random() * 14) * 3_600_000);
    const { state } = player;

    // Real money: buy a pack (the starter only once), credited exactly like the server does.
    if (day >= player.nextBuy) {
      const pool = PAYERS[player.payer].buys.filter((id) => !(STAR_CRYSTAL_PACKS.find((pack) => pack.id === id)?.once && player.bought.has(id)));
      const pack = STAR_CRYSTAL_PACKS.find((item) => item.id === pool[Math.floor(random() * pool.length)]);
      if (pack) {
        state.crystals += pack.crystals; player.stars += pack.stars; player.purchases++; player.bought.add(pack.id);
        starsTotal += pack.stars; starsByPack[pack.id] = (starsByPack[pack.id] ?? 0) + 1;
        add(flows.crystalIn, 'STARS', pack.crystals);
      }
      player.nextBuy = day + 1 + Math.floor(random() * PAYERS[player.payer].every * 2);
    }

    act(player, { type: 'claimDaily' }, now);
    for (const lesson of dailyLessonsFor(calendarDate(new Date(now)))) act(player, { type: 'completeDailyLesson', lessonId: lesson.id, answer: lesson.answer }, now);
    if (levelFor(state.xp) >= 5 && !state.autoSupply) act(player, { type: 'setAutoSupply', enabled: true }, now);

    for (let minute = 0; minute < profile.minutes; minute += 2) {
      now += 120_000;
      act(player, { type: 'tick' }, now);
      if (state.customers.length) serveGuest(player, now);
      spendCrystals(player, now);
    }
    act(player, { type: 'rejectCustomer', customerId: state.customers[0]?.id ?? '' }, now); // leaves the bar
  }
  if ((day + 1) % 10 === 0 || day === DAYS - 1) weekly.push(snapshot(day + 1));
}

function snapshot(day) {
  const groups = {};
  for (const player of players) {
    const g = groups[player.payer] ??= { n: 0, level: 0, money: 0, crystals: 0, recipes: 0, interiors: 0, bars: 0 };
    g.n++; g.level += levelFor(player.state.xp); g.money += player.state.money; g.crystals += player.state.crystals;
    g.recipes += player.state.knownRecipeIds.length; g.interiors += player.state.ownedInteriorIds.length; g.bars += player.state.ownedBarIds.length;
  }
  return { day, groups };
}

const fmt = (n, d = 0) => Number(n).toLocaleString('en-US', { maximumFractionDigits: d });
const sumOf = (table) => Object.values(table).reduce((a, b) => a + b, 0);
console.log(`\n=== ${PLAYERS} players, ${DAYS} days, ${(PAYER_SHARE * 100).toFixed(0)}% payers, seed ${SEED} ===`);
for (const { day, groups } of weekly) {
  if (day % 30 !== 0 && day !== DAYS) continue;
  console.log(`\nDay ${day}`);
  console.log('group   n    level   coins     crystals  recipes  interiors  bars');
  for (const key of Object.keys(PAYERS)) {
    const g = groups[key]; if (!g) continue;
    console.log(`${key.padEnd(7)} ${String(g.n).padEnd(4)} ${fmt(g.level / g.n, 1).padEnd(7)} ${fmt(g.money / g.n).padEnd(9)} ${fmt(g.crystals / g.n).padEnd(9)} ${fmt(g.recipes / g.n, 1).padEnd(8)} ${fmt(g.interiors / g.n, 1).padEnd(10)} ${fmt(g.bars / g.n, 1)}`);
  }
}
const free = players.filter((p) => p.payer === 'free');
const crystalsEarnedFree = free.reduce((a, p) => a + (p.state.crystals), 0);
console.log('\nCrystal faucets (all players, total over the run):');
for (const [key, value] of Object.entries(flows.crystalIn).sort((a, b) => b[1] - a[1])) console.log(`  + ${key.padEnd(18)} ${fmt(value)}  (${fmt(value / PLAYERS / DAYS, 1)} per player-day)`);
console.log('Crystal sinks:');
for (const [key, value] of Object.entries(flows.crystalOut).sort((a, b) => b[1] - a[1])) console.log(`  - ${key.padEnd(18)} ${fmt(value)}`);
console.log('Coin faucets / sinks (top):');
for (const [key, value] of Object.entries(flows.coinIn).sort((a, b) => b[1] - a[1]).slice(0, 4)) console.log(`  + ${key.padEnd(18)} ${fmt(value)}`);
for (const [key, value] of Object.entries(flows.coinOut).sort((a, b) => b[1] - a[1]).slice(0, 4)) console.log(`  - ${key.padEnd(18)} ${fmt(value)}`);
const payers = players.filter((p) => p.payer !== 'free');
console.log(`\nStars: ${fmt(starsTotal)} total from ${payers.filter((p) => p.purchases).length} paying players (${fmt(starsTotal / Math.max(1, payers.length))} per payer, ${fmt(starsTotal / PLAYERS, 1)} per player). Purchases by pack:`, starsByPack);
console.log(`Approx. revenue at ~$0.013 per Star: $${fmt(starsTotal * 0.013)}  (${(starsTotal * 0.013 / PLAYERS).toFixed(2)} per player over ${DAYS} days)`);
const last = weekly.at(-1).groups;
const f = last.free, c = crystalsEarnedFree;
console.log(`Free player at day ${DAYS}: level ${fmt(f.level / f.n, 1)}, ${fmt(f.recipes / f.n, 1)} recipes, ${fmt(f.interiors / f.n, 1)} interiors, unspent crystals ${fmt(c / f.n)}.`);
