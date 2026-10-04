import { reactive, ref, watch } from 'vue';
import { defineStore } from 'pinia';
import { post } from '../telegram/api';

export type NotificationEvent = 'dailyLesson'|'dailyReward'|'friendVisit'|'reward'|'customer'|'friendRequest'|'loot'|'leaderboard';
export const NOTIFICATION_EVENTS: { id:NotificationEvent; label:string; detail:string }[] = [
  { id:'dailyLesson',label:'Daily lesson',detail:'Remind me to complete today’s English quests.' },
  { id:'dailyReward',label:'Daily reward',detail:'Tell me when the login reward is ready.' },
  { id:'friendVisit',label:'Friend visit',detail:'Tell me when a friend visits and gives prestige.' },
  { id:'reward',label:'Rewards and gifts',detail:'Show rewards, gifts and successful claims.' },
  { id:'customer',label:'New customer',detail:'Tell me when a new guest reaches the bar.' },
  { id:'friendRequest',label:'Friend request',detail:'Tell me about a new request to accept or decline.' },
  { id:'loot',label:'Boxes and boosters',detail:'Tell me when I get a box or a booster runs out.' },
  { id:'leaderboard',label:'Weekly leaderboard',detail:'Tell me when a week ends and my leaderboard reward is ready.' }
];
const KEY = 'barlingo.notifications';

export const useNotificationsStore = defineStore('notifications', () => {
  const defaults = Object.fromEntries(NOTIFICATION_EVENTS.map((item) => [item.id,true])) as Record<NotificationEvent,boolean>;
  let saved: { prefs?:Partial<Record<NotificationEvent,boolean>>; seen?:Record<string,number> } = {};
  try { saved = JSON.parse(localStorage.getItem(KEY) ?? '{}'); } catch { /* private mode */ }
  const prefs = reactive({ ...defaults, ...(saved.prefs ?? {}) });
  const seen = reactive<Record<string,number>>(saved.seen ?? {});
  const items = ref<{ id:string; type:NotificationEvent; title:string; text:string }[]>([]);
  const telegramEnabled = ref(false), telegramBusy = ref(false), telegramMessage = ref('');
  const signed = () => !!window.Telegram?.WebApp?.initData;
  async function syncTelegram(save = false, hydrate = true) {
    if (!signed()) return;
    try {
      const result = await post<{ok:boolean;enabled:boolean;prefs?:Record<NotificationEvent,boolean>;error?:string}>('/api/notifications',save ? {prefs:{...prefs}} : {});
      if (!result.ok) throw new Error(result.error || 'Could not save notifications.');
      telegramEnabled.value=result.enabled;
      if (!save && hydrate && result.prefs) Object.assign(prefs,result.prefs);
    } catch(error) { telegramMessage.value=(error as Error).message; }
  }
  async function enableTelegram() {
    if (telegramBusy.value) return;
    const request=window.Telegram?.WebApp?.requestWriteAccess;
    if (!signed() || !request) { telegramMessage.value='Open the game in an updated Telegram app to enable messages.';return; }
    telegramBusy.value=true;telegramMessage.value='';
    try {
      const allowed=await new Promise<boolean>(resolve=>window.Telegram!.WebApp!.requestWriteAccess!(resolve));
      if (!allowed) { telegramMessage.value='Telegram messages were not enabled.';return; }
      const result=await post<{ok:boolean;enabled:boolean;error?:string}>('/api/notifications',{enabled:true,prefs:{...prefs}});
      if (!result.ok) throw new Error(result.error || 'Could not enable notifications.');
      telegramEnabled.value=result.enabled;
    } catch(error) { telegramMessage.value=(error as Error).message; }
    finally { telegramBusy.value=false; }
  }
  async function disableTelegram() {
    telegramBusy.value=true;
    try {
      const result=await post<{ok:boolean;enabled:boolean;error?:string}>('/api/notifications',{enabled:false,prefs:{...prefs}});
      if (!result.ok) throw new Error(result.error || 'Could not disable notifications.');
      telegramEnabled.value=result.enabled;
    } catch(error) { telegramMessage.value=(error as Error).message; }
    finally {telegramBusy.value=false;}
  }
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
  let preferenceQueue: Promise<void> = Promise.resolve();
  function setEnabled(type:NotificationEvent,enabled:boolean) {
    prefs[type] = enabled;
    preferenceQueue=preferenceQueue.then(()=>syncTelegram(true));
  }
  return { prefs, items, push, dismiss, setEnabled, syncTelegram, enableTelegram, disableTelegram, telegramEnabled, telegramBusy, telegramMessage };
});
