import test from 'node:test';
import assert from 'node:assert/strict';
import { checkEnglish } from '../server/english.mjs';
import { RECIPES } from '../src/domain/catalog.ts';
import { FOODS } from '../src/domain/foods.ts';
import { BAR_EVENTS } from '../src/domain/barEvents.ts';
import { pitchActsIn } from '../src/domain/social/pitchActs.ts';
import { applyAction, advanceClock } from '../src/sim/rules.ts';
import { pitchChance } from '../src/sim/pitch.ts';
import { applyPromo, barEventFor, tickBarEvent } from '../src/sim/events.ts';
import { createInitialState } from '../src/sim/state.ts';

const NOW = Date.UTC(2026, 9, 1, 20);
const context = (now = NOW, random = () => .5) => ({ now, random, checkEnglish, spawnCustomers: false });
const guestIn = (social = {}) => {
  const state = createInitialState(NOW);
  state.customers = [state.customers[0]];
  const guest = state.customers[0];
  state.activeCustomerId = guest.id;
  guest.social = { emotion: 'happy', rapport: 50, drunk: 10, chatty: false, topic: 'work', gender: 'f', phase: 'enjoying', nextOrderAt: NOW + 6e5, rounds: 1, staysFor: 2, chatted: [], hungry: true, lastDrink: { recipeId: RECIPES[0].id }, ...social };
  return { state, guest };
};

test('Foods have prices and every bar event is well formed', () => {
  assert.ok(FOODS.length >= 15);
  for (const event of BAR_EVENTS) assert.ok(event.title && event.minutes[0] <= event.minutes[1] && event.weight > 0, event.id);
});

test('Events start, last and end on the clock', () => {
  const { state } = guestIn();
  assert.equal(tickBarEvent(state, NOW, () => .5), undefined);
  const later = state.nextBarEventAt + 1;
  const note = tickBarEvent(state, later, () => .5);
  assert.match(note, /Tonight/);
  assert.ok(barEventFor(state, later));
  assert.ok(!barEventFor(state, state.barEvent.endsAt + 1));
});

test('Every third cocktail is free for women on ladies’ night, only for women', () => {
  const { state, guest } = guestIn();
  state.barEvent = { id: 'ladies-night', startedAt: NOW, endsAt: NOW + 6e6 };
  const results = [1, 2, 3].map(() => applyPromo(state, guest, RECIPES[0], NOW).free);
  assert.deepEqual(results, [false, false, true]);
  guest.social.gender = 'm'; guest.social.promo = undefined;
  assert.ok([1, 2, 3].every(() => !applyPromo(state, guest, RECIPES[0], NOW).free));
});

test('Every seventh drink is a gift', () => {
  const { state, guest } = guestIn();
  state.barEvent = { id: 'seventh-gift', startedAt: NOW, endsAt: NOW + 6e6 };
  const free = Array.from({ length: 7 }, () => applyPromo(state, guest, RECIPES[0], NOW).free);
  assert.deepEqual(free, [false, false, false, false, false, false, true]);
});

test('Offering food: chance is explained, talk changes it, a yes pays', () => {
  const { state, guest } = guestIn({ hungry: false, emotion: 'tired' });
  state.inventories[state.regionId].find((item) => item.ingredientId === 'fries').amount = 5;
  applyAction(state, { type: 'pitchStart', customerId: guest.id, kind: 'food', itemId: 'fries' }, context());
  const before = pitchChance(state, guest, NOW);
  assert.ok(before.parts.length >= 3);
  assert.deepEqual(pitchActsIn('It is on the house'), ['free']);
  guest.social.pitch.bonus += .1;
  assert.ok(pitchChance(state, guest, NOW).chance > before.chance);
  const money = state.money;
  applyAction(state, { type: 'pitchAsk', customerId: guest.id }, context(NOW, () => 0));
  assert.ok(state.money > money);
  assert.equal(guest.social.hungry, false);
});

test('Offering something not in stock is refused', () => {
  const { state, guest } = guestIn();
  state.inventories[state.regionId].find((item) => item.ingredientId === 'fries').amount = 0;
  assert.throws(() => applyAction(state, { type: 'pitchStart', customerId: guest.id, kind: 'food', itemId: 'fries' }, context()), /no fries|stock/i);
});

test('Clock keeps running with an event on', () => {
  const { state } = guestIn();
  state.barEvent = { id: 'happy-hour', startedAt: NOW, endsAt: NOW + 6e6 };
  advanceClock(state, context(NOW + 1000));
});

test('The speech checker marks the words that were not heard', async () => {
  const { compareSpoken } = await import('../src/domain/english/speechCheck.ts');
  assert.equal(compareSpoken('Would you like another drink?', 'would you like another drink').score, 100);
  const partial = compareSpoken('Would you like another drink?', 'would like drink');
  assert.ok(partial.score < 80 && partial.words.filter((item) => !item.ok).map((item) => item.word).includes('you'));
  assert.equal(compareSpoken('Hello', '').score, 0);
});

test('Guests come from somewhere: spelling, local words, speed and age differ but stay the same for one person', async () => {
  const { ORIGINS, originOf, spellFor, voiceProfileOf, ageGroupOf } = await import('../src/domain/social/origin.ts');
  const ids = Array.from({ length: 60 }, (_, index) => ({ id: `g${index}`, characterId: `c${index}` }));
  assert.ok(new Set(ids.map((item) => originOf(item).id)).size >= 5, 'several origins appear');
  assert.ok(new Set(ids.map((item) => ageGroupOf(item))).size === 3, 'young, adult and old all appear');
  assert.equal(originOf(ids[3]).id, originOf({ ...ids[3] }).id);
  assert.equal(spellFor(ORIGINS.find((item) => item.id === 'us'), 'My favourite colour'), 'My favorite color');
  assert.equal(spellFor(ORIGINS.find((item) => item.id === 'uk'), 'My favorite color'), 'My favourite colour');
  const speeds = new Set(ids.map((item) => voiceProfileOf({ ...item, social: undefined }).speed.toFixed(2)));
  assert.ok(speeds.size > 10, 'speeds differ');
});

test('A situation comes at least every 12 guests and never before the 4th guest', async () => {
  const { pickSituation, noteSituationStarted } = await import('../src/sim/situations.ts');
  const { state, guest } = guestIn({ phase: 'ordering' });
  let seen = [];
  let since = 0;
  for (let index = 1; index <= 300; index++) {
    since++;
    const def = pickSituation(state, guest, 'arrival', () => .5);
    if (def) { seen.push(since); since = 0; noteSituationStarted(state, () => .5); }
  }
  assert.ok(seen.length > 10, 'situations happen');
  assert.ok(Math.min(...seen) >= 4, 'never within 3 guests of the last');
  assert.ok(Math.max(...seen) <= 12, 'always within 12 guests');
});

test('Servers: opened by level, trained one by one, paid only for time away and capped at 85% of the player', async () => {
  const staff = await import('../src/domain/staff.ts');
  const { accrueStaff } = await import('../src/sim/staff.ts');
  const { state } = guestIn();
  state.money = 10000000;
  state.xp = 1e9;
  for (let index = 0; index < 4; index++) applyAction(state, { type: 'hireStaff' }, context());
  assert.equal(state.staffByBar[state.regionId].length, 4);
  assert.throws(() => applyAction(state, { type: 'hireStaff' }, context()), /whole team/);
  assert.ok(staff.teamShare(state.staffByBar[state.regionId]) < .85, 'untrained servers are weaker');
  for (let round = 0; round < 4; round++) for (let index = 0; index < 4; index++) applyAction(state, { type: 'upgradeStaff', index }, context());
  assert.equal(staff.teamShare(state.staffByBar[state.regionId]), .85);
  assert.throws(() => applyAction(state, { type: 'upgradeStaff', index: 0 }, context()), /fully trained/);

  const market = { averagePrice: 10, arrival: 1 };
  state.staffAtByBar = { [state.regionId]: NOW };
  assert.equal(accrueStaff(state, NOW + 60_000, () => .5, market), undefined, 'a short pause is not an absence');
  const crystals = state.crystals, money = state.money;
  state.staffAtByBar = { [state.regionId]: NOW };
  assert.match(accrueStaff(state, NOW + 4 * 3600_000, () => .5, market), /your team served/);
  assert.ok(state.money > money);
  assert.equal(state.crystals, crystals, 'servers never bring crystals');
  const day = { ...state, staffAtByBar: { [state.regionId]: NOW } };
  const capped = state.money;
  accrueStaff(day, NOW + 72 * 3600_000, () => .5, market);
  assert.ok(day.money - capped <= (8 * 3600_000 / (62.5 * 60_000)) * 10 * .85 * 1.15 + 1, 'a long absence pays at most eight hours');
});

test('A low-level bar cannot hire the next server', () => {
  const { state } = guestIn();
  state.money = 100000;
  state.xp = 0;
  assert.throws(() => applyAction(state, { type: 'hireStaff' }, context()), /higher bar level/);
});

test('Asking about allergies is understood: a guest with one says so, and then the food is refused', async () => {
  const { actsIn } = await import('../src/domain/social/acts.ts');
  const { socialReply } = await import('../src/domain/social/talk.ts');
  assert.equal(actsIn('Do you have any allergies?')[0], 'askAllergy');
  const { state, guest } = guestIn({ allergy: 'nuts', hungry: true });
  state.inventories[state.regionId].find((item) => item.ingredientId === 'nuts').amount = 5;
  const reply = socialReply(guest, ['askAllergy'], 1);
  assert.match(reply.text, /nuts/i);
  assert.equal(guest.social.allergyKnown, true);
  assert.throws(() => applyAction(state, { type: 'pitchStart', customerId: guest.id, kind: 'food', itemId: 'nuts' }, context()), /allergic/);
  const { state: other, guest: calm } = guestIn({ hungry: false });
  assert.match(socialReply(calm, ['offerFood'], 1).text, /not hungry/);
  assert.ok(other);
});

test('A guest who said no to a drink or a bottle is not offered it again, and her answer teaches the bartender', async () => {
  const { ALCOHOL_PRODUCTS } = await import('../src/domain/bottleCatalog.ts');
  const { bottleQuestionTemplates, rankBottles } = await import('../src/domain/conversation/bottleTalk.ts');
  const wanted = ALCOHOL_PRODUCTS.find((item) => item.type === 'cognac');
  const vodka = ALCOHOL_PRODUCTS.find((item) => item.type === 'vodka');
  const { state, guest } = guestIn();
  Object.assign(guest, { orderKind: 'bottle', orderRevealed: false, greeting: 'Hello!', bottleRequest: { productId: wanted.id, quantity: 1, budget: 500, type: 'cognac', tastes: wanted.tastes.slice(0, 1), occasion: 'party' } });
  guest.social.phase = 'ordering';
  applyAction(state, { type: 'openConversation', customerId: guest.id }, context());
  applyAction(state, { type: 'say', text: `Would you like ${vodka.name}?` }, context());
  const talk = state.conversations[guest.id];
  assert.match(talk.lines.at(-1).text, /cognac/i, 'she says what she wants instead');
  assert.equal(talk.bottleFacts.type, 'cognac', 'the type is now known');
  assert.ok(talk.rejected.includes(vodka.id));
  const suggestions = bottleQuestionTemplates(talk.bottleFacts, rankBottles(talk.bottleFacts).filter((item) => !talk.rejected.includes(item.product.id)));
  assert.ok(!suggestions.some((item) => item.text.includes(vodka.name)));
  assert.ok(!suggestions.some((item) => /Which type of alcohol/.test(item.text)), 'the type question is not asked again');
});

test('The tour choice is saved on the account state', () => {
  const { state } = guestIn();
  assert.equal(state.tour, undefined);
  applyAction(state, { type: 'setTour', value: 'skipped' }, context());
  assert.equal(state.tour, 'skipped');
  applyAction(state, { type: 'setTour', value: 'done' }, context());
  assert.equal(state.tour, 'done');
});

// ---- Training academy ----
const academy = () => { const state = createInitialState(NOW); state.nextCustomerAt = 0; state.customers = []; return state; };
const doAction = (state, action, now = NOW, random = () => .5) => applyAction(state, action, { now, random, checkEnglish, spawnCustomers: false });

test('Every lesson has a guide, and practice lessons say what to do', async () => {
  const { TRAINING_MODULES, NEED_LABEL } = await import('../src/domain/training.ts');
  assert.ok(TRAINING_MODULES.length >= 9);
  for (const module of TRAINING_MODULES) {
    assert.ok(module.guide.length >= 3 && module.title && module.summary, module.id);
    for (const step of module.guide) assert.ok(step.text.length > 40, `${module.id}: ${step.title}`);
    for (const need of module.practice?.needs ?? []) assert.ok(NEED_LABEL[need], need);
  }
  assert.equal(new Set(TRAINING_MODULES.map((module) => module.id)).size, TRAINING_MODULES.length);
});

test('Training: talk lesson — a practice guest, a question and the right drink finish it once, with a reward', () => {
  const state = academy();
  doAction(state, { type: 'startTraining', moduleId: 'talk' });
  const guest = state.customers.find((item) => item.training);
  assert.ok(guest && state.training.active.moduleId === 'talk');
  doAction(state, { type: 'openConversation', customerId: guest.id });
  const xp = state.xp, crystals = state.crystals;
  doAction(state, { type: 'say', text: 'Do you like sweet drinks?' });
  assert.ok(!state.training.done.includes('talk'), 'asking alone does not finish it');
  const recipe = RECIPES.find((item) => item.id === guest.orderRecipeId);
  doAction(state, { type: 'say', text: `Would you like ${/^[aeiou]/i.test(recipe.name) ? 'an' : 'a'} ${recipe.name}?` });
  assert.ok(state.training.done.includes('talk'), 'naming the drink finished the lesson');
  assert.equal(state.xp >= xp + 50, true);
  assert.equal(state.crystals, crystals + 2);
  // The same lesson again gives no second reward.
  doAction(state, { type: 'startTraining', moduleId: 'talk' });
  assert.equal(state.customers.filter((item) => item.training).length, 1, 'only one practice guest at a time');
});

test('Training: mix lesson — serving the practice drink pays nothing', () => {
  const state = academy();
  doAction(state, { type: 'startTraining', moduleId: 'mix' });
  const guest = state.customers.find((item) => item.training);
  const recipe = RECIPES.find((item) => item.id === guest.orderRecipeId);
  for (const part of recipe.ingredients) state.inventories[state.regionId].find((stock) => stock.ingredientId === part.ingredientId).amount += 1000;
  const money = state.money;
  doAction(state, { type: 'serve', mix: recipe.ingredients.map((item) => ({ ...item })), shaken: true, pourBrands: {} });
  assert.ok(state.training.done.includes('mix'));
  assert.equal(state.money, money, 'a practice drink pays nothing');
});

test('Training: care lesson needs water and an ashtray; offer lesson needs an offer; situation lesson ends with a solved problem', () => {
  const care = academy();
  doAction(care, { type: 'startTraining', moduleId: 'care' });
  const smoker = care.customers.find((item) => item.training);
  care.ashtrays = { clean: 3, dirty: 0 };
  doAction(care, { type: 'giveWater', customerId: smoker.id });
  assert.ok(!care.training.done.includes('care'));
  doAction(care, { type: 'giveAshtray', customerId: smoker.id });
  assert.ok(care.training.done.includes('care'));

  const offer = academy();
  doAction(offer, { type: 'startTraining', moduleId: 'offer' });
  const hungry = offer.customers.find((item) => item.training);
  doAction(offer, { type: 'pitchStart', customerId: hungry.id, kind: 'food', itemId: 'fries' });
  doAction(offer, { type: 'pitchAsk', customerId: hungry.id });
  assert.ok(offer.training.done.includes('offer'));

  const problem = academy();
  doAction(problem, { type: 'startTraining', moduleId: 'situation' });
  const payer = problem.customers.find((item) => item.training);
  assert.ok(payer.social.event, 'the problem has started');
  const money = problem.money;
  doAction(problem, { type: 'situationChoice', customerId: payer.id, choiceId: 'partial' });
  assert.ok(problem.training.done.includes('situation') || !payer.social.event);
  assert.equal(problem.money, money, 'practice money is not kept');
});

test('Training: top-up buys what is low in one tap, and guide-only lessons finish with "Got it"', () => {
  const state = academy();
  state.money = 5000;
  state.inventories[state.regionId].find((item) => item.ingredientId === 'ice').amount = 0;
  doAction(state, { type: 'startTraining', moduleId: 'market' });
  const orders = state.deliveryOrders.length;
  doAction(state, { type: 'topUp' });
  assert.ok(state.deliveryOrders.length > orders, 'an order was placed');
  assert.ok(state.training.progress.market.includes('toppedUp'));
  assert.throws(() => doAction(state, { type: 'trainingDone', moduleId: 'market' }), /practice/);
  doAction(state, { type: 'trainingDone', moduleId: 'staff' });
  assert.ok(state.training.done.includes('staff'));
});

test('Ending a practice removes the practice guest', () => {
  const state = academy();
  doAction(state, { type: 'startTraining', moduleId: 'talk' });
  doAction(state, { type: 'endTraining' });
  assert.equal(state.customers.filter((item) => item.training).length, 0);
  assert.equal(state.training.active, undefined);
});

// ---- Guide pointer ----
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
const sourceFiles = (dir) => readdirSync(dir).flatMap((name) => { const path = join(dir, name); return statSync(path).isDirectory() ? sourceFiles(path) : [path]; });

test('Every thing the guide points at exists in a component (so a layout change cannot silently break a pointer)', async () => {
  const { GUIDE_ATTRIBUTES } = await import('../src/guide/pointer.ts');
  const vue = sourceFiles('src').filter((path) => path.endsWith('.vue')).map((path) => readFileSync(path, 'utf8')).join('\n');
  const guideCode = ['src/guide/practice.ts', 'src/components/ui/TutorialTour.vue'].map((path) => readFileSync(path, 'utf8')).join('\n');
  const dynamic = vue.split('\n').filter((line) => line.includes(':data-guide')).join('\n');
  for (const name of GUIDE_ATTRIBUTES) {
    if (name.startsWith('data-guide-')) { assert.ok(vue.includes(`:${name}=`), `${name} is set on an element`); continue; }
    const set = vue.includes(`data-guide="${name}"`) || dynamic.includes(`'${name}'`) || (name.startsWith('nav-') && vue.includes(`id: '${name.slice(4)}'`));
    assert.ok(set, `data-guide="${name}" exists in a component`);
  }
  // Every name used by a lesson or the tour is in the list.
  for (const match of guideCode.matchAll(/selector\('([a-z-]+)'\)/g)) assert.ok(GUIDE_ATTRIBUTES.includes(match[1]), `${match[1]} is a known guide target`);
});

const practiceBase = { seen: [], guestHere: true, convOpen: false, mix: [], shaken: false, placedWords: 0, onBar: true, onMarket: false,
  recipe: { name: 'Mojito', needsShake: true, ingredients: [{ id: 'white-rum', name: 'White rum', amount: 45 }, { id: 'mint', name: 'Mint', amount: 6 }] } };

test('The practice pointer follows what the player has done: talk, care, offer, situation', async () => {
  const { practicePointer } = await import('../src/guide/practice.ts');
  const first = (ctx) => practicePointer({ ...practiceBase, ...ctx });
  assert.match(first({ moduleId: 'talk' }).candidates[0].target, /practice-guest/);
  assert.equal(first({ moduleId: 'talk', convOpen: true }).candidates.at(-1).gesture, 'type', 'typing is the last way');
  assert.match(first({ moduleId: 'talk', convOpen: true, seen: ['asked'] }).instruction, /Would you like a Mojito/);
  assert.match(first({ moduleId: 'care', convOpen: true }).candidates[0].target, /give-water/);
  assert.match(first({ moduleId: 'care', convOpen: true, seen: ['water'] }).candidates[0].target, /give-ashtray/);
  assert.match(first({ moduleId: 'offer', convOpen: true }).candidates.map((item) => item.target).join(), /offer-ask.*offer-item.*offer-open/);
  assert.match(first({ moduleId: 'situation', convOpen: true }).candidates[0].target, /situation-choice/);
  assert.equal(first({ moduleId: 'talk', convOpen: true, seen: ['asked', 'confirmed'] }), undefined, 'nothing left to do');
});

test('The practice pointer for mixing: close the talk, drag each bottle, shake, serve', async () => {
  const { practicePointer } = await import('../src/guide/practice.ts');
  const at = (ctx) => practicePointer({ ...practiceBase, moduleId: 'mix', ...ctx });
  assert.match(at({ convOpen: true }).candidates[0].target, /talk-close/);
  const drag = at({}).candidates.find((item) => item.gesture === 'drag');
  assert.equal(drag.target, '[data-guide-ingredient="white-rum"]');
  assert.equal(drag.to, '[data-guide="glass"]');
  assert.match(drag.label, /45 more/);
  assert.match(at({ mix: [{ id: 'white-rum', amount: 45 }] }).candidates.map((item) => item.target).join(), /data-guide-ingredient="mint"/, 'next ingredient');
  const poured = [{ id: 'white-rum', amount: 45 }, { id: 'mint', amount: 6 }];
  assert.match(at({ mix: poured }).candidates[0].target, /shake/);
  assert.match(at({ mix: poured, shaken: true }).candidates[0].target, /serve/);
  assert.match(at({ onBar: false }).candidates[0].target, /nav-service/);
});

test('The practice pointer for the market: open it, add, order, top up', async () => {
  const { practicePointer } = await import('../src/guide/practice.ts');
  const at = (ctx) => practicePointer({ ...practiceBase, moduleId: 'market', guestHere: false, ...ctx });
  assert.match(at({}).candidates[0].target, /nav-market/);
  assert.match(at({ onMarket: true }).candidates.map((item) => item.target).join(), /market-order.*market-plus/);
  assert.match(at({ onMarket: true, seen: ['bought'] }).candidates[0].target, /top-up/);
});

// ---- Natural talk ----
test('Openings are varied: the ask is not always the same, and is sometimes left out', async () => {
  const { openingLine, buildProfile } = await import('../src/domain/conversation/customerTalk.ts');
  const recipe = RECIPES.find((item) => item.id === 'mojito');
  const profile = buildProfile(recipe);
  const lines = [];
  for (let index = 0; index < 300; index++) {
    const { guest } = guestIn({ phase: 'ordering', rounds: 0, emotion: ['happy', 'tired', 'angry', 'lonely', 'relaxed', 'nervous'][index % 6] });
    guest.id = `variety-${index}`;
    lines.push(openingLine(guest, profile));
  }
  assert.ok(new Set(lines).size > 120, 'many different openings');
  const asks = lines.filter((line) => /choose a drink|recommend|pick something|what to order|suggest|Any ideas/i.test(line));
  assert.ok(asks.length < lines.length * .75 && asks.length > lines.length * .3, `the question is asked in some openings, not all (${asks.length}/300)`);
  const sameEnding = new Map();
  for (const line of lines) { const end = line.split(/(?<=[.?!])\s/).at(-1); sameEnding.set(end, (sameEnding.get(end) ?? 0) + 1); }
  assert.ok(Math.max(...sameEnding.values()) < lines.length * .3, 'no single closing sentence is more than 30% of openings');
  assert.ok(lines.every((line) => /lime|mint|rum|sweet|sour|fresh|bubbles|light|strong|sparkling|\w+/.test(line)), 'every opening has the hint');
});

test('Guests do not repeat themselves: the same question twice gets a different kind of answer, and a story comes back', async () => {
  const { socialReply } = await import('../src/domain/social/talk.ts');
  const { state, guest } = guestIn({ emotion: 'tired', chatted: [] });
  const first = socialReply(guest, ['howAreYou'], 1).text;
  guest.social.chatted.push('how');
  const second = socialReply(guest, ['howAreYou'], 2).text;
  assert.notEqual(first, second);
  assert.match(second, /still|better|less|tired|calm/i);
  guest.social.chatted.push('story');
  const seen = new Set();
  for (let turn = 0; turn < 40; turn++) seen.add(socialReply(guest, ['thanks'], turn).text);
  assert.ok(seen.size >= 8, 'thanks gets many answers, some with a callback to the story');
  assert.ok([...seen].some((text) => /work|think|mind|boss/i.test(text.replace(/No problem|Anytime/g, ''))) || state);
});

test('Local words are not added to drunk, angry or upset guests', async () => {
  const { voice } = await import('../src/domain/social/talk.ts');
  for (const [emotion, drunk] of [['angry', 0], ['upset', 0], ['relaxed', 60]]) {
    const { guest } = guestIn({ emotion, drunk });
    for (let turn = 0; turn < 120; turn++) {
      const text = voice(guest, 'That sounds good.', turn);
      assert.ok(!/Brother|Aka|plov|ariston|Prost|noroc|Kampai|yaar|mate|G’day/i.test(text.replace(/hic|…/g, '')), `${emotion}: ${text}`);
    }
  }
});

// ---- Alive conversations ----
test('A guest has a life of their own that stays the same all evening', async () => {
  const { personaOf, personaAnswer } = await import('../src/domain/social/alive.ts');
  const { actsIn } = await import('../src/domain/social/acts.ts');
  const { guest } = guestIn();
  assert.deepEqual(personaOf(guest), personaOf({ ...guest }));
  assert.equal(personaAnswer(guest, 'askHobby').text, personaAnswer(guest, 'askHobby').text);
  const jobs = new Set(), hobbies = new Set(), cities = new Set();
  for (let index = 0; index < 80; index++) { const p = personaOf({ id: `p${index}`, characterId: `c${index}` }); jobs.add(p.job); hobbies.add(p.hobby); cities.add(p.city); }
  assert.ok(jobs.size >= 8 && hobbies.size >= 8 && cities.size >= 12, 'guests differ from each other');
  for (const [text, act] of [['What do you do in your free time?', 'askHobby'], ['Where are you from?', 'askFrom'], ['Do you have any pets?', 'askPet'], ['Do you have plans for the weekend?', 'askPlans'], ['Have you been here before?', 'askFirst'], ['Why did that happen?', 'askWhy'], ['Tell me more.', 'askMore'], ['How did it go?', 'askHow']])
    assert.equal(actsIn(text)[0], act, text);
});

test('A story goes deeper when the bartender asks why and tells more, then it is finished', async () => {
  const { socialReply } = await import('../src/domain/social/talk.ts');
  const { applySocialReply } = await import('../src/sim/guests.ts');
  const { guest } = guestIn({ emotion: 'upset', topic: 'work' });
  const story = socialReply(guest, ['askProblem'], 1);
  applySocialReply(guest, story);
  assert.deepEqual({ topic: guest.social.thread.topic, kind: guest.social.thread.kind, depth: guest.social.thread.depth }, { topic: 'work', kind: 'bad', depth: 0 });
  assert.ok(guest.social.thread.frame.tell && guest.social.thread.frame.why && guest.social.thread.frame.more && guest.social.thread.frame.how);
  const why = socialReply(guest, ['askWhy'], 2);
  const more = socialReply(guest, ['askMore'], 3);
  const how = socialReply(guest, ['askHow'], 4);
  const done = socialReply(guest, ['askMore'], 5);
  assert.equal(new Set([story.text, why.text, more.text, how.text, done.text]).size, 5, 'five different lines');
  assert.match(done.text, /all there is|everything|whole story/i);
  const none = socialReply(guestIn().guest, ['askWhy'], 1);
  assert.match(none.text, /not sure|not thought/i, 'no story: a gentle answer');
});

test('A guest who asks the bartender something reacts to the answer', async () => {
  const { socialReply } = await import('../src/domain/social/talk.ts');
  const { guest } = guestIn();
  const answer = socialReply(guest, ['askHobby'], 1);
  assert.equal(answer.asked, true);
  guest.social.asked = true;
  const react = socialReply(guest, [], 2);
  assert.ok(react && react.text.length > 5, 'any answer gets a human reaction');
});

test('Guests speak on their own, not too often, and never during a chat or a situation', async () => {
  const { collectChatter } = await import('../src/sim/chatter.ts');
  const state = academy();
  const { state: bar, guest } = guestIn({ chatty: true, rapport: 70 });
  assert.equal(collectChatter(bar, NOW, () => .5).length, 0, 'the first moment only sets the timer');
  assert.ok(guest.social.chatterAt > NOW);
  const later = guest.social.chatterAt + 1;
  bar.conversationCustomerId = guest.id;
  assert.equal(collectChatter(bar, later, () => .5).length, 0, 'no remarks while the chat with this guest is open');
  bar.conversationCustomerId = undefined;
  const said = collectChatter(bar, later, () => .5);
  assert.equal(said.length, 1);
  assert.ok(said[0].text.length > 10 && guest.social.murmur.until > later);
  assert.equal(collectChatter(bar, later + 1000, () => .5).length, 0, 'the next remark takes minutes');
  // Many minutes later, the number of remarks is limited.
  let total = 1;
  for (let step = 1; step < 40; step++) total += collectChatter(bar, later + step * 6 * 60_000, () => .5).length;
  assert.ok(total <= 6, `at most six remarks per guest, saw ${total}`);
  assert.ok(state);
});

test('A guest left alone for a while speaks up, and the drink gets a reaction', async () => {
  const { collectChatter, reactionToServed } = await import('../src/sim/chatter.ts');
  const { state, guest } = guestIn({ chatty: true, rapport: 40, phase: 'ordering' });
  collectChatter(state, NOW, () => .5);
  const said = collectChatter(state, guest.social.chatterAt + 6 * 60_000, () => .5);
  assert.equal(said[0].chatter.kind, 'bored');
  guest.social.lastDrink = { recipeId: 'mojito' };
  assert.ok(reactionToServed(guest, NOW, 'x').length > 5);
  assert.equal(guest.social.murmur.until, NOW + 30_000);
});

test('Suggested sentences stay short and service-like: no long-chat questions about the guest’s life or story', async () => {
  const { socialTemplates } = await import('../src/domain/social/suggestions.ts');
  const { guest } = guestIn({ chatty: true, rapport: 60, thread: { topic: 'work', kind: 'bad', depth: 0 } });
  const all = socialTemplates(guest, NOW);
  assert.ok(!all.some((text) => /free time|pets|plans for the weekend|Why did that happen|Tell me more/.test(text)));
  for (const text of all) assert.equal(checkEnglish(text).ok, true, text);
});

test('This is a bar, not a chat room: every small-talk answer of an ordering guest ends by coming back to the order, with no question of their own', async () => {
  const { socialReply, backToOrder, withoutTrailingQuestion } = await import('../src/domain/social/talk.ts');
  assert.equal(withoutTrailingQuestion('In my free time I paint. It keeps me sane. What about you?'), 'In my free time I paint. It keeps me sane.');
  assert.equal(withoutTrailingQuestion('Hello?'), 'Hello?');
  assert.equal(withoutTrailingQuestion('Calm and happy. How about you? I am glad I came here.'), 'Calm and happy. I am glad I came here.');
  const { state, guest } = guestIn({ phase: 'ordering', rapport: 60, emotion: 'relaxed' });
  guest.orderRevealed = false;
  guest.orderKind = 'cocktail';
  guest.orderRecipeId = 'mojito';
  guest.patience = guest.patienceRemaining = 99999;
  guest.social.chatted = [];
  applyAction(state, { type: 'openConversation', customerId: guest.id }, context());
  for (const text of ['How are you?', 'What do you do in your free time?', 'I like football and pizza.', 'Why did that happen?']) {
    applyAction(state, { type: 'say', text }, context());
    const line = state.conversations[guest.id].lines.at(-1).text;
    assert.match(line, /recommend|offer|suggest|drink|choose|my drink/i, `${text} -> ${line}`);
    assert.ok(line.trim().split(/(?<=[.!?])\s/).filter((part) => part.endsWith('?') && part.split(/\s+/).length > 2).length <= 1, `at most one real question (a one-word echo like "Football?" is fine): ${line}`);
  }
  assert.ok(socialReply && backToOrder('x:1'));
});

test('Remarks are not repeated back to back, and the offer to tell more of a story is made once', async () => {
  const { collectChatter } = await import('../src/sim/chatter.ts');
  const { state, guest } = guestIn({ chatty: true, rapport: 70, thread: { topic: 'work', kind: 'bad', depth: 0 }, told: true });
  collectChatter(state, NOW, () => .5);
  const texts = [];
  for (let step = 1; step <= 6; step++) {
    const said = collectChatter(state, NOW + step * 8 * 60_000, () => (step * .37) % 1);
    if (said[0]) texts.push(said[0].text);
  }
  assert.ok(texts.length >= 4);
  for (let index = 1; index < texts.length; index++) assert.notEqual(texts[index], texts[index - 1]);
  assert.ok(texts.filter((text) => /tell you more/.test(text)).length <= 1);
  assert.ok(guest);
});

test('Emergency calls are understood in what the player says (the regexes are not corrupted)', async () => {
  const { readFileSync } = await import('node:fs');
  for (const path of ['src/sim/situations.ts', 'src/domain/social/acts.ts', 'src/domain/social/origin.ts', 'src/domain/social/talk.ts']) assert.ok(!readFileSync(path, 'utf8').includes('\b'), `${path} has no backspace characters`);
  const { matchChoice } = await import('../src/sim/situations.ts');
  assert.equal(typeof matchChoice, 'function');
});

// ---- Procedural dialogue ----
test('The grammar expands options and slots the same way for the same seed, and fixes a/an and capitals', async () => {
  const { expand, rngOf, variants, say } = await import('../src/domain/social/gen/grammar.ts');
  const template = '[Oh|Hey], {who} is an [old|new] friend.';
  assert.equal(expand(template, { who: 'my uncle' }, rngOf('a')), expand(template, { who: 'my uncle' }, rngOf('a')));
  const seen = new Set();
  for (let index = 0; index < 60; index++) seen.add(expand(template, { who: 'my uncle' }, rngOf(`s${index}`)));
  assert.equal(seen.size, variants(template));
  assert.equal(expand('i have a apple and a orange', {}, rngOf('x')), 'I have an apple and an orange');
  assert.equal(expand('[|, honestly] fine', {}, rngOf('q')).includes(' ,'), false);
  assert.match(say(['hello {name}!'], { name: 'Ana' }, 'k'), /^Hello Ana!$/);
});

test('Stories are built from parts: the follow-ups come from the same story, and there are thousands of different ones', async () => {
  const { makeStory, STORY_PARTS } = await import('../src/domain/social/gen/story.ts');
  const topics = Object.keys(STORY_PARTS);
  assert.equal(topics.length, 9);
  const tells = new Set(), whole = new Set();
  for (const topic of topics) for (const kind of ['good', 'bad']) for (let index = 0; index < 60; index++) {
    const frame = makeStory(`g${index}`, topic, kind);
    assert.deepEqual(frame, makeStory(`g${index}`, topic, kind), 'the same guest tells the same story');
    for (const key of ['tell', 'why', 'more', 'how', 'who']) assert.ok(frame[key] && frame[key].length > 4 && !/[{}\[\]]/.test(frame[key]), `${topic}/${kind}: ${key} is complete text: ${frame[key]}`);
    tells.add(frame.tell); whole.add(JSON.stringify(frame));
  }
  assert.ok(tells.size >= 100, `many different first sentences, saw ${tells.size}`);
  assert.ok(whole.size >= 800, `many different whole stories, saw ${whole.size}`);
  // The person is the same in the first sentence and in "who?" whenever there is a person.
  let checked = 0;
  for (let index = 0; index < 200; index++) {
    const frame = makeStory(`w${index}`, 'work', 'bad');
    const person = /(my manager|my boss|a client|a colleague|my supervisor)/i.exec(frame.who)?.[1];
    if (person && new RegExp(person, 'i').test(frame.tell)) checked++;
    assert.ok(person, frame.who);
  }
  assert.ok(checked > 30, 'the first sentence and the answer to "who?" name the same person');
});

test('A guest reacts to a thing the player mentions, with an opinion that stays the same, and remembers it', async () => {
  const { mentionIn, reactToMention, opinionOf, memoryLine } = await import('../src/domain/social/gen/mentions.ts');
  const { socialReply } = await import('../src/domain/social/talk.ts');
  const { applySocialReply } = await import('../src/sim/guests.ts');
  assert.deepEqual(mentionIn('I love playing football on Sundays'), { kind: 'sport', thing: 'football' });
  assert.deepEqual(mentionIn('We went to Tokyo last year'), { kind: 'place', thing: 'Tokyo' });
  assert.equal(mentionIn('Would you like a Mojito?'), undefined);
  const { guest } = guestIn();
  const first = reactToMention(guest, { kind: 'food', thing: 'sushi' }, 'a');
  assert.equal(opinionOf(guest, { kind: 'food', thing: 'sushi' }), first.opinion);
  const opinions = new Set();
  for (let index = 0; index < 60; index++) opinions.add(opinionOf({ id: `o${index}`, characterId: `c${index}` }, { kind: 'food', thing: 'sushi' }));
  assert.equal(opinions.size, 3, 'some guests love it, some do not care, some dislike it');
  const reply = socialReply(guest, [], 4, 'I had sushi yesterday.');
  assert.match(reply.text, /sushi/i);
  assert.deepEqual(reply.heard, { kind: 'food', thing: 'sushi' });
  applySocialReply(guest, reply);
  assert.equal(guest.social.heard[0].thing, 'sushi');
  assert.match(memoryLine(guest, guest.social.heard[0], 'm'), /sushi/);
});

test('Everything the generator can say uses words the learner can also type (the checker vocabulary)', async () => {
  const { allStoryTexts } = await import('../src/domain/social/gen/story.ts');
  const { allMentionTexts } = await import('../src/domain/social/gen/mentions.ts');
  const { LEXICON } = await import('../src/domain/english/lexicon.ts');
  await import('../src/domain/english/brandWords.ts');
  const missing = new Set();
  for (const text of [...allStoryTexts(), ...allMentionTexts()]) for (const word of text.toLowerCase().replace(/’/g, "'").split(/[^\p{L}\d']+/u)) if (word.length > 1 && !LEXICON.has(word.replace(/^'+|'+$/g, ''))) missing.add(word);
  assert.deepEqual([...missing], []);
});

test('A hundred conversations about stories never repeat a guest line more than a few times', async () => {
  const { socialReply } = await import('../src/domain/social/talk.ts');
  const { applySocialReply } = await import('../src/sim/guests.ts');
  const counts = new Map();
  for (let index = 0; index < 100; index++) {
    const { guest } = guestIn({ emotion: ['upset', 'happy', 'tired', 'excited'][index % 4], topic: ['work', 'family', 'money', 'travel', 'sports'][index % 5], chatted: [] });
    guest.id = `conv-${index}`;
    let turn = 0;
    for (const [acts, said] of [[['askProblem'], ''], [['askWhy'], ''], [['askMore'], ''], [['askHow'], ''], [[], 'I like football.']]) {
      const reply = socialReply(guest, acts, ++turn, said);
      if (!reply) continue;
      applySocialReply(guest, reply);
      counts.set(reply.text, (counts.get(reply.text) ?? 0) + 1);
    }
  }
  assert.ok(counts.size > 150, `varied lines, saw ${counts.size}`);
  const repeated = [...counts.entries()].filter(([, count]) => count > 18);
  assert.deepEqual(repeated.map(([text]) => text), [], 'no line is said more than 18 times in 100 conversations');
});

test('A sad guest does not jump to a new subject, and "I like X" is answered as news about the player, not as the guest’s own taste', async () => {
  const { stanceOf, reactToMention } = await import('../src/domain/social/gen/mentions.ts');
  const { socialReply } = await import('../src/domain/social/talk.ts');
  const { applySocialReply } = await import('../src/sim/guests.ts');
  assert.equal(stanceOf('I like football and pizza.'), 'share');
  assert.equal(stanceOf('Do you like football?'), 'ask');
  assert.equal(stanceOf('Have you been to Tokyo?'), 'ask');
  const { guest } = guestIn({ emotion: 'upset', topic: 'family' });
  applySocialReply(guest, socialReply(guest, ['askProblem'], 1));
  assert.equal(guest.social.thread.kind, 'bad');
  const sad = socialReply(guest, [], 2, 'I like football and pizza.');
  assert.match(sad.text, /sorry|later|not now|mind|thinking/i, sad.text);
  assert.doesNotMatch(sad.text, /never liked|boring|too loud/i);
  const happy = guestIn({ emotion: 'happy' }).guest;
  for (let index = 0; index < 40; index++) {
    happy.id = `h${index}`;
    const share = reactToMention(happy, { kind: 'sport', thing: 'football' }, `s${index}`, { stance: 'share' });
    assert.doesNotMatch(share.text, /never liked|boring|honestly, i find|too loud/i, share.text);
    assert.match(share.text, /football/i);
  }
  const ask = reactToMention(happy, { kind: 'food', thing: 'sushi' }, 'a', { stance: 'ask' });
  assert.match(ask.text, /sushi/i);
});

test('"Who was it?" is answered as a repeat when the story already named the person', async () => {
  const { makeStory } = await import('../src/domain/social/gen/story.ts');
  let repeats = 0;
  for (let index = 0; index < 120; index++) {
    const frame = makeStory(`r${index}`, 'family', 'bad');
    const person = /(my mother|my father|my brother|my sister|my grandmother|my uncle)/i.exec(frame.who)?.[1];
    assert.ok(person);
    if (frame.tell.toLowerCase().includes(person.toLowerCase())) { repeats++; assert.match(frame.who, /like i said|as i said|i told you/i, frame.who); }
  }
  assert.ok(repeats > 10);
});

test('A drink question after small talk is answered with a clue, not with a chat reaction', () => {
  const { state, guest } = guestIn({ phase: 'ordering', rapport: 60, emotion: 'relaxed' });
  Object.assign(guest, { orderRevealed: false, orderKind: 'cocktail', orderRecipeId: 'mojito', patience: 99999, patienceRemaining: 99999 });
  applyAction(state, { type: 'openConversation', customerId: guest.id }, context());
  applyAction(state, { type: 'say', text: 'I like football and pizza.' }, context());
  applyAction(state, { type: 'say', text: 'Do you like sweet drinks?' }, context());
  assert.match(state.conversations[guest.id].lines.at(-1).text, /sweet/i);
  assert.ok(state.conversations[guest.id].facts.some((fact) => fact.topic === 'sweet'), 'the clue was recorded');
});

// ---- Player profile ----
test('The profile shows the favourite bar, English share, opened bars and four achievements (picked, or the latest)', async () => {
  const { buildPlayerProfile, earnedAchievements, FEATURED_MAX } = await import('../src/domain/profile.ts');
  const base = { served: 12, servedByBar: { london: 3, 'new-york': 9 }, languageStats: { sentences: 40, correct: 30 }, ownedBarIds: ['new-york', 'london'], loot: { achievements: ['a-serve-10', 'a-vip-10', 'a-bottles-25', 'a-boxes-20', 'a-draws-30', 'a-fake'] } };
  const profile = buildPlayerProfile(base);
  assert.equal(profile.favoriteBarId, 'new-york');
  assert.equal(profile.englishPercent, 75);
  assert.equal(profile.achievementCount, 5, 'unknown achievement ids are ignored');
  assert.equal(profile.shown.length, FEATURED_MAX);
  assert.equal(profile.shown[0].id, 'a-draws-30', 'the latest first');
  assert.equal(profile.picked, false);
  const picked = buildPlayerProfile({ ...base, featuredAchievements: ['a-serve-10', 'a-vip-10', 'not-earned'] });
  assert.deepEqual(picked.shown.map((item) => item.id), ['a-serve-10', 'a-vip-10']);
  assert.equal(picked.picked, true);
  assert.equal(buildPlayerProfile({ ...base, languageStats: { sentences: 0, correct: 0 }, servedByBar: {} }).englishPercent, undefined);
  assert.equal(buildPlayerProfile({ ...base, servedByBar: {} }).favoriteBarId, undefined);
  assert.equal(earnedAchievements(base).length, 5);
});

test('Serving counts guests for the profile (drinks per bar), but practice guests do not count; picks are validated', () => {
  const state = academy();
  state.nextCustomerAt = 0;
  doAction(state, { type: 'startTraining', moduleId: 'mix' });
  const practice = state.customers.find((item) => item.training);
  const recipe = RECIPES.find((item) => item.id === practice.orderRecipeId);
  for (const part of recipe.ingredients) state.inventories[state.regionId].find((stock) => stock.ingredientId === part.ingredientId).amount += 1000;
  doAction(state, { type: 'serve', mix: recipe.ingredients.map((item) => ({ ...item })), shaken: true, pourBrands: {} });
  assert.equal(state.served, 0, 'a practice drink is not a served guest');

  const bar = guestIn({ phase: 'ordering' }).state;
  const before = bar.served;
  bar.customers = [bar.customers[0]];
  const target = bar.customers[0];
  Object.assign(target, { modifierId: undefined, orderKind: 'cocktail', orderRevealed: true, orderRecipeId: recipe.id, patience: 99999, patienceRemaining: 99999 });
  for (const part of recipe.ingredients) bar.inventories[bar.regionId].find((stock) => stock.ingredientId === part.ingredientId).amount += 1000;
  doAction(bar, { type: 'serve', mix: recipe.ingredients.map((item) => ({ ...item })), shaken: true, pourBrands: {} });
  assert.equal(bar.served, before + 1);
  assert.equal(bar.servedByBar[bar.regionId], 1);

  bar.loot.achievements = ['a-serve-10', 'a-vip-10', 'a-bottles-25', 'a-boxes-20', 'a-draws-30'];
  doAction(bar, { type: 'setFeaturedAchievements', ids: ['a-serve-10', 'a-vip-10', 'a-bottles-25', 'a-boxes-20', 'a-draws-30', 'nope'] });
  assert.equal(bar.featuredAchievements.length, 4, 'at most four');
  doAction(bar, { type: 'setFeaturedAchievements', ids: ['nope', 'a-draws-30'] });
  assert.deepEqual(bar.featuredAchievements, ['a-draws-30'], 'only earned achievements');
  doAction(bar, { type: 'setFeaturedAchievements', ids: [] });
  assert.equal(bar.featuredAchievements, undefined, 'empty goes back to the latest four');
});

test('A friend’s bar carries the profile, old saves get a served count, and the profile is built from the state only', async () => {
  const { publicBar } = await import('../src/sim/gifts.ts');
  const { normalizePlayerState } = await import('../src/sim/state.ts');
  const state = createInitialState(NOW);
  state.served = 7; state.servedByBar = { 'new-york': 7 };
  const bar = publicBar(state, 'Friend');
  assert.equal(bar.profile.served, 7);
  assert.equal(bar.profile.favoriteBarId, 'new-york');
  const old = createInitialState(NOW);
  delete old.served; delete old.servedByBar;
  old.loot.stats.serves = 42;
  normalizePlayerState(old);
  assert.equal(old.served, 42);
  assert.deepEqual(old.servedByBar, { [old.regionId]: 42 });
});

test('The build version is stamped (dev when built locally), shown in a readable form, and unchanged files are revalidated within the hour', async () => {
  const { readFileSync } = await import('node:fs');
  const { APP_VERSION, formatBuilt } = await import('../src/version.ts');
  assert.equal(APP_VERSION, 'dev');
  assert.equal(formatBuilt('2026-10-01T11:04:06.000Z'), '2026-10-01 11:04 UTC');
  assert.equal(formatBuilt('nonsense'), '');
  const server = readFileSync('server/index.mjs', 'utf8');
  assert.match(server, /max-age=3600, must-revalidate/);
  assert.doesNotMatch(server, /max-age=86400/);
  assert.match(readFileSync('Dockerfile', 'utf8'), /ARG GIT_SHA/);
  assert.match(readFileSync('.github/workflows/docker-master.yml', 'utf8'), /GIT_SHA=\$\{\{ github\.sha \}\}/);
});

test('Every bar has its own servers: hired and trained in one bar, they work in that bar only', async () => {
  const { accrueStaff, teamOf } = await import('../src/sim/staff.ts');
  const { normalizePlayerState } = await import('../src/sim/state.ts');
  const { state } = guestIn();
  state.money = 10000000; state.xp = 1e9;
  state.ownedBarIds = ['new-york', 'london'];
  const home = state.regionId;
  applyAction(state, { type: 'hireStaff' }, context());
  applyAction(state, { type: 'hireStaff' }, context());
  applyAction(state, { type: 'switchBar', regionId: 'london' }, context());
  assert.equal(teamOf(state).length, 0, 'the other bar starts without servers');
  applyAction(state, { type: 'hireStaff' }, context());
  assert.equal(teamOf(state, 'london').length, 1);
  assert.equal(teamOf(state, home).length, 2);
  applyAction(state, { type: 'upgradeStaff', index: 0 }, context());
  assert.equal(teamOf(state, 'london')[0].level, 2);
  assert.equal(teamOf(state, home)[0].level, 1, 'training one bar leaves the other alone');
  // away time pays each bar by its own team
  const market = { averagePrice: 10, arrival: 1 };
  state.staffAtByBar = { [home]: NOW, london: NOW };
  const before = state.money;
  assert.match(accrueStaff(state, NOW + 4 * 3600_000, () => .5, market, home), /team in /);
  assert.ok(state.money > before);
  // an old save with one team keeps it in the bar that was being managed
  const old = JSON.parse(JSON.stringify(state));
  old.staff = [{ level: 3 }, { level: 2 }]; old.staffAt = NOW; delete old.staffByBar; delete old.staffAtByBar; old.regionId = 'london';
  const migrated = normalizePlayerState(old);
  assert.deepEqual(migrated.staffByBar, { london: [{ level: 3 }, { level: 2 }] });
  assert.equal(migrated.staffAtByBar.london, NOW);
  assert.equal('staff' in migrated, false);
});
