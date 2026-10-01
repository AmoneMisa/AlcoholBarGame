// Shared Web Audio context: one master bus with separate music and effects volumes.
// Everything in the game's audio is synthesised at runtime, so there are no music files to download or license.
// To avoid the thin "computer beep" sound, the buses share a little room and hall reverb, a soft high-frequency
// roll-off and pink (not white) noise, which is how real air, liquid and brushes sound.
import { ref, watch } from 'vue';

const STORE_KEY = 'barlingo.audio';
// On/off is kept apart from the level, so muting and unmuting returns to the volume the player chose.
interface Prefs { music: boolean; sfx: boolean; speech: boolean; musicVolume: number; sfxVolume: number; speechVolume: number }

// While developing (vite dev) the music starts muted so it does not play over everything else; a choice the
// developer has saved from the volume panel still wins, and production builds are unaffected.
const MUSIC_DEFAULT = !import.meta.env?.DEV;

const level = (value: unknown) => typeof value === 'number' && Number.isFinite(value) ? Math.min(1, Math.max(0, value)) : 1;
function loadPrefs(): Prefs {
  try {
    const saved = JSON.parse(localStorage.getItem(STORE_KEY) ?? '{}');
    return {
      music: typeof saved.music === 'boolean' ? saved.music : MUSIC_DEFAULT,
      sfx: saved.sfx !== false,
      speech: saved.speech !== false,
      musicVolume: level(saved.musicVolume),
      sfxVolume: level(saved.sfxVolume),
      speechVolume: level(saved.speechVolume)
    };
  } catch { return { music: MUSIC_DEFAULT, sfx: true, speech: true, musicVolume: 1, sfxVolume: 1, speechVolume: 1 }; }
}

const prefs = loadPrefs();
export const musicOn = ref(prefs.music);
export const sfxOn = ref(prefs.sfx);
export const speechOn = ref(prefs.speech);
/** 0–1, multiplied with the channel's mix level. */
export const musicVolume = ref(prefs.musicVolume);
export const sfxVolume = ref(prefs.sfxVolume);
export const speechVolume = ref(prefs.speechVolume);
watch([musicOn, sfxOn, speechOn, musicVolume, sfxVolume, speechVolume], () => {
  const saved: Prefs = {
    music: musicOn.value,
    sfx: sfxOn.value,
    speech: speechOn.value,
    musicVolume: level(musicVolume.value),
    sfxVolume: level(sfxVolume.value),
    speechVolume: level(speechVolume.value)
  };
  try { localStorage.setItem(STORE_KEY, JSON.stringify(saved)); } catch { /* private mode */ }
  applyVolumes();
});

const MUSIC_LEVEL = .32;
const SFX_LEVEL = .7;
let ctx: AudioContext | undefined;
let musicBus: GainNode | undefined;
let sfxBus: GainNode | undefined;
let musicSendBus: GainNode | undefined;
let sfxSendBus: GainNode | undefined;
let ducked = false;

// A synthetic room: stereo noise that fades out and gets darker as it decays, like a real space.
function makeImpulse(context: AudioContext, seconds: number, decay: number, brightness: number) {
  const length = Math.floor(context.sampleRate * seconds);
  const impulse = context.createBuffer(2, length, context.sampleRate);
  const preDelay = Math.floor(context.sampleRate * .012);
  for (let channel = 0; channel < 2; channel++) {
    const data = impulse.getChannelData(channel);
    let low = 0;
    for (let i = preDelay; i < length; i++) {
      const t = (i - preDelay) / (length - preDelay);
      const white = Math.random() * 2 - 1;
      // The tail loses its high frequencies faster than its low ones.
      const smoothing = Math.min(.97, brightness + t * (1 - brightness));
      low += (white - low) * (1 - smoothing);
      data[i] = low * Math.pow(1 - t, decay) * 3.2;
    }
  }
  return impulse;
}

export function audioContext() {
  if (ctx || typeof window === 'undefined') return ctx;
  const Ctor = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!Ctor) return undefined;
  ctx = new Ctor();
  const master = ctx.createGain();
  const compressor = ctx.createDynamicsCompressor();
  // Take the sharp digital edge off everything above ~9 kHz.
  const soften = ctx.createBiquadFilter();
  soften.type = 'lowpass';
  soften.frequency.value = 9000;
  soften.Q.value = .5;
  master.connect(soften).connect(compressor).connect(ctx.destination);
  musicBus = ctx.createGain();
  sfxBus = ctx.createGain();
  musicBus.connect(master);
  sfxBus.connect(master);
  // Music sits in a hall; effects sit in a small room.
  musicSendBus = ctx.createGain();
  const hall = ctx.createConvolver();
  hall.buffer = makeImpulse(ctx, 2.8, 2.2, .55);
  const hallLevel = ctx.createGain();
  hallLevel.gain.value = .5;
  musicSendBus.connect(hall).connect(hallLevel).connect(musicBus);
  sfxSendBus = ctx.createGain();
  const room = ctx.createConvolver();
  room.buffer = makeImpulse(ctx, .75, 3, .35);
  const roomLevel = ctx.createGain();
  roomLevel.gain.value = .45;
  sfxSendBus.connect(room).connect(roomLevel).connect(sfxBus);
  applyVolumes();
  return ctx;
}

export const musicDestination = () => { audioContext(); return musicBus; };
export const sfxDestination = () => { audioContext(); return sfxBus; };
/** Feed a voice into these as well to place it in the hall (music) or the room (effects). */
export const musicReverbSend = () => { audioContext(); return musicSendBus; };
export const sfxReverbSend = () => { audioContext(); return sfxSendBus; };

function applyVolumes() {
  if (!ctx || !musicBus || !sfxBus) return;
  const now = ctx.currentTime;
  musicBus.gain.cancelScheduledValues(now);
  musicBus.gain.setTargetAtTime(musicOn.value ? MUSIC_LEVEL * level(musicVolume.value) * (ducked ? .3 : 1) : 0, now, .25);
  sfxBus.gain.setTargetAtTime(sfxOn.value ? SFX_LEVEL * level(sfxVolume.value) : 0, now, .05);
}

// Lower the music while a spoken word or phrase is playing.
export function duckMusic(on: boolean) { ducked = on; applyVolumes(); }

// Pink noise (equal energy per octave) sounds like air, water and brushes; white noise sounds like a hiss.
let noiseBuffer: AudioBuffer | undefined;
export function noise() {
  const context = audioContext()!;
  if (!noiseBuffer) {
    noiseBuffer = context.createBuffer(1, context.sampleRate * 2, context.sampleRate);
    const data = noiseBuffer.getChannelData(0);
    let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;
    for (let i = 0; i < data.length; i++) {
      const white = Math.random() * 2 - 1;
      b0 = .99886 * b0 + white * .0555179; b1 = .99332 * b1 + white * .0750759; b2 = .969 * b2 + white * .153852;
      b3 = .8665 * b3 + white * .3104856; b4 = .55 * b4 + white * .5329522; b5 = -.7616 * b5 - white * .016898;
      data[i] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * .5362) * .11;
      b6 = white * .115926;
    }
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
