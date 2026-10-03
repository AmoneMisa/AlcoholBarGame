ALTER TABLE players ADD COLUMN blocked boolean NOT NULL DEFAULT false;
ALTER TABLE players ADD COLUMN block_reason text NOT NULL DEFAULT '';
ALTER TABLE promo_codes ADD COLUMN starts_at timestamptz NOT NULL DEFAULT now();
ALTER TABLE promo_codes ADD COLUMN max_uses integer;
ALTER TABLE promo_codes ADD COLUMN deleted_at timestamptz;
CREATE TABLE game_events (
  id bigserial PRIMARY KEY,
  telegram_id bigint,
  event text NOT NULL,
  detail jsonb NOT NULL DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX game_events_time ON game_events(created_at);
CREATE INDEX game_events_actor_time ON game_events(telegram_id, created_at);
CREATE TABLE support_tickets (
  id bigserial PRIMARY KEY,
  player_id bigint NOT NULL REFERENCES players(id),
  title text NOT NULL,
  description text NOT NULL,
  occurred_at timestamptz,
  screenshots jsonb NOT NULL DEFAULT '[]',
  status text NOT NULL DEFAULT 'open' CHECK (status IN ('open','closed')),
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX support_tickets_time ON support_tickets(created_at);
