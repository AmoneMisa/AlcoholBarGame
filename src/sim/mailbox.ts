import type { PlayerState } from './state';
import type { RewardLine } from '../domain/rewards';

export interface MailEntry {
  id: string; at: number; expiresAt?:number; kind: 'visit' | 'theft' | 'gift' | 'reward' | 'system'; direction: 'incoming' | 'outgoing';
  actorId: number; actorName: string; text: string; title?: string; amount?: number; giftId?: number;
  status?: 'pending' | 'accepted' | 'declined' | 'returned'; readAt?: number;
  reward?: unknown;
  attachments?: RewardLine[];
}
export const MAIL_DAY_MS=86400000;
export const MAIL_LIFETIME={visit:7*MAIL_DAY_MS,theft:7*MAIL_DAY_MS,gift:14*MAIL_DAY_MS,reward:180*MAIL_DAY_MS,system:30*MAIL_DAY_MS};
export function addMail(state: PlayerState, entry: MailEntry) {
  entry.expiresAt ??= entry.at+MAIL_LIFETIME[entry.kind];
  state.mailbox ??= [];
  const existing=state.mailbox.find(item=>item.id===entry.id);
  if (!existing) state.mailbox.unshift(entry);
  else if (!existing.attachments && entry.attachments) existing.attachments=entry.attachments;
}
export function pruneMail(state:PlayerState,now:number) {
  state.mailbox=(state.mailbox ?? []).filter(item=>{
    item.expiresAt ??= item.at+MAIL_LIFETIME[item.kind];
    return item.expiresAt>now || (item.kind==='gift' && item.status==='pending');
  });
}
