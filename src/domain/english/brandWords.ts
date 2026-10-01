import { ALCOHOL_PRODUCTS } from '../bottleCatalog';
import { BRANDS } from '../../data/knowledge/alcohol';
import { RECIPES } from '../catalog';
import { LEXICON } from './lexicon';
import { VOCABULARY } from './vocabulary';
import { SITUATIONS } from '../situations/catalog';
import { allStoryTexts } from '../social/gen/story';
import { allMentionTexts } from '../social/gen/mentions';

// Brand and cocktail names are proper nouns the player must be able to say (“Would you like Jameson instead?”),
// so every word of every brand and bottle name is added to the checker's vocabulary.
// Cocktail names are proper nouns too (“Would you like a Batanga?”), so new recipes never need a hand-written word list.
const names = [...RECIPES.map((recipe) => recipe.name), ...ALCOHOL_PRODUCTS.flatMap((product) => [product.brand, product.name]), ...Object.values(BRANDS).flatMap((list) => list.map((brand) => brand.name))];
for (const name of names) {
  for (const word of name.toLowerCase().replace(/’/g, "'").split(/[^\p{L}\d']+/u)) {
    const clean = word.replace(/'s$/, '').replace(/^'+|'+$/g, '');
    if (clean.length > 1) LEXICON.add(clean);
  }
}

// Every word the generated guest speech uses (stories, reactions) can be used by the player too.
for (const text of [...allStoryTexts(), ...allMentionTexts()]) {
  for (const word of text.toLowerCase().replace(/’/g, "'").split(/[^\p{L}\d']+/u)) if (word.length > 1) LEXICON.add(word.replace(/^'+|'+$/g, ''));
}

// Every word (and form) a learner meets on the vocabulary cards can be used in a sentence too.
for (const entry of VOCABULARY) {
  for (const text of [entry.word, ...(entry.forms ?? [])]) {
    for (const word of text.toLowerCase().replace(/’/g, "'").split(/[^\p{L}\d']+/u)) if (word.length > 1) LEXICON.add(word);
  }
}

// Every word the bartender can say in a situation (a first-aid reply, a payment sentence) can be said and typed too,
// and so can the words listed for each situation's lesson.
for (const situation of SITUATIONS) {
  const texts = [...(situation.vocab ?? []), ...situation.stages.flatMap((stage) => stage.choices.map((choice) => choice.say))];
  for (const text of texts) {
    for (const word of text.toLowerCase().replace(/’/g, "'").replace(/\{\w+\}/g, ' ').split(/[^\p{L}\d']+/u)) {
      const clean = word.replace(/'s$/, '').replace(/^'+|'+$/g, '');
      if (clean.length > 1) LEXICON.add(clean);
    }
  }
}
