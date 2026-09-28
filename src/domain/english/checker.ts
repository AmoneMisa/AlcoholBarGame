import type { Speller } from './dictionary';
import { BASE_FORM, IRREGULAR, LEXICON, SHORT_COMPARATIVES, THIRD_PERSON } from './lexicon';
import { startsWithVowelSound } from './articles';

// Rule-based lexis + grammar checker for short bar conversations.
// It is deliberately explainable: every issue says what is wrong, why, and offers a fix.

export type IssueKind = 'spelling' | 'grammar' | 'punctuation' | 'word';
export interface LanguageIssue {
  kind: IssueKind;
  severity: 'error' | 'hint';
  message: string;
  original: string;
  suggestion: string;
  start: number;
  end: number;
}
export interface CheckResult {
  ok: boolean;
  issues: LanguageIssue[];
  corrected: string;
  isQuestion: boolean;
}

interface Token { text: string; lower: string; start: number; end: number; word: boolean; }
interface Edit { start: number; end: number; text: string; }

const TOKEN_RE = /[\p{L}]+(?:['’][\p{L}]+)?|\d+|&|[?.!,;:]/gu;
const AUXILIARIES = new Set(['do', 'does', 'did', 'am', 'is', 'are', 'was', 'were', 'can', 'could', 'will', 'would', 'shall', 'should', 'may', 'might', 'must', 'have', 'has']);
const MODALS = new Set(['can', 'could', 'will', 'would', 'shall', 'should', 'may', 'might', 'must']);
const WH_WORDS = new Set(['what', 'which', 'who', 'where', 'when', 'why', 'how', 'whose']);
const THIRD_SUBJECTS = new Set(['he', 'she', 'it', 'something', 'everything', 'nothing', 'anything', 'someone', 'everyone', 'somebody', 'nobody']);
const PLURAL_SUBJECTS = new Set(['i', 'you', 'we', 'they']);
const OBJECT_PRONOUNS = new Set(['me', 'you', 'him', 'her', 'us', 'them', 'it']);
const ADVERBS = new Set(['really', 'usually', 'also', 'often', 'always', 'never', 'just', 'sometimes', 'still', 'only']);
const DETERMINERS = new Set(['a', 'an', 'the', 'this', 'that', 'my', 'your', 'his', 'her', 'our', 'their', 'its', 'another', 'one', 'some', 'any', 'every', 'each', 'no', 'which', 'what']);
const COUNTABLE = new Set(['drink', 'cocktail', 'mocktail', 'glass', 'bottle', 'recommendation', 'idea', 'suggestion', 'slice', 'straw', 'question', 'shot', 'wedge']);
const ARTICLE_TRIGGERS = new Set(['like', 'want', 'recommend', 'try', 'have', 'prefer', 'need', 'for', 'with', 'order', 'suggest', 'make', 'get', 'is', 'take']);
const TO_VERBS = new Set(['try', 'taste', 'drink', 'order', 'have', 'see', 'get', 'eat', 'relax', 'feel', 'celebrate', 'know']);
const CAUSATIVES = new Set(['make', 'makes', 'made', 'let', 'lets', 'help', 'helps', 'have', 'has']);
const LIKE_VERBS = new Set(['like', 'likes', 'love', 'loves', 'hate', 'hates', 'prefer', 'prefers', 'enjoy', 'enjoys']);
const RELATIVE_HEADS = new Set(['something', 'anything', 'drink', 'cocktail', 'one', 'everything', 'nothing']);
const ADJECTIVES = new Set(['sweet', 'sour', 'bitter', 'strong', 'light', 'fresh', 'cold', 'dry', 'fruity', 'creamy', 'good', 'nice', 'big', 'small', 'new', 'classic', 'special', 'simple', 'tropical', 'sparkling', 'refreshing', 'different', 'popular', 'spicy', 'mild', 'cool', 'long', 'short', 'soft', 'rich', 'great', 'perfect', 'favourite', 'favorite', 'another', 'other', 'second']);

// "this/that" + these verbs is a subject + verb; other words after "this" are usually nouns ("this drink").
const DEMONSTRATIVE_VERBS = new Set(['sound', 'seem', 'look', 'make', 'have', 'feel']);
const WORD_ALIASES: Record<string, string> = { 'don’t': "don't" };

function norm(text: string) { return text.toLowerCase().replace(/’/g, "'"); }
function matchCase(original: string, replacement: string) {
  return /^\p{Lu}/u.test(original) ? replacement.charAt(0).toUpperCase() + replacement.slice(1) : replacement;
}

export function tokenize(text: string): Token[] {
  const tokens: Token[] = [];
  for (const match of text.matchAll(TOKEN_RE)) {
    const value = match[0];
    tokens.push({ text: value, lower: WORD_ALIASES[norm(value)] ?? norm(value), start: match.index!, end: match.index! + value.length, word: /[\p{L}\d]/u.test(value) });
  }
  return tokens;
}

// Accept inflected forms of lexicon words.
export function isKnownWord(raw: string) {
  const word = norm(raw).replace(/'s$/, '');
  if (/^\d+$/.test(word) || LEXICON.has(word) || IRREGULAR[word] || BASE_FORM[word]) return true;
  const candidates = [
    word.replace(/ies$/, 'y'), word.replace(/es$/, ''), word.replace(/s$/, ''),
    word.replace(/ied$/, 'y'), word.replace(/ed$/, ''), word.replace(/d$/, ''), word.replace(/(.)\1ed$/, '$1'),
    word.replace(/ing$/, ''), word.replace(/ing$/, 'e'), word.replace(/(.)\1ing$/, '$1'),
    word.replace(/ier$/, 'y'), word.replace(/iest$/, 'y'), word.replace(/er$/, ''), word.replace(/est$/, ''), word.replace(/r$/, ''), word.replace(/st$/, ''),
    word.replace(/(.)\1er$/, '$1'), word.replace(/ily$/, 'y'), word.replace(/ly$/, ''), word.replace(/ness$/, '')
  ];
  return candidates.some((candidate) => candidate !== word && candidate.length > 1 && LEXICON.has(candidate));
}

function distance(a: string, b: string) {
  const rows = Array.from({ length: a.length + 1 }, (_, i) => [i, ...Array(b.length).fill(0)] as number[]);
  for (let j = 1; j <= b.length; j++) rows[0]![j] = j;
  for (let i = 1; i <= a.length; i++) {
    for (let j = 1; j <= b.length; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      rows[i]![j] = Math.min(rows[i - 1]![j]! + 1, rows[i]![j - 1]! + 1, rows[i - 1]![j - 1]! + cost);
      if (i > 1 && j > 1 && a[i - 1] === b[j - 2] && a[i - 2] === b[j - 1]) rows[i]![j] = Math.min(rows[i]![j]!, rows[i - 2]![j - 2]! + 1);
    }
  }
  return rows[a.length]![b.length]!;
}

const SUGGESTION_POOL = [...LEXICON].filter((word) => !word.includes("'"));
export function suggestWord(raw: string) {
  const word = norm(raw);
  const limit = word.length <= 4 ? 1 : 2;
  let best: string | undefined;
  let bestScore = Infinity;
  for (const candidate of SUGGESTION_POOL) {
    if (Math.abs(candidate.length - word.length) > limit) continue;
    const score = distance(word, candidate) + (candidate[0] === word[0] ? 0 : .5);
    if (score < bestScore) { bestScore = score; best = candidate; }
  }
  return best && bestScore <= limit ? best : undefined;
}

// A full dictionary (Hunspell) widens the vocabulary; without it the built-in lexicon is used.
let speller: Speller | undefined;
export function useSpeller(value: Speller | undefined) { speller = value; }

function knownAnywhere(token: Token) {
  if (isKnownWord(token.lower)) return true;
  return !!speller && (speller.correct(token.text.replace(/’/g, "'")) || speller.correct(token.lower));
}

function bestSuggestion(token: Token) {
  // Bar vocabulary first (short, relevant words), then the full dictionary.
  const local = suggestWord(token.lower);
  if (local || !speller) return local;
  return speller.suggest(token.lower).find((word) => !/[\s-]/.test(word))?.toLowerCase();
}

export function checkSentence(input: string): CheckResult {
  const text = input.replace(/\s+/g, ' ').trim();
  const issues: LanguageIssue[] = [];
  const edits: Edit[] = [];
  const tokens = tokenize(text);
  const words = tokens.filter((token) => token.word);
  if (!words.length) return { ok: false, issues: [{ kind: 'word', severity: 'error', message: 'Write a short sentence first.', original: '', suggestion: '', start: 0, end: 0 }], corrected: text, isQuestion: false };

  const add = (kind: IssueKind, message: string, from: Token, to: Token, suggestion: string, severity: 'error' | 'hint' = 'error') => {
    const original = text.slice(from.start, to.end);
    if (edits.some((edit) => from.start < edit.end && to.end > edit.start)) return;
    issues.push({ kind, severity, message, original, suggestion, start: from.start, end: to.end });
    if (severity === 'error') edits.push({ start: from.start, end: to.end, text: suggestion });
  };
  const at = (index: number) => words[index];
  const lowerAt = (index: number) => words[index]?.lower ?? '';

  // Spelling / vocabulary.
  for (const token of words) {
    if (token.lower === 'i' || knownAnywhere(token)) continue;
    const suggestion = bestSuggestion(token);
    if (suggestion) {
      add('spelling', `Did you mean “${suggestion}” instead of “${token.text}”?`, token, token, matchCase(token.text, suggestion),speller ? 'error' : 'hint');
      // Grammar rules below read the intended word, so one typo does not hide a second mistake.
      if (speller) token.lower = suggestion;
    }
    else add('word', `I don’t know the word “${token.text}”. Try a simpler bar word.`, token, token, token.text, 'hint');
  }

  const first = lowerAt(0);
  const hasQuestionMark = tokens.some((token) => token.text === '?');
  // An auxiliary alone is not a question ("Have a nice day.", "Do not worry.").
  const auxFirst = (AUXILIARIES.has(first) || first === "don't" || first === "doesn't") && ['i','you','he','she','it','we','they','this','that','there'].includes(lowerAt(1));
  const isQuestion = auxFirst || WH_WORDS.has(first) || hasQuestionMark;

  for (let i = 0; i < words.length; i++) {
    const word = words[i]!;
    const prev = lowerAt(i - 1);
    const next = at(i + 1);

    // Pronoun I is always capital.
    if (word.text === 'i') add('grammar', 'The pronoun “I” is always a capital letter.', word, word, 'I');

    // Repeated word.
    if (next && next.lower === word.lower && !['that', 'very'].includes(word.lower)) add('grammar', `“${word.text}” is repeated.`, word, next, word.text);

    // a / an.
    if ((word.lower === 'a' || word.lower === 'an') && next && /^\p{L}/u.test(next.text)) {
      const needsAn = startsWithVowelSound(next.text);
      if (word.lower === 'a' && needsAn) add('grammar', `Use “an” before a vowel sound: “an ${next.text}”.`, word, word, matchCase(word.text, 'an'));
      if (word.lower === 'an' && !needsAn) add('grammar', `Use “a” before a consonant sound: “a ${next.text}”.`, word, word, matchCase(word.text, 'a'));
    }

    // "I am agree" -> "I agree".
    if ((word.lower === 'am' || word.lower === 'is' || word.lower === 'are') && next?.lower === 'agree') add('grammar', '“Agree” is a verb. Say “I agree”, not “I am agree”.', word, next, 'agree');

    // Do/does agreement with the subject.
    if ((word.lower === 'does' || word.lower === 'doesn\'t') && next && PLURAL_SUBJECTS.has(next.lower)) add('grammar', `With “${next.text}”, use “do”.`, word, word, matchCase(word.text, word.lower === 'does' ? 'do' : "don't"));
    if ((word.lower === 'do' || word.lower === 'don\'t') && next && ['he', 'she', 'it'].includes(next.lower) && (i === 0 || WH_WORDS.has(prev) || word.lower === "don't")) add('grammar', `With “${next.text}”, use “does”.`, word, word, matchCase(word.text, word.lower === 'do' ? 'does' : "doesn't"));

    // Auxiliary / modal + subject + verb-s  ->  base verb ("Do you likes" -> "like").
    if ((['do', 'does', 'did', "don't", "doesn't", "didn't"].includes(word.lower) || MODALS.has(word.lower)) && next) {
      const verbIndex = PLURAL_SUBJECTS.has(next.lower) || THIRD_SUBJECTS.has(next.lower) || next.lower === 'this' || next.lower === 'that' ? i + 2 : i + 1;
      const verb = at(verbIndex);
      if (verb && BASE_FORM[verb.lower] && !(verb.lower === 'does' || verb.lower === 'has')) add('grammar', `After “${word.text}”, use the base verb: “${BASE_FORM[verb.lower]}”.`, verb, verb, matchCase(verb.text, BASE_FORM[verb.lower]!));
      if (verb && verb.lower === 'has' && verbIndex === i + 2) add('grammar', `After “${word.text}”, use “have”.`, verb, verb, 'have');
    }

    // Subject-verb agreement in statements.
    const auxBefore = AUXILIARIES.has(prev) || ["don't", "doesn't", "didn't", 'to'].includes(prev) || CAUSATIVES.has(prev);
    if (!auxBefore) {
      let verbIndex = i + 1;
      while (ADVERBS.has(lowerAt(verbIndex))) verbIndex++;
      const verb = at(verbIndex);
      const isThird = THIRD_SUBJECTS.has(word.lower) || ((word.lower === 'this' || word.lower === 'that') && i === 0 && DEMONSTRATIVE_VERBS.has(verb?.lower ?? ''));
      if (verb && isThird && THIRD_PERSON[verb.lower]) add('grammar', `With “${word.text}”, add -s to the verb: “${THIRD_PERSON[verb.lower]}”.`, verb, verb, matchCase(verb.text, THIRD_PERSON[verb.lower]!));
      if (verb && PLURAL_SUBJECTS.has(word.lower) && BASE_FORM[verb.lower] && !(word.lower === 'you' && isQuestion && i > 0 && AUXILIARIES.has(lowerAt(i - 1)))) {
        add('grammar', `With “${word.text}”, don’t add -s: “${BASE_FORM[verb.lower]}”.`, verb, verb, matchCase(verb.text, BASE_FORM[verb.lower]!));
      }
    }

    // Relative clause: "something that/which make" -> "makes".
    if (RELATIVE_HEADS.has(word.lower) && next && (next.lower === 'that' || next.lower === 'which')) {
      const verb = at(i + 2);
      if (verb && THIRD_PERSON[verb.lower]) add('grammar', `“${word.lower}” is singular, so the verb needs -s: “${THIRD_PERSON[verb.lower]}”.`, verb, verb, THIRD_PERSON[verb.lower]!);
    }

    // "more sweet" -> "sweeter", "more sweeter" -> "sweeter".
    if (word.lower === 'more' && next) {
      if (SHORT_COMPARATIVES[next.lower]) add('grammar', `Short adjectives take -er: “${SHORT_COMPARATIVES[next.lower]}”, not “more ${next.text}”.`, word, next, SHORT_COMPARATIVES[next.lower]!);
      else if (Object.values(SHORT_COMPARATIVES).includes(next.lower)) add('grammar', `Don’t use “more” with “${next.text}” — it is already a comparative.`, word, next, next.text);
    }

    // "make me to feel" -> "make me feel".
    if (CAUSATIVES.has(word.lower) && next && OBJECT_PRONOUNS.has(next.lower) && lowerAt(i + 2) === 'to' && at(i + 3)) add('grammar', `After “${word.text} ${next.text}”, use the verb without “to”.`, at(i + 2)!, at(i + 2)!, '');

    // "want try" -> "want to try"; "would like try" -> "would like to try".
    const wantsTo = ['want', 'wants', 'need', 'needs'].includes(word.lower) || (word.lower === 'like' && words.slice(0, i).some((item) => item.lower === 'would' || item.lower === "i'd"));
    if (wantsTo && next && TO_VERBS.has(next.lower) && !(next.lower === 'drink' && at(i + 2) === undefined)) add('grammar', `Use “to” before the verb: “${word.text} to ${next.text}”.`, next, next, `to ${next.text}`);

    // "I like strawberry" -> "I like strawberries".
    // Fruit can refer to a flavour ("I like lime"). Both singular flavour and plural fruit are valid.

    // Missing article: "Would you like sweet cocktail?" -> "a sweet cocktail".
    if (COUNTABLE.has(word.lower)) {
      let back = i - 1;
      while (back >= 0 && ADJECTIVES.has(lowerAt(back))) back--;
      const trigger = lowerAt(back);
      if (back >= 0 && ARTICLE_TRIGGERS.has(trigger) && !DETERMINERS.has(trigger) && next?.lower !== 'of') {
        const firstWord = at(back + 1)!;
        add('grammar', `“${word.text}” is countable. Put “${startsWithVowelSound(firstWord.text) ? 'an' : 'a'}” before it.`, firstWord, firstWord, `${startsWithVowelSound(firstWord.text) ? 'an' : 'a'} ${firstWord.text}`);
      }
    }

    // "something, which" -> "something that".
    if (RELATIVE_HEADS.has(word.lower)) {
      const comma = tokens.find((token) => token.start >= word.end && token.text === ',');
      const after = comma && tokens.find((token) => token.start > comma.start && token.word);
      if (comma && after && after.lower === 'which' && tokens.indexOf(after) === tokens.indexOf(comma) + 1 && tokens.indexOf(comma) === tokens.indexOf(word) + 1) {
        add('grammar', 'To say which thing you mean, use “that” without a comma: “something that…”.', { ...word, start: word.end, end: word.end } as Token, after, ` that`);
      }
    }
  }

  // Wh-question without auxiliary: "What you like?" -> "What do you like?".
  if (WH_WORDS.has(first) && !words.slice(1, 4).some((token) => AUXILIARIES.has(token.lower) || ["don't", "doesn't", "didn't"].includes(token.lower))) {
    for (let p = 1; p <= 3; p++) {
      const subject = at(p);
      const verb = at(p + 1);
      if (!subject || !verb) break;
      if ((PLURAL_SUBJECTS.has(subject.lower) || ['he', 'she', 'it'].includes(subject.lower)) && (THIRD_PERSON[verb.lower] || BASE_FORM[verb.lower])) {
        const aux = ['he', 'she', 'it'].includes(subject.lower) ? 'does' : 'do';
        const base = BASE_FORM[verb.lower] ?? verb.lower;
        add('grammar', `Questions need a helper verb: “${at(0)!.text} … ${aux} ${subject.text} ${base}”.`, subject, verb, `${aux} ${subject.text} ${base}`);
        break;
      }
    }
  }

  // Statement word order used as a question: "You like rum?" -> "Do you like rum?".
  if (hasQuestionMark && ['you', 'he', 'she', 'they', 'we'].includes(first) && at(1) && (THIRD_PERSON[lowerAt(1)] || BASE_FORM[lowerAt(1)])) {
    const aux = ['he', 'she'].includes(first) ? 'Does' : 'Do';
    const subject = at(0)!;
    const verb = at(1)!;
    add('grammar', `Start a yes/no question with “${aux}”: “${aux} ${first} ${BASE_FORM[verb.lower] ?? verb.lower} …?”.`, subject, verb, `${aux} ${first} ${BASE_FORM[verb.lower] ?? verb.lower}`);
  }

  // Build the corrected sentence.
  let corrected = text;
  for (const edit of [...edits].sort((a, b) => b.start - a.start)) corrected = corrected.slice(0, edit.start) + edit.text + corrected.slice(edit.end);
  corrected = corrected.replace(/\s+([?.!,])/g, '$1').replace(/\s{2,}/g, ' ').trim();

  // Capital letter at the start.
  const firstToken = words[0]!;
  if (/^\p{Ll}/u.test(firstToken.text) && firstToken.start === text.search(/\S/)) {
    issues.push({ kind: 'punctuation', severity: 'error', message: 'Start the sentence with a capital letter.', original: firstToken.text, suggestion: firstToken.text.charAt(0).toUpperCase() + firstToken.text.slice(1), start: firstToken.start, end: firstToken.end });
  }
  corrected = corrected.replace(/^\s*(\p{Ll})/u, (letter) => letter.toUpperCase());

  // Final punctuation.
  const last = tokens[tokens.length - 1]!;
  const questionLike = isQuestion;
  if (!/[?.!]/.test(last.text)) {
    issues.push({ kind: 'punctuation', severity: 'error', message: questionLike ? 'A question ends with a question mark “?”.' : 'End the sentence with a full stop “.”.', original: last.text, suggestion: last.text + (questionLike ? '?' : '.'), start: last.start, end: last.end });
    corrected += questionLike ? '?' : '.';
  } else if (last.text === '.' && questionLike && (auxFirst || WH_WORDS.has(first))) {
    issues.push({ kind: 'punctuation', severity: 'error', message: 'This is a question, so end it with “?”.', original: '.', suggestion: '?', start: last.start, end: last.end });
    corrected = corrected.replace(/\.$/, '?');
  }

  return { ok: !issues.some((issue) => issue.severity === 'error'), issues, corrected, isQuestion: questionLike };
}

// Check a whole message sentence by sentence; issue offsets refer to the collapsed input text.
export function checkText(input: string): CheckResult {
  const text = input.replace(/\s+/g, ' ').trim();
  const chunks = [...text.matchAll(/[^.!?]+[.!?]*/g)].filter((match) => /[\p{L}\d]/u.test(match[0]));
  if (chunks.length <= 1) return checkSentence(text);
  const results = chunks.map((match) => {
    const offset = match.index! + (match[0].length - match[0].trimStart().length);
    return { offset, result: checkSentence(match[0]) };
  });
  const issues = results.flatMap(({ offset, result }) => result.issues.map((issue) => ({ ...issue, start: issue.start + offset, end: issue.end + offset })));
  return {
    ok: results.every(({ result }) => result.ok),
    issues,
    corrected: results.map(({ result }) => result.corrected).join(' '),
    isQuestion: results.some(({ result }) => result.isQuestion)
  };
}
