import { INTERIORS } from '../data/cosmetics/bars';
import { styleForInterior } from '../data/cosmetics/styleSources';
import { COSMETICS } from '../domain/cosmetics';
import {
  PASS_LEVELS, PASS_PREMIUM_PRICE, passClaimKey, passId, passLevel, passPointsFor, passRewards, passThemeAt
} from '../domain/pass';
import { grantCosmetic, grantReward } from './loot';
import type { PlayerState } from './state';

// The season pass: points are counted from the loot counters since the pass began (see domain/pass.ts), so the
// server needs no extra bookkeeping while the player plays. Only the claims and the premium purchase are stored.
export class PassError extends Error {}

/** Starts the current pass when a new one has begun (or for the first time): the counters at that moment are the base. */
export function syncPass(state: PlayerState, now: number) {
  const id = passId(now);
  if (state.pass?.id === id) return;
  state.pass = { id, base: { ...state.loot.stats }, premium: false, claimed: [] };
}

export const passPoints = (state: PlayerState) => passPointsFor(state.loot.stats, state.pass.base);
export const passLevelOf = (state: PlayerState) => passLevel(passPoints(state));

export function claimPass(state: PlayerState, trackInput: unknown, levelInput: unknown, random: () => number, now: number): string {
  syncPass(state, now);
  const track = trackInput === 'premium' ? 'premium' : trackInput === 'free' ? 'free' : undefined;
  const level = Math.floor(Number(levelInput));
  if (!track || !Number.isInteger(level) || level < 1 || level > PASS_LEVELS) throw new PassError('Unknown pass reward.');
  if (passLevelOf(state) < level) throw new PassError(`Reach pass level ${level} first.`);
  if (track === 'premium' && !state.pass.premium) throw new PassError('Unlock the premium track first.');
  const key = passClaimKey(track, level);
  if (state.pass.claimed.includes(key)) throw new PassError('This reward is already claimed.');
  const row = passRewards(passThemeAt(now)).find((item) => item.level === level)!;
  state.pass.claimed.push(key);

  const interiorsBefore = [...state.ownedInteriorIds];
  const stylesBefore = [...state.ownedCosmeticIds];
  const parts: string[] = [];
  for (const reward of track === 'free' ? row.free : row.premium) {
    if (reward.kind === 'interior') {
      if (!state.ownedInteriorIds.includes(reward.id)) state.ownedInteriorIds.push(reward.id);
      const linked = styleForInterior(reward.id);   // the background's own style comes with it
      if (linked) grantCosmetic(state, `bartender:${linked.value}:${linked.character}`);
    } else if (reward.kind === 'cosmetics') {
      for (const id of reward.ids) {
        // The costumes come at their own level, without the background that normally goes with a connected style: that
        // arrives at level 20.
        if (stylesBefore.includes(id)) { state.loot.skinShards += 10; parts.push('10 skin shards (you already had a costume)'); } else state.ownedCosmeticIds.push(id);
      }
    } else parts.push(grantReward(state, reward, random));
  }
  const rooms = state.ownedInteriorIds.filter((id) => !interiorsBefore.includes(id)).map((id) => INTERIORS.find((item) => item.id === id)?.name ?? id);
  const looks = state.ownedCosmeticIds.filter((id) => !stylesBefore.includes(id)).map((id) => COSMETICS.find((item) => item.id === id)?.label ?? id);
  if (rooms.length) parts.unshift(`the background “${rooms.join('”, “')}”`);
  if (looks.length) parts.splice(rooms.length ? 1 : 0, 0, `the costume${looks.length > 1 ? 's' : ''} ${looks.join(' and ')}`);
  return `Pass level ${level}: ${parts.join(', ')}.`;
}

export function buyPassPremium(state: PlayerState, now: number): string {
  syncPass(state, now);
  if (state.pass.premium) throw new PassError('You already have the premium track.');
  if (state.crystals < PASS_PREMIUM_PRICE) throw new PassError(`You need ${PASS_PREMIUM_PRICE} crystals for the premium track.`);
  state.crystals -= PASS_PREMIUM_PRICE;
  state.pass.premium = true;
  return 'Premium track unlocked for this pass: its rewards for the levels you have reached are ready to claim.';
}
