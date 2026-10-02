import express from 'express';
import { authenticate } from './auth.mjs';

// HTTP API. The game endpoints never accept game values from the client — only an action to try.
//   POST /api/session  → create/load the player's game and return it
//   POST /api/action   → { requestId, action } → apply one action on the server, return the new state

export function createApp({ service, botToken, allowDevLogin = false, extraRoutes, createInvoiceLink }) {
  const app = express();
  app.disable('x-powered-by');
  // Behind the host's nginx / Caddy: use the real client address for rate limits.
  app.set('trust proxy', 'loopback, linklocal, uniquelocal');
  app.use((_request, response, next) => {
    response.set({
      'X-Content-Type-Options': 'nosniff',
      'Referrer-Policy': 'strict-origin-when-cross-origin',
      'Content-Security-Policy': "frame-ancestors 'self' https://web.telegram.org https://*.telegram.org"
    });
    next();
  });
  app.use('/api', express.json({ limit: '16kb' }));

  extraRoutes?.(app);

  const auth = authenticate({ botToken, allowDevLogin });
  const limiter = rateLimit({ windowMs: 10_000, max: 40 });
  // Per-address limit before sign-in, so unsigned floods cannot make the server compute signatures endlessly.
  const ipLimiter = rateLimit({ windowMs: 10_000, max: 120, key: (request) => `ip:${request.ip}` });
  app.use('/api', (request, response, next) => request.path === '/health' || request.path === '/cocktails' ? next() : ipLimiter(request, response, next));

  // One place for the shared plumbing: sign-in, rate limit, errors. A handler returns { status, body }, or a plain answer for 200.
  const route = (path, handle) => app.post(path, auth, limiter, async (request, response, next) => {
    try {
      const result = await handle(request);
      if (result && 'status' in result && 'body' in result) response.status(result.status).json(result.body); else response.json(result);
    } catch (error) { next(error); }
  });
  const who = (request) => request.identity;

  route('/api/session', (request) => service.session(who(request)));
  route('/api/action', (request) => service.act(who(request), request.body));

  // Telegram Stars: returns an invoice link for the Mini App's WebApp.openInvoice(). Crystals are credited
  // only when Telegram confirms the payment to the bot — never because the client says it paid.
  app.post('/api/stars/invoice', auth, limiter, async (request, response, next) => {
    try {
      if (!createInvoiceLink) return response.status(503).json({ ok: false, error: 'Star payments are not available right now.' });
      const result = await service.startStarPurchase(request.identity, request.body?.packId);
      if (!result.order) return response.status(result.status).json(result.body);
      response.json({ ok: true, url: await createInvoiceLink(result.order) });
    } catch (error) {
      if (error?.name === 'TelegramBotError') return response.status(502).json({ ok: false, error: 'Telegram could not create the invoice. Try again.' });
      next(error);
    }
  });

  route('/api/leaderboard/bar', (request) => service.leaderboardBar(who(request), request.body));
  route('/api/leaderboard', (request) => service.leaderboard(who(request), request.body?.scope === 'friends' ? 'friends' : 'global'));

  route('/api/friends', (request) => service.friends(who(request)));
  route('/api/friends/add', (request) => service.addFriend(who(request), request.body?.code));
  route('/api/friends/answer', (request) => service.answerFriend(who(request), request.body?.code, request.body?.accept === true));
  route('/api/friends/remove', (request) => service.removeFriend(who(request), request.body?.code));
  route('/api/friends/claim', (request) => service.claimGifts(who(request)));
  route('/api/friends/label', (request) => service.labelFriend(who(request), request.body?.code, request.body?.label));
  route('/api/friends/visit', (request) => service.visitFriend(who(request), request.body?.code));
  route('/api/friends/gift', (request) => service.sendGift(who(request), request.body?.code, request.body?.gift));

  return app;
}

export function handleErrors(app) {
  app.use((error, _request, response, _next) => {
    // A body that is not valid JSON (or is too large) is the client's mistake, not a server failure.
    if (error?.status >= 400 && error.status < 500) return response.status(error.status).json({ ok: false, error: 'Invalid request.' });
    console.error(error);
    response.status(500).json({ ok: false, error: 'Internal server error' });
  });
}

// Simple per-player sliding-window limit against scripted spamming.
function rateLimit({ windowMs, max, key: keyOf = (request) => request.identity?.key ?? request.ip }) {
  const hits = new Map();
  return (request, response, next) => {
    const key = keyOf(request);
    const now = Date.now();
    const recent = (hits.get(key) ?? []).filter((time) => now - time < windowMs);
    if (recent.length >= max) return response.status(429).json({ ok: false, error: 'Too many actions. Slow down a little.' });
    recent.push(now);
    hits.set(key, recent);
    if (hits.size > 10_000) for (const [entry, times] of hits) if (!times.some((time) => now - time < windowMs)) hits.delete(entry);
    next();
  };
}
