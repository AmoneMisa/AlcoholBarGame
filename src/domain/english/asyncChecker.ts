import { checkText, useSpeller, type CheckResult } from './checker';

type Word = { word: string; correct: boolean; suggestions: string[] };
type Reply = { id: number; result?: CheckResult; vocabulary?: Word[]; failed?: boolean };
let worker: Worker | undefined;
let disabled = false;
let sequence = 0;
let idleTimer: ReturnType<typeof setTimeout> | undefined;
const vocabulary = new Map<string, Word>();
const waiting = new Map<number, { finish: (reply?: Reply) => void; timer: ReturnType<typeof setTimeout> }>();
const cachedSpeller = {
  // Unprepared text keeps conservative feedback. Online actions are always checked again by the server.
  correct: (word: string) => vocabulary.get(word)?.correct ?? true,
  suggest: (word: string) => vocabulary.get(word)?.suggestions ?? []
};
function stop() {
  disabled = true;
  worker?.terminate();
  worker = undefined;
  useSpeller(undefined);
  for (const { finish, timer } of waiting.values()) { clearTimeout(timer); finish(); }
  waiting.clear();
}
export function warmEnglishChecker() {
  clearTimeout(idleTimer);
  if (worker || disabled || typeof Worker === 'undefined') return;
  try {
    worker = new Worker(new URL('./checker.worker.ts', import.meta.url), { type: 'module' });
    worker.onmessage = ({ data }: MessageEvent<Reply>) => {
      const job = waiting.get(data.id);
      if (!job) return;
      clearTimeout(job.timer);
      waiting.delete(data.id);
      job.finish(data);
    };
    worker.onerror = stop;
    worker.onmessageerror = stop;
    worker.postMessage({ id: 0 });
  } catch { stop(); }
}
export function releaseEnglishChecker() {
  clearTimeout(idleTimer);
  idleTimer = setTimeout(() => {
    if (waiting.size) { releaseEnglishChecker(); return; }
    worker?.terminate();
    worker = undefined;
    vocabulary.clear();
    useSpeller(undefined);
  }, 30_000);
}
export async function checkTextAsync(input: string, candidates: string[] = []): Promise<CheckResult> {
  warmEnglishChecker();
  if (!worker) return checkText(input, candidates);
  const id = ++sequence;
  const reply = await new Promise<Reply | undefined>(finish => {
    const timer = setTimeout(stop, 6000);
    waiting.set(id, { finish, timer });
    try { worker!.postMessage({ id, input, candidates }); } catch { stop(); }
  });
  if (!reply?.result) return checkText(input, candidates);
  if (reply.vocabulary) {
    if (vocabulary.size > 1000) vocabulary.clear();
    for (const word of reply.vocabulary) vocabulary.set(word.word, word);
    useSpeller(cachedSpeller);
  }
  return reply.result;
}
