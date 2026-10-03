import { randomBytes } from 'node:crypto';
import express from 'express';
import { authenticate } from './auth.mjs';

// HTTP API. The game endpoints never accept game values from the client — only an action to try.
//   POST /api/session  → create/load the player's game and return it
//   POST /api/action   → { requestId, action } → apply one action on the server, return the new state

export function createApp({ service, botToken, allowDevLogin = false, extraRoutes, createInvoiceLink, supportEmail = 'Kubai.rita2@gmail.com', supportTelegram = '' }) {
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
  app.use('/api/support/ticket', express.json({limit:'5mb'}));
  app.use('/api', express.json({ limit: '16kb' }));
    const assetSessions = new Map();
  // Only the authorized bootstrap obtains this HttpOnly cookie; admin chunks never enter the public cache.
  app.use('/assets', async (request,response,next)=> {
    let assetPath; try { assetPath=decodeURIComponent(request.path).replaceAll('\\','/'); } catch { return response.sendStatus(400); }
    if(!assetPath.split('/').some(part=>part.toLowerCase().startsWith('admin-'))) return next();
    response.set('Cache-Control','private, no-store');
    const token = /(?:^|; )barlingo_admin=([a-f0-9]{64})(?:;|$)/.exec(request.get('cookie') ?? '')?.[1];
    const session=assetSessions.get(token);
    if(!session || session.until<=Date.now()) return response.sendStatus(404);
    try { if(!await service.staffRole({kind:'telegram',telegramId:session.telegramId})) return response.sendStatus(404); } catch(error) { return next(error); }
    next();
  });

  extraRoutes?.(app);

  const auth = authenticate({ botToken, allowDevLogin });
  const access = async (request,response,next)=>{try { await service.checkAccess(request.identity); next(); } catch(error) { next(error); }};
  app.use('/api', (request,response,next)=> {
    const apiPath=request.path;
    response.on('finish',()=> {
      if(['/health','/cocktails','/admin/events'].includes(apiPath) || (apiPath==='/action' && [200,409].includes(response.statusCode))) return;
      const detail={path:apiPath,status:response.statusCode};
      if(request.body && !apiPath.startsWith('/support') && !apiPath.startsWith('/admin')) detail.input=request.body;
      service.audit(request.identity ?? {telegramId:null},response.statusCode>=400 ? 'api.refused' : 'api.request',detail).catch(error=>console.error('Event logging failed:',error.message));
    }); next();
  });
  const limiter = rateLimit({ windowMs: 10_000, max: 40 });
  // Per-address limit before sign-in, so unsigned floods cannot make the server compute signatures endlessly.
  const ipLimiter = rateLimit({ windowMs: 10_000, max: 120, key: (request) => `ip:${request.ip}` });
  app.use('/api', (request, response, next) => request.path === '/health' || request.path === '/cocktails' ? next() : ipLimiter(request, response, next));

  // One place for the shared plumbing: sign-in, rate limit, errors. A handler returns { status, body }, or a plain answer for 200.
  const route = (path, handle) => app.post(path, auth, limiter, access, async (request, response, next) => {
    try {
      const result = await handle(request);
      if (result && 'status' in result && 'body' in result) response.status(result.status).json(result.body); else response.json(result);
    } catch (error) { next(error); }
  });
  const who = (request) => request.identity;

  app.use('/api/admin', auth, limiter, async (request,response,next)=> { try { request.staffRole=await service.staffRole(request.identity); if(!request.staffRole) return response.status(403).json({ok:false,error:'Staff access required.'}); next(); } catch(error){next(error);} });
  const adminRoute=(path,handler,roles=['owner','admin'])=>app.post('/api/admin/'+path,async(request,response,next)=> { response.set('Cache-Control','private, no-store'); if(!roles.includes(request.staffRole)) return response.status(403).json({ok:false,error:'You do not have permission for this operation.'}); try { const result=await handler(request); if(result?.status) response.status(result.status).json(result.body); else response.json(result); } catch(error){next(error);} });
  adminRoute('access',request=> {
    for(const [key,value] of assetSessions) if(value.until<=Date.now()) assetSessions.delete(key);
    const token=randomBytes(32).toString('hex'); assetSessions.set(token,{telegramId:String(request.identity.telegramId),until:Date.now()+15*60*1000});
    request.res.cookie('barlingo_admin',token,{httpOnly:true,sameSite:allowDevLogin ? 'strict' : 'none',secure:!allowDevLogin,maxAge:15*60*1000,path:'/assets'});
    return {ok:true,role:request.staffRole};
  },['owner','admin','moderator']);
  adminRoute('staff/list',request=>service.staffList(request.identity));
  adminRoute('staff/role',request=>service.staffSetRole(request.identity,request.body));
  adminRoute('catalog',()=>({ok:true,catalog:service.adminCatalog()}));
  adminRoute('promocodes',request=>service.createPromoCode(request.body,request.identity));
  adminRoute('promocodes/list',()=>service.adminPromos());
  adminRoute('promocodes/delete',request=>service.adminDeletePromo(request.identity,request.body?.code));
  adminRoute('player',request=>service.adminPlayer(request.body,request.identity),['owner','admin','moderator']);
  adminRoute('player/change',request=>service.adminChange(request.identity,request.body),['owner','admin','moderator']);
  adminRoute('events',request=>service.adminEvents(request.body));
  adminRoute('tickets',request=>service.adminTickets(request.body));
  adminRoute('tickets/close',request=>service.adminCloseTicket(request.identity,request.body?.id));
  route('/api/support/config',()=>({ok:true,email:supportEmail,telegram:supportTelegram}));
  route('/api/support/ticket',request=>service.createTicket(request.identity,request.body));
  route('/api/promocodes/redeem', request => service.redeemPromoCode(who(request),request.body?.code));
  route('/api/session', (request) => service.session(who(request)));
  route('/api/action', (request) => service.act(who(request), request.body));

  // Telegram Stars: returns an invoice link for the Mini App's WebApp.openInvoice(). Crystals are credited
  // only when Telegram confirms the payment to the bot — never because the client says it paid.
  app.post('/api/stars/invoice', auth, limiter, access, async (request, response, next) => {
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
  route('/api/friends/tips', (request) => service.stealFriendTips(who(request), request.body?.code));
  route('/api/mailbox',request=>service.mailbox(who(request),request.body?.readIds));
  route('/api/mailbox/gift',request=>service.decideGift(who(request),request.body?.giftId,request.body?.accept));
  route('/api/mailbox/reward',request=>service.claimMailReward(who(request),request.body?.id));
  route('/api/friends/gift', (request) => service.sendGift(who(request), request.body?.code, request.body?.gift));

  return app;
}

export function handleErrors(app) {
  app.use((error, _request, response, _next) => {
    // A body that is not valid JSON (or is too large) is the client's mistake, not a server failure.
    if (error?.status >= 400 && error.status < 500) return response.status(error.status).json({ ok: false, error: error?.status === 403 ? error.message : 'Invalid request.' });
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
