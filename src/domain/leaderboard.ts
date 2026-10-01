import type { BoxKind } from './loot';

// The weekly leaderboard ranks bars by the XP earned that week (level-independent, so newcomers compete with veterans:
// a served drink pays the same XP at level 1 and at level 50). Weeks are UTC weeks (see domain/quests.ts).
export const LEADERBOARD_SIZE = 20;
export const MIN_WEEKLY_SCORE = 300;          // about three served drinks: the score needed to earn any reward

export interface LeaderboardReward { boxes: Partial<Record<BoxKind, number>>; crystals: number; tier: string; }

// Rewards for last week's final rank. Ranks beyond the tiers still earn a bronze box for taking part.
export function leaderboardReward(rank: number, score: number): LeaderboardReward | undefined {
  if (!Number.isInteger(rank) || rank < 1 || score < MIN_WEEKLY_SCORE) return undefined;
  if (rank === 1) return { tier: 'Champion', boxes: { choice: 1, gold: 1 }, crystals: 60 };
  if (rank <= 3) return { tier: 'Podium', boxes: { choice: 1, silver: 1 }, crystals: 30 };
  if (rank <= 10) return { tier: 'Top 10', boxes: { gold: 1 }, crystals: 15 };
  if (rank <= 25) return { tier: 'Top 25', boxes: { silver: 1 }, crystals: 0 };
  return { tier: 'Participant', boxes: { bronze: 1 }, crystals: 0 };
}
export function describeLeaderboardReward(reward: LeaderboardReward) {
  const parts = Object.entries(reward.boxes).map(([kind, count]) => `${count} ${kind} box${count === 1 ? '' : 'es'}`);
  if (reward.crystals) parts.push(`${reward.crystals} crystals`);
  return parts.join(' + ');
}

// The notification for a finished week: only when there is a reward to claim. The key makes it show once per week.
export interface WeekResult { week: number; rank: number; size: number; tier: string | null; reward: string | null; claimable: boolean; }
export function weeklyRewardNotice(previous: WeekResult | null | undefined) {
  if (!previous || !previous.claimable || !previous.reward) return null;
  return {
    key: `weekly-reward:${previous.week}`,
    title: `Weekly leaderboard: ${previous.tier ?? 'reward'}`,
    text: `You finished #${previous.rank} of ${previous.size}. Claim ${previous.reward} in Workshop → Weekly.`
  };
}
