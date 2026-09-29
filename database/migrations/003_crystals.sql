-- Append-only audit trail for premium currency. Crystal balances remain part of the
-- server-owned player snapshot; this ledger makes every gain and purchase auditable.

CREATE TABLE IF NOT EXISTS crystal_ledger (
  id bigserial PRIMARY KEY,
  player_id bigint NOT NULL REFERENCES players(id) ON DELETE CASCADE,
  request_id text NOT NULL,
  action text NOT NULL,
  delta integer NOT NULL,
  balance integer NOT NULL CHECK (balance >= 0),
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS crystal_ledger_player_idx ON crystal_ledger(player_id, created_at DESC);

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'player_state_crystals_nonnegative') THEN
    ALTER TABLE player_states ADD CONSTRAINT player_state_crystals_nonnegative
      CHECK (COALESCE((state->>'crystals')::integer, 0) >= 0);
  END IF;
END $$;
