-- Append-only audit trail for loot actions (box rolls, choice picks, style draws, prestige, shop buys, claims).
-- The player's snapshot stays the source of truth; this table lets support see what was rolled and when.

CREATE TABLE IF NOT EXISTS loot_ledger (
  id bigserial PRIMARY KEY,
  player_id bigint NOT NULL REFERENCES players(id) ON DELETE CASCADE,
  request_id text NOT NULL,
  action text NOT NULL,
  message text NOT NULL,
  detail jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS loot_ledger_player_idx ON loot_ledger(player_id, created_at DESC);
