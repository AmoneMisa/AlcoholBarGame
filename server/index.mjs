import express from 'express';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { RECIPES } from '../src/domain/catalog';
import { createApp, handleErrors } from './app.mjs';
import { listCocktails, migrate, pool, seedMissingCocktails } from './database.mjs';
import { checkEnglish } from './english.mjs';
import { createGameService } from './gameService.mjs';
import { createPgRepository } from './playerRepository.mjs';
import { createTelegramBot } from './telegramBot.mjs';

const port = Number(process.env.PORT || 3000);
const botToken = process.env.TELEGRAM_BOT_TOKEN;
// Only for local development: lets the browser play without Telegram. Never enable in production.
const allowDevLogin = process.env.ALLOW_DEV_LOGIN === 'true' && process.env.NODE_ENV !== 'production';
if (!botToken && !allowDevLogin) console.warn('TELEGRAM_BOT_TOKEN is not set: players cannot sign in.');
const payments = {};
const service = createGameService({ repository: createPgRepository(pool), checkEnglish });
const telegramBot = createTelegramBot({ token: botToken, payments, staffRole:identity=>service.staffRole(identity) });
Object.assign(payments, { approve: service.approveStarCheckout, fulfil: service.fulfilStarPayment });
const app = createApp({ supportEmail: process.env.SUPPORT_EMAIL || undefined, supportTelegram: process.env.SUPPORT_TELEGRAM,
  service, botToken, allowDevLogin,
  createInvoiceLink: botToken ? telegramBot.createInvoiceLink : undefined,
  extraRoutes(api) {
    api.get('/api/health', async (_request, response) => {
      try {
        await pool.query('SELECT 1');
        response.json({ status: 'ok', version: typeof __APP_VERSION__ === 'string' ? __APP_VERSION__ : 'dev', built: typeof __APP_BUILT__ === 'string' ? __APP_BUILT__ : undefined, database: 'connected', telegram: telegramBot.status() });
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
// Vite's hashed files (index-Ab12Cd34.js) never change, so they are cached for a year. Art and audio keep their
// names across releases, so they are cached for an hour and then revalidated with their ETag: a changed picture
// shows up within the hour, and an unchanged one costs only a tiny "not modified" answer.
const HASHED = /-[A-Za-z0-9_-]{8}\.(js|css|dic|aff)$/;
app.use(express.static(dist, {
  index: false,
  setHeaders(response, file) {
    response.setHeader('Cache-Control', /[\\/]admin-/.test(file) ? 'private, no-store' : /[\/]index\.html$/.test(file) ? 'no-cache, must-revalidate' : HASHED.test(file) ? 'public, max-age=31536000, immutable' : 'public, max-age=3600, must-revalidate');
  }
}));
// The page itself is never cached without asking the server first, so a new release is picked up on the next open
// (it names the new hashed script files). Telegram's in-app browser otherwise keeps showing an old page.
const INDEX_HEADERS = { 'Cache-Control': 'no-cache, must-revalidate' };
app.use((request, response, next) => request.path.startsWith('/api/') ? next() : response.sendFile(path.join(dist, 'index.html'), { headers: INDEX_HEADERS }));
app.use('/api', (_request, response) => response.status(404).json({ ok: false, error: 'Not found' }));
handleErrors(app);

await migrate();
await service.pruneEvents();
const eventCleanup=setInterval(()=>service.pruneEvents().catch(error=>console.error('Event cleanup failed:',error.message)),60*1000);
eventCleanup.unref();
const seeded = await seedMissingCocktails(RECIPES);
if (seeded.inserted) console.log(`Added ${seeded.inserted} new cocktails to the catalog.`);

const server = app.listen(port, '0.0.0.0', () => console.log(`BarLingo listening on :${port}`));
if (botToken) {
  telegramBot.start().then((status) => console.log(`Telegram @${status.username} connected (${status.mode}).`))
    .catch((error) => console.error('Telegram bot connection failed:', error.message));
}
const prune = setInterval(() => service.pruneRequests().catch((error) => console.error('Request cleanup failed:', error.message)), 6 * 60 * 60 * 1000);
prune.unref();
const mailExpiry = setInterval(()=>service.expireGifts().catch(error=>console.error('Gift return failed:',error.message)),60*1000);
mailExpiry.unref();
const shutdown = async () => {
  await telegramBot.stop();
  server.close(async () => {
    await pool.end();
    process.exit(0);
  });
};
process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);
