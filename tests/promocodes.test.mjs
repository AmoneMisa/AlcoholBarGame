import test from 'node:test';
import assert from 'node:assert/strict';
import { createGameService } from '../server/gameService.mjs';
import { createMemoryRepository } from '../server/playerRepository.mjs';
import { createApp } from '../server/app.mjs';
import { createInitialState } from '../src/sim/state.ts';
import { advanceClock, applyAction } from '../src/sim/rules.ts';
import { INGREDIENTS } from '../src/domain/catalog.ts';
import { removeGuest } from '../src/sim/guests.ts';
import { preparationMatches } from '../src/domain/preparationSearch.ts';
import { MAX_CUSTOMER_SEATS, hiddenCustomerDirections } from '../src/domain/customerTiming.ts';

test('guest scroll dots indicate occupied seats in the correct direction, never empty seats',()=>{
  assert.deepEqual(hiddenCustomerDirections([4],0,100,200),{left:false,right:true});
  assert.deepEqual(hiddenCustomerDirections([4],300,100,200),{left:false,right:false});
  assert.deepEqual(hiddenCustomerDirections([0,4],100,100,200),{left:true,right:true});
  assert.deepEqual(hiddenCustomerDirections([],100,100,200),{left:false,right:false});
  assert.deepEqual(hiddenCustomerDirections([-1,5],100,100,200),{left:false,right:false});
  assert.deepEqual(hiddenCustomerDirections([0,4],0,0,0),{left:false,right:false});
});

const identity = id => ({key:`dev:promo-${id}`,telegramId:null,name:'Promo tester',username:null});
test('Promo rewards are authoritative, once per player, case-insensitive, expire and validate chosen items',async()=>{
  let now=1_800_000_000_000;
  const repository=createMemoryRepository();
  const service=createGameService({repository,now:()=>now});
  const body={code:'welcome',expiresAt:now+1000,rewards:[{kind:'coins',amount:200},{kind:'crystals',amount:5},{kind:'box',id:'gold',amount:2},{kind:'style',id:'bartender:reference-streetwear:noa'}]};
  assert.equal((await service.createPromoCode({...body,rewards:[{kind:'coins',amount:-1}]})).status,400);
  assert.equal((await service.createPromoCode({...body,rewards:[{kind:'style',id:'fake'}]})).status,400);
  assert.equal((await service.createPromoCode(body)).ok,true);
  assert.equal((await service.createPromoCode(body)).status,409);
  const before=await service.session(identity(1));
  const attempts=await Promise.all([service.redeemPromoCode(identity(1),' Welcome '),service.redeemPromoCode(identity(1),'WELCOME')]);
  assert.equal(attempts.filter(x=>x.ok).length,1);
  const granted=attempts.find(x=>x.ok).state;
  assert.equal(granted.money,before.state.money+200); assert.equal(granted.crystals,before.state.crystals+5);
  assert.equal(granted.loot.boxes.gold,(before.state.loot.boxes.gold ?? 0)+2);
  assert.ok(granted.ownedCosmeticIds.includes('bartender:reference-streetwear:noa'));
  assert.equal(repository.ledger.filter(x=>x.action==='redeemPromoCode').length,1);
  assert.equal((await service.redeemPromoCode(identity(2),'WELCOME')).ok,true);
  now+=1000;
  assert.equal((await service.redeemPromoCode(identity(3),'WELCOME')).status,409);
});
test('Admin promo endpoint rejects player login and missing/wrong admin token', async()=>{
  const service=createGameService({repository:createMemoryRepository()});
  const app=createApp({service,allowDevLogin:true,adminToken:'test-admin-only'});
  const server=app.listen(0,'127.0.0.1'); await new Promise(resolve=>server.once('listening',resolve));
  try {
    const url=`http://127.0.0.1:${server.address().port}/api/admin/promocodes`;
    const body=JSON.stringify({code:'TEST',expiresAt:Date.now()+60_000,rewards:[{kind:'coins',amount:1}]});
    for (const headers of [{'X-Dev-Player':'dev-admin'},{Authorization:'Bearer incorrect'}]) assert.equal((await fetch(url,{method:'POST',headers:{'Content-Type':'application/json',...headers},body})).status,403);
    assert.equal((await fetch(url,{method:'POST',headers:{'Content-Type':'application/json',Authorization:'Bearer test-admin-only'},body})).status,200);
  } finally { await new Promise(resolve=>server.close(resolve)); }
});
test('Each empty seat arrives independently and an occupied seat keeps its guest and clock',()=>{
  const now=1_800_000_000_000,state=createInitialState(now),ctx={now,random:()=>.9,spawnCustomers:false};
  state.customers.splice(3);
  advanceClock(state,ctx);
  const occupied=state.customers[0],active=state.activeCustomerId;
  const seats=state.seatNextCustomerAt.map((at,seat)=>({at,seat})).filter(x=>x.at>0);
  assert.ok(seats.length>0);
  state.seatNextCustomerAt[seats[0].seat]=now+100;
  if (seats[1]) state.seatNextCustomerAt[seats[1].seat]=now+1000;
  advanceClock(state,{...ctx,now:now+100,spawnCustomers:true});
  assert.ok(state.customers.includes(occupied)); assert.equal(state.activeCustomerId,active);
  assert.ok(state.customers.some(x=>x.seatId===seats[0].seat));
  if(seats[1]) assert.equal(state.seatNextCustomerAt[seats[1].seat],now+1000);
  const remaining=[...state.seatNextCustomerAt];
  removeGuest(state,occupied,{now:now+100,random:()=>.9,nextArrivalAt:()=>now+5000,freshOrder:()=>({})});
  assert.equal(state.seatNextCustomerAt[occupied.seatId],now+5000);
  for(const seat of seats.slice(1)) assert.equal(state.seatNextCustomerAt[seat.seat],remaining[seat.seat]);
});

test('Preparation searches names and types in English and Russian',()=> {
  assert.ok(preparationMatches('Джек дениелс',["Jack Daniel’s",'whiskey']));
  assert.ok(preparationMatches('вино',['Red wine']));
  assert.ok(preparationMatches('сыр',['Cheese','food']));
  assert.equal(preparationMatches('wine',['Vodka']),false);
});

test('Inviting a guest charges for the selected seat and leaves other arrival timers intact',()=>{
  const now=1_800_000_000_000,state=createInitialState(now),ctx={now,random:()=>.9,spawnCustomers:false};
  state.customers.splice(3);
  advanceClock(state,ctx);
  assert.equal(state.seatNextCustomerAt.length,MAX_CUSTOMER_SEATS);
  state.seatNextCustomerAt[3]=now+300_000;
  state.seatNextCustomerAt[4]=now+1_500_000;
  const crystals=state.crystals=20;
  applyAction(state,{type:'expediteCustomer',seatId:4},ctx);
  assert.equal(state.crystals,crystals-5);
  assert.ok(state.customers.some(customer=>customer.seatId===4));
  assert.equal(state.seatNextCustomerAt[3],now+300_000);
  assert.equal(state.seatNextCustomerAt[4],0);
  assert.throws(()=>applyAction(state,{type:'expediteCustomer',seatId:4},ctx),/occupied/);
  assert.throws(()=>applyAction(state,{type:'expediteCustomer',seatId:5},ctx),/valid/);
  state.crystals=0;
  assert.throws(()=>applyAction(state,{type:'expediteCustomer',seatId:3},ctx),/crystals/);
  assert.equal(state.customers.length,4);
  assert.equal(state.seatNextCustomerAt[3],now+300_000);
  state.crystals=1;
  applyAction(state,{type:'expediteCustomer',seatId:3},ctx);
  assert.equal(state.customers.length,MAX_CUSTOMER_SEATS);
  assert.equal(state.crystals,0);
});

test('Food served at preparation consumes stock and applies the existing food effects',()=>{
  const now=1_800_000_000_000,state=createInitialState(now),guest=state.customers[0];
  const food=INGREDIENTS.find(item=>item.category==='food');
  const stock=state.inventories[state.regionId].find(item=>item.ingredientId===food.id);
  if(stock) stock.amount=2; else state.inventories[state.regionId].push({ingredientId:food.id,amount:2});
  guest.orderRevealed=true;guest.social.hungry=true;guest.social.allergy=undefined;
  const money=state.money;
  applyAction(state,{type:'serveFood',ingredientId:food.id},{now,random:()=>.9,spawnCustomers:false});
  assert.equal(state.inventories[state.regionId].find(item=>item.ingredientId===food.id).amount,1);
  assert.equal(guest.social.hungry,false);assert.ok(state.money>money);
  assert.throws(()=>applyAction(state,{type:'serveFood',ingredientId:'vodka'},{now,random:()=>.9,spawnCustomers:false}),/food/i);
});
