// Local check helper: fills a running dev API (npm run dev:server:memory) with three players, a weekly board and one
// friendship, so the leaderboard and friend visits can be tried in the browser as player "dev-viewer".
//   node --import ./tests/register.mjs scripts/dev-seed-board.mjs [api=http://localhost:3000]
import { dailyLessonsFor } from '../src/domain/dailyLessons.ts';
import { calendarDate } from '../src/domain/economy.ts';

const API = process.argv[2] ?? 'http://localhost:3000';
const call = async (player, path, body = {}) => (await fetch(`${API}${path}`, { method: 'POST', headers: { 'Content-Type': 'application/json', 'X-Dev-Player': player }, body: JSON.stringify(body) })).json();
const id = () => `seed-${Math.random().toString(36).slice(2, 12)}`;

const ana = await call('dev-ana', '/api/session');
const ben = await call('dev-ben', '/api/session');
const viewer = await call('dev-viewer', '/api/session');
const lessons = dailyLessonsFor(calendarDate(new Date()));
for (const [who, count] of [['dev-ana', 3], ['dev-ben', 2]]) {
  for (const lesson of lessons.slice(0, count)) await call(who, '/api/action', { requestId: id(), action: { type: 'completeDailyLesson', lessonId: lesson.id, answer: lesson.answer } });
}
console.log('add friend', (await call('dev-viewer', '/api/friends/add', { code: ana.player.friendCode })).message);
console.log('accept', (await call('dev-ana', '/api/friends/answer', { code: viewer.player.friendCode, accept: true })).message);
console.log('board', JSON.stringify((await call('dev-viewer', '/api/leaderboard', { scope: 'global' })).top));
void ben;
