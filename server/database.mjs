import { readFile, readdir } from 'node:fs/promises';
import path from 'node:path';
import pg from 'pg';

const { Pool } = pg;
const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) throw new Error('DATABASE_URL is required');

export const pool = new Pool({ connectionString: databaseUrl, max: 10 });

export async function migrate() {
  await pool.query(`CREATE TABLE IF NOT EXISTS schema_migrations (
    version text PRIMARY KEY,
    applied_at timestamptz NOT NULL DEFAULT now()
  )`);
  const directory = path.resolve('database/migrations');
  const files = (await readdir(directory)).filter((file) => file.endsWith('.sql')).sort();
  for (const file of files) {
    const applied = await pool.query('SELECT 1 FROM schema_migrations WHERE version = $1', [file]);
    if (applied.rowCount) continue;
    const sql = await readFile(path.join(directory, file), 'utf8');
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      await client.query(sql);
      await client.query('INSERT INTO schema_migrations(version) VALUES ($1) ON CONFLICT DO NOTHING', [file]);
      await client.query('COMMIT');
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }
}

// Seeds the catalog from the game's own recipe list (passed in by the server entry).
export async function seedCocktailsIfEmpty(recipes) {
  const { rows: [{ count }] } = await pool.query('SELECT count(*)::int AS count FROM cocktails');
  if (count > 0) return { inserted: 0 };
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    for (const [displayOrder, recipe] of recipes.entries()) {
      await client.query(
        `INSERT INTO cocktails
          (id,name,price,needs_shake,category,origin,story,tasting_notes,occasions,method,display_order)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8::jsonb,$9::jsonb,$10::jsonb,$11)`,
        [recipe.id, recipe.name, recipe.price, recipe.needsShake, recipe.category, recipe.origin, recipe.story,
          JSON.stringify(recipe.tastingNotes), JSON.stringify(recipe.occasions), JSON.stringify(recipe.method), displayOrder]
      );
      for (const [position, ingredient] of recipe.ingredients.entries()) {
        await client.query(
          'INSERT INTO cocktail_ingredients(cocktail_id,ingredient_id,amount,position) VALUES ($1,$2,$3,$4)',
          [recipe.id, ingredient.ingredientId, ingredient.amount, position]
        );
      }
    }
    await client.query('COMMIT');
    return { inserted: recipes.length };
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

export async function listCocktails() {
  const { rows } = await pool.query(`
    SELECT c.id, c.name, c.price::float8 AS price, c.needs_shake AS "needsShake", c.category,
           c.origin, c.story, c.tasting_notes AS "tastingNotes", c.occasions, c.method,
           COALESCE(jsonb_agg(jsonb_build_object(
             'ingredientId', ci.ingredient_id,
             'amount', ci.amount::float8
           ) ORDER BY ci.position) FILTER (WHERE ci.cocktail_id IS NOT NULL), '[]'::jsonb) AS ingredients
    FROM cocktails c
    LEFT JOIN cocktail_ingredients ci ON ci.cocktail_id = c.id
    WHERE c.enabled = true
    GROUP BY c.id
    ORDER BY c.display_order, c.name
  `);
  return rows;
}

