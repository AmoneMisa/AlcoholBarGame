import express from 'express';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { listCocktails, migrate, pool, seedCocktailsIfEmpty } from './database.mjs';

const port = Number(process.env.PORT || 3000);
const app = express();
app.disable('x-powered-by');

app.get('/api/health', async (_request, response) => {
  try {
    await pool.query('SELECT 1');
    response.json({ status: 'ok', database: 'connected' });
  } catch {
    response.status(503).json({ status: 'error', database: 'unavailable' });
  }
});

app.get('/api/cocktails', async (_request, response, next) => {
  try {
    response.set('Cache-Control', 'public, max-age=60, stale-while-revalidate=300');
    response.json(await listCocktails());
  } catch (error) {
    next(error);
  }
});

const here = path.dirname(fileURLToPath(import.meta.url));
const dist = path.resolve(here, '../dist');
app.use(express.static(dist, { maxAge: '1y', immutable: true, index: false }));
app.use((_request, response) => response.sendFile(path.join(dist, 'index.html')));

app.use((error, _request, response, _next) => {
  console.error(error);
  response.status(500).json({ error: 'Internal server error' });
});

await migrate();
const seeded = await seedCocktailsIfEmpty();
if (seeded.inserted) console.log(`Seeded ${seeded.inserted} cocktails.`);

const server = app.listen(port, '0.0.0.0', () => console.log(`BarLingo listening on :${port}`));
const shutdown = async () => {
  server.close(async () => {
    await pool.end();
    process.exit(0);
  });
};
process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);

