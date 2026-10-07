import test from 'node:test';
import assert from 'node:assert/strict';
import { dismissForToday, noticeKey, readDismissed, visibleNotices } from '../src/domain/helloNotice.ts';

const notice = (id, updatedAt = 1) => ({ id, title: `Notice ${id}`, body: 'Hello', updatedAt });

test('A notice dismissed for today stays hidden today, returns tomorrow, and returns after staff edit it', () => {
  const notices = [notice(1), notice(2)];
  assert.equal(visibleNotices(notices, {}, '2026-10-07').length, 2, 'without the checkbox nothing is hidden');
  const dismissed = dismissForToday({}, notices[0], '2026-10-07');
  assert.deepEqual(visibleNotices(notices, dismissed, '2026-10-07').map((item) => item.id), [2]);
  assert.equal(visibleNotices(notices, dismissed, '2026-10-08').length, 2, 'it comes back the next day');
  assert.equal(visibleNotices([notice(1, 2), notices[1]], dismissed, '2026-10-07').length, 2, 'an edited notice (new updatedAt) shows again');
});

test('The stored dismissal list never grows: earlier days are dropped, bad data is ignored', () => {
  const old = { [noticeKey(notice(1))]: '2026-10-06', [noticeKey(notice(2))]: '2026-10-07' };
  const next = dismissForToday(old, notice(3), '2026-10-07');
  assert.deepEqual(Object.keys(next).sort(), [noticeKey(notice(2)), noticeKey(notice(3))].sort());
  assert.deepEqual(readDismissed('not json'), {});
  assert.deepEqual(readDismissed('[1,2]'), {});
  assert.deepEqual(readDismissed(null), {});
  assert.deepEqual(readDismissed(JSON.stringify({ a: '2026-10-07', b: 5 })), { a: '2026-10-07' });
});
