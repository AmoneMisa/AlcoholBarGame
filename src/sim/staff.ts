import { coins } from '../domain/economy';
import { MAX_STAFF, MAX_STAFF_LEVEL, STAFF_AWAY_CAP_MS, STAFF_AWAY_MIN_MS, STAFF_PROFILES, hireCost, teamShare, unlockedSlots, upgradeCost } from '../domain/staff';
import { CUSTOMER_ARRIVAL_MAX_MS, CUSTOMER_ARRIVAL_MIN_MS } from '../domain/customerTiming';
import { levelFor, type PlayerState } from './state';

// Hiring and upgrading servers, and what they earn while the player is away (see domain/staff.ts).

export function hireStaff(state: PlayerState): string {
  const staff = (state.staff ??= []);
  if (staff.length >= MAX_STAFF) throw new Error('You already have the whole team.');
  if (staff.length >= unlockedSlots(levelFor(state.xp))) throw new Error('The next server opens at a higher bar level.');
  const cost = hireCost(staff.length);
  if (state.money < cost) throw new Error(`Hiring costs ${cost} coins.`);
  state.money = coins(state.money - cost);
  staff.push({ level: 1 });
  state.staffAt = state.lastClockAt;
  return `${STAFF_PROFILES[staff.length - 1]!.name} joined your team.`;
}

export function upgradeStaff(state: PlayerState, index: number): string {
  const member = state.staff?.[index];
  if (!member) throw new Error('There is no such server.');
  if (member.level >= MAX_STAFF_LEVEL) throw new Error('This server is already fully trained.');
  const cost = upgradeCost(index, member.level);
  if (state.money < cost) throw new Error(`Training costs ${cost} coins.`);
  state.money = coins(state.money - cost);
  member.level += 1;
  return `${STAFF_PROFILES[index]!.name} is now level ${member.level}.`;
}

// Called on every clock tick. A long silence means the player was away: the team served guests meanwhile.
// Servers earn only a part of what the player would have made, and never crystals, tips or recipes.
export function accrueStaff(state: PlayerState, now: number, random: () => number, market: { averagePrice: number; arrival: number }): string | undefined {
  if (!state.staff?.length) { state.staffAt = now; return undefined; }
  const last = state.staffAt ?? now;
  state.staffAt = now;
  const away = now - last;
  if (away < STAFF_AWAY_MIN_MS) return undefined;
  const worked = Math.min(away, STAFF_AWAY_CAP_MS);
  const meanGap = ((CUSTOMER_ARRIVAL_MIN_MS + CUSTOMER_ARRIVAL_MAX_MS) / 2) * Math.max(.2, market.arrival);
  const guests = (worked / meanGap) * (.85 + random() * .3);
  const earned = coins(guests * market.averagePrice * teamShare(state.staff));
  if (earned <= 0) return undefined;
  state.money = coins(state.money + earned);
  state.xp += Math.round(guests * 20 * teamShare(state.staff));
  state.staffEarned = coins((state.staffEarned ?? 0) + earned);
  return `While you were away your team served about ${Math.max(1, Math.round(guests * teamShare(state.staff)))} guests: +${earned.toFixed(2)} coins.`;
}
