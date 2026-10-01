export interface DailyLesson {
  id: string;
  kind: 'Word' | 'Phrase' | 'Grammar';
  prompt: string;
  choices: string[];
  answer: string;
  explanation: string;
  xp: number;
  crystals: number;
}

import { MORE_DAILY_LESSONS } from './dailyLessonsMore';

export const DAILY_LESSON_COUNT = 3;
export const DAILY_LESSON_RECIPE_CHANCE = .06;

const LESSON_BANK: DailyLesson[] = [
  ...MORE_DAILY_LESSONS,
  { id:'guest-word',kind:'Word',prompt:'What does “guest” mean?',choices:['A person visiting the bar','A drink recipe','The person serving drinks'],answer:'A person visiting the bar',explanation:'A guest is the customer you welcome and serve.',xp:12,crystals:2 },
  { id:'stock-word',kind:'Word',prompt:'What does “in stock” mean?',choices:['Available to sell or use','Already ordered by a guest','Free of charge'],answer:'Available to sell or use',explanation:'An item is in stock when it is available in your inventory.',xp:12,crystals:2 },
  { id:'garnish-word',kind:'Word',prompt:'What is a garnish?',choices:['A decoration or finishing ingredient','A type of payment','A supplier discount'],answer:'A decoration or finishing ingredient',explanation:'Mint, citrus peel and cocktail cherries can be garnishes.',xp:12,crystals:2 },
  { id:'recommend-phrase',kind:'Phrase',prompt:'Which sentence politely offers advice?',choices:['I recommend the Mojito.','You take Mojito.','Mojito is for you yes.'],answer:'I recommend the Mojito.',explanation:'“I recommend…” is a natural, polite way to suggest something.',xp:15,crystals:2 },
  { id:'budget-phrase',kind:'Phrase',prompt:'How do you ask about the customer’s budget?',choices:['What is your budget?','How much money you are?','Which cost you want?'],answer:'What is your budget?',explanation:'Use “What is your budget?” or “How much would you like to spend?”',xp:15,crystals:2 },
  { id:'preference-phrase',kind:'Phrase',prompt:'Choose the natural question.',choices:['Do you prefer sweet or dry drinks?','You prefer sweet or dry?','Are you prefer sweet?'],answer:'Do you prefer sweet or dry drinks?',explanation:'Present-simple questions use do + subject + base verb.',xp:15,crystals:2 },
  { id:'article-grammar',kind:'Grammar',prompt:'Choose the correct sentence.',choices:['I’ll make you a Mojito.','I’ll make you Mojito.','I’ll make you an Mojito.'],answer:'I’ll make you a Mojito.',explanation:'Use “a” before a singular cocktail name that begins with a consonant sound.',xp:18,crystals:3 },
  { id:'question-grammar',kind:'Grammar',prompt:'Choose the correct word order.',choices:['Would you like some ice?','You would like some ice?','Would like you some ice?'],answer:'Would you like some ice?',explanation:'In a question, the helper verb comes before the person: would + you + like.',xp:18,crystals:3 },
  { id:'past-grammar',kind:'Grammar',prompt:'Which sentence correctly describes a completed order?',choices:['The customer paid by card.','The customer payed by card.','The customer did paid by card.'],answer:'The customer paid by card.',explanation:'The past form of “pay” is “paid”. Do not add “did” to a positive past statement.',xp:18,crystals:3 },
  { id:'countable-word',kind:'Word',prompt:'Which unit fits fresh mint?',choices:['leaves','millilitres','bottles'],answer:'leaves',explanation:'Mint is counted in leaves or sprigs; liquids are measured in millilitres.',xp:12,crystals:2 },
  { id:'similar-phrase',kind:'Phrase',prompt:'How do you offer a substitute politely?',choices:['May I offer you something similar?','Take another one.','I cannot, next drink.'],answer:'May I offer you something similar?',explanation:'“May I offer…” is polite and makes the alternative clear.',xp:15,crystals:2 },
  { id:'plural-grammar',kind:'Grammar',prompt:'Choose the correct bottle question.',choices:['How many bottles would you like?','How much bottles would you like?','How many bottle do you like?'],answer:'How many bottles would you like?',explanation:'Use “how many” with countable plural nouns such as bottles.',xp:18,crystals:3 }
];

const hash = (value: string) => [...value].reduce((total, character) => ((total * 31) + character.charCodeAt(0)) >>> 0, 2166136261);

// The correct answer is written first in the lesson bank, so the choices are shuffled. The shuffle depends only on the
// day and the lesson, so the client and the server show and check the same thing.
function shuffled(choices: string[], seed: string) {
  const result = [...choices];
  let state = hash(seed) || 1;
  for (let i = result.length - 1; i > 0; i--) {
    state = (Math.imul(state, 1664525) + 1013904223) >>> 0;
    const j = state % (i + 1);
    [result[i], result[j]] = [result[j]!, result[i]!];
  }
  return result;
}

export function dailyLessonsFor(dateKey: string) {
  const start = hash(dateKey) % LESSON_BANK.length;
  return Array.from({ length: DAILY_LESSON_COUNT }, (_, index) => LESSON_BANK[(start + index * 7) % LESSON_BANK.length]!)
    .map((lesson) => ({ ...lesson, choices: shuffled(lesson.choices, `${dateKey}:${lesson.id}`) }));
}

export const normalizeLessonAnswer = (answer: unknown) => typeof answer === 'string' ? answer.trim().replace(/\s+/g, ' ').toLowerCase() : '';
export const learningStreakBonus = (streak: number) => Math.min(.5, Math.max(0, Math.floor(streak) - 1) * .1);
