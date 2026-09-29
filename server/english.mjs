import nspell from 'nspell';
import dictionary from 'dictionary-en';
import { checkText, useSpeller } from '../src/domain/english/checker';
import { LEXICON } from '../src/domain/english/lexicon';

// The server's own English checker (same rules and dictionary as the app): it decides whether a sentence earns XP
// and what the guest understands (the corrected sentence).
const speller = nspell(dictionary);
for (const word of LEXICON) if (!word.includes("'")) speller.add(word);
useSpeller(speller);

export function checkEnglish(text) {
  const result = checkText(text);
  return { ok: result.ok, corrected: result.corrected || text };
}
