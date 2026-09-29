import { defineStore } from 'pinia';
import { ref, watch } from 'vue';
import type { LanguageIssue } from '../domain/english/checker';
import type { RuleId } from '../domain/english/rules';
import { PHRASE_GROUPS } from '../domain/english/phrases';

// Lessons are matched ignoring case, punctuation and curly apostrophes.
export const phraseKey = (text: string) => text.toLowerCase().replace(/’/g, "'").replace(/[^a-z0-9' ]+/g, ' ').replace(/\s+/g, ' ').trim();
const LESSON_KEYS = new Map(PHRASE_GROUPS.flatMap((group) => group.lessons.map((lesson) => [phraseKey(lesson.text), lesson.text] as const)));

// English-learning progress, kept apart from the bar economy. Saved on this device.
const STORAGE_KEY = 'barlingo.learning.v1';

export interface MistakeRecord { rule: RuleId; sentence: string; corrected: string; message: string; at: number; }
interface LearningSave {
  savedWords: string[];
  knownWords: string[];
  seenWords: Record<string, number>;
  mistakes: MistakeRecord[];
  ruleCounts: Partial<Record<RuleId, number>>;
  correctSentences: string[];
  usedPhrases?: string[];
}

function load(): LearningSave | undefined {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) as LearningSave : undefined;
  } catch {
    return undefined;
  }
}

export const useLearningStore = defineStore('learning', () => {
  const saved = load();
  const savedWords = ref<string[]>(saved?.savedWords ?? []);
  const knownWords = ref<string[]>(saved?.knownWords ?? []);
  const seenWords = ref<Record<string, number>>(saved?.seenWords ?? {});
  const mistakes = ref<MistakeRecord[]>(saved?.mistakes ?? []);
  const ruleCounts = ref<Partial<Record<RuleId, number>>>(saved?.ruleCounts ?? {});
  const correctSentences = ref<string[]>(saved?.correctSentences ?? []);
  // Phrase lessons the player has used correctly with a real customer.
  const usedPhrases = ref<string[]>(saved?.usedPhrases ?? []);

  watch([savedWords, knownWords, seenWords, mistakes, ruleCounts, correctSentences, usedPhrases], () => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({
        savedWords: savedWords.value, knownWords: knownWords.value, seenWords: seenWords.value,
        mistakes: mistakes.value, ruleCounts: ruleCounts.value, correctSentences: correctSentences.value, usedPhrases: usedPhrases.value
      } satisfies LearningSave));
    } catch { /* storage unavailable: progress lasts for this session only */ }
  }, { deep: true });

  function toggleSaved(word: string) {
    savedWords.value = savedWords.value.includes(word) ? savedWords.value.filter((item) => item !== word) : [word, ...savedWords.value];
  }
  function toggleKnown(word: string) {
    knownWords.value = knownWords.value.includes(word) ? knownWords.value.filter((item) => item !== word) : [...knownWords.value, word];
  }
  function markSeen(words: string[]) {
    for (const word of words) seenWords.value[word] = (seenWords.value[word] ?? 0) + 1;
  }
  function recordMistakes(sentence: string, corrected: string, issues: LanguageIssue[]) {
    const counted = new Set<RuleId>();
    for (const issue of issues) {
      if (!issue.rule || issue.severity !== 'error' || counted.has(issue.rule)) continue;
      counted.add(issue.rule);
      ruleCounts.value[issue.rule] = (ruleCounts.value[issue.rule] ?? 0) + 1;
      mistakes.value.unshift({ rule: issue.rule, sentence, corrected, message: issue.message, at: Date.now() });
    }
    mistakes.value = mistakes.value.slice(0, 60);
  }
  function recordCorrect(sentence: string) {
    if (!correctSentences.value.includes(sentence)) correctSentences.value = [sentence, ...correctSentences.value].slice(0, 40);
  }

  function markPhraseUsed(sentence: string) {
    const key = phraseKey(sentence);
    const lesson = LESSON_KEYS.get(key);
    if (lesson && !usedPhrases.value.includes(lesson)) usedPhrases.value = [...usedPhrases.value, lesson];
  }

  return { savedWords, knownWords, seenWords, mistakes, ruleCounts, correctSentences, usedPhrases, toggleSaved, toggleKnown, markSeen, recordMistakes, recordCorrect, markPhraseUsed };
});
