import { ref, watch } from 'vue';
import { audioContext, noise, sfxDestination, sfxReverbSend, speechOn, speechVolume } from './engine';

// Guest voices. Each guest has their own voice, built from a few short vowel-like syllables (the way characters
// who do not speak are voiced in many games): the pitch follows the guest, the rhythm follows the words, and the
// feeling changes how it sounds: angry is low and clipped, happy rises, tired sags, drunk slides and slurs.
// Optionally the dialogue is also read aloud by the device voice, for both the guest and the bartender.

export type VoiceMode = 'murmur' | 'speech' | 'off';
const KEY = 'barlingo.voices';
const loadMode = (): VoiceMode => { try { const value = localStorage.getItem(KEY); return value === 'speech' || value === 'off' ? value : 'murmur'; } catch { return 'murmur'; } };
export const voiceMode = ref<VoiceMode>(loadMode());
watch(voiceMode, (value) => { try { localStorage.setItem(KEY, value); } catch { /* private mode */ } });

export type { GuestVoiceProfile as VoiceProfile } from '../domain/social/origin';
import type { GuestVoiceProfile as VoiceProfile } from '../domain/social/origin';

const hash = (text: string) => { let h = 2166136261; for (let i = 0; i < text.length; i++) { h ^= text.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; };
// Rough formants (F1, F2) of five vowels.
const VOWELS: [number, number][] = [[730, 1090], [530, 1840], [270, 2290], [570, 840], [300, 870]];

const FEELING: Record<string, { pitch: number; speed: number; rise: number; level: number }> = {
  angry: { pitch: .86, speed: 1.2, rise: -.12, level: 1.15 },
  upset: { pitch: .92, speed: .95, rise: -.1, level: .85 },
  happy: { pitch: 1.08, speed: 1.05, rise: .14, level: 1 },
  excited: { pitch: 1.14, speed: 1.3, rise: .2, level: 1.1 },
  tired: { pitch: .9, speed: .72, rise: -.16, level: .7 },
  lonely: { pitch: .95, speed: .85, rise: -.06, level: .75 },
  nervous: { pitch: 1.08, speed: 1.25, rise: .06, level: .8 },
  relaxed: { pitch: .97, speed: .85, rise: .02, level: .85 }
};

// Low-power devices get fewer syllables and no reverb send.
const lowPower = () => typeof navigator !== 'undefined' && ((navigator.hardwareConcurrency ?? 8) <= 4 || ((navigator as Navigator & { deviceMemory?: number }).deviceMemory ?? 8) <= 2);
let lastVoiceAt = 0;

export function guestVoice(profile: VoiceProfile, text: string) {
  if (voiceMode.value !== 'murmur' || !speechOn.value || speechVolume.value <= 0) return;
  const ctx = audioContext();
  if (!ctx || ctx.state !== 'running') return;
  if (ctx.currentTime - lastVoiceAt < .25) return;
  const h = hash(profile.seed);
  const feel = FEELING[profile.emotion ?? 'relaxed'] ?? FEELING.relaxed!;
  // A woman, a man, a young or an old person each have their own pitch and vocal tract; the seed makes each one unique.
  const pitches = { f: { young: 250, adult: 208, old: 186 }, m: { young: 138, adult: 114, old: 100 }, x: { young: 190, adult: 160, old: 140 } }[profile.gender][profile.age];
  const base = pitches * (.93 + (h % 15) / 100);
  const tract = (profile.gender === 'f' ? 1.14 : profile.gender === 'm' ? .9 : 1) * (profile.age === 'young' ? 1.05 : profile.age === 'old' ? .97 : 1) * (.94 + ((h >> 5) % 13) / 100);
  const vibrato = profile.age === 'old' ? 5.5 : 0;
  const words = text.trim().split(/\s+/).filter(Boolean);
  const syllables = Math.min(lowPower() ? 7 : 14, Math.max(2, Math.round(words.length * .9)));
  const slur = Math.min(1, (profile.drunk ?? 0) / 100);
  const length = (.15 / (feel.speed * profile.speed)) * (1 + slur * .5);
  const out = sfxDestination()!;
  const send = lowPower() ? undefined : sfxReverbSend();
  let t = ctx.currentTime + .02;
  lastVoiceAt = t;
  for (let i = 0; i < syllables; i++) {
    const word = words[Math.floor((i / syllables) * words.length)] ?? '';
    const w = hash(word.toLowerCase() + profile.seed);
    const vowel = VOWELS[w % VOWELS.length]!;
    const stress = word.length > 4 ? 1.05 : .95;
    const progress = i / Math.max(1, syllables - 1);
    const end = /[?]$/.test(text.trim()) ? progress * .18 : /!$/.test(text.trim()) ? progress * .05 : 0;
    const pitch = base * feel.pitch * stress * (1 + feel.rise * progress + end + (((w >> 4) % 9) - 4) / 60);
    const dur = length * (word.length > 6 ? 1.3 : 1) * (.85 + ((w >> 8) % 5) / 12);
    const osc = ctx.createOscillator();
    osc.type = profile.age === 'old' ? 'triangle' : 'sawtooth';
    osc.frequency.setValueAtTime(pitch, t);
    osc.frequency.linearRampToValueAtTime(pitch * (1 - slur * .12 + (feel.rise > 0 ? .03 : -.03)), t + dur);
    if (vibrato) { const wobble = ctx.createOscillator(); const depth = ctx.createGain(); wobble.frequency.value = vibrato; depth.gain.value = pitch * .018; wobble.connect(depth).connect(osc.frequency); wobble.start(t); wobble.stop(t + dur + .02); }
    const f1 = ctx.createBiquadFilter(); f1.type = 'bandpass'; f1.frequency.value = vowel[0] * tract * (1 - slur * .1); f1.Q.value = 5;
    const f2 = ctx.createBiquadFilter(); f2.type = 'bandpass'; f2.frequency.value = vowel[1] * tract; f2.Q.value = 7;
    const gain = ctx.createGain();
    const peak = .16 * feel.level * speechVolume.value;
    gain.gain.setValueAtTime(0, t);
    gain.gain.linearRampToValueAtTime(peak, t + .02);
    gain.gain.exponentialRampToValueAtTime(.0005, t + dur);
    osc.connect(f1); osc.connect(f2);
    const mix = ctx.createGain(); mix.gain.value = .6;
    f1.connect(mix); f2.connect(mix); mix.connect(gain); gain.connect(out);
    if (send) { const s = ctx.createGain(); s.gain.value = .25; gain.connect(s).connect(send); }
    osc.start(t); osc.stop(t + dur + .02);
    // A soft breath of noise on the start of a syllable gives the consonant.
    if ((i % 2 === 0 || profile.age === 'old') && !lowPower()) {
      const breath = noise();
      const bp = ctx.createBiquadFilter(); bp.type = 'highpass'; bp.frequency.value = 2800;
      const bg = ctx.createGain(); bg.gain.setValueAtTime(.04 * speechVolume.value, t); bg.gain.exponentialRampToValueAtTime(.0005, t + .05);
      breath.connect(bp).connect(bg).connect(out); breath.start(t); breath.stop(t + .06);
    }
    t += dur * (.95 + (w % 3) / 10);
    if (words[Math.floor(((i + 1) / syllables) * words.length)] !== word && i % 3 === 2) t += .06;
  }
}

// The device voice for dialogue lines: the guest and the bartender sound different (pitch and speed).
export function speakLine(text: string, who: 'guest' | 'bartender', profile?: VoiceProfile) {
  if (voiceMode.value !== 'speech' || !speechOn.value || speechVolume.value <= 0 || typeof window === 'undefined' || !('speechSynthesis' in window)) return;
  const feel = FEELING[profile?.emotion ?? 'relaxed'] ?? FEELING.relaxed!;
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = profile?.lang ?? 'en-GB';
  utterance.volume = speechVolume.value;
  const voices = window.speechSynthesis.getVoices().filter((item) => item.lang.startsWith('en'));
  const female = (item: SpeechSynthesisVoice) => /female|zira|hazel|susan|samantha|serena|libby|sonia/i.test(item.name);
  if (who === 'bartender') { utterance.pitch = .95; utterance.rate = .95; }
  else {
    const ageShift = profile?.age === 'young' ? 1.12 : profile?.age === 'old' ? .88 : 1;
    utterance.pitch = Math.max(.1, Math.min(2, (profile?.gender === 'f' ? 1.3 : .78) * feel.pitch * ageShift));
    utterance.rate = Math.max(.5, Math.min(1.5, .9 * feel.speed * (profile?.speed ?? 1) * (1 - Math.min(1, (profile?.drunk ?? 0) / 100) * .2)));
    const exact = voices.filter((item) => item.lang.replace('_', '-') === profile?.lang);
    const pick = (exact.length ? exact : voices).filter((item) => (profile?.gender === 'f') === female(item));
    const pool = pick.length ? pick : voices;
    if (pool.length) utterance.voice = pool[hash(profile?.seed ?? '') % pool.length]!;
  }
  window.speechSynthesis.speak(utterance);
}
