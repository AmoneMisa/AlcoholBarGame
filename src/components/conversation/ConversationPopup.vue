<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, reactive, ref, watch } from 'vue';
import { CUSTOMER_ART_BY_SLOT } from '../../data/cosmetics/artCatalog';
import { MODIFIERS, RECIPES } from '../../domain/catalog';
import {
  buildProfile, matchesFacts, openingLine, questionTemplates, replyTo, tilesFor, correctedTileSelection, TOPIC_LABEL, withArticle,
  type CustomerReply, type Fact
} from '../../domain/conversation/customerTalk';
import { checkText, useSpeller, type CheckResult } from '../../domain/english/checker';
import { loadSpeller } from '../../domain/english/dictionary';
import { GLOSSARY } from '../../domain/english/lexicon';
import { useGameStore } from '../../stores/game';
import { haptic } from '../../telegram/webapp';
import CharacterModel from '../characters/CharacterModel.vue';

interface ChatLine { id: number; speaker: 'customer' | 'bartender'; text: string; note?: string; ok?: boolean; }
interface Transcript { lines: ChatLine[]; facts: Fact[]; expression: CustomerReply['expression']; }

// Kept outside the component so a conversation survives closing and reopening the popup.
const transcripts = reactive<Record<string, Transcript>>({});
const inputMode = ref<'type' | 'words'>('words');
let lineId = 0;

const game = useGameStore();
const customer = computed(() => game.customers.find((item) => item.id === game.conversationCustomerId));
const slot = computed(() => Math.max(0, game.customers.findIndex((item) => item.id === customer.value?.id)));
const recipe = computed(() => RECIPES.find((item) => item.id === customer.value?.orderRecipeId));
const profile = computed(() => recipe.value && buildProfile(recipe.value));
const modifierLabel = computed(() => MODIFIERS.find((item) => item.id === customer.value?.modifierId)?.label);
const talk = computed(() => customer.value && transcripts[customer.value.id]);
const confirmed = computed(() => !!customer.value?.orderRevealed);
const conversationRecipes = computed(() => customer.value?.specialRecipeRewardId ? [...game.knownRecipes,...game.lockedRecipes.filter((item) => item.id === customer.value?.specialRecipeRewardId)] : game.knownRecipes);
const candidates = computed(() => conversationRecipes.value.filter((item) => matchesFacts(item, talk.value?.facts ?? [])));

const draft = ref('');
const feedback = ref<CheckResult>();
const feedbackFor = ref('');
const customerTyping = ref(false);
const log = ref<HTMLElement>();
const input = ref<HTMLInputElement>();

const templateIndex = ref(0);
const templates = computed(() => questionTemplates(talk.value?.facts ?? [], candidates.value));
const tiles = ref<{ id: string; text: string }[]>([]);
const picked = ref<string[]>([]);
const pickedTiles = computed(() => picked.value.map((id) => tiles.value.find((tile) => tile.id === id)!).filter(Boolean));
const builtSentence = computed(() => pickedTiles.value.map((tile) => tile.text).join(' ').replace(/\s+([?.!,])/g, '$1'));

function resetTiles() {
  const template = templates.value[templateIndex.value % Math.max(1, templates.value.length)];
  tiles.value = template ? tilesFor(template.text, RECIPES) : [];
  picked.value = [];
}

function ensureTranscript() {
  const current = customer.value;
  if (!current || !profile.value || transcripts[current.id]) return;
  transcripts[current.id] = { lines: [{ id: lineId++, speaker: 'customer', text: openingLine(current, profile.value) }], facts: [], expression: 'thinking' };
}

watch(() => customer.value?.id, () => {
  ensureTranscript();
  draft.value = '';
  feedback.value = undefined;
  templateIndex.value = 0;
  resetTiles();
  scrollLog();
}, { immediate: true });

function scrollLog() {
  nextTick(() => log.value?.scrollTo({ top: log.value.scrollHeight, behavior: 'smooth' }));
}

// Split a customer line into plain text and glossary words the learner can tap.
function segments(text: string) {
  return text.split(/(\p{L}+)/u).filter(Boolean).map((part) => ({ part, meaning: GLOSSARY[part.toLowerCase()] }));
}

function highlighted(result: CheckResult, text: string) {
  const parts: { text: string; issue?: boolean }[] = [];
  let cursor = 0;
  for (const issue of [...result.issues].filter((item) => item.end > item.start).sort((a, b) => a.start - b.start)) {
    if (issue.start < cursor) continue;
    parts.push({ text: text.slice(cursor, issue.start) }, { text: text.slice(issue.start, issue.end), issue: true });
    cursor = issue.end;
  }
  parts.push({ text: text.slice(cursor) });
  return parts.filter((part) => part.text);
}

function send(text: string, force = false) {
  const current = customer.value;
  const transcript = talk.value;
  if (!current || !transcript || !profile.value || customerTyping.value) return;
  const sentence = text.replace(/\s+/g, ' ').trim();
  if (!sentence) return;
  const result = checkText(sentence);
  if (!result.ok && !force) {
    feedback.value = result;
    feedbackFor.value = sentence;
    haptic('light');
    return;
  }
  game.recordSentence(result.ok);
  transcript.lines.push({
    id: lineId++, speaker: 'bartender', text: sentence, ok: result.ok,
    note: result.ok ? (result.issues.length ? result.issues[0]!.message : undefined) : `Better: “${result.corrected}”`
  });
  draft.value = '';
  feedback.value = undefined;
  picked.value = [];
  customerTyping.value = true;
  scrollLog();

  window.setTimeout(() => {
    customerTyping.value = false;
    if (!customer.value || customer.value.id !== current.id) return;
    const reply = replyTo(result.corrected, current, profile.value!, RECIPES, transcript.facts, modifierLabel.value);
    for (const fact of reply.facts) if (!transcript.facts.some((known) => known.topic === fact.topic)) transcript.facts.push(fact);
    transcript.lines.push({ id: lineId++, speaker: 'customer', text: reply.text });
    transcript.expression = reply.expression;
    if (reply.confirmed) {
      game.confirmOrder(current.id);
      haptic('medium');
    }
    if (reply.wrongGuess) game.penalizeWrongGuess();
    templateIndex.value = 0;
    resetTiles();
    scrollLog();
  }, 650);
}

function useCorrection() {
  if (!feedback.value) return;
  if (inputMode.value === 'type') {
    draft.value = feedback.value.corrected;
    feedback.value = undefined;
    nextTick(() => input.value?.focus());
  } else {
    // A suggested correction must be reachable in word mode, including newly inserted words.
    const corrected = feedback.value.corrected;
    tiles.value = tilesFor(corrected, RECIPES);
    picked.value = correctedTileSelection(corrected,tiles.value,RECIPES);
    feedback.value = undefined;
  }
}

function pick(id: string) {
  if (picked.value.includes(id)) picked.value = picked.value.filter((item) => item !== id);
  else picked.value = [...picked.value, id];
  feedback.value = undefined;
}

function nextTemplate() {
  templateIndex.value++;
  resetTiles();
  feedback.value = undefined;
}

function suggest(text: string) {
  inputMode.value = 'type';
  draft.value = text;
  feedback.value = undefined;
  nextTick(() => input.value?.focus());
}

function startMixing() {
  game.closeConversation();
  nextTick(() => document.querySelector('.cocktail-workspace')?.scrollIntoView({ behavior: 'smooth', block: 'start' }));
}

const onKey = (event: KeyboardEvent) => { if (event.key === 'Escape') game.closeConversation(); };
onMounted(() => {
  window.addEventListener('keydown', onKey);
  loadSpeller().then(useSpeller);
});
onBeforeUnmount(() => window.removeEventListener('keydown', onKey));

const patience = computed(() => customer.value ? Math.round(customer.value.patienceRemaining / customer.value.patience * 100) : 0);
const accuracy = computed(() => game.languageStats.sentences ? Math.round(game.languageStats.correct / game.languageStats.sentences * 100) : 100);
const phraseIdeas = computed(() => templates.value.slice(0, 4).map((item) => item.text));
</script>

<template>
  <div v-if="customer && talk" class="talk-backdrop" @click.self="game.closeConversation()">
    <section class="talk-popup" role="dialog" aria-modal="true" :aria-label="`Conversation with ${customer.name}`">
      <header class="talk-header">
        <div class="talk-portrait"><CharacterModel role="customer" :character-id="customer.characterId ?? CUSTOMER_ART_BY_SLOT[slot % CUSTOMER_ART_BY_SLOT.length]" :seed="customer.id" :mood="customer.mood" :expression="talk.expression" animation="talk" /></div>
        <div class="talk-title">
          <small>ENGLISH PRACTICE · {{ customer.mood }}</small>
          <h2>{{ customer.name }}</h2>
          <div class="talk-meters">
            <label>Patience <span><i :style="{ width: patience + '%' }"></i></span></label>
            <label>Your English <b>{{ accuracy }}%</b></label>
          </div>
        </div>
        <button class="talk-close" type="button" aria-label="Close conversation" @click="game.closeConversation()">×</button>
      </header>

      <div class="talk-body">
        <div ref="log" class="talk-log" aria-live="polite">
          <div v-for="line in talk.lines" :key="line.id" class="talk-line" :class="line.speaker">
            <p v-if="line.speaker === 'customer'">
              <template v-for="(segment, index) in segments(line.text)" :key="index">
                <button v-if="segment.meaning" type="button" class="gloss" :data-meaning="segment.meaning">{{ segment.part }}</button>
                <template v-else>{{ segment.part }}</template>
              </template>
            </p>
            <p v-else>{{ line.text }}</p>
            <small v-if="line.speaker === 'bartender'" :class="line.ok ? 'good' : 'fix'">{{ line.ok ? '✓ Correct English' : '✎ ' + line.note }}</small>
          </div>
          <div v-if="customerTyping" class="talk-line customer typing"><p><i></i><i></i><i></i></p></div>
        </div>

        <aside class="talk-clues">
          <small>WHAT YOU KNOW</small>
          <div class="clue-chips">
            <span v-for="fact in talk.facts" :key="fact.topic" :class="fact.likes ? 'yes' : 'no'">{{ fact.likes ? '✓' : '✗' }} {{ TOPIC_LABEL[fact.topic] }}</span>
            <em v-if="!talk.facts.length">Ask about taste, fruit, strength or bubbles.</em>
          </div>
          <small>POSSIBLE DRINKS</small>
          <div class="clue-drinks">
            <button v-for="item in candidates.slice(0, 6)" :key="item.id" type="button" @click="suggest(`Would you like ${withArticle(item.name)}?`)">{{ item.name }}</button>
            <em v-if="!candidates.length">No match in your recipe book.</em>
          </div>
        </aside>
      </div>

      <div v-if="confirmed" class="talk-confirmed">
        <div><small>ORDER CONFIRMED</small><b>{{ recipe?.name }}<template v-if="modifierLabel"> · {{ modifierLabel }}</template></b></div>
        <button class="primary-button" type="button" @click="startMixing">Start mixing <span>→</span></button>
      </div>

      <footer class="talk-compose">
        <nav class="talk-modes" aria-label="Answer mode">
          <button type="button" :class="{ active: inputMode === 'words' }" @click="inputMode = 'words'; feedback = undefined">Choose words</button>
          <button type="button" :class="{ active: inputMode === 'type' }" @click="inputMode = 'type'; feedback = undefined">Type yourself</button>
        </nav>

        <div v-if="feedback" class="talk-feedback">
          <p class="feedback-sentence"><template v-for="(part, index) in highlighted(feedback, feedbackFor)" :key="index"><mark v-if="part.issue">{{ part.text }}</mark><template v-else>{{ part.text }}</template></template></p>
          <ul><li v-for="(issue, index) in feedback.issues" :key="index" :class="issue.severity"><b>{{ issue.kind }}</b> {{ issue.message }}</li></ul>
          <p class="feedback-fix">Correct: <b>{{ feedback.corrected }}</b></p>
          <div class="feedback-actions">
            <button class="primary-button compact" type="button" @click="useCorrection">{{ inputMode === 'type' ? 'Use correction' : 'Build corrected sentence' }}</button>
            <button class="secondary-button" type="button" @click="send(feedbackFor, true)">Send anyway</button>
          </div>
        </div>

        <template v-if="inputMode === 'words'">
          <div class="word-answer" :class="{ empty: !pickedTiles.length }">
            <button v-for="tile in pickedTiles" :key="tile.id" type="button" class="word-tile placed" @click="pick(tile.id)">{{ tile.text }}</button>
            <span v-if="!pickedTiles.length">Tap words to build a question…</span>
          </div>
          <div class="word-bank">
            <button v-for="tile in tiles" :key="tile.id" type="button" class="word-tile" :class="{ used: picked.includes(tile.id) }" :disabled="picked.includes(tile.id)" @click="pick(tile.id)">{{ tile.text }}</button>
          </div>
          <div class="compose-actions">
            <button class="secondary-button" type="button" @click="nextTemplate">New question ↻</button>
            <button class="secondary-button" type="button" :disabled="!picked.length" @click="picked = []">Clear</button>
            <button class="primary-button compact" type="button" :disabled="!picked.length || customerTyping" @click="send(builtSentence)">Check & send</button>
          </div>
        </template>

        <template v-else>
          <div class="phrase-ideas"><button v-for="idea in phraseIdeas" :key="idea" type="button" @click="suggest(idea)">{{ idea }}</button></div>
          <form class="type-row" @submit.prevent="send(draft)">
            <input ref="input" v-model="draft" type="text" autocomplete="off" autocapitalize="sentences" spellcheck="false" placeholder="Ask a question, e.g. Do you like sour drinks?" @input="feedback = undefined" />
            <button class="primary-button compact" type="submit" :disabled="!draft.trim() || customerTyping">Check & send</button>
          </form>
        </template>
      </footer>
    </section>
  </div>
</template>
