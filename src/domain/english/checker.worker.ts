import { checkText, useSpeller } from './checker';
import { loadSpeller } from './dictionary';

type Request = { id: number; input?: string; candidates?: string[] };
const port = self as unknown as { onmessage: (event: MessageEvent<Request>) => void; postMessage(value: unknown): void };
port.onmessage = async ({ data }) => {
  try {
    const speller = await loadSpeller();
    const lookups = new Map<string, { word: string; correct: boolean; suggestions: string[] }>();
    const lookup = (word: string) => {
      if (!lookups.has(word)) lookups.set(word, { word, correct: speller?.correct(word) ?? true, suggestions: [] });
      return lookups.get(word)!;
    };
    const suggestions = new Map<string, string[]>();
    useSpeller(speller ? {
      correct: word => lookup(word).correct,
      suggest: word => {
        if (!suggestions.has(word)) suggestions.set(word, speller.suggest(word));
        lookup(word).suggestions = suggestions.get(word)!;
        return suggestions.get(word)!;
      }
    } : undefined);
    if (data.input === undefined) { port.postMessage({ id: data.id, ready: true }); return; }
    const result = checkText(data.input, data.candidates);
    // The prediction on the main thread can reuse these lookups without constructing another dictionary.
    const words = [...new Set(data.input.replace(/’/g, "'").match(/[\p{L}]+(?:'[\p{L}]+)?/gu) ?? [])];
    const vocabulary = speller ? [...new Set(words.flatMap(word => [word, word.toLowerCase()]))].map(word => {
      return lookup(word);
    }) : undefined;
    port.postMessage({ id: data.id, result, vocabulary });
  } catch { port.postMessage({ id: data.id, failed: true }); }
};
