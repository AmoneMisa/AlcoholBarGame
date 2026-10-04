import { prepareSession } from './api';

// The server validates the signature before game code, local saves or simulation are loaded.
export async function requireTelegramSession() {
  if (import.meta.env.DEV) return true;
  const signed = !!window.Telegram?.WebApp?.initData;
  if (signed) {
    try { await prepareSession(); return true; } catch { /* Fail closed, including when the server is unreachable. */ }
  }
  const boot = document.getElementById('boot')!;
  boot.replaceChildren();
  const title = document.createElement('b'); title.textContent = 'BARLINGO';
  const message = document.createElement('span');
  message.textContent = signed ? 'Could not connect to your account. Reopen the game in Telegram or try again.' : 'Open the game in Telegram to play with your account.';
  message.style.cssText = 'max-width:320px;text-align:center;line-height:1.6;padding:0 20px';
  const retry = document.createElement('button'); retry.textContent = 'Try again';
  retry.style.cssText = 'padding:12px 24px;border:1px solid #e4b35c;border-radius:10px;background:#49351e;color:#fff3dc;font:inherit;cursor:pointer';
  retry.addEventListener('click', () => window.location.reload());
  boot.append(title, message, retry);
  // The public health endpoint exposes the connected bot's username, never its token.
  try {
    const response = await fetch('/api/health');
    const health = await response.json();
    const username = health.telegram?.username;
    if (typeof username === 'string' && /^[a-zA-Z0-9_]{5,32}$/.test(username)) {
      const link = document.createElement('a'); link.textContent = 'Open in Telegram';
      link.href = `https://t.me/${username}?startapp`;
      link.style.cssText = 'color:#e4b35c;padding:12px;text-decoration:underline';
      boot.append(link);
    }
  } catch { /* The reopen instructions still work during server outages. */ }
  return false;
}
