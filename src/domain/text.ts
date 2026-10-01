// Small text helpers that several modules used to define for themselves.

// FNV-1a: a stable 32-bit hash, used to give a guest or a voice the same random-looking choice every time.
export const fnvHash = (text: string) => {
  let h = 2166136261;
  for (let i = 0; i < text.length; i++) { h ^= text.charCodeAt(i); h = Math.imul(h, 16777619); }
  return h >>> 0;
};

// Lower-case, accents and apostrophes removed, everything else collapsed to single spaces: for matching what a person typed.
export const foldText = (text: string) => text.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[’']/g, '').replace(/[^a-z0-9]+/g, ' ').trim();
