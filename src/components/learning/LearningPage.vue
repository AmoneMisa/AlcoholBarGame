<script setup lang="ts">
import { computed, ref } from 'vue';
import { CONTEXT_LABEL, PHRASE_GROUPS, ROLE_LABEL, type WorkContext } from '../../domain/english/phrases';
import { RULE_GROUPS, RULES, type RuleGroup, type RuleId } from '../../domain/english/rules';
import { speak } from '../../domain/english/speak';
import { TOPIC_CONTEXT, VOCAB_TOPICS, VOCABULARY, type VocabEntry, type VocabTopic } from '../../domain/english/vocabulary';
import { useLearningStore } from '../../stores/learning';
import { useGameStore } from '../../stores/game';
import { useGuide } from '../../composables/useGuide';
import { guideFor } from '../../data/knowledge/guides';
import { INGREDIENT_GUIDES, KIND_LABEL } from '../../data/knowledge/ingredients';
import { BRANDS, EXTRA_ALCOHOL_GUIDES } from '../../data/knowledge/alcohol';
import { INGREDIENTS, RECIPES } from '../../domain/catalog';
import UiIcon from '../ui/UiIcon.vue';

const learning = useLearningStore();
const game = useGameStore();
const { openGuide } = useGuide();
const ingredientGroups = computed(() => (['spirit', 'liqueur', 'wine', 'mixer', 'fresh', 'garnish'] as const).map((kind) => ({
  kind, label: KIND_LABEL[kind], items: INGREDIENTS.filter((item) => INGREDIENT_GUIDES[item.id]?.kind === kind)
})).filter((group) => group.items.length));
type Tab = 'daily' | 'words' | 'phrases' | 'grammar' | 'guide' | 'mistakes' | 'practice';
const tab = ref<Tab>('daily');
const tabs: { id: Tab; label: string; hint: string }[] = [
  { id: 'daily', label: 'Daily', hint: 'XP, crystals & streak' },
  { id: 'words', label: 'Words', hint: 'Bar vocabulary' },
  { id: 'phrases', label: 'Phrases', hint: 'Questions to ask' },
  { id: 'grammar', label: 'Grammar', hint: 'Rules explained' },
  { id: 'guide', label: 'Drinks guide', hint: 'History & why choose' },
  { id: 'mistakes', label: 'My mistakes', hint: 'Learn from them' },
  { id: 'practice', label: 'Practice', hint: 'Flashcards' }
];
const dailyChoice = ref<Record<string, string>>({});
const lessonDone = (id: string) => game.dailyLessonCompletedIds.includes(id);
function submitDailyLesson(id: string) {
  const answer = dailyChoice.value[id];
  if (answer) game.completeDailyLesson(id, answer);
}

// Job: bartender, shop seller, or both. Filters words, phrases and flashcards.
const job = ref<WorkContext | 'all'>('all');
const jobs: { id: WorkContext | 'all'; label: string; hint: string }[] = [
  { id: 'all', label: 'Everything', hint: 'Bar, shop and suppliers' },
  { id: 'bar', label: CONTEXT_LABEL.bar, hint: 'Serve drinks, talk to guests' },
  { id: 'shop', label: CONTEXT_LABEL.shop, hint: 'Sell products, take payment' },
  { id: 'buyer', label: CONTEXT_LABEL.buyer, hint: 'Order, receive, get discounts' }
];
const inJob = (topicName: VocabTopic) => job.value === 'all' || TOPIC_CONTEXT[topicName] === 'both' || TOPIC_CONTEXT[topicName] === job.value;
const topics = computed(() => VOCAB_TOPICS.filter(inJob));
const vocabulary = computed(() => VOCABULARY.filter((entry) => inJob(entry.topic)));
const phraseGroups = computed(() => PHRASE_GROUPS.filter((group) => job.value === 'all' || group.context === job.value));
function selectJob(id: WorkContext | 'all') {
  job.value = id;
  if (topic.value !== 'all' && topic.value !== 'saved' && !inJob(topic.value)) topic.value = 'all';
  cardIndex.value = 0;
  revealed.value = false;
}

// Words
const topic = ref<VocabTopic | 'all' | 'saved'>('all');
const search = ref('');
const words = computed(() => vocabulary.value.filter((entry) => {
  if (topic.value === 'saved' && !learning.savedWords.includes(entry.word)) return false;
  if (topic.value !== 'all' && topic.value !== 'saved' && entry.topic !== topic.value) return false;
  const query = search.value.trim().toLowerCase();
  return !query || entry.word.includes(query) || entry.meaning.toLowerCase().includes(query);
}));
const knownCount = computed(() => vocabulary.value.filter((entry) => learning.knownWords.includes(entry.word)).length);

// Grammar
const ruleGroup = ref<RuleGroup | 'all' | 'focus'>('all');
const focusRule = ref<RuleId>();
const rules = computed(() => {
  const list = Object.values(RULES).filter((rule) => rule.id !== 'empty');
  if (ruleGroup.value === 'focus') return list.filter((rule) => learning.ruleCounts[rule.id]).sort((a, b) => (learning.ruleCounts[b.id] ?? 0) - (learning.ruleCounts[a.id] ?? 0));
  return ruleGroup.value === 'all' ? list : list.filter((rule) => rule.group === ruleGroup.value);
});
const topMistake = computed(() => {
  const entries = Object.entries(learning.ruleCounts) as [RuleId, number][];
  const top = entries.sort((a, b) => b[1] - a[1])[0];
  return top ? RULES[top[0]] : undefined;
});
function openRule(id: RuleId) {
  ruleGroup.value = 'all';
  focusRule.value = id;
  tab.value = 'grammar';
  requestAnimationFrame(() => document.getElementById(`rule-${id}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' }));
}

// Practice: saved words first, then words you don't know yet.
const deck = computed<VocabEntry[]>(() => {
  const saved = vocabulary.value.filter((entry) => learning.savedWords.includes(entry.word) && !learning.knownWords.includes(entry.word));
  const rest = vocabulary.value.filter((entry) => !learning.savedWords.includes(entry.word) && !learning.knownWords.includes(entry.word));
  return [...saved, ...rest];
});
const cardIndex = ref(0);
const revealed = ref(false);
const card = computed(() => deck.value.length ? deck.value[cardIndex.value % deck.value.length] : undefined);
function nextCard(known: boolean) {
  if (card.value && known) learning.toggleKnown(card.value.word);
  else cardIndex.value++;
  revealed.value = false;
}

function when(at: number) {
  const minutes = Math.round((Date.now() - at) / 60000);
  if (minutes < 1) return 'just now';
  if (minutes < 60) return `${minutes} min ago`;
  const hours = Math.round(minutes / 60);
  return hours < 24 ? `${hours} h ago` : `${Math.round(hours / 24)} d ago`;
}
</script>

<template>
  <section class="learning-page game-panel">
    <header class="learning-hero">
      <div>
        <small>ENGLISH ACADEMY</small>
        <h2>English for the bar, the shop and your suppliers</h2>
        <p>Learn the words and phrases you need behind the bar, at the shop counter and on the phone with suppliers — checking ID, taking bookings, serving guests, receiving deliveries, setting up regular orders and asking for discounts. Learn it here, then use it with your customers and sellers.</p>
      </div>
      <dl class="learning-stats">
        <div><dt>Words known</dt><dd>{{ knownCount }}<span>/ {{ vocabulary.length }}</span></dd><i :style="{ width: knownCount / Math.max(1, vocabulary.length) * 100 + '%' }"></i></div>
        <div><dt>Saved words</dt><dd>{{ learning.savedWords.length }}</dd></div>
        <div><dt>Correct sentences</dt><dd>{{ learning.correctSentences.length }}</dd></div>
        <div v-if="topMistake" class="stat-focus"><dt>Practise next</dt><dd><button type="button" @click="openRule(topMistake.id)">{{ topMistake.title }} →</button></dd></div>
      </dl>
    </header>

    <div class="job-switch" role="group" aria-label="Choose your job">
      <button v-for="item in jobs" :key="item.id" type="button" :class="{ active: job === item.id }" :aria-pressed="job === item.id" @click="selectJob(item.id)"><b>{{ item.label }}</b><small>{{ item.hint }}</small></button>
    </div>

    <nav class="learning-tabs" aria-label="Learning sections">
      <button v-for="item in tabs" :key="item.id" type="button" :class="{ active: tab === item.id }" @click="tab = item.id">
        <b>{{ item.label }}</b><small>{{ item.hint }}</small>
        <em v-if="item.id === 'mistakes' && learning.mistakes.length">{{ learning.mistakes.length }}</em>
      </button>
    </nav>

    <!-- DAILY LESSONS -->
    <div v-if="tab === 'daily'" class="learning-body daily-learning">
      <header class="daily-learning-head">
        <div><small>EVERYDAY PRACTICE</small><h3>Three quick lessons</h3><p>Finish today’s set to keep your learning streak. Every correct answer gives XP and crystals; a completed set has a 6% chance to drop a random recipe card.</p></div>
        <div class="learning-streak-card"><small>LEARNING STREAK</small><b>{{ game.learningStreak }} day{{ game.learningStreak === 1 ? '' : 's' }}</b><span>Today’s reward bonus: +{{ game.learningBonusPercent }}%</span></div>
      </header>
      <div class="daily-lesson-progress" :style="{ '--daily-progress': `${game.dailyLessonCompletedIds.length / game.dailyLessons.length * 100}%` }"><span>{{ game.dailyLessonCompletedIds.length }} / {{ game.dailyLessons.length }} complete</span><i></i></div>
      <div class="daily-lesson-grid">
        <article v-for="(lesson,index) in game.dailyLessons" :key="lesson.id" class="daily-lesson-card" :class="{ complete: lessonDone(lesson.id) }">
          <header><span>{{ index + 1 }}</span><div><small>{{ lesson.kind }}</small><b>{{ lesson.prompt }}</b></div><em v-if="lessonDone(lesson.id)">✓ DONE</em></header>
          <div class="daily-choices">
            <button v-for="choice in lesson.choices" :key="choice" type="button" :class="{ selected: dailyChoice[lesson.id] === choice }" :disabled="lessonDone(lesson.id)" @click="dailyChoice[lesson.id] = choice">{{ choice }}</button>
          </div>
          <p v-if="lessonDone(lesson.id)" class="daily-explanation">{{ lesson.explanation }}</p>
          <footer><span>+{{ Math.round(lesson.xp * (1 + game.learningBonusPercent / 100)) }} XP · +{{ Math.round(lesson.crystals * (1 + game.learningBonusPercent / 100)) }} ◆</span><button type="button" :disabled="lessonDone(lesson.id) || !dailyChoice[lesson.id]" @click="submitDailyLesson(lesson.id)">{{ lessonDone(lesson.id) ? 'Reward claimed' : 'Check answer' }}</button></footer>
        </article>
      </div>
      <p class="daily-result" aria-live="polite">{{ game.dailyLessonResult }}</p>
    </div>

    <!-- WORDS -->
    <div v-else-if="tab === 'words'" class="learning-body">
      <div class="learning-filters">
        <button type="button" :class="{ active: topic === 'all' }" @click="topic = 'all'">All</button>
        <button v-for="item in topics" :key="item" type="button" :class="{ active: topic === item }" @click="topic = item">{{ item }}</button>
        <button type="button" :class="{ active: topic === 'saved' }" @click="topic = 'saved'">★ Saved ({{ learning.savedWords.length }})</button>
        <input v-model="search" type="search" placeholder="Search a word or meaning…" aria-label="Search words" />
      </div>
      <div class="vocab-grid">
        <article v-for="entry in words" :key="entry.word" class="vocab-card" :class="{ known: learning.knownWords.includes(entry.word) }">
          <header>
            <div><h3>{{ entry.word }}</h3><span class="ipa">{{ entry.ipa }}</span></div>
            <button type="button" class="speak-button" :aria-label="`Listen to ${entry.word}`" @click="speak(entry.word)"><UiIcon name="speaker" /></button>
          </header>
          <p class="vocab-tags"><span>{{ entry.pos }}</span><span>{{ entry.level }}</span><span v-if="learning.seenWords[entry.word]" class="seen">met {{ learning.seenWords[entry.word] }}×</span></p>
          <p class="vocab-meaning">{{ entry.meaning }}</p>
          <p class="vocab-example">“{{ entry.example }}” <button type="button" class="inline-speak-button" aria-label="Listen to example" @click="speak(entry.example)"><UiIcon name="speaker" /></button></p>
          <dl v-if="entry.opposite || entry.related?.length">
            <template v-if="entry.opposite"><dt>≠</dt><dd>{{ entry.opposite }}</dd></template>
            <template v-if="entry.related?.length"><dt>≈</dt><dd>{{ entry.related.join(', ') }}</dd></template>
          </dl>
          <p v-if="entry.note" class="vocab-note">💡 {{ entry.note }}</p>
          <footer>
            <button type="button" :class="{ on: learning.savedWords.includes(entry.word) }" @click="learning.toggleSaved(entry.word)">{{ learning.savedWords.includes(entry.word) ? '★ Saved' : '☆ Save' }}</button>
            <button type="button" :class="{ on: learning.knownWords.includes(entry.word) }" @click="learning.toggleKnown(entry.word)">{{ learning.knownWords.includes(entry.word) ? '✓ I know it' : 'Mark as known' }}</button>
          </footer>
        </article>
        <p v-if="!words.length" class="learning-empty">{{ topic === 'saved' ? 'No saved words yet. Tap ☆ on a word — or tap an underlined word in a conversation.' : 'No words match your search.' }}</p>
      </div>
    </div>

    <!-- PHRASES -->
    <div v-else-if="tab === 'phrases'" class="learning-body phrase-groups">
      <p class="learning-lead">Every sentence is built from the same few blocks. The colours show the role of every part — notice how the <b class="role-helper">helper verb</b> always comes before the <b class="role-person">person</b> in a question.</p>
      <section v-for="group in phraseGroups" :key="group.id" class="phrase-group">
        <header><span class="job-tag" :class="group.context">{{ CONTEXT_LABEL[group.context] }}</span><span class="phrase-progress">{{ group.lessons.filter((lesson) => learning.usedPhrases.includes(lesson.text)).length }} / {{ group.lessons.length }} used with customers</span><h3>{{ group.title }}</h3><p>{{ group.goal }}</p></header>
        <article v-for="lesson in group.lessons" :key="lesson.text" class="phrase-card" :class="{ used: learning.usedPhrases.includes(lesson.text) }">
          <p v-if="learning.usedPhrases.includes(lesson.text)" class="phrase-used">✓ You used this with a customer</p>
          <div class="phrase-line">
            <span v-for="(part, index) in lesson.parts" :key="index" class="phrase-part" :class="`role-${part.role}`"><b>{{ part.text }}</b><small>{{ ROLE_LABEL[part.role] }}</small></span>
            <button type="button" class="speak-button" aria-label="Listen" @click="speak(lesson.text)"><UiIcon name="speaker" /></button>
          </div>
          <p class="phrase-when"><span>When</span>{{ lesson.when }}</p>
          <p class="phrase-answers"><span>Guest may say</span><i v-for="answer in lesson.answers" :key="answer">“{{ answer }}”</i></p>
          <p v-if="lesson.swap" class="phrase-swap"><span>Change it</span>{{ lesson.swap }}</p>
        </article>
      </section>
    </div>

    <!-- GRAMMAR -->
    <div v-else-if="tab === 'grammar'" class="learning-body">
      <div class="learning-filters">
        <button type="button" :class="{ active: ruleGroup === 'all' }" @click="ruleGroup = 'all'">All rules</button>
        <button v-if="Object.keys(learning.ruleCounts).length" type="button" :class="{ active: ruleGroup === 'focus' }" @click="ruleGroup = 'focus'">🎯 My focus</button>
        <button v-for="group in RULE_GROUPS" :key="group" type="button" :class="{ active: ruleGroup === group }" @click="ruleGroup = group">{{ group }}</button>
      </div>
      <div class="rule-grid">
        <article v-for="rule in rules" :id="`rule-${rule.id}`" :key="rule.id" class="rule-card" :class="{ focus: focusRule === rule.id }">
          <header><span class="rule-level">{{ rule.level }}</span><h3>{{ rule.title }}</h3><em v-if="learning.ruleCounts[rule.id]">{{ learning.ruleCounts[rule.id] }}× in your sentences</em></header>
          <p>{{ rule.explain }}</p>
          <p v-if="rule.pattern" class="rule-pattern"><span>Pattern</span>{{ rule.pattern }}</p>
          <div v-for="example in rule.examples" :key="example.wrong" class="rule-example"><s>{{ example.wrong }}</s><b>{{ example.right }}</b></div>
          <p class="rule-tip">💡 {{ rule.tip }}</p>
        </article>
      </div>
    </div>

    <!-- DRINKS GUIDE -->
    <div v-else-if="tab === 'guide'" class="learning-body guide-library">
      <p class="learning-lead">The full story of every drink and bottle in your bar: where it comes from, how it is made, why bartenders prepare it that way, and when to recommend it. Great material for talking to guests and customers.</p>
      <section>
        <h3>Cocktails</h3>
        <div class="guide-cards">
          <button v-for="recipe in RECIPES" :key="recipe.id" type="button" class="guide-card" @click="openGuide('cocktail', recipe.id)">
            <small>{{ guideFor(recipe).preparation.technique }} · {{ guideFor(recipe).strength }}</small>
            <b>{{ recipe.name }}</b>
            <span>{{ recipe.story }}</span>
          </button>
        </div>
      </section>
      <section>
        <h3>More liqueurs (shop)</h3>
        <div class="guide-cards">
          <button v-for="item in Object.values(EXTRA_ALCOHOL_GUIDES)" :key="item.id" type="button" class="guide-card" @click="openGuide('ingredient', item.id)">
            <b>{{ item.name }}</b>
            <span>{{ item.summary }}</span>
            <small>{{ BRANDS[item.id]!.slice(0, 3).map((brand) => brand.name).join(' · ') }}…</small>
          </button>
        </div>
      </section>
      <section v-for="group in ingredientGroups" :key="group.kind">
        <h3>{{ group.label }}</h3>
        <div class="guide-cards">
          <button v-for="item in group.items" :key="item.id" type="button" class="guide-card" @click="openGuide('ingredient', item.id)">
            <b>{{ item.name }}</b>
            <span>{{ INGREDIENT_GUIDES[item.id]?.summary }}</span>
            <small v-if="BRANDS[item.id]?.length">{{ BRANDS[item.id]!.slice(0, 3).map((brand) => brand.name).join(' · ') }}…</small>
          </button>
        </div>
      </section>
    </div>

    <!-- (other liqueur types sold in the shop are listed inside the guide tab below) -->
    <!-- MISTAKES -->
    <div v-else-if="tab === 'mistakes'" class="learning-body">
      <p v-if="!learning.mistakes.length" class="learning-empty">No mistakes yet! When the checker corrects one of your sentences, it appears here with an explanation, so you can review it later.</p>
      <ul v-else class="mistake-list">
        <li v-for="item in learning.mistakes" :key="item.at + item.rule">
          <div class="mistake-sentences"><s>{{ item.sentence }}</s><b>{{ item.corrected }}</b></div>
          <p>{{ item.message }}</p>
          <footer><button type="button" @click="openRule(item.rule)">{{ RULES[item.rule].title }} — read the rule →</button><time>{{ when(item.at) }}</time></footer>
        </li>
      </ul>
    </div>

    <!-- PRACTICE -->
    <div v-else class="learning-body practice">
      <p class="learning-lead">Look at the word. Say what it means — out loud! Then turn the card. Saved words come first.</p>
      <div v-if="card" class="flashcard" :class="{ revealed }" role="button" tabindex="0" @click="revealed = true" @keydown.enter="revealed = true">
        <small>{{ card.topic }} · {{ card.level }}</small>
        <h3>{{ card.word }}</h3>
        <span class="ipa">{{ card.ipa }}</span>
        <template v-if="revealed">
          <p class="vocab-meaning">{{ card.meaning }}</p>
          <p class="vocab-example">“{{ card.example }}”</p>
        </template>
        <em v-else>Tap to see the meaning</em>
      </div>
      <p v-else class="learning-empty">🎉 You marked every word as known. Great work!</p>
      <div v-if="card" class="practice-actions">
        <button type="button" class="secondary-button listen-button" @click="speak(card.word)"><UiIcon name="speaker" />Listen</button>
        <button type="button" class="secondary-button" @click="nextCard(false)">Again later</button>
        <button type="button" class="primary-button" :disabled="!revealed" @click="nextCard(true)">I knew it ✓</button>
      </div>
      <p class="practice-count">{{ deck.length }} words left to learn</p>
    </div>
  </section>
</template>
