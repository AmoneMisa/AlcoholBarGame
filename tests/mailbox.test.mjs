const fragmentId='bartender:reference-kimono:noa';
import test from 'node:test';
import assert from 'node:assert/strict';
import { createGameService } from '../server/gameService.mjs';
import { createMemoryRepository } from '../server/playerRepository.mjs';
import { depositTips } from '../src/sim/tips.ts';
import { MAIL_LIFETIME } from '../src/sim/mailbox.ts';
import { deferEventRewards, claimEventRewards } from '../server/mailRewards.mjs';
import { createInitialState, normalizePlayerState } from '../src/sim/state.ts';
const NOW=Date.UTC(2026,9,3,12);
const who=id=>({kind:'dev',key:`mail:${id}`,name:`Player ${id}`});
function setup(){let clock=NOW;const repository=createMemoryRepository();const service=createGameService({repository,now:()=>clock});return {repository,service,setTime:value=>{clock=value;}};}
async function friends(service){const a=await service.session(who(1)),b=await service.session(who(2));await service.addFriend(who(1),b.player.friendCode);await service.answerFriend(who(2),a.player.friendCode,true);await service.visitFriend(who(1),b.player.friendCode);return {a,b};}

test('Visits and exact stolen amounts persist; login alerts remain until acknowledged and expire after 7 days',async()=>{
  const {repository,service,setTime}=setup();const {a,b}=await friends(service);
  depositTips(repository.states.get(b.player.id).state,60,NOW);
  const theft=await service.stealFriendTips(who(1),b.player.friendCode);
  assert.equal(theft.body.stolen,3);
  const thiefMail=theft.body.state.mailbox.find(item=>item.kind==='theft');assert.equal(thiefMail.amount,3);
  const login=await service.session(who(2));assert.equal(login.theftNotifications.length,1);assert.equal(login.theftNotifications[0].actorName,'Player 1');assert.equal(login.theftNotifications[0].amount,3);
  assert.equal((await service.session(who(2))).theftNotifications.length,1,'login does not silently acknowledge');
  await service.mailbox(who(1),[login.theftNotifications[0].id]);
  assert.equal((await service.session(who(2))).theftNotifications.length,1,'another player cannot mark the owner’s mail');
  await service.mailbox(who(2),[login.theftNotifications[0].id]);
  assert.equal((await service.session(who(2))).theftNotifications.length,0);
  setTime(NOW+MAIL_LIFETIME.visit-1);assert.ok((await service.mailbox(who(2))).body.state.mailbox.some(item=>item.kind==='visit'));
  setTime(NOW+MAIL_LIFETIME.visit);assert.equal((await service.mailbox(who(2))).body.state.mailbox.length,0);
  assert.ok(a.player.id>0);
});

test('Each gift waits for a choice; accepting and declining concurrently applies only one outcome',async()=>{
  const {repository,service}=setup();const {a,b}=await friends(service);
  repository.states.get(a.player.id).state.loot.styleShards[fragmentId]=20;
  await service.sendGift(who(1),b.player.friendCode,{kind:'style-shards',cosmeticId:fragmentId,amount:10});
  const login=await service.session(who(2));assert.equal(login.state.loot.styleShards[fragmentId]??0,0);
  const gift=login.state.mailbox.find(item=>item.kind==='gift');assert.equal(gift.status,'pending');
  assert.equal((await service.decideGift(who(3),gift.giftId,true)).status,409);
  const results=await Promise.all([service.decideGift(who(2),gift.giftId,true),service.decideGift(who(2),gift.giftId,false)]);
  assert.deepEqual(results.map(item=>item.status).sort(),[200,409]);
  assert.equal(repository.states.get(b.player.id).state.loot.styleShards[fragmentId],10);
  assert.equal(repository.states.get(a.player.id).state.loot.styleShards[fragmentId],10);
  assert.equal((await service.mailbox(who(1))).body.state.mailbox.find(item=>item.giftId===gift.giftId).status,'accepted');
  await service.sendGift(who(1),b.player.friendCode,{kind:'style-shards',cosmeticId:fragmentId,amount:10});
  const second=(await service.mailbox(who(2))).body.state.mailbox.find(item=>item.status==='pending');
  await service.decideGift(who(2),second.giftId,false);
  assert.equal(repository.states.get(a.player.id).state.loot.styleShards[fragmentId],10,'declined item returned exactly once');
  assert.equal(repository.states.get(b.player.id).state.loot.styleShards[fragmentId],10);
});

test('Unclaimed gifts return at exactly 14 days even when the recipient never logs in',async()=>{
  const {repository,service,setTime}=setup();const {a,b}=await friends(service);
  repository.states.get(a.player.id).state.loot.styleShards[fragmentId]=10;
  await service.sendGift(who(1),b.player.friendCode,{kind:'style-shards',cosmeticId:fragmentId,amount:10});
  setTime(NOW+MAIL_LIFETIME.gift-1);await service.expireGifts();assert.equal(repository.states.get(a.player.id).state.loot.styleShards[fragmentId]??0,0);
  setTime(NOW+MAIL_LIFETIME.gift);await Promise.all([service.expireGifts(),service.expireGifts()]);
  const sender=await service.session(who(1));assert.equal(sender.state.loot.styleShards[fragmentId],10);assert.ok(sender.state.mailbox.some(item=>item.status==='returned'));
  const recipient=await service.mailbox(who(2));assert.equal(recipient.body.state.mailbox.filter(item=>item.kind==='gift').length,0);
  assert.equal(repository.states.get(b.player.id).state.loot.styleShards[fragmentId]??0,0);
});

test('Declining a purchased gift refunds its currency once and never grants the recipient a background',async()=>{
  const {repository,service}=setup();const {a,b}=await friends(service);
  repository.states.get(a.player.id).state.crystals=1000;
  await service.sendGift(who(1),b.player.friendCode,{kind:'interior',interiorId:'garden'});
  assert.equal(repository.states.get(a.player.id).state.crystals,650);
  const mail=(await service.mailbox(who(2))).body.state.mailbox.find(item=>item.kind==='gift');
  await service.decideGift(who(2),mail.giftId,false);
  assert.equal(repository.states.get(a.player.id).state.crystals,1000);
  assert.ok(!repository.states.get(b.player.id).state.ownedInteriorIds.includes('garden'));
  assert.equal((await service.decideGift(who(2),mail.giftId,true)).status,409);
  assert.equal(repository.crystalLedger.filter(item=>item.action==='giftDeclined').length,1);
});

test('Promo rewards remain in mail for 180 days, are claimed once and cannot be recovered after expiry',async()=>{
  const {service,setTime}=setup();await service.createPromoCode({code:'MAIL',expiresAt:NOW+10000,rewards:[{kind:'coins',amount:50}]});
  const redeemed=await service.redeemPromoCode(who(1),'MAIL');assert.equal(redeemed.state.money,600);
  await service.redeemPromoCode(who(2),'MAIL');
  setTime(NOW+MAIL_LIFETIME.reward-1);
  const claims=await Promise.all([service.claimMailReward(who(1),'promo:MAIL'),service.claimMailReward(who(1),'promo:MAIL')]);assert.deepEqual(claims.map(item=>item.status).sort(),[200,409]);assert.equal(claims.find(item=>item.status===200).body.state.money,650);
  setTime(NOW+MAIL_LIFETIME.reward);
  assert.equal((await service.claimMailReward(who(2),'promo:MAIL')).status,409);
  assert.equal((await service.mailbox(who(2))).body.state.mailbox.length,0);
});

test('Event rewards preserve progress but wait for mailbox collection, replay creates no extra mail',async()=>{
  const {service}=setup();const before=await service.session(who(1));
  const body={requestId:'mail-event-once',action:{type:'claimDaily'}};
  const first=await service.act(who(1),body),again=await service.act(who(1),body);
  assert.deepEqual(first.body,again.body);assert.equal(first.body.state.money,before.state.money);
  assert.ok(first.body.state.dailyGiftClaimedKey);
  const mail=first.body.state.mailbox.find(item=>item.kind==='reward');assert.equal(mail.expiresAt,NOW+MAIL_LIFETIME.reward);
  assert.equal((await service.claimMailReward(who(2),mail.id)).status,409);
  const claimed=await service.claimMailReward(who(1),mail.id);assert.equal(claimed.body.state.money,700);
});

test('Delayed event packages add to current stock using stable IDs and leave costs and progress intact',()=>{
  const state=normalizePlayerState(createInitialState(NOW)),before=structuredClone(state);
  state.money+=100;state.crystals-=3;state.loot.boxes.gold=2;state.loot.parts+=8;state.companions.shards.rosa=1;
  state.inventories[state.regionId][0].amount+=20;
  state.roulette.spins=1;
  const changes=deferEventRewards(before,state);
  assert.equal(state.money,before.money);assert.equal(state.crystals,before.crystals-3);assert.equal(state.roulette.spins,1);
  state.inventories[state.regionId].reverse();state.money+=7;
  claimEventRewards(state,changes);
  assert.equal(state.money,before.money+107);assert.equal(state.loot.boxes.gold,2);assert.equal(state.loot.parts,8);assert.equal(state.companions.shards.rosa,1);
  assert.equal(state.inventories[state.regionId].find(item=>item.ingredientId===before.inventories[state.regionId][0].ingredientId).amount,before.inventories[state.regionId][0].amount+20);
});
import { giftAttachments, rewardAttachments } from '../src/domain/mailAttachments.ts';
import { coins } from '../src/domain/economy.ts';
import { stealableTips } from '../src/sim/tips.ts';

test('Coin balances migrate to integers, passive accrual waits for a whole coin, theft never rounds above 5%',()=>{
 const state=normalizePlayerState(createInitialState(NOW));state.money=600.4;state.tipJar=7.6;state.tipJarDeposited=7.6;
 normalizePlayerState(state);assert.equal(state.money,600);assert.equal(state.tipJar,8);assert.equal(coins(10.5),11);
 for(let deposited=1;deposited<=60;deposited++)for(let remaining=0;remaining<=deposited;remaining++){
  state.tipJar=remaining;state.tipJarDeposited=deposited;
  const taken=stealableTips(state);assert.ok(Number.isInteger(taken));assert.ok(taken<=remaining*.05);assert.ok(taken===0 || remaining-taken>=Math.ceil(deposited*.3));
 }
});

test('Mail stores illustrated reward attachments before and after claiming; legacy gifts gain attachments without accepting',async()=>{
 const {service,repository}=setup();const {a,b}=await friends(service);
 repository.states.get(a.player.id).state.loot.styleShards[fragmentId]=10;
 await service.sendGift(who(1),b.player.friendCode,{kind:'style-shards',cosmeticId:fragmentId,amount:10});
 const old=repository.states.get(b.player.id).state.mailbox.find(x=>x.kind==='gift');delete old.attachments;
 const mailbox=await service.mailbox(who(2));const gift=mailbox.body.state.mailbox.find(x=>x.kind==='gift');
 assert.deepEqual(gift.attachments,giftAttachments({kind:'style-shards',cosmeticId:fragmentId,amount:10}));assert.equal(mailbox.body.state.loot.styleShards[fragmentId]??0,0);
 await service.createPromoCode({code:'ATTACH',expiresAt:NOW+10000,rewards:[{kind:'coins',amount:50},{kind:'skinShards',id:fragmentId,amount:5}]});
 const redeemed=await service.redeemPromoCode(who(2),'ATTACH');const mail=redeemed.state.mailbox.find(x=>x.kind==='reward');
 assert.equal(mail.attachments.length,2);assert.equal(mail.attachments[0].kind,'coins');assert.equal(mail.attachments[1].id,`style:${fragmentId}`);
 const claimed=await service.claimMailReward(who(2),mail.id);assert.deepEqual(claimed.body.state.mailbox.find(x=>x.id===mail.id).attachments,mail.attachments);
 assert.equal(rewardAttachments({changes:[{path:['loot','boxes','gold'],amount:2},{stock:'inventories',id:'gin',amount:1.25}]}).length,2);
});
