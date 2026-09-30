import test from 'node:test';
import assert from 'node:assert/strict';
import { createHmac } from 'node:crypto';
import { AuthError, verifyTelegramInitData } from '../server/auth.mjs';
import { createApp, handleErrors } from '../server/app.mjs';
import { createGameService } from '../server/gameService.mjs';
import { createMemoryRepository } from '../server/playerRepository.mjs';
import { checkEnglish } from '../server/english.mjs';
import { RECIPES } from '../src/domain/catalog.ts';
import { ALCOHOL_PRODUCTS,bottleRestockCrystalCost } from '../src/domain/bottleCatalog.ts';
import { recipePurchase } from '../src/domain/economy.ts';
import { requiredRecipe } from '../src/domain/engine.ts';
import { createTelegramBot, TelegramBotError } from '../server/telegramBot.mjs';
import { COSMETICS } from '../src/domain/cosmetics.ts';

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
  return { repository, service: createGameService({ repository, checkEnglish, now }) };
}

test('A duplicate roulette cosmetic is transferred to another real player account', async () => {
  const { repository,service } = makeService(() => Date.UTC(2026,8,30));
  const senderIdentity = identity(301);
  const recipientIdentity = identity(302);
  const sender = await service.session(senderIdentity);
  const recipient = await service.session(recipientIdentity);
  const cosmetic = COSMETICS[0];
  const row = repository.states.get(sender.player.id);
  row.state.ownedCosmeticIds.push(cosmetic.id);
  row.state.cosmeticCopies[cosmetic.id] = 1;
  repository.states.set(sender.player.id,row);
  const sent = await act(service,{type:'giftCosmetic',cosmeticId:cosmetic.id,recipient:String(recipient.player.id)},requestId(),senderIdentity);
  assert.equal(sent.ok,true);
  assert.equal(sent.state.cosmeticCopies[cosmetic.id],0);
  const received = await service.session(recipientIdentity);
  assert.ok(received.state.ownedCosmeticIds.includes(cosmetic.id));
  assert.match(received.state.message,/gave you/i);
});
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

test('Telegram bot connects from one token and sends a Main Mini App launch link', async () => {
  const calls = [];
  const fakeFetch = async (url, options) => {
    const method = url.split('/').at(-1);
    const payload = JSON.parse(options.body);
    calls.push({ url, method, payload });
    const result = method === 'getMe' ? { id: 123456, is_bot: true, username: 'BarLingoBot', has_main_web_app: true } : true;
    return { ok: true, json: async () => ({ ok: true, result }) };
  };
  const bot = createTelegramBot({ token: BOT_TOKEN, fetchImpl: fakeFetch, logger: { error() {} } });
  const status = await bot.start({ enablePolling: false });
  assert.equal(status.connected, true);
  assert.equal(status.id, 123456);
  assert.equal(status.username, 'BarLingoBot');
  assert.equal(status.mainMiniApp, true);
  assert.ok(calls.some((call) => call.method === 'setMyCommands'));
  assert.ok(calls.every((call) => call.url.includes(BOT_TOKEN)), 'the single token authenticates Bot API calls');

  await bot.handleUpdate({ update_id: 1, message: { text: '/start payload', chat: { id: 77, type: 'private' }, from: { first_name: 'Ana' } } });
  const welcome = calls.find((call) => call.method === 'sendMessage');
  assert.match(welcome.payload.text, /Welcome, Ana/);
  assert.equal(welcome.payload.reply_markup.inline_keyboard[0][0].url, 'https://t.me/BarLingoBot?startapp');
  await bot.stop();
});

test('Telegram bot rejects an invalid BotFather token without exposing it', async () => {
  const fetchImpl = async () => ({ ok: false, json: async () => ({ ok: false, description: 'Unauthorized' }) });
  const bot = createTelegramBot({ token: 'secret-token', fetchImpl, logger: { error() {} } });
  await assert.rejects(() => bot.start({ enablePolling: false }), TelegramBotError);
  assert.equal(bot.status().connected, false);
  assert.equal(bot.status().error, 'Unauthorized');
  assert.ok(!bot.status().error.includes('secret-token'));
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
  assert.equal(first.state.money, state.money + 100);
  const again = await act(service, { type: 'claimDaily' });
  assert.equal(again.ok, false, 'a second claim the same day is refused');
  assert.equal(again.state.money, first.state.money);
  assert.equal(repository.ledger.filter((entry) => entry.action === 'claimDaily').length, 1);
});

test('Crystal purchases and rewards are server-authoritative and fully ledgered', async () => {
  let clock = 1_800_000_000_000;
  const { service, repository } = makeService(() => clock);
  const first = await service.session(identity(88));
  const stored = repository.states.get(first.player.id).state;
  stored.crystals = 5000;
  repository.states.get(first.player.id).state = stored;

  assert.equal((await act(service,{type:'setCrystals',crystals:999999},requestId(),identity(88))).ok,false);
  const exchangeId = requestId();
  const exchanged = await act(service,{type:'exchangeCrystals',crystals:50},exchangeId,identity(88));
  assert.equal(exchanged.ok,true);assert.equal(exchanged.state.crystals,4950);assert.equal(exchanged.state.money,first.state.money + 1350);
  const replayedExchange = await act(service,{type:'exchangeCrystals',crystals:50},exchangeId,identity(88));
  assert.deepEqual(replayedExchange,exchanged,'a replayed exchange cannot mint more coins');
  assert.equal((await act(service,{type:'exchangeCrystals',crystals:11},requestId(),identity(88))).ok,false,'custom client rates are refused');
  const interior = await act(service,{type:'buyInterior',interiorId:'garden'},requestId(),identity(88));
  assert.equal(interior.ok,true);assert.ok(interior.state.ownedInteriorIds.includes('garden'));assert.equal(interior.state.bars[interior.state.regionId].interior,'garden');

  const locked = RECIPES.find((recipe,index) => index >= 10 && recipePurchase(recipe,index).currency === 'crystals');
  const recipeCost = recipePurchase(locked,RECIPES.indexOf(locked)).amount;
  const beforeRecipe = interior.state.crystals;
  const learned = await act(service,{type:'buyRecipe',recipeId:locked.id},requestId(),identity(88));
  assert.equal(learned.ok,true);assert.equal(learned.state.crystals,beforeRecipe - recipeCost);assert.ok(learned.state.knownRecipeIds.includes(locked.id));

  const product = ALCOHOL_PRODUCTS.find((item) => bottleRestockCrystalCost(item) > 0);
  const beforeStock = learned.state.bottleInventories[learned.state.regionId].find((item) => item.productId === product.id).quantity;
  const beforeRestock = learned.state.crystals;
  const restocked = await act(service,{type:'buyBottleStock',productId:product.id,quantity:2},requestId(),identity(88));
  assert.equal(restocked.ok,true);assert.equal(restocked.state.crystals,beforeRestock - bottleRestockCrystalCost(product) * 2);
  assert.equal(restocked.state.bottleInventories[restocked.state.regionId].find((item) => item.productId === product.id).quantity,beforeStock + 2);

  for (const guest of restocked.state.customers) await act(service,{type:'rejectCustomer',customerId:guest.id},requestId(),identity(88));
  const waiting = (await service.session(identity(88))).state;
  const beforeArrival = waiting.crystals;
  const welcomed = await act(service,{type:'expediteCustomer'},requestId(),identity(88));
  assert.equal(welcomed.ok,true);assert.equal(welcomed.state.customers.length,1);assert.ok(welcomed.state.crystals < beforeArrival);

  const crystalDelta = repository.crystalLedger.reduce((sum,entry) => sum + entry.delta,0);
  assert.equal(crystalDelta,welcomed.state.crystals - 5000,'every crystal purchase is recorded in the premium-currency ledger');
  assert.equal(repository.ledger.filter((entry) => entry.action === 'exchangeCrystals').length,1,'the coin side of an exchange is ledgered once');
});

test('English XP is decided by the server checker and capped per guest; wrong confirmations are refused', async () => {
  const { service } = makeService();
  const { state } = await service.session(identity());
  const guest = state.customers[0];
  assert.equal((await act(service, { type: 'say', text: 'Do you like sweet drinks?' })).ok, false, 'no conversation open');
  await act(service, { type: 'openConversation', customerId: guest.id });
  const xp = (await act(service, { type: 'tick' })).state.xp;
  const wrong = await act(service, { type: 'say', text: 'do you likes sweet drinks' });
  assert.equal(wrong.state.xp, xp, 'incorrect English earns nothing, whatever the client claims');
  let last = wrong.state.xp;
  for (let index = 0; index < 12; index++) last = (await act(service, { type: 'say', text: 'Do you like sweet drinks?' })).state.xp;
  assert.ok(last <= xp + 6 * 3 + 10, 'only six correct sentences per guest earn XP (plus one confirmed order)');
  for (const type of ['sentence', 'confirmOrder', 'confirmBottle', 'wrongGuess', 'switchServeBrand']) {
    assert.equal((await act(service, { type, customerId: guest.id, recipeId: guest.orderRecipeId, text: 'Hi there.' })).ok, false, `${type} is not a client action`);
  }
});

test('The conversation runs on the server: orders stay secret until found out in English', async () => {
  const { service, repository } = makeService();
  const first = await service.session(identity());
  const stored = repository.states.get(first.player.id).state;
  const secret = stored.customers[0];
  // A champagne guest: “Clicquot” should be understood as Veuve Clicquot, and the server confirms the order itself.
  const product = ALCOHOL_PRODUCTS.find((item) => item.id === 'veuve-clicquot-yellow');
  Object.assign(secret, { orderKind: 'bottle', orderRevealed: false, bottleRequest: { productId: product.id, quantity: 1, budget: 200, type: 'champagne', tastes: ['dry'], occasion: 'dinner' } });
  stored.bottleInventories[stored.regionId].find((item) => item.productId === product.id).quantity = 3;
  repository.states.get(first.player.id).state = stored;

  const shown = (await service.session(identity())).state.customers[0];
  assert.ok(!shown.orderRevealed);
  assert.equal(shown.orderRecipeId, '', 'the hidden recipe is not sent');
  assert.equal(shown.bottleRequest, undefined, 'the hidden bottle request is not sent');
  assert.ok(shown.wish, 'the guest still says what they wish for');

  const opened = await act(service, { type: 'openConversation', customerId: secret.id });
  assert.equal(opened.state.conversations[secret.id].lines.length, 1, 'the guest opens the conversation');
  const answer = await act(service, { type: 'say', text: 'Would you like Clicquot?' });
  const guest = answer.state.customers.find((item) => item.id === secret.id);
  const lines = answer.state.conversations[secret.id].lines;
  assert.equal(lines.at(-2).text, 'Would you like Clicquot?');
  assert.match(lines.at(-1).text, /Veuve Clicquot/);
  assert.equal(guest.orderRevealed, true);
  assert.equal(guest.selectedBottleId, product.id);
  assert.equal(guest.bottleRequest.productId, product.id, 'a found-out order is visible');
  assert.equal((await act(service, { type: 'sellBottle' })).ok, true);
});

test('Guests arrive only on the server clock; a client cannot summon customers', async () => {
  let clock = Date.now();
  const { service } = makeService(() => clock);
  const { state } = await service.session(identity());
  for (const guest of state.customers) await act(service, { type: 'rejectCustomer', customerId: guest.id });
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
