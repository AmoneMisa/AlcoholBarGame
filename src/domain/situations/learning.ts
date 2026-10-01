import type { DailyLesson } from '../dailyLessons';
import type { PhraseGroup, PhraseLesson } from '../english/phrases';
import { SITUATIONS } from './catalog';
import type { Choice, SituationDef } from './types';

// Lessons made from the situations themselves, so what the English page teaches is exactly what the guests say and
// what the bartender can answer in the game: one phrase group per situation, and quiz questions for the daily quests.

const hasPlaceholder = (text: string) => /\{\w+\}/.test(text);
const sentences = (text: string) => text.split(/(?<=[.!?])\s+/);

function lessonFor(def: SituationDef, choice: Choice): PhraseLesson {
  const parts = sentences(choice.say).map((text) => ({ text, role: text.endsWith('?') ? 'question' as const : 'extra' as const }));
  const answers = [...new Set(choice.outcomes.map((outcome) => outcome.say).filter((say) => !hasPlaceholder(say) && say.length < 120))].slice(0, 2);
  return {
    text: choice.say,
    parts,
    when: choice.tip ?? `A good answer when the situation is: ${def.title.toLowerCase()}.`,
    answers: answers.length ? answers : ['Thank you.']
  };
}

const goodChoices = (def: SituationDef) => def.stages.flatMap((stage) => stage.choices)
  .filter((choice) => (choice.tone === 'good' || choice.tone === 'ok') && !hasPlaceholder(choice.say));

export function situationPhraseGroups(): PhraseGroup[] {
  const groups: PhraseGroup[] = [];
  for (const def of SITUATIONS) {
    const seen = new Set<string>();
    const lessons: PhraseLesson[] = [];
    // The good answers first, the "ok" ones after, at most four per situation.
    for (const choice of [...goodChoices(def)].sort((a, b) => Number(b.tone === 'good') - Number(a.tone === 'good'))) {
      if (seen.has(choice.say) || lessons.length >= 4) continue;
      seen.add(choice.say);
      lessons.push(lessonFor(def, choice));
    }
    if (!lessons.length) continue;
    const shop = def.category === 'payment';
    groups.push({
      id: `sit-${def.id}`, context: shop ? 'shop' : 'bar', title: `${def.icon} ${def.title}`,
      goal: `What to say when a guest brings this situation to you.`, lessons
    });
  }
  return groups;
}

// A quiz question for every good answer: the guest's words, three possible replies, and why one is best.
export function situationDailyLessons(): DailyLesson[] {
  const lessons: DailyLesson[] = [];
  for (const def of SITUATIONS) {
    const first = def.stages[0]!;
    if (hasPlaceholder(first.guest)) continue;
    const bad = def.stages.flatMap((stage) => stage.choices).filter((choice) => (choice.tone === 'bad' || choice.tone === 'rude') && !hasPlaceholder(choice.say));
    const good = first.choices.filter((choice) => choice.tone === 'good' && !hasPlaceholder(choice.say));
    for (const choice of good.slice(0, 2)) {
      const wrong = [...new Set(bad.map((item) => item.say))].filter((say) => say !== choice.say);
      // Another situation's good answer makes a believable wrong choice when this one has too few bad ones.
      const others = SITUATIONS.filter((other) => other.id !== def.id && other.category === def.category)
        .flatMap((other) => other.stages[0]!.choices).filter((item) => item.tone === 'good' && !hasPlaceholder(item.say)).map((item) => item.say);
      const distractors = [...wrong, ...others].filter((say, index, list) => list.indexOf(say) === index).slice(0, 2);
      if (distractors.length < 2) continue;
      const guest = first.guest.length > 140 ? `${first.guest.slice(0, 137)}…` : first.guest;
      lessons.push({
        id: `sit-${def.id}-${choice.id}`, kind: 'Phrase',
        prompt: `${def.icon} ${def.title}. The guest says: “${guest}” What do you say?`,
        choices: [choice.say, ...distractors], answer: choice.say,
        explanation: choice.tip ?? 'A calm, polite and clear answer is best. Think about safety first.',
        xp: def.severity === 3 ? 20 : 15, crystals: def.severity === 3 ? 3 : 2
      });
    }
  }
  return lessons;
}
