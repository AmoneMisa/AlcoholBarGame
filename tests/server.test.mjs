import test from 'node:test';
import assert from 'node:assert/strict';
import { createHmac } from 'node:crypto';
import { AuthError, verifyTelegramInitData } from '../server/auth.mjs';
import { createApp, handleErrors } from '../server/app.mjs';
import { createGameService } from '../server/gameService.mjs';
import { createMemoryRepository } from '../server/playerRepository.mjs';
import { isCorrectEnglish } from '../server/english.mjs';
import { RECIPES } from '../src/domain/catalog.ts';
import { requiredRecipe } from '../src/domain/engine.ts';

const BOT_TOKEN = '123456:TEST-token-for-unit-tests';

function signInitData(user, { authDate = Math.floor(Date.now() / 1000), token = BOT_TOKEN } = {}) {
  const params = new URLSearchParams({ auth_date: String(authDate), query_id: 'AAE', user: JSON.stringify(user) });
  const checkString = [...params.entries()].sort(([a], [b]) => a.localeCompare(b)).map(([key, value]) => `${key}=${value}`).join('\n');
  const secret = createHmac('sha256', 'WebAppData').update(token).digest();
  params.set('hash', createHmac('sha256', secret).update(checkString).digest('hex'));
  return params.toString();
}

const identity = (id = 1) => ({ kind: 'dev', key: `dev:${id}`, telegramId: null, name: `Player ${id}`, username: null });
let counter = 0;
const requestId = () => `test-request-${++counter}-${Math.random().toString(36).slice(2, 10)}`;

function makeService(now = () => Date.now()) {
  const repository = createMemoryRepository();
  return { repository, service: createGameService({ repository, isCorrectEnglish, now }) };
}
async function act(service, action, id = requestId(), who = identity()) {
  return (await service.act(who, { requestId: id, action })).body;
}

test('Telegram login: a valid signature is accepted; forged, tampered or old data is rejected', () => {
  const user = { id: 424242, first_name: 'Rita', username: 'rita' };
  const player = verifyTelegramInitData(signInitData(user), BOT_TOKEN);
  assert.equal(player.key, 'tg:424242');
  assert.equal(player.telegramId, 424242);
  assert.throws(() => verifyTelegramInitData(signInitData(user, { token: '999:other-bot' }), BOT_TOKEN), AuthError, 'signed with another bot token');
  const tampered = signInitData(user).replace(encodeURIComponent('"id":424242'), encodeURIComponent('"id":1'));
  assert.throws(() => verifyTelegramInitData(tampered, BOT_TOKEN), AuthError, 'changing the user id breaks the signature');
  assert.throws(() => verifyTelegramInitData(signInitData(user, { authDate: Math.floor(Date.now() / 1000) - 3 * 86400 }), BOT_TOKEN), AuthError, 'expired');
  assert.throws(() => verifyTelegramInitData('user=%7B%7D', BOT_TOKEN), AuthError, 'no hash');
});

test('Coins only change through server rules: fake mixes, fake prices and client-sent money do nothing', async () => {
  const { service, repository } = makeService();
  const { state } = await service.session(identity());
  const money = state.money;
  const guest = state.customers[0];

  // A client cannot send money, XP or prices — unknown fields are ignored and unknown actions refused.
  assert.equal((await act(service, { type: 'setMoney', money: 1e9 })).ok, false);
  assert.equal((await act(service, { type: 'tick', money: 1e9, xp: 1e9 })).state.money, money);

  // Serving a glass with ingredients the bar does not have is refused.
  const huge = await act(service, { type: 'serve', mix: [{ ingredientId: 'white-rum', amount: 999999 }], shaken: true, pourBrands: {} });
  assert.equal(huge.ok, false);
  assert.match(huge.error, /Not enough|sealed bottles/, 'refused: missing stock (or the guest only buys bottles)');
  const junk = await act(service, { type: 'serve', mix: [{ ingredientId: 'gold', amount: 5 }, { ingredientId: 'ice', amount: -3 }, { ingredientId: 'lime-juice', amount: NaN }], shaken: true, pourBrands: {} });
  assert.equal(junk.ok, false);

  // A negative or fractional shopping cart buys nothing; prices come from the server's market.
  assert.equal((await act(service, { type: 'buy', supplierId: 'global', cart: { 'white-rum': -5, gin: 0.2, vodka: 'x' } })).ok, false);
  assert.equal((await act(service, { type: 'sell', cart: { gin: 1e9 } })).ok, false);

  // The right drink, served correctly, pays the server's price.
  if (guest.orderKind === 'cocktail') {
    const recipe = requiredRecipe(guest);
    const served = await act(service, { type: 'serve', mix: recipe.ingredients, shaken: recipe.needsShake, pourBrands: {} });
    if (served.ok) assert.ok(served.state.money > money);
  }
  const final = (await service.session(identity())).state.money;
  const ledgerTotal = repository.ledger.reduce((sum, entry) => sum + entry.delta, 0);
  assert.ok(Math.abs(money + ledgerTotal - final) < .01, 'every coin change is in the ledger');
});

test('Replayed requests are applied once, and the daily gift is once per server day', async () => {
  const { service, repository } = makeService();
  const { state } = await service.session(identity());
  const id = requestId();
  const first = await act(service, { type: 'claimDaily' }, id);
  const replay = await act(service, { type: 'claimDaily' }, id);
  assert.equal(first.ok, true);
  assert.deepEqual(replay, first, 'the same request id returns the stored answer');
  assert.equal(first.state.money, state.money + 150);
  const again = await act(service, { type: 'claimDaily' });
  assert.equal(again.ok, false, 'a second claim the same day is refused');
  assert.equal(again.state.money, first.state.money);
  assert.equal(repository.ledger.filter((entry) => entry.action === 'claimDaily').length, 1);
});

test('English XP is decided by the server checker and capped per guest; wrong confirmations are refused', async () => {
  const { service } = makeService();
  const { state } = await service.session(identity());
  const guest = state.customers[0];
  assert.equal((await act(service, { type: 'sentence', text: 'Do you like sweet drinks?' })).ok, false, 'no conversation open');
  await act(service, { type: 'openConversation', customerId: guest.id });
  const xp = (await act(service, { type: 'tick' })).state.xp;
  const wrong = await act(service, { type: 'sentence', text: 'do you likes sweet drinks' });
  assert.equal(wrong.state.xp, xp, 'incorrect English earns nothing, whatever the client claims');
  let last = wrong.state.xp;
  for (let index = 0; index < 12; index++) last = (await act(service, { type: 'sentence', text: 'Do you like sweet drinks?' })).state.xp;
  assert.equal(last, xp + 6 * 3, 'only six correct sentences per guest earn XP');

  if (guest.orderKind !== 'bottle') {
    const other = RECIPES.find((recipe) => recipe.id !== guest.orderRecipeId);
    assert.equal((await act(service, { type: 'confirmOrder', customerId: guest.id, recipeId: other.id })).ok, false);
  }
});

test('Guests arrive only on the server clock; a client cannot summon customers', async () => {
  let clock = Date.now();
  const { service } = makeService(() => clock);
  const { state } = await service.session(identity());
  await act(service, { type: 'rejectCustomer', customerId: state.customers[0].id });
  const waiting = (await act(service, { type: 'tick' })).state;
  assert.equal(waiting.customers.length, 0);
  assert.ok(waiting.nextCustomerAt > clock);
  for (let index = 0; index < 5; index++) assert.equal((await act(service, { type: 'tick' })).state.customers.length, 0, 'ticking does not bring guests early');
  clock = waiting.nextCustomerAt + 1000;
  assert.equal((await act(service, { type: 'tick' })).state.customers.length, 1, 'the guest arrives when the server time is reached');
});

test('HTTP API: login required, dev login only when enabled, rate limited, state is per player', async () => {
  const { service } = makeService();
  const app = createApp({ service, botToken: BOT_TOKEN, allowDevLogin: true });
  handleErrors(app);
  const server = await new Promise((resolve) => { const listening = app.listen(0, () => resolve(listening)); });
  const base = `http://127.0.0.1:${server.address().port}`;
  const post = (path, body, headers = {}) => fetch(base + path, { method: 'POST', headers: { 'Content-Type': 'application/json', ...headers }, body: JSON.stringify(body) });
  try {
    assert.equal((await post('/api/session', {})).status, 401);
    const telegram = { Authorization: `tma ${signInitData({ id: 777, first_name: 'Ana' })}` };
    const session = await (await post('/api/session', {}, telegram)).json();
    assert.equal(session.ok, true);
    assert.equal(session.player.name, 'Ana');
    const other = await (await post('/api/session', {}, { 'X-Dev-Player': 'someone' })).json();
    assert.notEqual(other.player.id, session.player.id, 'each identity has its own game');
    assert.equal((await post('/api/action', { requestId: 'short', action: { type: 'tick' } }, telegram)).status, 400);
    let limited = false;
    for (let index = 0; index < 45 && !limited; index++) limited = (await post('/api/action', { requestId: requestId(), action: { type: 'tick' } }, telegram)).status === 429;
    assert.ok(limited, 'scripted spamming is slowed down');
  } finally {
    server.close();
  }
  const locked = createApp({ service, botToken: BOT_TOKEN, allowDevLogin: false });
  const lockedServer = await new Promise((resolve) => { const listening = locked.listen(0, () => resolve(listening)); });
  try {
    const response = await fetch(`http://127.0.0.1:${lockedServer.address().port}/api/session`, { method: 'POST', headers: { 'X-Dev-Player': 'someone' } });
    assert.equal(response.status, 401, 'dev login is off unless explicitly enabled');
  } finally {
    lockedServer.close();
  }
});
