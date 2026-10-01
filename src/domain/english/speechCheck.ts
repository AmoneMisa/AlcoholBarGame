// Comparing what a learner said (as heard by speech recognition) with the sentence they were trying to say.
// Words are matched in order; a word that is nearly right (one letter off in a longer word) counts, because
// recognition is not perfect and we want to teach pronunciation, not punish the microphone.

export interface SpokenWord { word: string; ok: boolean }
export interface SpeechResult { score: number; words: SpokenWord[]; heard: string; passed: boolean }

const clean = (text: string) => text.toLowerCase().replace(/[’']/g, '').replace(/[^a-z0-9\s]/g, ' ').split(/\s+/).filter(Boolean);

function distance(a: string, b: string) {
  const row = Array.from({ length: b.length + 1 }, (_, index) => index);
  for (let i = 1; i <= a.length; i++) {
    let previous = row[0]!;
    row[0] = i;
    for (let j = 1; j <= b.length; j++) {
      const keep = row[j]!;
      row[j] = Math.min(row[j]! + 1, row[j - 1]! + 1, previous + (a[i - 1] === b[j - 1] ? 0 : 1));
      previous = keep;
    }
  }
  return row[b.length]!;
}

const close = (target: string, heard: string) => target === heard || (target.length >= 5 && distance(target, heard) <= 1) || (target.length >= 8 && distance(target, heard) <= 2);

export function compareSpoken(target: string, heardText: string): SpeechResult {
  const wanted = target.split(/\s+/).filter(Boolean);
  const goal = wanted.map((word) => clean(word).join(''));
  const heard = clean(heardText);
  // Longest common subsequence over "close enough" words.
  const table = Array.from({ length: goal.length + 1 }, () => new Array<number>(heard.length + 1).fill(0));
  for (let i = goal.length - 1; i >= 0; i--) for (let j = heard.length - 1; j >= 0; j--) table[i]![j] = goal[i] && close(goal[i]!, heard[j]!) ? table[i + 1]![j + 1]! + 1 : Math.max(table[i + 1]![j]!, table[i]![j + 1]!);
  const words: SpokenWord[] = wanted.map((word) => ({ word, ok: false }));
  let i = 0, j = 0;
  while (i < goal.length && j < heard.length) {
    if (goal[i] && close(goal[i]!, heard[j]!) && table[i]![j] === table[i + 1]![j + 1]! + 1) { words[i] = { word: wanted[i]!, ok: true }; i++; j++; }
    else if (table[i + 1]![j]! >= table[i]![j + 1]!) i++;
    else j++;
  }
  const counted = words.filter((_, index) => goal[index]);
  const score = counted.length ? Math.round((counted.filter((item) => item.ok).length / counted.length) * 100) : 0;
  return { score, words, heard: heardText, passed: score >= 80 };
}
