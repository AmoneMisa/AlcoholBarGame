import { createHmac, timingSafeEqual } from 'node:crypto';

// Player identity. In production every request carries Telegram's signed WebApp init data, which only
// Telegram (holding the bot token) can produce — so a player cannot pretend to be someone else.
// https://core.telegram.org/bots/webapps#validating-data-received-via-the-mini-app

export class AuthError extends Error {}

export function verifyTelegramInitData(initData, botToken, { maxAgeSeconds = 24 * 60 * 60, now = Date.now() } = {}) {
  if (!botToken) throw new AuthError('Telegram login is not configured.');
  if (typeof initData !== 'string' || initData.length > 4096) throw new AuthError('Missing Telegram login data.');
  const params = new URLSearchParams(initData);
  const hash = params.get('hash');
  if (!hash || !/^[a-f0-9]{64}$/.test(hash)) throw new AuthError('Invalid Telegram signature.');
  params.delete('hash');
  const checkString = [...params.entries()].sort(([a], [b]) => a.localeCompare(b)).map(([key, value]) => `${key}=${value}`).join('\n');
  const secret = createHmac('sha256', 'WebAppData').update(botToken).digest();
  const expected = createHmac('sha256', secret).update(checkString).digest();
  const received = Buffer.from(hash, 'hex');
  if (received.length !== expected.length || !timingSafeEqual(received, expected)) throw new AuthError('Invalid Telegram signature.');
  const authDate = Number(params.get('auth_date'));
  if (!Number.isSafeInteger(authDate) || authDate <= 0 || authDate > now / 1000 + 60 || now / 1000 - authDate > maxAgeSeconds) throw new AuthError('Telegram login expired. Reopen the app.');
  let user;
  try { user = JSON.parse(params.get('user') ?? ''); } catch { throw new AuthError('Missing Telegram user.'); }
  if (!user || !Number.isSafeInteger(user.id) || user.id <= 0) throw new AuthError('Missing Telegram user.');
  return { kind: 'telegram', key: `tg:${user.id}`, telegramId: user.id, name: [user.first_name, user.last_name].filter(Boolean).join(' ') || user.username || 'Player', username: user.username ?? null };
}

// Express middleware: `Authorization: tma <initData>`; a dev identity only when ALLOW_DEV_LOGIN=true (never set it in production).
export function authenticate({ botToken, allowDevLogin }) {
  return (request, response, next) => {
    try {
      const header = request.get('authorization') ?? '';
      if (header.startsWith('tma ')) {
        request.identity = verifyTelegramInitData(header.slice(4), botToken);
        return next();
      }
      const devKey = request.get('x-dev-player');
      if (allowDevLogin && devKey && /^[a-zA-Z0-9_-]{1,40}$/.test(devKey)) {
        request.identity = { kind: 'dev', key: `dev:${devKey}`, telegramId: null, name: `Dev ${devKey}`, username: null };
        return next();
      }
      throw new AuthError('Please open the game from Telegram.');
    } catch (error) {
      response.status(401).json({ ok: false, error: error instanceof AuthError ? error.message : 'Unauthorized' });
    }
  };
}
