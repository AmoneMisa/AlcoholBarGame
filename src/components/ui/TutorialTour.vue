<script setup lang="ts">
import UiIcon from './UiIcon.vue';
import UiButton from './UiButton.vue';
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue';
import { setPointer, selector, pickPointer, type PointerSpec } from '../../guide/pointer';
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
  when?: () => boolean;
}

const props = defineProps<{ ready: boolean; seen: boolean }>();
const emit = defineEmits<{ finish: [how: 'done' | 'skipped'] }>();
const game = useGameStore();

const shown = (css: string) => { const element = document.querySelector<HTMLElement>(css); return !!element && element.getBoundingClientRect().width > 1; };

const bottleOrder = ref(false);
// The word bank already holds a sentence about the order: point at its words, not at "New question" again.
const bankText = () => (document.querySelector('[data-guide="tile-bank"]')?.textContent ?? '').toLowerCase();
const orderSentenceShown = () => /\b(would|do) you\b/.test(bankText()) && /\b(like|want)\b/.test(bankText());
// Every word is placed: only sending is left.
const sentenceBuilt = () => document.querySelectorAll('.word-answer .placed').length > 0 && !document.querySelector('[data-guide="tile-bank"] .word-tile:not(:disabled)');
const STEPS: Step[] = [
  { id:'welcome', title:'Welcome to BarLingo!', text:'Run your bar and practise real English with your guests. Practise a Gin & Tonic with Mia, accept her payment in English and collect her tip. Practice never changes your account balance or stock. Follow the pointers, skip any step, or replay this tour from your avatar: Settings → How to play.', view:'service' },
  { id:'guests', title:'Guests at the counter', text:'Tap the guest directly to talk. Your bar has up to five seats, each with its own arrival timer. Swipe or use the arrows to browse seats. A red dot on an arrow means a customer is waiting off screen. Tap an empty silhouette to invite its next guest early for crystals; the price depends on the remaining time.', view:'service',
    action:'Tap a guest. A red dot shows which way to scroll to find one.', point:[{target:selector('guest'),gesture:'tap',label:'{Tap} the guest to talk'},{target:'.guest-nudge:has(.hidden-guest-dot)',gesture:'tap',label:'{Tap} the red-dot arrow to find a waiting guest'}], until:()=>!!game.conversationCustomerId },
  { id:'talk', title:'Ask in English', text:'Ask Mia: How can I help you? The practice words are always in the correct order. Tap them from left to right, then press Check & send.',
    action:'Build “How can I help you?”, then press Check & send.', point:[{target:selector('talk-send')+':not(:disabled)',gesture:'tap',label:'{Tap} Check & send',when:()=>document.querySelectorAll('.word-answer .placed').length>=6},{target:selector('tile-bank')+' .word-tile:not(:disabled)',gesture:'tap',label:'{Tap} the next word from left to right'},{target:selector('talk-input'),gesture:'type',label:'Type How can I help you?'}], until:()=>!!document.querySelector('.talk-line.bartender') },
  { id:'confirm', title:'Confirm the order', text:'Mia is your practice guest and always wants a Gin & Tonic. Ask: Would you like a Gin & Tonic? Use the clues to name the drink or bottle in English. A wrong guess is another clue. Preparation opens only after the guest confirms the order.',
    action:'Name the drink or bottle until the order is confirmed.', point:[{target:selector('talk-send')+':not(:disabled)',gesture:'tap',label:'{Tap} Check & send',when:()=>sentenceBuilt()},{target:selector('tile-bank')+' .word-tile:not(:disabled)',gesture:'tap',label:'{Tap} the next word from left to right',when:()=>orderSentenceShown()},{target:selector('new-question'),gesture:'tap',label:'{Tap} New question to choose an order sentence'},{target:selector('talk-input'),gesture:'type',label:'Ask which drink or bottle the guest wants'}], until:()=>!!game.customer.orderRevealed },
  { id:'workstation', title:'Open your workstation', text:'After a drink order is confirmed, Start mixing opens a separate close view of the counter. Sealed bottle orders are sold directly in the conversation with Sell full bottle.',
    action:'Press Start mixing for a drink, or Sell full bottle for a sealed bottle.', point:[{target:selector('prepare'),gesture:'tap',label:'{Tap} Start mixing'},{target:selector('bottle-sale')+':not(:disabled)',gesture:'tap',label:'{Tap} Sell full bottle'},{target:selector('guest'),gesture:'tap',label:'{Tap} the guest to reopen the confirmed order'}], until:()=>!!game.preparationCustomerId || game.rewardReport?.title==='Bottle sold' },
  { id:'mix', title:'Build the cocktail', text:'Search by a bottle name, brand or type. Choose a pour size, then drag a bottle from the shelf onto the glass. Take mixers, ice and garnish from the drawer below the counter. The ingredient quest on the right checks every amount. Food is in the Food drawer tab.',
    action:'Choose a measure and drag a needed bottle to the glass, or add a needed ingredient below.', point:[{target:selector('prep-bottle')+'.needed:not(:disabled)',to:selector('glass'),gesture:'drag',label:'Drag this bottle from the shelf to the glass'},{target:selector('prep-ingredient')+'.needed:not(:disabled)',gesture:'tap',label:'{Tap} the needed ingredient under the counter'},{target:selector('prep-search'),gesture:'type',label:'Find a bottle by name, brand or type'}], when:()=>!bottleOrder.value, until:()=>game.currentMix.length>0 },
  { id:'serve', title:'Finish and serve', text:'Follow the ingredient quest. Use Clear to empty the glass if you add too much. Press Mix when the recipe requires it. Once the drink is ready, Serve order replaces the quest on the right.',
    action:'Complete the ingredient quest, Mix if needed, then Serve order.', point:[{target:selector('serve')+':not(:disabled)',gesture:'tap',label:'{Tap} Serve order'},{target:selector('shake')+':not(:disabled)',gesture:'tap',label:'{Tap} Mix',when:()=>game.recipe.needsShake&&!game.shaken},{target:selector('prep-bottle')+'.needed:not(:disabled)',to:selector('glass'),gesture:'drag',label:'Drag a needed bottle to the glass'},{target:selector('prep-ingredient')+'.needed:not(:disabled)',gesture:'tap',label:'{Tap} a needed ingredient'}], when:()=>!bottleOrder.value, until:()=>!game.preparationCustomerId },
  { id:'payment', title:'Accept payment in English', text:'Handing over the drink does not collect money. In the conversation, ask: Would you like to pay by card or in cash? Mia pays only after you ask. This applies to every guest, including bottle and food orders.', action:'Build the payment sentence and press Check & send.', point:[{target:selector('talk-send')+':not(:disabled)',gesture:'tap',label:'{Tap} Check & send to accept payment'},{target:selector('tile-bank')+' .word-tile:not(:disabled)',gesture:'tap',label:'Build the payment sentence'}], until:()=>game.trainingPhase === 'tips' || game.trainingPhase === 'complete' },
  { id:'tips', title:'Collect your practice tip', text:'Mia leaves a guaranteed practice tip after paying. Tips wait in the jar at the right edge. Tap the jar, then press Collect. Practice coins and tips are discarded when you return to your real bar.', action:'Close the conversation if needed, then tap the tip jar and press Collect.', point:[{target:selector('talk-close'),gesture:'tap',label:'{Tap} Back to bar'},{target:'[data-guide="tip-collect"]',gesture:'tap',label:'{Tap} Collect'},{target:'[data-guide="tip-jar"]',gesture:'tap',label:'{Tap} the jar'}], until:()=>game.trainingPhase === 'complete' },
  { id:'care', title:'Look after your guests', text:'Tap a guest to reopen their conversation. Bring water or an ashtray, call a taxi, offer food or another drink, and resolve problems with clear, polite English. Collect earned tips by tapping the jar beside the bartender.', tips:['Tips stay in the jar until you collect them.','Food can also be served from the preparation screen’s Food tab.'] },
  { id:'english', title:'Study', text:'Study contains English lessons, recipes and pairing advice. Complete daily lessons for XP, crystals and a chance at a recipe card.', action:'Close any open screen, then open Study.', point:[{target:selector('talk-close'),gesture:'tap',label:'{Tap} Back to bar'},{target:selector('prep-back'),gesture:'tap',label:'{Tap} Back to bar'},{target:selector('nav-english'),gesture:'tap',label:'{Tap} Study'}], until:()=>shown('.learning-page') },
  { id:'market', title:'Storage and deliveries', text:'Storage contains Inventory, Market and Workshop. Buy bottles, ingredients and food in Market. Use Workshop for equipment, styles, fragments, boxes and weekly rankings. Report delivery problems politely in English.', action:'Open Storage, then Market.', point:[{target:selector('nav-market'),gesture:'tap',label:'{Tap} Market'},{target:selector('nav-manage'),gesture:'tap',label:'{Tap} Storage'}], until:()=>shown('.market-panel') },
  { id:'restock', title:'Refill your supplies', text:'Your practice cocktail used the tonic. Find Tonic in Market, add one bottle with +, review the total and press Place order. Practice supplies arrive immediately; regular deliveries take time. Your real coins and stock remain unchanged.', action:'Add one Tonic bottle, then press Place order.', point:[{target:'.market-product:has([aria-label="Add one Tonic bottle"]) [data-guide="market-plus"]',gesture:'tap',label:'{Tap} + to add Tonic',when:()=>!(game.purchaseCart.tonic > 0)},{target:selector('market-order')+':not(:disabled)',gesture:'tap',label:'{Tap} Place order to refill your tonic'},{target:selector('nav-market'),gesture:'tap',label:'{Tap} Market'},{target:selector('nav-manage'),gesture:'tap',label:'{Tap} Storage'}], until:()=>game.trainingRestocked },
  { id:'hud', title:'Your header', text:'Your avatar opens character information and Settings, including promo codes. Bar level appears before your bar’s name. Tap coins to exchange crystals for coins; tap crystals to open the Telegram Stars shop. The star balance is prestige. Servers become available as your bar levels up.', view:'service', point:[{target:selector('nav-service'),gesture:'tap',label:'{Tap} Bar to see your header'}] },
  { id:'rules', title:'Bar info', text:'Bar info is the text button in the second header row. It contains your level perks, city effects and house rules. Inspectors count rule violations, so explain the rules politely to guests.', action:'Open Bar, then Bar info.', point:[{target:selector('rules-button'),gesture:'tap',label:'{Tap} Bar info'},{target:selector('nav-service'),gesture:'tap',label:'{Tap} Bar'}], until:()=>shown('.rules-note') },
  { id:'events', title:'Events and login rewards', text:'Events includes login rewards, the daily wheel, season pass, seasonal style draws and ready quest or achievement rewards. Its badge counts ready rewards and free draws. Paid spins are listed separately with their crystal cost.', action:'Close Bar info, then open Events.', point:[{target:'.modal-sheet .ui-close',gesture:'tap',label:'{Tap} Close to return to the header'},{target:selector('events'),gesture:'tap',label:'{Tap} Events'},{target:selector('nav-service'),gesture:'tap',label:'{Tap} Bar'}], until:()=>shown('.events-hub') },
  { id:'screenshot', title:'A clean bar screenshot', text:'The small [ ] button at the bar’s bottom-right opens the full-screen scene. Screenshot settings choose the bartender, customers, jar, silhouettes, guest cards and arrival timers. Hide controls makes a clean frame; tap anywhere to bring controls back, then close or press Escape. These options are also in your character Settings.', action:'Close Events, then press [ ] at the bottom-right of the bar.', point:[{target:'.modal-sheet .ui-close',gesture:'tap',label:'{Tap} Close Events'},{target:selector('screenshot'),gesture:'tap',label:'{Tap} [ ] for a full-screen bar'},{target:selector('nav-service'),gesture:'tap',label:'{Tap} Bar'}], until:()=>shown('.bar-photo-screen') },
  { id:'done', title:'You are ready!', text:'Keep trying English sentences and follow your guests’ clues. The conversation help button explains the dialogue again. You can replay this tour from your avatar → Settings → How to play.', view:'service' }
];

const open = ref(false);
const suspended = ref(false);
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
  const active = pickPointer(step.value.point);
  const specs = active ? [active.spec] : (step.value.target ? [{ target: step.value.target }] : []);
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
  if (step.value.id === 'workstation') bottleOrder.value = game.customer.orderKind === 'bottle';
  expanded.value = false;
  // The tour never moves the player: it does not switch tabs and does not close a popup that is open. The card says
  // what to do and the pointer shows where, as soon as that part of the screen is there.
  setPointer('tour', step.value.point);
  await nextTick();
  setTimeout(() => { measure(); place(); }, 120);
}
function revealRestockControl() {
  if (!open.value || step.value.id !== 'restock') return;
  const css = game.purchaseCart.tonic > 0 ? selector('market-order') : '[aria-label="Add one Tonic bottle"]';
  document.querySelector<HTMLElement>(css)?.scrollIntoView({block:'center'});
}
watch(() => [step.value.id, game.purchaseCart.tonic, shown('.market-panel')] as const, () => { void nextTick(revealRestockControl); });

function start() { game.beginTraining(); index.value = 0; finishedAt = -1; open.value = true; void show(); }
// The choice is saved on the account (see the game store), so it is not asked again on another device.
function finish(how: 'done' | 'skipped') { game.endTraining(); open.value = false; setPointer('tour', undefined); emit('finish', how); }
function next() { if (last.value) finish('done'); else { do { index.value++; } while (index.value < STEPS.length - 1 && step.value.when && !step.value.when()); void show(); } }
function back() { if (index.value > 0) { do { index.value--; } while (index.value > 0 && step.value.when && !step.value.when()); void show(); } }
const onKey = (event: KeyboardEvent) => { if (open.value && event.key === 'Escape') finish('skipped'); };

watch(() => props.ready, (ready) => { if (ready && !props.seen) setTimeout(() => { if (!props.seen) start(); }, 900); }, { immediate: true });
onMounted(() => {
  window.addEventListener('resize', measure);
  window.addEventListener('resize', place);
  window.addEventListener('keydown', onKey);
  window.addEventListener('barlingo:tour', start);
  // A step that waits for an action moves on a moment after the player has done it.
  poll = setInterval(() => {
    suspended.value = !!document.querySelector('.bar-photo-screen, .modal-backdrop.celebration, .modal-backdrop.reveal');
    place();
    const current = step.value;
    if ((suspended.value && current.id !== 'screenshot') || !open.value || !current.until || finishedAt === index.value) return;
    let done = false;
    try { done = current.until(); } catch { done = false; }
    if (!done) return;
    const at = index.value;
    finishedAt = at;
    setTimeout(() => { if (open.value && index.value === at) next(); }, 700);
  }, 400);
});
onBeforeUnmount(() => {
  game.endTraining();
  if (poll) clearInterval(poll);
  setPointer('tour', undefined);
  window.removeEventListener('resize', measure);
  window.removeEventListener('resize', place);
  window.removeEventListener('keydown', onKey);
  window.removeEventListener('barlingo:tour', start);
});
</script>

<template>
  <Teleport to="body"><div v-if="open && !suspended" class="tour" role="dialog" aria-modal="false" aria-label="Game tour">
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
  </div></Teleport>
</template>

<style scoped>
.tour { position: fixed; inset: 0; z-index: 1800; pointer-events: none; }
.tour-dim { position: absolute; inset: 0; background: rgba(5, 8, 14, .55); }
.tour-spot { position: absolute; border-radius: 14px; border: 2px solid #f0c35a; box-shadow: 0 0 0 9999px rgba(5, 8, 14, .6); transition: all .25s ease; }
.tour-card { pointer-events: auto; position: absolute; left: 50%; bottom: calc(86px + env(safe-area-inset-bottom, 0px)); transform: translateX(-50%); width: min(94vw, 440px); padding: 14px 16px; border: 1px solid #b78649; border-radius: 16px; background:#0b1320 var(--ui-dialog-art) center / cover no-repeat; color: #f1ead9; box-shadow: 0 16px 40px #000c; display: grid; gap: 8px; }
.tour-card.compact { width: min(94vw, 400px); padding: 8px 12px; }
.tour-card.compact p { font-size: 13px; line-height: 1.35; }
.tour-card.compact footer { gap: 6px; }
.tour-card header { gap: 8px; }
.tour-card header small { margin-right: auto; }
.tour-card header { display: flex; justify-content: space-between; align-items: center; }
.tour-card small { color: #e4b35c; letter-spacing: .08em; font-weight: 700; }
.tour-card h3 { margin: 0; font: 700 20px Georgia, serif; }
.tour-card p { margin: 0; font-size: 14px; line-height: 1.45; }
.tour-card .tour-action { padding: 5px 8px; border-radius: 8px; background: rgba(255, 211, 90, .16); color: #ffe39a; font-weight: 700; }
.tour-card ul { margin: 0; padding-left: 18px; font-size: 13px; opacity: .85; display: grid; gap: 2px; }
.tour-dots { display: flex; gap: 5px; justify-content: center; }
.tour-dots i { width: 7px; height: 7px; border-radius: 50%; background: #3b4a63; }
.tour-dots i.past { background: #8a7345; }
.tour-dots i.on { background: #f0c35a; }
.tour-card footer { display: flex; justify-content: space-between; gap: 8px; }
.tour-card footer .ui-btn:last-child { flex: 1; }
</style>




