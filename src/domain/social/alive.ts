import type { Customer } from '../types';
import { originOf } from './origin';
import type { GuestSocial, TalkTopic } from './model';
import type { StoryFrame } from './gen/story';

// What makes a guest feel like a person and not a menu: a life of their own (a job, a hobby, a pet, a home town that
// stay the same all evening), stories that go deeper when the bartender asks "why?" or "tell me more", questions
// the guest asks back, things they say on their own while they sit, and how they react to the drink.

const hash = (text: string) => [...text].reduce((total, character) => ((total * 31) + character.charCodeAt(0)) >>> 0, 2166136261);
const choose = <T,>(list: readonly T[], seed: string) => list[hash(seed) % list.length]!;
const key = (customer: Pick<Customer, 'id' | 'characterId'>) => customer.characterId ?? customer.id;

// ---------------------------------------------------------------- Persona
export interface Persona { job: string; hobby: string; city: string; pet?: { kind: 'dog' | 'cat'; name: string }; plans: string; family: string; regular: boolean }

const JOBS = ['a nurse', 'a bank clerk', 'a teacher', 'a delivery driver', 'an engineer', 'a student', 'a cook in a restaurant', 'a web designer', 'a taxi driver', 'a shop manager', 'an electrician', 'a journalist'];
const HOBBIES = ['play football on Sundays', 'paint small landscapes', 'cook for my friends', 'go hiking in the hills', 'play the guitar, badly', 'read crime novels', 'run in the park', 'grow tomatoes on my balcony', 'take photos of old buildings', 'learn Spanish', 'collect old vinyl records', 'swim in the morning'];
const CITIES: Record<string, string[]> = {
  us: ['Chicago', 'Austin', 'Boston', 'Denver'], uk: ['Manchester', 'Leeds', 'Bristol', 'Glasgow'], uz: ['Samarkand', 'Tashkent', 'Bukhara', 'Fergana'],
  de: ['Hamburg', 'Cologne', 'Leipzig', 'Munich'], ro: ['Cluj', 'Brasov', 'Iasi', 'Timisoara'], jp: ['Osaka', 'Kyoto', 'Sendai', 'Nagoya'],
  in: ['Pune', 'Jaipur', 'Kochi', 'Delhi'], au: ['Perth', 'Brisbane', 'Adelaide', 'Hobart']
};
const DOGS = ['Max', 'Luna', 'Rex', 'Bella', 'Buddy'];
const CATS = ['Misty', 'Oscar', 'Mimi', 'Simba', 'Tiger'];
const PLANS = ['I am visiting my parents this weekend.', 'Nothing special. Maybe a long sleep.', 'I want to try a new restaurant on Saturday.', 'I am meeting some old friends tomorrow.', 'I have to clean my flat, sadly.', 'I might go to the mountains if the weather is good.'];
const FAMILY = ['I have a big family: three brothers and a very loud mother.', 'It is just me and my sister. We talk every day.', 'I live alone, but my parents call me every night.', 'I have a small daughter. She is five and she is the boss.', 'My grandmother lives with us. She cooks too much.'];

export function personaOf(customer: Pick<Customer, 'id' | 'characterId'>): Persona {
  const k = key(customer);
  const origin = originOf(customer);
  const hasPet = hash(`${k}:pet`) % 100 < 45;
  const dog = hash(`${k}:kind`) % 2 === 0;
  return {
    job: choose(JOBS, `${k}:job`), hobby: choose(HOBBIES, `${k}:hobby`), city: choose(CITIES[origin.id] ?? CITIES.us!, `${k}:city`),
    pet: hasPet ? { kind: dog ? 'dog' : 'cat', name: choose(dog ? DOGS : CATS, `${k}:petname`) } : undefined,
    plans: choose(PLANS, `${k}:plans`), family: choose(FAMILY, `${k}:family`), regular: hash(`${k}:regular`) % 100 < 25
  };
}

export type PersonaAct = 'askWork' | 'askHobby' | 'askFrom' | 'askPet' | 'askPlans' | 'askFirst' | 'askFamily';
export const PERSONA_ACTS: PersonaAct[] = ['askWork', 'askHobby', 'askFrom', 'askPet', 'askPlans', 'askFirst', 'askFamily'];

export function personaAnswer(customer: Customer, act: PersonaAct): { text: string; asks: boolean } {
  const p = personaOf(customer);
  const seed = `${customer.id}:${act}`;
  switch (act) {
    case 'askWork': return { text: `${choose(['I am', 'I work as', 'I am working as'], seed)} ${p.job}. And you? Do you like being a bartender?`, asks: true };
    case 'askHobby': return { text: `In my free time I ${p.hobby}. It keeps me sane. What about you?`, asks: true };
    case 'askFrom': return { text: choose([`I am from ${p.city}. Have you ever been there?`, `I come from ${p.city}, but I live here now.`, `${p.city}. It is a long way from here.`], seed), asks: false };
    case 'askPet': return { text: p.pet ? `Yes! I have a ${p.pet.kind} called ${p.pet.name}. ${p.pet.kind === 'dog' ? 'We walk every morning.' : 'She owns the sofa.'}` : choose(['No pets. My flat is too small, sadly.', 'Not now. I had a cat once. Do you have any?'], seed), asks: !p.pet };
    case 'askPlans': return { text: `${p.plans} And you?`, asks: true };
    case 'askFirst': return { text: p.regular ? choose(['Yes, I come here now and then. I like the atmosphere.', 'I am a bit of a regular, to be honest.'], seed) : choose(['No, it is my first time. I like it so far.', 'First time! A friend told me about this place.'], seed), asks: false };
    case 'askFamily': return { text: p.family, asks: false };
  }
}

// ---------------------------------------------------------------- Story threads: the bartender asks why, who, how
// Layer 1 is the story the guest tells first (in talk.ts); these go deeper.
const THREAD: Record<TalkTopic, { bad: [string, string, string]; good: [string, string, string] }> = {
  work: { bad: ['My manager changed the plan at the last minute, and then I got the blame.', 'Then she said it again in front of the whole team. I just stood there.', 'I am tired of it. Maybe I should look for a new job, honestly.'], good: ['I worked on it for six months, so it means a lot to me.', 'My boss called me into her office. I thought I was in trouble!', 'Proud. And a little scared of the new job, too.'] },
  relationship: { bad: ['They said I never listen. Maybe they are right.', 'We shouted, and then nobody said anything for hours.', 'Sad, mostly. I hope we can talk tomorrow.'], good: ['We have been together for two years, and it is getting serious.', 'I even bought a new shirt. I never buy shirts!', 'Nervous and happy at the same time.'] },
  money: { bad: ['It was a big repair and I had no savings at all.', 'Now I must count every coin until next month.', 'Stressed. But I will manage. I always do.'], good: ['I worked extra hours for months to get there.', 'The first thing I did was buy my mother a gift.', 'Free. It is a nice feeling.'] },
  family: { bad: ['Everyone has a different opinion and nobody listens.', 'It ended with my brother leaving the room.', 'Tired. But they are my family. I will call tomorrow.'], good: ['We have not all been together for years.', 'My grandmother cooked for two days!', 'Warm. Full. Happy.'] },
  sports: { bad: ['We were winning until the last five minutes.', 'Then the referee gave them a very strange penalty.', 'Furious. But I will watch the next one, of course.'], good: ['We have not beaten them for ten years.', 'In the last minute! I screamed so loud that my neighbour knocked on the wall.', 'Still shaking. What a night!'] },
  celebration: { bad: ['I told everyone last week, but people forget.', 'So I came here. At least the bartender is nice.', 'A bit sad, but this drink helps.'], good: ['It is a round number, so my friends are making a fuss.', 'They hid a cake in my kitchen. I found it by accident.', 'Loved. Really loved.'] },
  travel: { bad: ['The airline said the plane had a technical problem.', 'I waited six hours at the airport and ate a very sad sandwich.', 'Tired. But I will try again tomorrow.'], good: ['I have wanted to go there since I was a child.', 'I already packed. Twice.', 'Excited! I cannot sit still.'] },
  health: { bad: ['The doctor wants to do some tests, just to be sure.', 'I keep thinking about the worst, which is silly.', 'Worried, if I am honest. Talking helps.'], good: ['I changed my habits and it really worked.', 'I walk to work now, and I sleep like a baby.', 'Great! I feel ten years younger.'] },
  weather: { bad: ['I forgot my umbrella, as always.', 'A bus splashed me from head to toe.', 'Wet, but warm now. Thank you.'], good: ['We had so many grey days.', 'I walked home the long way, just to enjoy it.', 'Light. Like summer.'] }
};
const THREAD_DONE = ['That is really all there is to it.', 'I think I told you everything now!', 'That is the whole story, honestly. Thanks for listening.'];
const THREAD_NONE = ['Good question. I am not sure, to be honest.', 'Hmm, I have not thought about that.'];

export type ThreadAct = 'askWhy' | 'askMore' | 'askHow' | 'askWho';

// A guest who is asked about their story answers from the story they told (the frame), layer by layer.
function frameAnswer(frame: StoryFrame, thread: NonNullable<GuestSocial['thread']>, act: ThreadAct, seed: string): { text: string; rapport: number; done: boolean } {
  const seen = (thread.seen ??= []);
  if (act === 'askWho') {
    const again = seen.includes('who');
    if (!again) seen.push('who');
    return { text: again ? choose(['I told you already: it was just that.', 'Same as before. Nothing more to say about that.'], seed) : frame.who, rapport: again ? 1 : 5, done: false };
  }
  const order: ('why' | 'more' | 'how')[] = act === 'askWhy' ? ['why', 'more', 'how'] : act === 'askHow' ? ['how', 'more', 'why'] : ['more', 'why', 'how'];
  const next = order.find((layer) => !seen.includes(layer));
  if (!next) return { text: choose(THREAD_DONE, seed), rapport: 1, done: true };
  seen.push(next);
  thread.depth = seen.filter((layer) => layer !== 'who').length;
  return { text: frame[next], rapport: 6, done: thread.depth >= 3 };
}
export function threadAnswer(customer: Customer, social: GuestSocial, act: ThreadAct): { text: string; rapport: number; done: boolean } {
  const thread = social.thread;
  if (!thread) return { text: choose(THREAD_NONE, `${customer.id}:none`), rapport: 0, done: false };
  if (thread.frame) return frameAnswer(thread.frame, thread, act, `${customer.id}:${thread.depth}:${act}`);
  if (thread.depth >= 3) return { text: choose(THREAD_DONE, `${customer.id}:done`), rapport: 1, done: true };
  const layer = THREAD[thread.topic][thread.kind][act === 'askHow' ? 2 : thread.depth === 2 ? 2 : thread.depth];
  thread.depth = act === 'askHow' ? 3 : Math.min(3, thread.depth + 1);
  // Showing real interest is the best small talk there is.
  return { text: layer, rapport: 6, done: thread.depth >= 3 };
}

// ---------------------------------------------------------------- Reactions
const REACT_TO_ANSWER = ['Ha, that is nice!', 'Interesting! I did not expect that.', 'Oh, I like that.', 'That sounds good to me.', 'Really? That is cool.', 'Ha! Fair enough.'];
export const reactToAnswer = (seed: string) => choose(REACT_TO_ANSWER, seed);

// How a guest reacts to the drink they get.
export function drinkReaction(guest: Customer, traits: ReadonlySet<string>, seed: string): string {
  const emotion = guest.social?.emotion ?? 'relaxed';
  const detail = traits.has('mint') ? 'The mint is so fresh.' : traits.has('lime') ? 'The lime is just right.' : traits.has('sparkling') ? 'I love the bubbles.' : traits.has('sweet') ? 'Nicely sweet, not too much.' : traits.has('sour') ? 'Fresh and sharp. Perfect.' : traits.has('strong') ? 'Strong, but I like it.' : traits.has('coffee') ? 'That wakes me up nicely.' : 'This is really good.';
  if (emotion === 'angry') return choose(['Hmm. Fine. That actually helps.', 'OK… that is better than my day, at least.'], seed);
  if (emotion === 'upset' || emotion === 'tired') return choose([`${detail} Thank you.`, 'Thanks. I needed this.'], seed);
  if (emotion === 'nervous') return choose(['Thanks. My hands are steadier already.', `${detail}`], seed);
  return choose([detail, `Mmm. ${detail}`, 'Oh, that is exactly what I wanted!', `Cheers! ${detail}`], seed);
}

// ---------------------------------------------------------------- Things a guest says on their own
export interface ChatterContext {
  guest: Customer;
  roll: number;
  eventId?: string;
  weather?: 'rain';
  /** Another guest at the bar who is very drunk or very sad. */
  neighbour?: { drunk: boolean; sad: boolean };
  traits?: ReadonlySet<string>;
  /** Minutes since the bartender last talked to this guest. */
  silentMinutes: number;
}
export interface Chatter { kind: 'drink' | 'room' | 'neighbour' | 'story' | 'life' | 'ask' | 'bored' | 'memory'; text: string; asks?: boolean; rapport?: number }

const ROOM_BY_EVENT: Record<string, string[]> = {
  'jazz-night': ['Is that live jazz? It is lovely.', 'This music is perfect for tonight.'],
  'football-night': ['Is the match on tonight? It is so loud in here!', 'Who is winning? I cannot see the screen.'],
  'ladies-night': ['Everyone is in such a good mood tonight.', 'Ladies’ night was a good idea.'],
  'happy-hour': ['Happy hour is a great idea. Everybody is here!', 'It is busy tonight, no?'],
  'quiet-night': ['I like it when it is quiet like this.', 'It is so peaceful tonight.'],
  'date-night': ['It is very romantic in here tonight.', 'Everyone seems to be on a date.'],
  'student-night': ['It is a young crowd tonight, isn’t it?', 'I feel old. Everyone is so loud!'],
  'tourist-night': ['I can hear so many languages tonight.', 'Lots of visitors here, I see.'],
  'rainy-evening': ['Listen to the rain. It is cosy in here.', 'I am glad I am not outside.']
};
const ROOM = ['I like the lights in here.', 'It smells good in here. Is that orange?', 'Nice music. Who is it?', 'This is a cosy place.', 'I like the bottles on the shelf. They look like art.'];
const BORED = ['Excuse me? Are you busy?', 'Hello? Is anyone there?', 'Sorry to bother you, but could I ask you something?'];
const DRINK_LINES: Record<string, string[]> = {
  sweet: ['This is nicely sweet.', 'I think I could drink this all night.'], strong: ['Strong, but I like it.', 'Oh, this one has a kick!'], sparkling: ['I love the bubbles.', 'The bubbles tickle my nose.'],
  sour: ['Fresh and sharp. Perfect.', 'The sour makes it come alive.'], other: ['This is a good drink.', 'Whoever invented this was a genius.', 'Mmm. Good choice.']
};

export function chatterFor(context: ChatterContext): Chatter | undefined {
  const { guest } = context;
  const social = guest.social;
  if (!social) return undefined;
  const seed = `${guest.id}:chat:${social.chatterCount ?? 0}`;
  const p = personaOf(guest);
  const options: Chatter[] = [];
  if (social.phase === 'enjoying' && context.traits) {
    const trait = ['sweet', 'strong', 'sparkling', 'sour'].find((item) => context.traits!.has(item)) ?? 'other';
    options.push({ kind: 'drink', text: choose(DRINK_LINES[trait]!, seed + 'd') });
  }
  if (context.eventId && ROOM_BY_EVENT[context.eventId]) options.push({ kind: 'room', text: choose(ROOM_BY_EVENT[context.eventId]!, seed + 'e') }, { kind: 'room', text: choose(ROOM_BY_EVENT[context.eventId]!, seed + 'f') });
  options.push({ kind: 'room', text: choose(ROOM, seed + 'r') });
  if (context.neighbour?.drunk) options.push({ kind: 'neighbour', text: choose(['That person over there is a bit loud, no?', 'I think the guest next to me has had a lot to drink.'], seed + 'n') });
  if (context.neighbour?.sad) options.push({ kind: 'neighbour', text: choose(['The person next to me looks sad. Is he OK?', 'I hope the guest over there is alright. She looks a bit lost.'], seed + 'n') });
  if (social.told && social.thread && social.thread.depth < 3 && !social.offeredStory) options.push({ kind: 'story', text: 'Sorry, I keep thinking about it. Do you mind if I tell you more?' });
  if (p.pet) options.push({ kind: 'life', text: `My ${p.pet.kind} ${p.pet.name} is probably asleep on the sofa right now.` });
  options.push({ kind: 'life', text: choose([`I should call my family later.`, `I have to be at work early tomorrow, sadly.`, `I really need a holiday, you know.`], seed + 'l') });
  // A guest who has been ignored for a while speaks up, if they are the kind who talks.
  if (context.silentMinutes >= 4 && social.rapport < 60) return { kind: 'bored', text: choose(BORED, seed + 'b'), rapport: -2 };
  // Never the same remark twice in a row.
  const fresh = options.filter((item) => item.text !== social.lastChatter);
  const pool = fresh.length ? fresh : options;
  return pool[Math.floor(context.roll * pool.length) % pool.length]!;
}

// A little extra now and then, so a polite answer does not always end at the same place.
const TAIL_GOOD = ['I am glad I came here tonight.', 'This place has a nice feeling.', 'It is good to talk to someone.', 'The evening is going better than I thought.', 'I should come here more often.'];
const TAIL_BAD = ['It helps to talk, really.', 'Sorry if I am a bit grumpy tonight.', 'It has not been an easy day.', 'Sometimes I just need a quiet corner.'];
export function embellish(text: string, social: GuestSocial, seed: string): string {
  const roll = hash(`${seed}:emb`) % 100;
  if (roll >= 40 || social.drunk >= 50 || text.length > 90) return text;
  const bad = social.emotion === 'upset' || social.emotion === 'angry' || social.emotion === 'tired' || social.emotion === 'nervous' || social.emotion === 'lonely';
  return `${text} ${choose(bad ? TAIL_BAD : TAIL_GOOD, `${seed}:tail`)}`;
}

/** Whether a guest is in the mood to say something on their own, and how long to wait for the next time. */
export const chatterGap = (social: GuestSocial, roll: number) => Math.round((social.chatty ? 2.5 : 4.5) * 60_000 + roll * (social.chatty ? 3 : 5) * 60_000);
export const talksOnOwn = (social: GuestSocial) => social.chatty || social.emotion === 'lonely' || social.emotion === 'happy' || social.emotion === 'excited' || social.drunk >= 30;
