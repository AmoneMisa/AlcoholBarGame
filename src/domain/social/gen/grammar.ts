// A tiny text grammar for procedurally generated dialogue.
//
//   [a|b|c]     one of the options (an empty option is allowed: [|, honestly])
//   {name}      a slot, filled from the values given (a list value picks one)
//
// The same seed always gives the same text, so a guest says the same thing when asked twice and a bug can be
// reproduced. Different seeds give different text from the same template, which is where the variety comes from.

export type Slots = Record<string, string | readonly string[] | undefined>;

export const hashOf = (text: string) => { let h = 2166136261; for (let i = 0; i < text.length; i++) { h ^= text.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; };

/** A small seeded random number generator (mulberry32). */
export function rngOf(seed: string): () => number {
  let a = hashOf(seed) || 1;
  return () => { a |= 0; a = (a + 0x6D2B79F5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
}

export const pickFrom = <T,>(list: readonly T[], random: () => number): T => list[Math.min(list.length - 1, Math.floor(random() * list.length))]!;

function clean(text: string) {
  let out = text.replace(/\s+/g, ' ').replace(/\s+([,.!?…;:])/g, '$1').replace(/([,;:])\s*([.!?])/g, '$2').replace(/,\s*,/g, ',').replace(/^[\s,;:]+/, '').trim();
  // a / an
  out = out.replace(/\b([Aa]) (?=[aeiouAEIOU])(?![Uu][^aeiouAEIOU\s]{1,2}[aeiou])/g, (_m, letter: string) => `${letter}n `);
  out = out.replace(/([.!?…]\s+)([a-z])/g, (_m, stop: string, letter: string) => `${stop}${letter.toUpperCase()}`);
  out = out.charAt(0).toUpperCase() + out.slice(1);
  return out;
}

export function expand(template: string, slots: Slots, random: () => number): string {
  const choices = template.replace(/\[([^\[\]]*)\]/g, (_match, body: string) => pickFrom(body.split('|'), random));
  const filled = choices.replace(/\{([a-zA-Z0-9_]+)\}/g, (_match, name: string) => {
    const value = slots[name];
    if (value === undefined) return '';
    return Array.isArray(value) ? pickFrom(value as string[], random) : (value as string);
  });
  return clean(filled);
}

/** Expands one template picked from a list. */
export const say = (templates: readonly string[], slots: Slots, seed: string) => { const random = rngOf(seed); return expand(pickFrom(templates, random), slots, random); };

/** How many different texts a template can make (for the tests): the product of the options. */
export function variants(template: string): number {
  let count = 1;
  for (const match of template.matchAll(/\[([^\[\]]*)\]/g)) count *= match[1]!.split('|').length;
  return count;
}
