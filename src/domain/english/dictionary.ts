import type NSpell from 'nspell';
import { LEXICON } from './lexicon';

// Full English vocabulary from the open-source Hunspell dictionary (dictionary-en + nspell).
// Loaded lazily (≈550 KB) so the game starts fast; the checker falls back to the built-in lexicon until it is ready.
// The .aff/.dic files are imported as asset URLs because the package's own loader uses node:fs.
import affUrl from '../../../node_modules/dictionary-en/index.aff?url';
import dicUrl from '../../../node_modules/dictionary-en/index.dic?url';

export interface Speller {
  correct(word: string): boolean;
  suggest(word: string): string[];
}

let speller: Speller | undefined;
let loading: Promise<Speller | undefined> | undefined;

export function getSpeller() {
  return speller;
}

export function loadSpeller() {
  loading ??= (async () => {
    try {
      const [{ default: nspell }, aff, dic] = await Promise.all([
        import('nspell'),
        fetch(affUrl).then((response) => response.text()),
        fetch(dicUrl).then((response) => response.text())
      ]);
      const instance: NSpell = nspell(aff, dic);
      // Game words (drink names, bar slang) that Hunspell does not know.
      for (const word of LEXICON) if (!word.includes("'")) instance.add(word);
      speller = instance;
      return speller;
    } catch {
      loading = undefined;
      return undefined;
    }
  })();
  return loading;
}
