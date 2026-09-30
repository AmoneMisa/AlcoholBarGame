// Short synthesised game sounds.
import { audioContext, noise, sfxDestination, sfxOn } from './engine';

export type SfxName = 'tap' | 'select' | 'pour' | 'shake' | 'serve' | 'coin' | 'error' | 'correct' | 'wrong' | 'guest' | 'levelUp' | 'buy';

function tone(freq: number, start: number, dur: number, type: OscillatorType = 'sine', gain = .3, slideTo?: number) {
  const ctx = audioContext()!;
  const osc = ctx.createOscillator();
  const amp = ctx.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, start);
  if (slideTo) osc.frequency.exponentialRampToValueAtTime(slideTo, start + dur);
  amp.gain.setValueAtTime(.0001, start);
  amp.gain.exponentialRampToValueAtTime(gain, start + .01);
  amp.gain.exponentialRampToValueAtTime(.0001, start + dur);
  osc.connect(amp).connect(sfxDestination()!);
  osc.start(start);
  osc.stop(start + dur + .05);
}

function burst(start: number, dur: number, filter: BiquadFilterType, freq: number, gain: number, freqTo?: number, q = 1) {
  const ctx = audioContext()!;
  const source = noise();
  const biquad = ctx.createBiquadFilter();
  const amp = ctx.createGain();
  biquad.type = filter;
  biquad.Q.value = q;
  biquad.frequency.setValueAtTime(freq, start);
  if (freqTo) biquad.frequency.exponentialRampToValueAtTime(freqTo, start + dur);
  amp.gain.setValueAtTime(.0001, start);
  amp.gain.exponentialRampToValueAtTime(gain, start + Math.min(.02, dur / 3));
  amp.gain.exponentialRampToValueAtTime(.0001, start + dur);
  source.connect(biquad).connect(amp).connect(sfxDestination()!);
  source.start(start);
  source.stop(start + dur + .05);
}

const arpeggio = (notes: number[], t: number, step: number, type: OscillatorType, gain: number, dur = .25) =>
  notes.forEach((note, i) => tone(note, t + i * step, dur, type, gain));

const SOUNDS: Record<SfxName, (t: number) => void> = {
  tap: (t) => tone(620, t, .06, 'triangle', .12, 420),
  select: (t) => { tone(520, t, .07, 'sine', .15); tone(780, t + .05, .09, 'sine', .13); },
  pour: (t) => { burst(t, .5, 'bandpass', 900, .22, 2200, 3); tone(300, t, .5, 'sine', .05, 700); },
  shake: (t) => { for (let i = 0; i < 6; i++) burst(t + i * .09, .07, 'highpass', 4500, .2); tone(180, t, .5, 'triangle', .03); },
  serve: (t) => { tone(880, t, .5, 'sine', .2); tone(1320, t + .02, .6, 'sine', .12); burst(t, .05, 'highpass', 6000, .15); },
  coin: (t) => { tone(1318, t, .09, 'square', .07); tone(1976, t + .08, .35, 'square', .07); },
  error: (t) => { tone(220, t, .18, 'sawtooth', .12, 160); tone(165, t + .14, .25, 'sawtooth', .12, 110); },
  correct: (t) => arpeggio([523.25, 659.25, 783.99], t, .08, 'triangle', .2),
  wrong: (t) => { tone(330, t, .16, 'triangle', .18); tone(247, t + .14, .3, 'triangle', .18); },
  guest: (t) => { tone(1046.5, t, .5, 'sine', .18); tone(783.99, t + .3, .7, 'sine', .18); burst(t, .1, 'highpass', 5000, .1); },
  levelUp: (t) => arpeggio([392, 523.25, 659.25, 783.99, 1046.5], t, .09, 'triangle', .22, .5),
  buy: (t) => { burst(t, .12, 'bandpass', 2500, .2, 900, 4); tone(988, t + .1, .12, 'square', .06); tone(1319, t + .19, .3, 'square', .06); }
};

let last = { name: '', at: 0 };
export function playSfx(name: SfxName) {
  if (!sfxOn.value) return;
  const ctx = audioContext();
  if (!ctx || ctx.state !== 'running') return;
  const now = ctx.currentTime;
  if (last.name === name && now - last.at < .05) return;
  last = { name, at: now };
  SOUNDS[name](now + .005);
}
