<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue';
import UiInput from '../ui/UiInput.vue';
import OptionSelect from '../game/OptionSelect.vue';
import { post } from '../../telegram/api';
import CatalogPicker from './CatalogPicker.vue';
import UiCheckbox from '../ui/UiCheckbox.vue';
import { mailPieces } from '../../domain/mailText';
const props=defineProps<{role:'owner'|'admin'|'moderator'}>();
const elevated=computed(()=>props.role!=='moderator');
const tabs=computed(()=>elevated.value ? [['users','Players'],['staff','Staff roles'],['promos','Promo codes'],['messages','System mail'],['tickets','Tickets'],['logs','Event log']] : [['users','Players']]);
const changeOptions=computed(()=> (elevated.value ? ['coins','crystals','xp','parts',...Object.keys(catalog.value),'block','unblock'] : ['block','unblock']).map(value=>({value,label:value})));
const staff=ref<any[]>([]),assignment=reactive({telegramId:'',role:'moderator',reason:''});
const tab=ref('users'), busy=ref(false), feedback=ref('');
const catalog=ref<Record<string,{id:string;label:string;group?:string;character?:string}[]>>({}), promos=ref<any[]>([]), events=ref<any[]>([]), tickets=ref<any[]>([]), player=ref<any>(null);
const user=reactive({telegramId:'',kind:props.role==='moderator' ? 'block' : 'coins',id:'',delta:1,reason:''});
const promo=reactive({code:'',startsAt:'',expiresAt:'',noExpiry:false,maxUses:'',rewards:[{kind:'coins',id:'',amount:100}]});
const expiryEdits=reactive<Record<string,{noExpiry:boolean;expiresAt:string}>>({});
const message=reactive({telegramId:'',title:'',body:'',days:30,everyone:true,confirmAll:false}), sentMessages=ref<any[]>([]), previewing=ref(false);
const filter=reactive({telegramId:'',event:''});
const singles=['style','background','companion'];
async function run(task:()=>Promise<void>) { if(busy.value) return; busy.value=true; feedback.value=''; try { await task(); } catch(e) { feedback.value=(e as Error).message; } finally {busy.value=false;} }
async function api(path:string,body:unknown={}) {const result=await post<any>('/api/admin/'+path,body); if(!result.ok) throw new Error(result.error || 'Operation failed'); return result;}
async function saveRole() { if(!confirm('Change staff role for Telegram ID '+assignment.telegramId+'?')) return; await api('staff/role',assignment); staff.value=(await api('staff/list')).staff; feedback.value='Role saved.'; }
async function loadPlayer() { player.value=await api('player',{telegramId:user.telegramId}); }
async function change() { if(!confirm(`Apply ${user.kind} ${user.delta} to Telegram ID ${user.telegramId}?\nReason: ${user.reason}`)) return; await api('player/change',{...user,requestId:crypto.randomUUID()}); await loadPlayer(); feedback.value='Change saved.'; }
async function loadPromos() {promos.value=(await api('promocodes/list')).promos;for(const p of promos.value){const date=p.expiresAt ? new Date(p.expiresAt) : undefined;expiryEdits[p.code]={noExpiry:p.expiresAt===null,expiresAt:date ? new Date(date.getTime()-date.getTimezoneOffset()*60000).toISOString().slice(0,16) : ''};}}
async function createPromo() { await api('promocodes',{...promo,startsAt:new Date(promo.startsAt).toISOString(),expiresAt:promo.noExpiry ? null : new Date(promo.expiresAt).toISOString(),maxUses:promo.maxUses==='' ? null : Number(promo.maxUses),rewards:promo.rewards.map(r=>({kind:r.kind,...(catalog.value[r.kind] ? {id:r.id}:{}),...(!singles.includes(r.kind) ? {amount:r.amount}:{})}))}); await loadPromos(); feedback.value='Promo code created.'; }
async function saveExpiry(code:string) {const edit=expiryEdits[code]!;await api('promocodes/expiry',{code,expiresAt:edit.noExpiry ? null : new Date(edit.expiresAt).toISOString()});await loadPromos();feedback.value='Expiration saved.';}
async function removePromo(code:string) {if(!confirm(`Disable promo code ${code}?`)) return; await api('promocodes/delete',{code}); await loadPromos();}
async function loadMessages() { sentMessages.value=(await api('messages/list')).messages; }
async function sendMessage() {
  const target=message.everyone ? 'EVERY player' : 'Telegram ID '+message.telegramId;
  if(!confirm(`Send "${message.title}" to ${target}?`)) return;
  await api('messages/send',{title:message.title,body:message.body,days:message.days,...(message.everyone ? {confirmAll:true} : {telegramId:message.telegramId})});
  message.title='';message.body='';message.confirmAll=false;await loadMessages();feedback.value='Message sent to Mail.';
}
async function loadEvents(more=false) { const batch=(await api('events',{...filter,...(more ? {before:events.value.at(-1)?.id}:{})})).events; events.value=more ? [...events.value,...batch] : batch; }
async function loadTickets(more=false) {const batch=(await api('tickets',more ? {before:tickets.value.at(-1)?.id}:{})).tickets; tickets.value=more ? [...tickets.value,...batch]:batch;}
async function choose(value:string) {tab.value=value; await run(async()=>{if(value==='staff') staff.value=(await api('staff/list')).staff; if(value==='promos') await loadPromos(); if(value==='messages') await loadMessages(); if(value==='logs') await loadEvents(); if(value==='tickets') await loadTickets();});}
const time=(value:any)=>value ? new Date(value).toLocaleString() : '—';
onMounted(()=>run(async()=> {if(elevated.value) catalog.value=(await api('catalog')).catalog; const now=new Date(); now.setMinutes(now.getMinutes()-now.getTimezoneOffset()); promo.startsAt=now.toISOString().slice(0,16); now.setDate(now.getDate()+7); promo.expiresAt=now.toISOString().slice(0,16);}));
</script>
<template>
  <main class="admin-page">
    <h1>BarLingo · Administration</h1><p>Role: {{ props.role }}</p>
    <nav><button v-for="entry in tabs" :key="entry[0]" :aria-pressed="tab===entry[0]" :disabled="busy" @click="choose(entry[0]!)">{{ entry[1] }}</button></nav>
    <p role="status">{{ busy ? 'Working…' : feedback }}</p>
    <section v-if="tab==='users'">
      <form @submit.prevent="run(loadPlayer)"><label>Telegram ID<UiInput v-model="user.telegramId" required inputmode="numeric" pattern="[0-9]+" /></label><button :disabled="busy">Find player</button></form>
      <template v-if="player"><h2>{{ player.player.name }} · {{ player.player.telegramId }}</h2><p>{{ player.player.blocked ? 'Blocked: '+player.player.blockReason : 'Active' }}</p><p v-if="elevated">Coins: {{ player.state?.money }} · Crystals: {{ player.state?.crystals }} · XP: {{ player.state?.xp }}</p>
        <form @submit.prevent="run(change)">
          <OptionSelect label="Change" v-model="user.kind" :options="changeOptions" @update:model-value="user.id=''" />
          <CatalogPicker v-if="catalog[user.kind]" :key="user.kind" v-model="user.id" :items="catalog[user.kind]!" />
          <label v-if="!['block','unblock'].includes(user.kind)">Amount (+ add / − remove)<input v-model.number="user.delta" type="number" required step="1" min="-1000000" max="1000000" /></label>
          <small v-if="user.kind==='ingredient'">Ingredient stock in the player's current bar.</small>
          <label>Reason<textarea v-model="user.reason" required minlength="3" maxlength="500" /></label><button :disabled="busy">Apply change…</button>
        </form><details v-if="elevated"><summary>Inventory and game state</summary><pre>{{ JSON.stringify(player.state,null,2) }}</pre></details>
      </template>
    </section>
    <section v-if="tab==='staff' && elevated">
      <h2>Staff roles</h2><p>{{ props.role==='owner' ? 'You can assign administrators and moderators.' : 'You can assign and remove moderators.' }} Roles are checked on the server for every request.</p>
      <form @submit.prevent="run(saveRole)">
        <label>Telegram ID<UiInput v-model="assignment.telegramId" required pattern="[1-9][0-9]{0,15}" inputmode="numeric" /></label>
        <OptionSelect label="Role" v-model="assignment.role" :options="(props.role==='owner' ? ['moderator','admin','none'] : ['moderator','none']).map(value=>({value,label:value==='none' ? 'Remove access' : value}))" />
        <label>Reason<textarea v-model="assignment.reason" required minlength="3" maxlength="500" /></label><button :disabled="busy">Save role…</button>
      </form><article v-for="person in staff" :key="person.telegramId"><b>{{ person.telegramId }} · {{ person.role }}</b></article>
    </section>
    <section v-if="tab==='promos' && elevated">
      <h2>Create promo code</h2><form @submit.prevent="run(createPromo)">
        <label>Code<UiInput v-model="promo.code" required pattern="[A-Za-z0-9_-]{3,40}" maxlength="40" /></label>
        <label>Starts (your local time)<UiInput v-model="promo.startsAt" type="datetime-local" required /></label>
        <UiCheckbox v-model="promo.noExpiry" label="No expiration" /><label v-if="!promo.noExpiry">Expires (your local time)<UiInput v-model="promo.expiresAt" type="datetime-local" required /></label>
        <label>Maximum players (empty = unlimited)<input v-model="promo.maxUses" type="number" min="1" max="1000000000" step="1" /></label><p>Each player may redeem a code once. Rewards go to Mail.</p>
        <fieldset v-for="(reward,index) in promo.rewards" :key="index"><legend>Reward {{ Number(index)+1 }}</legend>
          <OptionSelect label="Type" v-model="reward.kind" :options="['coins','crystals','parts',...Object.keys(catalog).filter(k=>k!=='ingredient')].map(value=>({value,label:value}))" @update:model-value="reward.id=''" />
          <CatalogPicker v-if="catalog[reward.kind]" :key="reward.kind" v-model="reward.id" :items="catalog[reward.kind]!" />
          <label v-if="!singles.includes(reward.kind)">Quantity<input v-model.number="reward.amount" type="number" required min="1" max="1000000" step="1" /></label><button type="button" :disabled="promo.rewards.length===1" @click="promo.rewards.splice(index,1)">Remove reward</button>
        </fieldset><button type="button" :disabled="promo.rewards.length>=30" @click="promo.rewards.push({kind:'coins',id:'',amount:100})">Add reward</button><button :disabled="busy">Create code</button>
      </form>
      <article v-for="p in promos" :key="p.code"><h3>{{ p.code }} {{ p.deletedAt ? '(disabled)' : '' }}</h3><p>{{ time(p.startsAt) }} → {{ p.expiresAt === null ? 'No expiration' : time(p.expiresAt) }} · {{ p.uses }} / {{ p.maxUses ?? 'Unlimited' }} players</p><pre>{{ JSON.stringify(p.rewards,null,2) }}</pre>
        <form v-if="!p.deletedAt && expiryEdits[p.code]" @submit.prevent="run(()=>saveExpiry(p.code))"><UiCheckbox v-model="expiryEdits[p.code]!.noExpiry" label="No expiration" /><UiInput v-if="!expiryEdits[p.code]!.noExpiry" v-model="expiryEdits[p.code]!.expiresAt" label="Expires (your local time)" type="datetime-local" required /><button :disabled="busy">Save expiration</button></form>
        <button :disabled="busy || !!p.deletedAt" @click="run(()=>removePromo(p.code))">Disable…</button></article>
    </section>
    <section v-if="tab==='messages' && elevated">
      <h2>System mail</h2><p>Messages appear in the player's Mailbox under System as “BarLingo” and stay for the chosen number of days. Players receive them the next time they open the game or Mail.</p>
      <form @submit.prevent="run(sendMessage)">
        <UiCheckbox v-model="message.everyone" label="Send to every player" />
        <label v-if="!message.everyone">Telegram ID<UiInput v-model="message.telegramId" required inputmode="numeric" pattern="[0-9]+" /></label>
        <label>Title<UiInput v-model="message.title" required minlength="3" maxlength="80" /></label>
        <label>Message<textarea v-model="message.body" required minlength="3" maxlength="2000" rows="6" /></label><small>Line breaks are kept. Use **bold** for bold text and `code` for text players can tap to copy (promo codes, IDs).</small>
        <label>Keep for (days, 1–30)<input v-model.number="message.days" type="number" required min="1" max="30" step="1" /></label>
        <button type="button" :aria-pressed="previewing" @click="previewing=!previewing">{{ previewing ? 'Hide preview' : 'Preview' }}</button><button :disabled="busy">Send message…</button>
      </form>
      <article v-if="previewing" class="mail-preview" aria-label="Message preview"><small>Preview · how it looks in the player's Mailbox</small><h3>{{ message.title || 'Message from BarLingo' }}</h3><p class="mail-preview-from">BarLingo · {{ message.everyone ? 'to every player' : 'to Telegram ID ' + (message.telegramId || '…') }} · kept {{ message.days }} day(s)</p><p class="mail-preview-body"><template v-for="(piece,index) in mailPieces(message.body || 'Your message appears here.')" :key="index"><b v-if="piece.kind==='bold'">{{ piece.text }}</b><code v-else-if="piece.kind==='code'">{{ piece.text }}</code><template v-else>{{ piece.text }}</template></template></p></article>
      <article v-for="item in sentMessages" :key="item.id"><h3>#{{ item.id }} · {{ item.title }}</h3><p>To: {{ item.targetTelegramId ?? 'Everyone' }} · sent {{ time(item.createdAt) }} · expires {{ time(item.expiresAt) }}</p><p class="description">{{ item.body }}</p></article>
    </section>
    <section v-if="tab==='logs' && elevated">
      <h2>Events · last 14 days</h2><form @submit.prevent="run(()=>loadEvents())"><label>Telegram ID<UiInput v-model="filter.telegramId" inputmode="numeric" pattern="[0-9]*" /></label><label>Event type<UiInput v-model="filter.event" placeholder="game.action.refused" /></label><button :disabled="busy">Filter / refresh</button></form>
      <article v-for="event in events" :key="event.id"><b>#{{ event.id }} · {{ time(event.createdAt) }} · {{ event.telegramId ?? 'Unauthenticated' }} · {{ event.event }}</b><pre>{{ JSON.stringify(event.detail,null,2) }}</pre></article><button :disabled="busy || !events.length" @click="run(()=>loadEvents(true))">Load older</button>
    </section>
    <section v-if="tab==='tickets' && elevated"><h2>Support tickets</h2><button :disabled="busy" @click="run(()=>loadTickets())">Refresh</button>
      <article v-for="ticket in tickets" :key="ticket.id"><h3>#{{ ticket.id }} · {{ ticket.title }} · {{ ticket.status }}</h3><p>Telegram ID {{ ticket.telegramId }} · {{ ticket.name }} · submitted {{ time(ticket.created_at) }}</p><p>Event: {{ time(ticket.occurred_at ?? ticket.occurredAt) }}</p><p class="description">{{ ticket.description }}</p><a v-for="(shot,index) in ticket.screenshots" :key="index" :href="shot" :download="`ticket-${ticket.id}-${index}.png`"><img :src="shot" :alt="`Screenshot ${Number(index)+1}`" /></a><button v-if="ticket.status==='open'" :disabled="busy" @click="run(async()=>{await api('tickets/close',{id:ticket.id}); ticket.status='closed';})">Close ticket</button></article>
      <button :disabled="busy || !tickets.length" @click="run(()=>loadTickets(true))">Load older</button>
    </section>
  </main>
</template>
<style>
.admin-page{max-width:1000px;margin:auto;padding:24px;font:16px system-ui;color:#e8edf6;background:#111c2d;min-height:100vh;box-sizing:border-box}.admin-page *{box-sizing:border-box}.admin-page nav,.admin-page form{display:flex;flex-wrap:wrap;gap:12px;margin:16px 0;align-items:end}.admin-page label{display:grid;gap:6px;max-width:100%;flex:1 1 220px}.admin-page input,.admin-page select,.admin-page textarea,.admin-page button{font:inherit;padding:10px;border:1px solid #63738e;border-radius:8px;min-width:0;max-width:100%}.admin-page input,.admin-page select,.admin-page textarea{color:#eef;background:#19273c}.admin-page button{cursor:pointer;background:#ecc47b;color:#161b24}.admin-page button:disabled{opacity:.5;cursor:default}.admin-page [aria-pressed=true]{outline:2px solid white}.admin-page textarea{min-height:100px}.admin-page article,.admin-page fieldset{width:100%;padding:16px;border:1px solid #475874;border-radius:12px;margin:12px 0}.admin-page pre{white-space:pre-wrap;overflow-wrap:anywhere;max-height:400px;overflow:auto;font-size:13px}.admin-page .description{white-space:pre-wrap}.admin-page img{max-width:240px;max-height:240px;object-fit:contain;margin:8px}.admin-page p{overflow-wrap:anywhere}
.admin-page .mail-preview{display:block;flex:1 1 100%;padding:14px;border:1px dashed #6f8a95;border-radius:10px;background:#0b1522}.admin-page .mail-preview-from{opacity:.7;font-size:13px}.admin-page .mail-preview-body{white-space:pre-wrap;overflow-wrap:anywhere;line-height:1.6}.admin-page .mail-preview code{padding:1px 7px;border:1px solid #6f8a95;border-radius:6px;background:#06101a;color:#ffe39a;font:13px ui-monospace,Consolas,monospace}
</style>
