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
    async addLedger(playerId, entry) {
      await client.query('INSERT INTO coin_ledger (player_id, request_id, action, delta, balance) VALUES ($1, $2, $3, $4, $5)', [playerId, entry.requestId, entry.action, entry.delta, entry.balance]);
    }
  };
}

export function createMemoryRepository() {
  const players = new Map();
  const states = new Map();
  const requests = new Map();
  const ledger = [];
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
    async addLedger(playerId, entry) { ledger.push({ playerId, ...entry }); }
  };
  return {
    ledger,
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
