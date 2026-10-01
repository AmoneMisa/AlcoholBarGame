import { expand, pickFrom, rngOf } from './grammar';
import type { TalkTopic } from '../model';

// Stories a guest tells, built from parts. A story has a person (when there is one), what happened, why, a detail
// and how it ended. The first telling and every follow-up ("Why?", "Tell me more.", "Who?", "How did it go?") come
// from the same frame, so the guest never contradicts themselves, and every guest has a different story.

export interface StoryFrame {
  topic: TalkTopic;
  kind: 'good' | 'bad';
  /** What the guest says first. */
  tell: string;
  /** Why it happened. */
  why: string;
  /** One more detail. */
  more: string;
  /** How it went, or how the guest feels about it. */
  how: string;
  /** Who it was (or "nobody, just bad luck"). */
  who: string;
}

interface Person { t: string; g: 'm' | 'f' | 'x' }
interface Parts { who?: Person[]; whoAnswer?: string[]; events: string[]; reasons: string[]; details: string[]; outcomes: string[] }

const P = (t: string, g: Person['g'] = 'x'): Person => ({ t, g });
const WORK = [P('my manager'), P('my boss'), P('a client'), P('a colleague'), P('my supervisor')];
const LOVE = [P('my partner'), P('my girlfriend', 'f'), P('my boyfriend', 'm')];
const KIN = [P('my mother', 'f'), P('my father', 'm'), P('my brother', 'm'), P('my sister', 'f'), P('my grandmother', 'f'), P('my uncle', 'm')];

export const STORY_PARTS: Record<TalkTopic, { bad: Parts; good: Parts }> = {
  work: {
    bad: { who: WORK, events: ['{Who} changed the plan at the last minute and then blamed me.', '{Who} shouted at me in front of the whole team.', 'I worked twelve hours today, and {who} did not even say thank you.', '{Who} gave me all the extra work on a Friday night.'],
      reasons: ['The client complained, and somebody had to take the blame.', 'There was a mistake in a report, and nobody wanted to say whose it was.', 'The deadline moved, and {he} was under a lot of pressure too.'],
      details: ['Then {he} said it again in front of everyone. I just stood there.', 'I stayed until nine. The office was empty and the lights were off.', 'My colleagues looked at their screens. Nobody said a word.'],
      outcomes: ['I am tired of it. Maybe I should look for a new job, honestly.', 'I will talk to {him} tomorrow. Calmly, I hope.', 'I do not know yet. I just want to sleep for ten hours.'] },
    good: { who: [...WORK, P('the director')], events: ['{Who} told me I got the promotion today!', 'I finished the big project today, and {who} was really happy.', '{Who} said I did the best work of the year.', 'I got a new job offer today, with a much better salary.'],
      reasons: ['I worked on it for six months, so it means a lot to me.', 'I stayed late many evenings, and finally it paid off.', 'I did not expect it at all, to be honest.'],
      details: ['{He} called me into the office. I thought I was in trouble!', 'Everyone clapped. I wanted to hide under the table.', 'My phone did not stop: all my friends sent messages.'],
      outcomes: ['Proud. And a little scared of the new work, too.', 'Happy! I will celebrate properly this weekend.', 'I feel lucky. I still cannot believe it.'] }
  },
  relationship: {
    bad: { who: LOVE, events: ['{Who} and I had a big argument this morning.', '{Who} forgot our anniversary.', '{Who} said we need to talk, and I am afraid.', 'We broke up last week, and I still cannot sleep.'],
      reasons: ['{He} said I never listen. Maybe {he} is right.', 'We both work too much, and we never have time.', 'It was about something small, but it grew and grew.'],
      details: ['We shouted, and then nobody said anything for hours.', 'I left the house and walked around the city for an hour.', 'I wrote a long message, and then I deleted it.'],
      outcomes: ['Sad, mostly. I hope we can talk tomorrow.', 'I think I need some time alone to think.', 'Tired. But I still care about {him}, that is the problem.'] },
    good: { who: LOVE, events: ['I have a date tonight with someone really special.', '{Who} surprised me with flowers today.', 'We are moving in together next month!', '{Who} said "I love you" for the first time.'],
      reasons: ['We have been together for two years, and it is getting serious.', 'We met at a friend’s party, and it was easy from the first minute.', 'We both said we are ready, finally.'],
      details: ['I even bought a new shirt. I never buy shirts!', 'I could not sleep last night, I was so excited.', 'I told my mother, and she cried a little.'],
      outcomes: ['Nervous and happy at the same time.', 'Over the moon. I keep smiling at my phone.', 'Calm, actually. It feels right.'] }
  },
  money: {
    bad: { whoAnswer: ['Nobody, really. It is just bad luck.', 'No one to blame. That is the worst part.'], events: ['My car broke down, and the repair costs a fortune.', 'The rent went up again, and I do not know how I will pay.', 'I lost my wallet on the bus. Everything was in it.', 'I got a big bill today, and I was not ready for it.'],
      reasons: ['I had no savings, so it hurts twice as much.', 'It always happens when I have no money, like a bad joke.', 'I should have checked it earlier, I know.'],
      details: ['Now I must count every coin until next month.', 'I called my mother, but I was too proud to ask for help.', 'I sat in the car for ten minutes and just looked at the wheel.'],
      outcomes: ['Stressed. But I will manage. I always do.', 'I will cook at home for a month. It is not the end of the world.', 'Tired of it. But tonight I am not thinking about money. Cheers!'] },
    good: { whoAnswer: ['Nobody helped me. It was all me, ha! I am proud.', 'My mother lent me some money once, but I paid her back.'], events: ['I finally paid off my loan today!', 'I found some money in an old coat. A small miracle!', 'I got a bonus this month.', 'I sold my old bike for a good price.'],
      reasons: ['I worked extra hours for months to get there.', 'I stopped buying coffee every day. It really adds up!', 'I did not expect it at all, to be honest.'],
      details: ['The first thing I did was buy my mother a gift.', 'I looked at my bank app five times to be sure.', 'I told my friends, and now they all want dinner.'],
      outcomes: ['Free. It is a nice feeling.', 'Relieved. I can sleep well now.', 'Rich! For about one evening. Cheers!'] }
  },
  family: {
    bad: { who: KIN, events: ['{Who} and I had a fight at dinner.', '{Who} is ill, and I am worried.', 'My family is visiting this week, and the house is chaos.', '{Who} did not call me on my birthday.'],
      reasons: ['Everyone has a different opinion and nobody listens.', 'We do not see each other often, so small things become big.', 'It is the same old problem, every year.'],
      details: ['It ended with {who} leaving the room.', 'The food got cold. Nobody ate anything.', 'My phone rang three times, and I did not answer.'],
      outcomes: ['Tired. But they are my family. I will call tomorrow.', 'I will wait a day, and then I will say sorry first.', 'Sad. But it will pass, it always does.'] },
    good: { who: KIN, events: ['{Who} is having a baby!', 'My whole family came together for dinner. It was lovely.', '{Who} just turned ninety!', '{Who} called me today after a long silence.'],
      reasons: ['We have not all been together for years.', 'Everyone was busy, but this time they all came.', 'It is a big moment for our family.'],
      details: ['My grandmother cooked for two days!', 'We looked at old photos and laughed until midnight.', 'My little cousin fell asleep under the table.'],
      outcomes: ['Warm. Full. Happy.', 'I feel lucky to have them.', 'I am already planning the next dinner.'] }
  },
  sports: {
    bad: { whoAnswer: ['The referee, mostly. Do not get me started.', 'Our goalkeeper, but I still love him.'], events: ['My team lost again. Third time this month!', 'I hurt my knee at the gym, and I cannot run for weeks.', 'The referee was terrible tonight. We should have won.', 'We lost in the last minute, after a silly mistake.'],
      reasons: ['We were winning until the last five minutes.', 'Our best player was ill, and it showed.', 'We played well, but luck was not with us.'],
      details: ['Then the referee gave them a very strange penalty.', 'I watched with my friends, and nobody spoke for ten minutes.', 'I even threw my hat on the floor. My neighbour heard everything.'],
      outcomes: ['Furious. But I will watch the next one, of course.', 'Sad, but next week is a new week.', 'I need a drink and a new team. Ha!'] },
    good: { whoAnswer: ['My brother. He will never forget it.', 'Our captain. He is a hero tonight.'], events: ['My team won tonight!', 'I ran my first ten kilometres today!', 'We got tickets for the final!', 'I finally beat my brother at tennis.'],
      reasons: ['We have not beaten them for ten years.', 'I trained every morning for three months.', 'I did not think we had a chance.'],
      details: ['In the last minute! I screamed so loud that my neighbour knocked on the wall.', 'I called my father right after, and he screamed too.', 'My legs hurt, but I could not stop smiling.'],
      outcomes: ['Still shaking. What a night!', 'Proud. And hungry.', 'Happy! I could do it again tomorrow.'] }
  },
  celebration: {
    bad: { whoAnswer: ['Nobody in particular. People are just busy.', 'My friends, but I do not blame them.'], events: ['It is my birthday, and nobody remembered.', 'My friends cancelled my party at the last minute.', 'It is our anniversary, but my partner is working late.', 'I planned a surprise for a friend, and it went wrong.'],
      reasons: ['I told everyone last week, but people forget.', 'Everybody is busy these days, I know.', 'I think I expected too much, maybe.'],
      details: ['So I came here. At least the bartender is nice.', 'I got one message, from my dentist. Really!', 'I bought a small cake for myself. It is in my bag.'],
      outcomes: ['A bit sad, but this drink helps.', 'I will be fine. Next year I will plan something different.', 'Alone, but not lonely. Does that make sense?'] },
    good: { whoAnswer: ['My friends. They planned everything.', 'My family. They are always the best at this.'], events: ['It is my birthday today!', 'We are celebrating our anniversary tonight.', 'My friends are coming soon for a surprise party. Shh!', 'My friend just got engaged, and we are celebrating.'],
      reasons: ['It is a round number, so my friends are making a fuss.', 'We have been together for ten years today.', 'Everybody has been planning it for weeks.'],
      details: ['They hid a cake in my kitchen. I found it by accident.', 'I got twenty messages before breakfast.', 'My mother sang to me on the phone, very badly.'],
      outcomes: ['Loved. Really loved.', 'Happy. A little dizzy from all the attention.', 'I want tonight to last forever.'] }
  },
  travel: {
    bad: { whoAnswer: ['The airline, mostly. Nobody told us anything.', 'Nobody. It was a strike, I think.'], events: ['My flight was cancelled, and I lost a whole day.', 'The airline lost my suitcase.', 'I missed my train, and the next one is tomorrow.', 'My hotel booking disappeared, and I have nowhere to sleep.'],
      reasons: ['The airline said there was a technical problem.', 'There was a strike, and nobody told us.', 'I arrived five minutes late. Five minutes!'],
      details: ['I waited six hours at the airport and ate a very sad sandwich.', 'I called the company four times, and nobody answered.', 'A kind stranger shared her charger with me.'],
      outcomes: ['Tired. But I will try again tomorrow.', 'I will fix it in the morning. Tonight, I need a drink.', 'Never again! Until the next holiday, probably.'] },
    good: { whoAnswer: ['My friend. She invited me, and I said yes.', 'Nobody, I went alone. It was wonderful.'], events: ['I am flying to Lisbon tomorrow!', 'I just came back from the mountains. It was beautiful.', 'We booked our summer holiday today!', 'I saw the sea for the first time today.'],
      reasons: ['I have wanted to go there since I was a child.', 'I saved money for two years for this.', 'My friend invited me, and I said yes without thinking.'],
      details: ['I already packed. Twice.', 'I took four hundred photos. My phone is full.', 'I met a lovely old couple on the train.'],
      outcomes: ['Excited! I cannot sit still.', 'Rested and happy. I wish I could go back.', 'Dreaming about the next trip already.'] }
  },
  health: {
    bad: { whoAnswer: ['The doctor, but only to be safe.', 'Nobody. It is just my body being difficult.'], events: ['I have a doctor appointment tomorrow, and I hate hospitals.', 'I have had a terrible headache all week.', 'I have not slept properly for days.', 'My back hurts so much that I can hardly sit.'],
      reasons: ['The doctor wants to do some tests, just to be sure.', 'I think it is stress. Work is heavy.', 'I sit too much, I know. I never walk.'],
      details: ['I keep thinking about the worst, which is silly.', 'I tried tea, pills, and even a long bath. Nothing helped.', 'My mother keeps calling to ask how I am.'],
      outcomes: ['Worried, if I am honest. Talking helps.', 'I will see the doctor and stop being afraid.', 'Tired. But a quiet drink is good medicine, no?'] },
    good: { whoAnswer: ['My doctor, mostly. And a good friend who pushed me.', 'Nobody. I did it myself, slowly.'], events: ['My doctor said I am completely healthy!', 'I stopped smoking two weeks ago, and I feel great.', 'I finally started going to the gym.', 'I slept eight hours last night for the first time in months.'],
      reasons: ['I changed my habits, and it really worked.', 'My friend pushed me to start, and I am glad.', 'I was scared of the tests, so this is a big relief.'],
      details: ['I walk to work now, and I sleep like a baby.', 'I can climb the stairs without stopping. Amazing!', 'I even drink water now. Water!'],
      outcomes: ['Great! I feel ten years younger.', 'Proud of myself, honestly.', 'Light. Like a new person.'] }
  },
  weather: {
    bad: { whoAnswer: ['Nobody. The sky is to blame.', 'The forecast. It lied to me.'], events: ['This rain is terrible. I got completely wet.', 'It is so cold outside! My hands are frozen.', 'The wind broke my umbrella.', 'The heat today was impossible. I could not think.'],
      reasons: ['I forgot my umbrella, as always.', 'The forecast said sunny. They are always wrong!', 'I walked, because the bus never came.'],
      details: ['A car splashed me from head to toe.', 'My shoes made a funny noise all the way here.', 'I stood under a tree for twenty minutes, and it did not help.'],
      outcomes: ['Wet, but warm now. Thank you.', 'Better already. A drink and a dry seat, that is all I need.', 'I will buy a new umbrella tomorrow. Maybe.'] },
    good: { whoAnswer: ['Nobody. It was just a lovely day.', 'The sun, I think. Thank you, sun!'], events: ['What a beautiful warm evening!', 'It is the first sunny day in weeks.', 'I love this weather. It is perfect for a walk.', 'The snow today was so pretty.'],
      reasons: ['We had so many grey days.', 'I was inside all week, so I needed this.', 'It reminds me of summer when I was a child.'],
      details: ['I walked home the long way, just to enjoy it.', 'I sat in the park and did nothing for an hour.', 'Everybody in the street was smiling.'],
      outcomes: ['Light. Like summer.', 'Happy. Good weather changes everything.', 'I could walk all night.'] }
  }
};

const PRONOUNS = { m: { he: 'he', him: 'him', his: 'his' }, f: { he: 'she', him: 'her', his: 'her' } } as const;
// How a person starts telling it. Some say it straight, some warm up first.
const LEADS = ['', '', 'So, ', 'Well, ', 'You know, ', 'Honestly, '];
const lowerFirst = (text: string) => (/^(I |I’|I')/.test(text) ? text : text.charAt(0).toLowerCase() + text.slice(1));
const WHO_TAIL = ['You know how it is.', 'I do not want to speak badly about {him}, but it hurt.', 'I will tell {him} what I think. One day.', ''];
const WHO_TAIL_GOOD = ['{He} is a good person.', 'I am lucky to know {him}.', ''];

export function makeStory(seed: string, topic: TalkTopic, kind: 'good' | 'bad'): StoryFrame {
  const random = rngOf(`${seed}:${topic}:${kind}`);
  const parts = STORY_PARTS[topic][kind];
  const person = parts.who ? pickFrom(parts.who, random) : undefined;
  const gender = person ? (person.g === 'x' ? (random() < .5 ? 'm' : 'f') : person.g) : 'f';
  const slots = { who: person?.t, Who: person?.t, he: PRONOUNS[gender === 'm' ? 'm' : 'f'].he, He: PRONOUNS[gender === 'm' ? 'm' : 'f'].he, him: PRONOUNS[gender === 'm' ? 'm' : 'f'].him, his: PRONOUNS[gender === 'm' ? 'm' : 'f'].his };
  const say = (list: string[]) => expand(pickFrom(list, random), slots, random);
  const who = person
    ? expand(`It was ${person.t}. ${pickFrom(kind === 'bad' ? WHO_TAIL : WHO_TAIL_GOOD, random)}`, slots, random)
    : pickFrom(parts.whoAnswer ?? ['Nobody, really.'], random);
  const lead = pickFrom(LEADS, random);
  const event = say(parts.events);
  return { topic, kind, tell: lead ? `${lead}${lowerFirst(event)}` : event, why: say(parts.reasons), more: say(parts.details), how: say(parts.outcomes), who };
}

/** Every sentence the generator can say: the word-list check and the tests use it. */
export function allStoryTexts(): string[] {
  const out: string[] = [];
  for (const group of Object.values(STORY_PARTS)) for (const parts of [group.bad, group.good]) {
    out.push(...parts.events, ...parts.reasons, ...parts.details, ...parts.outcomes, ...(parts.whoAnswer ?? []), ...(parts.who?.map((person) => person.t) ?? []));
  }
  out.push(...WHO_TAIL, ...WHO_TAIL_GOOD);
  return out;
}
