import { COSMETICS } from '../src/domain/cosmetics';
import { INTERIORS } from '../src/data/cosmetics/bars';
import { COMPANIONS } from '../src/domain/companions';
import { CONSUMABLES, BOXES, EQUIPMENT } from '../src/domain/loot';
import { INGREDIENTS } from '../src/domain/catalog';
import { normalizePlayerState, publicState } from '../src/sim/state';
import { applyPromoRewards, cleanCode } from './promocodes.mjs';

export const EVENT_LIFETIME = 14 * 24 * 60 * 60 * 1000;
const fail = (error,status=400) => ({status,body:{ok:false,error}});
const groups = {style:COSMETICS,background:INTERIORS,companion:COMPANIONS,consumable:CONSUMABLES,box:BOXES,itemShards:EQUIPMENT,skinShards:COSMETICS,backgroundShards:INTERIORS,ingredient:INGREDIENTS};
export function createAdministration({repository,now,staff}) {
  const audit = (identity,event,detail={}) => repository.transaction(tx=>tx.addEvent(identity,event,detail,now()));
  const pruneEvents = () => repository.transaction(tx=>tx.pruneEvents(now()-EVENT_LIFETIME));
  const catalog = () => Object.fromEntries(Object.entries(groups).map(([kind,items])=>[kind,items.map(i=>({id:i.id,label:i.label ?? i.name ?? i.id}))]));
  async function adminPlayer(body, identity) {
    if (!/^\d{1,16}$/.test(String(body?.telegramId ?? ''))) return fail('Enter a Telegram ID.');
    return repository.transaction(async tx=> {
      const player=await tx.adminPlayer(body.telegramId);
      if(!player) return fail('Player not found.',404);
      const role=await staff.roleIn(tx,identity);
      if(!role) return fail('Staff access required.',403);
      const state=role==='moderator' ? null : await tx.readState(player.id);
      return {ok:true,player,...(role==='moderator' ? {} : {state:state ? publicState(normalizePlayerState(state)) : null})};
    });
  }
  async function adminChange(identity,body) {
    if (!/^\d{1,16}$/.test(String(body?.telegramId ?? ''))) return fail('Enter a Telegram ID.');
    if (typeof body.reason !== 'string' || body.reason.trim().length<3 || body.reason.length>500) return fail('Provide a reason (3–500 characters).');
    if(typeof body.requestId !== 'string' || !/^[a-zA-Z0-9-]{8,64}$/.test(body.requestId)) return fail('Missing request ID.');
    const kind=body.kind, delta=body.delta;
    if(!['block','unblock','coins','crystals','xp','parts',...Object.keys(groups)].includes(kind)) return fail('Unknown change.');
    if(!['block','unblock'].includes(kind) && (!Number.isSafeInteger(delta) || !delta || Math.abs(delta)>1000000)) return fail('Enter a nonzero whole amount, up to 1000000.');
    if(groups[kind] && !groups[kind].some(i=>i.id===body.id)) return fail('Unknown item.');
    if(['style','background','companion'].includes(kind) && Math.abs(delta)!==1) return fail('Use +1 or -1 for ownership.');
    return repository.transaction(async tx=> {
      await tx.lockStaffRoles();
      const actorRole=await staff.roleIn(tx,identity);
      const targetRole=await staff.roleIn(tx,{kind:'telegram',telegramId:body.telegramId});
      if(!actorRole || (actorRole==='moderator' && !['block','unblock'].includes(kind))) return fail('You do not have permission for this operation.',403);
      if(['block','unblock'].includes(kind) && (targetRole==='owner' || (actorRole!=='owner' && targetRole) || String(identity.telegramId)===String(body.telegramId))) return fail('You cannot moderate this staff account.',403);
      const player=await tx.adminPlayer(body.telegramId);
      if(!player) return fail('Player not found.',404);
      const record=await tx.lockState(player.id);
      const requestId=`admin:${identity.telegramId}:${body.requestId}`;
      const replay=await tx.findRequest(player.id,requestId);
      if(replay) return replay;
      if(['block','unblock'].includes(kind)) await tx.setBlocked(player.id,kind==='block',kind==='block' ? body.reason.trim() : '');
      else {
        if(!record) return fail('Player has no saved game.',409);
        const state=normalizePlayerState(record.state), before=structuredClone(state);
        if(['style','background','companion'].includes(kind)) {
          if(delta>0) applyPromoRewards(state,[{kind,id:body.id}]);
          else if(kind==='style') {
            const style=COSMETICS.find(i=>i.id===body.id);
            if(Object.values(state.bars).some(bar=>Object.values(bar).includes(style.value))) return fail('Unequip this style before removing it.',409);
            if(!state.ownedCosmeticIds.includes(body.id)) return fail('Item is not owned.',409);
            state.ownedCosmeticIds=state.ownedCosmeticIds.filter(id=>id!==body.id); delete state.cosmeticCopies[body.id];
          } else if(kind==='background') {
            if(Object.values(state.bars).some(bar=>bar.interior===body.id)) return fail('This background is in use.',409);
            if(!state.ownedInteriorIds.includes(body.id)) return fail('Item is not owned.',409);
            state.ownedInteriorIds=state.ownedInteriorIds.filter(id=>id!==body.id);
          } else {
            if(!(body.id in (state.companions?.owned ?? {}))) return fail('Companion is not owned.',409);
            delete state.companions.owned[body.id];
            for(const [bar,ids] of Object.entries(state.companions.assigned)) state.companions.assigned[bar]=ids.filter(id=>id!==body.id);
          }
        } else {
          let bag=state,key=kind;
          if(kind==='coins') key='money';
          if(kind==='parts') bag=state.loot;
          if(kind==='ingredient') { const pile=state.inventories[state.regionId]; let item=pile.find(i=>i.ingredientId===body.id); if(!item) { item={ingredientId:body.id,amount:0}; pile.push(item); } bag=item; key='amount'; }
          if(['consumable','box','itemShards','skinShards','backgroundShards'].includes(kind)) {
            bag=state.loot[{consumable:'consumables',box:'boxes',itemShards:'itemShards',skinShards:'styleShards',backgroundShards:'styleShards'}[kind]];
            key=kind==='backgroundShards' ? `background:${body.id}` : body.id;
          }
          const value=(bag[key] ?? 0)+delta;
          if(value<0 || !Number.isFinite(value) || value>Number.MAX_SAFE_INTEGER) return fail('Insufficient balance or invalid result.',409);
          if(['parts','consumable','box','itemShards','skinShards','backgroundShards'].includes(kind) && value>1000000) return fail('This inventory pile is capped at 1000000.',409);
          bag[key]=value;
        }
        await tx.saveState(player.id,state,record.version+1);
        if(state.money!==before.money) await tx.addLedger(player.id,{requestId,action:'admin',delta:state.money-before.money,balance:state.money});
        if(state.crystals!==before.crystals) await tx.addCrystalLedger(player.id,{requestId,action:'admin',delta:state.crystals-before.crystals,balance:state.crystals});
      }
      await tx.addEvent(identity,'admin.player.change',{targetTelegramId:String(body.telegramId),kind,id:body.id,delta,reason:body.reason.trim(),requestId},now());
      const result={ok:true}; await tx.saveRequest(player.id,requestId,result); return result;
    });
  }
  async function createTicket(identity,body) {
    const title=typeof body?.title==='string' ? body.title.trim() : '';
    const description=typeof body?.description==='string' ? body.description.trim() : '';
    if(title.length<3 || title.length>120 || description.length<10 || description.length>5000) return fail('Title: 3–120 characters; description: 10–5000 characters.');
    const screenshots=body.screenshots ?? [];
    if(!Array.isArray(screenshots) || screenshots.length>3 || screenshots.some(s=>typeof s!=='string' || s.length>1400000 || !/^data:image\/(png|jpeg|webp);base64,[A-Za-z0-9+/]+={0,2}$/.test(s))) return fail('Attach up to three PNG, JPEG or WebP screenshots (1 MB each).');
    const occurred=body.occurredAt ? Date.parse(body.occurredAt) : null;
    if(occurred!==null && (!Number.isFinite(occurred) || occurred>now())) return fail('Choose a valid event time in the past.');
    return repository.transaction(async tx=> {
      const player=await tx.findOrCreatePlayer(identity);
      if(await tx.recentTickets(player.id,now()-60*60*1000)>=5) return fail('Up to five tickets per hour.',429);
      const id=await tx.addTicket(player.id,{title,description,occurredAt:occurred===null ? null : new Date(occurred).toISOString(),screenshots});
      await tx.addEvent(identity,'support.ticket',{id,title},now());
      return {ok:true,id};
    });
  }
  return {audit,pruneEvents,adminPlayer,adminChange,createTicket,adminCatalog:catalog,
    checkAccess:identity=>repository.transaction(tx=>tx.findOrCreatePlayer(identity)),
    adminPromos:()=>repository.transaction(async tx=>({ok:true,promos:await tx.listPromos()})),
    adminDeletePromo:(identity,code)=>repository.transaction(async tx=>{const deleted=await tx.deletePromo(cleanCode(code)); if(!deleted) return fail('Code not found or already deleted.',404); await tx.addEvent(identity,'admin.promo.delete',{code:cleanCode(code)},now()); return {ok:true};}),
    adminEvents:body=> { if ((body?.telegramId && !/^\d{1,16}$/.test(String(body.telegramId))) || (body?.before && !/^\d{1,18}$/.test(String(body.before))) || (body?.event && (typeof body.event!=='string' || body.event.length>100))) return fail('Invalid event filter.'); return repository.transaction(async tx=>({ok:true,events:await tx.listEvents(body ?? {},now()-EVENT_LIFETIME)})); },
    adminTickets:body=> { if(body?.before && !/^\d{1,18}$/.test(String(body.before))) return fail('Invalid ticket cursor.'); return repository.transaction(async tx=>({ok:true,tickets:await tx.listTickets(body?.before)})); },
    adminCloseTicket:(identity,id)=>repository.transaction(async tx=>{if(!/^\d+$/.test(String(id))) return fail('Invalid ticket ID.'); if(!await tx.closeTicket(id)) return fail('Ticket not found.',404); await tx.addEvent(identity,'admin.ticket.close',{id},now()); return {ok:true};})};
}
