import express from 'express';
import { authenticate } from './auth.mjs';

// HTTP API. The game endpoints never accept game values from the client — only an action to try.
//   POST /api/session  → create/load the player's game and return it
//   POST /api/action   → { requestId, action } → apply one action on the server, return the new state

export function createApp({ service, botToken, allowDevLogin = false, extraRoutes }) {
  const app = express();
  app.disable('x-powered-by');
  app.use('/api', express.json({ limit: '16kb' }));

  extraRoutes?.(app);

  const auth = authenticate({ botToken, allowDevLogin });
  const limiter = rateLimit({ windowMs: 10_000, max: 40 });

  app.post('/api/session', auth, limiter, async (request, response, next) => {
    try { response.json(await service.session(request.identity)); } catch (error) { next(error); }
  });

  app.post('/api/action', auth, limiter, async (request, response, next) => {
    try {
      const result = await service.act(request.identity, request.body);
      response.status(result.status).json(result.body);
    } catch (error) { next(error); }
  });

  app.post('/api/leaderboard', auth, limiter, async (request, response, next) => {
    try { response.json(await service.leaderboard(request.identity)); } catch (error) { next(error); }
  });

  app.post('/api/friends', auth, limiter, async (request, response, next) => {
    try { response.json(await service.friends(request.identity)); } catch (error) { next(error); }
  });
  app.post('/api/friends/add', auth, limiter, async (request, response, next) => {
    try { const result = await service.addFriend(request.identity, request.body?.code); response.status(result.status).json(result.body); } catch (error) { next(error); }
  });
  app.post('/api/friends/answer', auth, limiter, async (request, response, next) => {
    try { const result = await service.answerFriend(request.identity, request.body?.code, request.body?.accept === true); response.status(result.status).json(result.body); } catch (error) { next(error); }
  });
  app.post('/api/friends/label', auth, limiter, async (request, response, next) => {
    try { const result = await service.labelFriend(request.identity, request.body?.code, request.body?.label); response.status(result.status).json(result.body); } catch (error) { next(error); }
  });
  app.post('/api/friends/visit', auth, limiter, async (request, response, next) => {
    try { const result = await service.visitFriend(request.identity, request.body?.code); response.status(result.status).json(result.body); } catch (error) { next(error); }
  });
  app.post('/api/friends/gift', auth, limiter, async (request, response, next) => {
    try { const result = await service.sendGift(request.identity, request.body?.code, request.body?.gift); response.status(result.status).json(result.body); } catch (error) { next(error); }
  });

  return app;
}

export function handleErrors(app) {
  app.use((error, _request, response, _next) => {
    console.error(error);
    response.status(500).json({ ok: false, error: 'Internal server error' });
  });
}

// Simple per-player sliding-window limit against scripted spamming.
function rateLimit({ windowMs, max }) {
  const hits = new Map();
  return (request, response, next) => {
    const key = request.identity?.key ?? request.ip;
    const now = Date.now();
    const recent = (hits.get(key) ?? []).filter((time) => now - time < windowMs);
    if (recent.length >= max) return response.status(429).json({ ok: false, error: 'Too many actions. Slow down a little.' });
    recent.push(now);
    hits.set(key, recent);
    if (hits.size > 10_000) for (const [entry, times] of hits) if (!times.some((time) => now - time < windowMs)) hits.delete(entry);
    next();
  };
}
