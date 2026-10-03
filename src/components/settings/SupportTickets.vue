<script setup lang="ts">
import { onMounted, ref } from 'vue';
import ModalDialog from '../ui/ModalDialog.vue';
import UiInput from '../ui/UiInput.vue';
import UiButton from '../ui/UiButton.vue';
import { post } from '../../telegram/api';
const opened=ref(false),busy=ref(false),message=ref(''),title=ref(''),description=ref(''),occurredAt=ref(''),screenshots=ref<string[]>([]), fileInput=ref<{el?:HTMLInputElement}>();
const contacts=ref({email:'',telegram:''});
onMounted(async()=> {try {contacts.value=await post<any>('/api/support/config',{});} catch { /* The report form can retry when the connection returns. */ }});
async function attach(event:Event) {
  message.value=''; const files=Array.from((event.target as HTMLInputElement).files ?? []);
  if(files.length>3 || files.some(f=>!['image/png','image/jpeg','image/webp'].includes(f.type) || f.size>1024*1024)) {message.value='Choose up to 3 PNG, JPEG or WebP screenshots, up to 1 MB each.'; screenshots.value=[]; return;}
  try {screenshots.value=await Promise.all(files.map(file=>new Promise<string>((resolve,reject)=>{const reader=new FileReader(); reader.onload=()=>resolve(String(reader.result)); reader.onerror=()=>reject(new Error('Could not read screenshot.')); reader.readAsDataURL(file); })));} catch(e){message.value=(e as Error).message;}
}
async function submit() {
  busy.value=true; message.value='';
  try {const result=await post<any>('/api/support/ticket',{title:title.value,description:description.value,occurredAt:occurredAt.value ? new Date(occurredAt.value).toISOString():null,screenshots:screenshots.value}); if(!result.ok) throw new Error(result.error); message.value=`Ticket #${result.id} submitted. Thank you.`; title.value=''; description.value=''; occurredAt.value='';screenshots.value=[];if(fileInput.value?.el) fileInput.value.el.value='';}
  catch(e) {message.value=(e as Error).message;} finally {busy.value=false;}
}
</script>
<template>
  <section class="settings-card"><h3>Support and complaints</h3><p>Report abuse, cheating or a game problem. Include who was involved and what happened.</p><p v-if="contacts.email"><a :href="`mailto:${contacts.email}`">{{ contacts.email }}</a></p><p v-if="/^https:\/\/t\.me\/[A-Za-z0-9_]+$/.test(contacts.telegram)"><a :href="contacts.telegram" target="_blank" rel="noopener noreferrer">Contact on Telegram</a></p><UiButton @click="opened=true; message=''">Create a ticket</UiButton></section>
  <ModalDialog v-if="opened" title="Support ticket" :closable="!busy" @close="opened=false">
    <form class="ticket-form" @submit.prevent="submit"><label>Title<UiInput v-model="title" required minlength="3" maxlength="120" :disabled="busy" /></label><label>Description<textarea v-model="description" required minlength="10" maxlength="5000" :disabled="busy" placeholder="What happened? Player name / friend code, steps and expected result." /></label><label>Event date and time (optional, your local time)<UiInput v-model="occurredAt" type="datetime-local" :disabled="busy" /></label><label>Screenshots (optional, up to 3, 1 MB each)<UiInput ref="fileInput" type="file" accept="image/png,image/jpeg,image/webp" multiple :disabled="busy" @change="attach" /></label><div class="ticket-previews"><img v-for="(shot,index) in screenshots" :key="index" :src="shot" :alt="`Screenshot ${index+1}`" /></div><p>Your account ID and submission time are attached automatically.</p><p role="status">{{ message }}</p><UiButton type="submit" variant="primary" :disabled="busy">{{ busy ? 'Sending…' : 'Submit ticket' }}</UiButton></form>
  </ModalDialog>
</template>
<style scoped>
a{color:#ecc47b}.ticket-form{display:grid;gap:12px}.ticket-form label{display:grid;gap:6px}.ticket-form input,.ticket-form textarea{width:100%;box-sizing:border-box;font:inherit;color:#eef;background:#152238;border:1px solid #526782;border-radius:8px;padding:10px}.ticket-form textarea{min-height:150px}.ticket-form p{font-size:13px;color:#bcc9dc}.ticket-previews{display:flex;gap:8px;flex-wrap:wrap}.ticket-previews img{max-width:120px;max-height:120px;object-fit:contain}
</style>
