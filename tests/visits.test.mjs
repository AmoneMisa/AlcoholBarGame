import test from 'node:test';
import assert from 'node:assert/strict';
import { createGameService } from '../server/gameService.mjs';
import { createMemoryRepository } from '../server/playerRepository.mjs';
import { checkEnglish } from '../server/english.mjs';
import { dailyLessonsFor } from '../src/domain/dailyLessons.ts';
import { calendarDate } from '../src/domain/economy.ts';
import { weekOf } from '../src/domain/quests.ts';
import { BOX_ONLY_GAME_IDS } from '../src/data/cosmetics/bars.ts';
import { INTERIOR_STYLE } from '../src/data/cosmetics/styleSources.ts';
import { COSMETICS } from '../src/domain/cosmetics.ts';
import { shardStyles } from '../src/sim/loot.ts';

const identity = (id) => ({ kind: 'dev', key: `dev:${id}`, telegramId: null, name: `Player ${id}`, username: null });
let counter = 0;
const requestId = () => `visit-test-${++counter}-${Math.random().toString(36).slice(2, 10)}`;
const CLOCK = Date.UTC(2026, 8, 30, 12);

function setup(clock = () => CLOCK) {
  const repository = createMemoryRepository();
  return { repository, service: createGameService({ repository, checkEnglish, now: clock }) };
}
async function befriend(service, a, b) {
  const sa = await service.session(a), sb = await service.session(b);
  assert.equal((await service.addFriend(a, sb.player.friendCode)).status, 200);
  assert.equal((await service.answerFriend(b, sa.player.friendCode, true)).status, 200);
  return { sa, sb };
}
const earn = async (service, who, count) => {
  for (const lesson of dailyLessonsFor(calendarDate(new Date(CLOCK))).slice(0, count)) {
    assert.equal((await service.act(who, { requestId: requestId(), action: { type: 'completeDailyLesson', lessonId: lesson.id, answer: lesson.answer } })).body.ok, true);
  }
};

test('A friend sees the bar as it really is: the new background and the painted style, nothing private', async () => {
  const { repository, service } = setup();
  const ana = identity(501), ben = identity(502);
  const { sa, sb } = await befriend(service, ana, ben);
  const row = repository.states.get(sb.player.id);
  const bar = row.state.bars[row.state.regionId];
  const game = BOX_ONLY_GAME_IDS[0];
  row.state.ownedInteriorIds.push(game);
  row.state.ownedCosmeticIds.push(`bartender:${INTERIOR_STYLE[game].value}:${INTERIOR_STYLE[game].character}`);
  bar.interior = game;                                                        // a new game background
  bar.bartenderCharacter = INTERIOR_STYLE[game].character;
  bar.bartender = INTERIOR_STYLE[game].value;                               // and its connected style
  row.state.money = 123456;
  const visit = await service.visitFriend(ana, sb.player.friendCode);
  assert.equal(visit.status, 200);
  assert.equal(visit.body.friend.bar.interior, game);
  assert.equal(visit.body.friend.bar.bartender, INTERIOR_STYLE[game].value);
  assert.equal(visit.body.friend.bar.bartenderCharacter, INTERIOR_STYLE[game].character);
  const text = JSON.stringify(visit.body.friend);   // what the visitor learns about the friend
  assert.doesNotMatch(text, /123456/, 'money is never shown');
  assert.doesNotMatch(text, /crystals|customers|orderRecipeId/i, 'no hidden state');
  assert.equal(sa.player.id !== sb.player.id, true);
});

test('Two friends visiting each other at once both get their answer (the locks are taken in a fixed order)', async () => {
  const { service } = setup();
  const ana = identity(511), ben = identity(512);
  const { sa, sb } = await befriend(service, ana, ben);
  const [one, two] = await Promise.all([service.visitFriend(ana, sb.player.friendCode), service.visitFriend(ben, sa.player.friendCode)]);
  assert.equal(one.status, 200);
  assert.equal(two.status, 200);
  assert.equal(one.body.rewarded && two.body.rewarded, true, 'each visit pays the other one prestige');
});

test('Box-only items given to a friend during a visit leave the sender and arrive with the friend', async () => {
  const { repository, service } = setup();
  const ana = identity(521), ben = identity(522);
  const { sa, sb } = await befriend(service, ana, ben);
  const game = BOX_ONLY_GAME_IDS[1];
  const styleId = `bartender:${INTERIOR_STYLE[game].value}:${INTERIOR_STYLE[game].character}`;
  const mine = repository.states.get(sa.player.id).state;
  mine.ownedInteriorIds.push(game);
  mine.ownedCosmeticIds.push(styleId);
  const pile = shardStyles()[0].id;
  mine.loot.styleShards[pile] = 30;
  assert.equal((await service.sendGift(ana, sb.player.friendCode, { kind: 'style-shards', cosmeticId: pile, amount: 5 })).status, 403, 'no gift without a visit');
  await service.visitFriend(ana, sb.player.friendCode);
  const shards = await service.sendGift(ana, sb.player.friendCode, { kind: 'style-shards', cosmeticId: pile, amount: 25 });
  assert.equal(shards.status, 200);
  assert.equal(shards.body.state.loot.styleShards[pile], 5, 'the sender lost them');
  assert.equal((await service.sendGift(ana, sb.player.friendCode, { kind: 'style-shards', cosmeticId: pile, amount: 25 })).status, 409, 'and cannot give what is gone');
  const place = await service.sendGift(ana, sb.player.friendCode, { kind: 'interior-transfer', interiorId: game });
  assert.equal(place.status, 200);
  assert.ok(!place.body.state.ownedInteriorIds.includes(game) && !place.body.state.ownedCosmeticIds.includes(styleId), 'the sender lost the pair');
  const claimed = await service.claimGifts(ben);
  assert.equal(claimed.body.received.length, 2);
  assert.equal(claimed.body.state.loot.styleShards[pile], 25);
  assert.ok(claimed.body.state.ownedInteriorIds.includes(game) && claimed.body.state.ownedCosmeticIds.includes(styleId), 'the friend got both');
});

test('A look at a bar from the weekly board: read-only, the right bar, and a stranger sees no private lists', async () => {
  const { repository, service } = setup();
  const a = identity(531), b = identity(532), c = identity(533);
  const sa = await service.session(a), sb = await service.session(b);
  await service.session(c);
  await earn(service, a, 3);
  await earn(service, b, 2);
  const board = await service.leaderboard(c);
  assert.equal(board.top.length, 2);
  const first = board.top[0];
  const before = JSON.stringify(repository.states.get(sa.player.id).state);
  const view = await service.leaderboardBar(c, { scope: 'global', rank: first.rank, week: board.week, score: first.score });
  assert.equal(view.status, 200);
  assert.equal(view.body.ok, true);
  assert.equal(view.body.player.nickname, 'Noa');
  assert.equal(view.body.player.code, sa.player.friendCode);
  assert.equal(view.body.player.me, false);
  assert.equal(view.body.player.relationship, 'none');
  assert.equal(view.body.bar.name, first.label, 'it is the bar of the row that was tapped');
  assert.equal(view.body.score, first.score);
  assert.equal(JSON.stringify(repository.states.get(sa.player.id).state), before, 'looking changes nothing: no prestige, no visit mark');
  assert.equal('knownRecipeIds' in view.body.bar, false);
  assert.equal('ownedInteriorIds' in view.body.bar, false);
  assert.doesNotMatch(JSON.stringify(view.body), /Player 53/, 'account names are not exposed');
  const second = board.top[1];
  assert.equal((await service.leaderboardBar(c, { scope: 'global', rank: second.rank, week: board.week, score: second.score })).body.bar.name, second.label);
  void sb;
});

test('A stale or invented board row is refused instead of showing the wrong bar', async () => {
  const { service } = setup();
  const a = identity(541), b = identity(542);
  await service.session(a); await service.session(b);
  await earn(service, a, 3);
  const board = await service.leaderboard(b);
  const row = board.top[0];
  const view = (body) => service.leaderboardBar(b, body);
  assert.equal((await view({ scope: 'global', rank: row.rank, week: board.week - 1, score: row.score })).status, 409, 'an old week');
  assert.equal((await view({ scope: 'global', rank: row.rank, week: board.week, score: row.score + 1 })).status, 409, 'the score moved');
  assert.equal((await view({ scope: 'global', rank: 99, week: board.week, score: row.score })).status, 409, 'no such rank');
  assert.equal((await view({ scope: 'global', rank: 0, week: board.week })).status, 409);
  assert.equal((await view({ scope: 'global', rank: 'x', week: board.week })).status, 409);
  assert.equal(weekOf(CLOCK), board.week);
});

test('The friends board can be opened too, and only shows people who are on it', async () => {
  const { service } = setup();
  const a = identity(551), b = identity(552), stranger = identity(553);
  const { sb } = await befriend(service, a, b);
  await service.session(stranger);
  await earn(service, b, 2);
  await earn(service, stranger, 3);
  const board = await service.leaderboard(a, 'friends');
  assert.ok(board.top.some((row) => !row.me), 'the friend is on the friends board');
  const friendRow = board.top.find((row) => !row.me);
  const view = await service.leaderboardBar(a, { scope: 'friends', rank: friendRow.rank, week: board.week, score: friendRow.score });
  assert.equal(view.status, 200);
  assert.equal(view.body.player.relationship, 'accepted');
  assert.equal(view.body.player.code, sb.player.friendCode);
  assert.ok(view.body.bar.level >= 1);
  assert.ok(COSMETICS.length > 0 && sb.player.id > 0);
});
