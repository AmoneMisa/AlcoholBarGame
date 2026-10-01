-- Crystal packs bought with Telegram Stars. The Telegram charge id is unique, so a payment update that is
-- delivered twice can never credit crystals twice.

CREATE TABLE IF NOT EXISTS star_purchases (
  charge_id text PRIMARY KEY,
  player_id bigint NOT NULL REFERENCES players(id) ON DELETE CASCADE,
  pack_id text NOT NULL,
  stars integer NOT NULL CHECK (stars > 0),
  crystals integer NOT NULL CHECK (crystals > 0),
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS star_purchases_player_idx ON star_purchases(player_id, created_at DESC);
