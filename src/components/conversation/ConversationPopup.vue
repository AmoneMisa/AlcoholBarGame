<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue';
import { CUSTOMER_ART_BY_SLOT } from '../../data/cosmetics/artCatalog';
import { MODIFIERS, RECIPES } from '../../domain/catalog';
import { ALCOHOL_PRODUCTS, ALCOHOL_TYPE_LABELS, bottleTotal } from '../../domain/bottleCatalog';
import { matchesFacts, questionTemplates, tilesFor, correctedTileSelection, TOPIC_LABEL, withArticle } from '../../domain/conversation/customerTalk';
import { bottleFactChips, bottleQuestionTemplates, rankBottles } from '../../domain/conversation/bottleTalk';
import { checkText, useSpeller, type CheckResult } from '../../domain/english/checker';
import { loadSpeller } from '../../domain/english/dictionary';
import { GLOSSARY } from '../../domain/english/lexicon';
import { RULES, type GrammarRule } from '../../domain/english/rules';
import { speak } from '../../domain/english/speak';
import { lookupWord, type VocabEntry } from '../../domain/english/vocabulary';
import { useGameStore } from '../../stores/game';
import { useLearningStore } from '../../stores/learning';
import { useGuide } from '../../composables/useGuide';
import { serviceTemplates } from '../../domain/conversation/serviceTalk';
import { guideIdForProduct } from '../../data/knowledge/alcohol';
import BrandBottle from '../knowledge/BrandBottle.vue';
import { serveTemplates } from '../../domain/brandServe';
import { haptic } from '../../telegram/webapp';
import CharacterModel from '../characters/CharacterModel.vue';
import UiIcon from '../ui/UiIcon.vue';
import CloseButton from '../ui/CloseButton.vue';

const inputMode = ref<'type' | 'words'>('words');

const game = useGameStore();
const learning = useLearningStore();
const { openGuide } = useGuide();
const activeWord = ref<VocabEntry>();
const openRule = ref<string>();
const showAllCards = ref(false);
// Most helpful first: sentence structure, then grammar, spelling, and small punctuation fixes last.
const GROUP_ORDER = ['Word order', 'Questions', 'Verbs', 'Articles & nouns', 'Comparing', 'Spelling & words', 'Punctuation'];
const customer = computed(() => game.customers.find((item) => item.id === game.conversationCustomerId));
const slot = computed(() => Math.max(0, game.customers.findIndex((item) => item.id === customer.value?.id)));
const recipe = computed(() => RECIPES.find((item) => item.id === customer.value?.orderRecipeId));
const modifierLabel = computed(() => MODIFIERS.find((item) => item.id === customer.value?.modifierId)?.label);
// The transcript is part of the game state: the rules (on the server when online) write both sides of it,
// and the guest's hidden order never reaches this screen before it is found out.
const talk = computed(() => customer.value && game.conversations[customer.value.id]);
// The sentence on its way to the server, shown until the answer arrives.
const pending = ref('');
const confirmed = computed(() => !!customer.value?.orderRevealed);
const bottleOrder = computed(() => customer.value?.orderKind === 'bottle');
const conversationRecipes = computed(() => customer.value?.specialRecipeRewardId ? [...game.knownRecipes,...game.lockedRecipes.filter((item) => item.id === customer.value?.specialRecipeRewardId)] : game.knownRecipes);
const candidates = computed(() => conversationRecipes.value.filter((item) => matchesFacts(item, talk.value?.facts ?? [])));
const bottleRecommendations = computed(() => {
  const quantity = talk.value?.bottleFacts.quantity ?? 1;
  return rankBottles(talk.value?.bottleFacts ?? {}, game.guestPriceFactor).filter(({ product }) =>
    (game.bottleInventory.find((stock) => stock.productId === product.id)?.quantity ?? 0) >= quantity
  );
});
const confirmedBottle = computed(() => ALCOHOL_PRODUCTS.find((item) => item.id === customer.value?.selectedBottleId));

const draft = ref('');
const feedback = ref<CheckResult>();
const feedbackFor = ref('');
const customerTyping = ref(false);
const log = ref<HTMLElement>();
const input = ref<HTMLInputElement>();

const templateIndex = ref(0);
// The sentence the current word bank was built from: always reachable with these tiles.
const tileTarget = ref('');
// Order questions plus the service phrase that fits this moment (greeting first, payment and goodbye after the order).
// Brand-call guests (“Jack Daniel’s on the rocks”) know exactly what they want.
const serveOrder = computed(() => customer.value?.orderKind === 'serve' ? customer.value.serveRequest : undefined);
const templates = computed(() => {
  const base = serveOrder.value
    ? serveTemplates(serveOrder.value, game.brandOnShelf).map((text) => ({ text }))
    : bottleOrder.value
      ? bottleQuestionTemplates(talk.value?.bottleFacts ?? {}, bottleRecommendations.value)
      : questionTemplates(talk.value?.facts ?? [], candidates.value);
  const turns = (talk.value?.lines.filter((line) => line.speaker === 'bartender').length ?? 0);
  const service = serviceTemplates(bottleOrder.value ? 'bottle' : 'drink', confirmed.value, turns).map((text) => ({ text }));
  return confirmed.value || turns === 0 ? [...service, ...base] : [...base, ...service];
});
const tiles = ref<{ id: string; text: string }[]>([]);
const picked = ref<string[]>([]);
const pickedTiles = computed(() => picked.value.map((id) => tiles.value.find((tile) => tile.id === id)!).filter(Boolean));
const builtSentence = computed(() => pickedTiles.value.map((tile) => tile.text).join(' ').replace(/\s+([?.!,])/g, '$1'));

function resetTiles() {
  const template = templates.value[templateIndex.value % Math.max(1, templates.value.length)];
  tiles.value = template ? tilesFor(template.text, RECIPES) : [];
  tileTarget.value = template?.text ?? '';
  picked.value = [];
}

// Valid phrases the checker may offer when a sentence is too broken to repair word by word.
function phraseCandidates() {
  const all = templates.value.map((item) => item.text);
  return inputMode.value === 'words' && tileTarget.value ? [tileTarget.value] : all;
}

// New guest lines: remember the words the learner has seen, then scroll.
watch(() => talk.value?.lines.length ?? 0, (_count, before) => {
  for (const line of talk.value?.lines.slice(before ?? 0) ?? []) if (line.speaker === 'customer') noteSeenWords(line.text);
  scrollLog();
}, { immediate: true });

watch(() => customer.value?.id, () => {
  pending.value = '';
  draft.value = '';
  feedback.value = undefined;
  templateIndex.value = 0;
  resetTiles();
  scrollLog();
}, { immediate: true });

function scrollLog() {
  nextTick(() => log.value?.scrollTo({ top: log.value.scrollHeight, behavior: 'smooth' }));
}

// Split a customer line into plain text and dictionary words the learner can tap.
function entryFor(word: string): VocabEntry | undefined {
  const entry = lookupWord(word);
  if (entry) return entry;
  const meaning = GLOSSARY[word.toLowerCase()];
  return meaning ? { word: word.toLowerCase(), ipa: '', pos: 'adjective', topic: 'Taste', level: 'A2', meaning: meaning.charAt(0).toUpperCase() + meaning.slice(1) + '.', example: '' } : undefined;
}
function segments(text: string) {
  return text.split(/(\p{L}+)/u).filter(Boolean).map((part) => ({ part, entry: entryFor(part) }));
}
function noteSeenWords(text: string) {
  learning.markSeen([...new Set(segments(text).map((segment) => segment.entry?.word).filter((word): word is string => !!word))]);
}

// One card per rule, in the order the mistakes appear; hints (unknown words) go last.
function ruleCards(result: CheckResult) {
  const cards: { rule?: GrammarRule; message: string; severity: 'error' | 'hint'; key: string }[] = [];
  const seen = new Set<string>();
  const rank = (issue: CheckResult['issues'][number]) => (issue.severity === 'hint' ? 100 : 0) + (issue.rule ? GROUP_ORDER.indexOf(RULES[issue.rule].group) : 50);
  for (const issue of [...result.issues].sort((a, b) => rank(a) - rank(b))) {
    const key = issue.rule ?? issue.message;
    if (seen.has(key)) continue;
    seen.add(key);
    cards.push({ rule: issue.rule ? RULES[issue.rule] : undefined, message: issue.message, severity: issue.severity, key });
  }
  return cards;
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

async function send(text: string, force = false) {
  const current = customer.value;
  if (!current || !talk.value || customerTyping.value) return;
  const sentence = text.replace(/\s+/g, ' ').trim();
  if (!sentence) return;
  // Instant feedback for learning; the rules re-check the sentence before it counts.
  const result = checkText(sentence, phraseCandidates());
  if (!result.ok && !force) {
    if (feedbackFor.value !== sentence) learning.recordMistakes(sentence, result.corrected, result.issues);
    feedback.value = result;
    feedbackFor.value = sentence;
    openRule.value = undefined;
    showAllCards.value = false;
    haptic('light');
    return;
  }
  if (result.ok) {
    learning.recordCorrect(sentence);
    learning.markPhraseUsed(sentence);
  }
  const wasConfirmed = !!current.orderRevealed;
  draft.value = '';
  feedback.value = undefined;
  picked.value = [];
  pending.value = sentence;
  customerTyping.value = true;
  scrollLog();
  // A short pause keeps the rhythm of a real answer even when the server is fast.
  await Promise.all([game.say(sentence), new Promise((resolve) => window.setTimeout(resolve, 450))]);
  customerTyping.value = false;
  pending.value = '';
  if (customer.value?.id !== current.id) return;
  if (!wasConfirmed && customer.value.orderRevealed) haptic('medium');
  templateIndex.value = 0;
  resetTiles();
  scrollLog();
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
    tileTarget.value = corrected;
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

function completeBottleSale() {
  if (!game.sellBottleToCustomer()) return;
  haptic('medium');
  game.closeConversation();
}

function offerAlternative() {
  const current = customer.value;
  if (!current || !game.offerSimilarOrder(current.id)) return;
  haptic('medium');
  scrollLog();
}

function rejectOrder() {
  const current = customer.value;
  if (!current) return;
  haptic('light');
  game.rejectCustomer(current.id);
}

function bottleStock(productId: string) {
  return game.bottleInventory.find((item) => item.productId === productId)?.quantity ?? 0;
}

const onKey = (event: KeyboardEvent) => {
  if (event.key !== 'Escape') return;
  if (activeWord.value) activeWord.value = undefined;
  else game.closeConversation();
};
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
            <label>Order time <b>{{ game.orderCountdown }} · paused</b></label>
            <label>Your English <b>{{ accuracy }}%</b></label>
          </div>
        </div>
        <CloseButton class="talk-close" label="Close conversation" @click="game.closeConversation()" />
      </header>

      <div class="talk-body">
        <div ref="log" class="talk-log" aria-live="polite">
          <div v-for="line in talk.lines" :key="line.id" class="talk-line" :class="line.speaker">
            <p v-if="line.speaker === 'customer'">
              <template v-for="(segment, index) in segments(line.text)" :key="index">
                <button v-if="segment.entry" type="button" class="gloss" :class="{ saved: learning.savedWords.includes(segment.entry.word) }" :aria-label="`${segment.part}: show meaning`" @click="activeWord = segment.entry">{{ segment.part }}</button>
                <template v-else>{{ segment.part }}</template>
              </template>
            </p>
            <p v-else>{{ line.text }}</p>
            <small v-if="line.speaker === 'bartender'" :class="line.ok ? 'good' : 'fix'">{{ line.ok ? '✓ Correct English' : '✎ ' + line.note }}</small>
          </div>
          <div v-if="pending" class="talk-line bartender"><p>{{ pending }}</p></div>
          <div v-if="customerTyping" class="talk-line customer typing"><p><i></i><i></i><i></i></p></div>
        </div>

        <div v-if="activeWord" class="word-card" role="dialog" :aria-label="`Word: ${activeWord.word}`">
          <header>
            <div>
              <b>{{ activeWord.word }}</b>
              <span v-if="activeWord.ipa" class="ipa">{{ activeWord.ipa }}</span>
              <em>{{ activeWord.pos }} · {{ activeWord.level }}</em>
            </div>
            <button type="button" class="speak-button" aria-label="Listen" @click="speak(activeWord.word)"><UiIcon name="speaker" /></button>
            <CloseButton class="word-card-close" label="Close word card" tone="light" size="sm" @click="activeWord = undefined" />
          </header>
          <p class="word-meaning">{{ activeWord.meaning }}</p>
          <p v-if="activeWord.example" class="word-example">“{{ activeWord.example }}” <button type="button" class="inline-speak-button" aria-label="Listen to example" @click="speak(activeWord.example)"><UiIcon name="speaker" /></button></p>
          <dl>
            <template v-if="activeWord.opposite"><dt>Opposite</dt><dd>{{ activeWord.opposite }}</dd></template>
            <template v-if="activeWord.related?.length"><dt>Related</dt><dd>{{ activeWord.related.join(', ') }}</dd></template>
          </dl>
          <p v-if="activeWord.note" class="word-note">💡 {{ activeWord.note }}</p>
          <button type="button" class="secondary-button" @click="learning.toggleSaved(activeWord.word)">{{ learning.savedWords.includes(activeWord.word) ? '★ Saved to my words' : '☆ Save to my words' }}</button>
        </div>

        <aside class="talk-clues">
          <template v-if="bottleOrder">
            <small>CUSTOMER REQUEST</small>
            <div class="clue-chips">
              <span v-for="fact in bottleFactChips(talk.bottleFacts)" :key="fact" class="yes">✓ {{ fact }}</span>
              <em v-if="!bottleFactChips(talk.bottleFacts).length">Ask how many, total budget, type, flavour, occasion and brand.</em>
            </div>
            <small>BEST STOCKED MATCHES</small>
            <div class="bottle-recommendations">
              <article v-for="match in bottleRecommendations.slice(0, 6)" :key="match.product.id" :class="{ over: match.overBudget }">
                <div class="shop-brand-bottle"><BrandBottle :brand="match.product.brand" :category="guideIdForProduct(match.product)" :color="match.product.color" /></div>
                <div><b>{{ match.product.name }}</b><span>{{ ALCOHOL_TYPE_LABELS[match.product.type] }} · {{ match.product.abv }}% ABV</span><small>{{ match.reasons.slice(0, 2).join(' · ') || 'popular choice' }}</small><em>{{ bottleTotal(match.product, talk.bottleFacts.quantity ?? 1, game.guestPriceFactor) }} coins · {{ bottleStock(match.product.id) }} in stock</em></div>
                <strong>{{ match.score }}%</strong>
                <button type="button" @click="suggest(`Would you like ${match.product.name}?`)">Recommend</button>
                <button type="button" class="bottle-info" :aria-label="`About ${match.product.brand}`" @click="openGuide('ingredient', guideIdForProduct(match.product))">About the brand</button>
              </article>
              <em v-if="!bottleRecommendations.length">No stocked bottle covers the known request.</em>
            </div>
          </template>
          <template v-else>
            <small>WHAT YOU KNOW</small>
            <div class="clue-chips">
              <span v-for="fact in talk.facts" :key="fact.topic" :class="fact.likes ? 'yes' : 'no'">{{ fact.likes ? '✓' : '✗' }} {{ TOPIC_LABEL[fact.topic] }}</span>
              <em v-if="!talk.facts.length">Ask about taste, fruit, strength or bubbles.</em>
            </div>
            <small>POSSIBLE DRINKS</small>
            <div class="clue-drinks">
              <span v-for="item in candidates.slice(0, 6)" :key="item.id" class="drink-option"><button type="button" @click="suggest(`Would you like ${withArticle(item.name)}?`)">{{ item.name }}</button><button type="button" class="drink-info" :aria-label="`About ${item.name}`" @click="openGuide('cocktail', item.id)">i</button></span>
              <em v-if="!candidates.length">No match in your recipe book.</em>
            </div>
          </template>
        </aside>
      </div>

      <div v-if="confirmed" class="talk-confirmed">
        <template v-if="bottleOrder && confirmedBottle && customer.bottleRequest">
          <div><small>SEALED-BOTTLE SALE CONFIRMED</small><b>{{ customer.bottleRequest.quantity }} × {{ confirmedBottle.name }}</b><span>{{ confirmedBottle.volumeMl }} ml · {{ confirmedBottle.abv }}% ABV · total {{ bottleTotal(confirmedBottle, customer.bottleRequest.quantity, game.guestPriceFactor) }} coins</span></div>
          <button class="primary-button" type="button" :disabled="game.serving || bottleStock(confirmedBottle.id) < customer.bottleRequest.quantity" @click="completeBottleSale">Sell full bottle{{ customer.bottleRequest.quantity === 1 ? '' : 's' }} <span>→</span></button>
        </template>
        <template v-else>
          <div v-if="serveOrder"><small>BRAND ORDER</small><b>{{ customer.request.replace(/, please\.$/, '') }}</b><span v-if="!game.brandOnShelf(serveOrder.productId)" class="serve-missing">Not on your shelf — offer another brand of the same spirit.</span></div>
          <div v-else><small>ORDER CONFIRMED</small><b>{{ recipe?.name }}<template v-if="modifierLabel"> · {{ modifierLabel }}</template></b></div>
          <button class="primary-button" type="button" @click="startMixing">Start mixing <span>→</span></button>
        </template>
      </div>

      <div class="service-decisions">
        <div><small>CAN’T SERVE THIS ORDER?</small><span>The guest can accept the closest stocked alternative, or you can decline the order and let them leave.</span></div>
        <button class="secondary-button" type="button" @click="offerAlternative">Offer similar</button>
        <button class="reject-order-button" type="button" @click="rejectOrder">Reject order</button>
      </div>

      <footer class="talk-compose">
        <nav class="talk-modes" aria-label="Answer mode">
          <button type="button" :class="{ active: inputMode === 'words' }" @click="inputMode = 'words'; feedback = undefined">Choose words</button>
          <button type="button" :class="{ active: inputMode === 'type' }" @click="inputMode = 'type'; feedback = undefined">Type yourself</button>
        </nav>

        <div v-if="feedback" class="talk-feedback">
          <p class="feedback-sentence"><template v-for="(part, index) in highlighted(feedback, feedbackFor)" :key="index"><mark v-if="part.issue">{{ part.text }}</mark><template v-else>{{ part.text }}</template></template></p>
          <ol class="rule-cards">
            <li v-for="card in ruleCards(feedback).slice(0, showAllCards ? undefined : 3)" :key="card.key" :class="card.severity">
              <div class="rule-head">
                <span class="rule-level" v-if="card.rule">{{ card.rule.level }}</span>
                <b>{{ card.rule?.title ?? 'Note' }}</b>
                <button v-if="card.rule" type="button" class="why-button" :aria-expanded="openRule === card.key" @click="openRule = openRule === card.key ? undefined : card.key">{{ openRule === card.key ? 'Hide' : 'Why?' }}</button>
              </div>
              <p class="rule-message">{{ card.message }}</p>
              <div v-if="card.rule && openRule === card.key" class="rule-explain">
                <p>{{ card.rule.explain }}</p>
                <p v-if="card.rule.pattern" class="rule-pattern"><span>Pattern</span>{{ card.rule.pattern }}</p>
                <div v-for="example in card.rule.examples.slice(0, 2)" :key="example.wrong" class="rule-example"><s>{{ example.wrong }}</s><b>{{ example.right }}</b></div>
                <p class="rule-tip">💡 {{ card.rule.tip }}</p>
              </div>
            </li>
          </ol>
          <button v-if="!showAllCards && ruleCards(feedback).length > 3" type="button" class="more-fixes" @click="showAllCards = true">Show {{ ruleCards(feedback).length - 3 }} smaller {{ ruleCards(feedback).length - 3 === 1 ? 'fix' : 'fixes' }} ▾</button>
          <p v-if="feedback.corrected !== feedbackFor" class="feedback-fix">{{ feedback.reliable ? 'Correct' : 'Try' }}: <b>{{ feedback.corrected }}</b></p>
          <p v-else class="feedback-fix">Rebuild the sentence: start with “Do you …” or “Would you …”.</p>
          <div class="feedback-actions">
            <button v-if="feedback.corrected !== feedbackFor" class="primary-button compact" type="button" @click="useCorrection">{{ inputMode === 'type' ? 'Use correction' : 'Build corrected sentence' }}</button>
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
