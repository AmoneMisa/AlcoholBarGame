// Learner-facing explanations for every rule the checker applies.
// Written for A1–B1 learners: short sentences, one idea at a time, always a wrong → right example.

export type RuleId =
  | 'spelling' | 'unknown-word' | 'empty'
  | 'capital-i' | 'capital-start' | 'end-question' | 'end-full-stop'
  | 'repeated-word' | 'a-an' | 'agree-verb' | 'do-does' | 'base-after-helper' | 'third-person-s' | 'no-s-after-i-you'
  | 'relative-s' | 'comparative-er' | 'double-comparative' | 'make-without-to' | 'want-to' | 'article-countable' | 'that-not-which'
  | 'wh-helper' | 'yes-no-question' | 'helper-first' | 'two-helpers' | 'person-after-helper' | 'verb-first-question' | 'two-verbs'
  | 'noun-after-article' | 'ends-early' | 'word-order';

export type RuleGroup = 'Spelling & words' | 'Punctuation' | 'Questions' | 'Verbs' | 'Articles & nouns' | 'Comparing' | 'Word order';

export interface GrammarRule {
  id: RuleId;
  title: string;
  group: RuleGroup;
  level: 'A1' | 'A2' | 'B1';
  explain: string;
  pattern?: string;
  examples: { wrong: string; right: string }[];
  tip: string;
}

export const RULES: Record<RuleId, GrammarRule> = {
  spelling: {
    id: 'spelling', title: 'Spelling', group: 'Spelling & words', level: 'A1',
    explain: 'English spelling is not always the same as the sound. One wrong letter can make a word the customer cannot understand.',
    examples: [{ wrong: 'I recomend a Mojito.', right: 'I recommend a Mojito.' }, { wrong: 'Do you want somthing sweet?', right: 'Do you want something sweet?' }],
    tip: 'Many words have double letters: recommend, coffee, bottle, little. Say the word slowly and count the letters.'
  },
  'unknown-word': {
    id: 'unknown-word', title: 'Unknown word', group: 'Spelling & words', level: 'A1',
    explain: 'We could not find this word in the dictionary. It may be a typo, a word from another language, or a very rare word.',
    examples: [{ wrong: 'Do you like qwzx?', right: 'Do you like sweet drinks?' }],
    tip: 'Use simple, common words at the bar: sweet, sour, strong, light, fruity, bubbles.'
  },
  empty: {
    id: 'empty', title: 'Write a sentence', group: 'Spelling & words', level: 'A1',
    explain: 'There is nothing to check yet.',
    examples: [{ wrong: '…', right: 'Hello! What would you like?' }],
    tip: 'Start with a greeting or a simple question.'
  },
  'capital-i': {
    id: 'capital-i', title: '“I” is always a capital letter', group: 'Punctuation', level: 'A1',
    explain: 'When you talk about yourself, “I” is always written as a capital letter, in any position in the sentence.',
    examples: [{ wrong: 'Can i help you?', right: 'Can I help you?' }, { wrong: 'i think you will like it.', right: 'I think you will like it.' }],
    tip: 'Only “I” works like this. “me”, “my” and “you” are small letters.'
  },
  'capital-start': {
    id: 'capital-start', title: 'Capital letter at the start', group: 'Punctuation', level: 'A1',
    explain: 'Every English sentence starts with a capital (big) letter.',
    examples: [{ wrong: 'do you like lime?', right: 'Do you like lime?' }],
    tip: 'New sentence = new capital letter. After “.”, “?” or “!” the next word starts with a capital.'
  },
  'end-question': {
    id: 'end-question', title: 'Questions end with “?”', group: 'Punctuation', level: 'A1',
    explain: 'A question always ends with a question mark. It tells the reader that you expect an answer.',
    pattern: 'Do / Would / What … ?',
    examples: [{ wrong: 'Do you like sour drinks.', right: 'Do you like sour drinks?' }, { wrong: 'What would you like', right: 'What would you like?' }],
    tip: 'If the sentence starts with Do, Does, Would, Can, Is, Are, What, Which or How, it is usually a question.'
  },
  'end-full-stop': {
    id: 'end-full-stop', title: 'Full stops in formal writing', group: 'Punctuation', level: 'A1',
    explain: 'In formal writing, finish a statement with “.” or, for strong feelings, “!”. Leaving out a final full stop in a short chat is a writing habit, not a grammar mistake.',
    examples: [{ wrong: 'I recommend a Mojito', right: 'I recommend a Mojito.' }],
    tip: 'Use “!” for greetings and excitement: “Hello!”, “Enjoy!”.'
  },
  'repeated-word': {
    id: 'repeated-word', title: 'Repeated word', group: 'Spelling & words', level: 'A1',
    explain: 'The same word is written two times in a row. This is usually a typing mistake.',
    examples: [{ wrong: 'Do you like the the taste of mint?', right: 'Do you like the taste of mint?' }],
    tip: 'Read your sentence once before you send it.'
  },
  'a-an': {
    id: 'a-an', title: '“a” or “an”', group: 'Articles & nouns', level: 'A1',
    explain: 'Use “an” before a vowel SOUND (a, e, i, o, u sounds). Use “a” before a consonant sound. Listen to the sound, not the letter.',
    pattern: 'a + consonant sound · an + vowel sound',
    examples: [{ wrong: 'Would you like a Old Fashioned?', right: 'Would you like an Old Fashioned?' }, { wrong: 'an Mojito', right: 'a Mojito' }, { wrong: 'an unique drink', right: 'a unique drink (“you-nique”)' }],
    tip: 'an Espresso Martini, an orange, an hour (silent h) — but a lime, a unique cocktail.'
  },
  'agree-verb': {
    id: 'agree-verb', title: '“agree” is a verb', group: 'Verbs', level: 'A2',
    explain: '“Agree” is already a verb, so you do not need “am / is / are” before it.',
    examples: [{ wrong: 'I am agree.', right: 'I agree.' }],
    tip: 'Same with “like” and “want”: “I like it”, not “I am like it”.'
  },
  'do-does': {
    id: 'do-does', title: '“do” or “does”', group: 'Questions', level: 'A1',
    explain: 'Use “does” with he, she and it. Use “do” with I, you, we and they.',
    pattern: 'Do + I/you/we/they … ? · Does + he/she/it … ?',
    examples: [{ wrong: 'Does you want ice?', right: 'Do you want ice?' }, { wrong: 'Do she like mint?', right: 'Does she like mint?' }],
    tip: 'At the bar you mostly talk to the guest, so it is almost always “Do you …?”.'
  },
  'base-after-helper': {
    id: 'base-after-helper', title: 'Base verb after do / does / can / would', group: 'Verbs', level: 'A1',
    explain: 'After a helper verb (do, does, did, can, would, will…) the main verb has no -s and no -ed. The helper already carries that information.',
    pattern: 'Do you + like (not likes)',
    examples: [{ wrong: 'Do you likes sweet drinks?', right: 'Do you like sweet drinks?' }, { wrong: 'Does she wants ice?', right: 'Does she want ice?' }, { wrong: 'How much does it costs?', right: 'How much does it cost?' }, { wrong: 'Can I makes you a drink?', right: 'Can I make you a drink?' }],
    tip: 'Only ONE -s per sentence: “Does she want…”, “She wants…”.'
  },
  'third-person-s': {
    id: 'third-person-s', title: 'He / she / it + verb-s', group: 'Verbs', level: 'A1',
    explain: 'In the present simple, add -s to the verb after he, she, it, this drink, something…',
    pattern: 'it + tastes · she + likes · something + makes',
    examples: [{ wrong: 'It taste fresh.', right: 'It tastes fresh.' }, { wrong: 'She want a refund.', right: 'She wants a refund.' }, { wrong: 'He like lime.', right: 'He likes lime.' }],
    tip: 'Spelling: try → tries, mix → mixes, have → has, do → does. Prices: “It costs ten dollars” (now) — “It cost ten dollars” is the past.'
  },
  'no-s-after-i-you': {
    id: 'no-s-after-i-you', title: 'No -s after I / you / we / they', group: 'Verbs', level: 'A1',
    explain: 'The -s ending is only for he, she and it. With I, you, we and they, use the base verb.',
    examples: [{ wrong: 'I likes this cocktail.', right: 'I like this cocktail.' }, { wrong: 'You wants something light.', right: 'You want something light.' }],
    tip: 'I like · you like · we like · they like · BUT she likes.'
  },
  'relative-s': {
    id: 'relative-s', title: '“something that makes …”', group: 'Verbs', level: 'A2',
    explain: 'In “something that / which + verb”, the verb talks about “something”. “Something” is singular (one thing), so the verb needs -s.',
    pattern: 'something that + verb-s',
    examples: [{ wrong: 'I want something that make me happy.', right: 'I want something that makes me happy.' }],
    tip: 'Ask: who does the action? “Something” does it → makes, tastes, helps.'
  },
  'comparative-er': {
    id: 'comparative-er', title: 'Short adjectives + -er', group: 'Comparing', level: 'A2',
    explain: 'To compare with short adjectives (one syllable, or two syllables ending in -y), add -er. Use “more” only with longer adjectives.',
    pattern: 'sweet → sweeter · light → lighter · happy → happier · refreshing → more refreshing',
    examples: [{ wrong: 'Do you want something more sweet?', right: 'Do you want something sweeter?' }, { wrong: 'This one is more cheap.', right: 'This one is cheaper.' }, { wrong: 'It makes me more lazy.', right: 'It makes me lazier.' }],
    tip: 'Some adjectives accept both: “more sour” and “sourer” are both OK. With -y adjectives change y → i: easy → easier. Long words keep “more”: more expensive, more popular.'
  },
  'double-comparative': {
    id: 'double-comparative', title: 'Don’t use “more” + -er', group: 'Comparing', level: 'A2',
    explain: 'A word with -er is already a comparison. Adding “more” compares two times.',
    examples: [{ wrong: 'Would you like something more sweeter?', right: 'Would you like something sweeter?' }],
    tip: 'Choose one: “sweeter” OR “more refreshing”, never both.'
  },
  'make-without-to': {
    id: 'make-without-to', title: 'make / let + person + verb (no “to”)', group: 'Verbs', level: 'B1',
    explain: 'After “make someone” and “let someone”, the next verb comes without “to”.',
    pattern: 'make + you + feel',
    examples: [{ wrong: 'This drink will make you to feel relaxed.', right: 'This drink will make you feel relaxed.' }, { wrong: 'Let me to help you.', right: 'Let me help you.' }],
    tip: 'But “help” works both ways: “help me choose” and “help me to choose” are both correct.'
  },
  'want-to': {
    id: 'want-to', title: 'want / need / would like + to + verb', group: 'Verbs', level: 'A1',
    explain: 'When “want”, “need” or “would like” is followed by another verb, put “to” between them.',
    pattern: 'would like + to + try',
    examples: [{ wrong: 'Would you like try something new?', right: 'Would you like to try something new?' }, { wrong: 'Would you like pay by card?', right: 'Would you like to pay by card?' }, { wrong: 'I want order a drink.', right: 'I want to order a drink.' }],
    tip: 'With a noun, no “to”: “Would you like a Mojito?”.'
  },
  'article-countable': {
    id: 'article-countable', title: 'a / an before one countable thing', group: 'Articles & nouns', level: 'A1',
    explain: 'Things you can count (a drink, a cocktail, a glass, an idea) need “a/an”, “the”, “this” or “my” before them when there is only one.',
    pattern: 'a + (adjective) + noun',
    examples: [{ wrong: 'Would you like sweet cocktail?', right: 'Would you like a sweet cocktail?' }, { wrong: 'Would you like bag?', right: 'Would you like a bag?' }, { wrong: 'I have idea.', right: 'I have an idea.' }],
    tip: 'Liquids, money and flavours are uncountable, so no “a”: “I like coffee”, “Do you want ice?”, “Pay in cash”.'
  },
  'that-not-which': {
    id: 'that-not-which', title: '“something that …” (no comma)', group: 'Word order', level: 'B1',
    explain: 'When the second part tells us WHICH thing you mean, use “that” without a comma.',
    examples: [{ wrong: 'I want something, which makes me happy.', right: 'I want something that makes me happy.' }],
    tip: '“, which …” adds extra information about a thing you already named: “I love the Mojito, which is from Cuba.”'
  },
  'wh-helper': {
    id: 'wh-helper', title: 'Wh-questions need do / does', group: 'Questions', level: 'A1',
    explain: 'Questions with what, which, where or how need a helper verb (do / does) before the person.',
    pattern: 'What + do + you + like?',
    examples: [{ wrong: 'What you like?', right: 'What do you like?' }, { wrong: 'Which drink you want?', right: 'Which drink do you want?' }, { wrong: 'How many bottles you need?', right: 'How many bottles do you need?' }],
    tip: 'Remember the order QASV: Question word – Auxiliary (do) – Subject (you) – Verb.'
  },
  'yes-no-question': {
    id: 'yes-no-question', title: 'Yes/no questions start with Do', group: 'Questions', level: 'A1',
    explain: 'In spoken English people sometimes say “You like rum?”, but the correct question starts with “Do” (or “Does” for he/she/it).',
    pattern: 'Do + you + verb … ?',
    examples: [{ wrong: 'You like rum?', right: 'Do you like rum?' }, { wrong: 'She wants ice?', right: 'Does she want ice?' }],
    tip: 'Polite service English: “Would you like…?” is even softer than “Do you want…?”.'
  },
  'helper-first': {
    id: 'helper-first', title: 'Helper verb first in questions', group: 'Word order', level: 'A1',
    explain: 'In a question, the helper verb (do, would, can, is…) moves in front of the person.',
    pattern: 'You do like → Do you like …?',
    examples: [{ wrong: 'You do like sour drinks?', right: 'Do you like sour drinks?' }, { wrong: 'You would like ice?', right: 'Would you like ice?' }],
    tip: 'Statement: You would like ice. → Question: Would you like ice?'
  },
  'two-helpers': {
    id: 'two-helpers', title: 'Only one helper verb', group: 'Word order', level: 'A1',
    explain: 'A simple question has ONE helper verb at the start: do, does, is, are, can or would. Two helpers together do not work.',
    pattern: 'Do you … ? / Is it … ? — not “Do is …”',
    examples: [{ wrong: 'Do is like sour?', right: 'Do you like sour drinks?' }, { wrong: 'Is do you like sweet?', right: 'Do you like sweet drinks?' }],
    tip: 'Choose: “Do you like…?” (an action) or “Is it…?” (a description).'
  },
  'person-after-helper': {
    id: 'person-after-helper', title: 'The person comes after the helper', group: 'Word order', level: 'A1',
    explain: 'After Do / Would / Can at the start of a question, the next word is the person: you, he, she, it, they.',
    pattern: 'Would + you + like …?',
    examples: [{ wrong: 'Would like you a Mojito?', right: 'Would you like a Mojito?' }, { wrong: 'Do like you mint?', right: 'Do you like mint?' }],
    tip: 'Say it as a block: “Would-you-like…”, “Do-you-want…”.'
  },
  'verb-first-question': {
    id: 'verb-first-question', title: 'Questions don’t start with the main verb', group: 'Word order', level: 'A1',
    explain: 'Unlike some languages, English does not make a question by moving the main verb to the front. Add a helper verb instead.',
    pattern: 'Do + you + like …?',
    examples: [{ wrong: 'Like you sour drinks?', right: 'Do you like sour drinks?' }, { wrong: 'Want you ice?', right: 'Do you want ice?' }],
    tip: 'Only helpers (do, is, can, would…) go first. Main verbs (like, want) stay after the person.'
  },
  'two-verbs': {
    id: 'two-verbs', title: 'One main verb', group: 'Word order', level: 'A2',
    explain: 'A simple question has one main verb after the person. Two main verbs next to each other confuse the listener.',
    examples: [{ wrong: 'Do you drinks like sour?', right: 'Do you like sour drinks?' }],
    tip: 'Find the action (like, want, prefer) and put the thing after it: like + sour drinks.'
  },
  'noun-after-article': {
    id: 'noun-after-article', title: '“a/an” needs a noun', group: 'Articles & nouns', level: 'A1',
    explain: '“A” and “an” always point to a thing. After them you need a noun (drink, cocktail, glass…), not only an adjective.',
    pattern: 'a + (adjective) + NOUN',
    examples: [{ wrong: 'Do you want a sour?', right: 'Do you want a sour drink?' }, { wrong: 'Do you like an more sour?', right: 'Do you like sour drinks?' }],
    tip: 'Talking in general? Use the plural without “a”: “Do you like sour drinks?”.'
  },
  'ends-early': {
    id: 'ends-early', title: 'The sentence stops too early', group: 'Word order', level: 'A1',
    explain: 'Some little words (to, with, a, the, and, or) need more words after them. A sentence cannot end with them.',
    examples: [{ wrong: 'Do you like sweet drinks to?', right: 'Do you like sweet drinks too?' }, { wrong: 'Would you like a drink with?', right: 'Would you like a drink with bubbles?' }],
    tip: '“too” (= also) can end a sentence; “to” cannot.'
  },
  'word-order': {
    id: 'word-order', title: 'Word order', group: 'Word order', level: 'A1',
    explain: 'The words are right, but their order is not. English questions usually follow: helper – person – verb – thing.',
    pattern: 'Do – you – like – sour drinks?',
    examples: [{ wrong: 'Do is like an more sour?', right: 'Do you like sour drinks?' }],
    tip: 'Build the question from left to right: Do → you → like → what?'
  }
};

export const RULE_GROUPS: RuleGroup[] = ['Questions', 'Word order', 'Verbs', 'Articles & nouns', 'Comparing', 'Punctuation', 'Spelling & words'];
