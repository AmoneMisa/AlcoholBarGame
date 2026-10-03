import { calendarDate } from './economy';
import { statValue } from './achievementStats';
import { ACHIEVEMENTS, questsForWeek, weekOf } from './quests';
import { spinsLeft } from './roulette';
import { passIdOf, passLevel, passPointsFor, readyPassRewards } from './pass';
import type { PlayerState } from '../sim/state';

export function eventAvailability(state: PlayerState, now: number) {
  const day = calendarDate(new Date(now));
  const quests = state.loot.quests.week === weekOf(now) ? questsForWeek(weekOf(now)).filter(goal => !state.loot.quests.claimed.includes(goal.id) && (state.loot.quests.progress[goal.stat] ?? 0) >= goal.target) : [];
  const achievements = ACHIEVEMENTS.filter(goal => !state.loot.achievements.includes(goal.id) && statValue(state, goal.stat) >= goal.target && (goal.tier === 1 || ACHIEVEMENTS.some(previous => previous.series === goal.series && previous.tier === goal.tier - 1 && state.loot.achievements.includes(previous.id))));
  const currentPass = state.pass.id === passIdOf(state.pass.epoch || now, now);
  const passRewards = readyPassRewards(passLevel(passPointsFor(state.loot.stats, currentPass ? state.pass.base : state.loot.stats) + (currentPass ? state.pass.bonus ?? 0 : 0)), currentPass && state.pass.premium, currentPass ? state.pass.claimed : []);
  const rewards = passRewards + Number(state.dailyGiftClaimedKey !== day) + quests.length + achievements.length;
  const freeDraws = spinsLeft(state.roulette, day);
  return { quests, achievements, rewards, freeDraws, spins: freeDraws, badge: rewards + freeDraws };
}
