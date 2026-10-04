import test from 'node:test';
import assert from 'node:assert/strict';
import {createInitialState,normalizePlayerState} from '../src/sim/state.ts';
import {applyAction} from '../src/sim/rules.ts';
import {buildPlayerProfile} from '../src/domain/profile.ts';
import {WISH_GIFTS,validWishlist} from '../src/domain/wishlist.ts';
import {THEME_DRAW_POOLS,PROMO_THEME_IDS,NEW_PASS_THEME_IDS,PAID_NEW_THEME_IDS,randomCosmeticAllowed} from '../src/data/cosmetics/themeDistribution.ts';
import {BOX_INTERIOR_IDS} from '../src/data/cosmetics/bars.ts';
import {INTERIORS} from '../src/data/cosmetics/bars.ts';
import {COSMETICS,interiorForCosmetic,DRAWABLE_COSMETICS} from '../src/domain/cosmetics.ts';
import {fragmentChoiceOptions} from '../src/domain/fragmentChoices.ts';
import {giftPrice} from '../src/sim/gifts.ts';
import {currencyOffer,handleCurrencyError} from '../src/domain/uiOffers.ts';
const now=Date.UTC(2026,9,4);
const ctx={now,random:()=>.1,checkEnglish:()=>({ok:true}),spawnCustomers:false};
test('Wishlists save five valid gifts and reach the public profile; invalid and oversized requests roll back',()=>{
  const state=createInitialState(now);const ids=WISH_GIFTS.slice(0,5).map(item=>item.key);
  applyAction(state,{type:'setWishedGifts',ids},ctx);
  assert.deepEqual(buildPlayerProfile(state).wishedGifts,ids);
  assert.throws(()=>applyAction(state,{type:'setWishedGifts',ids:[...ids,WISH_GIFTS[5].key]},ctx),/five/);
  assert.throws(()=>applyAction(state,{type:'setWishedGifts',ids:['invented']},ctx),/catalog/);
  assert.throws(()=>applyAction(state,{type:'setWishedGifts',ids:[ids[0],ids[0]]},ctx),/distinct/);
  assert.deepEqual(state.wishedGifts,ids);
  assert.deepEqual(validWishlist([...ids,'invented',ids[0]]),ids);
  applyAction(state,{type:'setWishedGifts',ids:[]},ctx);assert.deepEqual(buildPlayerProfile(state).wishedGifts,[]);
});
test('Every collection contains 4–5 real styles and draws only from that pool; duplicates retain value',()=>{
  for(const pool of THEME_DRAW_POOLS){
    assert.ok(pool.styleIds.length>=4&&pool.styleIds.length<=5);
    assert.ok(pool.styleIds.every(id=>COSMETICS.some(item=>item.id===id)));
    for(const [index,id] of pool.styleIds.entries()) {
      const background=interiorForCosmetic(id);
      assert.ok(INTERIORS.some(item=>item.id===background),`${id} has a matching background`);
      const owned=createInitialState(now);owned.crystals=100;owned.ownedCosmeticIds.push(id);
      owned.ownedInteriorIds=owned.ownedInteriorIds.filter(item=>item!==background);
      applyAction(owned,{type:'drawStyle',count:1,banner:pool.id},{...ctx,random:()=>(index+.1)/pool.styleIds.length});
      assert.ok(owned.ownedInteriorIds.includes(background),'An owned style still awards its missing background');
      assert.equal(owned.loot.styleShards[id],10);
    }
    const state=createInitialState(now);state.crystals=1000;
    applyAction(state,{type:'drawStyle',count:1,banner:pool.id},ctx);
    const id=state.loot.lastDraw[0].id;assert.ok(pool.styleIds.includes(id));assert.equal(state.crystals,950);
    assert.ok(state.ownedInteriorIds.includes(interiorForCosmetic(id)));
    applyAction(state,{type:'drawStyle',count:1,banner:pool.id},ctx);
    assert.equal(state.loot.styleShards[id],10);assert.equal(state.loot.lastDraw[0].duplicate,true);
    applyAction(state,{type:'drawStyle',count:10,banner:pool.id},ctx);assert.equal(state.crystals,450);
    assert.ok(state.loot.lastDraw.every(item=>pool.styleIds.includes(item.id)));
    assert.throws(()=>applyAction(state,{type:'drawStyle',count:1,banner:'fake-pool'},ctx),/banner/);
  }
});
test('Promo and new pass collections cannot be bought, gifted from the shop, or randomly awarded from chests and fragment choices',()=>{
  assert.equal(PAID_NEW_THEME_IDS.length,4);
  for(const id of [...PROMO_THEME_IDS,...NEW_PASS_THEME_IDS]){
    assert.ok(!BOX_INTERIOR_IDS.includes(id),id);
    assert.ok(!fragmentChoiceOptions('background-choice').some(item=>item.id===id));
    assert.equal(giftPrice({kind:'interior',interiorId:id}),undefined);
    const state=createInitialState(now);state.crystals=10000;
    assert.throws(()=>applyAction(state,{type:'buyInterior',interiorId:id},ctx),/season|collection/);
    assert.equal(state.crystals,10000);
    for(const character of ['noa','leo'])assert.equal(randomCosmeticAllowed(`bartender:theme-${id}-${character}:${character}`),false);
  }
  assert.ok(DRAWABLE_COSMETICS.every(item=>item.key!=='hairStyle'));
});
test('Insufficient currency errors open the matching offer; other refusals retain their message',()=>{
  assert.equal(handleCurrencyError('You need 450 crystals for the premium track.'),true);assert.equal(currencyOffer.value,'crystals');
  assert.equal(handleCurrencyError('Not enough money.'),true);assert.equal(currencyOffer.value,'coins');
  currencyOffer.value=undefined;assert.equal(handleCurrencyError('You need 4 workshop parts.'),false);assert.equal(currencyOffer.value,undefined);
});


// Collection benefits are derived from actual ownership on both client and server.
import {collectionBonuses} from '../src/domain/collectionBonuses.ts';
import {dailySpinLimit,spinsLeft} from '../src/domain/roulette.ts';
import {dailyCoinsFor,dailyCrystalsFor,arrivalSkipCrystalCost,calendarDate} from '../src/domain/economy.ts';
import {accrueTips,tipCapacity,tipAccumulationMs,TIP_ACCUMULATION_MS} from '../src/sim/tips.ts';
import {deliveryFactorFor} from '../src/sim/lootCore.ts';
import {createGameService} from '../server/gameService.mjs';
import {createMemoryRepository} from '../server/playerRepository.mjs';
const collectionState=(count)=>{
  const state=createInitialState(now);
  state.ownedCosmeticIds=COSMETICS.filter(item=>item.key==='bartender').slice(0,count).map(item=>item.id);
  return state;
};
test('Collection counts only unique costumes and earned backgrounds; percent and milestone bonuses are capped',()=>{
  const state=createInitialState(now);
  state.ownedCosmeticIds=[COSMETICS[0].id,'fake'];
  state.ownedInteriorIds=['velvet','fake'];
  assert.equal(collectionBonuses(state).count,0);
  const id=COSMETICS.find(item=>item.key==='bartender').id;
  state.ownedCosmeticIds=[id,id];state.ownedInteriorIds=['velvet','lost-ark','lost-ark'];
  assert.equal(collectionBonuses(state).count,2);
  for(const [count,spins,prestige] of [[15,3,0],[16,4,0],[20,4,1],[32,5,1],[48,6,2],[64,7,3],[80,7,4],[120,7,4]]){
    const state=collectionState(count),bonus=collectionBonuses(state);
    assert.equal(bonus.count,count);assert.equal(dailySpinLimit(state),spins);assert.equal(bonus.visitPrestige,prestige);
    assert.ok(bonus.rate<=.1&&bonus.offlineRate<=.2);
  }
});
test('Collection rewards apply to daily claims, early invitation prices and seven-spin server limits without reopening used spins',()=>{
  const state=collectionState(100);state.crystals=1000;
  assert.equal(arrivalSkipCrystalCost(7200000,state),22);
  assert.equal(dailyCoinsFor(7,state),550);assert.equal(dailyCrystalsFor(7,state),99);
  state.loginStreak=6;state.dailyGiftClaimedKey=calendarDate(new Date(now-86400000));
  const money=state.money,crystals=state.crystals;
  applyAction(state,{type:'claimDaily'},{...ctx,random:()=>.9});
  assert.equal(state.money-money,550);assert.equal(state.crystals-crystals,99);
  assert.throws(()=>applyAction(state,{type:'claimDaily'},ctx),/already/);
  for(let i=0;i<7;i++)applyAction(state,{type:'spinRoulette'},ctx);
  assert.equal(spinsLeft(state.roulette,calendarDate(new Date(now)),state),0);
  assert.equal(normalizePlayerState(state,now).roulette.spins,7);
  assert.throws(()=>applyAction(state,{type:'spinRoulette'},ctx),/all 7/);
});
test('Collection extends the offline jar earning window and capacity, then stops; trade delivery discount stays small',()=>{
  const state=collectionState(100),base=createInitialState(now);
  assert.equal(tipAccumulationMs(state),TIP_ACCUMULATION_MS*1.2);
  assert.equal(tipCapacity(state),Math.round(tipCapacity(base)*1.1*1.2));
  accrueTips(state,now+TIP_ACCUMULATION_MS);
  const first=state.tipJar;accrueTips(state,now+tipAccumulationMs(state));
  assert.ok(state.tipJar>first);assert.equal(state.tipJar,tipCapacity(state));
  accrueTips(state,now+3*TIP_ACCUMULATION_MS);assert.equal(state.tipJar,tipCapacity(state));
  assert.equal(deliveryFactorFor(state,state.regionId),deliveryFactorFor(base,base.regionId)*.9);
});
test('Friend visits award the owner collection prestige bonus once per friend per day',async()=>{
  const repository=createMemoryRepository();
  const service=createGameService({repository,checkEnglish:()=>({ok:true}),now:()=>now});
  const a={kind:'dev',key:'collection-visitor',name:'Visitor'},b={kind:'dev',key:'collection-owner',name:'Owner'};
  const sa=await service.session(a),sb=await service.session(b);
  await service.addFriend(a,sb.player.friendCode);await service.answerFriend(b,sa.player.friendCode,true);
  const row=repository.states.get(Number(sb.player.id));
  row.state.ownedCosmeticIds=collectionState(80).ownedCosmeticIds;
  const before=row.state.popularity;
  const visit=await service.visitFriend(a,sb.player.friendCode);
  assert.equal(visit.body.prestigeAward,5);assert.equal(visit.body.friend.prestige,before+5);
  const repeat=await service.visitFriend(a,sb.player.friendCode);
  assert.equal(repeat.body.prestigeAward,0);assert.equal(repeat.body.friend.prestige,before+5);
});
