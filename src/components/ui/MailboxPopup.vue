<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import UiIcon from './UiIcon.vue';
import { useGameStore } from '../../stores/game';
import type { MailEntry } from '../../sim/mailbox';
import { rewardAttachments } from '../../domain/mailAttachments';
import ModalDialog from './ModalDialog.vue';
import UiButton from './UiButton.vue';
import SectionTabs from './SectionTabs.vue';
import RewardArt from './RewardArt.vue';
const game=useGameStore();
const filter=ref('all');
const selectedId=ref<string>();
const matches=(item:MailEntry,id:string)=>id==='all'||(id==='reports'?(item.kind==='visit'||item.kind==='theft'):id==='gifts'?item.kind==='gift':(item.kind==='reward'||item.kind==='system'));
const entries=computed(()=>game.mailboxEntries.filter(item=>matches(item,filter.value)).slice().sort((a,b)=>b.at-a.at));
const tabs=computed(()=>[{id:'all',label:'All'},{id:'reports',label:'Reports'},{id:'system',label:'System'},{id:'gifts',label:'Gifts'}].map(tab=>({...tab,badge:game.mailboxEntries.filter(item=>matches(item,tab.id)&&!item.readAt).length})));
watch(filter,()=>{selectedId.value=undefined;});
const selected=computed(()=>entries.value.find(item=>item.id===selectedId.value));
const pending=computed(()=>game.mailboxEntries.filter(item=>item.kind==='reward'&&item.status==='pending'));
const icon=(item:MailEntry)=>item.kind==='system'?'mail':item.kind==='reward'?'gift':item.kind==='gift'?'friends':item.kind==='theft'?'alert':'glass';
const date=(at:number)=>new Date(at).toLocaleString('en-GB',{timeZone:'Europe/Moscow',dateStyle:'medium',timeStyle:'short'});
const title=(item:MailEntry)=>item.kind==='system'?(item.title||'Message from BarLingo'):item.kind==='visit'?'Bar visit':item.kind==='theft'?(item.direction==='incoming'?'Your tips were stolen':'Tip jar raid'):item.kind==='reward'?(item.id.startsWith('promo:')?`Promo code ${item.id.slice(6)}`:'Event rewards'):item.status==='returned'?'Gift returned':item.direction==='incoming'?'Gift received':'Gift sent';
const status=(item:MailEntry)=>item.status==='pending'?(item.kind==='reward'?'Ready to claim':'Awaiting a decision'):item.status==='accepted'?(item.kind==='reward'?'Claimed':'Accepted'):item.status==='returned'?'Returned to sender':item.status==='declined'?'Declined · returned to sender':'';
const body=(item:MailEntry)=>item.kind==='theft'?(item.direction==='incoming'?`At ${date(item.at)} MSK, player ${item.actorName} stole ${Math.round(item.amount??0)} coins from your tip jar!`:`At ${date(item.at)} MSK, you stole ${Math.round(item.amount??0)} coins from player ${item.actorName}'s tip jar!`):item.text;
const attachments=computed(()=>selected.value?.attachments ?? rewardAttachments(selected.value?.reward));
async function open(item:MailEntry){selectedId.value=item.id;if(!item.readAt && game.mode==='online') await game.loadMailbox([item.id]);}
</script>
<template>
  <ModalDialog title="Mailbox" eyebrow="POST BOX" width="1000px" @close="game.mailboxOpen=false">
    <SectionTabs v-model="filter" class="mail-tabs" label="Mail categories" :tabs="tabs" />
    <p v-if="game.mailMessage && !game.mailMessage.startsWith('Claimed rewards:')" role="status">{{ game.mailMessage }}</p>
    <div class="mail-workspace" :class="{reading:selected}">
      <aside class="mail-inbox" aria-label="Messages"><p v-if="!entries.length" class="mail-empty">No messages here yet.</p>
      <ul class="mail-list"><li v-for="item in entries" :key="item.id"><button class="mail-row" :class="{unread:!item.readAt,active:selected?.id===item.id}" :aria-pressed="selected?.id===item.id" @click="open(item)"><span class="mail-emblem"><UiIcon :name="icon(item)" /></span><span class="mail-row-copy"><b>{{ title(item) }}</b><span>{{ item.actorName }}</span><time>{{ date(item.at) }} MSK</time></span><i v-if="!item.readAt" class="mail-unread" aria-label="Unread" /></button></li></ul></aside>
      <article class="mail-letter" aria-label="Message contents"><template v-if="selected">
      <UiButton class="mail-back" size="sm" variant="secondary" @click="selectedId=undefined">‹ Back to mail</UiButton>
      <header class="mail-letter-head"><span class="mail-emblem"><UiIcon :name="icon(selected)" /></span><h2>{{ title(selected) }}</h2></header>
      <div class="mail-sender"><b>{{ selected.actorName }}</b><time :datetime="new Date(selected.at).toISOString()">{{ date(selected.at) }} MSK</time></div>
      <p class="mail-body">{{ body(selected) }}</p>
      <section v-if="attachments.length" class="mail-attachments" aria-label="Mail attachments">
        <h3>Attachments</h3>
        <ul><li v-for="(line,index) in attachments" :key="index"><div class="attachment-art"><RewardArt :line="line" /></div><span>{{ line.text }}</span></li></ul>
      </section>
      <p v-if="selected.status" class="mail-status">{{ status(selected) }}</p>
      <small v-if="selected.expiresAt">Expires {{ date(selected.expiresAt) }} MSK</small>
      <div v-if="selected.kind==='reward' && selected.status==='pending'" class="mail-tools"><UiButton :disabled="game.mailBusy || game.mode!=='online'" @click="game.collectMailReward(selected.id)">Claim rewards</UiButton></div>
      <div v-if="selected.kind==='gift' && selected.direction==='incoming' && selected.status==='pending' && selected.giftId" class="mail-tools"><UiButton :disabled="game.mailBusy || game.mode!=='online'" @click="game.decideMailGift(selected.giftId!,true)">Accept gift</UiButton><UiButton variant="secondary" :disabled="game.mailBusy || game.mode!=='online'" @click="game.decideMailGift(selected.giftId!,false)">Decline gift</UiButton></div>
      </template><div v-else class="mail-placeholder"><UiIcon name="mail" /><h2>Your bar's correspondence</h2><p>Select a message to read its report or collect attachments.</p></div></article>
    </div>
    <div class="mail-tools mail-toolbar"><UiButton size="sm" variant="solid" icon="gift" :disabled="!pending.length || game.mailBusy || game.mode!=='online'" @click="game.collectAllMailRewards()">Claim all rewards<template v-if="pending.length"> · {{ pending.length }}</template></UiButton><UiButton size="sm" icon="check" :disabled="game.mailBusy || game.mode!=='online'" @click="game.loadMailbox(game.mailboxEntries.map(item=>item.id))">Mark all read</UiButton><UiButton size="sm" icon="refresh" :disabled="game.mailBusy || game.mode!=='online'" @click="game.loadMailbox()">Refresh</UiButton></div>
    <p v-if="game.mode!=='online'" class="mail-lifetimes">Connect to your account to receive mail and handle gifts.</p>
  </ModalDialog>
</template>
<style scoped>
.mail-tools{display:flex;flex-wrap:wrap;gap:8px;margin:12px 0;}
.mail-tabs{flex-wrap:wrap;overflow:visible;padding:8px 0;}
.mail-list{display:grid;gap:10px;list-style:none;margin:12px 0;padding:0;}
.mail-row{display:flex;justify-content:space-between;gap:16px;width:100%;padding:16px;text-align:left;color:#fff3dc;border:1px solid #39495e;border-radius:12px;background:#101a2a;cursor:pointer;font:inherit;}
.mail-row:hover,.mail-row:focus-visible{border-color:#f3d291;background:#19263a;}
.mail-row.unread{border-color:#bc9452;}
.mail-row-copy{display:grid;gap:6px;min-width:0;overflow-wrap:anywhere;}
.mail-row .mail-row-copy,.mail-row .mail-row-copy>span{text-align:left;justify-items:start;}
.mail-row-copy b{font-size:16px;line-height:1.3;}
.mail-type,.mail-row time,.mail-sender time,.mail-lifetimes{font-size:13px;color:#aab7ca;}
.mail-row-end{display:grid;align-content:space-between;justify-items:end;gap:8px;flex:none;max-width:35%;}
.mail-row-end>span{font-size:24px;color:#f3d291;}
.mail-sender{display:flex;flex-wrap:wrap;justify-content:space-between;gap:8px;margin:20px 0 12px;}
.mail-body{line-height:1.6;overflow-wrap:anywhere;}
.mail-status{color:#f3d291;font-size:13px;}
.mail-attachments h3{font-size:14px;margin:20px 0 12px;}
.mail-attachments ul{display:grid;grid-template-columns:repeat(auto-fit,minmax(120px,1fr));gap:12px;list-style:none;padding:0;}
.mail-attachments li{display:grid;justify-items:center;align-content:start;gap:10px;padding:12px;border:1px solid #bc945266;border-radius:12px;background:radial-gradient(ellipse at top,#473a2e,#101a2a 75%);text-align:center;}
.attachment-art{height:96px;width:100%;}
.attachment-art :deep(.item-art){width:96px;height:96px;max-width:100%;object-fit:contain;}
.mail-attachments li>span{font-size:13px;line-height:1.4;overflow-wrap:anywhere;}
small{display:block;color:#aab7ca;font-size:13px;}
@media(max-width:420px){.mail-row{padding:12px;gap:10px;}.mail-row-end{max-width:32%;}.mail-attachments ul{grid-template-columns:repeat(2,minmax(0,1fr));}}
.mail-tabs{flex-wrap:nowrap;overflow-x:auto}.mail-tabs :deep(button){border-radius:6px}.mail-tabs :deep(button.active){background:#294e4d;border-color:#82bbac;color:#e6fff4}
.mail-workspace{display:grid;grid-template-columns:minmax(220px,30%) minmax(0,1fr);gap:12px;min-height:420px}.mail-inbox{background:#09121bcc;border:1px solid #42555d;border-radius:8px;overflow:auto;max-height:60vh}.mail-list{gap:0;margin:0}.mail-row{position:relative;justify-content:start;align-items:center;gap:10px;padding:14px 12px;border:0;border-bottom:1px solid #42555d66;border-radius:0;background:transparent;color:#bbc8ca}.mail-row.active{background:#e3d4ad var(--ui-gold-art) center / cover no-repeat;color:#28251e}.mail-row.unread:not(.active){background:#152b2d;color:#f8ecd0}.mail-row-copy{gap:4px}.mail-row-copy>span{font-size:13px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.mail-row time{font-size:11px;color:inherit;opacity:.7}.mail-emblem{display:grid;place-items:center;flex:none;width:42px;height:42px;border-radius:50%;border:1px solid #c1a46b;background:#0b1320 var(--ui-card-art) center / cover no-repeat;color:#f3d69a}.mail-unread{position:absolute;right:8px;top:9px;width:8px;height:8px;background:#ef6461;border-radius:50%}.mail-letter{min-width:0;padding:22px;border:1px solid #b89b61;border-radius:8px;background:#e3d4ad var(--ui-gold-art) center / cover no-repeat;color:#302c22}.mail-letter-head{display:flex;align-items:center;gap:14px;border-bottom:1px solid #6e5b3633;padding-bottom:16px}.mail-letter h2{margin:5px 0;font:700 23px Georgia,serif}.mail-letter small,.mail-sender time{color:#655533}.mail-body{white-space:pre-line}.mail-letter .mail-status{color:#5e512f}.mail-attachments li{color:#302c22;background:#fff7da33;border-color:#92764655}.mail-placeholder{margin:80px auto;text-align:center;color:#6e5b36}.mail-placeholder>.ui-icon{width:64px;height:64px}.mail-placeholder p{font-size:14px;line-height:1.6}.mail-back{display:none}.mail-toolbar{gap:10px;padding-top:12px;border-top:1px solid #b89b6155}.mail-empty{padding:16px}
@media(max-width:640px){.mail-workspace{grid-template-columns:1fr;min-height:300px}.mail-letter{display:none;padding:16px;min-height:380px}.mail-workspace.reading .mail-letter{display:block}.mail-workspace.reading .mail-inbox{display:none}.mail-inbox{max-height:55vh}.mail-back{display:flex;margin-bottom:16px}.mail-toolbar .ui-btn{flex:1}.mail-letter h2{font-size:20px}}
:deep(.mail-back){display:none}
@media(max-width:640px){:deep(.mail-back){display:flex;margin-bottom:16px}:deep(.mail-toolbar .ui-btn){flex:1}}
</style>
