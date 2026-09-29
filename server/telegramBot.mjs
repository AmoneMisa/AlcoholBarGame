const TELEGRAM_API = 'https://api.telegram.org';

export class TelegramBotError extends Error {}

/**
 * Small Bot API client used by the game process. It deliberately has no extra dependency:
 * TELEGRAM_BOT_TOKEN is the only runtime Telegram setting. The launch URL is the bot's
 * standard Main Mini App deep link, whose HTTPS application URL is managed once in BotFather.
 */
export function createTelegramBot({ token, fetchImpl = globalThis.fetch, logger = console } = {}) {
  const state = {
    configured: Boolean(token), connected: false, mode: 'off', id: null, username: null,
    mainMiniApp: false, lastUpdateAt: null, error: token ? null : 'TELEGRAM_BOT_TOKEN is not set'
  };
  let offset = 0;
  let controller;
  let polling;

  const status = () => ({ ...state });

  async function call(method, payload = {}, signal) {
    if (!token) throw new TelegramBotError('TELEGRAM_BOT_TOKEN is not set.');
    let response;
    try {
      response = await fetchImpl(`${TELEGRAM_API}/bot${token}/${method}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
        signal
      });
    } catch (error) {
      if (error?.name === 'AbortError') throw error;
      throw new TelegramBotError(`Telegram ${method} request failed.`);
    }
    let body;
    try { body = await response.json(); } catch { throw new TelegramBotError(`Telegram ${method} returned invalid JSON.`); }
    if (!response.ok || !body?.ok) throw new TelegramBotError(body?.description || `Telegram ${method} failed.`);
    return body.result;
  }

  function gameLink() {
    return state.username ? `https://t.me/${state.username}?startapp` : null;
  }

  async function sendWelcome(message, signal) {
    if (!message?.chat?.id || message.chat.type !== 'private') return;
    const name = message.from?.first_name ? `, ${message.from.first_name}` : '';
    const link = gameLink();
    const payload = {
      chat_id: message.chat.id,
      text: `Welcome${name}! 🍸\n\nRun your own bar, learn practical English, discover cocktails and serve guests in BarLingo.`,
      ...(link ? { reply_markup: { inline_keyboard: [[{ text: '🍹 Open BarLingo', url: link }]] } } : {})
    };
    await call('sendMessage', payload, signal);
  }

  async function handleUpdate(update, signal) {
    const message = update?.message;
    const command = message?.text?.trim().split(/\s+/, 1)[0]?.toLowerCase().split('@', 1)[0];
    if (command === '/start' || command === '/game') return sendWelcome(message, signal);
    if (command === '/help' && message?.chat?.id && message.chat.type === 'private') {
      return call('sendMessage', {
        chat_id: message.chat.id,
        text: 'Use /game or tap the menu button to open BarLingo. Your progress and economy are securely stored by the game server.'
      }, signal);
    }
  }

  async function poll(signal) {
    while (!signal.aborted) {
      try {
        const updates = await call('getUpdates', { offset, timeout: 25, allowed_updates: ['message'] }, signal);
        for (const update of updates) {
          offset = Math.max(offset, Number(update.update_id) + 1);
          state.lastUpdateAt = new Date().toISOString();
          try { await handleUpdate(update, signal); } catch (error) { logger.error?.('Telegram update failed:', error.message); }
        }
        state.connected = true;
        state.error = null;
      } catch (error) {
        if (signal.aborted || error?.name === 'AbortError') break;
        state.connected = false;
        state.error = error.message;
        logger.error?.('Telegram polling failed:', error.message);
        await new Promise((resolve) => setTimeout(resolve, 2_000));
      }
    }
  }

  async function start({ enablePolling = true } = {}) {
    if (!token) return status();
    if (polling) return status();
    state.mode = 'connecting';
    state.error = null;
    const setupSignal = AbortSignal.timeout(10_000);
    try {
      const me = await call('getMe', {}, setupSignal);
      if (!me?.is_bot || !me.username) throw new TelegramBotError('The configured Telegram token does not belong to a usable bot.');
      Object.assign(state, {
        connected: true, mode: enablePolling ? 'long-polling' : 'connected', id: me.id,
        username: me.username, mainMiniApp: me.has_main_web_app === true, error: null
      });
      if (!state.mainMiniApp) logger.warn?.(`Telegram @${me.username} is connected, but its Main Mini App still needs to be configured in @BotFather.`);
      await call('setMyCommands', { commands: [
        { command: 'start', description: 'Welcome and open BarLingo' },
        { command: 'game', description: 'Open the game' },
        { command: 'help', description: 'How to play' }
      ] }, setupSignal);
      if (enablePolling) {
        // getUpdates and webhooks cannot be active together. This process owns the supplied bot token.
        await call('deleteWebhook', { drop_pending_updates: false }, setupSignal);
        controller = new AbortController();
        polling = poll(controller.signal).finally(() => { polling = undefined; });
      }
      return status();
    } catch (error) {
      state.connected = false;
      state.mode = 'error';
      state.error = error.message;
      throw error;
    }
  }

  async function stop() {
    controller?.abort();
    try { await polling; } catch { /* an aborted poll is expected during shutdown */ }
    controller = undefined;
    polling = undefined;
    state.connected = false;
    state.mode = token ? 'stopped' : 'off';
  }

  return { start, stop, status, call, handleUpdate };
}
