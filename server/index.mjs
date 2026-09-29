import express from 'express';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { RECIPES } from '../src/domain/catalog';
import { createApp, handleErrors } from './app.mjs';
import { listCocktails, migrate, pool, seedCocktailsIfEmpty } from './database.mjs';
import { checkEnglish } from './english.mjs';
import { createGameService } from './gameService.mjs';
import { createPgRepository } from './playerRepository.mjs';
import { createTelegramBot } from './telegramBot.mjs';

const port = Number(process.env.PORT || 3000);
const botToken = process.env.TELEGRAM_BOT_TOKEN;
// Only for local development: lets the browser play without Telegram. Never enable in production.
const allowDevLogin = process.env.ALLOW_DEV_LOGIN === 'true' && process.env.NODE_ENV !== 'production';
if (!botToken && !allowDevLogin) console.warn('TELEGRAM_BOT_TOKEN is not set: players cannot sign in.');
const telegramBot = createTelegramBot({ token: botToken });

const service = createGameService({ repository: createPgRepository(pool), checkEnglish });
const app = createApp({
  service, botToken, allowDevLogin,
  extraRoutes(api) {
    api.get('/api/health', async (_request, response) => {
      try {
        await pool.query('SELECT 1');
        response.json({ status: 'ok', database: 'connected', telegram: telegramBot.status() });
      } catch {
        response.status(503).json({ status: 'error', database: 'unavailable', telegram: telegramBot.status() });
      }
    });
    api.get('/api/cocktails', async (_request, response, next) => {
      try {
        response.set('Cache-Control', 'public, max-age=60, stale-while-revalidate=300');
        response.json(await listCocktails());
      } catch (error) {
        next(error);
      }
    });
  }
});

const here = path.dirname(fileURLToPath(import.meta.url));
const dist = path.resolve(here, '../dist');
app.use(express.static(dist, { maxAge: '1y', immutable: true, index: false }));
app.use((request, response, next) => request.path.startsWith('/api/') ? next() : response.sendFile(path.join(dist, 'index.html')));
app.use('/api', (_request, response) => response.status(404).json({ ok: false, error: 'Not found' }));
handleErrors(app);

await migrate();
const seeded = await seedCocktailsIfEmpty(RECIPES);
if (seeded.inserted) console.log(`Seeded ${seeded.inserted} cocktails.`);

const server = app.listen(port, '0.0.0.0', () => console.log(`BarLingo listening on :${port}`));
if (botToken) {
  telegramBot.start().then((status) => console.log(`Telegram @${status.username} connected (${status.mode}).`))
    .catch((error) => console.error('Telegram bot connection failed:', error.message));
}
const shutdown = async () => {
  await telegramBot.stop();
  server.close(async () => {
    await pool.end();
    process.exit(0);
  });
};
process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);
