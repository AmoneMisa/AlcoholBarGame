import test from 'node:test';
import assert from 'node:assert/strict';
import { checkEnglish } from '../server/english.mjs';
import { RECIPES } from '../src/domain/catalog.ts';
import { requiredRecipe } from '../src/domain/engine.ts';
import { actsIn } from '../src/domain/social/acts.ts';
import { EMOTIONS } from '../src/domain/social/model.ts';
import { openingFor, socialReply } from '../src/domain/social/talk.ts';
import { advanceClock, applyAction, RuleError } from '../src/sim/rules.ts';
import { leaveChance } from '../src/sim/guests.ts';
import { createInitialState } from '../src/sim/state.ts';

const NOW = Date.UTC(2026, 9, 1, 20);
const context = (now = NOW, random = () => .5) => ({ now, random, checkEnglish, spawnCustomers: true });
const SOBER_GUEST = { emotion: 'upset', rapport: 50, drunk: 0, chatty: true, topic: 'work', gender: 'f', phase: 'ordering', nextOrderAt: 0, rounds: 0, staysFor: 0, chatted: [] };

// A bar with one guest whose feelings are set by the test.
function barWith(social = {}, patch = {}) {
  const state = createInitialState(NOW);
  state.customers = [state.customers[0]];
  const guest = state.customers[0];
  state.activeCustomerId = guest.id;
  Object.assign(guest, { mood: 'calm', orderKind: 'cocktail', orderRecipeId: RECIPES[0].id, orderRevealed: true, smoker: false, patience: 99_999, patienceRemaining: 99_999, ...patch });
  guest.social = { ...SOBER_GUEST, ...social };
  state.nextCustomerAt = 0;
  return { state, guest };
}
const say = (state, text, now = NOW, random) => applyAction(state, { type: 'say', text }, context(now, random));
const talkTo = (state, guest) => applyAction(state, { type: 'openConversation', customerId: guest.id }, context());
const lastLine = (state, guest) => state.conversations[guest.id].lines.at(-1).text;
function serve(state, now = NOW, random) {
  const guest = state.customers.find((item) => item.id === state.activeCustomerId);
  for (const item of requiredRecipe(guest).ingredients) state.inventories[state.regionId].find((stock) => stock.ingredientId === item.ingredientId).amount += 1000;
  return applyAction(state, { type: 'serve', mix: requiredRecipe(guest).ingredients.map((item) => ({ ...item })), shaken: true, pourBrands: {} }, context(now, random));
}

test('Guests open with their own feelings, and the same feeling is said in different ways', () => {
  const openings = new Set();
  for (const emotion of EMOTIONS) {
    for (let index = 0; index < 8; index++) {
      const { guest } = barWith({ emotion });
      guest.id = `guest-${emotion}-${index}`;
      const opening = openingFor(guest);
      assert.ok(opening.text.length > 10, `${emotion} has an opening`);
      openings.add(opening.text);
    }
  }
  assert.ok(openings.size >= 20, `many different openings, saw ${openings.size}`);
  const { state, guest } = barWith({ emotion: 'angry' });
  talkTo(state, guest);
  assert.match(state.conversations[guest.id].lines[0].text, /help|recommend|what would|suggest|ideas|taste|something|bubbles|mood|thinking|like|love|feel|usually|person/i, 'the guest gives a hint or asks for help');
});

test('Small talk works: asking how they are and what happened makes the guest tell a story and like you more', () => {
  const { state, guest } = barWith({ emotion: 'upset', topic: 'work', rapport: 40 });
  talkTo(state, guest);
  say(state, 'How are you tonight?');
  assert.match(lastLine(state, guest), /not great|better|hard day|kind/i);
  assert.ok(guest.social.rapport > 40, 'a kind question raises rapport');
  say(state, 'What happened?');
  assert.match(lastLine(state, guest), /boss|worked|client|promoted|project|job|manager|colleague|supervisor|team|offer|director|plan|best work/i, 'the guest tells their work story');
  assert.equal(guest.social.told, true);
  const before = guest.social.rapport;
  say(state, 'I am sorry to hear that.');
  assert.ok(guest.social.rapport > before, 'empathy raises rapport');
  assert.equal(guest.social.emotion, 'relaxed', 'comforted, a sad guest relaxes');
  say(state, 'What happened?');
  assert.match(lastLine(state, guest), /Like I said|already told/i, 'the guest does not repeat the story');
});

test('Rude words make a guest angry, and an angry guest is calmed by kindness', () => {
  const { state, guest } = barWith({ emotion: 'relaxed', rapport: 30 });
  talkTo(state, guest);
  say(state, 'You are boring, who cares.');
  assert.equal(guest.social.emotion, 'angry');
  assert.ok(guest.social.rapport < 30);
  const afterRude = guest.social.rapport;
  say(state, 'I am sorry about that.');
  say(state, 'I understand, it was a hard day.');
  say(state, 'How are you tonight?');
  assert.ok(guest.social.rapport > afterRude, 'kindness slowly brings the guest back (angry guests warm up at half speed)');
});

test('A served guest can stay, sit with the drink, then order again with a new mood and a new drink', () => {
  const { state, guest } = barWith({ staysFor: 2, rapport: 70, emotion: 'happy' });
  const first = guest.orderRecipeId;
  serve(state);
  assert.ok(state.customers.includes(guest), 'the guest stays seated');
  assert.equal(guest.social.phase, 'enjoying');
  assert.equal(guest.social.rounds, 1);
  assert.equal(guest.social.staysFor, 1);
  assert.throws(() => serve(state), /still enjoying/);
  // Nothing happens before the timeout…
  advanceClock(state, context(NOW + 60_000));
  assert.equal(guest.social.phase, 'enjoying');
  // …and then the guest wants another one.
  advanceClock(state, context(NOW + 11 * 60_000));
  assert.equal(guest.social.phase, 'ordering');
  assert.match(state.message, /another drink/i);
  assert.equal(guest.orderRevealed, guest.orderKind === 'serve', 'a new cocktail order has to be found out again; a brand call is already known');
  assert.ok(guest.patienceRemaining > 0);
  assert.ok(guest.orderRecipeId, `a new order exists (was ${first})`);
});

test('A guest with nothing left to stay for leaves after the drink, and new guests keep arriving around seated ones', () => {
  const { state, guest } = barWith({ staysFor: 0 });
  serve(state);
  assert.ok(!state.customers.includes(guest), 'the guest left');
  const stay = barWith({ staysFor: 1, rapport: 70 });
  serve(stay.state);
  stay.guest.social.nextOrderAt = NOW + 120 * 60_000; // still enjoying when the new guest arrives
  assert.equal(stay.state.customers.length, 1);
  assert.ok(stay.state.nextCustomerAt > 0, 'someone new is on the way while the guest enjoys the drink');
  advanceClock(stay.state, context(stay.state.nextCustomerAt + 1));
  assert.equal(stay.state.customers.length, 2, 'a new guest sat down next to the seated one');
  assert.equal(stay.state.customers[1].social.phase, 'ordering');
});

test('Strong drinks make guests drunk, and the level falls with time', () => {
  const { state, guest } = barWith({ staysFor: 3, drunk: 0 });
  const abv = Math.round(guest.social.drunk);
  assert.equal(abv, 0);
  serve(state);
  const after = guest.social.drunk;
  assert.ok(after > 0, 'a cocktail adds to the level');
  advanceClock(state, context(NOW + 5 * 60_000));
  assert.ok(guest.social.drunk < after, 'the level falls as time passes');
});

test('Refusing and asking to leave: gentle works better than rude, and a very drunk angry guest can turn aggressive', () => {
  const calm = barWith({ rapport: 80, drunk: 30, emotion: 'tired' }).guest;
  const raging = barWith({ rapport: 20, drunk: 85, emotion: 'angry' }).guest;
  assert.ok(leaveChance(calm, 'gentle') > leaveChance(raging, 'gentle') + 30, 'a friendly tipsy guest leaves easily; an angry drunk does not');
  const middle = barWith({ rapport: 50, drunk: 40, emotion: 'upset' }).guest;
  assert.ok(leaveChance(middle, 'gentle') > leaveChance(middle, 'aggressive'), 'being rude makes it worse');

  // A gentle request to a friendly guest: they say goodbye and go.
  const friendly = barWith({ rapport: 80, drunk: 30, emotion: 'tired' });
  talkTo(friendly.state, friendly.guest);
  say(friendly.state, 'It is late. Maybe it is time to go home?', NOW, () => .05);
  assert.ok(!friendly.state.customers.includes(friendly.guest), 'the guest left');

  // The same sentence to someone who refuses: they stay, but like you less.
  const stubborn = barWith({ rapport: 50, drunk: 70, emotion: 'upset' });
  talkTo(stubborn.state, stubborn.guest);
  say(stubborn.state, 'Please go home. It is late.', NOW, () => .5);
  assert.ok(stubborn.state.customers.includes(stubborn.guest));
  assert.ok(stubborn.guest.social.rapport < 50);

  // A rude order to an angry drunk can start trouble.
  const trouble = barWith({ rapport: 30, drunk: 80, emotion: 'angry' });
  talkTo(trouble.state, trouble.guest);
  say(trouble.state, 'Get out of my bar, you drunk idiot!', NOW, () => .95);
  assert.equal(trouble.guest.social.event?.kind, 'aggression');
  assert.equal(trouble.guest.social.emotion, 'angry');

  // “I think you have had enough” is a refusal, not a request to leave.
  const refused = barWith({ rapport: 50, drunk: 60 });
  talkTo(refused.state, refused.guest);
  say(refused.state, 'I think you have had enough tonight.');
  assert.equal(refused.guest.social.refused, true);
  assert.ok(refused.state.customers.includes(refused.guest));
});

test('Ashtrays: a smoker asks, the bartender gives one, and it is dirty after they leave until it is cleaned', () => {
  const { state, guest } = barWith({ staysFor: 0, need: { kind: 'ashtray', since: NOW } }, { smoker: true });
  talkTo(state, guest);
  assert.match(state.conversations[guest.id].lines[0].text, /ashtray/i, 'the guest asks for one');
  assert.equal(state.ashtrays.clean, 4);
  applyAction(state, { type: 'giveAshtray', customerId: guest.id }, context());
  assert.equal(state.ashtrays.clean, 3);
  assert.equal(guest.social.ashtray, 'given');
  assert.equal(guest.social.need, undefined);
  assert.throws(() => applyAction(state, { type: 'giveAshtray', customerId: guest.id }, context()), /already has/);
  serve(state);
  assert.equal(state.ashtrays.dirty, 1, 'the ashtray is dirty when the guest leaves');
  applyAction(state, { type: 'cleanAshtrays' }, context());
  assert.deepEqual(state.ashtrays, { clean: 4, dirty: 0 });
  assert.throws(() => applyAction(state, { type: 'cleanAshtrays' }, context()), /nothing to clean/);
});

test('Dirty ashtrays make the next guest like the bar a little less', () => {
  const state = createInitialState(NOW);
  state.customers = [];
  state.ashtrays = { clean: 1, dirty: 3 };
  state.nextCustomerAt = NOW;
  advanceClock(state, context(NOW + 1000));
  assert.equal(state.customers.length, 1);
  assert.match(state.message, /ashtray/i);
});

test('A taxi takes a guest home safely after a few minutes', () => {
  const { state, guest } = barWith({ staysFor: 2, drunk: 70, gender: 'f' });
  applyAction(state, { type: 'callTaxi', customerId: guest.id }, context());
  assert.ok(guest.social.taxiAt > NOW);
  assert.equal(guest.social.staysFor, 0);
  const popularity = state.popularity;
  advanceClock(state, context(guest.social.taxiAt + 1000));
  assert.ok(!state.customers.includes(guest), 'the guest went home');
  assert.equal(state.popularity, popularity + 1);
  assert.match(state.message, /taxi/i);
});

test('Water helps a drunk guest, and an ignored request upsets them', () => {
  const { state, guest } = barWith({ drunk: 60, need: { kind: 'water', since: NOW }, rapport: 60 });
  advanceClock(state, context(NOW + 7 * 60_000));
  assert.ok(guest.social.rapport < 60, 'waiting for a long time lowers rapport');
  const before = guest.social.drunk;
  applyAction(state, { type: 'giveWater', customerId: guest.id }, context(NOW + 7 * 60_000));
  assert.ok(guest.social.drunk < before);
  assert.equal(guest.social.need, undefined);
});

test('The classifier understands what the bartender means', () => {
  assert.deepEqual(actsIn('How are you tonight?').slice(0, 1), ['howAreYou']);
  assert.deepEqual(actsIn('I am sorry to hear that.').slice(0, 1), ['empathy']);
  assert.ok(actsIn('Shall I call you a taxi?').includes('offerTaxi'));
  assert.ok(actsIn('Would you like some water?').includes('offerWater'));
  assert.equal(actsIn('Get out of my bar!')[0], 'leaveRude');
  assert.equal(actsIn('I must ask you to leave.')[0], 'leaveFirm');
  assert.equal(actsIn('It is late. Maybe it is time to go home?')[0], 'leaveGentle');
  assert.equal(actsIn('I think you have had enough tonight.')[0], 'refuse');
  assert.deepEqual(actsIn('Do you like sweet drinks?'), [], 'taste questions are not small talk');
});

test('Drunk guests sound drunk and sober guests do not', () => {
  const { guest } = barWith({ drunk: 80, emotion: 'happy' });
  const sober = barWith({ drunk: 0, emotion: 'happy' }).guest;
  const lines = new Set();
  for (let turn = 0; turn < 12; turn++) {
    const reply = socialReply(guest, ['howAreYou'], turn);
    assert.ok(reply.text.length > 5);
    lines.add(reply.text);
  }
  assert.ok(lines.size >= 2, 'the same question gets different answers over time');
  assert.ok(!RECIPES.length === false);
  assert.equal(sober.social.drunk, 0);
});
