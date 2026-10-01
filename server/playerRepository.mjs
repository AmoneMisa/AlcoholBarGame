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
    async findOrCreatePlayer(identity) {
      const { rows: [player] } = await client.query(
        `INSERT INTO players (auth_key, telegram_id, display_name, username) VALUES ($1, $2, $3, $4)
         ON CONFLICT (auth_key) DO UPDATE SET display_name = EXCLUDED.display_name, username = EXCLUDED.username, last_seen_at = now()
         RETURNING id, display_name AS name`,
        [identity.key, identity.telegramId, identity.name, identity.username]
      );
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
      const { rows: [row] } = await client.query('INSERT INTO gifts (from_id, to_id, kind, payload) VALUES ($1, $2, $3, $4::jsonb) RETURNING id', [gift.fromId, gift.toId, gift.payload.kind, JSON.stringify(gift.payload)]);
      return Number(row.id);
    },
    async listGifts(toId) {
      const { rows } = await client.query(`SELECT g.id, g.from_id, g.payload, g.created_at, p.display_name AS from_name
          FROM gifts g JOIN players p ON p.id = g.from_id WHERE g.to_id = $1 AND g.claimed_at IS NULL ORDER BY g.id`, [toId]);
      return rows.map((row) => ({ id: Number(row.id), fromId: Number(row.from_id), fromName: row.from_name, payload: row.payload, createdAt: new Date(row.created_at).getTime() }));
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
  const players = new Map();
  const states = new Map();
  const requests = new Map();
  const ledger = [];
  const friendships = new Map();   // "a:b" → status (directional)
  const gifts = [];
  let nextGiftId = 1;
  const crystalLedger = [];
  const starPurchases = new Map();
  let queue = Promise.resolve();
  let nextId = 1;
  const tx = {
    async findOrCreatePlayer(identity) {
      if (!players.has(identity.key)) players.set(identity.key, { id: nextId++, name: identity.name });
      return players.get(identity.key);
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
    async addGift(gift) { const id = nextGiftId++; gifts.push({ id, fromId: gift.fromId, toId: gift.toId, payload: structuredClone(gift.payload), createdAt: Date.now(), claimed: false }); return id; },
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
