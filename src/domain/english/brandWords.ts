import { ALCOHOL_PRODUCTS } from '../bottleCatalog';
import { BRANDS } from '../../data/knowledge/alcohol';
import { RECIPES } from '../catalog';
import { LEXICON } from './lexicon';
import { VOCABULARY } from './vocabulary';

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

// Every word (and form) a learner meets on the vocabulary cards can be used in a sentence too.
for (const entry of VOCABULARY) {
  for (const text of [entry.word, ...(entry.forms ?? [])]) {
    for (const word of text.toLowerCase().replace(/’/g, "'").split(/[^\p{L}\d']+/u)) if (word.length > 1) LEXICON.add(word);
  }
}
