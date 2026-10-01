// Listening to the learner through the browser's speech recognition (Chrome, Edge, Safari, Android WebView).
// Where it is not available the trainer simply does not show a microphone.

interface Recognition extends EventTarget {
  lang: string; interimResults: boolean; maxAlternatives: number; continuous: boolean;
  start(): void; stop(): void; abort(): void;
  onresult: ((event: { results: ArrayLike<ArrayLike<{ transcript: string }>> }) => void) | null;
  onerror: ((event: { error: string }) => void) | null;
  onend: (() => void) | null;
}
type RecognitionClass = new () => Recognition;

const recognitionClass = (): RecognitionClass | undefined => {
  if (typeof window === 'undefined') return undefined;
  const win = window as unknown as { SpeechRecognition?: RecognitionClass; webkitSpeechRecognition?: RecognitionClass };
  return win.SpeechRecognition ?? win.webkitSpeechRecognition;
};

export const canListen = () => !!recognitionClass();

/** Listens once and resolves with the best guess; rejects with a short reason ('denied', 'silent', 'unsupported'). */
export function listenOnce(lang = 'en-US'): Promise<string> {
  const Recognizer = recognitionClass();
  if (!Recognizer) return Promise.reject(new Error('unsupported'));
  if (typeof window !== 'undefined' && 'speechSynthesis' in window) window.speechSynthesis.cancel();
  return new Promise((resolve, reject) => {
    const recognizer = new Recognizer();
    let done = false;
    recognizer.lang = lang;
    recognizer.interimResults = false;
    recognizer.maxAlternatives = 1;
    recognizer.continuous = false;
    recognizer.onresult = (event) => { done = true; resolve(event.results[0]?.[0]?.transcript ?? ''); };
    recognizer.onerror = (event) => { if (!done) { done = true; reject(new Error(event.error === 'not-allowed' || event.error === 'service-not-allowed' ? 'denied' : 'silent')); } };
    recognizer.onend = () => { if (!done) { done = true; reject(new Error('silent')); } };
    try { recognizer.start(); } catch { reject(new Error('unsupported')); }
    setTimeout(() => { if (!done) recognizer.stop(); }, 9000);
  });
}
