import { ALCOHOL_PRODUCTS } from '../bottleCatalog';
import { BRANDS } from '../../data/knowledge/alcohol';
import { RECIPES } from '../catalog';
import { LEXICON } from './lexicon';

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
