<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue';

// A short guided tour for new players. It can be skipped at any step, never comes back on its own once it is
// finished or skipped, and can be replayed from the Sound panel (the "How to play" button).

interface Step { id: string; title: string; text: string; view?: string; target?: string; tips?: string[] }

const props = defineProps<{ ready: boolean }>();
const emit = defineEmits<{ view: [id: string] }>();

const STORE_KEY = 'barlingo.tour';
const STEPS: Step[] = [
  { id: 'welcome', title: 'Welcome to BarLingo!', text: 'You run a bar, and you learn real English while you serve. This tour takes about a minute. You can skip it at any time and replay it later from the Sound panel.', view: 'service' },
  { id: 'guests', title: 'Your guests', text: 'Guests arrive at the bar one by one. Each has a mood, a wish, and sometimes a problem. Tap a guest to start talking.', view: 'service', target: '.bar-scene', tips: ['The little bar above a guest shows how long they will wait.', 'Up to six guests can sit at the bar.'] },
  { id: 'talk', title: 'Talk to find the order', text: 'In the conversation, ask questions in English: "Do you like sweet drinks?" The guest answers with clues. Pick a suggested sentence or type your own; the checker corrects your English.', tips: ['Good English earns bonus XP and crystals.', 'Tap the speaker to hear a sentence, the microphone to practise saying it.'] },
  { id: 'mix', title: 'Make the drink', text: 'When you know the order, build the drink below the bar: pour the ingredients, shake, and serve. The right drink, made well, brings coins, tips and experience.', view: 'service', target: '.cocktail-workspace' },
  { id: 'care', title: 'Look after your guests', text: 'Guests are people. Bring water or an ashtray, call a taxi, offer a snack or another drink (you will see the chance of a yes), and solve problems: a card that does not work, a broken glass, a person who feels ill.', tips: ['Every answer in a situation is a real English sentence.', 'Be kind, but firm with drunk or rude guests.'] },
  { id: 'english', title: 'The English tab', text: 'Here you find words, phrases for every job, and daily quests. Quests give XP, crystals and sometimes a new recipe.', view: 'english' },
  { id: 'market', title: 'Stock and deliveries', text: 'Buy ingredients, bottles and food in the Market. Deliveries can be late, damaged or wrong. Report a problem politely, in English, and the supplier will help.', view: 'market' },
  { id: 'hud', title: 'Coins, crystals and servers', text: 'Coins buy stock and upgrades. Crystals unlock recipes and styles. From level 8 you can hire servers: they earn coins while you are away, but never as much as you.', view: 'service', target: '.hud-resources' },
  { id: 'rules', title: 'House rules and events', text: 'Every city has its own rules, such as checking ID or paying by card only. Open Rules to read them: inspectors count every rule you break. Special nights, like ladies’ night or happy hour, change who comes and what they pay.', view: 'service', target: '.house-rules-button' },
  { id: 'done', title: 'You are ready!', text: 'Start with the first guest. Small mistakes are fine: every sentence you try makes your English better. Have a good shift!', view: 'service' }
];

const open = ref(false);
const index = ref(0);
const rect = ref<{ top: number; left: number; width: number; height: number } | undefined>();
const step = computed(() => STEPS[index.value]!);
const last = computed(() => index.value === STEPS.length - 1);

const saved = () => { try { return localStorage.getItem(STORE_KEY); } catch { return null; } };
const remember = (value: string) => { try { localStorage.setItem(STORE_KEY, value); } catch { /* private mode */ } };

function measure() {
  const selector = step.value.target;
  const element = selector ? document.querySelector<HTMLElement>(selector) : null;
  if (!element) { rect.value = undefined; return; }
  const box = element.getBoundingClientRect();
  rect.value = box.width && box.height ? { top: box.top - 6, left: box.left - 6, width: box.width + 12, height: box.height + 12 } : undefined;
}

async function show() {
  if (step.value.view) emit('view', step.value.view);
  await nextTick();
  setTimeout(measure, 120);
}

function start() { index.value = 0; open.value = true; void show(); }
function finish(how: 'done' | 'skipped') { open.value = false; remember(how); }
function next() { if (last.value) finish('done'); else { index.value++; void show(); } }
function back() { if (index.value > 0) { index.value--; void show(); } }
const onKey = (event: KeyboardEvent) => { if (open.value && event.key === 'Escape') finish('skipped'); };

watch(() => props.ready, (ready) => { if (ready && !saved()) setTimeout(start, 900); }, { immediate: true });
onMounted(() => {
  window.addEventListener('resize', measure);
  window.addEventListener('keydown', onKey);
  window.addEventListener('barlingo:tour', start);
});
onBeforeUnmount(() => {
  window.removeEventListener('resize', measure);
  window.removeEventListener('keydown', onKey);
  window.removeEventListener('barlingo:tour', start);
});
</script>

<template>
  <div v-if="open" class="tour" role="dialog" aria-modal="false" aria-label="Game tour">
    <div v-if="rect" class="tour-spot" :style="{ top: rect.top + 'px', left: rect.left + 'px', width: rect.width + 'px', height: rect.height + 'px' }" />
    <div v-else class="tour-dim" />
    <section class="tour-card" :class="{ top: !!rect && rect.top > 260 }">
      <header><small>Step {{ index + 1 }} of {{ STEPS.length }}</small><button type="button" class="tour-skip" @click="finish('skipped')">Skip tour ✕</button></header>
      <h3>{{ step.title }}</h3>
      <p>{{ step.text }}</p>
      <ul v-if="step.tips?.length"><li v-for="tip in step.tips" :key="tip">{{ tip }}</li></ul>
      <div class="tour-dots" aria-hidden="true"><i v-for="(item, at) in STEPS" :key="item.id" :class="{ on: at === index, past: at < index }" /></div>
      <footer>
        <button type="button" :disabled="index === 0" @click="back">Back</button>
        <button type="button" class="primary" @click="next">{{ last ? 'Start playing' : 'Next' }}</button>
      </footer>
    </section>
  </div>
</template>

<style scoped>
.tour { position: fixed; inset: 0; z-index: 400; pointer-events: none; }
.tour-dim { position: absolute; inset: 0; background: rgba(5, 8, 14, .55); }
.tour-spot { position: absolute; border-radius: 14px; border: 2px solid #f0c35a; box-shadow: 0 0 0 9999px rgba(5, 8, 14, .6); transition: all .25s ease; }
.tour-card { pointer-events: auto; position: absolute; left: 50%; bottom: calc(86px + env(safe-area-inset-bottom, 0px)); transform: translateX(-50%); width: min(94vw, 440px); padding: 14px 16px; border: 1px solid #b78649; border-radius: 16px; background: #141c2b; color: #f1ead9; box-shadow: 0 16px 40px #000c; display: grid; gap: 8px; }
.tour-card.top { bottom: auto; top: calc(var(--hud-h, 70px) + 12px); }
.tour-card header { display: flex; justify-content: space-between; align-items: center; }
.tour-card small { color: #e4b35c; letter-spacing: .08em; font-weight: 700; }
.tour-card h3 { margin: 0; font: 700 20px Georgia, serif; }
.tour-card p { margin: 0; font-size: 14px; line-height: 1.45; }
.tour-card ul { margin: 0; padding-left: 18px; font-size: 12.5px; opacity: .85; display: grid; gap: 2px; }
.tour-dots { display: flex; gap: 5px; justify-content: center; }
.tour-dots i { width: 7px; height: 7px; border-radius: 50%; background: #3b4a63; }
.tour-dots i.past { background: #8a7345; }
.tour-dots i.on { background: #f0c35a; }
.tour-card footer { display: flex; justify-content: space-between; gap: 8px; }
.tour-card button { padding: 8px 14px; border: 1px solid #5a6b86; border-radius: 10px; background: #1d283b; color: inherit; font-weight: 700; cursor: pointer; }
.tour-card button.primary { background: #a9702b; border-color: #e0a14a; color: #fff6e0; }
.tour-card button:disabled { opacity: .4; cursor: default; }
.tour-card .tour-skip { padding: 4px 10px; font-size: 12px; background: transparent; }
</style>
