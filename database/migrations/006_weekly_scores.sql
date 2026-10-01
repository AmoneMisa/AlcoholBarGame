-- Weekly leaderboard: one row per player per week (weeks are floor(unix_ms / 7 days), UTC).
-- The score is the XP the player earned that week; the label is the public bar name, never the account name.

CREATE TABLE IF NOT EXISTS weekly_scores (
  week integer NOT NULL,
  player_id bigint NOT NULL REFERENCES players(id) ON DELETE CASCADE,
  score integer NOT NULL CHECK (score >= 0),
  label text NOT NULL,
  level integer NOT NULL DEFAULT 1,
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (week, player_id)
);
CREATE INDEX IF NOT EXISTS weekly_scores_rank_idx ON weekly_scores(week, score DESC, updated_at ASC);
