// What the bartender is doing with a sentence. The player types or builds English; this finds the "dialogue act"
// (small talk, empathy, an offer, a refusal, asking someone to leave…) so the guest can react like a person
// instead of only matching words about taste.

export type Act =
  | 'greet' | 'howAreYou' | 'askProblem' | 'empathy' | 'compliment' | 'askWork' | 'weather' | 'sports' | 'music' | 'travel' | 'askName'
  | 'offerWater' | 'offerFood' | 'offerAnother' | 'offerTaxi' | 'offerAshtray'
  | 'refuse' | 'leaveGentle' | 'leaveFirm' | 'leaveRude' | 'rude'
  | 'apology' | 'thanks' | 'goodbye' | 'checkIn';

const normalize = (text: string) => text.toLowerCase().replace(/’/g, "'");

// Ordered by priority: the first act is the main one. Rude and leaving acts come first, because a sentence that
// says “Get out, you drunk idiot” must never be read as small talk.
const RULES: [Act, RegExp][] = [
  ['leaveRude', /\b(get out|go away|out of my bar|leave now|shut up|nobody wants you|you (are|'re) (a )?(drunk|disgusting|pathetic)|drunk (idiot|fool)|go home, you)\b/],
  ['rude', /\b(idiot|stupid|ugly|boring|who cares|i don't care|not my problem|screw you|moron)\b/],
  ['leaveFirm', /\b(you (must|have to|need to) leave|i (must|have to|need to) ask you to leave|i am asking you to leave|i'm asking you to leave|please leave|leave (the bar|please)|last warning|or i (will|'ll) call (security|the police))\b/],
  ['refuse', /\b((have|you've|you have) had enough|no more (alcohol|drinks?)|(can't|cannot|won't) (serve|give) you (any )?more|i (can't|cannot|won't) serve you|stop (drinking|serving)|not (serving|going to serve) you)\b/],
  ['leaveGentle', /\b((it is|it's) (time|late)|(time|better|should|maybe) (to |you )?(go|leave)( home)?|go home|closing (time|soon)|we('re| are) closing|would you (like|mind) (to )?(leav|go)|get some (rest|sleep)|home (safe|safely)|walk you (out|home)|call it a night)\b/],
  ['offerTaxi', /\b(taxi|cab|uber|get you home|get home (safe|safely))\b/],
  ['askProblem', /\b(what('s| is) (wrong|the matter)|what happened|(are you|you) (ok|okay|alright)\b|you (look|seem) (sad|upset|tired|angry|worried|nervous|down|stressed)|want to talk|tell me (about it|more)|bad day)\b/],
  ['empathy', /\b(sorry to hear|that sounds (hard|bad|terrible|difficult|awful|tough|stressful|great|wonderful|amazing|lovely)|i understand|cheer up|it will be (ok|okay|fine|better)|congratulations|well done|happy for you|i'm here for you|i am here (for you|to listen)|poor you|hang in there|take your time)\b/],
  ['compliment', /\b((nice|lovely|beautiful|great|cool) (smile|dress|jacket|shirt|hair|style|voice|name|watch|shoes|bag|coat)|you look (great|nice|beautiful|handsome|lovely|good)|i (love|like) your)\b/],
  ['howAreYou', /\b(how are you|how('s| is) your (day|evening|night|week)|how was your (day|evening|week|night)|how('s| is) it going|how do you feel)\b/],
  ['checkIn', /(everything (is )?(ok|okay|alright|fine|good)|is it (ok|okay|good|fine)|how is your drink|are you enjoying|enjoying (your|the) drink)/],
  ['askWork', /\b(what do you do|where do you work|what('s| is) your job|what is your job)\b/],
  ['askName', /\b(what('s| is) your name|nice to meet you)\b/],
  ['offerAshtray', /\b(ashtray|cigarette|lighter|smoking)\b/],
  ['offerWater', /\b(would you like|can i get you|shall i (get|bring)|do you want|how about|here is|here's|i'll bring you)\b.*\bwater\b/],
  ['offerFood', /\b(hungry|snack|snacks|something to eat|food|eat|plate|fries|chips|cheese|meat|garlic|nuts|olives|bread|sausage)\b/],
  ['offerAnother', /\b(another|one more|same again|refill|top up|more (drink|round|cocktail))\b/],
  ['weather', /\b(weather|raining|rain|sunny|snow|windy|cold today|hot today)\b/],
  ['sports', /\b(football|soccer|basketball|match|team|baseball|tennis|score|game last night)\b/],
  ['music', /\b(music|song|band|concert|singer|playlist|dance)\b/],
  ['travel', /\b(travel|trip|holiday|vacation|flight|flying|abroad|journey)\b/],
  ['apology', /\b(sorry|apologi[sz]e|my mistake|my apologies)\b/],
  ['thanks', /\b(thank you|thanks)\b/],
  ['goodbye', /\b(goodbye|bye|see you|good night|have a (nice|good|safe) (night|evening|day)|take care|come back soon)\b/],
  ['greet', /\b(hello|hi|hey|good (evening|morning|afternoon)|welcome)\b/]
];

export function actsIn(text: string): Act[] {
  const said = normalize(text);
  const found: Act[] = [];
  for (const [act, pattern] of RULES) if (pattern.test(said) && !found.includes(act)) found.push(act);
  // “I am sorry to hear that” is empathy, not an apology.
  if (found.includes('empathy') && found.includes('apology')) found.splice(found.indexOf('apology'), 1);
  // A firm or rude “leave” is not a gentle one.
  if (found.includes('leaveRude') || found.includes('leaveFirm')) return found.filter((act) => act !== 'leaveGentle');
  return found;
}

export const isLeaveAct = (act: Act) => act === 'leaveGentle' || act === 'leaveFirm' || act === 'leaveRude';
