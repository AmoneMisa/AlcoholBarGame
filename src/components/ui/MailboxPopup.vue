<script setup lang="ts">
import { computed, ref } from 'vue';
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
const entries=computed(()=>game.mailboxEntries.filter(item=>filter.value==='all' || (filter.value==='system' ? item.actorId===0 : item.actorId!==0)).slice().sort((a,b)=>b.at-a.at));
const selected=computed(()=>game.mailboxEntries.find(item=>item.id===selectedId.value));
const date=(at:number)=>new Date(at).toLocaleString('en-GB',{timeZone:'Europe/Moscow',dateStyle:'medium',timeStyle:'short'});
const title=(item:MailEntry)=>item.kind==='visit'?'Bar visit':item.kind==='theft'?(item.direction==='incoming'?'Your tips were stolen':'Tip jar raid'):item.kind==='reward'?(item.id.startsWith('promo:')?`Promo code ${item.id.slice(6)}`:'Event rewards'):item.status==='returned'?'Gift returned':item.direction==='incoming'?'Gift received':'Gift sent';
const status=(item:MailEntry)=>item.status==='pending'?(item.kind==='reward'?'Ready to claim':'Awaiting a decision'):item.status==='accepted'?(item.kind==='reward'?'Claimed':'Accepted'):item.status==='returned'?'Returned to sender':item.status==='declined'?'Declined · returned to sender':'';
const body=(item:MailEntry)=>item.kind==='theft'?(item.direction==='incoming'?`At ${date(item.at)} MSK, player ${item.actorName} stole ${Math.round(item.amount??0)} coins from your tip jar!`:`At ${date(item.at)} MSK, you stole ${Math.round(item.amount??0)} coins from player ${item.actorName}'s tip jar!`):item.text;
const attachments=computed(()=>selected.value?.attachments ?? rewardAttachments(selected.value?.reward));
async function open(item:MailEntry){selectedId.value=item.id;if(!item.readAt && game.mode==='online') await game.loadMailbox([item.id]);}
</script>
<template>
  <ModalDialog :title="selected ? title(selected) : 'Mailbox'" :eyebrow="selected ? (selected.actorId===0 ? 'SYSTEM MAIL' : 'PLAYER MAIL') : 'YOUR BAR HISTORY'" width="640px" @close="game.mailboxOpen=false">
    <p v-if="game.mailMessage" role="status">{{ game.mailMessage }}</p>
    <template v-if="selected">
      <UiButton size="sm" variant="secondary" @click="selectedId=undefined">‹ Back to mail</UiButton>
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
    </template>
    <template v-else>
      <div class="mail-tools"><UiButton size="sm" variant="secondary" :disabled="game.mode!=='online'" @click="game.loadMailbox()">Refresh</UiButton><UiButton size="sm" variant="secondary" :disabled="game.mode!=='online'" @click="game.loadMailbox(game.mailboxEntries.map(item=>item.id))">Mark all as read</UiButton></div>
      <SectionTabs v-model="filter" class="mail-tabs" label="Mail sender type" :tabs="[{id:'all',label:'All'},{id:'system',label:'System'},{id:'player',label:'Players'}]" />
      <p v-if="game.mode!=='online'">Connect to your account to receive mail and handle gifts.</p>
      <p v-if="!entries.length">No messages here yet.</p>
      <ul class="mail-list"><li v-for="item in entries" :key="item.id"><button class="mail-row" :class="{unread:!item.readAt}" @click="open(item)"><span class="mail-row-copy"><span class="mail-type">{{ item.actorId===0 ? 'System' : 'Player' }} · {{ item.actorName }}</span><b>{{ title(item) }}</b><span v-if="item.status" class="mail-status">{{ status(item) }}</span></span><span class="mail-row-end"><time>{{ date(item.at) }} MSK</time><span aria-hidden="true">›</span></span></button></li></ul>
      <p class="mail-lifetimes">Visits & thefts: 7 days · Gifts: 14 days · Rewards: 180 days</p>
    </template>
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
.mail-type,.mail-row time,.mail-sender time,.mail-lifetimes{font-size:11px;color:#aab7ca;}
.mail-row-end{display:grid;align-content:space-between;justify-items:end;gap:8px;flex:none;max-width:35%;}
.mail-row-end>span{font-size:24px;color:#f3d291;}
.mail-sender{display:flex;flex-wrap:wrap;justify-content:space-between;gap:8px;margin:20px 0 12px;}
.mail-body{line-height:1.6;overflow-wrap:anywhere;}
.mail-status{color:#f3d291;font-size:12px;}
.mail-attachments h3{font-size:14px;margin:20px 0 12px;}
.mail-attachments ul{display:grid;grid-template-columns:repeat(auto-fit,minmax(120px,1fr));gap:12px;list-style:none;padding:0;}
.mail-attachments li{display:grid;justify-items:center;align-content:start;gap:10px;padding:12px;border:1px solid #bc945266;border-radius:12px;background:radial-gradient(ellipse at top,#473a2e,#101a2a 75%);text-align:center;}
.attachment-art{height:96px;width:100%;}
.attachment-art :deep(.item-art){width:96px;height:96px;max-width:100%;object-fit:contain;}
.mail-attachments li>span{font-size:13px;line-height:1.4;overflow-wrap:anywhere;}
small{display:block;color:#aab7ca;font-size:11px;}
@media(max-width:420px){.mail-row{padding:12px;gap:10px;}.mail-row-end{max-width:32%;}.mail-attachments ul{grid-template-columns:repeat(2,minmax(0,1fr));}}
</style>
