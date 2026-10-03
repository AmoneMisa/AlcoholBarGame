import test from 'node:test';
import assert from 'node:assert/strict';
import { createInitialState, normalizePlayerState } from '../src/sim/state.ts';
import { applyAction, advanceClock } from '../src/sim/rules.ts';
import { BASE_TIP_CAP, TIP_ACCUMULATION_MS, accrueTips, depositTips, resetTips } from '../src/sim/tips.ts';
import { createGameService } from '../server/gameService.mjs';
import { createMemoryRepository } from '../server/playerRepository.mjs';
import { tipJarStage } from '../src/domain/tipJarVisual.ts';
const NOW = Date.UTC(2026, 9, 3, 12);
const identity = id => ({kind:'dev',key:`tips:${id}`,name:`Player ${id}`});
test('Jar artwork follows balance relative to capacity and resets after collection', () => {
  assert.deepEqual([0, 1, 19, 20, 39, 40, 59, 60, 90].map(amount => tipJarStage(amount, 60)), [0, 1, 1, 2, 2, 3, 3, 4, 4]);
  assert.equal(tipJarStage(60, 120), 2, 'capacity upgrades keep relative fullness');
  assert.equal(tipJarStage(57, 60), 3, 'theft lowers the visible balance');
  assert.equal(tipJarStage(0, 60), 0, 'manual collection empties the jar');
  assert.equal(tipJarStage(10, 0), 1);
});
function setup() {
  let time = NOW;
  const repository = createMemoryRepository();
  const service = createGameService({repository,checkEnglish:text=>({ok:true,corrected:text}),now:()=>time});
  return {repository,service,setTime:value=>{time=value;}};
}
async function connect(service, a, b) {
  const sa = await service.session(a), sb = await service.session(b);
  await service.addFriend(a,sb.player.friendCode);
  await service.answerFriend(b,sa.player.friendCode,true);
  await service.visitFriend(a,sb.player.friendCode);
  return {sa,sb};
}

test('Tips wait for manual collection, accumulate for only 12 hours and restart after collection', () => {
  const state = createInitialState(NOW), money = state.money;
  assert.equal(BASE_TIP_CAP,60);
  accrueTips(state,NOW+TIP_ACCUMULATION_MS/2);
  assert.equal(state.tipJar,30); assert.equal(state.money,money);
  accrueTips(state,NOW+TIP_ACCUMULATION_MS*4);
  assert.equal(state.tipJar,60); assert.equal(state.money,money);
  assert.equal(depositTips(state,10,NOW+TIP_ACCUMULATION_MS*4),0);
  applyAction(state,{type:'collectTips'},{now:NOW+TIP_ACCUMULATION_MS*4,training:true});
  assert.equal(state.money,money+60); assert.equal(state.tipJar,0);
  accrueTips(state,NOW+TIP_ACCUMULATION_MS*4.5);
  assert.equal(state.tipJar,30);
});

test('Guest tips share the capacity, old saves migrate, frequent ticks match one offline catch-up', () => {
  const a = createInitialState(NOW), b = createInitialState(NOW);
  for (let tick=1;tick<=600;tick++) accrueTips(a,NOW+tick*1000);
  accrueTips(b,NOW+600000);
  assert.equal(a.tipJar,b.tipJar);
  assert.equal(depositTips(a,100,NOW+600000),60);
  assert.equal(a.tipJar,60); assert.equal(depositTips(a,10,NOW+600000),0);
  delete b.tipJarStartedAt; delete b.tipJarDeposited; delete b.tipJarPassiveAccrued;
  b.tipJar=25;
  normalizePlayerState(b);
  assert.equal(b.tipJar,25); assert.equal(b.tipJarDeposited,25);
  const legacy = createInitialState(NOW);
  legacy.tipJar=90; delete legacy.tipJarDeposited;
  normalizePlayerState(legacy);
  assert.equal(legacy.tipJar,90,'existing tips above the new cap are not discarded');
  assert.equal(depositTips(legacy,5,NOW),0);
  const practice = createInitialState(NOW);
  advanceClock(practice,{now:NOW+TIP_ACCUMULATION_MS,training:true});
  assert.equal(practice.tipJar,0,'no passive rewards in training');
});

test('Theft requires a visit, transfers 5%, is atomic and remains limited after owner collects', async () => {
  const {service,repository,setTime} = setup();
  const a = identity(1), b = identity(2);
  const sa = await service.session(a), sb = await service.session(b);
  assert.equal((await service.stealFriendTips(a,sb.player.friendCode)).status,403);
  await service.addFriend(a,sb.player.friendCode); await service.answerFriend(b,sa.player.friendCode,true);
  assert.equal((await service.stealFriendTips(a,sb.player.friendCode)).status,403);
  const owner = repository.states.get(sb.player.id).state;
  depositTips(owner,60,NOW);
  await service.visitFriend(a,sb.player.friendCode);
  const results = await Promise.all([service.stealFriendTips(a,sb.player.friendCode),service.stealFriendTips(a,sb.player.friendCode)]);
  assert.deepEqual(results.map(r=>r.status).sort(),[200,409]);
  assert.equal(results.find(r=>r.status===200).body.stolen,3);
  assert.equal(repository.states.get(sb.player.id).state.tipJar,57);
  assert.equal(repository.states.get(sa.player.id).state.money,603);
  resetTips(repository.states.get(sb.player.id).state,NOW);
  depositTips(repository.states.get(sb.player.id).state,60,NOW);
  assert.equal((await service.stealFriendTips(a,sb.player.friendCode)).status,409);
  setTime(NOW+86400000);
  await service.visitFriend(a,sb.player.friendCode);
  assert.equal((await service.stealFriendTips(a,sb.player.friendCode)).status,200);
});

test('Ten daily attempts include empty jars, cannot be exceeded, and reset the next day', async () => {
  const {service,setTime} = setup();
  const visitor = identity(10);
  const codes = [];
  for (let i=0;i<11;i++) {
    const {sb} = await connect(service,visitor,identity(20+i)); codes.push(sb.player.friendCode);
    const result = await service.stealFriendTips(visitor,sb.player.friendCode);
    assert.equal(result.status,i<10?200:409);
    if (i<10) {assert.equal(result.body.stolen,0);assert.equal(result.body.tips.attemptsLeft,9-i);}
  }
  setTime(NOW+86400000);
  await service.visitFriend(visitor,codes[0]);
  const next = await service.stealFriendTips(visitor,codes[0]);
  assert.equal(next.status,200); assert.equal(next.body.tips.attemptsLeft,9);
});

test('Multiple visitors and later days can never steal the protected 30% of the collection cycle', async () => {
  const {service,repository,setTime} = setup();
  const owner = identity(100), session = await service.session(owner);
  depositTips(repository.states.get(session.player.id).state,60,NOW);
  for (let i=0;i<35;i++) {
    const visitor = identity(200+i);
    await connect(service,visitor,owner);
    await service.stealFriendTips(visitor,session.player.friendCode);
    assert.ok(repository.states.get(session.player.id).state.tipJar>=18);
  }
  assert.equal(repository.states.get(session.player.id).state.tipJar,19);
  setTime(NOW+86400000);
  await service.visitFriend(identity(200),session.player.friendCode);
  assert.equal((await service.stealFriendTips(identity(200),session.player.friendCode)).body.stolen,0);
  assert.equal(repository.states.get(session.player.id).state.tipJar,19);
});
