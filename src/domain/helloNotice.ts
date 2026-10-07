// The hello popup: staff-written notices shown when the game opens. A player can tick "don't show me this again
// today"; that choice lives on the device, keyed by the notice and its last edit, so an edited notice shows again.
export interface HelloNotice { id: number; title: string; body: string; updatedAt: number; }
export type DismissMap = Record<string, string>;   // notice key → the calendar day it was dismissed for

export const noticeKey = (notice: Pick<HelloNotice, 'id' | 'updatedAt'>) => `${notice.id}:${notice.updatedAt}`;

export function visibleNotices(notices: readonly HelloNotice[], dismissed: DismissMap, today: string) {
  return notices.filter((notice) => dismissed[noticeKey(notice)] !== today);
}
// Returns the new map; entries for earlier days are dropped so the stored list never grows.
export function dismissForToday(dismissed: DismissMap, notice: Pick<HelloNotice, 'id' | 'updatedAt'>, today: string): DismissMap {
  const next: DismissMap = {};
  for (const [key, day] of Object.entries(dismissed)) if (day === today) next[key] = day;
  next[noticeKey(notice)] = today;
  return next;
}
export function readDismissed(raw: string | null): DismissMap {
  try {
    const parsed = JSON.parse(raw ?? '{}');
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) return {};
    return Object.fromEntries(Object.entries(parsed).filter(([, day]) => typeof day === 'string')) as DismissMap;
  } catch { return {}; }
}
