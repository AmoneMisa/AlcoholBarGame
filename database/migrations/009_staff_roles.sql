CREATE TABLE staff_roles (
  telegram_id bigint PRIMARY KEY,
  role text NOT NULL CHECK (role IN ('moderator', 'admin')),
  assigned_by bigint NOT NULL,
  updated_at timestamptz NOT NULL DEFAULT now()
);
