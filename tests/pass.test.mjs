import test from 'node:test';
import assert from 'node:assert/strict';
import { COSMETICS } from '../src/domain/cosmetics.ts';
import {
  PASS_DAYS, PASS_LEVELS, PASS_STYLES_LEVEL, PASS_LEVEL_POINTS, PASS_LEVEL_PRICE, PASS_SOURCES, PASS_POINTS, PASS_MS, PASS_PREMIUM_PRICE, PASS_THEMES, passEndsOf, passIdOf, passLevel, passPointsFor, passRewards, passStartsOf, passThemeOf, sharedPassId, sharedPassStart, themeStyleIds
} from '../src/domain/pass.ts';
import { INTERIORS } from '../src/data/cosmetics/bars.ts';
import { applyAction } from '../src/sim/rules.ts';
import { passLevelOf, passPoints } from '../src/sim/pass.ts';
import { capacityOf, grantReward } from '../src/sim/loot.ts';
import { createInitialState, normalizePlayerState } from '../src/sim/state.ts';

const T0 = Date.UTC(2026, 9, 2, 12);                   // any day: a player's pass starts when the game first sees them
const context = (now = T0, random = () => .5) => ({ now, random, checkEnglish: (text) => ({ ok: true, corrected: text }) });
const fresh = (now = T0) => { const state = createInitialState(now); state.startingBarChosen = true; return state; };
const act = (state, action, now = T0) => applyAction(state, action, context(now));
// Plays: the same counters the real rules raise (a serve, a lesson …), so the pass sees normal play.
const play = (state, stats) => { for (const [key, amount] of Object.entries(stats)) state.loot.stats[key] = (state.loot.stats[key] ?? 0) + amount; };

test('A pass runs 14 days from the player\'s own start and then moves to the next season', () => {
  assert.equal(PASS_DAYS, 14);
  const start = T0;
  assert.equal(passStartsOf(start, start + 3 * 24 * 3600 * 1000), start);
  assert.equal(passEndsOf(start, start) - passStartsOf(start, start), PASS_MS);
  assert.equal(passIdOf(start, start), passIdOf(start, start + 5 * 24 * 3600 * 1000));
  assert.notEqual(passIdOf(start, start), passIdOf(start, start + PASS_MS));
  const seen = PASS_THEMES.map((_, cycle) => passThemeOf(start, start + cycle * PASS_MS).id);
  assert.deepEqual(seen, PASS_THEMES.map((theme) => theme.id), 'the rotation goes through the seasons in order');
  assert.equal(passThemeOf(start, start + PASS_THEMES.length * PASS_MS).id, PASS_THEMES[0].id, 'then it starts again');
  assert.equal(passThemeOf(start, start - 5 * PASS_MS).id, PASS_THEMES[0].id, 'a clock that runs backwards never goes before the first season');
});

test('Every season gives a costume for each bartender at level 14 and its background at level 20, all of which exist', () => {
  for (const theme of PASS_THEMES) {
    assert.ok(INTERIORS.some((item) => item.id === theme.interior), theme.id);
    for (const id of themeStyleIds(theme)) assert.ok(COSMETICS.some((item) => item.id === id), id);
    const rows = passRewards(theme);
    assert.equal(rows.length, PASS_LEVELS);
    const styles = rows[PASS_STYLES_LEVEL - 1];
    const last = rows.at(-1);
    assert.equal(PASS_STYLES_LEVEL, 14);
    assert.ok(styles.free.some((reward) => reward.kind === 'cosmetics' && reward.ids.length === 2), 'the two costumes come at level 14');
    assert.ok(last.free.some((reward) => reward.kind === 'interior' && reward.id === theme.interior), 'the background comes at level 20');
    assert.ok(!last.free.some((reward) => reward.kind === 'cosmetics') && !styles.free.some((reward) => reward.kind === 'interior'), 'each prize on its own level');
    assert.ok(rows.every((row) => row.free.length >= 1 && row.premium.length >= 1), 'every level has a free and a premium reward');
  }
});

test('Points come from normal play since the pass began, and set the level', () => {
  const state = fresh();
  play(state, { serves: 100, lessons: 3 });                 // before the first action of the pass: not counted
  act(state, { type: 'tick' });
  assert.equal(state.pass.epoch, T0, 'the player\'s own clock starts at their first action');
  assert.equal(state.pass.id, passIdOf(T0, T0));
  assert.equal(passPoints(state), 0, 'what was done before the pass began does not count');
  play(state, { serves: 20, vips: 2, lessons: 1 });         // 40 + 12 + 12 = 64
  assert.equal(passPoints(state), 64);
  assert.equal(passLevelOf(state), 0);
  play(state, { serves: 6 });                               // 76 points -> level 1
  assert.equal(passLevelOf(state), 1);
  assert.equal(passLevel(PASS_LEVEL_POINTS * 50), PASS_LEVELS, 'capped at the last level');
  assert.equal(passPointsFor({ serves: 5 }, { serves: 9 }), 0, 'never negative');
});

test('Claiming: the level must be reached, each reward once, the premium track only after it is bought', () => {
  const state = fresh();
  act(state, { type: 'tick' });
  assert.throws(() => act(state, { type: 'claimPass', track: 'free', level: 1 }), /Reach pass level 1/);
  play(state, { serves: 100 });                              // 200 points -> level 2
  const coinsBefore = state.money;
  act(state, { type: 'claimPass', track: 'free', level: 1 });
  assert.ok(state.money > coinsBefore, 'level 1 pays coins');
  assert.throws(() => act(state, { type: 'claimPass', track: 'free', level: 1 }), /already claimed/);
  assert.throws(() => act(state, { type: 'claimPass', track: 'free', level: 3 }), /Reach pass level 3/);
  assert.throws(() => act(state, { type: 'claimPass', track: 'premium', level: 1 }), /premium track/);
  assert.throws(() => act(state, { type: 'claimPass', track: 'gold', level: 1 }), /Unknown pass reward/);
  assert.throws(() => act(state, { type: 'buyPassPremium' }), /crystals/);
  state.crystals = PASS_PREMIUM_PRICE + 5;
  act(state, { type: 'buyPassPremium' });
  assert.equal(state.crystals, 5);
  assert.throws(() => act(state, { type: 'buyPassPremium' }), /already have/);
  const stock = () => state.inventories[state.regionId].reduce((sum, item) => sum + item.amount, 0);
  const before = stock();
  act(state, { type: 'claimPass', track: 'premium', level: 1 });      // a small pack of supplies
  assert.ok(stock() > before, 'the supplies reached the storeroom');
});

test('Level 14 gives both costumes and level 20 the background; costumes already owned turn into shards', () => {
  const state = fresh();
  act(state, { type: 'tick' });
  play(state, { serves: 1000 });
  const theme = PASS_THEMES[0];   // a new player begins with the first season
  for (let level = 1; level < PASS_STYLES_LEVEL; level++) act(state, { type: 'claimPass', track: 'free', level });
  assert.ok(!state.ownedInteriorIds.includes(theme.interior), 'no background before level 20');
  act(state, { type: 'claimPass', track: 'free', level: PASS_STYLES_LEVEL });
  assert.match(state.message, /costumes/);
  for (const id of themeStyleIds(theme)) assert.ok(state.ownedCosmeticIds.includes(id), id);
  for (let level = PASS_STYLES_LEVEL + 1; level < PASS_LEVELS; level++) act(state, { type: 'claimPass', track: 'free', level });
  assert.ok(!state.ownedInteriorIds.includes(theme.interior), 'the background waits for level 20');
  act(state, { type: 'claimPass', track: 'free', level: PASS_LEVELS });
  assert.ok(state.ownedInteriorIds.includes(theme.interior), 'the background');
  assert.match(state.message, /background/);
  // Someone who already owns a costume gets shards for it instead of nothing.
  const owner = fresh();
  act(owner, { type: 'tick' });
  play(owner, { serves: 1000 });
  owner.ownedCosmeticIds.push(themeStyleIds(theme)[0]);
  const shards = Object.values(owner.loot.styleShards).reduce((a,b)=>a+b,0);
  for (let level = 1; level <= PASS_LEVELS; level++) act(owner, { type: 'claimPass', track: 'free', level });
  assert.ok(Object.values(owner.loot.styleShards).reduce((a,b)=>a+b,0) >= shards + 10);
});

test('A new two-week pass starts clean: counters from that moment, no claims, no premium', () => {
  const state = fresh();
  act(state, { type: 'tick' });
  play(state, { serves: 100 });
  state.crystals = 500;
  act(state, { type: 'buyPassPremium' });
  act(state, { type: 'claimPass', track: 'free', level: 1 });
  const later = T0 + PASS_MS;
  act(state, { type: 'tick' }, later);
  assert.equal(state.pass.id, passIdOf(T0, later));
  assert.deepEqual(state.pass.claimed, []);
  assert.equal(state.pass.premium, false);
  assert.equal(passPoints(state), 0);
  play(state, { serves: 40 });
  assert.equal(passLevelOf(state), 1);
});

test('A damaged pass in a save is cleaned up', () => {
  const state = fresh();
  state.pass = { id: 12345, base: { serves: -5, vips: 'x', bottles: 7.9 }, premium: 'yes', claimed: ['f1', 'f1', 'x9', 7, 'p20'] };
  normalizePlayerState(state);
  assert.equal(state.pass.id, '');
  assert.deepEqual(state.pass.base, { bottles: 7 });
  assert.equal(state.pass.premium, false);
  assert.deepEqual(state.pass.claimed.sort(), ['f1', 'p20']);
});

test('Crystals and every kind of shard are premium rewards only; the free track has none', () => {
  const rows = passRewards(PASS_THEMES[0]);
  const premium = rows.flatMap((row) => row.premium);
  const free = rows.flatMap((row) => row.free);
  const currency = ['crystals', 'stylePieces', 'skinShards', 'companionShards', 'itemShards'];
  assert.ok(free.every((reward) => !currency.includes(reward.kind)), 'nothing of the kind on the free track');
  for (const kind of ['crystals', 'stylePieces', 'skinShards', 'companionShards']) assert.ok(premium.some((reward) => reward.kind === kind), `premium has ${kind}`);
  assert.ok(rows.every((row) => row.premium.length >= 1));
  const total = (kind) => premium.filter((reward) => reward.kind === kind).reduce((sum, reward) => sum + (reward.amount ?? 1), 0);
  assert.equal(total('prestige'), 10, 'ten prestige over the pass');
  assert.ok(total('coins') >= 3000 && total('supplies') >= 6 && total('consumable') >= 10);
  assert.ok(total('crystals') < PASS_PREMIUM_PRICE, 'the premium crystals do not pay the price back');
  assert.ok(PASS_PREMIUM_PRICE >= 400, 'the premium track is not cheap');
});

test('Supplies fill the storeroom with what the known recipes use, and never past what it holds', () => {
  const state = fresh();
  const shelf = () => state.inventories[state.regionId];
  const used = new Set(['white-rum', 'lime-juice', 'mint', 'sugar-syrup', 'soda', 'ice', 'lime-wedge']);
  for (const item of shelf()) item.amount = 0;
  grantReward(state, { kind: 'supplies', size: 'small' }, () => .5);
  const after = Object.fromEntries(shelf().map((item) => [item.ingredientId, item.amount]));
  for (const id of used) assert.ok(after[id] > 0, `${id} was stocked`);
  assert.equal(after['dark-rum'], 0, 'nothing for a recipe the player does not know');
  grantReward(state, { kind: 'supplies', size: 'large' }, () => .5);
  for (let i = 0; i < 40; i++) grantReward(state, { kind: 'supplies', size: 'large' }, () => .5);
  for (const item of shelf()) assert.ok(item.amount <= capacityOf(state, state.regionId, item.ingredientId), `${item.ingredientId} stays within the storeroom`);
  assert.match(grantReward(state, { kind: 'supplies', size: 'large' }, () => .5), /already full/);
});

// What a free player earns in the 14 days of a pass, by the days they play: the daily reward (with its streak), the
// three lessons, the three wheel spins, two weeks of weekly quests (one for every two days played, up to three a
// week) and the free track's crystals as the levels are reached.
async function earned(days) {
  const { dailyCrystalsFor } = await import('../src/domain/economy.ts');
  const { learningStreakBonus } = await import('../src/domain/dailyLessons.ts');
  const FREE_CRYSTALS = { 3: 10, 7: 15, 10: 20, 15: 20, 19: 25, 20: 30 };
  let streak = 0, total = 0, points = 0;
  const week = [0, 0];
  for (let day = 0; day < 14; day++) {
    if (!days.includes(day)) { streak = 0; continue; }
    streak++; week[day < 7 ? 0 : 1]++;
    total += dailyCrystalsFor(streak) + 3 * 2.5 * (1 + learningStreakBonus(streak)) + 3 * 1.66;
    points += 100;
  }
  for (const played of week) total += Math.min(3, Math.floor(played / 2)) * 23.3;
  const level = Math.min(PASS_LEVELS, Math.floor(points / PASS_LEVEL_POINTS));
  for (const [at, amount] of Object.entries(FREE_CRYSTALS)) if (level >= Number(at)) total += amount;
  return total;
}

test('Only a free player who plays about nine days in ten, weeklies included, can afford the premium track', async () => {
  const days = (miss) => Array.from({ length: 14 }, (_, day) => day).filter((day) => !miss.includes(day));
  const diligent = await earned(days([6]));                  // 13 of 14 days
  const regular = await earned(days([1, 5, 9, 12]));         // 10 of 14 days
  const casual = await earned(days([1, 2, 4, 5, 8, 9, 11]));  // 7 of 14 days
  assert.ok(diligent >= PASS_PREMIUM_PRICE, `a diligent player earns ${Math.round(diligent)} for ${PASS_PREMIUM_PRICE}`);
  assert.ok(regular < PASS_PREMIUM_PRICE, `playing 10 days in 14 earns only ${Math.round(regular)}`);
  assert.ok(casual < PASS_PREMIUM_PRICE * .6, `a casual player earns ${Math.round(casual)}`);
});

test('Passes are built only on games; the costumes come from the same game as the background', async () => {
  const { THEMED_INTERIOR_COSTUMES } = await import('../src/data/cosmetics/themedBars.ts');
  const generic = ['underwater', 'underground', 'fairy', 'fairytale'];                 // themed, but not based on a game
  const games = Object.keys(THEMED_INTERIOR_COSTUMES).filter((id) => !generic.includes(id));
  assert.ok(PASS_THEMES.length >= 3 && PASS_THEMES.length <= games.length, `${PASS_THEMES.length} of ${games.length} game themes`);
  for (const theme of PASS_THEMES) {
    assert.ok(games.includes(theme.interior), `${theme.id} is a game theme`);
    assert.ok(THEMED_INTERIOR_COSTUMES[theme.interior].noa.includes(theme.noa), `${theme.id}: Noa's costume is from the game`);
    assert.ok(THEMED_INTERIOR_COSTUMES[theme.interior].leo.includes(theme.leo), `${theme.id}: Leo's costume is from the game`);
  }
  assert.equal(new Set(PASS_THEMES.map((theme) => theme.interior)).size, PASS_THEMES.length, 'no game twice');
});

test('New players start the rotation from the first season, whatever the date on the server', () => {
  // Two players who join months apart each begin with the first season and then follow the same order.
  const early = fresh(T0), late = fresh(T0 + 90 * 24 * 3600 * 1000);
  act(early, { type: 'tick' }, T0);
  act(late, { type: 'tick' }, T0 + 90 * 24 * 3600 * 1000);
  assert.equal(passThemeOf(early.pass.epoch, T0).id, PASS_THEMES[0].id);
  assert.equal(passThemeOf(late.pass.epoch, T0 + 90 * 24 * 3600 * 1000).id, PASS_THEMES[0].id);
  const day = T0 + 100 * 24 * 3600 * 1000;
  assert.notEqual(passThemeOf(early.pass.epoch, day).id, passThemeOf(late.pass.epoch, day).id, 'on the same date each player is in their own season');
  // Each player\'s second pass is the second season, 14 days after their own start.
  act(late, { type: 'tick' }, late.pass.epoch + PASS_MS);
  assert.equal(passThemeOf(late.pass.epoch, late.pass.epoch + PASS_MS).id, PASS_THEMES[1].id);
  assert.equal(late.pass.id, 'pass-1');
  // The first order is the announced one.
  assert.deepEqual(PASS_THEMES.slice(0, 4).map((theme) => theme.id), ['lost-ark', 'lineage-2', 'warcraft-3', 'mass-effect']);
  assert.equal(PASS_THEMES.at(-1).id, 'assassins-creed', 'new seasons are added at the end');
});

test('A player who was already in the shared pass keeps it as their own first pass, with their claims; a lapsed one starts fresh', () => {
  const now = T0;
  const kept = fresh(now);
  kept.pass = { id: sharedPassId(now), base: { serves: 3 }, premium: true, claimed: ['f1', 'p1'] };   // a save from before the pass was per player
  kept.loot.stats.serves = 3;
  act(kept, { type: 'tick' }, now);
  assert.equal(kept.pass.epoch, sharedPassStart(now), 'their pass keeps its real start');
  assert.equal(kept.pass.id, passIdOf(kept.pass.epoch, now));
  assert.equal(kept.pass.premium, true);
  assert.deepEqual(kept.pass.claimed, ['f1', 'p1']);
  assert.equal(passThemeOf(kept.pass.epoch, now).id, PASS_THEMES[0].id);
  const lapsed = fresh(now);
  lapsed.pass = { id: 'pass-3', base: { serves: 9 }, premium: true, claimed: ['f1'] };
  act(lapsed, { type: 'tick' }, now);
  assert.equal(lapsed.pass.epoch, now, 'a pass that ended long ago is not carried over');
  assert.deepEqual(lapsed.pass.claimed, []);
  assert.equal(lapsed.pass.premium, false);
});

test('Game backgrounds that are not a pass season are kept for boxes: not for sale, not giftable, in the box pool', async () => {
  const { BOX_ONLY_GAME_IDS, BOX_INTERIOR_IDS, isEventInterior } = await import('../src/data/cosmetics/bars.ts');
  const { giftPrice } = await import('../src/sim/gifts.ts');
  const { grantReward } = await import('../src/sim/loot.ts');
  const { styleSource, INTERIOR_STYLE } = await import('../src/data/cosmetics/styleSources.ts');
  assert.equal(BOX_ONLY_GAME_IDS.length, 7);
  for (const id of BOX_ONLY_GAME_IDS) {
    assert.ok(INTERIORS.some((item) => item.id === id), id);
    assert.ok(!PASS_THEMES.some((theme) => theme.interior === id), `${id} is a pass season: take it off the box-only list`);
    assert.ok(isEventInterior(id) && BOX_INTERIOR_IDS.includes(id), `${id} is in the box pool`);
    assert.equal(giftPrice({ kind: 'interior', interiorId: id }), undefined, `${id} cannot be gifted`);
    const state = fresh();
    state.crystals = 1e6;
    assert.throws(() => act(state, { type: 'buyInterior', interiorId: id }), /special event/, `${id} cannot be bought`);
    assert.equal(styleSource(INTERIOR_STYLE[id].character, INTERIOR_STYLE[id].value), 'background');
  }
  // A box can give one of them, together with its connected style.
  const state = fresh();
  const owned = () => BOX_ONLY_GAME_IDS.filter((id) => state.ownedInteriorIds.includes(id));
  for (let i = 0; i < 40 && owned().length < BOX_ONLY_GAME_IDS.length; i++) grantReward(state, { kind: 'eventInterior' }, () => (i * 0.137) % 1);
  assert.ok(owned().length >= 1, 'the box pool reaches these backgrounds');
  for (const id of owned()) assert.ok(state.ownedCosmeticIds.includes(`bartender:${INTERIOR_STYLE[id].value}:${INTERIOR_STYLE[id].character}`), `${id} brought its style`);
});

test('The box pool lists every background once', async () => {
  const { BOX_INTERIOR_IDS } = await import('../src/data/cosmetics/bars.ts');
  assert.equal(new Set(BOX_INTERIOR_IDS).size, BOX_INTERIOR_IDS.length);
});

test('On the server a new player\'s pass starts with their first visit, whatever the date is', async () => {
  const { createGameService } = await import('../server/gameService.mjs');
  const { createMemoryRepository } = await import('../server/playerRepository.mjs');
  const { checkEnglish } = await import('../server/english.mjs');
  let clock = Date.UTC(2026, 9, 2, 12);
  const repository = createMemoryRepository();
  const service = createGameService({ repository, checkEnglish, now: () => clock });
  const identity = (id) => ({ kind: 'dev', key: `dev:${id}`, telegramId: null, name: `P${id}`, username: null });
  const first = await service.session(identity(1));
  assert.equal(repository.states.get(first.player.id).state.pass.epoch, clock, 'the clock starts at the first visit');
  assert.equal(first.state.pass.id, 'pass-0');
  clock += 200 * 24 * 3600 * 1000;                                    // much later, a different player joins
  const second = await service.session(identity(2));
  assert.equal(repository.states.get(second.player.id).state.pass.id, 'pass-0', 'a new player is in their first pass');
  assert.equal(passThemeOf(repository.states.get(second.player.id).state.pass.epoch, clock).id, PASS_THEMES[0].id, 'with the first season');
  const back = await service.session(identity(1));                    // the first player returns 200 days later
  assert.notEqual(back.state.pass.id, 'pass-0');
  assert.equal(back.state.pass.epoch, repository.states.get(first.player.id).state.pass.epoch, 'their own clock did not move');
});

test('The number of pass rewards ready to claim counts reached, unclaimed levels, and premium ones only once bought', async () => {
  const { readyPassRewards } = await import('../src/domain/pass.ts');
  assert.equal(readyPassRewards(0, false, []), 0, 'nothing before level 1');
  assert.equal(readyPassRewards(3, false, []), 3, 'three free rewards');
  assert.equal(readyPassRewards(3, true, []), 6, 'and three premium ones after buying it');
  assert.equal(readyPassRewards(3, true, ['f1', 'p1', 'f2']), 3, 'claimed ones do not count');
  assert.equal(readyPassRewards(99, true, []), PASS_LEVELS * 2, 'never past the last level');
  assert.equal(readyPassRewards(20, false, Array.from({ length: PASS_LEVELS }, (_, i) => `f${i + 1}`)), 0, 'all free rewards claimed');
});

test('Crystals buy levels: each fills the rest of the current level, the price is flat, and a new pass starts without the bonus', () => {
  const state = fresh();
  act(state, { type: 'tick' });
  play(state, { serves: 10 });                                // 20 points, level 0
  state.crystals = PASS_LEVEL_PRICE * 3;
  assert.throws(() => act(state, { type: 'buyPassLevels', count: 0 }), /Choose how many/);
  act(state, { type: 'buyPassLevels', count: 1 });
  assert.equal(passLevelOf(state), 1);
  assert.equal(passPoints(state), PASS_LEVEL_POINTS, 'it lands exactly on the level');
  assert.equal(state.crystals, PASS_LEVEL_PRICE * 2);
  assert.throws(() => act(state, { type: 'buyPassLevels', count: 3 }), /crystals/, 'not enough for three');
  assert.equal(state.crystals, PASS_LEVEL_PRICE * 2, 'a refused purchase costs nothing');
  play(state, { serves: 5 });                                 // earned points stack on top
  assert.equal(passPoints(state), PASS_LEVEL_POINTS + 10);
  act(state, { type: 'claimPass', track: 'free', level: 1 });
  state.crystals = 100000;
  act(state, { type: 'buyPassLevels', count: PASS_LEVELS });  // more than are left: only the missing levels are bought
  assert.equal(passLevelOf(state), PASS_LEVELS);
  assert.equal(state.crystals, 100000 - (PASS_LEVELS - 1) * PASS_LEVEL_PRICE);
  assert.throws(() => act(state, { type: 'buyPassLevels', count: 1 }), /last level/);
  act(state, { type: 'tick' }, T0 + PASS_MS);
  assert.equal(state.pass.bonus, 0);
});

test('The pass screen lists exactly the things that give points', () => {
  assert.deepEqual(PASS_SOURCES.map((item) => item.stat).sort(), Object.keys(PASS_POINTS).sort());
});
