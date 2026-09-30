import { applyAction, advanceClock, RuleError } from '../src/sim/rules';
import { createInitialState, normalizePlayerState, publicState } from '../src/sim/state';
import { receiveGift } from '../src/sim/gifts';
import { payForGift, publicBar } from '../src/sim/gifts';
import { calendarDate } from '../src/domain/economy';

// Server-authoritative game: every request loads the player's state with a row lock, applies exactly one
// validated action with the shared rules and the server clock, and stores the result together with a coin
// ledger entry — all in one transaction. Replayed request ids return the stored answer instead of acting twice.
// Clients only ever receive publicState(): a guest's order stays secret until it is found out in conversation.

const REQUEST_ID = /^[a-zA-Z0-9-]{8,64}$/;
const friendCode = (id) => String(id).padStart(8, '0');
const friendIdFrom = (value) => {
  const clean = String(value ?? '').trim();
  if (!/^\d{1,12}$/.test(clean)) return 0;
  const id = Number(clean);
  return Number.isSafeInteger(id) && id > 0 ? id : 0;
};

export function createGameService({ repository, checkEnglish, now = () => Date.now() }) {
  // Loot rolls use the operating system's secure random source, never Math.random.
  const secureRandom = () => crypto.getRandomValues(new Uint32Array(1))[0] / 4294967296;
  const context = () => ({ now: now(), random: secureRandom, checkEnglish, spawnCustomers: true });

  async function session(identity) {
    return repository.transaction(async (tx) => {
      const player = await tx.findOrCreatePlayer(identity);
      const record = await tx.lockState(player.id);
      const state = normalizePlayerState(record?.state ?? createInitialState(now()));
      advanceClock(state, context());
      const pending = await tx.listGifts(player.id);
      for (const gift of pending) {
        const claimed = await tx.takeGift(gift.id, player.id);
        if (claimed) state.message = receiveGift(state, claimed.payload, claimed.fromName);
      }
      await tx.saveState(player.id, state, (record?.version ?? 0) + 1);
      return { ok: true, player: { id: player.id, name: player.name, friendCode: friendCode(player.id) }, state: publicState(state), serverTime: now() };
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
      const state = normalizePlayerState(record?.state ?? createInitialState(now()));
      const next = structuredClone(state);
      let result;
      try {
        let giftTarget;
        if (action.type === 'giftCosmetic') {
          const recipientId = Number(action.recipient);
          if (!Number.isSafeInteger(recipientId) || recipientId <= 0 || recipientId === Number(player.id)) throw new RuleError('Enter a valid friend player code.');
          giftTarget = await tx.getPlayer(recipientId);
          if (!giftTarget) throw new RuleError('That friend player code was not found.');
        }
        result = applyAction(next, action, context());
        if (action.type === 'giftCosmetic' && giftTarget) await tx.addGift({ fromId:Number(player.id),toId:Number(giftTarget.id),payload:{ kind:'cosmetic-copy',cosmeticId:action.cosmeticId } });
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
      if (result.crystalDelta !== 0) await tx.addCrystalLedger(player.id, { requestId, action: action.type, delta: result.crystalDelta, balance: next.crystals });
      if (result.audit) await tx.addLootLedger(player.id, { requestId, ...result.audit });
      const response = { ok: true, message: next.message, state: publicState(next), serverTime: now() };
      await tx.saveRequest(player.id, requestId, response);
      return { status: 200, body: response };
    });
  }

  async function friends(identity) {
    return repository.transaction(async (tx) => {
      const player = await tx.findOrCreatePlayer(identity);
      const own = normalizePlayerState((await tx.readState(player.id)) ?? createInitialState(now()));
      const rows = await tx.listFriendships(player.id);
      const items = new Map();
      for (const row of rows) {
        const outgoing = Number(row.playerId) === Number(player.id);
        const otherId = outgoing ? Number(row.friendId) : Number(row.playerId);
        const other = await tx.getPlayer(otherId);
        if (!other) continue;
        const item = { id: otherId, code: friendCode(otherId), nickname: other.name, customName: own.friendLabels?.[String(otherId)] ?? '', status: row.status, direction: outgoing ? 'outgoing' : 'incoming' };
        const previous = items.get(otherId);
        if (!previous || row.status === 'accepted' || previous.direction === 'outgoing') items.set(otherId, item);
      }
      return { ok: true, friendCode: friendCode(player.id), friends: [...items.values()] };
    });
  }

  async function addFriend(identity, code) {
    return repository.transaction(async (tx) => {
      const player = await tx.findOrCreatePlayer(identity);
      const targetId = friendIdFrom(code);
      if (!targetId || targetId === Number(player.id)) return { status: 409, body: { ok: false, error: 'Enter another player’s numeric friend code.' } };
      const target = await tx.getPlayer(targetId);
      if (!target) return { status: 404, body: { ok: false, error: 'Friend code not found.' } };
      const accepted = await tx.friendship(player.id, targetId) === 'accepted' || await tx.friendship(targetId, player.id) === 'accepted';
      if (accepted) return { status: 409, body: { ok: false, error: 'This player is already your friend.' } };
      if (await tx.friendship(targetId, player.id) === 'pending') return { status: 409, body: { ok: false, error: 'This player already invited you. Accept the incoming request.' } };
      await tx.setFriendship(player.id, targetId, 'pending');
      return { status: 200, body: { ok: true, message: `Friend request sent to ${target.name}.` } };
    });
  }

  async function answerFriend(identity, code, accept) {
    return repository.transaction(async (tx) => {
      const player = await tx.findOrCreatePlayer(identity);
      const targetId = friendIdFrom(code);
      const target = targetId ? await tx.getPlayer(targetId) : null;
      if (!target || await tx.friendship(targetId, player.id) !== 'pending') return { status: 404, body: { ok: false, error: 'Friend request not found.' } };
      if (accept) {
        await tx.setFriendship(targetId, player.id, 'accepted');
        await tx.setFriendship(player.id, targetId, 'accepted');
      } else await tx.deleteFriendship(targetId, player.id);
      return { status: 200, body: { ok: true, message: accept ? `${target.name} is now your friend.` : 'Friend request declined.' } };
    });
  }

  async function labelFriend(identity, code, label) {
    return repository.transaction(async (tx) => {
      const player = await tx.findOrCreatePlayer(identity);
      const targetId = friendIdFrom(code);
      const accepted = await tx.friendship(player.id, targetId) === 'accepted' || await tx.friendship(targetId, player.id) === 'accepted';
      if (!accepted) return { status: 403, body: { ok: false, error: 'Add this player as a friend first.' } };
      const record = await tx.lockState(player.id);
      const state = normalizePlayerState(record?.state ?? createInitialState(now()));
      const clean = String(label ?? '').replace(/[\u0000-\u001f\u007f]/g, '').trim().slice(0, 28);
      state.friendLabels[String(targetId)] = clean;
      await tx.saveState(player.id, state, (record?.version ?? 0) + 1);
      return { status: 200, body: { ok: true, state: publicState(state), message: clean ? 'Friend name saved.' : 'Custom friend name removed.' } };
    });
  }

  async function visitFriend(identity, code) {
    return repository.transaction(async (tx) => {
      const player = await tx.findOrCreatePlayer(identity);
      const targetId = friendIdFrom(code);
      const target = targetId ? await tx.getPlayer(targetId) : null;
      const accepted = target && (await tx.friendship(player.id, targetId) === 'accepted' || await tx.friendship(targetId, player.id) === 'accepted');
      if (!target || !accepted) return { status: 403, body: { ok: false, error: 'Add this player as a friend before visiting.' } };
      const visitorRecord = await tx.lockState(player.id);
      const friendRecord = await tx.lockState(targetId);
      const visitor = normalizePlayerState(visitorRecord?.state ?? createInitialState(now()));
      const owner = normalizePlayerState(friendRecord?.state ?? createInitialState(now()));
      const key = String(targetId);
      const today = calendarDate(new Date(now()));
      const rewarded = visitor.friendVisits[key] !== today;
      if (rewarded) {
        visitor.friendVisits[key] = today;
        owner.popularity += 1;
        owner.message = `${player.name} visited your bar. +1 popularity.`;
      }
      await tx.saveState(player.id, visitor, (visitorRecord?.version ?? 0) + 1);
      await tx.saveState(targetId, owner, (friendRecord?.version ?? 0) + 1);
      return { status: 200, body: { ok: true, rewarded, state: publicState(visitor), friend: { id: targetId, code: friendCode(targetId), nickname: target.name, customName: visitor.friendLabels[key] ?? '', ...publicBar(owner, target.name) } } };
    });
  }

  async function sendGift(identity, code, gift) {
    return repository.transaction(async (tx) => {
      const player = await tx.findOrCreatePlayer(identity);
      const targetId = friendIdFrom(code);
      const target = targetId ? await tx.getPlayer(targetId) : null;
      const accepted = target && (await tx.friendship(player.id, targetId) === 'accepted' || await tx.friendship(targetId, player.id) === 'accepted');
      if (!target || !accepted) return { status: 403, body: { ok: false, error: 'You can only send gifts while visiting a friend.' } };
      const record = await tx.lockState(player.id);
      const state = normalizePlayerState(record?.state ?? createInitialState(now()));
      try {
        const paid = payForGift(state, gift);
        await tx.addGift({ fromId: Number(player.id), toId: targetId, payload: paid });
        state.message = `Gift sent to ${target.name}.`;
      } catch (error) {
        return { status: 409, body: { ok: false, error: error.message } };
      }
      await tx.saveState(player.id, state, (record?.version ?? 0) + 1);
      return { status: 200, body: { ok: true, state: publicState(state), message: state.message } };
    });
  }

  return { session, act, friends, addFriend, answerFriend, labelFriend, visitFriend, sendGift };
}
