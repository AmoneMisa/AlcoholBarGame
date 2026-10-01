import type { Customer, Recipe } from '../types';
import { withArticle } from '../english/articles';
import { askLine, clueLine, helloBack, openingFor } from '../social/talk';
export { withArticle } from '../english/articles';

// Turns a customer's hidden order into a taste profile they can talk about,
// and answers the bartender's questions in simple, correct English.

export type Topic =
  | 'sweet' | 'sour' | 'bitter' | 'fruity' | 'fresh' | 'creamy' | 'dry' | 'spicy' | 'sparkling' | 'coffee' | 'strong' | 'light'
  | 'rum' | 'gin' | 'vodka' | 'tequila' | 'whiskey' | 'wine'
  | 'lime' | 'lemon' | 'pineapple' | 'cranberry' | 'orange' | 'grapefruit' | 'coconut' | 'mint' | 'ginger';

export interface DrinkProfile {
  recipeId: string;
  recipeName: string;
  traits: Set<Topic>;
  strength: 'light' | 'medium' | 'strong';
  clue: Topic;
  feeling: string;
}

export interface Fact { topic: Topic; likes: boolean; }
export interface CustomerReply {
  text: string;
  expression: 'smile' | 'happy' | 'very-happy' | 'thinking' | 'confused' | 'disappointed' | 'neutral';
  facts: Fact[];
  confirmed?: boolean;
  wrongGuess?: boolean;
}

const INGREDIENT_TRAITS: Record<string, Topic[]> = {
  'white-rum': ['rum'], 'dark-rum': ['rum'], gin: ['gin'], vodka: ['vodka'], tequila: ['tequila'], whiskey: ['whiskey'],
  'orange-liqueur': ['orange', 'sweet'], vermouth: ['dry'], 'bitter-aperitif': ['bitter'], 'sparkling-wine': ['wine', 'sparkling'],
  'coffee-liqueur': ['coffee', 'sweet'], 'lime-juice': ['lime', 'sour'], 'lemon-juice': ['lemon', 'sour'], 'pineapple-juice': ['pineapple', 'fruity', 'sweet'],
  'cranberry-juice': ['cranberry', 'fruity'], 'sugar-syrup': ['sweet'], 'coconut-cream': ['coconut', 'creamy', 'sweet'], tonic: ['bitter', 'sparkling'],
  soda: ['sparkling', 'fresh'], cola: ['sparkling', 'sweet'], 'ginger-beer': ['ginger', 'spicy', 'sparkling'], 'grapefruit-soda': ['grapefruit', 'sparkling', 'fruity'],
  mint: ['mint', 'fresh'], 'lime-wedge': ['lime'], orange: ['orange'], 'pineapple-wedge': ['pineapple']
};
const NOTE_TRAITS: Record<string, Topic[]> = {
  fresh: ['fresh'], refreshing: ['fresh'], crisp: ['fresh'], zesty: ['fresh', 'sour'], tart: ['sour'], sharp: ['sour'], tropical: ['fruity', 'sweet'],
  berry: ['fruity'], sweet: ['sweet'], strong: ['strong'], 'spirit-forward': ['strong'], warming: ['strong'], creamy: ['creamy'], dry: ['dry'], bitter: ['bitter'], coffee: ['coffee'], energizing: ['coffee'], gingery: ['spicy'], citrusy: ['fresh']
};
const SPIRITS: Topic[] = ['rum', 'gin', 'vodka', 'tequila', 'whiskey', 'wine'];
const FRUITS: Topic[] = ['lime', 'lemon', 'pineapple', 'cranberry', 'orange', 'grapefruit', 'coconut', 'mint', 'ginger'];
const SPIRIT_IDS = ['white-rum', 'dark-rum', 'gin', 'vodka', 'tequila', 'whiskey', 'orange-liqueur', 'vermouth', 'bitter-aperitif', 'sparkling-wine', 'coffee-liqueur'];

const KEYWORDS: Record<Topic, string[]> = {
  sweet: ['sweet', 'sweeter', 'sugar', 'sugary'], sour: ['sour', 'tart', 'sharp', 'sourer'], bitter: ['bitter'], fruity: ['fruity', 'fruit', 'fruits', 'tropical', 'juicy'],
  fresh: ['fresh', 'refreshing', 'cool', 'crisp', 'zesty'], creamy: ['creamy', 'cream', 'milky', 'smooth'], dry: ['dry'], spicy: ['spicy', 'hot'],
  sparkling: ['sparkling', 'bubbles', 'bubbly', 'fizzy', 'soda', 'bubble'], coffee: ['coffee', 'espresso'], strong: ['strong', 'stronger', 'alcoholic', 'heavy'],
  light: ['light', 'lighter', 'weak', 'mild', 'easy'], rum: ['rum'], gin: ['gin'], vodka: ['vodka'], tequila: ['tequila'], whiskey: ['whiskey', 'whisky', 'bourbon'],
  wine: ['wine', 'champagne', 'prosecco'], lime: ['lime', 'limes'], lemon: ['lemon', 'lemons'], pineapple: ['pineapple', 'pineapples'],
  cranberry: ['cranberry', 'cranberries', 'berry', 'berries'], orange: ['orange', 'oranges'], grapefruit: ['grapefruit'], coconut: ['coconut'], mint: ['mint', 'herbal', 'herbs'],
  ginger: ['ginger']
};

export const TOPIC_LABEL: Record<Topic, string> = {
  sweet: 'sweet', sour: 'sour', bitter: 'bitter', fruity: 'fruity', fresh: 'fresh', creamy: 'creamy', dry: 'dry', spicy: 'spicy', sparkling: 'bubbles',
  coffee: 'coffee', strong: 'strong', light: 'light', rum: 'rum', gin: 'gin', vodka: 'vodka', tequila: 'tequila', whiskey: 'whiskey', wine: 'sparkling wine',
  lime: 'lime', lemon: 'lemon', pineapple: 'pineapple', cranberry: 'cranberry', orange: 'orange', grapefruit: 'grapefruit', coconut: 'coconut', mint: 'mint', ginger: 'ginger'
};

export function buildProfile(recipe: Recipe): DrinkProfile {
  const traits = new Set<Topic>();
  for (const part of recipe.ingredients) for (const trait of INGREDIENT_TRAITS[part.ingredientId] ?? []) traits.add(trait);
  for (const note of recipe.tastingNotes ?? []) for (const trait of NOTE_TRAITS[note] ?? []) traits.add(trait);
  // Strength is the spirit share of the liquid, not the raw volume.
  const liquids = recipe.ingredients.filter((part) => !['ice', 'mint', 'lime-wedge', 'orange', 'pineapple-wedge', 'salt'].includes(part.ingredientId));
  const spiritMl = liquids.filter((part) => SPIRIT_IDS.includes(part.ingredientId)).reduce((sum, part) => sum + part.amount, 0);
  const ratio = spiritMl / Math.max(1, liquids.reduce((sum, part) => sum + part.amount, 0));
  const strength = traits.has('strong') || ratio >= .6 ? 'strong' : ratio <= .35 ? 'light' : 'medium';
  traits.delete('strong');
  if (strength !== 'medium') traits.add(strength);
  const clue = FRUITS.find((fruit) => traits.has(fruit)) ?? (['coffee', 'sparkling', 'bitter', 'sweet', 'sour', 'creamy', 'dry', ...SPIRITS] as Topic[]).find((trait) => traits.has(trait)) ?? 'strong';
  const feeling = traits.has('coffee') ? 'awake and happy'
    : strength === 'strong' ? 'warm and relaxed'
      : traits.has('sparkling') || traits.has('fresh') ? 'fresh and cool'
        : traits.has('sweet') || traits.has('fruity') ? 'happy and relaxed'
          : traits.has('bitter') ? 'calm' : 'relaxed';
  return { recipeId: recipe.id, recipeName: recipe.name, traits, strength, clue, feeling };
}

const MOOD_INTRO: Record<string, string> = {
  sad: 'I had a long day.', tired: 'I am so tired tonight.', impatient: 'I don’t have much time.', angry: 'What a terrible day!', vip: 'Good evening.',
  friendly: 'Hi there!', shy: 'Um… hello.', confused: 'I’m not sure what to order.', wealthy: 'Money is not a problem tonight.', calm: 'Hello.'
};

export function openingLine(customer: Customer, profile: DrinkProfile) {
  if (customer.specialRecipeRewardId) return `${customer.greeting} ${customer.request}`;
  const clue = TOPIC_LABEL[profile.clue];
  const kind = SPIRITS.includes(profile.clue) || FRUITS.includes(profile.clue) ? 'taste' : profile.clue === 'sparkling' ? 'bubbles' : 'style';
  const likeLine = clueLine(clue, kind, `${customer.id}:clue`);
  // A guest with feelings opens with how they feel (and an ashtray request, if they smoke), then names what they like.
  // The question is not always asked: the hint is already a way in.
  const lively = openingFor(customer);
  if (lively) {
    const ashtray = customer.social?.need?.kind === 'ashtray' ? ' Could I have an ashtray, please?' : '';
    const ask = customer.social && customer.social.rounds === 0 ? askLine(lively.seed, true) : lively.ask;
    return [lively.text, likeLine, ask].filter(Boolean).join(' ') + ashtray;
  }
  return `${MOOD_INTRO[customer.mood] ?? 'Hello.'} ${likeLine} Can you help me choose a drink?`;
}

export function shortWish(profile: DrinkProfile) {
  return profile.clue === 'sparkling' ? 'Something with bubbles, please.' : `Something ${['rum','gin','vodka','tequila','whiskey','wine',...FRUITS].includes(profile.clue) ? `with ${TOPIC_LABEL[profile.clue]}` : TOPIC_LABEL[profile.clue]}, please.`;
}

function wordsOf(text: string) {
  return text.toLowerCase().replace(/’/g, "'").replace(/&/g, ' and ').split(/[^\p{L}0-9']+/u).filter(Boolean);
}
function normalizeName(text: string) {
  return text.toLowerCase().replace(/ñ/g, 'n').replace(/&/g, 'and').replace(/[^a-z0-9]+/g, ' ').trim();
}

const capitalize = (text: string) => text.charAt(0).toUpperCase() + text.slice(1);

function wantMore(topic: Topic) {
  if (topic === 'sparkling') return 'I want something with bubbles.';
  if (topic === 'coffee') return 'I would like something with coffee.';
  if (topic === 'strong' || topic === 'light') return `I want something ${topic}.`;
  if (SPIRITS.includes(topic) || FRUITS.includes(topic)) return `I want something with ${TOPIC_LABEL[topic]}.`;
  return `I want something more ${TOPIC_LABEL[topic]}.`;
}

export function findRecipeMention(text: string, recipes: Recipe[]) {
  const haystack = ` ${normalizeName(text)} `;
  return [...recipes].sort((a, b) => b.name.length - a.name.length).find((recipe) => haystack.includes(` ${normalizeName(recipe.name)} `));
}

export function topicsIn(text: string): Topic[] {
  const words = wordsOf(text);
  return (Object.keys(KEYWORDS) as Topic[]).filter((topic) => KEYWORDS[topic].some((keyword) => words.includes(keyword)));
}

function describe(topic: Topic, likes: boolean, profile: DrinkProfile) {
  const label = TOPIC_LABEL[topic];
  if (topic === 'strong') return likes ? 'Yes, something strong, please.' : profile.strength === 'medium' ? 'Not too strong, please. Medium is good.' : 'No, not strong. I want something light.';
  if (topic === 'light') return likes ? 'Yes, something light, please.' : profile.strength === 'strong' ? 'No, I want something strong tonight.' : 'Not too light. Medium is good.';
  if (topic === 'sparkling') return likes ? 'Yes, I love bubbles!' : 'No bubbles, please.';
  if (topic === 'coffee') return likes ? 'Yes, I like coffee.' : 'No coffee tonight, please.';
  if (SPIRITS.includes(topic)) return likes ? `Yes, ${label} is perfect.` : `Not ${label} tonight, thank you.`;
  if (FRUITS.includes(topic)) return likes ? `Yes, I love ${label}!` : `No ${label}, please.`;
  return likes ? `Yes, I like ${label} drinks.` : `No, not ${label}, please.`;
}

// Is a known fact consistent with a recipe? Used for the "possible drinks" helper.
export function matchesFacts(recipe: Recipe, facts: Fact[]) {
  const profile = buildProfile(recipe);
  return facts.every((fact) => profile.traits.has(fact.topic) === fact.likes);
}

export function replyTo(text: string, customer: Customer, profile: DrinkProfile, recipes: Recipe[], revealedFacts: Fact[], modifierLabel?: string): CustomerReply {
  const words = wordsOf(text);
  const offered = findRecipeMention(text, recipes);
  if (offered) {
    if (offered.id === profile.recipeId) {
      return { text: `Yes! ${capitalize(withArticle(offered.name))} sounds perfect.${modifierLabel ? ` ${modifierLabel}.` : ''} Thank you!`, expression: 'very-happy', facts: [], confirmed: true };
    }
    const other = buildProfile(offered);
    const missing = [...profile.traits].find((trait) => !other.traits.has(trait) && !['medium'].includes(trait));
    const unwanted = [...other.traits].find((trait) => !profile.traits.has(trait));
    // The clue board records exactly what the customer says.
    const saysUnwanted = unwanted && (SPIRITS.includes(unwanted) || ['strong', 'bitter', 'coffee', 'creamy', 'sparkling'].includes(unwanted));
    const reason = saysUnwanted ? describe(unwanted, false, profile) : missing ? `Hmm, ${wantMore(missing)}` : 'Hmm, not that one.';
    const facts: Fact[] = saysUnwanted ? [{ topic: unwanted, likes: false }] : missing ? [{ topic: missing, likes: true }] : [];
    return { text: `${capitalize(withArticle(offered.name))}? ${reason} Can you ask me another question?`, expression: 'disappointed', facts, wrongGuess: true };
  }

  const topics = topicsIn(text).slice(0, 2);
  if (topics.length) {
    const facts = topics.map((topic) => ({ topic, likes: profile.traits.has(topic) }));
    if (topics.length === 2 && words.includes('or')) {
      const liked = facts.find((fact) => fact.likes);
      const reply = liked ? `I prefer ${TOPIC_LABEL[liked.topic]}.` : 'Neither, thank you.';
      return { text: reply, expression: liked ? 'smile' : 'thinking', facts };
    }
    return { text: facts.map((fact) => describe(fact.topic, fact.likes, profile)).join(' '), expression: facts.every((fact) => fact.likes) ? 'happy' : 'thinking', facts };
  }

  if (words.some((word) => ['alcohol', 'alcoholic', 'non'].includes(word))) return { text: 'With alcohol, please. But not too much.', expression: 'smile', facts: [] };
  const greeted = words.some((word) => ['hello', 'hi', 'hey', 'evening'].includes(word));
  const asksWhat = words.some((word) => ['what', 'which', 'kind', 'type', 'flavour', 'flavours', 'flavor', 'taste', 'favourite', 'favorite', 'recommend', 'suggest'].includes(word));
  // “How are you?” gets small talk; a plain “Hello” gets a hello; “Hello, what would you like?” answers the question.
  if (words.includes('how') && words.includes('you') && !asksWhat) {
    return { text: `Hi! ${customer.mood === 'sad' || customer.mood === 'tired' ? 'I’m a bit tired.' : 'I’m good, thanks.'} ${revealedFacts.length ? 'And you?' : 'Can you help me choose a drink?'}`, expression: 'smile', facts: [] };
  }
  if (greeted && !asksWhat) return { text: customer.social ? `${helloBack(customer, customer.id + text)}` : 'Hello! Can you help me choose a drink?', expression: 'smile', facts: [] };
  if (asksWhat) {
    const known = new Set(revealedFacts.map((fact) => fact.topic));
    // Asked about flavour or taste: answer with a flavour or fruit first, the spirit last.
    const flavourFirst = words.some((word) => ['flavour', 'flavours', 'flavor', 'flavors', 'taste'].includes(word));
    const ordered = flavourFirst ? [...profile.traits].sort((a, b) => Number(SPIRITS.includes(a)) - Number(SPIRITS.includes(b))) : [...profile.traits];
    const next = ordered.find((trait) => !known.has(trait));
    if (next) return { text: describe(next, true, profile).replace(/^Yes, /, '').replace(/^./, (letter) => letter.toUpperCase()), expression: 'thinking', facts: [{ topic: next, likes: true }] };
    return { text: 'I think you know everything now. What do you recommend?', expression: 'smile', facts: [] };
  }
  // Said differently each time, so a guest who is not understood twice does not repeat the same sentence.
  const confused = ['Sorry, I don’t understand. You can ask about the taste, fruit, strength or bubbles.', 'Sorry, I don’t understand. Ask me what I like, for example sweet or sour.', 'Sorry, I don’t understand. Maybe ask me about the taste?', 'Hmm, I don’t understand. Do I want something strong, light or fresh? Ask me!'];
  return { text: confused[(text.length + customer.id.length + revealedFacts.length) % confused.length]!, expression: 'confused', facts: [] };
}

// Question templates for the word-tile mode.
export function questionTemplates(facts: Fact[], candidates: Recipe[]) {
  const asked = new Set(facts.map((fact) => fact.topic));
  const pool = ([
    { topic: 'sweet', text: 'Do you like sweet drinks?' },
    { topic: 'sour', text: 'Do you like sour drinks?' },
    { topic: 'bitter', text: 'Do you like bitter drinks?' },
    { topic: 'strong', text: 'Do you want something strong?' },
    { topic: 'sparkling', text: 'Would you like a drink with bubbles?' },
    { topic: 'creamy', text: 'Do you like creamy drinks?' },
    { topic: 'coffee', text: 'Do you like coffee?' },
    { topic: 'rum', text: 'Do you prefer rum or gin?' },
    { topic: 'vodka', text: 'Do you like vodka?' },
    { topic: 'tequila', text: 'Would you like something with tequila?' },
    { topic: 'whiskey', text: 'Do you like whiskey?' },
    { topic: 'mint', text: 'Do you like the taste of mint?' },
    { text: 'What flavours do you like?' }
  ] as { topic?: Topic; text: string }[]).filter((item) => !item.topic || !asked.has(item.topic));
  const guesses = candidates.slice(0, 3).map((recipe) => ({ text: `Would you like ${withArticle(recipe.name)}?` }));
  return facts.length >= 2 ? [...guesses, ...pool] : [...pool, ...guesses];
}

const DISTRACTORS = ['likes', 'does', 'an', 'more', 'wants', 'is', 'a', 'to'];
export function sentenceWords(sentence: string, recipes: Recipe[]) {
  const recipe = findRecipeMention(sentence, recipes);
  const body = recipe ? sentence.replace(recipe.name,'§') : sentence;
  return body.replace(/([?.!])$/, ' $1').split(/\s+/).filter(Boolean).map(word => word === '§' ? recipe!.name : word);
}
export function correctedTileSelection(sentence:string, tiles:{id:string;text:string}[], recipes:Recipe[]) {
  const used = new Set<string>();
  return sentenceWords(sentence,recipes).map(word => {
    const tile = tiles.find(item => item.text === word && !used.has(item.id));
    if (tile) used.add(tile.id);
    return tile?.id;
  }).filter((id):id is string => !!id);
}
export function tilesFor(sentence: string, recipes: Recipe[]) {
  const tiles = sentenceWords(sentence, recipes);
  const lowered = tiles.map((tile) => tile.toLowerCase());
  const extras = DISTRACTORS.filter((word) => !lowered.includes(word)).sort(() => Math.random() - .5).slice(0, 3);
  const all = [...tiles, ...extras];
  return all.map((text, index) => ({ id: `${index}-${text}`, text })).sort(() => Math.random() - .5);
}
