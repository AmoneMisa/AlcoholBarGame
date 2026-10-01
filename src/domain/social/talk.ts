import type { Customer } from '../types';
import type { CustomerReply } from '../conversation/customerTalk';
import { actsIn, isLeaveAct, type Act } from './acts';
import { localize, originOf, spellFor } from './origin';
import { makeStory } from './gen/story';
import { mentionIn, reactToMention, stanceOf, type Mention } from './gen/mentions';
import { embellish, PERSONA_ACTS, personaAnswer, reactToAnswer, threadAnswer, type PersonaAct, type ThreadAct } from './alive';
import { drunkStage, type DrunkStage, type Emotion, type GuestSocial, type TalkTopic } from './model';

// How guests talk like people. Every line exists in several variants and the guest picks one by a stable hash, so a
// guest does not change their answer when asked twice, but two guests with the same feeling do not sound alike.
// Written in clear B1 English: short sentences, everyday words.

export type Expression = CustomerReply['expression'];
export interface SocialReply {
  text: string;
  expression: Expression;
  /** Change to the guest's rapport (liking) for the bartender. */
  rapport: number;
  emotion?: Emotion;
  told?: boolean;
  /** Which small-talk topic this answered, so it is not repeated. */
  chatted?: string;
  /** The guest has just told a story the bartender can ask more about. */
  thread?: { topic: TalkTopic; kind: 'good' | 'bad'; frame: import('./gen/story').StoryFrame };
  /** A thing the player mentioned that the guest reacted to. */
  heard?: Mention;
  /** The guest asked the bartender something and waits for the answer. */
  asked?: boolean;
  /** Acts that need a roll or an effect from the rules. */
  intent?: 'leave-gentle' | 'leave-firm' | 'leave-rude' | 'refuse';
}

const hash = (text: string) => [...text].reduce((total, character) => ((total * 31) + character.charCodeAt(0)) >>> 0, 2166136261);
export const choose = <T,>(list: readonly T[], seed: string) => list[hash(seed) % list.length]!;
const bad = (emotion: Emotion) => emotion === 'upset' || emotion === 'angry' || emotion === 'tired' || emotion === 'nervous' || emotion === 'lonely';
const stageOf = (social: GuestSocial) => drunkStage(social.drunk);

// ---- How the guest sounds when they walk in ----
const OPENERS: Record<Emotion, string[]> = {
  happy: ['Hi! What a great evening!', 'Hello there! I am in such a good mood tonight.', 'Hey! Good to be here. I have been looking forward to this all week.', 'Hi! Everything is going right today.'],
  upset: ['Hi… it has been a really hard day.', 'Hello. Sorry, I am not in the best mood.', 'Hey. I just need to sit down for a bit.', 'Hi. I had a terrible phone call earlier.'],
  angry: ['Finally, a place to sit! What a terrible day.', 'Do not ask. Just give me a drink.', 'I am so angry right now. Some people are unbelievable!', 'Ugh. Do you know how rude people can be?'],
  tired: ['Hi… I am exhausted.', 'Long shift. My feet are killing me.', 'Hello. I can barely keep my eyes open.', 'Hey. I need something to wake me up. Or to calm me down. I am not sure which.'],
  excited: ['Hi! Guess what? Today is a big day for me!', 'Hello! I have some big news tonight.', 'Hey! I can not stop smiling today!', 'Hi! I have so much to tell somebody!'],
  lonely: ['Hello. It is a bit quiet at home, so I came here.', 'Hi. Do you mind if I sit here for a while?', 'Hey. Nice place. I do not know anyone here.', 'Hi. I just wanted to be around people.'],
  nervous: ['Hi… is it OK if I sit here? I am a bit nervous.', 'Hello. I have an important day tomorrow, and I can not relax.', 'Hey. My heart is beating so fast tonight.', 'Hi. I have never been here before.'],
  relaxed: ['Hello! Nice and quiet here.', 'Hi. I just want to enjoy a calm drink.', 'Hey, good evening. I have no plans tonight.', 'Hello. What a lovely place.']
};
const DRUNK_OPENERS: Record<DrunkStage, string[]> = {
  sober: [],
  tipsy: ['Hehe, hello! I am already a little happy tonight.', 'Hi! I had a drink with friends before. Just one. Maybe two.'],
  drunk: ['Heeey! I am… totally fine. *hic*', 'Hello, hello! Is this… is this the bar? Good. Good!', 'Hiii! I am not drunk. Why does everybody ask?'],
  'very-drunk': ['Heyyy… *hic* …can I sit here? Is this chair… yours?', 'Whoa. The floor is moving. Hello! One drink. Just one more drink.']
};
const ASKS = ['Can you help me choose a drink?', 'What would you recommend?', 'Can you help me pick something?', 'I do not know what to order. Can you help?', 'What do you suggest?', 'Any ideas?'];

// The first clue is said the way a person would say it, in a few different ways.
const CLUE_TASTE = [(c: string) => `I love the taste of ${c}.`, (c: string) => `Something with ${c} would be nice.`, (c: string) => `I have been thinking about ${c} all day.`, (c: string) => `I feel like having something with ${c}.`, (c: string) => `I am in the mood for ${c}, I think.`];
const CLUE_BUBBLES = ['I love drinks with bubbles.', 'Something with bubbles would be nice.', 'I am in the mood for bubbles tonight.'];
const CLUE_STYLE = [(c: string) => `I like ${c} drinks.`, (c: string) => `I usually go for something ${c}.`, (c: string) => `Something ${c} would be good.`, (c: string) => `I am more of a ${c} person, honestly.`];
export function clueLine(label: string, kind: 'taste' | 'bubbles' | 'style', seed: string) {
  if (kind === 'bubbles') return choose(CLUE_BUBBLES, seed);
  return choose(kind === 'taste' ? CLUE_TASTE : CLUE_STYLE, seed)(label);
}

// A guest says what they want once. Often they do not ask at all, because the clue is already a hint.
export function askLine(seed: string, hasClue: boolean) {
  if (hasClue && hash(seed + 'noask') % 100 < 45) return '';
  return choose(ASKS, seed + 'a');
}

// After some chat the guest remembers why they came.
// This is a bar, not a chat room: after a few words the guest comes back to the order.
const BACK_TO_ORDER = ['Anyway, what would you recommend?', 'So, what can you offer me?', 'But enough talking. What do you suggest?', 'Right, the drink! What would you suggest?', 'Can we talk about my drink now?', 'Anyway… can you help me choose something?'];
/** The guest’s own questions in a small-talk answer are dropped: the order is the question. */
export const withoutTrailingQuestion = (text: string) => {
  const sentences = text.match(/[^.!?…]+[.!?…]*\s*/g) ?? [text];
  const kept = sentences.filter((part) => !part.trim().endsWith('?')).join('').trim();
  return kept.length > 8 ? kept : text;
};
export const backToOrder = (seed: string) => choose(BACK_TO_ORDER, seed);

// A short, human answer to a hello that does not repeat the ask.
const HELLO_BACK: Record<string, string[]> = {
  warm: ['Hello! Nice to meet you.', 'Hi there!', 'Good evening to you too!', 'Hey! Lovely place you have.'],
  flat: ['Hello.', 'Hi.', 'Evening.'],
  shy: ['Um… hello.', 'Hi… thanks.']
};
export function helloBack(customer: Customer, seed: string) {
  const emotion = customer.social?.emotion;
  const tone = emotion === 'angry' || emotion === 'upset' || emotion === 'tired' ? 'flat' : emotion === 'nervous' ? 'shy' : 'warm';
  return choose(HELLO_BACK[tone]!, seed);
}

// A guest who comes back for another drink after a while.
const RETURNING: Record<Emotion, string[]> = {
  happy: ['Another round, please! This is a great evening.', 'I would like one more. You are a good bartender!'],
  upset: ['Another one, please. I still feel a bit down.', 'One more, please. It helps me think.'],
  angry: ['Another one. I am still angry, honestly.', 'One more, please. Make it quick.'],
  tired: ['One more, please. Then I will go home.', 'Another one, please. Something to wake me up this time.'],
  excited: ['Another one! I can not stop celebrating!', 'One more, please. Something special this time!'],
  lonely: ['Could I have another one, please? I like it here.', 'One more drink, please. Do you mind if I stay a little?'],
  nervous: ['Another one, please. I feel a bit better now.', 'One more, please. My hands are still shaking.'],
  relaxed: ['Another one, please. I am in no hurry.', 'One more, please. Surprise me!']
};

export function openingFor(customer: Customer) {
  const social = customer.social;
  if (!social) return undefined;
  const seed = `${customer.id}:open:${social.rounds}`;
  const stage = stageOf(social);
  if (social.rounds > 0) {
    const extra = stage === 'drunk' || stage === 'very-drunk' ? ' *hic*' : '';
    return { text: `${choose(RETURNING[social.emotion], seed)}${extra}`, ask: choose(['What would you suggest this time?', 'Can you choose something for me?', 'Surprise me?'], seed + 'r'), seed };
  }
  const drunkLine = DRUNK_OPENERS[stage].length ? choose(DRUNK_OPENERS[stage], seed + 'd') : undefined;
  const feeling = drunkLine && stage !== 'tipsy' ? drunkLine : choose(OPENERS[social.emotion], seed);
  const extra = drunkLine && stage === 'tipsy' ? ` ${drunkLine}` : '';
  return { text: `${feeling}${extra}`, ask: choose(ASKS, seed + 'a'), seed };
}

// ---- Small talk ----
const HOW_ARE_YOU: Record<Emotion, string[]> = {
  happy: ['I am great, thanks for asking! And you?', 'Fantastic! This place has a really good feeling tonight.', 'Very good, thank you. It has been a lovely day.'],
  upset: ['Not great, to be honest. Thanks for asking.', 'I have been better. It has been a hard day.', 'Hmm… not really OK. But it is kind of you to ask.'],
  angry: ['Do you really want to know? Terrible!', 'Do not ask. Seriously. I am so angry I can not think.', 'Not good. Some people are just unbelievable.'],
  tired: ['Tired. Very tired. And you?', 'I am hanging in there… barely.', 'Honestly? I just want to sit and do nothing.'],
  excited: ['Amazing! I can not stop smiling today!', 'Great! I have so much to tell you!', 'Fantastic. It is one of those days when everything works.'],
  lonely: ['Okay, I guess. It is nice that somebody asks.', 'A bit quiet today. It is good to talk to someone.', 'Fine, thanks. I do not talk to many people these days.'],
  nervous: ['A bit nervous, but OK.', 'Honestly, my stomach is full of butterflies.', 'I am fine… I am fine. Just a little stressed.'],
  relaxed: ['Calm and happy. How about you?', 'Very good. Nothing to complain about.', 'I am good, thanks. It is a nice, quiet evening.']
};

// Said again later, so the guest seems to remember the story they told.
const CALLBACK: Record<TalkTopic, { bad: string[]; good: string[] }> = {
  work: { bad: ['Work has been so heavy lately, you know.', 'Sorry, I keep thinking about work.'], good: ['I still cannot believe the news from work!', 'Work is going so well. It feels strange.'] },
  relationship: { bad: ['I keep thinking about my partner, sorry.', 'It is hard not to think about us tonight.'], good: ['I cannot stop thinking about my date.', 'I keep smiling about it.'] },
  money: { bad: ['Money is still on my mind, to be honest.', 'Sorry, I keep adding up numbers in my head.'], good: ['It is nice not to worry about money for once.', 'I can finally relax about it.'] },
  family: { bad: ['My family is still on my mind.', 'I should call home later.'], good: ['I am so happy about my family news.', 'I cannot wait to tell everyone.'] },
  sports: { bad: ['That match is still on my mind.', 'I will not forget that game for a while.'], good: ['I am still thinking about that match!', 'What a game. I will remember it for years.'] },
  celebration: { bad: ['It is a strange birthday, but this helps.', 'Today has not gone as I hoped.'], good: ['It is such a special day for me.', 'I want tonight to last forever.'] },
  travel: { bad: ['I am still annoyed about the trip.', 'Travel is harder than it looks.'], good: ['I am already dreaming about the trip.', 'I cannot wait to go.'] },
  health: { bad: ['I hope tomorrow goes well.', 'Health worries are tiring.'], good: ['It feels good to be well.', 'I feel lighter than I have in months.'] },
  weather: { bad: ['I am still cold, to be honest.', 'This weather is not on my side.'], good: ['What a night it is outside.', 'The weather is making my day.'] }
};
const REPEAT_HOW: Record<Emotion, string[]> = {
  happy: ['Still great, thank you!', 'Even better than before, to be honest.'], upset: ['A bit better, actually. Thanks.', 'The same, but talking helps.'], angry: ['Calmer. A little.', 'Still angry, but less so.'],
  tired: ['Still tired. This chair is helping.', 'A bit less tired. Thank you.'], excited: ['Still excited!', 'Even more excited now!'], lonely: ['Better now that I have someone to talk to.', 'Less lonely, thanks.'],
  nervous: ['A little calmer now.', 'Still a bit nervous, but OK.'], relaxed: ['Still relaxed. This is nice.', 'Good, thanks. Nothing has changed.']
};
const REPEAT_STORY = ['Like I said… but thank you for listening.', 'I already told you. But talking helps, honestly.'];

const EMPATHY: Record<Emotion, string[]> = {
  upset: ['Thank you. That actually helps.', 'Thanks for listening. Not many people do.', 'You are kind. I feel a little better already.'],
  angry: ['Hmm… thanks. I am still angry, but thank you.', 'OK, OK. You are right. Maybe I am shouting too much.', 'Thanks. Sorry, I should not take it out on you.'],
  tired: ['Thanks. I just need some rest.', 'That is kind of you. I will be fine after a good sleep.'],
  lonely: ['Thank you. It means a lot to hear that.', 'You are really kind. I do not hear that often.'],
  nervous: ['Thanks. I am breathing slowly… it helps.', 'Yes. You are right. It will probably be fine.'],
  happy: ['Thank you! That is kind of you.', 'Thanks! I know I am lucky.'],
  excited: ['Thank you! You are making my night.', 'Thanks! I can not wait to tell everyone.'],
  relaxed: ['Thanks, that is kind.', 'Thank you. You are easy to talk to.']
};
const COMPLIMENT: { good: string[]; bad: string[] } = {
  good: ['Ha, thank you! You made my night.', 'Oh, thank you! You are very kind.', 'You are sweet. Thank you!', 'Stop it, you are making me blush!', 'That is really nice to hear. Thanks!'],
  bad: ['Flattery… but thanks. It did make me smile a little.', 'You are sweet. OK, that helped a little.', 'Hmm. Thank you. I needed that.']
};
const TOPIC_CHAT: Record<'weather' | 'sports' | 'music' | 'travel', { match: string[]; other: string[] }> = {
  weather: { match: ['Yes! The weather is all I can think about tonight.'], other: ['Yes, the weather is strange this week.', 'True. I never know what to wear these days.'] },
  sports: { match: ['I love sports! Do you follow a team?'], other: ['Not really my thing, but I watch the big matches.', 'I only watch when my friends invite me.'] },
  music: { match: ['I love live music! Do you play anything?'], other: ['I like all kinds of music. Pop, jazz, anything good.', 'Music helps me relax after work.'] },
  travel: { match: ['I love to travel! Have you been anywhere nice?'], other: ['I would love to travel more. Where would you go?', 'One day I want to see Japan.'] }
};
const WATER: Record<DrunkStage, string[]> = {
  sober: ['No, thanks, I am good.', 'Yes, please. A glass of water is perfect.'],
  tipsy: ['Water? Sure, why not.', 'Good idea, thanks.'],
  drunk: ['Water? I am not thirsty… OK, maybe a small glass.', 'Hehe, you think I am drunk? …Maybe a little. Yes, water, please.'],
  'very-drunk': ['I am fine! …Oh, water. Yes. Thank you.', 'Whaaat? …OK. OK. Water.']
};
const FOOD = ['Yes! I am starving. What do you have?', 'Maybe something small. What do you have?', 'Now that you say it, I am a bit hungry. What is good here?', 'Yes, please. Something to share, if you have it.'];
const TAXI: Record<DrunkStage, string[]> = {
  sober: ['That is kind, but I am fine for now. Thank you!', 'Yes, a taxi would be great when I am ready.'],
  tipsy: ['Maybe later, thanks. That is a good idea.'],
  drunk: ['A taxi? …Yes. Yes, that is a good idea. Thank you.', 'I can drive! …Hmm. No. OK. Call a taxi.'],
  'very-drunk': ['Taxi… yes… please… I do not know where my keys are.']
};
const ASHTRAY = { smoker: ['Yes, please. You are a lifesaver!', 'Yes, thank you. I was just going to ask.'], other: ['No, thanks, I do not smoke.'] };
const CHECK_IN: Record<Emotion, string[]> = {
  happy: ['It is perfect, thank you!', 'Yes, it is great!'], upset: ['It is fine. Thanks for asking.', 'Yes, thank you. It helps.'], angry: ['It is OK. Better than my day.', 'Fine, thanks.'],
  tired: ['Yes, thanks. I am just resting.', 'It is good. I am so sleepy.'], excited: ['It is amazing!', 'Perfect! Everything is perfect tonight.'], lonely: ['Yes, thank you. It is nice that you ask.', 'It is good. I like it here.'],
  nervous: ['Yes, thanks. It is helping a bit.', 'It is fine. Thank you.'], relaxed: ['Lovely, thank you.', 'It is just right.']
};
const NOT_YET_ORDER = ['Not yet, thanks. Maybe in a few minutes.', 'I am still enjoying this one. Ask me again later!', 'Let me finish this one first.', 'Give me a little time, I am not in a hurry.'];
const THANKS = ['No problem!', 'Anytime.', 'Ha, that is my line!', 'My pleasure.', 'Of course!', 'Do not mention it.'];
const APOLOGY = ['It is OK. Do not worry about it.', 'Thanks for saying that.', 'No problem. It happens.', 'Do not worry. These things happen.', 'That is fine, really.'];
const NOT_YET = ['Oh, I am not leaving yet. I am still enjoying my drink!', 'Not yet! I want to stay a little longer.'];
const RUDE: string[] = ['Excuse me? That was rude.', 'Wow. Is that how you talk to guests?', 'I do not have to listen to that.'];
const REFUSE: Record<DrunkStage, string[]> = {
  sober: ['Enough? I am fine! …But OK, maybe you are right.', 'Really? I only had a few. Well… alright.'],
  tipsy: ['Enough? I am fine! …But OK, maybe you are right.', 'Hmm. Just one more? No? OK, OK.'],
  drunk: ['What? No! One more, come on!', 'I am not drunk! I am just… happy.', 'You can not do that! I am a paying guest!'],
  'very-drunk': ['Whaaat? Noooo! One mooore!', 'You… you do not understand. I am fine! *hic*']
};
const REFUSE_FRIENDLY = ['…You are right. You are a good bartender. OK.', 'Fair enough. Thank you for looking after me.'];

// ---- Asking someone to leave: the lines depend on how it ended (the rules roll the outcome) ----
export type LeaveOutcome = 'leaves' | 'stays' | 'escalates';
export type LeaveTone = 'gentle' | 'firm' | 'aggressive';
const LEAVE_LINES: Record<LeaveOutcome, Record<LeaveTone, string[]>> = {
  leaves: {
    gentle: ['You are right. It is late. Thanks for everything.', 'OK, OK. I will go home. Thank you for the evening!', 'Fair enough. Good night!'],
    firm: ['Fine. I am going. No need to shout.', 'OK. I understand. Sorry for the trouble.'],
    aggressive: ['Fine! I am leaving! What a terrible bar!', 'Whatever. I never want to come back!']
  },
  stays: {
    gentle: ['Leave? I just got here! One more drink and I will go.', 'No, no, no. I am fine. Really. Just one more.'],
    firm: ['You can not throw me out! I am a paying guest!', 'Why? I did nothing wrong!'],
    aggressive: ['Do not talk to me like that!', 'Who do you think you are?']
  },
  escalates: {
    gentle: ['Do not tell me what to do!', 'I am not going anywhere!'],
    firm: ['Do not tell me what to do! I will leave when I want!', 'Try to make me!'],
    aggressive: ['Say that again! I dare you!', 'You want a fight? Come on, then!']
  }
};
export const leaveLine = (outcome: LeaveOutcome, tone: LeaveTone, seed: string) => choose(LEAVE_LINES[outcome][tone], seed);
export const TAXI_ACCEPTED = ['Thank you so much. You are really kind.', 'A taxi… yes. That is very thoughtful. Thank you.', 'Thank you. I feel much safer now.'];
export const TAXI_ARRIVED = ['The taxi is here. Thank you for everything! Good night.', 'My taxi is outside. Thanks for looking after me!'];

// ---- Making a drunk guest sound drunk (readable: stretched vowels, hiccups, slips of the tongue) ----
// Words that can lose their capital after “Hmm…”; names of places and people keep it.
const COMMON_FIRST = new Set(['The', 'It', 'My', 'We', 'This', 'That', 'Yes', 'No', 'Not', 'Oh', 'Well', 'So', 'And', 'But', 'Do', 'Is', 'Are', 'What', 'Why', 'How', 'Honestly', 'Thanks', 'Thank', 'Sorry', 'Maybe', 'Tired', 'Very', 'Fine', 'Good', 'Great', 'Hello', 'Hi', 'Sad', 'Stressed', 'Proud', 'Happy', 'Wet', 'Light', 'Warm', 'Loved', 'Free', 'Rich', 'Relieved', 'Worried', 'Furious', 'Excited', 'Nervous', 'Calm', 'Over', 'Still', 'Never', 'Dreaming', 'Rested', 'Alone', 'A', 'An', 'Then', 'Now', 'There', 'In', 'On', 'Our', 'Everyone', 'Everybody', 'Nobody']);
export function voice(customer: Customer, line: string, turn: number, local = true) {
  const social = customer.social;
  if (!social) return line;
  // Where the guest comes from changes the spelling and adds a local word now and then.
  // Local words belong in light moments: not when the guest is drunk, angry, upset or nervous.
  const light = drunkStage(social.drunk) === 'sober' && !['angry', 'upset', 'nervous'].includes(social.emotion);
  const text = local && light ? localize(customer, line, turn) : spellFor(originOf(customer), line);
  const seed = `${customer.id}:${turn}`;
  const stage = stageOf(social);
  if (stage === 'sober') return social.emotion === 'tired' && hash(seed) % 3 === 0 && !text.startsWith('…') ? `Hmm… ${COMMON_FIRST.has(text.split(/[\s,?.!…]/)[0]!) ? text.charAt(0).toLowerCase() + text.slice(1) : text}` : text;
  if (stage === 'tipsy') return hash(seed) % 3 === 0 && !text.endsWith('?') ? `${text} Hehe.` : text;
  const words = text.split(' ');
  const index = hash(seed + 's') % words.length;
  words[index] = words[index]!.replace(/([aeiou])([^aeiou]*)$/i, (_match, vowel: string, rest: string) => `${vowel.repeat(3)}${rest}`);
  let result = words.join(' ');
  if (hash(seed + 'h') % 2 === 0) result = result.replace(/([.!?])$/, ' *hic*$1');
  if (stage === 'very-drunk' && hash(seed + 'v') % 3 === 0) result += ' …What was I saying?';
  return result;
}

// ---- The guest's answer to a sentence the bartender says ----
const rapportBy = (social: GuestSocial, value: number) => Math.round(value * (social.emotion === 'angry' ? .5 : 1));

// The guest tells a story that is made for them (see gen/story.ts): the follow-up questions come from the same story.
function tellStory(customer: Customer, kind: 'good' | 'bad') {
  const frame = makeStory(customer.id, customer.social!.topic, kind);
  return { text: frame.tell, thread: { topic: frame.topic, kind, frame } };
}

export function socialReply(customer: Customer, acts: Act[], turn: number, said = ''): SocialReply | undefined {
  const social = customer.social;
  // A thing the player mentions (a sport, a food, a place) gets a reaction with an opinion of its own.
  const mention = social && said ? mentionIn(said) : undefined;
  if (social && mention && (!acts.length || ['weather', 'sports', 'music', 'travel'].includes(acts[0]!))) {
    // A guest with something heavy on their mind does not switch subject at once.
    const distracted = (social.emotion === 'upset' || social.emotion === 'angry' || social.emotion === 'tired' || social.emotion === 'nervous') && social.thread?.kind === 'bad';
    const reaction = reactToMention(customer, mention, `${customer.id}:${turn}:m`, { stance: stanceOf(said), distracted, topic: social.thread?.topic ?? social.topic, ordering: social.phase === 'ordering' });
    return { text: reaction.text, expression: reaction.opinion === 'love' ? 'happy' : 'smile', rapport: reaction.opinion === 'love' ? 6 : reaction.opinion === 'meh' ? 3 : 1, heard: mention, asked: reaction.asks && social.phase === 'enjoying', chatted: 'mention' };
  }
  // A guest who asked the bartender a question reacts to whatever comes back, in a human way.
  if (social && social.asked && social.phase === 'enjoying' && (!acts.length || ['weather', 'sports', 'music', 'travel'].includes(acts[0]!))) return { text: reactToAnswer(`${customer.id}:${turn}`), expression: 'smile', rapport: 3 };
  if (!social || !acts.length) return undefined;
  const seed = `${customer.id}:${turn}`;
  const emotion = social.emotion;
  const stage = stageOf(social);
  const main = acts[0]!;

  if (isLeaveAct(main)) return { text: '', expression: 'disappointed', rapport: 0, intent: main === 'leaveGentle' ? 'leave-gentle' : main === 'leaveFirm' ? 'leave-firm' : 'leave-rude' };
  if (main === 'rude') return { text: choose(RUDE, seed), expression: 'disappointed', rapport: -16 };
  if (main === 'refuse') {
    const friendly = social.rapport >= 62;
    return { text: choose(friendly ? REFUSE_FRIENDLY : REFUSE[stage], seed), expression: friendly ? 'smile' : 'disappointed', rapport: friendly ? -2 : -6, intent: 'refuse' };
  }
  if (main === 'offerTaxi') return { text: choose(TAXI[stage], seed), expression: 'smile', rapport: 4 };
  if (main === 'offerWater') return { text: choose(WATER[stage], seed), expression: 'smile', rapport: 3 };
  if (main === 'offerAshtray') return { text: choose(customer.smoker ? ASHTRAY.smoker : ASHTRAY.other, seed), expression: 'smile', rapport: customer.smoker ? 6 : 1 };

  if (main === 'askProblem' || (main === 'askMore' && !social.thread && !social.told)) {
    const group = bad(emotion) ? 'bad' : 'good';
    if (social.told) return { text: choose(REPEAT_STORY, seed), expression: 'thinking', rapport: 2 };
    const story = tellStory(customer, group);
    return { text: story.text, expression: group === 'bad' ? 'disappointed' : 'very-happy', rapport: rapportBy(social, 8), told: true, chatted: 'story', thread: story.thread };
  }
  if (main === 'empathy') {
    // Good news deserves a happy reply; sad news needs comfort. Rapport rises either way.
    const comfort = bad(emotion) && social.rapport + 8 >= 58 ? 'relaxed' as Emotion : undefined;
    return { text: embellish(choose(EMPATHY[emotion], seed), social, seed), expression: bad(emotion) ? 'smile' : 'happy', rapport: rapportBy(social, 9), emotion: comfort, chatted: 'empathy' };
  }
  if (main === 'compliment') return { text: embellish(choose(bad(emotion) ? COMPLIMENT.bad : COMPLIMENT.good, seed), social, seed), expression: 'happy', rapport: rapportBy(social, 5) };
  if (main === 'howAreYou' && social.chatted.includes('how')) return { text: choose(REPEAT_HOW[emotion], seed), expression: 'smile', rapport: rapportBy(social, 3) };
  if (main === 'howAreYou') return { text: embellish(choose(HOW_ARE_YOU[emotion], seed), social, seed), expression: bad(emotion) ? 'thinking' : 'smile', rapport: rapportBy(social, 6), chatted: 'how' };
  if ((PERSONA_ACTS as string[]).includes(main)) {
    // The guest has a life that stays the same all evening: the same job, hobby, home town and pet.
    const answer = personaAnswer(customer, main as PersonaAct);
    return { text: answer.text, expression: 'smile', rapport: rapportBy(social, main === 'askWork' ? 4 : 5), chatted: main === 'askWork' ? 'work' : main, asked: answer.asks };
  }
  if (main === 'askWhy' || main === 'askMore' || main === 'askHow' || main === 'askWho') {
    const answer = threadAnswer(customer, social, main as ThreadAct);
    return { text: answer.text, expression: social.thread ? (bad(emotion) ? 'disappointed' : 'happy') : 'thinking', rapport: rapportBy(social, answer.rapport), chatted: 'thread' };
  }
  if (main === 'askName') return { text: `I am ${customer.name}. Nice to meet you!`, expression: 'smile', rapport: rapportBy(social, 3) };
  if (main === 'askAllergy') {
    // Asking is always good service. A guest with an allergy says so, and now the bartender knows.
    if (social.allergy) {
      social.allergyKnown = true;
      const nuts = ['Yes, actually. I am allergic to nuts. Thank you for asking, that is very kind!', 'Oh, good question. Yes, nuts. Please keep them away from me.', 'I do have one: nuts. Even a little is a problem. Thanks for checking!'];
      const dairy = ['Yes, I cannot have dairy. No cheese or cream for me, please. Thank you for asking!', 'Good that you ask. Milk and cheese make me ill, so none of those, please.', 'Dairy, yes. I just cannot eat it. Thanks for being careful!'];
      return { text: choose(social.allergy === 'nuts' ? nuts : dairy, seed), expression: 'smile', rapport: rapportBy(social, 8) };
    }
    return { text: choose(['No, I can eat everything, thanks.', 'Nope, nothing like that. Thanks for asking!', 'No allergies. Why, is something in it?', 'I am fine with everything, thank you.', 'No, nothing. That is thoughtful of you.'], seed), expression: 'smile', rapport: rapportBy(social, 4) };
  }
  if (main === 'offerFood') return { text: social.hungry === false ? 'No, thanks. I am not hungry right now.' : choose(FOOD.slice(0, 2), customer.id + 'food'), expression: 'smile', rapport: 2 };
  if (main === 'checkIn') return { text: embellish(choose(CHECK_IN[emotion], seed), social, seed), expression: 'smile', rapport: rapportBy(social, 3) };
  if (main === 'offerAnother' && social.phase === 'enjoying') return { text: choose(NOT_YET_ORDER, seed), expression: 'smile', rapport: 1 };
  if (main === 'thanks') {
    // Now and then a guest who told a story comes back to it.
    const told = social.chatted.includes('empathy') || social.chatted.includes('story');
    const back = told && hash(seed + 'cb') % 100 < 40 ? ` ${choose(CALLBACK[social.topic][bad(emotion) ? 'bad' : 'good'], seed + 'c')}` : '';
    return { text: `${choose(THANKS, seed)}${back}`, expression: 'smile', rapport: 1 };
  }
  if (main === 'apology') return { text: embellish(choose(APOLOGY, seed), social, seed), expression: 'smile', rapport: rapportBy(social, 5) };
  if (main === 'goodbye') return { text: choose(NOT_YET, seed), expression: 'smile', rapport: 0 };
  if (main === 'weather' || main === 'sports' || main === 'music' || main === 'travel') {
    const matches = (social.topic === main) || (main === 'sports' && social.topic === 'sports');
    const bank = TOPIC_CHAT[main];
    if (matches && !social.told) { const story = tellStory(customer, bad(emotion) ? 'bad' : 'good'); return { text: story.text, expression: bad(emotion) ? 'disappointed' : 'very-happy', rapport: rapportBy(social, 8), told: true, chatted: main, thread: story.thread }; }
    return { text: choose(matches ? bank.match : bank.other, seed), expression: 'smile', rapport: rapportBy(social, 3), chatted: main };
  }
  return undefined;
}

export { actsIn };

// What a seated guest says when the bartender walks over: the thing they need, or just how they feel.
const NEED_LINES: Record<string, string[]> = {
  ashtray: ['Excuse me, could I have an ashtray, please?', 'Could you bring me an ashtray, please?'],
  water: ['Could I have a glass of water, please?', 'Excuse me, some water, please. I need it.'],
  taxi: ['Excuse me… could you call me a taxi? I think it is time to go home.', 'Could you call me a taxi, please? I do not feel safe driving.'],
  chat: ['Do you have a minute? I would like to talk to someone.', 'Hey, are you busy? I just want to chat for a bit.']
};
const ENJOYING: Record<Emotion, string[]> = {
  happy: ['This drink is great! You really know what you are doing.', 'I am having such a good time here.'],
  upset: ['I am just sitting here. It helps a little.', 'Thanks for the drink. I just need a quiet moment.'],
  angry: ['I am calming down. A little.', 'Do not worry about me. I am just thinking.'],
  tired: ['I am just resting for a minute, if that is OK.', 'This chair is so comfortable. I could fall asleep.'],
  excited: ['I still can not believe my day!', 'I want to tell everyone my news!'],
  lonely: ['It is nice to be around people.', 'I like it here. Do you mind if I stay for a while?'],
  nervous: ['I am feeling a bit better now, thanks.', 'Just breathing. It helps.'],
  relaxed: ['Lovely music. Lovely drink.', 'I could stay here all night.']
};
export function enjoyingOpening(customer: Customer, now: number) {
  const social = customer.social;
  if (!social) return 'Everything is fine, thank you.';
  const need = social.need && social.need.since <= now ? social.need.kind : undefined;
  return need ? choose(NEED_LINES[need]!, `${customer.id}:${need}`) : choose(ENJOYING[social.emotion], `${customer.id}:enjoy:${social.rounds}`);
}
