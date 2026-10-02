CREATE TABLE IF NOT EXISTS promo_codes (
  code text PRIMARY KEY,
  rewards jsonb NOT NULL,
  expires_at timestamptz NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS promo_redemptions (
  code text NOT NULL REFERENCES promo_codes(code),
  player_id bigint NOT NULL REFERENCES players(id),
  redeemed_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (code, player_id)
);
