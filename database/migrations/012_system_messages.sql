CREATE TABLE IF NOT EXISTS system_messages (
  id bigserial PRIMARY KEY,
  title text NOT NULL,
  body text NOT NULL,
  target_telegram_id bigint,
  created_by bigint,
  created_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz NOT NULL
);
CREATE INDEX IF NOT EXISTS system_messages_active ON system_messages (expires_at);
