<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import ModalDialog from './ModalDialog.vue';
import UiButton from './UiButton.vue';
import UiCheckbox from './UiCheckbox.vue';
import { fetchHelloNotices } from '../../telegram/api';
import { calendarDate } from '../../domain/economy';
import { dismissForToday, readDismissed, visibleNotices, type HelloNotice } from '../../domain/helloNotice';
import { mailPieces as pieces } from '../../domain/mailText';

// Staff-written "hello" notices, one after another when the game opens. The checkbox hides a notice for the rest
// of today on this device (an edited notice shows again); without it the notice returns the next time the game opens.
const props = defineProps<{ ready: boolean }>();
const STORAGE_KEY = 'barlingo.hello-dismissed';
const queue = ref<HelloNotice[]>([]);
const hideToday = ref(false);
const copied = ref('');
const current = computed(() => queue.value[0]);
let loaded = false;

const storage = () => { try { return window.localStorage; } catch { return undefined; } };
watch(() => props.ready, async (ready) => {
  if (!ready || loaded) return;
  loaded = true;
  try {
    const result = await fetchHelloNotices();
    queue.value = visibleNotices(result.ok ? result.notices : [], readDismissed(storage()?.getItem(STORAGE_KEY) ?? null), calendarDate(new Date()));
  } catch { /* no notices is the safe answer when the server cannot be reached */ }
}, { immediate: true });

function close() {
  const notice = current.value;
  if (notice && hideToday.value) {
    try { storage()?.setItem(STORAGE_KEY, JSON.stringify(dismissForToday(readDismissed(storage()?.getItem(STORAGE_KEY) ?? null), notice, calendarDate(new Date())))); } catch { /* private mode: it will simply show again */ }
  }
  hideToday.value = false;
  queue.value = queue.value.slice(1);
}
async function copy(text: string) {
  try { await navigator.clipboard.writeText(text); copied.value = text; setTimeout(() => { if (copied.value === text) copied.value = ''; }, 1500); } catch { copied.value = ''; }
}
</script>

<template>
  <ModalDialog v-if="current" :key="current.id" eyebrow="HELLO" :title="current.title" close-label="Close notice" @close="close">
    <p class="hello-body"><template v-for="(piece, index) in pieces(current.body)" :key="index"><b v-if="piece.kind === 'bold'">{{ piece.text }}</b><code v-else-if="piece.kind === 'code'" class="hello-code" role="button" tabindex="0" title="Copy" @click="copy(piece.text)" @keydown.enter="copy(piece.text)">{{ copied === piece.text ? 'Copied ✓' : piece.text }}</code><template v-else>{{ piece.text }}</template></template></p>
    <template #footer>
      <div class="hello-foot">
        <UiCheckbox v-model="hideToday" label="Don't show me this again today" />
        <UiButton variant="primary" @click="close">{{ queue.length > 1 ? 'Next' : 'Got it' }}</UiButton>
      </div>
    </template>
  </ModalDialog>
</template>

<style scoped>
.hello-foot { display: flex; flex-wrap: wrap; align-items: center; justify-content: space-between; gap: 12px; }
.hello-foot > :first-child { flex: 1 1 220px; }
.hello-body { margin: 0; line-height: 1.6; white-space: pre-wrap; overflow-wrap: anywhere; }
.hello-code { display: inline-block; padding: 1px 7px; border: 1px solid #6f8a95; border-radius: 6px; background: #06101a; color: #ffe39a; font: 13px ui-monospace, Consolas, monospace; cursor: copy; user-select: all; }
</style>
