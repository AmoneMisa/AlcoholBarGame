import test from 'node:test';
import assert from 'node:assert/strict';
import {createTelegramBot} from '../server/telegramBot.mjs';
import {createHmac} from 'node:crypto';
import {createApp,handleErrors} from '../server/app.mjs';
import {createGameService} from '../server/gameService.mjs';
import {createMemoryRepository} from '../server/playerRepository.mjs';
import {EVENT_LIFETIME} from '../server/administration.mjs';
const identity=id=>({kind:'telegram',key:`tg:${id}`,telegramId:id,name:`Player ${id}`,username:null});
function setup() {let time=Date.now(); const repository=createMemoryRepository(),service=createGameService({repository,ownerTelegramIds:[42],now:()=>time}); return {repository,service,advance:n=>time+=n};}
const change=(id,kind,delta,extra={})=>({telegramId:String(id),kind,delta,reason:'Support correction',requestId:crypto.randomUUID(),...extra});

test('Promos can be created or made permanent, keep redemption limits, and expiration edits require staff permission',async()=>{
 const {service,advance}=setup(),owner=identity(42),user=identity(8);
 const permanent={code:'FOREVER',expiresAt:null,maxUses:2,rewards:[{kind:'coins',amount:10}]};
 assert.equal((await service.createPromoCode(permanent,owner)).ok,true);
 advance(365*86400_000);
 assert.equal((await service.redeemPromoCode(user,'FOREVER')).ok,true);
 assert.equal((await service.redeemPromoCode(user,'FOREVER')).status,409);
 assert.equal((await service.redeemPromoCode(identity(9),'FOREVER')).ok,true);
 assert.equal((await service.redeemPromoCode(identity(10),'FOREVER')).status,409);
 assert.equal((await service.createPromoCode({...permanent,code:'CHANGE',expiresAt:Date.now()+2*365*86400_000})).ok,true);
 assert.equal((await service.adminUpdatePromoExpiry(user,{code:'CHANGE',expiresAt:null})).status,403);
 assert.equal((await service.adminUpdatePromoExpiry(owner,{code:'CHANGE',expiresAt:null})).ok,true);
 assert.equal((await service.adminPromos()).promos.find(p=>p.code==='CHANGE').expiresAt,null);
 assert.equal((await service.adminUpdatePromoExpiry(owner,{code:'CHANGE',expiresAt:'invalid'})).status,400);
 assert.equal((await service.adminUpdatePromoExpiry(owner,{code:'CHANGE',expiresAt:Date.now()})).status,400);
 const end=Date.now()+3*365*86400_000;
 assert.equal((await service.adminUpdatePromoExpiry(owner,{code:'CHANGE',expiresAt:end})).ok,true);
 assert.equal((await service.adminPromos()).promos.find(p=>p.code==='CHANGE').expiresAt,end);
 await service.adminDeletePromo(owner,'CHANGE');
 assert.equal((await service.adminUpdatePromoExpiry(owner,{code:'CHANGE',expiresAt:null})).status,404);
 assert.equal((await service.adminEvents({event:'admin.promo.expiry'})).events.length,2);
});
test('Admin style catalog assigns both bartender genders to their background or game group',()=>{
 const {service}=setup();const catalog=service.adminCatalog();
 const group=catalog.style.find(item=>item.id==='bartender:theme-worms-noa:noa').group;
 assert.ok(group && group.includes('Worms'));
 assert.equal(catalog.style.find(item=>item.id==='bartender:theme-worms-leo:leo').group,group);
 assert.equal(catalog.style.find(item=>item.id==='bartender:theme-worms-noa:noa').character,'noa');
 assert.equal(catalog.skinShards.find(item=>item.id==='bartender:theme-worms-noa:noa').group,group);
});
test('Administration: signed deltas, idempotency, inventory, blocking every session/action and unblocking',async()=>{
 const {service,repository}=setup(),admin=identity(42),user=identity(8);
 const session=await service.session(user); const before=session.state.money;
 const body=change(8,'coins',50);
 assert.equal((await service.adminChange(admin,body)).ok,true);
 assert.equal((await service.adminChange(admin,body)).ok,true);
 assert.equal(repository.states.get(session.player.id).state.money,before+50);
 assert.equal((await service.adminChange(admin,change(8,'coins',-1000000))).status,409);
 assert.equal(repository.states.get(session.player.id).state.money,before+50);
 assert.equal((await service.adminChange(admin,change(8,'xp',100))).ok,true);
 assert.equal((await service.adminChange(admin,change(8,'consumable',2,{id:'invalid'}))).status,400);
 const box=service.adminCatalog().box[0].id; const boxesBefore=repository.states.get(session.player.id).state.loot.boxes[box] ?? 0;
 await service.adminChange(admin,change(8,'box',3,{id:box})); await service.adminChange(admin,change(8,'box',-1,{id:box}));
 assert.equal(repository.states.get(session.player.id).state.loot.boxes[box],boxesBefore+2);
 await service.adminChange(admin,change(8,'block',0));
 await assert.rejects(service.session(user),e=>e.status===403);
 await assert.rejects(service.act(user,{requestId:crypto.randomUUID(),action:{type:'tick'}}),e=>e.status===403);
 await service.adminChange(admin,change(8,'unblock',0)); assert.equal((await service.session(user)).ok,true);
 const events=(await service.adminEvents({event:'admin.player.change'})).events;
 assert.equal(events.length,6); assert.equal(events[0].telegramId,42);
});
test('Promos: future start, bounded concurrent redemptions, default unlimited and soft delete',async()=>{
 const {service,advance}=setup(); const start=Date.now()+60000;
 await service.createPromoCode({code:'LIMIT',startsAt:start,expiresAt:start+60000,maxUses:1,rewards:[{kind:'coins',amount:10}]});
 assert.equal((await service.redeemPromoCode(identity(1),'LIMIT')).status,409);
 advance(61000);
 const results=await Promise.all([1,2,3].map(id=>service.redeemPromoCode(identity(id),'LIMIT')));
 assert.equal(results.filter(r=>r.ok).length,1);
 await service.adminDeletePromo(identity(42),'LIMIT'); assert.equal((await service.redeemPromoCode(identity(9),'LIMIT')).status,409);
 const created=await service.createPromoCode({code:'UNLIMITED',expiresAt:Date.now()+3600000,rewards:[{kind:'parts',amount:1}]}); assert.equal(created.promo.maxUses,null);
 assert.equal((await service.redeemPromoCode(identity(9),'UNLIMITED')).ok,true);
 assert.equal((await service.redeemPromoCode(identity(10),'UNLIMITED')).ok,true);
});
test('Tickets validate evidence and time, apply spam limit, support closing; event retention excludes and deletes old entries',async()=>{
 const {service,advance}=setup(),user=identity(1);
 const ticket={title:'Player abuse',description:'Description of the incident',screenshots:[],occurredAt:new Date(Date.now()-1000).toISOString()};
 assert.equal((await service.createTicket(user,{...ticket,screenshots:['data:image/svg+xml;base64,AAAA']})).status,400);
 assert.equal((await service.createTicket(user,{...ticket,occurredAt:'invalid'})).status,400);
 for(let n=0;n<5;n++) assert.equal((await service.createTicket(user,ticket)).ok,true);
 assert.equal((await service.createTicket(user,ticket)).status,429);
 assert.equal((await service.adminCloseTicket(identity(42),1)).ok,true);
 assert.equal((await service.adminTickets({})).tickets.at(-1).status,'closed');
 advance(EVENT_LIFETIME+1); assert.equal((await service.adminEvents({})).events.length,0); await service.pruneEvents();
 await service.audit(user,'fresh',{}); assert.equal((await service.adminEvents({})).events.length,1);
});
function signed(id,token) {const p=new URLSearchParams({auth_date:String(Math.floor(Date.now()/1000)),user:JSON.stringify({id,first_name:'Test'})});const check=[...p].sort(([a],[b])=>a.localeCompare(b)).map(([k,v])=>k+'='+v).join('\n'); const secret=createHmac('sha256','WebAppData').update(token).digest();p.set('hash',createHmac('sha256',secret).update(check).digest('hex'));return 'tma '+p;}
test('HTTP admin authorization protects every API and script/CSS assets, including encoded paths',async()=>{
 const {service}=setup(),token='123:test';const app=createApp({service,botToken:token,allowDevLogin:true});
 app.use('/assets',(_req,res)=>res.send('protected asset')); handleErrors(app);
 const server=app.listen(0,'127.0.0.1');await new Promise(r=>server.once('listening',r)); const base=`http://127.0.0.1:${server.address().port}`;
 try {
  const request=(path,auth,body={})=>fetch(base+path,{method:'POST',headers:{'content-type':'application/json',...auth},body:JSON.stringify(body)});
  for(const path of ['access','catalog','promocodes','promocodes/list','promocodes/delete','player','player/change','events','tickets','tickets/close']) {
   assert.equal((await request('/api/admin/'+path,{Authorization:signed(8,token)})).status,403);
   assert.equal((await request('/api/admin/'+path,{'X-Dev-Player':'42'})).status,403);
   assert.equal((await request('/api/admin/'+path,{Authorization:'Bearer old-admin-token'})).status,401);
  }
  for(const file of ['admin-AdminPage-test.js','admin-AdminPage-test.css','%61dmin-AdminPage-test.js']) assert.equal((await fetch(base+'/assets/'+file)).status,404);
  const access=await request('/api/admin/access',{Authorization:signed(42,token)}); assert.equal(access.status,200);
  const cookie=access.headers.get('set-cookie').split(';')[0]; assert.match(access.headers.get('set-cookie'),/HttpOnly/);
  const asset=await fetch(base+'/assets/admin-AdminPage-test.js',{headers:{cookie}}); assert.equal(asset.status,200); assert.match(asset.headers.get('cache-control'),/no-store/);
  assert.equal((await request('/api/admin/catalog',{Authorization:signed(42,token)})).status,200);
  const evidence='data:image/png;base64,iVBORw0KGgo=';
  assert.equal((await request('/api/support/ticket',{Authorization:signed(8,token)},{title:'Test incident',description:'Detailed incident report',screenshots:[evidence]})).status,200);
  const logs=(await service.adminEvents({})).events;
  assert.equal(JSON.stringify(logs).includes(evidence),false,'screenshots must stay out of the event journal');
  assert.ok(logs.some(e=>e.event==='api.request' && e.detail.path==='/support/ticket'));
 } finally {await new Promise(r=>server.close(r));}
});

test('Bot admin entry is private and only responds to allowlisted Telegram IDs',async()=> {
 const calls=[];
 const bot=createTelegramBot({token:'123:test',adminTelegramIds:'42',fetchImpl:async(url,options)=>{const method=url.split('/').at(-1);calls.push({method,payload:JSON.parse(options.body)});return {ok:true,json:async()=>({ok:true,result:method==='getMe' ? {id:123,is_bot:true,username:'barlingo_test',has_main_web_app:true} : true})};}});
 await bot.start({enablePolling:false}); const baseline=calls.length;
 await bot.handleUpdate({message:{text:'/admin',from:{id:8},chat:{id:8,type:'private'}}}); assert.equal(calls.length,baseline);
 await bot.handleUpdate({message:{text:'/admin',from:{id:42},chat:{id:-1,type:'group'}}}); assert.equal(calls.length,baseline);
 await bot.handleUpdate({message:{text:'/admin',from:{id:42},chat:{id:42,type:'private'}}});
 assert.equal(calls.at(-1).payload.reply_markup.inline_keyboard[0][0].url,'https://t.me/barlingo_test?startapp=admin');
 assert.ok(!calls.find(c=>c.method==='setMyCommands').payload.commands.some(c=>c.command==='admin'));
});

test('Owner and delegated roles: administrators only manage moderators; owner cannot be demoted',async()=> {
 const {service}=setup(), owner=identity(86416302), admin=identity(55), mod=identity(56);
 const assign=(actor,id,role)=>service.staffSetRole(actor,{telegramId:String(id),role,reason:'Staff appointment'});
 assert.equal(await service.staffRole(owner),'owner');
 assert.equal((await assign(owner,55,'admin')).ok,true);
 assert.equal((await assign(admin,56,'moderator')).ok,true);
 assert.equal(await service.staffRole(mod),'moderator');
 assert.equal((await assign(admin,57,'admin')).status,403);
 assert.equal((await assign(admin,55,'none')).status,403);
 assert.equal((await assign(mod,56,'admin')).status,403);
 assert.equal((await assign(owner,86416302,'none')).status,403);
 assert.equal((await assign(owner,58,'admin')).ok,true);
 assert.equal((await assign(admin,58,'moderator')).status,403);
 assert.equal((await assign(admin,58,'none')).status,403);
 assert.equal((await assign(admin,56,'none')).ok,true);
 assert.equal(await service.staffRole(mod),null);
 assert.equal((await service.staffList(mod)).status,403);
 const logs=(await service.adminEvents({event:'admin.staff.role'})).events;
 assert.ok(logs.some(e=>e.detail.targetTelegramId==='56' && e.detail.role==='none'));
});

test('HTTP role permissions: moderator only bans/unbans; revocation invalidates existing asset sessions',async()=> {
 const {service}=setup(), token='123:roles'; const owner=identity(86416302);
 await service.staffSetRole(owner,{telegramId:'55',role:'admin',reason:'Assign administrator'});
 await service.staffSetRole(owner,{telegramId:'56',role:'moderator',reason:'Assign moderator'});
 await service.session(identity(88));
 const app=createApp({service,botToken:token,allowDevLogin:true});
 app.use('/assets',(_req,res)=>res.send('staff asset'));handleErrors(app);
 const server=app.listen(0,'127.0.0.1');await new Promise(r=>server.once('listening',r));const base=`http://127.0.0.1:${server.address().port}`;
 const request=(id,path,body={})=>fetch(base+'/api/admin/'+path,{method:'POST',headers:{'content-type':'application/json',Authorization:signed(id,token)},body:JSON.stringify(body)});
 try {
  const access=await request(56,'access'); assert.equal(access.status,200); assert.equal((await access.clone().json()).role,'moderator');
  const cookie=access.headers.get('set-cookie').split(';')[0];
  const player=await (await request(56,'player',{telegramId:'88'})).json();assert.equal(player.state,undefined);
  for(const path of ['catalog','events','tickets','tickets/close','promocodes','promocodes/list','promocodes/delete','staff/list','staff/role']) assert.equal((await request(56,path)).status,403,path);
  for(const kind of ['coins','crystals','parts','xp','box']) assert.equal((await request(56,'player/change',change(88,kind,1,{id:service.adminCatalog().box[0].id}))).status,403,kind);
  assert.equal((await request(56,'player/change',change(88,'block',0))).status,200);
  assert.equal((await request(56,'player/change',change(88,'unblock',0))).status,200);
  assert.equal((await request(55,'player/change',change(88,'coins',10))).status,200);
  assert.equal((await request(55,'player/change',change(88,'xp',10))).status,200);
  assert.equal((await request(55,'staff/role',{telegramId:'57',role:'moderator',reason:'Appointment'})).status,200);
  assert.equal((await request(55,'staff/role',{telegramId:'58',role:'admin',reason:'Escalation attempt'})).status,403);
  assert.equal((await request(86416302,'staff/role',{telegramId:'56',role:'none',reason:'Revoke access'})).status,200);
  assert.equal((await request(56,'access')).status,403);
  assert.equal((await request(56,'player/change',change(88,'block',0))).status,403);
  assert.equal((await fetch(base+'/assets/admin-test.js',{headers:{cookie}})).status,404);
  assert.equal((await service.staffSetRole(owner,{telegramId:'56',role:'moderator',reason:'Restore access'})).ok,true);
  assert.equal((await request(56,'player/change',change(86416302,'block',0))).status,403,'owner is protected');
 } finally {await new Promise(r=>server.close(r));}
});
