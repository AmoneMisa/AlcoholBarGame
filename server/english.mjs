import nspell from 'nspell';
import dictionary from 'dictionary-en';
import { checkText, useSpeller } from '../src/domain/english/checker';
import { LEXICON } from '../src/domain/english/lexicon';

// The server's own English checker (same rules and dictionary as the app), used to decide whether a sentence earns XP.
const speller = nspell(dictionary);
for (const word of LEXICON) if (!word.includes("'")) speller.add(word);
useSpeller(speller);

export const isCorrectEnglish = (text) => checkText(text).ok;
