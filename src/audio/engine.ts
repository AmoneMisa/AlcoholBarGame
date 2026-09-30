// Shared Web Audio context: one master bus with separate music and effects volumes.
// Everything in the game's audio is synthesised at runtime, so there are no music files to download or license.
import { ref, watch } from 'vue';

const STORE_KEY = 'barlingo.audio';
interface Prefs { music: boolean; sfx: boolean }

function loadPrefs(): Prefs {
  try {
    const saved = JSON.parse(localStorage.getItem(STORE_KEY) ?? '{}');
    return { music: saved.music !== false, sfx: saved.sfx !== false };
  } catch { return { music: true, sfx: true }; }
}

export const musicOn = ref(loadPrefs().music);
export const sfxOn = ref(loadPrefs().sfx);
watch([musicOn, sfxOn], () => {
  try { localStorage.setItem(STORE_KEY, JSON.stringify({ music: musicOn.value, sfx: sfxOn.value })); } catch { /* private mode */ }
  applyVolumes();
});

const MUSIC_LEVEL = .32;
const SFX_LEVEL = .7;
let ctx: AudioContext | undefined;
let musicBus: GainNode | undefined;
let sfxBus: GainNode | undefined;
let ducked = false;

export function audioContext() {
  if (ctx || typeof window === 'undefined') return ctx;
  const Ctor = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!Ctor) return undefined;
  ctx = new Ctor();
  const master = ctx.createGain();
  const compressor = ctx.createDynamicsCompressor();
  master.connect(compressor).connect(ctx.destination);
  musicBus = ctx.createGain();
  sfxBus = ctx.createGain();
  musicBus.connect(master);
  sfxBus.connect(master);
  applyVolumes();
  return ctx;
}

export const musicDestination = () => { audioContext(); return musicBus; };
export const sfxDestination = () => { audioContext(); return sfxBus; };

function applyVolumes() {
  if (!ctx || !musicBus || !sfxBus) return;
  const now = ctx.currentTime;
  musicBus.gain.cancelScheduledValues(now);
  musicBus.gain.setTargetAtTime(musicOn.value ? MUSIC_LEVEL * (ducked ? .3 : 1) : 0, now, .25);
  sfxBus.gain.setTargetAtTime(sfxOn.value ? SFX_LEVEL : 0, now, .05);
}

// Lower the music while a spoken word or phrase is playing.
export function duckMusic(on: boolean) { ducked = on; applyVolumes(); }

let noiseBuffer: AudioBuffer | undefined;
export function noise() {
  const context = audioContext()!;
  if (!noiseBuffer) {
    noiseBuffer = context.createBuffer(1, context.sampleRate, context.sampleRate);
    const data = noiseBuffer.getChannelData(0);
    for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
  }
  const source = context.createBufferSource();
  source.buffer = noiseBuffer;
  source.loop = true;
  return source;
}

// Browsers only allow sound after a tap; Telegram's WebView is the same.
export function unlockAudio(onReady: () => void) {
  if (typeof window === 'undefined') return;
  const start = () => {
    const context = audioContext();
    if (!context) return;
    void context.resume().then(onReady);
    if (context.state === 'running') onReady();
  };
  const once = () => { start(); };
  window.addEventListener('pointerdown', once);
  window.addEventListener('keydown', once);
  document.addEventListener('visibilitychange', () => {
    if (!ctx) return;
    if (document.hidden) void ctx.suspend();
    else void ctx.resume();
  });
}
