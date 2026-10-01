<script setup lang="ts">
import UiIcon from './UiIcon.vue';
import UiButton from './UiButton.vue';
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue';
import { setPointer, selector, type PointerSpec } from '../../guide/pointer';
import { useGameStore } from '../../stores/game';

// A short guided tour for new players. Steps that ask for an action show the exact thing to press (a circle on the
// real button and a hand that shows the gesture) and move on by themselves when the player has done it; "Skip step"
// is always there. The tour can be skipped at any time, never comes back on its own once it is finished or
// skipped, and can be replayed from the Settings page (the "How to play" button).

interface Step {
  id: string; title: string; text: string; view?: string; target?: string; tips?: string[];
  /** The exact thing to do: what to point at, and the gesture. */
  point?: PointerSpec[];
  /** The step is done when this is true (the player did what was asked). */
  until?: () => boolean;
  /** A short sentence that says what the player should do now. */
  action?: string;
}

const props = defineProps<{ ready: boolean; seen: boolean }>();
const emit = defineEmits<{ finish: [how: 'done' | 'skipped'] }>();
const game = useGameStore();

const shown = (css: string) => { const element = document.querySelector<HTMLElement>(css); return !!element && element.getBoundingClientRect().width > 1; };

const STEPS: Step[] = [
  { id: 'welcome', title: 'Welcome to BarLingo!', text: 'You run a bar, and you learn real English while you serve. This tour takes about a minute. You can skip it at any time and replay it later from Settings.', view: 'service' },
  { id: 'guests', title: 'Your guests', text: 'Guests arrive at the bar one by one. Each has a mood, a wish, and sometimes a problem.', view: 'service',
    action: 'Tap a guest to open the conversation.', point: [{ target: selector('guest'), gesture: 'tap', label: '{Tap} a guest to talk' }], until: () => !!game.conversationCustomerId },
  { id: 'talk', title: 'Talk to find the order', text: 'Ask in English what the guest likes: "Do you like sweet drinks?" The guest answers with clues. The checker corrects your English.',
    action: 'Build a question from the words and press Check & send.',
    point: [
      { target: selector('talk-send') + ':not(:disabled)', gesture: 'tap', label: '{Tap} Check & send', when: () => document.querySelectorAll('.word-answer .placed').length >= 3 },
      { target: `${selector('tile-bank')} .word-tile:not(:disabled)`, gesture: 'tap', label: '{Tap} the words one by one to build a question' },
      { target: selector('phrase-idea'), gesture: 'tap', label: '{Tap} a ready question' },
      { target: selector('talk-input'), gesture: 'type', label: 'Type a question here' }
    ], until: () => !!document.querySelector('.talk-line.bartender') },
  { id: 'mix', title: 'Make the drink', text: 'When you know the order, close the conversation and build the drink: pull a bottle down to the glass and hold to pour, then shake and serve.', view: 'service',
    action: 'Drag a bottle onto the glass and hold to pour.',
    point: [
      { target: selector('talk-close'), gesture: 'tap', label: '{Tap} the close button to go back to the bar', when: () => shown('.talk-popup') },
      { target: '.pshelf-bottles button:not(.empty)', to: selector('glass'), gesture: 'drag', label: 'Drag a bottle onto the glass and hold to pour' }
    ], until: () => game.currentMix.length > 0 },
  { id: 'care', title: 'Look after your guests', text: 'Guests are people. Bring water or an ashtray, call a taxi, offer a snack or another drink (you will see the chance of a yes), and solve problems: a card that does not work, a broken glass, a person who feels ill.', tips: ['Every answer in a situation is a real English sentence.', 'Be kind, but firm with drunk or rude guests.'] },
  { id: 'english', title: 'The English tab', text: 'Here you find words, phrases for every job, and daily quests. Quests give XP, crystals and sometimes a new recipe.',
    action: 'Open the English tab.', point: [{ target: selector('nav-english'), gesture: 'tap', label: '{Tap} English' }], until: () => shown('.learning-page') },
  { id: 'market', title: 'Stock and deliveries', text: 'Buy ingredients, bottles and food in the Market. Deliveries can be late, damaged or wrong. Report a problem politely, in English, and the supplier will help.',
    action: 'Open Manage, then the Market tab.', point: [{ target: selector('nav-market'), gesture: 'tap', label: '{Tap} Market' }, { target: selector('nav-manage'), gesture: 'tap', label: '{Tap} Manage' }], until: () => shown(selector('top-up')) },
  { id: 'hud', title: 'Coins, crystals and servers', text: 'Coins buy stock and upgrades. Crystals unlock recipes and styles. From level 8 you can hire servers: they earn coins while you are away, but never as much as you.', view: 'service' },
  { id: 'rules', title: 'House rules and events', text: 'Every city has its own rules, such as checking ID or paying by card only. Inspectors count every rule you break. Special nights, like ladies’ night or happy hour, change who comes and what they pay.', view: 'service',
    action: 'Press Rules to read them.', point: [{ target: selector('rules-button'), gesture: 'tap', label: '{Tap} Rules' }], until: () => shown('.house-rules-panel') },
  { id: 'done', title: 'You are ready!', text: 'The help button (?) in every conversation explains the screen again. Small mistakes are fine: every sentence you try makes your English better. Have a good shift!', view: 'service' }
];

const open = ref(false);
const index = ref(0);
const rect = ref<{ top: number; left: number; width: number; height: number } | undefined>();
const step = computed(() => STEPS[index.value]!);
const last = computed(() => index.value === STEPS.length - 1);
const waiting = computed(() => !!step.value.until);
const cardEl = ref<HTMLElement>();
// Steps that ask for an action show a slim card (what to do and the buttons), so it hides as little as possible;
// "Why?" opens the explanation.
const expanded = ref(false);
const slim = computed(() => !!step.value.point && !expanded.value);
/** Where the card sits (px from the top): in the free band that covers the least of what the step points at. */
const cardTop = ref<number | undefined>();
let poll: ReturnType<typeof setInterval> | undefined;
let finishedAt = -1;

function measure() {
  const css = step.value.target;
  const element = css ? document.querySelector<HTMLElement>(css) : null;
  if (!element || step.value.point) { rect.value = undefined; return; }
  const box = element.getBoundingClientRect();
  rect.value = box.width && box.height ? { top: box.top - 6, left: box.left - 6, width: box.width + 12, height: box.height + 12 } : undefined;
}

// The card must never sit on top of what it asks the player to press: it takes the band under the header or the band
// above the navigation, whichever hides less of the targets of this step.
function targetRects(): DOMRect[] {
  const specs = step.value.point ?? (step.value.target ? [{ target: step.value.target }] : []);
  const rects: DOMRect[] = [];
  for (const spec of specs as { target: string; to?: string }[]) {
    for (const css of [spec.target, spec.to]) {
      if (!css) continue;
      let found: Element[] = [];
      try { found = [...document.querySelectorAll(css)].slice(0, 40); } catch { found = []; }
      for (const element of found) { const box = element.getBoundingClientRect(); if (box.width > 1 && box.height > 1) rects.push(box); }
    }
  }
  return rects;
}
function place() {
  const card = cardEl.value;
  if (!card || !open.value) return;
  const box = card.getBoundingClientRect();
  const height = card.offsetHeight;
  const hud = document.querySelector('.top-hud')?.getBoundingClientRect().bottom ?? 70;
  const nav = document.querySelector('.game-nav')?.getBoundingClientRect();
  const navTop = nav && nav.height > 1 ? nav.top : window.innerHeight;
  // A dialog that covers the header and the navigation (the conversation) sets the free area instead.
  const dialog = [...document.querySelectorAll<HTMLElement>('.talk-popup, [aria-modal="true"]:not(.tour)')].map((element) => element.getBoundingClientRect()).find((box) => box.width > 200 && box.height > 200);
  const topY = dialog ? Math.max(8, dialog.top + 8) : Math.max(8, hud + 10);
  const bottomY = Math.max(topY, (dialog ? dialog.bottom - 8 : navTop - 12) - height);
  // Only what the player can see counts: targets scrolled out of the dialog or the screen are not hidden by the card.
  const areaTop = dialog ? dialog.top : 0;
  const areaBottom = Math.min(window.innerHeight, dialog ? dialog.bottom : window.innerHeight);
  const rects = targetRects().filter((rect) => rect.bottom > areaTop && rect.top < areaBottom);
  const hidden = (y: number) => rects.reduce((sum, rect) => sum + Math.max(0, Math.min(y + height, rect.bottom, areaBottom) - Math.max(y, rect.top, areaTop)) * Math.max(0, Math.min(box.right, rect.right) - Math.max(box.left, rect.left)), 0);
  // On a tie the card stays at the top, where it covers the least of the screen the player works in.
  cardTop.value = hidden(bottomY) < hidden(topY) ? bottomY : topY;
}

async function show() {
  expanded.value = false;
  // The tour never moves the player: it does not switch tabs and does not close a popup that is open. The card says
  // what to do and the pointer shows where, as soon as that part of the screen is there.
  setPointer('tour', step.value.point);
  await nextTick();
  setTimeout(() => { measure(); place(); }, 120);
}

function start() { index.value = 0; finishedAt = -1; open.value = true; void show(); }
// The choice is saved on the account (see the game store), so it is not asked again on another device.
function finish(how: 'done' | 'skipped') { open.value = false; setPointer('tour', undefined); emit('finish', how); }
function next() { if (last.value) finish('done'); else { index.value++; void show(); } }
function back() { if (index.value > 0) { index.value--; void show(); } }
const onKey = (event: KeyboardEvent) => { if (open.value && event.key === 'Escape') finish('skipped'); };

watch(() => props.ready, (ready) => { if (ready && !props.seen) setTimeout(() => { if (!props.seen) start(); }, 900); }, { immediate: true });
onMounted(() => {
  window.addEventListener('resize', measure);
  window.addEventListener('resize', place);
  window.addEventListener('keydown', onKey);
  window.addEventListener('barlingo:tour', start);
  // A step that waits for an action moves on a moment after the player has done it.
  poll = setInterval(() => {
    place();
    const current = step.value;
    if (!open.value || !current.until || finishedAt === index.value) return;
    let done = false;
    try { done = current.until(); } catch { done = false; }
    if (!done) return;
    const at = index.value;
    finishedAt = at;
    setTimeout(() => { if (open.value && index.value === at) next(); }, 700);
  }, 400);
});
onBeforeUnmount(() => {
  if (poll) clearInterval(poll);
  setPointer('tour', undefined);
  window.removeEventListener('resize', measure);
  window.removeEventListener('resize', place);
  window.removeEventListener('keydown', onKey);
  window.removeEventListener('barlingo:tour', start);
});
</script>

<template>
  <div v-if="open" class="tour" role="dialog" aria-modal="false" aria-label="Game tour">
    <div v-if="rect" class="tour-spot" :style="{ top: rect.top + 'px', left: rect.left + 'px', width: rect.width + 'px', height: rect.height + 'px' }" />
    <div v-else-if="!step.point" class="tour-dim" />
    <section ref="cardEl" class="tour-card" :class="{ compact: slim }" :style="cardTop !== undefined ? { top: cardTop + 'px', bottom: 'auto' } : undefined">
      <header><small>Step {{ index + 1 }} of {{ STEPS.length }}</small><UiButton v-if="step.point" size="sm" variant="ghost" @click="expanded = !expanded; $nextTick(place)">{{ expanded ? 'Hide details' : 'Why?' }}</UiButton><UiButton size="sm" variant="ghost" icon="close" @click="finish('skipped')">Skip tour</UiButton></header>
      <h3 v-if="!slim">{{ step.title }}</h3>
      <p v-if="!slim">{{ step.text }}</p>
      <p v-if="step.action" class="tour-action"><UiIcon class="inline-icon" name="pointer" /> {{ step.action }}</p>
      <ul v-if="step.tips?.length && !slim"><li v-for="tip in step.tips" :key="tip">{{ tip }}</li></ul>
      <div v-if="!step.point" class="tour-dots" aria-hidden="true"><i v-for="(item, at) in STEPS" :key="item.id" :class="{ on: at === index, past: at < index }" /></div>
      <footer>
        <UiButton :size="slim ? 'sm' : 'md'" :disabled="index === 0" @click="back">Back</UiButton>
        <UiButton :size="slim ? 'sm' : 'md'" variant="solid" @click="next">{{ last ? 'Start playing' : waiting || step.point ? 'Skip step' : 'Next' }}</UiButton>
      </footer>
    </section>
  </div>
</template>

<style scoped>
.tour { position: fixed; inset: 0; z-index: 400; pointer-events: none; }
.tour-dim { position: absolute; inset: 0; background: rgba(5, 8, 14, .55); }
.tour-spot { position: absolute; border-radius: 14px; border: 2px solid #f0c35a; box-shadow: 0 0 0 9999px rgba(5, 8, 14, .6); transition: all .25s ease; }
.tour-card { pointer-events: auto; position: absolute; left: 50%; bottom: calc(86px + env(safe-area-inset-bottom, 0px)); transform: translateX(-50%); width: min(94vw, 440px); padding: 14px 16px; border: 1px solid #b78649; border-radius: 16px; background: #141c2b; color: #f1ead9; box-shadow: 0 16px 40px #000c; display: grid; gap: 8px; }
.tour-card.compact { width: min(94vw, 400px); padding: 8px 12px; }
.tour-card.compact p { font-size: 12.5px; line-height: 1.35; }
.tour-card.compact footer { gap: 6px; }
.tour-card header { gap: 8px; }
.tour-card header small { margin-right: auto; }
.tour-card header { display: flex; justify-content: space-between; align-items: center; }
.tour-card small { color: #e4b35c; letter-spacing: .08em; font-weight: 700; }
.tour-card h3 { margin: 0; font: 700 20px Georgia, serif; }
.tour-card p { margin: 0; font-size: 14px; line-height: 1.45; }
.tour-card .tour-action { padding: 5px 8px; border-radius: 8px; background: rgba(255, 211, 90, .16); color: #ffe39a; font-weight: 700; }
.tour-card ul { margin: 0; padding-left: 18px; font-size: 12.5px; opacity: .85; display: grid; gap: 2px; }
.tour-dots { display: flex; gap: 5px; justify-content: center; }
.tour-dots i { width: 7px; height: 7px; border-radius: 50%; background: #3b4a63; }
.tour-dots i.past { background: #8a7345; }
.tour-dots i.on { background: #f0c35a; }
.tour-card footer { display: flex; justify-content: space-between; gap: 8px; }
.tour-card footer .ui-btn:last-child { flex: 1; }
</style>
