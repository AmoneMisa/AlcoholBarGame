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

// Authored alternatives stay on the guest's topic instead of borrowing replies
// from unrelated situations. They are deliberately poor service or unsafe advice.
const quizDistractors: Record<string, string[]> = {
  'pay-declined': ['Your card failed, so you must be lying about your balance.'],
  'pay-qr': ['Give me your banking password and I will pay for you.', 'Just leave without paying if you have no cash.'],
  'pay-iban': ['Send the money to my personal account instead.', 'I do not need to check whether the transfer arrived.'],
  'pay-uzcard': ['Give me your card and PIN; I will keep them until tomorrow.', 'Your local card is useless. That is your problem.'],
  'pay-intl': ['Foreign visitors must pay twice the price.', 'Leave your card here overnight and I will try it later.'],
  'pay-change': ['I will keep the extra change. Counting it takes too long.'],
  'pay-split': ['Pay the full bill each, and sort out the extra money yourselves.'],
  'rule-card-only': ['I will hide the cash payment from the manager.'],
  'rule-boarding-pass': ['You can buy as much as you want without showing any documents.'],
  'rule-id-young': ['You look old enough. There is no need to check your ID.'],
  'rule-smoking-inside': ['Smoke next to the other guests. Their comfort does not matter.'],
  'pet-dog': ['Let your dog run around behind the bar.', 'Leave your dog locked in a hot car while you drink.'],
  'rule-last-call': ['Pay double and I will ignore the closing rules.'],
  'break-bottle': ['Pick up the broken glass with your bare hands.', 'Leave the glass on the floor. Someone else will deal with it.'],
  'break-furniture': ['Keep sitting on the broken stool. It is probably safe.'],
  'spill': ['It is only a jacket. Stop complaining about the stain.'],
  'threat-follow': ['Wait outside after my shift and we can fight.'],
  'threat-robbery': ['I will fight you for the money in the register.'],
  'security-stranger': ['Your fear is silly. I will not check on him.'],
  'danger-follow': ['Go outside alone and ask him why he is following you.'],
  'security-bag': ['Take the unattended bag home with you.'],
  'emergency-fire': ['Stay inside and finish your drinks while the kitchen burns.'],
  'med-faint': ['Leave them on the floor. I am too busy to check.'],
  'med-nausea': ['Have another strong drink; it will stop the nausea.'],
  'med-choke': ['Wait until they stop moving before asking for help.'],
  'med-panic': ['Stop making a scene. I do not care how you feel.'],
  'med-too-drunk': ['Give them more alcohol to wake them up.'],
  'flirt-pushy': ['Pay more and you can touch me whenever you want.'],
  'flirt-drink-sent': ['I will make them accept your drink even if they say no.'],
  'good-birthday': ['Your birthday is not important. Do not bother me with it.'],
  'good-proposal': ['I will tell your girlfriend about the proposal before you ask.'],
  'good-critic': ['Write a good review or I will refuse to serve you.'],
  'good-round': ['I will charge you for drinks nobody ordered.', 'Your lottery win is stupid. Keep it to yourself.'],
  'good-wallet': ['Throw the wallet away. Looking for the owner is too much work.'],
  'good-music': ['Play as loudly as possible, even if the guests complain.', 'Leave your guitar here. I will sell it for you without asking.'],
  'good-photo': ['Take close-up photos of every guest without asking them.'],
  'good-gift': ['That gift looks cheap. Bring me something better.', 'You owe me a bigger gift before I will serve you.'],
  'good-payback': ['You are late, so I will charge you twice without checking your tab.', 'Give me the money, but I will leave your tab unpaid.'],
  'good-inspector': ['I will hide our records so you cannot check them.'],
  'good-power-cut': ['Run around in the dark until you find the exit.'],
  'good-celebrity': ['I will announce your name so everyone can crowd your table.'],
  'advice-pairing': ['Buy our most expensive food. I do not care whether it matches.'],
  'advice-gift': ['Buy the biggest bottle. Your budget does not matter.'],
  'advice-light': ['Have two strong cocktails before you drive.'],
  'advice-first-time': ['Drink the whole glass quickly without tasting it.']
};

export function situationQuizDistractors(def: SituationDef): string[] {
  const opening = def.stages[0]!.choices
    .filter((choice) => (choice.tone === 'bad' || choice.tone === 'rude') && !hasPlaceholder(choice.say))
    .map((choice) => choice.say);
  return [...new Set([...opening, ...(quizDistractors[def.id] ?? [])])].slice(0, 2);
}

// A quiz question for every good answer, with wrong replies about the same situation.
export function situationDailyLessons(): DailyLesson[] {
  const lessons: DailyLesson[] = [];
  for (const def of SITUATIONS) {
    const first = def.stages[0]!;
    if (hasPlaceholder(first.guest)) continue;
    const good = first.choices.filter((choice) => choice.tone === 'good' && !hasPlaceholder(choice.say));
    for (const choice of good.slice(0, 2)) {
      const wrong = situationQuizDistractors(def).filter((say) => say !== choice.say);
      const distractors = wrong.slice(0, 2);
      if (!distractors.length) continue;
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
