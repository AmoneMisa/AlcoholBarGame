-- "Hello" popups shown to players when they open the game, written by staff in the admin page.
-- A player can tick "don't show me this again today" (kept on the device, keyed by id + updated_at).
CREATE TABLE IF NOT EXISTS hello_notices (
  id bigserial PRIMARY KEY,
  title text NOT NULL,
  body text NOT NULL,
  active boolean NOT NULL DEFAULT true,
  starts_at timestamptz,
  ends_at timestamptz,
  created_by bigint,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
