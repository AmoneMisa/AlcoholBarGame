CREATE TABLE IF NOT EXISTS telegram_notifications (
  player_id bigint PRIMARY KEY REFERENCES players(id) ON DELETE CASCADE,
  enabled boolean NOT NULL DEFAULT false,
  prefs jsonb NOT NULL DEFAULT '{}'::jsonb,
  sent jsonb NOT NULL DEFAULT '{}'::jsonb,
  enabled_at timestamptz NOT NULL DEFAULT now(),
  checked_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS telegram_notifications_due_idx ON telegram_notifications(checked_at) WHERE enabled;
