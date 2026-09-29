-- Player accounts and server-owned game state.

CREATE TABLE IF NOT EXISTS players (
  id bigserial PRIMARY KEY,
  auth_key text NOT NULL UNIQUE,              -- 'tg:<telegram id>' (or 'dev:<name>' for local development only)
  telegram_id bigint UNIQUE,
  display_name text NOT NULL,
  username text,
  created_at timestamptz NOT NULL DEFAULT now(),
  last_seen_at timestamptz NOT NULL DEFAULT now()
);

-- The whole game state as one document, written only by the server's rule engine.
CREATE TABLE IF NOT EXISTS player_states (
  player_id bigint PRIMARY KEY REFERENCES players(id) ON DELETE CASCADE,
  state jsonb NOT NULL,
  version integer NOT NULL,
  updated_at timestamptz NOT NULL DEFAULT now(),
  CHECK ((state->>'money')::numeric >= 0)
);

-- Append-only audit trail of every coin movement.
CREATE TABLE IF NOT EXISTS coin_ledger (
  id bigserial PRIMARY KEY,
  player_id bigint NOT NULL REFERENCES players(id) ON DELETE CASCADE,
  request_id text NOT NULL,
  action text NOT NULL,
  delta numeric(14,2) NOT NULL,
  balance numeric(14,2) NOT NULL CHECK (balance >= 0),
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS coin_ledger_player_idx ON coin_ledger(player_id, created_at DESC);

-- Idempotency: a request id is applied once; retries get the stored answer.
CREATE TABLE IF NOT EXISTS processed_requests (
  player_id bigint NOT NULL REFERENCES players(id) ON DELETE CASCADE,
  request_id text NOT NULL,
  response jsonb NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (player_id, request_id)
);
CREATE INDEX IF NOT EXISTS processed_requests_age_idx ON processed_requests(created_at);
