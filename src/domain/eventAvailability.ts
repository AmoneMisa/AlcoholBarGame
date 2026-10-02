import { calendarDate } from './economy';
import { statValue } from './achievementStats';
import { ACHIEVEMENTS, questsForWeek, weekOf } from './quests';
import { DRAW_COST } from './loot';
import type { PlayerState } from '../sim/state';

export function eventAvailability(state: PlayerState, now: number) {
  const day = calendarDate(new Date(now));
  const quests = state.loot.quests.week === weekOf(now) ? questsForWeek(weekOf(now)).filter(goal => !state.loot.quests.claimed.includes(goal.id) && (state.loot.quests.progress[goal.stat] ?? 0) >= goal.target) : [];
  const achievements = ACHIEVEMENTS.filter(goal => !state.loot.achievements.includes(goal.id) && statValue(state, goal.stat) >= goal.target && (goal.tier === 1 || ACHIEVEMENTS.some(previous => previous.series === goal.series && previous.tier === goal.tier - 1 && state.loot.achievements.includes(previous.id))));
  const rewards = Number(state.dailyGiftClaimedKey !== day) + quests.length + achievements.length;
  const freeDraws = Number(state.cosmeticRouletteKey !== day);
  return { quests, achievements, rewards, freeDraws, spins: Math.floor(state.crystals / DRAW_COST.single), badge: rewards + freeDraws };
}
