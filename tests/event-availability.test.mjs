import test from 'node:test';
import assert from 'node:assert/strict';
import { eventAvailability } from '../src/domain/eventAvailability.ts';
import { createInitialState } from '../src/sim/state.ts';
import { calendarDate } from '../src/domain/economy.ts';
import { questsForWeek, weekOf } from '../src/domain/quests.ts';
const NOW = Date.UTC(2026,9,2,12);
test('events badge excludes paid spins and resets daily rewards on a new day',()=>{
 const state=createInitialState(NOW); state.crystals=0;
 const before=eventAvailability(state,NOW); assert.equal(before.spins,3); assert.equal(before.freeDraws,3); assert.equal(before.badge,before.rewards+3);
 state.dailyGiftClaimedKey=calendarDate(new Date(NOW)); state.roulette={day:state.dailyGiftClaimedKey,spins:3};
 assert.equal(eventAvailability(state,NOW).badge,before.badge-4);
 assert.equal(eventAvailability(state,NOW).spins,0);
 state.crystals=10000; assert.equal(eventAvailability(state,NOW).spins,0);
 assert.equal(eventAvailability(state,NOW+86400000).badge,before.badge);
});
test('events count only claimable achievement tiers and current-week quests',()=>{
 const state=createInitialState(NOW); state.loot.stats.serves=2000;
 assert.deepEqual(eventAvailability(state,NOW).achievements.filter(g=>g.stat==='serves').map(g=>g.id),['a-serve-10']);
 state.loot.achievements.push('a-serve-10');
 assert.deepEqual(eventAvailability(state,NOW).achievements.filter(g=>g.stat==='serves').map(g=>g.id),['a-serve-100']);
 const week=weekOf(NOW); state.loot.quests.week=week;
 for(const goal of questsForWeek(week)) state.loot.quests.progress[goal.stat]=goal.target;
 assert.equal(eventAvailability(state,NOW).quests.length,3);
 state.loot.quests.claimed.push(questsForWeek(week)[0].id);
 assert.equal(eventAvailability(state,NOW).quests.length,2);
 assert.equal(eventAvailability(state,NOW+7*86400000).quests.length,0);
});
