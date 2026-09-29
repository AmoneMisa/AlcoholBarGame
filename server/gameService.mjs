import { applyAction, advanceClock, RuleError } from '../src/sim/rules';
import { createInitialState, publicState } from '../src/sim/state';

// Server-authoritative game: every request loads the player's state with a row lock, applies exactly one
// validated action with the shared rules and the server clock, and stores the result together with a coin
// ledger entry — all in one transaction. Replayed request ids return the stored answer instead of acting twice.
// Clients only ever receive publicState(): a guest's order stays secret until it is found out in conversation.

const REQUEST_ID = /^[a-zA-Z0-9-]{8,64}$/;

export function createGameService({ repository, checkEnglish, now = () => Date.now() }) {
  const context = () => ({ now: now(), checkEnglish, spawnCustomers: true });

  async function session(identity) {
    return repository.transaction(async (tx) => {
      const player = await tx.findOrCreatePlayer(identity);
      const record = await tx.lockState(player.id);
      const state = record?.state ?? createInitialState(now());
      advanceClock(state, context());
      await tx.saveState(player.id, state, (record?.version ?? 0) + 1);
      return { ok: true, player: { id: player.id, name: player.name }, state: publicState(state), serverTime: now() };
    });
  }

  async function act(identity, body) {
    const requestId = body?.requestId;
    const action = body?.action;
    if (typeof requestId !== 'string' || !REQUEST_ID.test(requestId)) return { status: 400, body: { ok: false, error: 'Missing request id.' } };
    if (!action || typeof action !== 'object' || typeof action.type !== 'string') return { status: 400, body: { ok: false, error: 'Missing action.' } };

    return repository.transaction(async (tx) => {
      const player = await tx.findOrCreatePlayer(identity);
      const replay = await tx.findRequest(player.id, requestId);
      if (replay) return { status: 200, body: replay };

      const record = await tx.lockState(player.id);
      const state = record?.state ?? createInitialState(now());
      const next = structuredClone(state);
      let result;
      try {
        result = applyAction(next, action, context());
      } catch (error) {
        if (!(error instanceof RuleError)) throw error;
        // The action was refused; time still passes, but nothing the client asked for happens.
        advanceClock(state, context());
        await tx.saveState(player.id, state, (record?.version ?? 0) + 1);
        const refused = { ok: false, error: error.message, state: publicState(state), serverTime: now() };
        await tx.saveRequest(player.id, requestId, refused);
        return { status: 409, body: refused };
      }
      await tx.saveState(player.id, next, (record?.version ?? 0) + 1);
      if (result.moneyDelta !== 0) await tx.addLedger(player.id, { requestId, action: action.type, delta: result.moneyDelta, balance: next.money });
      const response = { ok: true, message: next.message, state: publicState(next), serverTime: now() };
      await tx.saveRequest(player.id, requestId, response);
      return { status: 200, body: response };
    });
  }

  return { session, act };
}
