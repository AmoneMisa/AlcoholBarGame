// Read a word or sentence aloud with the device's built-in English voice (no network needed).
export function canSpeak() {
  return typeof window !== 'undefined' && 'speechSynthesis' in window;
}

export function speak(text: string) {
  if (!canSpeak()) {
    const message = 'Voice playback is not available in this browser. Update Telegram or open the game in Chrome.';
    if (window.Telegram?.WebApp?.showAlert) window.Telegram.WebApp.showAlert(message);
    else window.alert(message);
    return false;
  }
  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = 'en-GB';
  utterance.rate = .9;
  const voice = window.speechSynthesis.getVoices().find((item) => item.lang.startsWith('en-GB')) ?? window.speechSynthesis.getVoices().find((item) => item.lang.startsWith('en'));
  if (voice) utterance.voice = voice;
  window.speechSynthesis.speak(utterance);
  return true;
}
