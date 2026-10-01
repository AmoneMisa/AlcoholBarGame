// Lists every word, example and phrase the game can read aloud. Used by scripts/generate_voice.py.
import { VOCABULARY } from '../src/domain/english/vocabulary.ts';
import { PHRASE_GROUPS } from '../src/domain/english/phrases.ts';
import { INGREDIENTS, RECIPES } from '../src/domain/catalog.ts';
import { ALCOHOL_PRODUCTS } from '../src/domain/bottleCatalog.ts';
import { MORE_GUIDES } from '../src/data/knowledge/cocktailsMore.ts';
import { SITUATIONS } from '../src/domain/situations/catalog.ts';
import { FOODS } from '../src/domain/foods.ts';
import { BAR_PAIRINGS } from '../src/data/pairings/barPairings.ts';
import { BRANDS_A } from '../src/data/knowledge/brandsA.ts';
import { BRANDS_B } from '../src/data/knowledge/brandsB.ts';
import { BRANDS_C } from '../src/data/knowledge/brandsC.ts';
import { BRANDS_D } from '../src/data/knowledge/brandsD.ts';

const texts = new Set();
for (const entry of VOCABULARY) { texts.add(entry.word); texts.add(entry.example); }
for (const group of PHRASE_GROUPS) for (const lesson of group.lessons) { texts.add(lesson.text); for (const answer of lesson.answers) texts.add(answer); }
for (const recipe of RECIPES) { texts.add(recipe.name); if (recipe.story) texts.add(recipe.story); }
// The speaker buttons in the Market and the stock list read ingredient names and bottle names aloud.
for (const item of INGREDIENTS) texts.add(item.name);
for (const product of ALCOHOL_PRODUCTS) { texts.add(product.name); texts.add(product.brand); }
// The description of each newer cocktail is read aloud too (the speaker button in its guide).
for (const guide of Object.values(MORE_GUIDES)) texts.add(guide.summary);
for (const table of [BRANDS_A, BRANDS_B, BRANDS_C, BRANDS_D]) for (const list of Object.values(table)) for (const brand of list) texts.add(brand.name);
// Everything said in the situations, by the guest and by the bartender, and the food menu.
for (const def of SITUATIONS) for (const stage of def.stages) { texts.add(stage.guest); for (const choice of stage.choices) { texts.add(choice.say); for (const outcome of choice.outcomes) texts.add(outcome.say); } }
for (const food of FOODS) { texts.add(food.name); texts.add(food.menu); }
// The pairing advisor reads food names, drink names and the reason a pairing works aloud.
const walk = (node) => {
  if (Array.isArray(node)) { node.forEach(walk); return; }
  if (!node || typeof node !== 'object') return;
  for (const [key, value] of Object.entries(node)) {
    if (typeof value === 'string' && ['why', 'food', 'name'].includes(key) && value.length < 400) texts.add(value);
    else walk(value);
  }
};
walk({ ...BAR_PAIRINGS, metadata: undefined });
process.stdout.write(JSON.stringify([...texts].map((text) => text.trim()).filter(Boolean), null, 1));
