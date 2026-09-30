// Monte Carlo of the loot economy using the real rules: node --import ./tests/register.mjs scripts/sim-loot.mjs
import { RECIPES } from '../src/domain/catalog.ts';
import { xpForLevel, levelFor } from '../src/domain/progression.ts';
import { applyAction } from '../src/sim/rules.ts';
import { createInitialState } from '../src/sim/state.ts';
import { upgradeCostFor } from '../src/domain/loot.ts';

let seed = 12345;
const random = () => (seed = (seed * 1664525 + 1013904223) >>> 0) / 4294967296;
const T0 = new Date(2026, 8, 30, 12).getTime();
const ctx = (now) => ({ now, random, checkEnglish: (t) => ({ ok: true, corrected: t }) });

function play(serves) {
  const state = createInitialState(T0); state.startingBarChosen = true;
  let now = T0; const milestones = {};
  for (let i = 1; i <= serves; i++) {
    now += 60_000;
    const guest = state.customers[0] ?? null;
    if (!guest) { applyAction(state, { type: 'tick' }, ctx(now + 3600_000)); now += 3600_000; continue; }
    guest.modifierId = undefined; guest.orderKind = 'cocktail'; guest.orderRevealed = true;
    const recipe = RECIPES.find((r) => r.id === guest.orderRecipeId) ?? RECIPES[0];
    guest.orderRecipeId = recipe.id;
    for (const s of state.inventories[state.regionId]) s.amount = 5000;
    try { applyAction(state, { type: 'serve', mix: recipe.ingredients.map((x) => ({ ...x })), shaken: true, pourBrands: {} }, ctx(now)); } catch {}
    if (!state.customers.length) applyAction(state, { type: 'tick' }, ctx(now += 3 * 3600_000));
    for (const lv of [5, 10, 25, 50]) if (!milestones[lv] && levelFor(state.xp) >= lv) milestones[lv] = { serve: i, money: Math.round(state.money), parts: state.loot.parts, boxes: { ...state.loot.boxes }, shards: state.loot.skinShards, runEarned: state.loot.runEarned, crystals: state.crystals };
  }
  return { state, milestones };
}
const { state, milestones } = play(400);
console.log(JSON.stringify(milestones, null, 1));
let coins = 0, parts = 0; for (let l = 0; l < 10; l++) { coins += upgradeCostFor(l).coins; parts += upgradeCostFor(l).parts; }
console.log('one item to level 10:', { coins, parts }, 'level5:', [0,1,2,3,4].reduce((a,l)=>({c:a.c+upgradeCostFor(l).coins,p:a.p+upgradeCostFor(l).parts}),{c:0,p:0}));
console.log('final level', levelFor(state.xp), 'xp', state.xp, 'money', Math.round(state.money), 'runEarned', state.loot.runEarned, 'parts', state.loot.parts);

// Value of opening every box earned in a run, averaged over many rolls.
import { rollBox } from '../src/domain/loot.ts';
const totals = { coins: 0, crystals: 0, parts: 0, skinShards: 0, itemShards: 0, cards: 0, bottles: 0, consumables: 0 };
const RUNS = 300;
for (let r = 0; r < RUNS; r++) for (const [kind, n] of Object.entries(state.loot.boxes)) for (let i = 0; i < n; i++) {
  if (kind === 'choice') continue;
  const x = rollBox(kind, 50, random);
  if (x.kind === 'coins') totals.coins += x.amount; else if (x.kind === 'crystals') totals.crystals += x.amount; else if (x.kind === 'parts') totals.parts += x.amount;
  else if (x.kind === 'skinShards') totals.skinShards += x.amount; else if (x.kind === 'itemShards') totals.itemShards += x.amount;
  else if (x.kind === 'recipeCard') totals.cards++; else if (x.kind === 'mysteryBottle') totals.bottles++; else totals.consumables++;
}
console.log('boxes held', state.loot.boxes);
for (const k of Object.keys(totals)) totals[k] = Math.round(totals[k] / RUNS * 10) / 10;
console.log('avg value of all boxes in a level-50 run (level-50 scaling):', totals);
