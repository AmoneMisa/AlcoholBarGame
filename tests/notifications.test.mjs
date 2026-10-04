import test from 'node:test';
import assert from 'node:assert/strict';
import {createTelegramNotifications, notificationPrefs, pendingNotifications} from '../server/notifications.mjs';
import {createTelegramBot} from '../server/telegramBot.mjs';

const now=Date.UTC(2026,9,4,10), since=now-3600_000;
const state=()=>({dailyGiftClaimedKey:'2026-10-04',dailyLessonKey:'2026-10-04',dailyLessonCompletedIds:['a','b','c'],mailbox:[],loot:{boosts:{},leaderboardClaimed:99999}});
test('Closed-game reminders respect UTC days, completed tasks and category preferences',()=>{
  const incomplete={...state(),dailyGiftClaimedKey:'',dailyLessonCompletedIds:[]};
  assert.deepEqual(pendingNotifications(incomplete,notificationPrefs(),{},now,since).map(n=>n.type),['dailyReward','dailyLesson']);
  assert.equal(pendingNotifications(incomplete,notificationPrefs(),{dailyReward:'2026-10-04',dailyLesson:'2026-10-04'},now,since).length,0);
  assert.equal(pendingNotifications(incomplete,notificationPrefs({dailyReward:false,dailyLesson:false}),{},now,since).length,0);
  assert.equal(pendingNotifications(incomplete,notificationPrefs(),{},Date.UTC(2026,9,4,4),since).length,0);
  assert.equal(pendingNotifications(state(),notificationPrefs(),{},now,since).length,0);
});
test('Mail notifications exclude old, read, claimed, outgoing and expired mail; removing new mail never reannounces old mail',()=>{
  const s=state();
  s.mailbox=[{id:'old',at:since-1,kind:'reward',status:'pending'},
    {id:'read',at:now,readAt:now,kind:'reward',status:'pending'},
    {id:'claimed',at:now,kind:'reward',status:'accepted'},
    {id:'sent',at:now,kind:'gift',direction:'outgoing',status:'pending'},
    {id:'expired',at:now,expiresAt:now,kind:'reward',status:'pending'},
    {id:'valid',at:now-1,kind:'reward',status:'pending'}];
  const notices=pendingNotifications(s,notificationPrefs(),{},now,since);
  assert.equal(notices.length,1);assert.equal(notices[0].key,String(now-1));
  assert.equal(pendingNotifications(s,notificationPrefs(),{reward:String(now)},now,since).length,0);
  assert.equal(pendingNotifications(s,notificationPrefs({reward:false}),{},now,since).length,0);
});
test('New friend requests and expired boosters are deduplicated by event time',()=>{
  const s=state();s.loot.boosts={'xp-boost':now-1,'coin-boost':now+1};
  const requests=[{at:now-2},{at:since-1}];
  const notices=pendingNotifications(s,notificationPrefs(),{},now,since,requests);
  assert.deepEqual(notices.map(n=>n.type),['friendRequest','loot']);
  assert.equal(pendingNotifications(s,notificationPrefs(),Object.fromEntries(notices.map(n=>[n.type,n.key])),now,since,requests).length,0);
});

function workerFixture(fail, overrides = {}) {
  const row={player_id:1,telegram_id:42,enabled_at:new Date(since),prefs:notificationPrefs(),sent:{},state:{...state(),dailyGiftClaimedKey:''},...overrides};
  let due=true, calls=0, enabled=true;
  const pool={connect:async()=>({release(){},async query(sql,args){
    if(sql.includes('FOR UPDATE OF n')) {const rows=due&&enabled ? [structuredClone(row)] : [];due=false;return {rows};}
    if(sql.includes('FROM gifts')) return {rows:[{id:1,at:now-1}]};
    if(sql.startsWith('UPDATE telegram_notifications')) {row.sent=JSON.parse(args[1]);enabled=args[2];}
    return {rows:[]};
  }})};
  const bot={status:()=>({connected:true,username:'test_bot'}),async call(method,payload){calls++;assert.equal(method,'sendMessage');assert.equal(payload.chat_id,42);if(fail.value)throw fail.value;}};
  const worker=createTelegramNotifications({pool,bot,now:()=>now,logger:{error(){}}});
  return {worker,row,next:()=>{due=true;},calls:()=>calls,enabled:()=>enabled};
}
test('Worker persists delivery deduplication and retries failed sends without dropping notifications',async()=>{
  const fail={value:new Error('Temporary failure')}, f=workerFixture(fail);
  await f.worker.tick();assert.deepEqual(f.row.sent,{});
  fail.value=null;f.next();await f.worker.tick();assert.equal(f.row.sent.dailyReward,'2026-10-04');
  f.next();await f.worker.tick();assert.equal(f.calls(),2);
});
test('Pending gifts read in game are not reannounced by the background worker',async()=>{
  const s=state();s.mailbox=[{id:'gift-in:1',at:now-1,readAt:now,kind:'gift',status:'pending'}];
  const f=workerFixture({value:null},{state:s});await f.worker.tick();assert.equal(f.calls(),0);
});
test('Worker disables delivery when Telegram reports the bot is blocked',async()=>{
  const f=workerFixture({value:Object.assign(new Error('Blocked'),{status:403})});
  await f.worker.tick();assert.equal(f.enabled(),false);assert.deepEqual(f.row.sent,{});
  f.next();await f.worker.tick();assert.equal(f.calls(),1);
});
test('Telegram write-access service messages enable delivery for the authenticated sender',async()=>{
  const ids=[];const bot=createTelegramBot({onWriteAccess:id=>ids.push(id)});
  await bot.handleUpdate({message:{chat:{type:'private'},from:{id:42},write_access_allowed:{from_request:true}}});
  await bot.handleUpdate({message:{chat:{type:'group'},from:{id:8},write_access_allowed:{}}});
  assert.deepEqual(ids,[42]);
});
