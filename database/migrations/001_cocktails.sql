CREATE TABLE IF NOT EXISTS schema_migrations (
  version text PRIMARY KEY,
  applied_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS cocktails (
  id text PRIMARY KEY,
  name text NOT NULL UNIQUE,
  price numeric(10,2) NOT NULL CHECK (price >= 0),
  needs_shake boolean NOT NULL DEFAULT false,
  category text NOT NULL CHECK (category IN ('classic', 'cocktail')),
  origin text NOT NULL,
  story text NOT NULL,
  tasting_notes jsonb NOT NULL DEFAULT '[]'::jsonb CHECK (jsonb_typeof(tasting_notes) = 'array'),
  occasions jsonb NOT NULL DEFAULT '[]'::jsonb CHECK (jsonb_typeof(occasions) = 'array'),
  method jsonb NOT NULL DEFAULT '[]'::jsonb CHECK (jsonb_typeof(method) = 'array'),
  display_order integer NOT NULL DEFAULT 0,
  enabled boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS cocktail_ingredients (
  cocktail_id text NOT NULL REFERENCES cocktails(id) ON DELETE CASCADE,
  ingredient_id text NOT NULL,
  amount numeric(10,2) NOT NULL CHECK (amount > 0),
  position integer NOT NULL,
  PRIMARY KEY (cocktail_id, ingredient_id)
);

CREATE INDEX IF NOT EXISTS cocktails_enabled_order_idx ON cocktails(enabled, display_order);
CREATE INDEX IF NOT EXISTS cocktail_ingredients_cocktail_idx ON cocktail_ingredients(cocktail_id, position);

CREATE OR REPLACE FUNCTION set_cocktail_updated_at()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS cocktails_set_updated_at ON cocktails;
CREATE TRIGGER cocktails_set_updated_at
BEFORE UPDATE ON cocktails
FOR EACH ROW EXECUTE FUNCTION set_cocktail_updated_at();

