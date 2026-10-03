import { createStaffRoles } from './staffRoles.mjs';
import { createAdministration } from './administration.mjs';
import {resolveFragmentReward} from '../src/sim/loot';
import {cleanCode, validatePromo, applyPromoRewards} from './promocodes.mjs';
import { randomBytes } from 'node:crypto';
import { applyAction, advanceClock, RuleError } from '../src/sim/rules';
import { createInitialState, levelFor, normalizePlayerState, publicState } from '../src/sim/state';
import { giftLabel, giftPrice, payForGift, publicBar, receiveGift } from '../src/sim/gifts';
import { giftAttachments, rewardAttachments } from '../src/domain/mailAttachments';
import { addMail, pruneMail, MAIL_LIFETIME } from '../src/sim/mailbox';
import { calendarDate, starCrystalPack } from '../src/domain/economy';
import { friendCodeFor, playerIdFromCode } from './friendCode.mjs';
import { LEADERBOARD_SIZE, MIN_WEEKLY_SCORE, describeLeaderboardReward, leaderboardReward } from '../src/domain/leaderboard';
import { weekOf, WEEK_MS } from '../src/domain/quests';
import { addStat } from '../src/domain/achievementStats';
import { accrueTips, stealableTips, tipCapacity } from '../src/sim/tips';
import { coins } from '../src/domain/economy';
import { deferEventRewards, claimEventRewards } from './mailRewards.mjs';
import { addWeeklyScore, grantLevelBoxes } from '../src/sim/loot';

// Server-authoritative game: every request loads the player's state with a row lock, applies exactly one
// validated action with the shared rules and the server clock, and stores the result together with a coin
// ledger entry — all in one transaction. Replayed request ids return the stored answer instead of acting twice.
// Clients only ever receive publicState(): a guest's order stays secret until it is found out in conversation.

const REQUEST_ID = /^[a-zA-Z0-9-]{8,64}$/;
const friendCode = friendCodeFor;
const friendIdFrom = playerIdFromCode;

// Old pending gifts also appear in the mailbox, but login never accepts them.
async function syncGiftMail(tx, playerId, state) {
  for (const gift of await tx.listGifts(playerId)) {
    addMail(state,{id:`gift-in:${gift.id}`,at:gift.createdAt,kind:'gift',direction:'incoming',actorId:gift.fromId,actorName:gift.fromName,giftId:gift.id,attachments:giftAttachments(gift.payload),status:'pending',text:`${gift.fromName} sent you ${giftLabel(gift.payload)}.`});
  }
}

const areFriends = async (tx, a, b) => await tx.friendship(a, b) === 'accepted' || await tx.friendship(b, a) === 'accepted';

// The player a friend request names: who they are (if the code is valid) and whether they are already a friend.
async function resolveFriend(tx, player, code) {
  const targetId = friendIdFrom(code);
  const target = targetId ? await tx.getPlayer(targetId) : null;
  return { targetId, target, isFriend: !!target && await areFriends(tx, player.id, targetId) };
}

export function createGameService({ repository, checkEnglish, ownerTelegramIds = [], now = () => Date.now() }) {
  const staff=createStaffRoles({repository,now,ownerTelegramIds});
  // Loot rolls use the operating system's secure random source, never Math.random.
  const secureRandom = () => crypto.getRandomValues(new Uint32Array(1))[0] / 4294967296;
  const context = () => ({ now: now(), random: secureRandom, checkEnglish, spawnCustomers: true });

  async function createPromoCode(body, identity) {
    let promo;
    try { promo = validatePromo(body,now()); } catch (error) { return {status:400,body:{ok:false,error:error.message}}; }
    const created = await repository.transaction(async tx=>{ const created=await tx.createPromo(promo); if(created && identity) await tx.addEvent(identity,'admin.promo.create',{promo},now()); return created; });
    return created ? {ok:true,promo} : {status:409,body:{ok:false,error:'This code already exists. Use a new code.'}};
  }
  async function redeemPromoCode(identity, code) {
    return repository.transaction(async tx=> {
      const player = await tx.findOrCreatePlayer(identity);
      const record = await tx.lockState(player.id);
      const promo = await tx.findPromo(cleanCode(code));
      if (!promo || promo.deletedAt || promo.startsAt > now() || promo.expiresAt <= now() || (promo.maxUses !== null && promo.maxUses !== undefined && promo.uses >= promo.maxUses)) return {status:409,body:{ok:false,error:'This code is invalid or expired.'}};
      const state = normalizePlayerState(record?.state ?? createInitialState(now()));
      const coinsBefore = state.money, crystalsBefore = state.crystals;
      // The unique redemption is inside the same transaction as all rewards and ledgers.
      if (!await tx.redeemPromo(promo.code,player.id)) return {status:409,body:{ok:false,error:'You have already redeemed this code.'}};
      const rewards=promo.rewards.map(reward=>resolveFragmentReward(state,reward,()=>.5));
      addMail(state,{id:`promo:${promo.code}`,at:now(),kind:'reward',direction:'incoming',actorId:0,actorName:'BarLingo',status:'pending',text:`Promo code ${promo.code}: rewards are ready to claim.`,attachments:rewardAttachments({promo:rewards}),reward:{promo:rewards}});
      state.message = 'Promo code redeemed. Claim your rewards in Mail (available for 180 days).';
      await tx.saveState(player.id,state,(record?.version ?? 0)+1);
      const requestId = `promo:${promo.code}`;
      if (state.money !== coinsBefore) await tx.addLedger(player.id,{requestId,action:'redeemPromoCode',delta:state.money-coinsBefore,balance:state.money});
      if (state.crystals !== crystalsBefore) await tx.addCrystalLedger(player.id,{requestId,action:'redeemPromoCode',delta:state.crystals-crystalsBefore,balance:state.crystals});
      await tx.addLootLedger(player.id,{requestId,action:'redeemPromoCode',message:state.message,detail:promo.rewards});
      return {ok:true,state:publicState(state),message:state.message,serverTime:now()};
    });
  }

  async function session(identity) {
    await expireGifts();
    return repository.transaction(async (tx) => {
      const player = await tx.findOrCreatePlayer(identity);
      const record = await tx.lockState(player.id);
      const state = normalizePlayerState(record?.state ?? createInitialState(now()));
      advanceClock(state, context());
      await syncGiftMail(tx, player.id, state);
      pruneMail(state,now());
      const theftNotifications = state.mailbox.filter(item=>item.kind==='theft' && item.direction==='incoming' && !item.readAt);
      await tx.saveState(player.id, state, (record?.version ?? 0) + 1);
      return { ok: true, player: { id: player.id, name: player.name, friendCode: friendCode(player.id) }, state: publicState(state), starterPackAvailable: !(await tx.hasStarPurchase(player.id, 'starter')), received:[], theftNotifications, serverTime: now() };
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
      pruneMail(state,now());
      const next = structuredClone(state);
      const eventMail = ['claimDaily','claimPass','spinRoulette','claimLeaderboardReward','claimQuest','claimAchievement'].includes(action.type);
      let beforeReward;
      let result;
      try {
        // Last week's rank comes from the database, never from the client.
        const standing = action.type === 'claimLeaderboardReward' ? await tx.weeklyStanding(weekOf(now()) - 1, Number(player.id)) : undefined;
        result = applyAction(next, action, { ...context(), leaderboard: standing ?? undefined, deferLevelRewards:eventMail, beforeAction:eventMail ? ()=>{beforeReward=structuredClone(next);} : undefined });
        if (eventMail) {
          const changes=deferEventRewards(beforeReward,next);
          if(changes.length) {
            addMail(next,{id:`event:${requestId}`,at:now(),kind:'reward',direction:'incoming',actorId:0,actorName:'BarLingo',status:'pending',text:next.message,attachments:rewardAttachments({changes}),reward:{changes}});
            next.message+=' Rewards are waiting in Mail (180 days).';
          }
          result.moneyDelta=next.money-beforeReward.money;
          result.crystalDelta=next.crystals-beforeReward.crystals;
          result.weekly={...result.weekly,...next.loot.weekly};
        }
      } catch (error) {
        if (!(error instanceof RuleError)) throw error;
        // The action was refused; time still passes, but nothing the client asked for happens.
        advanceClock(state, context());
        await tx.saveState(player.id, state, (record?.version ?? 0) + 1);
        const refused = { ok: false, error: error.message, state: publicState(state), serverTime: now() };
        await tx.saveRequest(player.id, requestId, refused);
        await tx.addEvent(identity,'game.action.refused',{requestId,action,error:error.message},now());
        return { status: 409, body: refused };
      }
      await tx.saveState(player.id, next, (record?.version ?? 0) + 1);
      // Only written when the week's score actually moved (most actions earn no XP).
      if (result.weekly && result.weekly.score > 0 && (result.weekly.score !== state.loot.weekly.score || result.weekly.week !== state.loot.weekly.week)) await tx.setWeeklyScore(Number(player.id), result.weekly.week, result.weekly);
      if (result.moneyDelta !== 0) await tx.addLedger(player.id, { requestId, action: action.type, delta: result.moneyDelta, balance: next.money });
      if (result.crystalDelta !== 0) await tx.addCrystalLedger(player.id, { requestId, action: action.type, delta: result.crystalDelta, balance: next.crystals });
      if (result.audit) await tx.addLootLedger(player.id, { requestId, ...result.audit });
      const response = { ok: true, message: next.message, state: publicState(next), serverTime: now() };
      await tx.saveRequest(player.id, requestId, response);
      await tx.addEvent(identity,'game.action',{requestId,action,moneyDelta:next.money-state.money,crystalDelta:next.crystals-state.crystals,xpDelta:next.xp-state.xp},now());
      return { status: 200, body: response };
    });
  }

  // The weekly leaderboard: the top bars by XP earned this week, the player's own rank, and last week's claimable reward.
  // The rows of this week's board for one player, with the ids that the screen never sees.
  async function boardFor(tx, player, own, scope, week) {
    const ownId = Number(player.id);
    let top;
    let mine;
    if (scope === 'friends') {
      // Friends only: accepted friends plus me, including friends with no score yet. Names are the friends' own names.
      const friendIds = new Map();
      for (const row of await tx.listFriendships(player.id)) {
        if (row.status !== 'accepted') continue;
        const otherId = Number(row.playerId) === ownId ? Number(row.friendId) : Number(row.playerId);
        friendIds.set(otherId, own.friendLabels?.[String(otherId)] || row.name);
      }
      const scored = new Map((await tx.weeklyFor(week, [ownId, ...friendIds.keys()])).map((row) => [row.playerId, row]));
      const entries = [ownId, ...friendIds.keys()].map((id) => ({ playerId: id, score: scored.get(id)?.score ?? 0, label: id === ownId ? (scored.get(id)?.label ?? own.bars[own.regionId].name) : (friendIds.get(id) || scored.get(id)?.label || 'Friend'), level: scored.get(id)?.level ?? null, order: [...scored.keys()].indexOf(id) }));
      // Stable order: higher score first; equal scores keep the database order (who got there first); unscored last.
      entries.sort((a, b) => b.score - a.score || (a.order < 0) - (b.order < 0) || a.order - b.order || a.playerId - b.playerId);
      top = entries.slice(0, 50).map((row, index) => ({ playerId: row.playerId, rank: index + 1, score: row.score, label: row.label, level: row.level }));
      const at = entries.findIndex((row) => row.playerId === ownId);
      mine = at < 0 ? null : { week, rank: at + 1, size: entries.length, score: entries[at].score };
    } else {
      top = await tx.topWeekly(week, LEADERBOARD_SIZE);
      mine = await tx.weeklyStanding(week, ownId);
    }
    return { top, mine };
  }

  async function leaderboard(identity, scope = 'global') {
    return repository.transaction(async (tx) => {
      const player = await tx.findOrCreatePlayer(identity);
      const week = weekOf(now());
      // Read-only: the state is read once, without the row lock that actions take.
      const own = normalizePlayerState((await tx.readState(player.id)) ?? createInitialState(now()));
      const { top, mine } = await boardFor(tx, player, own, scope, week);
      const previous = await tx.weeklyStanding(week - 1, Number(player.id));
      const claimed = own.loot.leaderboardClaimed;
      const reward = previous ? leaderboardReward(previous.rank, previous.score) : undefined;
      // Only the podium needs art. Return public appearance fields, never the player's save.
      const podiumLooks = new Map();
      for (const row of top.slice(0, 3)) {
        const saved = row.playerId === Number(player.id) ? own : await tx.readState(row.playerId);
        const bar = saved?.bars?.[saved.regionId];
        if (bar) podiumLooks.set(row.playerId, Object.fromEntries([
          'interior', 'bartenderCharacter', 'bartender', 'hairStyle', 'hairColor', 'bodyShape', 'skinDetail', 'skinTone', 'pose', 'eyeShape', 'browShape', 'noseShape', 'lipShape', 'cheekShape', 'eyeColor', 'eyeliner', 'eyeshadow', 'lipColor', 'blush', 'facialHair', 'outfitColor'
        ].filter(key => typeof bar[key] === 'string').map(key => [key, bar[key]])));
      }
      return {
        ok: true, scope: scope === 'friends' ? 'friends' : 'global', week, endsAt: (week + 1) * WEEK_MS, minScore: MIN_WEEKLY_SCORE,
        top: top.map((row) => ({ rank: row.rank, label: row.label, level: row.level, score: row.score, me: row.playerId === Number(player.id), ...(podiumLooks.has(row.playerId) ? { look: podiumLooks.get(row.playerId) } : {}) })),
        me: mine, previous: previous ? { ...previous, tier: reward?.tier ?? null, reward: reward ? describeLeaderboardReward(reward) : null, claimable: !!reward && claimed < previous.week } : null
      };
    });
  }

  // A look at the bar of someone on this week's board: read-only, no prestige, no gifts. A stranger sees the bar
  // (look, background, level, prestige) and the public profile, not which recipes or backgrounds they own.
  async function leaderboardBar(identity, body) {
    return repository.transaction(async (tx) => {
      const player = await tx.findOrCreatePlayer(identity);
      const scope = body?.scope === 'friends' ? 'friends' : 'global';
      const week = weekOf(now());
      const rank = Math.floor(Number(body?.rank));
      if (Number(body?.week) !== week) return { status: 409, body: { ok: false, error: 'The board has changed. Refresh it and try again.' } };
      const own = normalizePlayerState((await tx.readState(player.id)) ?? createInitialState(now()));
      const { top } = await boardFor(tx, player, own, scope, week);
      const row = Number.isInteger(rank) && rank >= 1 ? top[rank - 1] : undefined;
      if (!row || (Number.isFinite(Number(body?.score)) && Number(body.score) !== row.score)) return { status: 409, body: { ok: false, error: 'The board has changed. Refresh it and try again.' } };
      const theirs = await tx.readState(row.playerId);
      if (!theirs) return { status: 404, body: { ok: false, error: 'This bar is not available.' } };
      const state = normalizePlayerState(theirs);
      const { knownRecipeIds, ownedInteriorIds, ...bar } = publicBar(state, row.label);
      return { status: 200, body: { ok: true, rank: row.rank, score: row.score, bar: { ...bar, prestige: state.popularity } } };
    });
  }

  async function friends(identity) {
    return repository.transaction(async (tx) => {
      const player = await tx.findOrCreatePlayer(identity);
      const own = normalizePlayerState((await tx.readState(player.id)) ?? createInitialState(now()));
      const today = calendarDate(new Date(now()));
      const items = new Map();
      for (const row of await tx.listFriendships(player.id)) {
        const outgoing = Number(row.playerId) === Number(player.id);
        const otherId = outgoing ? Number(row.friendId) : Number(row.playerId);
        const other = await tx.getPlayer(otherId);
        if (!other) continue;
        const theirs = row.status === 'accepted' ? normalizePlayerState((await tx.readState(otherId)) ?? createInitialState(now())) : null;
        const item = {
          id: otherId, code: friendCode(otherId), nickname: other.name, customName: own.friendLabels?.[String(otherId)] ?? '',
          status: row.status, direction: outgoing ? 'outgoing' : 'incoming',
          level: theirs ? levelFor(theirs.xp) : 0, prestige: theirs?.popularity ?? 0, barName: theirs?.bars[theirs.regionId]?.name ?? '',
          visitedToday: own.friendVisits?.[String(otherId)] === today
        };
        const previous = items.get(otherId);
        if (!previous || row.status === 'accepted' || previous.direction === 'outgoing') items.set(otherId, item);
      }
      const pendingGifts = (await tx.listGifts(player.id)).length;
      return { ok: true, friendCode: friendCode(player.id), prestige: own.popularity, pendingGifts, friends: [...items.values()] };
    });
  }

  async function addFriend(identity, code) {
    return repository.transaction(async (tx) => {
      const player = await tx.findOrCreatePlayer(identity);
      const targetId = friendIdFrom(code);
      if (!targetId) return { status: 409, body: { ok: false, error: 'This is not a valid friend code. Check it and try again.' } };
      if (targetId === Number(player.id)) return { status: 409, body: { ok: false, error: 'This is your own friend code.' } };
      const target = await tx.getPlayer(targetId);
      if (!target) return { status: 404, body: { ok: false, error: 'No player has this friend code.' } };
      if (await areFriends(tx, player.id, targetId)) return { status: 409, body: { ok: false, error: 'This player is already your friend.' } };
      if (await tx.friendship(player.id, targetId) === 'pending') return { status: 409, body: { ok: false, error: 'You already sent this player a request. Wait for them to accept.' } };
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

  // Withdraws a request you sent, or ends a friendship (either side may do it).
  async function removeFriend(identity, code) {
    return repository.transaction(async (tx) => {
      const player = await tx.findOrCreatePlayer(identity);
      const targetId = friendIdFrom(code);
      const target = targetId ? await tx.getPlayer(targetId) : null;
      const linked = target && (await tx.friendship(player.id, targetId) || await tx.friendship(targetId, player.id));
      if (!linked) return { status: 404, body: { ok: false, error: 'This player is not in your list.' } };
      const wasFriend = await areFriends(tx, player.id, targetId);
      await tx.deleteFriendship(player.id, targetId);
      return { status: 200, body: { ok: true, message: wasFriend ? `${target.name} was removed from your friends.` : 'Friend request withdrawn.' } };
    });
  }

  async function labelFriend(identity, code, label) {
    return repository.transaction(async (tx) => {
      const player = await tx.findOrCreatePlayer(identity);
      const { targetId, isFriend } = await resolveFriend(tx, player, code);
      if (!isFriend) return { status: 403, body: { ok: false, error: 'Add this player as a friend first.' } };
      const record = await tx.lockState(player.id);
      const state = normalizePlayerState(record?.state ?? createInitialState(now()));
      const clean = String(label ?? '').replace(/[\u0000-\u001f\u007f]/g, '').trim().slice(0, 28);
      state.friendLabels[String(targetId)] = clean;
      await tx.saveState(player.id, state, (record?.version ?? 0) + 1);
      return { status: 200, body: { ok: true, state: publicState(state), message: clean ? 'Friend name saved.' : 'Custom friend name removed.' } };
    });
  }

  // Visiting shows a friend's bar. The first visit of the day gives the owner +1 prestige and opens gifting for that friend.
  async function visitFriend(identity, code) {
    return repository.transaction(async (tx) => {
      const player = await tx.findOrCreatePlayer(identity);
      const { targetId, target, isFriend } = await resolveFriend(tx, player, code);
      if (!isFriend) return { status: 403, body: { ok: false, error: 'Add this player as a friend before visiting.' } };
      // Lock both rows in id order: two friends visiting each other at once must not wait on each other's lock.
      const ids = [Number(player.id), targetId].sort((x, y) => x - y);
      const locked = new Map();
      for (const id of ids) locked.set(id, await tx.lockState(id));
      const visitorRecord = locked.get(Number(player.id));
      const friendRecord = locked.get(targetId);
      const visitor = normalizePlayerState(visitorRecord?.state ?? createInitialState(now()));
      const owner = normalizePlayerState(friendRecord?.state ?? createInitialState(now()));
      accrueTips(owner, now());
      const key = String(targetId);
      const today = calendarDate(new Date(now()));
      const rewarded = visitor.friendVisits[key] !== today;
      const visitId = `visit:${randomBytes(12).toString('hex')}`;
      addMail(owner,{id:visitId,at:now(),kind:'visit',direction:'incoming',actorId:Number(player.id),actorName:player.name,text:`${player.name} visited your bar.${rewarded ? ' +1 prestige.' : ''}`});
      addMail(visitor,{id:visitId,at:now(),kind:'visit',direction:'outgoing',actorId:targetId,actorName:target.name,text:`You visited ${target.name}’s bar.`,readAt:now()});
      if (rewarded) {
        visitor.friendVisits[key] = today;
        addStat(visitor, 'visitedFriends', 1);
        addStat(owner, 'visitedBy', 1);
        owner.popularity += 1;
        owner.message = `${player.name} visited your bar. +1 prestige.`;
      }
      await tx.saveState(player.id, visitor, (visitorRecord?.version ?? 0) + 1);
      await tx.saveState(targetId, owner, (friendRecord?.version ?? 0) + 1);
      return { status: 200, body: { ok: true, rewarded, state: publicState(visitor), friend: { id: targetId, code: friendCode(targetId), nickname: target.name, customName: visitor.friendLabels[key] ?? '', prestige: owner.popularity, tips: tipVisitInfo(visitor, owner, key, today), ...publicBar(owner, target.name) } } };
    });
  }

  function tipVisitInfo(visitor, owner, targetId, today) {
    const targets = visitor.tipTheft?.day === today ? visitor.tipTheft.targets : [];
    return { amount: owner.tipJar, capacity: tipCapacity(owner), attemptsLeft: Math.max(0, 10 - targets.length), attemptedToday: targets.includes(targetId) };
  }

  async function stealFriendTips(identity, code) {
    return repository.transaction(async tx => {
      const player = await tx.findOrCreatePlayer(identity);
      const { targetId, target, isFriend } = await resolveFriend(tx, player, code);
      if (!isFriend || Number(player.id) === targetId) return {status:403,body:{ok:false,error:'Visit a friend’s bar to take a small share of tips.'}};
      const locked = new Map();
      for (const id of [Number(player.id), targetId].sort((a,b)=>a-b)) locked.set(id,await tx.lockState(id));
      const mine = locked.get(Number(player.id)), theirs = locked.get(targetId);
      const visitor = normalizePlayerState(mine?.state ?? createInitialState(now()));
      const owner = normalizePlayerState(theirs?.state ?? createInitialState(now()));
      const today = calendarDate(new Date(now())), key = String(targetId);
      if (visitor.friendVisits[key] !== today) return {status:403,body:{ok:false,error:'Visit this bar first.'}};
      if (visitor.tipTheft?.day !== today) visitor.tipTheft = {day:today,targets:[]};
      if (visitor.tipTheft.targets.includes(key)) return {status:409,body:{ok:false,error:'You already tried this player’s jar today.'}};
      if (visitor.tipTheft.targets.length >= 10) return {status:409,body:{ok:false,error:'All 10 theft attempts have been used today.'}};
      accrueTips(owner,now());
      visitor.tipTheft.targets.push(key);
      const amount = stealableTips(owner);
      owner.tipJar = coins(owner.tipJar - amount);
      visitor.money = coins(visitor.money + amount);
      visitor.message = amount > 0 ? `You took ${amount} coins from ${target.name}’s tip jar.` : 'No tips could be taken. This attempt has been used.';
      if (amount > 0) owner.message = `At ${new Date(now()).toLocaleString('en-GB',{timeZone:'Europe/Moscow',dateStyle:'medium',timeStyle:'short'})} MSK, player ${player.name} stole ${amount} coins from your tip jar!`;
      const requestId = `tip-theft:${today}:${player.id}:${targetId}`;
      addMail(visitor,{id:requestId,at:now(),kind:'theft',direction:'outgoing',actorId:targetId,actorName:target.name,text:visitor.message,amount,readAt:now()});
      if (amount > 0) {
        addMail(owner,{id:requestId,at:now(),kind:'theft',direction:'incoming',actorId:Number(player.id),actorName:player.name,text:owner.message,amount});
        await tx.addLedger(player.id,{requestId,action:'stealTips',delta:amount,balance:visitor.money});
        await tx.addLootLedger(targetId,{requestId,action:'tipsStolen',message:owner.message,detail:{amount,visitorId:player.id}});
      }
      await tx.saveState(player.id,visitor,(mine?.version ?? 0)+1);
      await tx.saveState(targetId,owner,(theirs?.version ?? 0)+1);
      return {status:200,body:{ok:true,state:publicState(visitor),message:visitor.message,tips:tipVisitInfo(visitor,owner,key,today),stolen:amount}};
    });
  }

  // Gifts can only be handed over while visiting: the sender must have visited this friend's bar today.
  async function sendGift(identity, code, gift) {
    return repository.transaction(async (tx) => {
      const player = await tx.findOrCreatePlayer(identity);
      const { targetId, target, isFriend } = await resolveFriend(tx, player, code);
      if (!isFriend) return { status: 403, body: { ok: false, error: 'You can only send gifts to friends.' } };
      const locked = new Map();
      for (const id of [Number(player.id),targetId].sort((a,b)=>a-b)) locked.set(id,await tx.lockState(id));
      const record = locked.get(Number(player.id)), ownerRecord = locked.get(targetId);
      const state = normalizePlayerState(record?.state ?? createInitialState(now()));
      const owner = normalizePlayerState(ownerRecord?.state ?? createInitialState(now()));
      if (state.friendVisits[String(targetId)] !== calendarDate(new Date(now()))) return { status: 403, body: { ok: false, error: 'Visit this friend’s bar first — gifts are handed over during a visit.' } };
      try {
        const paid = payForGift(state, gift, now());
        addStat(state, 'giftsSent', 1);
        const giftId = await tx.addGift({ fromId: Number(player.id), toId: targetId, payload: paid, createdAt:now() });
        addMail(state,{id:`gift-out:${giftId}`,at:now(),kind:'gift',direction:'outgoing',actorId:targetId,actorName:target.name,giftId,attachments:giftAttachments(paid),status:'pending',readAt:now(),text:`You sent ${giftLabel(paid)} to ${target.name}.`});
        addMail(owner,{id:`gift-in:${giftId}`,at:now(),kind:'gift',direction:'incoming',actorId:Number(player.id),actorName:player.name,giftId,attachments:giftAttachments(paid),status:'pending',text:`${player.name} sent you ${giftLabel(paid)}.`});
        state.message = `Gift sent to ${target.name}.`;
      } catch (error) {
        return { status: 409, body: { ok: false, error: error.message } };
      }
      await tx.saveState(player.id, state, (record?.version ?? 0) + 1);
      await tx.saveState(targetId,owner,(ownerRecord?.version ?? 0)+1);
      return { status: 200, body: { ok: true, state: publicState(state), message: state.message } };
    });
  }

  // Explicit legacy "accept all" action. Never called automatically on login or refresh.
  async function claimGifts(identity) {
    const gifts = await repository.transaction(async tx=>{const player=await tx.findOrCreatePlayer(identity); return tx.listGifts(player.id);});
    const received = []; let state;
    for (const gift of gifts) {
      const result = await decideGift(identity,gift.id,true);
      if (result.body.ok) {received.push(result.body.message); state=result.body.state;}
    }
    return {status:200,body:{ok:true,received,state,serverTime:now()}};
  }

  async function mailbox(identity, readIds = []) {
    await expireGifts();
    return repository.transaction(async (tx) => {
      const player = await tx.findOrCreatePlayer(identity);
      const record = await tx.lockState(player.id);
      const state = normalizePlayerState(record?.state ?? createInitialState(now()));
      await syncGiftMail(tx,player.id,state);
      pruneMail(state,now());
      const read = new Set(Array.isArray(readIds) ? readIds.filter(id=>typeof id==='string') : []);
      for (const item of state.mailbox) if (read.has(item.id)) item.readAt ??= now();
      await tx.saveState(player.id, state, (record?.version ?? 0) + 1);
      return {status:200,body:{ok:true,state:publicState(state),serverTime:now()}};
    });
  }

  async function expireGifts() {
    const expired=await repository.transaction(tx=>tx.expiredGifts(now()-MAIL_LIFETIME.gift));
    for (const gift of expired) await decideGift(undefined,gift.id,false,gift.toId);
  }

  async function claimMailReward(identity,id) {
    return repository.transaction(async tx=>{
      const player=await tx.findOrCreatePlayer(identity),record=await tx.lockState(player.id);
      const state=normalizePlayerState(record?.state ?? createInitialState(now()));
      pruneMail(state,now());
      const mail=state.mailbox.find(item=>item.id===id && item.kind==='reward' && item.status==='pending' && item.expiresAt>now());
      if(!mail)return {status:409,body:{ok:false,error:'This reward was already claimed or has expired.'}};
      const money=state.money,crystals=state.crystals,xp=state.xp;
      if(mail.reward?.promo) applyPromoRewards(state,mail.reward.promo);
      else claimEventRewards(state,mail.reward?.changes ?? []);
      mail.status='accepted';mail.readAt=now();delete mail.reward;
      state.message=`Claimed rewards: ${mail.text}`;
      grantLevelBoxes(state);
      if(state.xp>xp) {addWeeklyScore(state,state.xp-xp,now());const weekly=state.loot.weekly;await tx.setWeeklyScore(Number(player.id),weekly.week,{...weekly,label:state.bars[state.regionId].name,level:levelFor(state.xp)});}
      await tx.saveState(player.id,state,(record?.version ?? 0)+1);
      const requestId=`mail:${id}`;
      if(state.money!==money)await tx.addLedger(player.id,{requestId,action:'claimMailReward',delta:state.money-money,balance:state.money});
      if(state.crystals!==crystals)await tx.addCrystalLedger(player.id,{requestId,action:'claimMailReward',delta:state.crystals-crystals,balance:state.crystals});
      await tx.addLootLedger(player.id,{requestId,action:'claimMailReward',message:state.message,detail:{id}});
      return {status:200,body:{ok:true,state:publicState(state),message:state.message,serverTime:now()}};
    });
  }

  async function decideGift(identity, giftId, accept, expiryPlayerId) {
    if (!expiryPlayerId) await expireGifts();
    if (!Number.isSafeInteger(giftId) || giftId<=0 || typeof accept!=='boolean') return {status:400,body:{ok:false,error:'Choose a gift and accept or decline.'}};
    return repository.transaction(async tx=>{
      const player = expiryPlayerId ? await tx.getPlayer(expiryPlayerId) : await tx.findOrCreatePlayer(identity);
      const gift = (await tx.listGifts(player.id)).find(item=>item.id===giftId);
      if (!gift) return {status:409,body:{ok:false,error:'This gift was already handled or is not addressed to you.'}};
      const expired=gift.createdAt+MAIL_LIFETIME.gift<=now();
      if (expired) accept=false;
      const locked=new Map();
      for (const id of [Number(player.id),gift.fromId].sort((a,b)=>a-b)) locked.set(id,await tx.lockState(id));
      const record=locked.get(Number(player.id)), senderRecord=locked.get(gift.fromId);
      const state=normalizePlayerState(record?.state ?? createInitialState(now()));
      const sender=normalizePlayerState(senderRecord?.state ?? createInitialState(now()));
      await syncGiftMail(tx,player.id,state);
      if (!await tx.takeGift(giftId,player.id)) return {status:409,body:{ok:false,error:'This gift was already handled.'}};
      const moneyBefore=sender.money, crystalsBefore=sender.crystals;
      if (accept) state.message=receiveGift(state,gift.payload,gift.fromName);
      else {
        const price=giftPrice(gift.payload);
        if (gift.payload.kind==='recipe' || gift.payload.kind==='interior') {
          if (price?.currency==='coins') sender.money=coins(sender.money+price.amount);
          if (price?.currency==='crystals') sender.crystals+=price.amount;
        } else receiveGift(sender,gift.payload,player.name,false);
        state.message=`Gift ${expired?'expired':'declined'}. ${giftLabel(gift.payload)} was returned to ${gift.fromName}.`;
      }
      const incoming=state.mailbox.find(item=>item.giftId===giftId && item.direction==='incoming');
      incoming.status=accept?'accepted':expired?'returned':'declined'; incoming.readAt=now();
      addMail(sender,{id:`gift-out:${giftId}`,at:gift.createdAt,kind:'gift',direction:'outgoing',actorId:Number(player.id),actorName:player.name,giftId,attachments:giftAttachments(gift.payload),status:'pending',text:`You sent ${giftLabel(gift.payload)} to ${player.name}.`});
      const outgoing=sender.mailbox.find(item=>item.giftId===giftId && item.direction==='outgoing');
      outgoing.status=accept?'accepted':expired?'returned':'declined'; delete outgoing.readAt;
      outgoing.text=expired ? `Your gift to ${player.name} expired after 14 days: ${giftLabel(gift.payload)} was returned to you.` : `${player.name} ${accept?'accepted':'declined'} your gift: ${giftLabel(gift.payload)}.${accept?'':' The item or its purchase price was returned to you.'}`;
      if (expired) addMail(sender,{id:`gift-return:${giftId}`,at:now(),kind:'gift',direction:'incoming',actorId:Number(player.id),actorName:player.name,status:'returned',attachments:giftAttachments(gift.payload),text:outgoing.text});
      sender.message=outgoing.text;
      await tx.saveState(player.id,state,(record?.version ?? 0)+1);
      await tx.saveState(gift.fromId,sender,(senderRecord?.version ?? 0)+1);
      const requestId=`gift-decision:${giftId}`;
      if (sender.money!==moneyBefore) await tx.addLedger(gift.fromId,{requestId,action:'giftDeclined',delta:sender.money-moneyBefore,balance:sender.money});
      if (sender.crystals!==crystalsBefore) await tx.addCrystalLedger(gift.fromId,{requestId,action:'giftDeclined',delta:sender.crystals-crystalsBefore,balance:sender.crystals});
      await tx.addLootLedger(player.id,{requestId,action:accept?'giftAccepted':'giftDeclined',message:state.message,detail:{giftId}});
      return {status:200,body:{ok:true,state:publicState(state),message:state.message,serverTime:now()}};
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
      await tx.addEvent({telegramId:null},'payment.stars',{playerId:player.id,packId:order.pack.id,crystals:order.pack.crystals,stars:order.pack.stars,chargeId},now());
      return { credited: true, playerId: player.id, pack: order.pack };
    });
  }

  // Request ids only need to survive long enough for a retry; older rows are pure bloat.
  const pruneRequests = (olderThanMs = 7 * 24 * 60 * 60 * 1000) => repository.transaction((tx) => tx.pruneRequests(now() - olderThanMs));

  return { ...staff, ...createAdministration({repository,now,staff}), claimMailReward, expireGifts, mailbox, decideGift, createPromoCode, redeemPromoCode, pruneRequests, session, act, leaderboard, leaderboardBar, friends, addFriend, answerFriend, removeFriend, labelFriend, visitFriend, stealFriendTips, sendGift, claimGifts, startStarPurchase, approveStarCheckout, fulfilStarPayment };
}
