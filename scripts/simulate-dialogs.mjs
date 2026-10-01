// Plays thousands of simulated conversations against the real rules and reports how consistent they are.
//   node --import ./tests/register.mjs scripts/simulate-dialogs.mjs [count]
//
// Four kinds of bartender: efficient (clue questions, then a guess), polite (greeting and feelings first), chatty
// (small talk, off-topic remarks, then the order) and chaotic (random sentences). Each uses only what the game
// really suggests, plus the chatty and chaotic ones add what a player might type by themselves.
import { checkEnglish } from '../server/english.mjs';
import { RECIPES } from '../src/domain/catalog.ts';
import { questionTemplates, matchesFacts, buildProfile } from '../src/domain/conversation/customerTalk.ts';
import { serviceTemplates } from '../src/domain/conversation/serviceTalk.ts';
import { socialTemplates } from '../src/domain/social/suggestions.ts';
import { EMOTIONS } from '../src/domain/social/model.ts';
import { applyAction } from '../src/sim/rules.ts';
import { createInitialState } from '../src/sim/state.ts';

const COUNT = Number(process.argv[2] ?? 600);
const NOW = Date.UTC(2026, 9, 1, 20);
let seed = 12345;
const random = () => { seed = (seed * 1664525 + 1013904223) % 4294967296; return seed / 4294967296; };
const pick = (list) => list[Math.floor(random() * list.length)];
const context = (now) => ({ now, random, checkEnglish, spawnCustomers: false });

const OFF_TOPIC = ['I like football and pizza.', 'Have you been to Tokyo?', 'Do you like jazz?', 'What do you do in your free time?', 'Do you have any pets?', 'Nice weather today.', 'Where are you from?', 'Why did that happen?', 'Tell me more.', 'Who was it?', 'How did it go?'];
const NONSENSE = ['banana', 'asdf qwerty', 'Please give me the moon.', 'I am a bartender and you are a guest.', 'Yes.', 'No.', 'Thank you.', 'Sorry.', 'What?'];

function newGuest(index) {
  const state = createInitialState(NOW);
  state.customers = [state.customers[0]];
  const guest = state.customers[0];
  guest.id = `sim-${index}`;
  state.activeCustomerId = guest.id;
  const recipe = pick(RECIPES.filter((item) => state.knownRecipeIds.includes(item.id)));
  Object.assign(guest, { mood: pick(['calm', 'friendly', 'tired', 'sad', 'impatient', 'angry', 'shy']), orderKind: 'cocktail', orderRecipeId: recipe.id, orderRevealed: false, patience: 9e9, patienceRemaining: 9e9, modifierId: undefined, smoker: random() < .2 });
  guest.social = { emotion: pick(EMOTIONS), rapport: 35 + Math.floor(random() * 40), drunk: random() < .15 ? 40 + Math.floor(random() * 40) : Math.floor(random() * 12), chatty: random() < .5, topic: pick(['work', 'relationship', 'money', 'family', 'sports', 'celebration', 'travel', 'health', 'weather']), gender: pick(['f', 'm']), phase: 'ordering', nextOrderAt: 0, rounds: 0, staysFor: 1, chatted: [] };
  return { state, guest, recipe };
}

function suggestions(state, guest, turns) {
  const transcript = state.conversations[guest.id];
  const known = RECIPES.filter((item) => state.knownRecipeIds.includes(item.id));
  const candidates = known.filter((item) => matchesFacts(item, transcript.facts) && !transcript.rejected?.includes(item.id));
  return {
    order: questionTemplates(transcript.facts, candidates).map((item) => item.text),
    guesses: candidates.slice(0, 3).map((item) => `Would you like ${/^[aeiou]/i.test(item.name) ? 'an' : 'a'} ${item.name}?`),
    service: serviceTemplates('drink', !!guest.orderRevealed, turns),
    social: socialTemplates(guest, NOW),
    candidates
  };
}

const POLICIES = {
  efficient: (s, turn) => (turn < 2 ? s.order.find((text) => !/Mojito/.test(text)) : s.guesses[0] ?? pick(s.order)),
  polite: (s, turn) => (turn === 0 ? 'Good evening!' : turn === 1 ? pick(s.social.length ? s.social : s.service) : turn < 4 ? pick(s.order) : s.guesses[0] ?? pick(s.order)),
  chatty: (s, turn) => (turn < 3 ? pick([...s.social, ...OFF_TOPIC]) : turn < 5 ? pick(s.order) : s.guesses[0] ?? pick(s.order)),
  chaotic: (s, turn) => (turn < 5 ? pick([...NONSENSE, ...OFF_TOPIC, ...s.social, ...s.order, ...s.service]) : s.guesses[0] ?? pick(s.order))
};

const stats = {};
const problems = [];
const record = (policy, key, value = 1) => { stats[policy] ??= {}; stats[policy][key] = (stats[policy][key] ?? 0) + value; };
const flag = (policy, kind, detail) => { record(policy, kind); if (problems.filter((item) => item.kind === kind).length < 4) problems.push({ policy, kind, detail }); };

let index = 0;
for (const policy of Object.keys(POLICIES)) {
  for (let run = 0; run < COUNT / 4; run++, index++) {
    const { state, guest, recipe } = newGuest(index);
    try { applyAction(state, { type: 'openConversation', customerId: guest.id }, context(NOW)); } catch (error) { flag(policy, 'open-failed', error.message); continue; }
    if (!state.conversations[guest.id]) { flag(policy, 'no-transcript', `customers=${state.customers.length} drunk=${guest.social?.drunk} emotion=${guest.social?.emotion} msg=${state.message}`); continue; }
    const last = { lines: state.conversations[guest.id].lines };
    const lines = () => (state.conversations[guest.id]?.lines ?? last.lines);
    let turn = 0, t = NOW, confirmedAt = -1;
    const log = [`G: ${lines()[0].text}`];
    record(policy, 'conversations');
    for (; turn < 14 && !guest.orderRevealed; turn++) {
      const s = suggestions(state, guest, turn);
      const text = POLICIES[policy](s, turn);
      t += 6000;
      try { applyAction(state, { type: 'say', text }, context(t)); } catch (error) { flag(policy, 'say-error', `${text} -> ${error.message}`); break; }
      if (!state.customers.includes(guest)) { flag(policy, 'guest-left', `${log.join(' / ')} :: after ${text} :: ${state.message}`); break; }
      const reply = lines().at(-1).text;
      log.push(`B: ${text}`, `G: ${reply}`);
      record(policy, 'guest-lines');
      // --- checks on each guest line
      if (/[{}\[\]]|undefined|NaN/.test(reply)) flag(policy, 'broken-text', reply);
      if ((reply.replace(/^[^?]*\?\s/, (m) => (/^(An? )?[A-Z][\w’' -]*\? /.test(m) ? '' : m)).match(/\?/g) ?? []).length >= 2) flag(policy, 'two-questions', reply);
      if (reply.length > 170) flag(policy, 'too-long', reply);
      if (/Interesting! I did not expect that/.test(reply) && /Do you|Would you|What|Which/.test(text)) flag(policy, 'wrong-reaction-to-question', `${text} -> ${reply}`);
      if (/don’t understand/.test(reply)) record(policy, 'did-not-understand');
      if (/Anyway|Right, the drink|enough talking|my drink now|what can you offer|what would you recommend|what do you suggest|help me choose/i.test(reply)) record(policy, 'back-to-order');
      if (/^Sorry, i /.test(reply) || /\bi worked\b/.test(reply) && /^[a-z]/.test(reply)) flag(policy, 'lowercase-i', reply);
    }
    const text = lines().map((line) => line.text);
    if (guest.orderRevealed) { record(policy, 'ordered'); record(policy, 'turns-to-order', turn); confirmedAt = turn; } else { record(policy, 'never-ordered'); if (problems.filter((item) => item.kind === 'never-ordered').length < 3) problems.push({ policy, kind: 'never-ordered', detail: log.join('\n    ') }); }
    // --- checks on the whole conversation
    const guestLines = lines().filter((line) => line.speaker === 'customer').map((line) => line.text);
    const duplicates = guestLines.length - new Set(guestLines).size;
    if (duplicates > 0) flag(policy, 'repeated-guest-line', guestLines.join(' | '));
    // The clue board must agree with the drink the guest really ordered.
    const profile = buildProfile(recipe);
    for (const fact of state.conversations[guest.id]?.facts ?? []) if (profile.traits.has(fact.topic) !== fact.likes) flag(policy, 'clue-contradicts-order', `${fact.topic} ${fact.likes} vs ${recipe.name}`);
    if (guestLines.length > 12) flag(policy, 'long-conversation', `${guestLines.length} lines`);
    void text; void confirmedAt;
  }
}

const pct = (a, b) => (b ? `${Math.round((a / b) * 100)}%` : '-');
console.log(`\nSimulated ${index} conversations\n`);
console.log('policy      convs  ordered  avg turns  guest lines  back-to-order  not understood  repeats  two-questions  broken');
for (const [policy, s] of Object.entries(stats)) {
  console.log(`${policy.padEnd(11)} ${String(s.conversations).padStart(5)}  ${pct(s.ordered ?? 0, s.conversations).padStart(7)}  ${((s['turns-to-order'] ?? 0) / Math.max(1, s.ordered ?? 0)).toFixed(1).padStart(9)}  ${String(s['guest-lines'] ?? 0).padStart(11)}  ${pct(s['back-to-order'] ?? 0, s['guest-lines'] ?? 0).padStart(13)}  ${pct(s['did-not-understand'] ?? 0, s['guest-lines'] ?? 0).padStart(14)}  ${String(s['repeated-guest-line'] ?? 0).padStart(7)}  ${String(s['two-questions'] ?? 0).padStart(13)}  ${String(s['broken-text'] ?? 0).padStart(6)}`);
}
const kinds = {};
for (const s of Object.values(stats)) for (const [key, value] of Object.entries(s)) if (['guest-left', 'no-transcript', 'never-ordered', 'wrong-reaction-to-question', 'clue-contradicts-order', 'too-long', 'long-conversation', 'say-error', 'open-failed', 'lowercase-i'].includes(key)) kinds[key] = (kinds[key] ?? 0) + value;
console.log('\nProblems:', Object.keys(kinds).length ? kinds : 'none of the tracked kinds');
for (const problem of problems) console.log(`\n[${problem.policy}] ${problem.kind}:\n    ${problem.detail}`);
