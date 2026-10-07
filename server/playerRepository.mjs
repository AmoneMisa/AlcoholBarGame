// Player storage. `createPgRepository` is used in production; `createMemoryRepository` powers tests and
// local runs without a database. Both expose the same transaction API used by the game service.

export function createPgRepository(pool) {
  return {
    async transaction(work) {
      const client = await pool.connect();
      try {
        await client.query('BEGIN');
        const result = await work(pgTx(client));
        await client.query('COMMIT');
        return result;
      } catch (error) {
        await client.query('ROLLBACK');
        throw error;
      } finally {
        client.release();
      }
    }
  };
}

function pgTx(client) {
  return {
    async lockStaffRoles() { await client.query('SELECT pg_advisory_xact_lock(86416302)'); },
    async staffRole(id) { const {rows:[row]}=await client.query('SELECT role FROM staff_roles WHERE telegram_id=$1',[id]); return row?.role ?? null; },
    async listStaff() { const {rows}=await client.query('SELECT telegram_id AS "telegramId",role,assigned_by AS "assignedBy",updated_at AS "updatedAt" FROM staff_roles ORDER BY telegram_id'); return rows; },
    async setStaffRole(id,role,actor) { if(role==='none') await client.query('DELETE FROM staff_roles WHERE telegram_id=$1',[id]); else await client.query('INSERT INTO staff_roles(telegram_id,role,assigned_by) VALUES($1,$2,$3) ON CONFLICT(telegram_id) DO UPDATE SET role=EXCLUDED.role,assigned_by=EXCLUDED.assigned_by,updated_at=now()',[id,role,actor]); },
    async adminPlayer(telegramId) { const {rows:[row]}=await client.query('SELECT id, telegram_id AS "telegramId", display_name AS name, blocked, block_reason AS "blockReason" FROM players WHERE telegram_id=$1 FOR UPDATE',[telegramId]); return row ?? null; },
    async setBlocked(id,blocked,reason) { await client.query('UPDATE players SET blocked=$2, block_reason=$3 WHERE id=$1',[id,blocked,reason]); },
    async listPromos() { const {rows}=await client.query('SELECT code,rewards,starts_at AS "startsAt",expires_at AS "expiresAt",max_uses AS "maxUses",deleted_at AS "deletedAt",(SELECT count(*)::int FROM promo_redemptions r WHERE r.code=p.code) AS uses FROM promo_codes p ORDER BY created_at DESC LIMIT 200'); return rows; },
    async deletePromo(code) { return (await client.query('UPDATE promo_codes SET deleted_at=now() WHERE code=$1 AND deleted_at IS NULL',[code])).rowCount > 0; },
    async updatePromoExpiry(code,expiresAt) { return (await client.query('UPDATE promo_codes SET expires_at=to_timestamp($2/1000.0) WHERE code=$1 AND deleted_at IS NULL',[code,expiresAt])).rowCount > 0; },
    async addEvent(identity,event,detail,at) { await client.query('INSERT INTO game_events(telegram_id,event,detail,created_at) VALUES($1,$2,$3::jsonb,to_timestamp($4/1000.0))',[identity.telegramId,event,JSON.stringify(detail),at]); },
    async pruneEvents(before) { for(const table of ['game_events','coin_ledger','crystal_ledger','loot_ledger']) await client.query('DELETE FROM '+table+' WHERE created_at <= to_timestamp($1/1000.0)',[before]); },
    async listEvents({telegramId,before,event},cutoff) { const {rows}=await client.query('SELECT id,telegram_id AS "telegramId",event,detail,created_at AS "createdAt" FROM game_events WHERE created_at > to_timestamp($1/1000.0) AND ($2::bigint IS NULL OR telegram_id=$2) AND ($3::bigint IS NULL OR id<$3) AND ($4::text IS NULL OR event=$4) ORDER BY id DESC LIMIT 100',[cutoff,telegramId || null,before || null,event || null]); return rows; },
    async addSystemMessage(message) { const {rows:[row]}=await client.query('INSERT INTO system_messages(title,body,target_telegram_id,created_by,created_at,expires_at) VALUES($1,$2,$3,$4,to_timestamp($5/1000.0),to_timestamp($6/1000.0)) RETURNING id',[message.title,message.body,message.targetTelegramId,message.createdBy,message.createdAt,message.expiresAt]); return row.id; },
    async listSystemMessages(telegramId,now) { const {rows}=await client.query('SELECT id,title,body,target_telegram_id AS "targetTelegramId",(extract(epoch FROM created_at)*1000)::bigint AS "createdAt",(extract(epoch FROM expires_at)*1000)::bigint AS "expiresAt" FROM system_messages WHERE expires_at>to_timestamp($2/1000.0) AND (target_telegram_id IS NULL OR target_telegram_id=$1) ORDER BY id',[telegramId,now]); return rows.map(row=>({...row,id:Number(row.id),createdAt:Number(row.createdAt),expiresAt:Number(row.expiresAt)})); },
    async listSentSystemMessages() { const {rows}=await client.query('SELECT id,title,body,target_telegram_id AS "targetTelegramId",created_by AS "createdBy",created_at AS "createdAt",expires_at AS "expiresAt" FROM system_messages ORDER BY id DESC LIMIT 30'); return rows; },
    async addTicket(playerId,ticket) { const {rows:[row]}=await client.query('INSERT INTO support_tickets(player_id,title,description,occurred_at,screenshots) VALUES($1,$2,$3,$4,$5::jsonb) RETURNING id',[playerId,ticket.title,ticket.description,ticket.occurredAt,JSON.stringify(ticket.screenshots)]); return row.id; },
    async recentTickets(playerId,since) { return (await client.query('SELECT 1 FROM support_tickets WHERE player_id=$1 AND created_at>to_timestamp($2/1000.0)',[playerId,since])).rowCount; },
    async listTickets(before) { const {rows}=await client.query('SELECT t.*,p.telegram_id AS "telegramId",p.display_name AS name FROM support_tickets t JOIN players p ON p.id=t.player_id WHERE ($1::bigint IS NULL OR t.id<$1) ORDER BY t.id DESC LIMIT 20',[before || null]); return rows; },
    async closeTicket(id) { return (await client.query("UPDATE support_tickets SET status='closed' WHERE id=$1",[id])).rowCount > 0; },
    async createPromo(promo) {
      const {rowCount} = await client.query('INSERT INTO promo_codes(code,rewards,expires_at,starts_at,max_uses) VALUES($1,$2::jsonb,to_timestamp($3/1000.0),to_timestamp($4/1000.0),$5) ON CONFLICT DO NOTHING',[promo.code, JSON.stringify(promo.rewards), promo.expiresAt, promo.startsAt, promo.maxUses]);
      return rowCount === 1;
    },
    async findPromo(code) {
      const {rows:[row]} = await client.query('SELECT rewards, expires_at, starts_at, max_uses, deleted_at FROM promo_codes WHERE code=$1 FOR UPDATE',[code]);
      const {rows:[count]}=await client.query('SELECT count(*)::int AS uses FROM promo_redemptions WHERE code=$1',[code]);
      return row ? {code, rewards:row.rewards, expiresAt:row.expires_at === null ? null : new Date(row.expires_at).getTime(), startsAt:new Date(row.starts_at).getTime(), maxUses:row.max_uses, uses:count.uses, deletedAt:row.deleted_at} : null;
    },
    async redeemPromo(code,playerId) {
      const {rowCount} = await client.query('INSERT INTO promo_redemptions(code,player_id) VALUES($1,$2) ON CONFLICT DO NOTHING',[code,playerId]);
      return rowCount === 1;
    },
    async findOrCreatePlayer(identity) {
      const { rows: [player] } = await client.query(
        `INSERT INTO players (auth_key, telegram_id, display_name, username) VALUES ($1, $2, $3, $4)
         ON CONFLICT (auth_key) DO UPDATE SET display_name = EXCLUDED.display_name, username = EXCLUDED.username, last_seen_at = now()
         RETURNING id, display_name AS name, blocked, block_reason`,
        [identity.key, identity.telegramId, identity.name, identity.username]
      );
      if (player.blocked) { const error = new Error("Account blocked: " + player.block_reason); error.status = 403; throw error; }
      return player;
    },
    async lockState(playerId) {
      const { rows: [row] } = await client.query('SELECT state, version FROM player_states WHERE player_id = $1 FOR UPDATE', [playerId]);
      return row ?? null;
    },
    async saveState(playerId, state, version) {
      await client.query(
        `INSERT INTO player_states (player_id, state, version) VALUES ($1, $2::jsonb, $3)
         ON CONFLICT (player_id) DO UPDATE SET state = EXCLUDED.state, version = EXCLUDED.version, updated_at = now()`,
        [playerId, JSON.stringify(state), version]
      );
    },
    async findRequest(playerId, requestId) {
      const { rows: [row] } = await client.query('SELECT response FROM processed_requests WHERE player_id = $1 AND request_id = $2', [playerId, requestId]);
      return row?.response ?? null;
    },
    async saveRequest(playerId, requestId, response) {
      await client.query('INSERT INTO processed_requests (player_id, request_id, response) VALUES ($1, $2, $3::jsonb) ON CONFLICT DO NOTHING', [playerId, requestId, JSON.stringify(response)]);
    },
    async pruneRequests(before) {
      const { rowCount } = await client.query('DELETE FROM processed_requests WHERE created_at < to_timestamp($1 / 1000.0)', [before]);
      return rowCount;
    },
    async addLedger(playerId, entry) {
      await client.query('INSERT INTO coin_ledger (player_id, request_id, action, delta, balance) VALUES ($1, $2, $3, $4, $5)', [playerId, entry.requestId, entry.action, entry.delta, entry.balance]);
    },
    async setWeeklyScore(playerId, week, entry) {
      await client.query(`INSERT INTO weekly_scores (week, player_id, score, label, level) VALUES ($1, $2, $3, $4, $5)
        ON CONFLICT (week, player_id) DO UPDATE SET score = GREATEST(weekly_scores.score, EXCLUDED.score), label = EXCLUDED.label, level = EXCLUDED.level,
          updated_at = CASE WHEN EXCLUDED.score > weekly_scores.score THEN now() ELSE weekly_scores.updated_at END`, [week, playerId, entry.score, entry.label, entry.level]);
    },
    async topWeekly(week, limit) {
      const { rows } = await client.query('SELECT player_id, score, label, level FROM weekly_scores WHERE week = $1 ORDER BY score DESC, updated_at ASC, player_id ASC LIMIT $2', [week, limit]);
      return rows.map((row, index) => ({ playerId: Number(row.player_id), rank: index + 1, score: row.score, label: row.label, level: row.level }));
    },
    async weeklyFor(week, playerIds) {
      const { rows } = await client.query('SELECT player_id, score, label, level FROM weekly_scores WHERE week = $1 AND player_id = ANY($2::bigint[]) ORDER BY score DESC, updated_at ASC, player_id ASC', [week, playerIds]);
      return rows.map((row) => ({ playerId: Number(row.player_id), score: row.score, label: row.label, level: row.level }));
    },
    async weeklyStanding(week, playerId) {
      const { rows: [row] } = await client.query(`SELECT s.score,
          (SELECT COUNT(*) FROM weekly_scores o WHERE o.week = s.week AND (o.score > s.score OR (o.score = s.score AND (o.updated_at < s.updated_at OR (o.updated_at = s.updated_at AND o.player_id < s.player_id))))) + 1 AS rank,
          (SELECT COUNT(*) FROM weekly_scores o WHERE o.week = s.week) AS size
        FROM weekly_scores s WHERE s.week = $1 AND s.player_id = $2`, [week, playerId]);
      return row ? { week, rank: Number(row.rank), size: Number(row.size), score: row.score } : null;
    },
    async addLootLedger(playerId, entry) {
      await client.query('INSERT INTO loot_ledger (player_id, request_id, action, message, detail) VALUES ($1, $2, $3, $4, $5::jsonb)', [playerId, entry.requestId, entry.action, entry.message, JSON.stringify(entry.detail ?? {})]);
    },
    async addCrystalLedger(playerId, entry) {
      await client.query('INSERT INTO crystal_ledger (player_id, request_id, action, delta, balance) VALUES ($1, $2, $3, $4, $5)', [playerId, entry.requestId, entry.action, entry.delta, entry.balance]);
    },
    async hasStarPurchase(playerId, packId) {
      const { rowCount } = await client.query('SELECT 1 FROM star_purchases WHERE player_id = $1 AND pack_id = $2 LIMIT 1', [playerId, packId]);
      return rowCount > 0;
    },
    // A Telegram Stars payment is stored once per charge id; `true` means this call recorded it.
    async addStarPurchase(playerId, purchase) {
      const { rowCount } = await client.query(
        `INSERT INTO star_purchases (charge_id, player_id, pack_id, stars, crystals) VALUES ($1, $2, $3, $4, $5) ON CONFLICT (charge_id) DO NOTHING`,
        [purchase.chargeId, playerId, purchase.packId, purchase.stars, purchase.crystals]);
      return rowCount === 1;
    },

    // ---- Friends and gifts ----
    async getPlayer(id) {
      const { rows: [row] } = await client.query('SELECT id, display_name AS name FROM players WHERE id = $1', [id]);
      return row ? { id: Number(row.id), name: row.name } : null;
    },
    async readState(playerId) {
      const { rows: [row] } = await client.query('SELECT state FROM player_states WHERE player_id = $1', [playerId]);
      return row?.state ?? null;
    },
    async listFriendships(playerId) {
      const { rows } = await client.query(
        `SELECT f.player_id, f.friend_id, f.status, p.display_name AS name
           FROM friendships f JOIN players p ON p.id = CASE WHEN f.player_id = $1 THEN f.friend_id ELSE f.player_id END
          WHERE f.player_id = $1 OR f.friend_id = $1`, [playerId]);
      return rows.map((row) => ({ playerId: Number(row.player_id), friendId: Number(row.friend_id), status: row.status, name: row.name }));
    },
    async friendship(playerId, friendId) {
      const { rows: [row] } = await client.query('SELECT status FROM friendships WHERE player_id = $1 AND friend_id = $2', [playerId, friendId]);
      return row?.status ?? null;
    },
    async setFriendship(playerId, friendId, status) {
      await client.query(`INSERT INTO friendships (player_id, friend_id, status) VALUES ($1, $2, $3)
        ON CONFLICT (player_id, friend_id) DO UPDATE SET status = EXCLUDED.status`, [playerId, friendId, status]);
    },
    async deleteFriendship(a, b) {
      await client.query('DELETE FROM friendships WHERE (player_id = $1 AND friend_id = $2) OR (player_id = $2 AND friend_id = $1)', [a, b]);
    },
    async addGift(gift) {
      const { rows: [row] } = await client.query('INSERT INTO gifts (from_id, to_id, kind, payload, created_at) VALUES ($1, $2, $3, $4::jsonb, to_timestamp($5/1000.0)) RETURNING id', [gift.fromId, gift.toId, gift.payload.kind, JSON.stringify(gift.payload),gift.createdAt ?? Date.now()]);
      return Number(row.id);
    },
    async listGifts(toId) {
      const { rows } = await client.query(`SELECT g.id, g.from_id, g.payload, g.created_at, p.display_name AS from_name
          FROM gifts g JOIN players p ON p.id = g.from_id WHERE g.to_id = $1 AND g.claimed_at IS NULL ORDER BY g.id`, [toId]);
      return rows.map((row) => ({ id: Number(row.id), fromId: Number(row.from_id), fromName: row.from_name, payload: row.payload, createdAt: new Date(row.created_at).getTime() }));
    },
    async expiredGifts(before) {
      const {rows}=await client.query('SELECT id,to_id FROM gifts WHERE claimed_at IS NULL AND created_at <= to_timestamp($1/1000.0) ORDER BY id',[before]);
      return rows.map(row=>({id:Number(row.id),toId:Number(row.to_id)}));
    },
    async takeGift(giftId, toId) {
      const { rows: [row] } = await client.query(`UPDATE gifts g SET claimed_at = now() FROM players p
          WHERE g.id = $1 AND g.to_id = $2 AND g.claimed_at IS NULL AND p.id = g.from_id
          RETURNING g.id, g.from_id, g.payload, p.display_name AS from_name`, [giftId, toId]);
      return row ? { id: Number(row.id), fromId: Number(row.from_id), fromName: row.from_name, payload: row.payload } : null;
    }
  };
}

export function createMemoryRepository() {
  const events = [], tickets = [], systemMessages = [];
  const staff=new Map();
  const promos = new Map();
  const redeemedPromos = new Set();
  const players = new Map();
  const states = new Map();
  const requests = new Map();
  const ledger = [];
  const friendships = new Map();   // "a:b" → status (directional)
  const gifts = [];
  let nextGiftId = 1;
  const crystalLedger = [];
  const starPurchases = new Map();
  const lootLedger = [];
  const weekly = new Map();   // `${week}:${playerId}` → { week, playerId, score, label, level, order }
  let weeklyOrder = 0;
  const weeklyRows = (week) => [...weekly.values()].filter((row) => row.week === week).sort((a, b) => b.score - a.score || a.order - b.order);
  let queue = Promise.resolve();
  let nextId = 1;
  const tx = {
    async lockStaffRoles() {},
    async staffRole(id) { return staff.get(String(id))?.role ?? null; },
    async listStaff() { return structuredClone([...staff.values()]); },
    async setStaffRole(id,role,actor) { if(role==='none') staff.delete(String(id)); else staff.set(String(id),{telegramId:String(id),role,assignedBy:String(actor)}); },
    async adminPlayer(telegramId) { return [...players.values()].find(p=>String(p.telegramId)===String(telegramId)) ?? null; },
    async setBlocked(id,blocked,reason) { const p=[...players.values()].find(p=>p.id===id); p.blocked=blocked; p.blockReason=reason; },
    async listPromos() { return Promise.all([...promos.keys()].map(code=>tx.findPromo(code))); },
    async deletePromo(code) { const p=promos.get(code); if (!p || p.deletedAt) return false; p.deletedAt=Date.now(); return true; },
    async updatePromoExpiry(code,expiresAt) { const p=promos.get(code);if(!p || p.deletedAt)return false;p.expiresAt=expiresAt;return true; },
    async addEvent(identity,event,detail,at) { events.push({id:events.length ? events.at(-1).id+1 : 1,telegramId:identity.telegramId,event,detail:structuredClone(detail),createdAt:at}); },
    async pruneEvents(before) { while(events.length && events[0].createdAt<=before) events.shift(); },
    async listEvents(filter,cutoff) { return events.filter(e=>e.createdAt>cutoff && (!filter.telegramId || String(e.telegramId)===String(filter.telegramId)) && (!filter.before || e.id<filter.before) && (!filter.event || e.event===filter.event)).reverse().slice(0,100); },
    async addSystemMessage(message) { const id=systemMessages.length+1; systemMessages.push({id,...structuredClone(message)}); return id; },
    async listSystemMessages(telegramId,now) { return structuredClone(systemMessages.filter(m=>m.expiresAt>now && (m.targetTelegramId===null || String(m.targetTelegramId)===String(telegramId)))); },
    async listSentSystemMessages() { return structuredClone([...systemMessages].reverse().slice(0,30)); },
    async addTicket(playerId,ticket) { const id=tickets.length+1; tickets.push({id,player_id:playerId,...structuredClone(ticket),created_at:Date.now(),status:'open'}); return id; },
    async recentTickets(playerId,since) { return tickets.filter(t=>t.player_id===playerId && t.created_at>since).length; },
    async listTickets(before) { return tickets.filter(t=>!before || t.id<before).reverse().slice(0,20).map(t=>({...t,telegramId:[...players.values()].find(p=>p.id===t.player_id)?.telegramId})); },
    async closeTicket(id) { const t=tickets.find(t=>String(t.id)===String(id)); if(!t) return false; t.status='closed'; return true; },
    async createPromo(promo) { if (promos.has(promo.code)) return false; promos.set(promo.code,structuredClone(promo)); return true; },
    async findPromo(code) { const p=promos.get(code); return p ? {...structuredClone(p),uses:[...redeemedPromos].filter(k=>k.startsWith(code+":")).length} : null; },
    async redeemPromo(code,id) { const key = `${code}:${id}`; if (redeemedPromos.has(key)) return false; redeemedPromos.add(key); return true; },
    async findOrCreatePlayer(identity) {
      if (!players.has(identity.key)) players.set(identity.key, { id: nextId++, name: identity.name, telegramId:identity.telegramId, blocked:false });
      const player=players.get(identity.key); if(player.blocked) { const error=new Error("Account blocked: "+player.blockReason); error.status=403; throw error; } return player;
    },
    async lockState(playerId) { const row = states.get(playerId); return row ? structuredClone(row) : null; },
    async saveState(playerId, state, version) { states.set(playerId, structuredClone({ state, version })); },
    async findRequest(playerId, requestId) { return requests.get(`${playerId}:${requestId}`) ?? null; },
    async saveRequest(playerId, requestId, response) { requests.set(`${playerId}:${requestId}`, structuredClone(response)); },
    async pruneRequests() { return 0; },
    async addLedger(playerId, entry) { ledger.push({ playerId, ...entry }); },
    async addCrystalLedger(playerId, entry) { crystalLedger.push({ playerId, ...entry }); },
    async hasStarPurchase(playerId, packId) { return [...starPurchases.values()].some((item) => item.playerId === playerId && item.packId === packId); },
    async addStarPurchase(playerId, purchase) {
      if (starPurchases.has(purchase.chargeId)) return false;
      starPurchases.set(purchase.chargeId, { playerId, ...purchase });
      return true;
    },
    async setWeeklyScore(playerId, week, entry) {
      const key = `${week}:${playerId}`;
      const old = weekly.get(key);
      if (old && entry.score <= old.score) { old.label = entry.label; old.level = entry.level; return; }
      weekly.set(key, { week, playerId, score: entry.score, label: entry.label, level: entry.level, order: ++weeklyOrder });
    },
    async topWeekly(week, limit) { return weeklyRows(week).slice(0, limit).map((row, index) => ({ playerId: row.playerId, rank: index + 1, score: row.score, label: row.label, level: row.level })); },
    async weeklyFor(week, playerIds) { return weeklyRows(week).filter((row) => playerIds.includes(row.playerId)).map((row) => ({ playerId: row.playerId, score: row.score, label: row.label, level: row.level })); },
    async weeklyStanding(week, playerId) {
      const rows = weeklyRows(week);
      const index = rows.findIndex((row) => row.playerId === playerId);
      return index < 0 ? null : { week, rank: index + 1, size: rows.length, score: rows[index].score };
    },
    async addLootLedger(playerId, entry) { lootLedger.push({ playerId, ...structuredClone(entry) }); },
    async getPlayer(id) {
      for (const player of players.values()) if (player.id === id) return { id: player.id, name: player.name };
      return null;
    },
    async readState(playerId) { const row = states.get(playerId); return row ? structuredClone(row.state) : null; },
    async listFriendships(playerId) {
      const result = [];
      for (const [key, status] of friendships) {
        const [a, b] = key.split(':').map(Number);
        if (a !== playerId && b !== playerId) continue;
        result.push({ playerId: a, friendId: b, status, name: (await tx.getPlayer(a === playerId ? b : a))?.name ?? '' });
      }
      return result;
    },
    async friendship(a, b) { return friendships.get(`${a}:${b}`) ?? null; },
    async setFriendship(a, b, status) { friendships.set(`${a}:${b}`, status); },
    async deleteFriendship(a, b) { friendships.delete(`${a}:${b}`); friendships.delete(`${b}:${a}`); },
    async addGift(gift) { const id = nextGiftId++; gifts.push({ id, fromId: gift.fromId, toId: gift.toId, payload: structuredClone(gift.payload), createdAt: gift.createdAt ?? Date.now(), claimed: false }); return id; },
    async expiredGifts(before) { return gifts.filter(gift=>!gift.claimed && gift.createdAt<=before).map(gift=>({id:gift.id,toId:gift.toId})); },
    async listGifts(toId) {
      return Promise.all(gifts.filter((gift) => gift.toId === toId && !gift.claimed)
        .map(async (gift) => ({ id: gift.id, fromId: gift.fromId, fromName: (await tx.getPlayer(gift.fromId))?.name ?? '', payload: structuredClone(gift.payload), createdAt: gift.createdAt })));
    },
    async takeGift(giftId, toId) {
      const gift = gifts.find((item) => item.id === giftId && item.toId === toId && !item.claimed);
      if (!gift) return null;
      gift.claimed = true;
      return { id: gift.id, fromId: gift.fromId, fromName: (await tx.getPlayer(gift.fromId))?.name ?? '', payload: structuredClone(gift.payload) };
    }
  };
  return {
    ledger,
    crystalLedger,
    starPurchases,
    lootLedger,
    weekly,
    // Stored (full, secret) states by player id — for tests.
    states,
    // Transactions run one at a time, like row locks for a single player.
    transaction(work) {
      const run = queue.then(() => work(tx));
      queue = run.catch(() => undefined);
      return run;
    }
  };
}
