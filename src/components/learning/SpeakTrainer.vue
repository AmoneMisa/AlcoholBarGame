<script setup lang="ts">
import UiIcon from '../ui/UiIcon.vue';
import { ref } from 'vue';
import { canListen, listenOnce } from '../../audio/listen';
import { compareSpoken, type SpeechResult } from '../../domain/english/speechCheck';

// A microphone button for any sentence: say it, and see which words were clear and which need work.
const props = defineProps<{ text: string; compact?: boolean }>();
const supported = canListen();
const listening = ref(false);
const result = ref<SpeechResult>();
const problem = ref('');

async function start() {
  if (listening.value) return;
  problem.value = '';
  result.value = undefined;
  listening.value = true;
  try { result.value = compareSpoken(props.text, await listenOnce()); }
  catch (error) {
    const reason = error instanceof Error ? error.message : '';
    problem.value = reason === 'denied' ? 'Allow the microphone to practise speaking.' : reason === 'unsupported' ? 'Speech practice is not available in this browser.' : 'I did not hear anything. Try again, a little louder.';
  } finally { listening.value = false; }
}
</script>

<template>
  <span v-if="supported" class="speak-trainer" :class="{ compact }">
    <button type="button" class="mic-button" :class="{ live: listening }" :aria-label="`Say: ${text}`" :title="listening ? 'Listening…' : 'Say it out loud'" @click.stop="start">{{ listening ? 'Listening…' : '' }}<UiIcon v-if="!listening" name="mic" /></button>
    <span v-if="result" class="speak-result" :class="{ passed: result.passed }" role="status">
      <b>{{ result.score }}%</b>
      <span class="spoken"><template v-for="(item, index) in result.words" :key="index"><i :class="item.ok ? 'ok' : 'miss'">{{ item.word }}</i>{{ ' ' }}</template></span>
      <small v-if="!result.passed">I heard: “{{ result.heard || '…' }}”</small>
      <small v-else>Clear! Well done.</small>
    </span>
    <small v-if="problem" class="speak-problem" role="status">{{ problem }}</small>
  </span>
</template>

<style scoped>
.speak-trainer { display: inline-flex; flex-wrap: wrap; align-items: center; gap: 6px; }
.mic-button { border: 1px solid rgba(255,255,255,.25); background: rgba(255,255,255,.08); color: inherit; border-radius: 999px; padding: 2px 10px; cursor: pointer; font-size: .85em; }
.mic-button.live { background: #b5523b; border-color: #e07a6a; animation: pulse 1s infinite; }
.speak-result { display: inline-flex; flex-wrap: wrap; gap: 6px; align-items: baseline; font-size: .85em; }
.speak-result b { color: #e0a14a; }
.speak-result.passed b { color: #7cc686; }
.spoken i { font-style: normal; }
.spoken i.ok { color: #7cc686; }
.spoken i.miss { color: #e07a6a; text-decoration: underline wavy; }
.speak-problem { color: #e0a14a; }
@keyframes pulse { 50% { opacity: .65; } }
</style>
