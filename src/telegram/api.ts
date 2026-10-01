import type { GameAction } from '../sim/rules';
import type { PlayerState } from '../sim/state';

// Talks to the game server. Telegram's signed init data proves who the player is; in local development
// (vite dev + server with ALLOW_DEV_LOGIN=true) a per-browser dev id is used instead.

export interface ServerResult { ok: boolean; state?: PlayerState; serverTime?: number; message?: string; error?: string; }
export interface SessionResult { ok: true; player: { id: number; name: string; friendCode: string }; state: PlayerState; starterPackAvailable?: boolean; received?: string[]; serverTime: number; }
export interface FriendSummary { id:number; code:string; nickname:string; customName:string; status:'pending'|'accepted'; direction:'incoming'|'outgoing'; level:number; prestige:number; barName:string; visitedToday:boolean }
export interface FriendBar { id:number; code:string; nickname:string; customName:string; name:string; level:number; prestige:number; regionId:string; bar:Record<string,any>; recipes:number; interiors:number; mastered:{name:string;level:number}[] }
export interface SocialResult { ok:boolean; error?:string; message?:string; state?:PlayerState; serverTime?:number; friendCode?:string; prestige?:number; pendingGifts?:number; received?:string[]; friends?:FriendSummary[]; friend?:FriendBar; rewarded?:boolean }

function authHeaders(): Record<string, string> {
  const initData = window.Telegram?.WebApp?.initData;
  if (initData) return { Authorization: `tma ${initData}` };
  if (import.meta.env?.DEV) {
    let id = '';
    try {
      id = localStorage.getItem('barlingo-dev-player') ?? '';
      if (!id) { id = `dev-${crypto.randomUUID().slice(0, 8)}`; localStorage.setItem('barlingo-dev-player', id); }
    } catch { id = 'dev-local'; }
    return { 'X-Dev-Player': id };
  }
  return {};
}

async function post<T>(path: string, body: unknown): Promise<T> {
  const response = await fetch(path, { method: 'POST', headers: { 'Content-Type': 'application/json', ...authHeaders() }, body: JSON.stringify(body ?? {}) });
  const data = await response.json().catch(() => ({}));
  // 409 = the rules refused the action; the body still carries the authoritative state.
  if (!response.ok && response.status !== 409) throw new Error(data?.error ?? `HTTP ${response.status}`);
  return data as T;
}

export function connectSession() {
  return post<SessionResult>('/api/session', {});
}

export const createStarInvoice = (packId: string) => post<{ ok: boolean; url?: string; error?: string }>('/api/stars/invoice', { packId });

export const fetchFriends = () => post<SocialResult>('/api/friends', {});
export const requestFriend = (code:string) => post<SocialResult>('/api/friends/add', { code });
export const answerFriendRequest = (code:string, accept:boolean) => post<SocialResult>('/api/friends/answer', { code, accept });
export const removeFriendLink = (code:string) => post<SocialResult>('/api/friends/remove', { code });
export const claimFriendGifts = () => post<SocialResult>('/api/friends/claim', {});
export const saveFriendLabel = (code:string, label:string) => post<SocialResult>('/api/friends/label', { code, label });
export const visitFriendBar = (code:string) => post<SocialResult>('/api/friends/visit', { code });
export const sendFriendGift = (code:string, gift:unknown) => post<SocialResult>('/api/friends/gift', { code, gift });

// Actions go one at a time, in order, each with its own id (a retry of the same id is never applied twice).
let queue: Promise<unknown> = Promise.resolve();
export function sendAction(action: GameAction): Promise<ServerResult> {
  const requestId = crypto.randomUUID();
  const run = queue.then(() => post<ServerResult>('/api/action', { requestId, action }));
  queue = run.catch(() => undefined);
  return run;
}
