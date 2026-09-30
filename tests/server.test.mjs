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

test('Loot actions are audited, replayed request ids never charge twice, and concurrent draws cannot overspend', async () => {
  const { repository, service } = makeService(() => Date.UTC(2026, 8, 30));
  const who = identity(801);
  const session = await service.session(who);
  const row = repository.states.get(session.player.id);
  row.state.crystals = 60; // enough for one 50-crystal draw only
  row.state.loot.boxes = { bronze: 2 };
  repository.states.set(session.player.id, row);

  // A replayed request returns the stored answer instead of acting twice.
  const id = requestId();
  const first = await act(service, { type: 'openBox', box: 'bronze' }, id, who);
  const replay = await act(service, { type: 'openBox', box: 'bronze' }, id, who);
  assert.equal(first.ok, true);
  assert.deepEqual(replay, first);
  assert.equal(repository.states.get(session.player.id).state.loot.boxes.bronze, 1);

  // Two simultaneous draws with money for one: exactly one succeeds.
  const results = await Promise.all([
    act(service, { type: 'drawStyle', count: 1 }, requestId(), who),
    act(service, { type: 'drawStyle', count: 1 }, requestId(), who)
  ]);
  assert.equal(results.filter((item) => item.ok).length, 1);
  assert.equal(repository.states.get(session.player.id).state.crystals, 10);

  const draws = repository.lootLedger.filter((entry) => entry.action === 'drawStyle');
  assert.equal(draws.length, 1);
  assert.equal(draws[0].detail.results.length, 1);
  assert.ok(repository.lootLedger.some((entry) => entry.action === 'openBox'));
  assert.equal(repository.crystalLedger.filter((entry) => entry.action === 'drawStyle').reduce((sum, entry) => sum + entry.delta, 0), -50);
});

test('Friends can gift consumables and skin shards; limits, ownership and friendship are enforced', async () => {
  const { repository, service } = makeService(() => Date.UTC(2026, 8, 30, 12));
  const aId = identity(901), bId = identity(902), strangerId = identity(903);
  const a = await service.session(aId); const b = await service.session(bId); await service.session(strangerId);
  const row = repository.states.get(a.player.id);
  row.state.loot.consumables = { 'golden-ice': 1 };
  row.state.loot.skinShards = 12;
  repository.states.set(a.player.id, row);
  const addFriendResult = await service.addFriend(aId, b.player.friendCode);
  assert.ok(addFriendResult.status < 400);
  await service.answerFriend(bId, a.player.friendCode, true);
  await service.visitFriend(aId, b.player.friendCode);

  assert.equal((await service.sendGift(aId, b.player.friendCode, { kind: 'consumable', id: 'courier' })).body.ok, false, 'not owned');
  assert.equal((await service.sendGift(aId, b.player.friendCode, { kind: 'skin-shards', amount: 7 })).body.ok, false, 'invalid amount');
  assert.equal((await service.sendGift(aId, b.player.friendCode, { kind: 'skin-shards', amount: 20 })).body.ok, false, 'not enough shards');
  const sent = await service.sendGift(aId, b.player.friendCode, { kind: 'consumable', id: 'golden-ice' });
  assert.equal(sent.body.ok, true);
  assert.equal((await service.sendGift(aId, b.player.friendCode, { kind: 'skin-shards', amount: 10 })).body.ok, true);
  const received = await service.session(bId);
  assert.equal(received.state.loot.consumables['golden-ice'], 1);
  assert.equal(received.state.loot.skinShards, 10);
  const after = repository.states.get(a.player.id).state.loot;
  assert.equal(after.consumables['golden-ice'], undefined);
  assert.equal(after.skinShards, 2);
  assert.equal((await service.sendGift(strangerId, b.player.friendCode, { kind: 'skin-shards', amount: 5 })).body.ok, false, 'strangers cannot gift');
});

test('Weekly leaderboard: ranks by XP earned this week, shows bar names only, and pays last week\'s reward once from the server rank', async () => {
  const { weekOf, WEEK_MS } = await import('../src/domain/quests.ts');
  const { dailyLessonsFor } = await import('../src/domain/dailyLessons.ts');
  const { calendarDate } = await import('../src/domain/economy.ts');
  let clock = Date.UTC(2026, 8, 30, 12);
  const { repository, service } = makeService(() => clock);
  const a = identity(1001), b = identity(1002), c = identity(1003);
  const sa = await service.session(a), sb = await service.session(b), sc = await service.session(c);
  const lessons = dailyLessonsFor(calendarDate(new Date(clock)));
  for (const [who, count] of [[a, 3], [b, 2], [c, 1]]) for (const lesson of lessons.slice(0, count)) {
    assert.equal((await act(service, { type: 'completeDailyLesson', lessonId: lesson.id, answer: lesson.answer }, requestId(), who)).ok, true);
  }
  const week = weekOf(clock);
  let board = await service.leaderboard(a);
  assert.deepEqual(board.top.map((row) => row.me), [true, false, false]);
  assert.ok(board.top[0].score > board.top[1].score && board.top[1].score > board.top[2].score);
  assert.equal(board.me.rank, 1);
  assert.equal(board.top[0].label, repository.states.get(sa.player.id).state.bars['new-york'].name);
  assert.doesNotMatch(JSON.stringify(board), /Player 100/, 'account names are never exposed');
  assert.equal((await service.leaderboard(c)).me.rank, 3);

  // Set known final scores for the week, then move to the next week.
  await repository.transaction(async (tx) => {
    await tx.setWeeklyScore(Number(sa.player.id), week, { score: 500, label: 'Bar A', level: 5 });
    await tx.setWeeklyScore(Number(sb.player.id), week, { score: 400, label: 'Bar B', level: 5 });
    await tx.setWeeklyScore(Number(sc.player.id), week, { score: 100, label: 'Bar C', level: 5 });
  });
  clock += WEEK_MS;
  board = await service.leaderboard(a);
  assert.equal(board.top.length, 0, 'a new week starts empty');
  assert.equal(board.previous.rank, 1);
  assert.equal(board.previous.claimable, true);
  assert.equal(board.previous.tier, 'Champion');

  // A client cannot dictate its rank.
  const forged = await service.act(b, { requestId: requestId(), action: { type: 'claimLeaderboardReward', standing: { week: week, rank: 1, size: 1, score: 9999 } } });
  assert.equal(forged.body.ok, true);
  assert.equal(repository.states.get(sb.player.id).state.loot.boxes.gold ?? 0, 0, 'rank 2 gets podium rewards, not champion');
  assert.equal(repository.states.get(sb.player.id).state.loot.boxes.silver, 1);
  const crystalsB = repository.states.get(sb.player.id).state.crystals;
  assert.ok(crystalsB >= 30 && crystalsB < 60, 'podium crystals (plus lesson crystals), not the champion 60');

  const first = await act(service, { type: 'claimLeaderboardReward' }, requestId(), a);
  assert.equal(first.ok, true);
  const stateA = repository.states.get(sa.player.id).state;
  assert.equal(stateA.loot.boxes.choice, 1);
  assert.equal(stateA.loot.boxes.gold, 1);
  assert.ok(stateA.crystals >= 60);
  assert.equal((await act(service, { type: 'claimLeaderboardReward' }, requestId(), a)).ok, false, 'claimed once');
  assert.equal((await act(service, { type: 'claimLeaderboardReward' }, requestId(), c)).ok, false, 'too low a score');
  assert.equal((await service.leaderboard(a)).previous.claimable, false);
  assert.ok(repository.lootLedger.some((entry) => entry.action === 'claimLeaderboardReward'));

  // Two weeks later last week is empty for everyone: nothing to claim.
  clock += WEEK_MS;
  assert.equal((await act(service, { type: 'claimLeaderboardReward' }, requestId(), a)).ok, false);
});

test('Friends-only leaderboard lists me and accepted friends (even unscored), never strangers or pending requests', async () => {
  const { weekOf } = await import('../src/domain/quests.ts');
  const clock = Date.UTC(2026, 8, 30, 12);
  const { repository, service } = makeService(() => clock);
  const me = identity(1101), friend = identity(1102), quiet = identity(1103), stranger = identity(1104), pending = identity(1105);
  const sMe = await service.session(me), sFriend = await service.session(friend), sQuiet = await service.session(quiet), sStranger = await service.session(stranger), sPending = await service.session(pending);
  for (const other of [friend, quiet]) {
    const target = other === friend ? sFriend : sQuiet;
    assert.ok((await service.addFriend(me, target.player.friendCode)).status < 400);
    await service.answerFriend(other, sMe.player.friendCode, true);
  }
  await service.addFriend(me, sPending.player.friendCode); // never answered
  const week = weekOf(clock);
  await repository.transaction(async (tx) => {
    await tx.setWeeklyScore(Number(sMe.player.id), week, { score: 200, label: 'My Bar', level: 4 });
    await tx.setWeeklyScore(Number(sFriend.player.id), week, { score: 900, label: 'Friend Bar', level: 9 });
    await tx.setWeeklyScore(Number(sStranger.player.id), week, { score: 5000, label: 'Stranger Bar', level: 30 });
    await tx.setWeeklyScore(Number(sPending.player.id), week, { score: 4000, label: 'Pending Bar', level: 30 });
  });
  const global = await service.leaderboard(me);
  assert.equal(global.scope, 'global');
  assert.equal(global.top[0].label, 'Stranger Bar');

  const board = await service.leaderboard(me, 'friends');
  assert.equal(board.scope, 'friends');
  assert.deepEqual(board.top.map((row) => row.rank), [1, 2, 3]);
  assert.equal(board.top[0].score, 900, 'the friend leads');
  assert.equal(board.top[0].label, 'Player 1102', 'friends show their own names');
  assert.equal(board.top[1].me, true);
  assert.equal(board.top[2].score, 0, 'an unscored friend is still listed, last');
  assert.deepEqual(board.me, { week, rank: 2, size: 3, score: 200 });
  assert.doesNotMatch(JSON.stringify(board), /Stranger|Pending/);

  // A player with no friends sees only themselves.
  const alone = await service.leaderboard(stranger, 'friends');
  assert.equal(alone.top.length, 1);
  assert.equal(alone.top[0].me, true);
  // Unknown scopes fall back to the global board.
  assert.equal((await service.leaderboard(me, 'bogus')).scope, 'global');
});
