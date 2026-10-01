import { reactive, ref, watch } from 'vue';
import { defineStore } from 'pinia';

export type NotificationEvent = 'dailyLesson'|'dailyReward'|'friendVisit'|'reward'|'customer'|'friendRequest';
export const NOTIFICATION_EVENTS: { id:NotificationEvent; label:string; detail:string }[] = [
  { id:'dailyLesson',label:'Daily lesson',detail:'Remind me to complete today’s English quests.' },
  { id:'dailyReward',label:'Daily reward',detail:'Tell me when the login reward is ready.' },
  { id:'friendVisit',label:'Friend visit',detail:'Tell me when a friend visits and gives prestige.' },
  { id:'reward',label:'Rewards and gifts',detail:'Show rewards, gifts and successful claims.' },
  { id:'customer',label:'New customer',detail:'Tell me when a new guest reaches the bar.' },
  { id:'friendRequest',label:'Friend request',detail:'Tell me about a new request to accept or decline.' }
];
const KEY = 'barlingo.notifications';

export const useNotificationsStore = defineStore('notifications', () => {
  const defaults = Object.fromEntries(NOTIFICATION_EVENTS.map((item) => [item.id,true])) as Record<NotificationEvent,boolean>;
  let saved: { prefs?:Partial<Record<NotificationEvent,boolean>>; seen?:Record<string,number> } = {};
  try { saved = JSON.parse(localStorage.getItem(KEY) ?? '{}'); } catch { /* private mode */ }
  const prefs = reactive({ ...defaults, ...(saved.prefs ?? {}) });
  const seen = reactive<Record<string,number>>(saved.seen ?? {});
  const items = ref<{ id:string; type:NotificationEvent; title:string; text:string }[]>([]);
  watch([prefs,seen],() => {
    try { localStorage.setItem(KEY,JSON.stringify({prefs:{...prefs},seen:{...seen}})); } catch { /* private mode */ }
  },{deep:true});
  function push(type:NotificationEvent,title:string,text:string,key?:string) {
    if (!prefs[type]) return false;
    if (key && seen[key]) return false;
    if (key) seen[key] = Date.now();
    const id = crypto.randomUUID();
    items.value.push({id,type,title,text});
    window.setTimeout(() => dismiss(id),6500);
    return true;
  }
  function dismiss(id:string) { items.value = items.value.filter((item) => item.id !== id); }
  function setEnabled(type:NotificationEvent,enabled:boolean) { prefs[type] = enabled; }
  return { prefs, items, push, dismiss, setEnabled };
});
