import type { Customer } from '../types';
import { drunkStage } from './model';

// Sentences the bartender could say right now, for the word-tile mode and the phrase ideas. Which ones appear depends
// on how the guest feels and what is happening, so the learner practises the English that fits the moment.

export function socialTemplates(customer: Customer, now: number): string[] {
  const social = customer.social;
  if (!social) return [];
  const stage = drunkStage(social.drunk);
  const need = social.need && social.need.since <= now ? social.need.kind : undefined;
  const list: string[] = [];

  if (need === 'ashtray') list.push('Would you like an ashtray?');
  if (need === 'water') list.push('Would you like some water?');
  if (need === 'taxi') list.push('Shall I call you a taxi?');
  if (need === 'chat') list.push('How was your day?', 'Do you want to talk about it?');

  if (stage === 'drunk' || stage === 'very-drunk') {
    list.push('I think you have had enough tonight.', 'Would you like some water?', 'Shall I call you a taxi?', 'It is late. Maybe it is time to go home?');
    if (social.rapport < 40) list.push('I must ask you to leave.');
  } else if (stage === 'tipsy') list.push('Would you like some water?');

  if (social.emotion === 'upset' || social.emotion === 'lonely') list.push('What happened?', 'I am sorry to hear that.');
  else if (social.emotion === 'angry') list.push('Are you OK?', 'I understand.');
  else if (social.emotion === 'tired') list.push('You look tired. Are you OK?', 'Take your time.');
  else if (social.emotion === 'nervous') list.push('Are you OK?', 'It will be fine.');
  else if (social.emotion === 'excited' || social.emotion === 'happy') list.push('You look happy tonight. What happened?', 'That sounds wonderful!');

  if (customer.smoker && social.ashtray !== 'given') list.push('Would you like an ashtray?');
  if (social.chatty) list.push('How are you tonight?', 'What do you do for work?');
  // A story invites follow-up questions; a chatty guest invites questions about their life.
  if (social.thread && social.thread.depth < 3) list.push(...(social.thread.depth === 0 ? ['Why did that happen?', 'Tell me more.'] : ['What happened next?', 'How did it go?']));
  if (social.chatty && social.rapport >= 45 && !social.thread) list.push(...[['What do you do in your free time?', 'hobby'], ['Where are you from?', 'from'], ['Do you have any pets?', 'pet'], ['Do you have plans for the weekend?', 'plans'], ['Have you been here before?', 'first']].filter(([, topic]) => !social.chatted.includes(`ask${topic![0]!.toUpperCase()}${topic!.slice(1)}`)).map(([text]) => text!).slice(0, 2));
  if (social.phase === 'enjoying') list.push('Is everything OK with your drink?', 'Would you like another drink?');
  return [...new Set(list)];
}
