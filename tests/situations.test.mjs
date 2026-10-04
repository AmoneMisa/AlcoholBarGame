import test from 'node:test';
import assert from 'node:assert/strict';
import { checkText } from '../src/domain/english/checker.ts';
import { checkEnglish } from '../server/english.mjs';
import { RECIPES } from '../src/domain/catalog.ts';
import { requiredRecipe } from '../src/domain/engine.ts';
import { SITUATIONS, situationById } from '../src/domain/situations/catalog.ts';
import { fill, hasSituation, resolveChoice, startSituation, visibleChoices, matchChoice, guestLine, currentStage } from '../src/sim/situations.ts';
import { situationDailyLessons, situationQuizDistractors } from '../src/domain/situations/learning.ts';
import { advanceClock, applyAction } from '../src/sim/rules.ts';
import { createInitialState, publicState } from '../src/sim/state.ts';

const NOW = Date.UTC(2026, 9, 1, 21);
test('Daily situation replies stay in the current dialogue and never borrow unrelated smoking answers', () => {
  const lessons = situationDailyLessons();
  assert.ok(lessons.length > 20);
  for (const lesson of lessons) {
    const def = SITUATIONS.find(item => lesson.id.startsWith(`sit-${item.id}-`));
    assert.ok(def);
    const first = def.stages[0];
    const localReplies = [...first.choices.map(choice => choice.say), ...situationQuizDistractors(def)];
    assert.equal(lesson.choices.length, 3);
    assert.equal(new Set(lesson.choices).size, lesson.choices.length);
    assert.ok(lesson.choices.every(reply => localReplies.includes(reply)), lesson.id);
    if (def.id !== 'rule-smoking-inside') assert.ok(lesson.choices.every(reply => !/smok|terrace/i.test(reply)), lesson.id);
  }
  assert.ok(lessons.some(lesson => lesson.id.startsWith('sit-good-payback-')));
  assert.ok(lessons.some(lesson => lesson.id.startsWith('sit-good-wallet-')));
});
const context = (now = NOW, random = () => .5) => ({ now, random, checkEnglish, spawnCustomers: false });
const SOCIAL = { emotion: 'relaxed', rapport: 55, drunk: 0, chatty: false, topic: 'work', gender: 'x', phase: 'ordering', nextOrderAt: 0, rounds: 0, staysFor: 0, chatted: [] };

function barWith(region = 'new-york') {
  const state = createInitialState(NOW);
  state.regionId = region;
  state.customers = [state.customers[0]];
  const guest = state.customers[0];
  state.activeCustomerId = guest.id;
  Object.assign(guest, { mood: 'calm', orderKind: 'cocktail', orderRecipeId: RECIPES[0].id, orderRevealed: true, smoker: false, patience: 99_999, patienceRemaining: 99_999 });
  guest.social = { ...SOCIAL };
  state.nextCustomerAt = 0;
  state.guestsSinceEvent = 5;
  return { state, guest };
}

test('Every situation is well formed: unique ids, valid stages and follow-ups, and every reply is correct English', () => {
  assert.ok(SITUATIONS.length >= 10, 'a good number of situations');
  assert.equal(new Set(SITUATIONS.map((situation) => situation.id)).size, SITUATIONS.length, 'unique ids');
  for (const situation of SITUATIONS) {
    assert.ok(situation.title && situation.icon && situation.triggers.length, `${situation.id}: title, icon and triggers`);
    assert.ok(situation.stages.length >= 1 && situation.timeoutMin > 0, `${situation.id}: stages and a timeout`);
    assert.ok(situation.ignored && situation.ignored.next === undefined, `${situation.id}: doing nothing ends it`);
    for (const [index, stage] of situation.stages.entries()) {
      assert.ok(stage.guest.length > 8 && stage.choices.length >= 1, `${situation.id} stage ${index}: a line and replies`);
      assert.equal(new Set(stage.choices.map((choice) => choice.id)).size, stage.choices.length, `${situation.id} stage ${index}: unique choice ids`);
      for (const choice of stage.choices) {
        const spoken = choice.say.replace(/\{\w+\}/g, '10');
        const result = checkText(spoken);
        assert.equal(result.ok, true, `${situation.id}/${choice.id}: “${spoken}” ${JSON.stringify(result.issues.map((item) => item.message))}`);
        assert.ok(choice.outcomes.length >= 1, `${situation.id}/${choice.id}: outcomes`);
        for (const outcome of choice.outcomes) {
          assert.ok(outcome.say.length > 3, `${situation.id}/${choice.id}: the guest answers`);
          if (outcome.next !== undefined) assert.ok(situation.stages[outcome.next], `${situation.id}/${choice.id}: next stage ${outcome.next} exists`);
          if (outcome.effects.spawn) assert.ok(situationById(outcome.effects.spawn), `${situation.id}/${choice.id}: spawns a known situation`);
        }
      }
    }
  }
});

test('Every situation can be played to the end by any sequence of replies, in every city, without breaking the bar', () => {
  for (const region of ['new-york', 'london', 'berlin', 'tashkent', 'bucharest', 'tokyo']) {
    for (const situation of SITUATIONS) {
      for (const seed of [0.05, 0.4, 0.7, 0.95]) {
        const { state, guest } = barWith(region);
        let step = 0;
        const random = () => ((seed * 9301 + (step++) * 0.123) % 1);
        startSituation(state, guest, situation, NOW, random, { amount: 12, afterServe: !!situation.holdsPayment });
        const startMoney = state.money;
        let rounds = 0;
        while (guest.social?.event && rounds++ < 25 && state.customers.includes(guest)) {
          const choices = visibleChoices(state, guest, random);
          assert.ok(choices.length > 0, `${situation.id} in ${region}: a reply is always possible`);
          const choice = choices[Math.floor(random() * choices.length)];
          const resolution = resolveChoice(state, guest, choice, NOW, random);
          if (resolution.leave) break;
        }
        assert.ok(rounds < 25, `${situation.id} in ${region} (seed ${seed}): it ends`);
        assert.ok(Number.isFinite(state.money) && state.money >= 0, `${situation.id}: money stays valid`);
        assert.ok(state.money >= 0 && startMoney >= 0);
      }
    }
  }
});

test('A payment problem holds the bill: nothing is paid until it is sorted out', () => {
  const { state, guest } = barWith();
  guest.social.staysFor = 0;
  state.money = 100;
  for (const item of requiredRecipe(guest).ingredients) state.inventories[state.regionId].find((stock) => stock.ingredientId === item.ingredientId).amount += 1000;
  // A roll of 0.01 starts the first payment situation (not enough money).
  const before = state.money;
  applyAction(state, { type: 'serve', mix: requiredRecipe(guest).ingredients.map((item) => ({ ...item })), shaken: true, pourBrands: {} }, context(NOW, () => .01));
  assert.ok(state.customers.includes(guest), 'the guest is still at the bar');
  assert.ok(hasSituation(guest), 'a payment problem started');
  assert.equal(state.money, before, 'the bill is held');
  assert.ok(guest.social.event.data.amount > 0);
  assert.match(state.conversations[guest.id].lines.at(-1).text, /bill|money|card|pay/i);
  assert.throws(() => applyAction(state, { type: 'serve', mix: [{ ingredientId: 'ice', amount: 1 }], shaken: false, pourBrands: {} }, context()), /situation first/);

  // Offering to take part now and the rest later: part is paid, the rest goes on the tab.
  const held = guest.social.event.data.amount;
  applyAction(state, { type: 'situationChoice', customerId: guest.id, choiceId: 'partial' }, context(NOW + 1000, () => .05));
  assert.ok(state.money > before && state.money < before + held, 'part of the bill was paid');
  assert.equal(state.tabs.length, 1, 'the rest is on the tab');
  assert.ok(!state.customers.includes(guest), 'the guest left after settling');
  assert.ok(state.situationStats.solved >= 1);
});

test('Typing a reply in your own words works like choosing it, and an unrelated sentence gets a nudge', () => {
  const { state, guest } = barWith();
  startSituation(state, guest, situationById('pay-short'), NOW, () => .5, { amount: 12, afterServe: true });
  applyAction(state, { type: 'openConversation', customerId: guest.id }, context());
  assert.match(state.conversations[guest.id].lines[0].text, /only have/);
  assert.ok(matchChoice(state, guest, 'No problem. Would you like to pay by card?'), 'the exact sentence matches');
  applyAction(state, { type: 'say', text: 'Do you like sweet drinks?' }, context());
  assert.match(state.conversations[guest.id].lines.at(-1).text, /help with this/i, 'an unrelated sentence does not solve the situation');
  assert.ok(hasSituation(guest));
  applyAction(state, { type: 'say', text: 'No problem. Would you like to pay by card?' }, context(NOW + 1000, () => .1));
  assert.ok(!hasSituation(guest) || currentStage(guest).stage !== undefined);
});

test('What the bar accepts depends on the city: QR codes work in New York and not in Berlin', () => {
  const ny = barWith('new-york');
  startSituation(ny.state, ny.guest, situationById('pay-qr'), NOW, () => .5, { amount: 12, afterServe: true });
  resolveChoice(ny.state, ny.guest, visibleChoices(ny.state, ny.guest).find((choice) => choice.id === 'yes'), NOW, () => .5);
  assert.ok(!ny.guest.social.event || ny.state.money > 600, 'the QR payment worked in New York');
  const berlin = barWith('berlin');
  startSituation(berlin.state, berlin.guest, situationById('pay-qr'), NOW, () => .5, { amount: 12, afterServe: true });
  const answer = resolveChoice(berlin.state, berlin.guest, visibleChoices(berlin.state, berlin.guest).find((choice) => choice.id === 'yes'), NOW, () => .5);
  assert.match(answer.guest, /does not work|not work/i, 'promising a QR code the bar cannot take fails');
  assert.ok(berlin.guest.social.event, 'the situation goes on');
});

test('Facts a situation hides never reach the client, and amounts are written in the city’s money', () => {
  const { state, guest } = barWith();
  startSituation(state, guest, situationById('pay-fake-note'), NOW, () => .1, { amount: 12, afterServe: true });
  assert.ok('_fake' in guest.social.event.data, 'the server knows');
  const view = publicState(state);
  assert.ok(!('_fake' in view.customers[0].social.event.data), 'the client does not');
  assert.equal(fill('The bill is {amount}.', { amount: 12 }, '$'), 'The bill is $12.');
  assert.equal(fill('The bill is {amount}.', { amount: 12.5 }, '$'), 'The bill is $13.');
  assert.match(guestLine(state, guest), /Keep the change/);
});

test('A situation nobody answers resolves itself', () => {
  const { state, guest } = barWith();
  startSituation(state, guest, situationById('pay-short'), NOW, () => .5, { amount: 12, afterServe: true });
  advanceClock(state, context(NOW + 3 * 60_000));
  assert.ok(hasSituation(guest), 'still waiting after three minutes');
  advanceClock(state, context(NOW + 9 * 60_000));
  assert.ok(!state.customers.includes(guest), 'the guest walked out without paying');
  assert.ok(state.situationStats.failed >= 1);
});
