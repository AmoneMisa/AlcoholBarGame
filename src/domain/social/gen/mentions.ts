import type { Customer } from '../../types';
import { personaOf } from '../alive';
import { expand, hashOf, pickFrom, rngOf } from './grammar';

// When the player says something about a thing (a sport, a food, a place, music, a film), the guest reacts to that
// thing, with an opinion of their own that stays the same, and often asks something back.

export type MentionKind = 'sport' | 'music' | 'food' | 'place' | 'screen';
export interface Mention { kind: MentionKind; thing: string }

const WORDS: Record<MentionKind, string[]> = {
  sport: ['football', 'soccer', 'basketball', 'tennis', 'swimming', 'running', 'hiking', 'yoga', 'cycling', 'baseball', 'boxing', 'volleyball', 'skiing', 'gym'],
  music: ['jazz', 'rock', 'pop', 'classical music', 'guitar', 'piano', 'violin', 'concerts', 'opera', 'rap', 'blues'],
  food: ['pizza', 'pasta', 'sushi', 'burgers', 'steak', 'cheese', 'chocolate', 'plov', 'soup', 'salad', 'tacos', 'ramen', 'curry', 'pancakes', 'ice cream', 'fish'],
  place: ['Paris', 'London', 'Tokyo', 'Berlin', 'Rome', 'Spain', 'Italy', 'Japan', 'France', 'Greece', 'Turkey', 'Egypt', 'Samarkand', 'Tashkent', 'New York', 'Bucharest', 'Lisbon', 'Prague'],
  screen: ['movies', 'films', 'series', 'books', 'cartoons', 'comedies', 'documentaries', 'novels']
};

const escapeRegex = (text: string) => text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const PATTERNS = (Object.keys(WORDS) as MentionKind[]).flatMap((kind) => WORDS[kind].map((thing) => ({ kind, thing, pattern: new RegExp(`\\b${escapeRegex(thing.toLowerCase())}\\b`) })));

export function mentionIn(text: string): Mention | undefined {
  const lower = text.toLowerCase();
  const hit = PATTERNS.find((item) => item.pattern.test(lower));
  return hit ? { kind: hit.kind, thing: hit.thing } : undefined;
}

type Opinion = 'love' | 'meh' | 'dislike';
// Each opinion, each kind: a few ways to say it. {thing} is the word, {Thing} the same at the start.
const REACT: Record<MentionKind, Record<Opinion, string[]>> = {
  sport: {
    love: ['[Oh|Really|Hey]! {Thing}! I love {thing}. [Do you play it?|Which team do you follow?|How often do you play?]', '{Thing}? [Great choice|Now we are talking]! [Do you play, or only watch?|I could talk about it all night.]'],
    meh: ['{Thing}? [Hmm|Well], it is not really my thing, but I respect it. [Do you play?|Do you do it often?]', '[I watch|I sometimes watch] {thing} with friends, but I am not a fan.'],
    dislike: ['{Thing}? [Honestly|To be honest], I find it a bit boring. [Sorry!|No offence.]', 'Oh, I never liked {thing}. [My brother loves it, though.|But each to their own.]']
  },
  music: {
    love: ['[Oh|Really]! {Thing}! I love {thing}. [Who is your favourite?|Do you play something yourself?|Have you been to a concert lately?]', '{Thing}? [Beautiful|Lovely]. [It always makes my day better.|It helps me relax after work.]'],
    meh: ['{Thing} is OK for me. [I like other things more.|I listen to it sometimes.] [What do you like?|]', '[Hmm|Well], {thing} is not my favourite, but it is nice at a bar.'],
    dislike: ['{Thing}? [Honestly|To be honest], it is too loud for me. [Sorry!|No offence.]', 'Oh, I cannot listen to {thing} for long. [It gives me a headache.|My ears say no.]']
  },
  food: {
    love: ['[Oh|Really]! {Thing}! I love {thing}. [What is your favourite place for it?|Do you cook it yourself?|Now I am hungry!]', '{Thing}? [My favourite|Yes, please]! [I could eat it every day.|My mother makes the best one.]'],
    meh: ['{Thing} is fine. [I like other things more.|I eat it sometimes.] [What do you like best?|]', '[Hmm|Well], {thing} is OK. Not my first choice.'],
    dislike: ['{Thing}? [Honestly|To be honest], I do not really like it. [Sorry!|No offence.]', 'Oh, not {thing} for me. [I tried it once, and that was enough.|My stomach says no.]']
  },
  place: {
    love: ['{Thing}! [I love it there|I would go back tomorrow]. [Have you been there?|Do you know a good place to eat there?|When did you go?]', '[Oh|Really]! {Thing} is [wonderful|a dream]. [Have you been there?|I could live there.]'],
    meh: ['{Thing}? [I have only been there once.|I have not been there yet.] [Is it nice?|Would you go back?]', '[Hmm|Well], {thing}. I would like to see it one day.'],
    dislike: ['{Thing}? [Honestly|To be honest], it was too crowded for me. [Sorry!|But that is only my opinion.]', 'Oh, I did not like {thing}. [Maybe I was unlucky.|It rained all week.]']
  },
  screen: {
    love: ['[Oh|Really]! I love {thing}. [What did you see last?|Do you have a favourite?|Can you recommend one?]', '{Thing}? [Yes|Of course]! [It is how I relax after work.|I watch one every weekend.]'],
    meh: ['{Thing} are OK. [I do not have much time for them.|I like other things more.] [What do you like?|]', '[Hmm|Well], {thing}. I watch them now and then.'],
    dislike: ['{Thing}? [Honestly|To be honest], I fall asleep. [Sorry!|No offence.]', 'Oh, I never have the patience for {thing}.']
  }
};

/** The guest's opinion of a thing: the same all evening, and different from guest to guest. */
export function opinionOf(customer: Pick<Customer, 'id' | 'characterId'>, mention: Mention): Opinion {
  const roll = hashOf(`${customer.characterId ?? customer.id}:${mention.thing}`) % 10;
  return roll < 5 ? 'love' : roll < 8 ? 'meh' : 'dislike';
}

export function reactToMention(customer: Customer, mention: Mention, seed: string): { text: string; opinion: Opinion; asks: boolean } {
  const persona = personaOf(customer);
  const random = rngOf(seed);
  const thing = mention.thing;
  // Their own hobby is a favourite thing: "Really? I play football on Sundays!"
  const shared = mention.kind === 'sport' && persona.hobby.toLowerCase().includes(thing.toLowerCase());
  const opinion: Opinion = shared ? 'love' : opinionOf(customer, mention);
  const template = shared ? `[Really|Oh|No way]! I ${persona.hobby}! [We should play together one day.|Are you any good?]` : pickFrom(REACT[mention.kind][opinion], random);
  const text = expand(template, { thing, Thing: thing }, random);
  return { text, opinion, asks: /\?/.test(text) };
}

/** What a guest asks later about something the player said earlier. */
const MEMORY: Record<MentionKind, string[]> = {
  sport: ['Earlier you talked about {thing}. Did you play last weekend?', 'You said something about {thing}. Do you do it often?'],
  music: ['Earlier you talked about {thing}. Have you been to a concert lately?', 'You mentioned {thing}. Do you play something yourself?'],
  food: ['You talked about {thing} earlier, and now I am hungry. What is your favourite dish?', 'Earlier you mentioned {thing}. Do you cook it yourself?'],
  place: ['You mentioned {thing} before. When did you go there?', 'I keep thinking about {thing}, after what you said. Is it far?'],
  screen: ['You talked about {thing} earlier. What did you see last?', 'You mentioned {thing}. Can you recommend one?']
};
export const memoryLine = (_customer: Customer, heard: { kind: MentionKind; thing: string }, seed: string) => { const random = rngOf(seed); return expand(pickFrom(MEMORY[heard.kind], random), { thing: heard.thing }, random); };

export function allMentionTexts(): string[] {
  return [...Object.values(REACT).flatMap((byOpinion) => Object.values(byOpinion).flat()), ...Object.values(MEMORY).flat(), ...Object.values(WORDS).flat()];
}
