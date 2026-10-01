import { randomBytes } from 'node:crypto';
import { applyAction, advanceClock, RuleError } from '../src/sim/rules';
import { createInitialState, normalizePlayerState, publicState } from '../src/sim/state';
import { receiveGift } from '../src/sim/gifts';
import { payForGift, publicBar } from '../src/sim/gifts';
import { calendarDate, starCrystalPack } from '../src/domain/economy';

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
  const context = () => ({ now: now(), checkEnglish, spawnCustomers: true });

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
      return { ok: true, player: { id: player.id, name: player.name, friendCode: friendCode(player.id) }, state: publicState(state), starterPackAvailable: !(await tx.hasStarPurchase(player.id, 'starter')), serverTime: now() };
    });
  }

  async function act(identity, body) {
    const requestId = body?.requestId;
    const action = body?.action;
    if (typeof requestId !== 'string' || !REQUEST_ID.test(requestId)) return { status: 400, body: { ok: false, error: 'Missing request id.' } };
    if (!action || typeof action !== 'object' || typeof action.type !== 'string') return { status: 400, body: { ok: false, error: 'Missing action.' } };

    return repository.transaction(async (tx) => {
      const player = await tx.findOrCreatePlayer(identity);
      // Lock the player's row BEFORE looking for a replay: two simultaneous retries of one request id then run
      // one after the other, and the second sees the first's stored answer instead of applying the action twice.
      const record = await tx.lockState(player.id);
      const replay = await tx.findRequest(player.id, requestId);
      if (replay) return { status: 200, body: replay };

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

  // ---- Crystal packs paid with Telegram Stars ----
  // The invoice payload is 'stars:<playerId>:<packId>:<nonce>'. Prices and amounts always come from the
  // server's pack list, never from the client or from the payload itself.

  async function startStarPurchase(identity, packId) {
    const pack = starCrystalPack(packId);
    if (!pack) return { status: 400, body: { ok: false, error: 'Unknown crystal pack.' } };
    const player = await repository.transaction((tx) => tx.findOrCreatePlayer(identity));
    if (pack.once && await repository.transaction((tx) => tx.hasStarPurchase(player.id, pack.id))) return { status: 409, body: { ok: false, error: 'This one-time offer was already claimed.' } };
    const nonce = randomBytes(6).toString('hex');
    return { status: 200, order: { pack, payload: `stars:${player.id}:${pack.id}:${nonce}` } };
  }

  function readStarPayment({ currency, total_amount: total, invoice_payload: payload }) {
    const [kind, playerId, packId] = String(payload ?? '').split(':');
    const pack = starCrystalPack(packId);
    const id = Number(playerId);
    if (kind !== 'stars' || !pack || !Number.isSafeInteger(id) || id <= 0) return { error: 'This order is not recognised.' };
    if (currency !== 'XTR' || total !== pack.stars) return { error: 'The payment does not match this crystal pack.' };
    return { pack, playerId: id };
  }

  // Answer to Telegram's pre-checkout query: only approve orders this server can fulfil.
  async function approveStarCheckout(query) {
    const order = readStarPayment(query ?? {});
    if (order.error) return { ok: false, error: order.error };
    return repository.transaction(async (tx) => {
      if (!await tx.getPlayer(order.playerId)) return { ok: false, error: 'Player not found.' };
      if (order.pack.once && await tx.hasStarPurchase(order.playerId, order.pack.id)) return { ok: false, error: 'This one-time offer was already claimed.' };
      return { ok: true };
    });
  }

  // Credits a successful payment exactly once per Telegram charge id.
  async function fulfilStarPayment(payment) {
    const order = readStarPayment(payment ?? {});
    const chargeId = payment?.telegram_payment_charge_id;
    if (order.error || typeof chargeId !== 'string' || !chargeId) throw new Error(order.error ?? 'Payment has no charge id.');
    return repository.transaction(async (tx) => {
      const player = await tx.getPlayer(order.playerId);
      if (!player) throw new Error('Paid player not found.');
      const fresh = await tx.addStarPurchase(player.id, { chargeId, packId: order.pack.id, stars: order.pack.stars, crystals: order.pack.crystals });
      if (!fresh) return { credited: false, playerId: player.id, pack: order.pack };
      const record = await tx.lockState(player.id);
      const state = normalizePlayerState(record?.state ?? createInitialState(now()));
      state.crystals += order.pack.crystals;
      state.message = `Thank you! +${order.pack.crystals} crystals were added to your bar.`;
      await tx.saveState(player.id, state, (record?.version ?? 0) + 1);
      await tx.addCrystalLedger(player.id, { requestId: `stars-${chargeId}`.slice(0, 120), action: 'buyCrystalPack', delta: order.pack.crystals, balance: state.crystals });
      return { credited: true, playerId: player.id, pack: order.pack };
    });
  }

  // Request ids only need to survive long enough for a retry; older rows are pure bloat.
  const pruneRequests = (olderThanMs = 7 * 24 * 60 * 60 * 1000) => repository.transaction((tx) => tx.pruneRequests(now() - olderThanMs));

  return { pruneRequests, session, act, friends, addFriend, answerFriend, labelFriend, visitFriend, sendGift, startStarPurchase, approveStarCheckout, fulfilStarPayment };
}
