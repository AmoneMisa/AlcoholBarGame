// Read a word or sentence aloud. Pre-rendered neural voice clips (public/assets/voice, see
// scripts/generate_voice.py) are played first; anything without a clip falls back to the
// device's built-in English voice.
import { duckMusic } from '../../audio/engine';
let manifest: Promise<Record<string, string>> | undefined;
let player: HTMLAudioElement | undefined;

function loadManifest() {
  manifest ??= fetch(`${import.meta.env.BASE_URL}assets/voice/manifest.json`)
    .then((response) => (response.ok ? response.json() : {}))
    .catch(() => ({}));
  return manifest;
}

export function canSpeak() {
  return typeof window !== 'undefined' && ('speechSynthesis' in window || typeof Audio !== 'undefined');
}

function speakWithDevice(text: string) {
  if (!('speechSynthesis' in window)) {
    const win: Window = window;
    const message = 'Voice playback is not available in this browser. Update Telegram or open the game in Chrome.';
    if (win.Telegram?.WebApp?.showAlert) win.Telegram.WebApp.showAlert(message);
    else win.alert(message);
    return;
  }
  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = 'en-GB';
  utterance.rate = .9;
  const voice = window.speechSynthesis.getVoices().find((item) => item.lang.startsWith('en-GB')) ?? window.speechSynthesis.getVoices().find((item) => item.lang.startsWith('en'));
  if (voice) utterance.voice = voice;
  window.speechSynthesis.speak(utterance);
}

export function speak(text: string) {
  if (!canSpeak()) { speakWithDevice(text); return false; }
  const key = text.trim();
  void loadManifest().then(async (clips) => {
    const file = clips[key];
    if (!file) { speakWithDevice(key); return; }
    try {
      player?.pause();
      if ('speechSynthesis' in window) window.speechSynthesis.cancel();
      player = new Audio(`${import.meta.env.BASE_URL}assets/voice/${file}`);
      const clip = player;
      const restore = () => duckMusic(false);
      clip.addEventListener('ended', restore);
      clip.addEventListener('pause', restore);
      duckMusic(true);
      await clip.play();
    } catch {
      duckMusic(false);
      speakWithDevice(key);
    }
  });
  return true;
}

// Fetch the clip list up front so playback starts inside the tap that requested it (needed on iOS).
if (typeof window !== 'undefined') void loadManifest();
