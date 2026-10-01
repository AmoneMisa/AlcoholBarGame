import { CHARACTER_ART } from '../data/cosmetics/artCatalog';

// The Circle: fifteen people with a story who can become part of the bar. Each has their own bonus and a biography
// that opens chapter by chapter as the bond grows. They are met as guests (serve them well and they leave shards),
// or join at once when the player reaches a certain achievement. Keepsakes make the bond stronger.

export const BOND_NAMES = ['Stranger', 'Known person', 'Friends', 'Good friends', 'Close friends', 'Best friends', 'Forever friends'] as const;
export const MAX_BOND = 6;
/** Bond points needed for bond level 1 (a known person) … 6 (forever friends). */
export const BOND_STEPS = [0, 40, 120, 280, 560, 1000] as const;
export const bondLevel = (points: number) => BOND_STEPS.filter((step) => points >= step).length;
export const nextBondStep = (points: number) => BOND_STEPS.find((step) => points < step);

export type BonusId = 'xp' | 'delivery' | 'patience' | 'supply' | 'staff' | 'tips' | 'restock' | 'pay' | 'saved' | 'arrival' | 'crystals' | 'parts' | 'upgrade' | 'bottles' | 'fame';
export interface BonusDef { id: BonusId; label: string; /** Added per bond level. */ per: number; unit: 'percent' | 'flat' }
export const BONUSES: BonusDef[] = [
  { id: 'xp', label: 'More XP from service', per: .03, unit: 'percent' },
  { id: 'delivery', label: 'Faster deliveries', per: .03, unit: 'percent' },
  { id: 'patience', label: 'Guests wait longer', per: .03, unit: 'percent' },
  { id: 'supply', label: 'Cheaper supplier orders', per: .015, unit: 'percent' },
  { id: 'staff', label: 'Servers earn more while you are away', per: .04, unit: 'percent' },
  { id: 'tips', label: 'Guests tip more often', per: .025, unit: 'percent' },
  { id: 'restock', label: 'Cheaper bottle restock (crystals)', per: .03, unit: 'percent' },
  { id: 'pay', label: 'Guests pay more', per: .015, unit: 'percent' },
  { id: 'saved', label: 'Less liquid used per drink', per: .015, unit: 'percent' },
  { id: 'arrival', label: 'Guests arrive sooner', per: .02, unit: 'percent' },
  { id: 'crystals', label: 'More crystals from quests and achievements', per: .05, unit: 'percent' },
  { id: 'parts', label: 'Extra parts for the first serve of a recipe', per: 1, unit: 'flat' },
  { id: 'upgrade', label: 'Cheaper equipment upgrades (parts)', per: .04, unit: 'percent' },
  { id: 'bottles', label: 'Bottle sales pay more', per: .03, unit: 'percent' },
  { id: 'fame', label: 'Your signature cocktail grows famous faster', per: .05, unit: 'percent' }
];
export const bonusDef = (id: BonusId) => BONUSES.find((item) => item.id === id)!;
// Each person also has a level. Everyone starts at level 10; a bond grade lets the level climb to 19, 29, 39 … 69, and
// the next grade has to be earned before it can go further. The bonus follows the level (level 10 is one step of the
// bonus, level 69 is 6.9 steps).
export const COMPANION_START_LEVEL = 10;
export const levelCapForGrade = (grade: number) => Math.max(1, Math.min(MAX_BOND, grade)) * 10 + 9;
export const MAX_COMPANION_LEVEL = levelCapForGrade(MAX_BOND);
export const levelPower = (level: number) => level / 10;
/** Every grade above the first adds two steps of bonus on top of the level, so a better bond is stronger at once. */
export const gradePower = (grade: number) => Math.max(0, grade - 1) * .2;
export const companionPower = (level: number, grade: number) => levelPower(level) + gradePower(grade);

// Friends who know each other. When both of a pair work in the same bar, both of their bonuses grow by a tenth for every
// grade of the one who knows the other less (the lesser grade of the two).
export interface CompanionLink { a: string; b: string; text: string }
export const COMPANION_LINKS: CompanionLink[] = [
  { a: 'mirelle', b: 'aveline', text: 'Two people who write about places for a living. They swap notes and never agree on a restaurant.' },
  { a: 'kellan', b: 'gideon', text: 'Kellan ships the crates, Gideon builds them. Each says the other is the reason nothing breaks.' },
  { a: 'solen', b: 'paloma', text: 'Solen writes it, Petra reads it on air at midnight. Neither will say who is the better half.' },
  { a: 'nadia', b: 'cassian', text: 'Cassian never kept receipts until Nadia found a drawer full of them. They have been arguing happily since.' },
  { a: 'bram', b: 'soren', text: 'Soren stitched Bram’s eyebrow once, in a corridor. They have shared a table every Sunday since.' },
  { a: 'yara', b: 'celeste', text: 'Celeste dresses the stage, Ingrid fills it. Between them, an evening looks planned even when it is not.' },
  { a: 'tobin', b: 'lumi', text: 'Wine for her cakes, cakes for his tastings. They call it research, and it is.' },
  { a: 'neri', b: 'tobin', text: 'Neri asks Tobin about every bottle. Tobin pretends to be tired of it and writes the answers down.' }
];
export const linkStrength = (lesserGrade: number) => .1 * Math.max(0, Math.min(MAX_BOND, lesserGrade));
export const linksOf = (id: string) => COMPANION_LINKS.filter((link) => link.a === id || link.b === id).map((link) => ({ ...link, partner: link.a === id ? link.b : link.a }));
/** Coins and workshop parts to go from `level` to the next. */
export const companionLevelCost = (level: number) => ({ coins: Math.round(25 * Math.pow(level, 1.5)), parts: 1 + Math.ceil(level / 4) });

/** `power` is the level divided by ten (a bond grade of 3 and a level of 30 are the same strength). */
export const bonusAmount = (id: BonusId, power: number) => bonusDef(id).per * Math.max(0, Math.min(MAX_BOND + 1, power));
export const describeBonus = (id: BonusId, bond: number) => {
  const def = bonusDef(id);
  const amount = bonusAmount(id, bond);
  return def.unit === 'flat' ? `+${amount} ${def.label.toLowerCase()}` : `+${Math.round(amount * 1000) / 10}% ${def.label.toLowerCase()}`;
};

// ---- Keepsakes: the items that deepen a bond ----
export const KEEPSAKES = [
  { id: 'book', name: 'Old book', icon: '📖' },
  { id: 'flowers', name: 'Fresh flowers', icon: '💐' },
  { id: 'vinyl', name: 'Vinyl record', icon: '💿' },
  { id: 'sweets', name: 'Box of sweets', icon: '🍬' },
  { id: 'watch', name: 'Pocket watch', icon: '⌚' }
] as const;
export type KeepsakeId = typeof KEEPSAKES[number]['id'];
export const KEEPSAKE_IDS = KEEPSAKES.map((item) => item.id) as KeepsakeId[];
export const keepsakeDef = (id: string) => KEEPSAKES.find((item) => item.id === id);
export const KEEPSAKE_CRYSTAL_PRICE = 25;
export const KEEPSAKE_POINTS = 15;
export const KEEPSAKE_LIKED_POINTS = 40;
/** Serving a companion as a guest: bond points (once they have joined) and the daily limit per companion. */
export const VISIT_POINTS = 3;
export const VISITS_PER_DAY = 3;
export const KEEPSAKE_VISIT_CHANCE = .2;
// Spotlight: ask someone who works in the bar to give their all. Their bonus counts double for a while, then they rest.
export const SPOTLIGHT_MIN_BOND = 2;
export const SPOTLIGHT_MS = 30 * 60_000;
export const SPOTLIGHT_COOLDOWN_MS = 6 * 60 * 60_000;
export const COMPANION_SLOTS_BASE = 2;
export const COMPANION_SLOTS_EXTRA_LEVEL = 25;
export const companionSlots = (playerLevel: number) => COMPANION_SLOTS_BASE + (playerLevel >= COMPANION_SLOTS_EXTRA_LEVEL ? 1 : 0);

export type Meeting = { kind: 'achievement'; id: string } | { kind: 'event'; eventId: string };
export interface Companion {
  /** Same as the guest portrait, so the person looks and is named the same everywhere. */
  id: string;
  title: string;
  from: string;
  role: 'critic' | 'friend' | 'special guest';
  bonus: BonusId;
  likes: KeepsakeId;
  /** Joins at once when this achievement is claimed; everyone can also be recruited with shards. */
  joinsWith?: string;
  /** A bar night that brings this person: serving them then leaves twice the shards. */
  eventId?: string;
  /** Shards to recruit. */
  shards: number;
  quote: string;
  /** What is known before they join, then one chapter for each bond level. */
  intro: string;
  chapters: [string, string, string, string, string, string];
}

// Preserve Circle progress from saves made when companions shared IDs with ordinary guests.
export const LEGACY_COMPANION_IDS: Record<string, string> = {
  marin: 'mirelle', kai: 'kellan', remy: 'solen', ana: 'nadia', theo: 'bram', imani: 'yara', owen: 'tobin', vera: 'celeste', eli: 'neri', leila: 'aveline', felix: 'soren', hana: 'lumi', andre: 'gideon', rosa: 'paloma', marco: 'cassian'
};

export const COMPANIONS: Companion[] = [
  {
    id: 'mirelle', title: 'Food critic', from: 'The Evening Courier', role: 'critic', bonus: 'xp', likes: 'book', joinsWith: 'a-serve-500', shards: 40,
    quote: 'A drink should tell you where it has been.',
    intro: 'Mirelle writes the Thursday column that decides which bars are worth the trip. Nobody has seen her smile at a menu.',
    chapters: [
      'Mirelle grew up above her parents’ bakery and learned to taste before she could read. She still describes everything in smells.',
      'Her first review was a tiny pamphlet she left in cafés. Two owners wrote back angry letters, and she pinned both to her wall.',
      'She once gave a famous bar one star and was banned for a year. When it reopened she came back, ordered water, and wrote a kind page.',
      'Mirelle keeps a notebook of drinks that surprised her. Yours is on page nine, and she says it is the first page with a drawing.',
      'She will mention your bar in her end-of-year list, with no discount asked and none given. “Because it is true,” she says.',
      'Mirelle takes the stars away for one bar only: yours has no rating, just a line, “Come as you are.” She still arrives on Thursdays, and she still orders water first.'
    ]
  },
  {
    id: 'kellan', title: 'Dock logistics worker', from: 'Pier 9', role: 'friend', bonus: 'delivery', likes: 'sweets', eventId: 'tourist-night', shards: 20,
    quote: 'Every crate has a clock inside it.',
    intro: 'Kellan knows which truck is late before the driver does. He drinks slowly and watches the door.',
    chapters: [
      'Kellan spent six years on cargo ships before his knees said enough. He still wakes at four to check the weather.',
      'He can read a shipping label like a menu. He once saved a bar from a missing order by finding the crate in the wrong port.',
      'He sends his mother half of every pay and a postcard from every city. She keeps them in a biscuit tin.',
      'Kellan’s dream is a small boat that carries only coffee beans. He has drawn it nine times and never shown anyone.',
      'He now calls the harbour office for you when a delivery slips. “They owe me three favours,” he says, “and I only need one.”',
      'Kellan names his coffee boat after your bar and finally shows you the drawing. He says its first crate will be yours, and he has already chosen the date.'
    ]
  },
  {
    id: 'solen', title: 'Street poet', from: 'The old market', role: 'friend', bonus: 'patience', likes: 'book', eventId: 'quiet-night', shards: 20,
    quote: 'Silence is just a sentence that has not decided yet.',
    intro: 'Solen writes poems on receipts and leaves them under glasses. Some are very good. Some are about you.',
    chapters: [
      'Solen has no fixed address and no hurry. They trade poems for coffee and have never been refused twice.',
      'Their first poem was written on a bus ticket for a stranger who was crying. The stranger kept it for ten years.',
      'Solen believes a waiting guest is a guest who is about to say something true. They teach you to wait a little longer.',
      'There is a notebook with your bar in it, written in the third person. You are described as “the one who listens.”',
      'Solen’s first printed book has one poem for each bar they love. Yours is the last, and the longest.',
      'Solen stops leaving poems under glasses and writes one small one on your wall, near the till. “Forever is just a long evening,” it says.'
    ]
  },
  {
    id: 'nadia', title: 'Accountant', from: 'Greene & Sons', role: 'friend', bonus: 'supply', likes: 'flowers', joinsWith: 'a-coins-25k', shards: 30,
    quote: 'Every number is somebody’s afternoon.',
    intro: 'Nadia arrives with a calculator and leaves with a story. She says the calculator is only for show.',
    chapters: [
      'Nadia started in the mailroom and now signs off the budgets of three firms. She keeps her first stapler on her desk.',
      'She can spot a supplier who rounds in their own favour from across the room. She does it politely, which is worse.',
      'Her sister runs a flower shop with no books at all. Nadia fixes them every spring and is paid in tulips.',
      'She says you are the only owner who reads the invoice before arguing with it.',
      'Nadia now reviews your supplier terms for free once a year. “Think of it as a very dull gift,” she says, and her eyes smile.',
      'Nadia adds your bar to the very short list of accounts she keeps for pleasure. She never sends a bill, only a card each year that says “Balanced.”'
    ]
  },
  {
    id: 'bram', title: 'Retired boxer', from: 'The Iron Gym', role: 'special guest', bonus: 'staff', likes: 'watch', joinsWith: 'a-staff-4', shards: 30,
    quote: 'Nobody is rude to a tired person who has been fed.',
    intro: 'Bram is the biggest person in any room and the quietest. He stands by the door and nobody ever tests him.',
    chapters: [
      'Bram fought twenty-three bouts and remembers each one by the weather. He retired the day he saw his own tired face in a window.',
      'He now trains teenagers for free. Their rule: no hitting until you can lose a game of cards politely.',
      'Bram found that a calm voice stops more fights than fists ever did. He gives your servers a short lesson on it.',
      'His old gloves hang above his bed. He lent them once, for a school play, and got them back signed by a dragon.',
      'He says your team “walks like a crew”. He now stops by on slow evenings, just to see them work.',
      'Bram hangs a pair of old gloves behind your bar. “For the nights nobody wins,” he says, “and everybody gets looked after anyway.”'
    ]
  },
  {
    id: 'yara', title: 'Jazz singer', from: 'The Blue Lantern', role: 'special guest', bonus: 'tips', likes: 'vinyl', eventId: 'jazz-night', shards: 25,
    quote: 'Tip the band, tip the bartender, tip the rain.',
    intro: 'Ingrid sings low and slow. When she walks in, conversations drop half a tone.',
    chapters: [
      'Ingrid’s first stage was a church basement with one lamp. She sang to a room of nine and still counts them as her best crowd.',
      'She toured for three years on a bus with a broken heater. She learned every song twice: once for the crowd, once for the driver.',
      'Her favourite record is a scratched copy she found in a bin. She plays it before every show for luck.',
      'She says the best nights are those when nobody asks for a song. They simply stay.',
      'Ingrid now sings one song a month at your bar, unannounced. The tip jar is always full by the second verse.',
      'Ingrid writes a song with your bar’s name in the chorus. She sings it once, on the last night of the year, and never again, so it stays yours.'
    ]
  },
  {
    id: 'tobin', title: 'Wine importer', from: 'Hale & Co. Imports', role: 'friend', bonus: 'restock', likes: 'watch', eventId: 'wine-cheese', shards: 25,
    quote: 'Patience is just an ingredient that costs nothing.',
    intro: 'Tobin holds a glass up to the light as if it owed him an explanation.',
    chapters: [
      'Tobin inherited his uncle’s cellar and a pile of debts. He sold the debts first and the wine never.',
      'He taught himself to taste by comparing three glasses a day for ten years. He insists the third glass is always honest.',
      'He is allergic to flattery and loves a good argument about oak.',
      'He once drove through the night to deliver a single case to a wedding. It was the right wine for the wrong bride, and they stayed friends.',
      'Tobin now sets aside a few bottles for you at cost. “A friend’s shelf should never be empty,” he says.',
      'Tobin keeps one bottle of every vintage he imports for you, unopened, for a day that matters. “Some wines are patient,” he says. “So am I.”'
    ]
  },
  {
    id: 'celeste', title: 'Fashion buyer', from: 'Maison Lorne', role: 'special guest', bonus: 'pay', likes: 'flowers', joinsWith: 'a-draws-30', shards: 30,
    quote: 'Elegance is knowing what to leave out.',
    intro: 'Celeste notices the stitching on your bartender’s apron before she notices the drink.',
    chapters: [
      'Celeste began as a seamstress’s assistant, threading needles in a window. She still carries a thimble in her pocket.',
      'She buys for four stores and says no to nine out of ten. The tenth sells out in a week.',
      'She once cancelled a whole season because the buttons felt wrong. She was right, and nobody has asked her to explain since.',
      'Her friends say she is cold. She reads poetry to her cat and cries at train station reunions.',
      'Celeste now mentions your bar to every client who visits town. Guests arrive dressed for it, and they pay as if they were.',
      'Celeste has your bar’s colours stitched inside the collar of her best coat. “The inside is what counts,” she says, and smiles at the label.'
    ]
  },
  {
    id: 'neri', title: 'Bartending student', from: 'Harbour College', role: 'friend', bonus: 'saved', likes: 'sweets', joinsWith: 'a-lessons-14', shards: 20,
    quote: 'Measure twice, pour once, apologise never.',
    intro: 'Neri carries a notebook full of ratios and a jigger they never put down.',
    chapters: [
      'Neri is the first in their family to go to college, and works nights to afford it. The notebook was a gift from a teacher.',
      'They have tested the same cocktail forty times to find where the sweetness tips over. They have a graph.',
      'Neri’s biggest fear is wasting a good ingredient. They once drank a failed cocktail on purpose, out of respect.',
      'They ask you questions you did not know you had the answers to, and write each one down.',
      'Neri will graduate with a thesis on waste in bars. Chapter four is about you, and the numbers are very flattering.',
      'Neri dedicates his thesis to you, and the first bar he ever runs prints a small line at the bottom of its menu: “Learned at a friend’s.”'
    ]
  },
  {
    id: 'aveline', title: 'Travel writer', from: 'Wayfarer Magazine', role: 'critic', bonus: 'arrival', likes: 'book', joinsWith: 'a-bars-3', shards: 35,
    quote: 'A good bar is a small country with a very short border.',
    intro: 'Aveline has a visa stamp for every kind of weather. She orders what the locals order.',
    chapters: [
      'Aveline left home at nineteen with one bag and a map she drew herself. It was wrong in four places and she kept it anyway.',
      'She writes the “last drink of the trip” column. Every bar in it is a place she would cross a desert to return to.',
      'She once waited three days for a ferry and wrote the best essay of her life. It was about a café and a very old dog.',
      'She says your bar has a rare quality: strangers talk to each other here. She wrote it in the margin.',
      'Your bar is now in her next guidebook, under “a good evening”. Readers arrive carrying a folded page.',
      'Aveline stops writing about your bar and starts writing from it. Her next book opens at your counter, and the first line is the one you always say.'
    ]
  },
  {
    id: 'soren', title: 'Night-shift doctor', from: 'St. Anne’s Hospital', role: 'special guest', bonus: 'crystals', likes: 'sweets', eventId: 'rainy-evening', shards: 25,
    quote: 'Everything looks better after a sandwich and a sit.',
    intro: 'Soren arrives at midnight in a coat that smells of antiseptic and rain. He orders something small.',
    chapters: [
      'Soren works thirty-hour shifts and sleeps in doorways of his own thoughts. He says you learn to nap anywhere.',
      'He once delivered a baby in a lift and still carries the first photo. He is quietly proud and very shy about it.',
      'He has a rule: never talk shop after midnight. The rule has been broken eleven times, all for friends.',
      'He says a bartender is the second most important listener in a city. He leaves it open who is first.',
      'Soren now sends colleagues your way after hard nights. They return as regulars, and sometimes as friends who bring a gift.',
      'Soren keeps your number on a card in his coat, between the emergency contacts and his mother. “Fourth line,” he says, “and the only one that makes me laugh.”'
    ]
  },
  {
    id: 'lumi', title: 'Pastry chef', from: 'Maison Sucre', role: 'friend', bonus: 'parts', likes: 'sweets', joinsWith: 'a-taste-20', shards: 25,
    quote: 'A recipe is a promise you can taste.',
    intro: 'Lumi arrives with flour on her sleeve and a box she will not let you see yet.',
    chapters: [
      'Lumi learned from her grandmother, who wrote recipes on the back of tax forms. She keeps the forms in a drawer.',
      'She believes every dessert has one loud note and two quiet ones. She tastes for the quiet ones first.',
      'Her bakery burned down once. The next morning she opened a stall with a single oven and a queue of neighbours.',
      'She has been experimenting with a cocktail-and-cake pairing. You were the first person she asked to taste it.',
      'Lumi now slips a spare part and a note into your delivery whenever you try something new. “Curiosity should be paid,” she says.',
      'Lumi bakes a small cake with your bar’s name on it every year and never lets you pay. “A recipe is a promise,” she says, “and I keep this one.”'
    ]
  },
  {
    id: 'gideon', title: 'Carpenter', from: 'Dubois Woodwork', role: 'friend', bonus: 'upgrade', likes: 'watch', joinsWith: 'a-upgrades-30', shards: 30,
    quote: 'Things last when somebody was kind to the wood.',
    intro: 'Gideon runs a thumb along the bar top and nods, as if the wood had said hello.',
    chapters: [
      'Gideon’s father built boats. Gideon builds what boats come back to: tables, doors, bars. He says it is the same craft.',
      'His workshop smells of cedar and coffee. A stray dog sleeps under the bench and has a name for every tool.',
      'He once rebuilt a bar from the wreck of a ship. People still sit at it and say they feel the sea.',
      'He tells you your equipment will last twice as long if you treat the corners well. He is right.',
      'Gideon now inspects your fittings on his rounds and brings spare parts. “Use them,” he says. “That is what they are for.”',
      'Gideon carves your name into the underside of the counter, where only the two of you know to look. “Good wood remembers,” he says.'
    ]
  },
  {
    id: 'paloma', title: 'Radio host', from: 'Radio Lantern, 91.4', role: 'critic', bonus: 'fame', likes: 'vinyl', joinsWith: 'a-sig-50', shards: 30,
    quote: 'A voice at night is a lamp for somebody.',
    intro: 'Petra talks to half the city every evening and listens to the other half at the bar.',
    chapters: [
      'Petra started as the girl who made the tea at the radio station. One night the host fell ill and she read the news in her kitchen voice.',
      'Her show has no guests, only calls. She says a stranger’s story is the best interview there is.',
      'She keeps a tape of every caller who thanked her. There are four hundred, and she listens when she is tired.',
      'She asked what drink you would invent for the whole city. You told her and she was quiet for a long time.',
      'Petra now mentions your signature cocktail on air once a month. The phone starts ringing before she finishes the sentence.',
      'Petra ends her programme every night with a line about “a lamp left on at a friend’s bar.” Strangers write in asking where it is.'
    ]
  },
  {
    id: 'cassian', title: 'Antique dealer', from: 'Cassian & Daughters', role: 'special guest', bonus: 'bottles', likes: 'watch', joinsWith: 'a-vip-10', shards: 30,
    quote: 'Everything old was once somebody’s favourite.',
    intro: 'Cassian picks up a bottle and reads it like a letter. He is rarely wrong about the year.',
    chapters: [
      'Cassian bought his first shop with a loan from his three daughters. Their names are on the sign, in the order they were born.',
      'He can date a bottle by the feel of its glass. He once identified a forgery by its weight and refused to be proud of it.',
      'He has a rule: sell only what you would keep. His shelves are mostly empty and very beautiful.',
      'He hates to see a good bottle wasted on a bad night. He says the same of good people.',
      'Cassian now brings buyers who pay a collector’s price for the bottles on your shelf. “Good things should find good homes,” he says.',
      'Cassian takes one bottle off his own shelf and leaves it on yours, with no price on it. “Some things are not for sale,” he says, “and some are for friends.”'
    ]
  }
];

export const companionById = (id: string) => COMPANIONS.find((item) => item.id === id);
export const companionName = (id: string) => CHARACTER_ART.find((art) => art.id === id)?.name ?? id;
/** The companion that joins with this achievement, if any. */
export const companionJoiningWith = (achievementId: string) => COMPANIONS.find((item) => item.joinsWith === achievementId);
/** One keepsake for a given achievement or quest, the same for every player. */
export function keepsakeFor(seed: string): KeepsakeId {
  let hash = 0;
  for (const char of seed) hash = (hash * 31 + char.charCodeAt(0)) >>> 0;
  return KEEPSAKE_IDS[hash % KEEPSAKE_IDS.length]!;
}
