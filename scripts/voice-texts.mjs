// Lists every word, example and phrase the game can read aloud. Used by scripts/generate_voice.py.
import { VOCABULARY } from '../src/domain/english/vocabulary.ts';
import { PHRASE_GROUPS } from '../src/domain/english/phrases.ts';
import { RECIPES } from '../src/domain/catalog.ts';
import { MORE_GUIDES } from '../src/data/knowledge/cocktailsMore.ts';
import { BRANDS_A } from '../src/data/knowledge/brandsA.ts';
import { BRANDS_B } from '../src/data/knowledge/brandsB.ts';
import { BRANDS_C } from '../src/data/knowledge/brandsC.ts';
import { BRANDS_D } from '../src/data/knowledge/brandsD.ts';

const texts = new Set();
for (const entry of VOCABULARY) { texts.add(entry.word); texts.add(entry.example); }
for (const group of PHRASE_GROUPS) for (const lesson of group.lessons) { texts.add(lesson.text); for (const answer of lesson.answers) texts.add(answer); }
for (const recipe of RECIPES) texts.add(recipe.name);
// The description of each newer cocktail is read aloud too (the speaker button in its guide).
for (const guide of Object.values(MORE_GUIDES)) texts.add(guide.summary);
for (const table of [BRANDS_A, BRANDS_B, BRANDS_C, BRANDS_D]) for (const list of Object.values(table)) for (const brand of list) texts.add(brand.name);
process.stdout.write(JSON.stringify([...texts].map((text) => text.trim()).filter(Boolean), null, 1));
