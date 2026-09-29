-- Friends and gifts.

-- One row per direction. A request is (sender → receiver, 'pending'); accepting stores both directions as 'accepted'.
CREATE TABLE IF NOT EXISTS friendships (
  player_id bigint NOT NULL REFERENCES players(id) ON DELETE CASCADE,
  friend_id bigint NOT NULL REFERENCES players(id) ON DELETE CASCADE,
  status text NOT NULL CHECK (status IN ('pending', 'accepted')),
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (player_id, friend_id),
  CHECK (player_id <> friend_id)
);
CREATE INDEX IF NOT EXISTS friendships_friend_idx ON friendships(friend_id);

-- Gifts are paid by the sender when sent and applied to the receiver's game when claimed.
CREATE TABLE IF NOT EXISTS gifts (
  id bigserial PRIMARY KEY,
  from_id bigint NOT NULL REFERENCES players(id) ON DELETE CASCADE,
  to_id bigint NOT NULL REFERENCES players(id) ON DELETE CASCADE,
  kind text NOT NULL,
  payload jsonb NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  claimed_at timestamptz
);
CREATE INDEX IF NOT EXISTS gifts_inbox_idx ON gifts(to_id) WHERE claimed_at IS NULL;
