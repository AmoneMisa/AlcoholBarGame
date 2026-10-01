// Game sounds, built from how the real things sound instead of from beeps:
//  - glass, coins and bells ring with INHARMONIC overtones (not 2×, 3×, 4× the pitch) that fade at different speeds;
//  - pouring is filtered noise plus little bubbles; shaking is a cloud of tiny, randomly timed ice hits;
//  - taps and errors are soft wooden knocks, not square waves.
// Every call is slightly different (pitch, timing and loudness drift a little), so repeats never sound machine-made.
import { audioContext, noise, sfxDestination, sfxOn, sfxReverbSend } from './engine';

export type SfxName = 'tap' | 'select' | 'pour' | 'shake' | 'serve' | 'coin' | 'error' | 'correct' | 'wrong' | 'guest' | 'levelUp' | 'buy';

const rand = (min: number, max: number) => min + Math.random() * (max - min);
/** A random pitch drift of ± `cents` hundredths of a semitone. */
const drift = (cents: number) => 2 ** (rand(-cents, cents) / 1200);

// Everything goes to the effects bus, plus a little to the room reverb.
function route(node: AudioNode, room = .25) {
  const ctx = audioContext()!;
  node.connect(sfxDestination()!);
  if (room > 0) {
    const send = ctx.createGain();
    send.gain.value = room;
    node.connect(send).connect(sfxReverbSend()!);
  }
}

// One decaying sine partial: a very quick attack, then an exponential fade.
function partial(freq: number, t: number, decay: number, gain: number, room = .25, slideTo?: number) {
  const ctx = audioContext()!;
  const osc = ctx.createOscillator();
  const amp = ctx.createGain();
  osc.type = 'sine';
  osc.frequency.setValueAtTime(freq, t);
  if (slideTo) osc.frequency.exponentialRampToValueAtTime(slideTo, t + decay);
  amp.gain.setValueAtTime(.0001, t);
  amp.gain.exponentialRampToValueAtTime(gain, t + .004);
  amp.gain.exponentialRampToValueAtTime(.0001, t + decay);
  osc.connect(amp);
  route(amp, room);
  osc.start(t);
  osc.stop(t + decay + .05);
}

// A struck metal or glass body: several overtones, the higher ones dying away faster.
function ring(freq: number, t: number, gain: number, decay: number, ratios: number[], weights: number[], room = .3) {
  ratios.forEach((ratio, i) => partial(freq * ratio * drift(4), t, decay / (1 + i * .9), gain * (weights[i] ?? .1), room));
}
const GLASS = { ratios: [1, 2.32, 4.25, 6.63], weights: [1, .55, .3, .14] };
const COIN = { ratios: [1, 2.76, 5.4], weights: [1, .6, .3] };
const BELL = { ratios: [1, 2.76, 5.4, 8.93], weights: [1, .45, .22, .1] };
const VIBES = { ratios: [1, 4, 10], weights: [1, .22, .06] };

// A soft marimba/wood note: the fundamental plus the 4× overtone, gone in a fraction of a second.
function wood(freq: number, t: number, gain: number, decay = .16) {
  partial(freq * drift(6), t, decay, gain, .2);
  partial(freq * 4 * drift(6), t, decay * .35, gain * .18, .1);
}

// A short noise grain: the building block of ice, splashes, clicks and sliding glass.
function grain(t: number, dur: number, filter: BiquadFilterType, freq: number, q: number, gain: number, freqTo?: number, room = .15) {
  const ctx = audioContext()!;
  const source = noise();
  const biquad = ctx.createBiquadFilter();
  const amp = ctx.createGain();
  biquad.type = filter;
  biquad.Q.value = q;
  biquad.frequency.setValueAtTime(freq, t);
  if (freqTo) biquad.frequency.exponentialRampToValueAtTime(freqTo, t + dur);
  amp.gain.setValueAtTime(.0001, t);
  amp.gain.exponentialRampToValueAtTime(gain, t + Math.min(.012, dur / 3));
  amp.gain.exponentialRampToValueAtTime(.0001, t + dur);
  source.connect(biquad).connect(amp);
  route(amp, room);
  source.start(t, rand(0, 1.6));
  source.stop(t + dur + .05);
}

// A dull knock: a low sine that falls in pitch.
const knock = (t: number, from: number, to: number, dur: number, gain: number) => partial(from, t, dur, gain, .15, to);

// Liquid bubbles: tiny sine chirps that rise quickly, the way a bubble pops at the surface.
function bubbles(t: number, span: number, count: number, gain: number) {
  for (let i = 0; i < count; i++) {
    const at = t + rand(0, span);
    const base = rand(380, 900);
    partial(base, at, rand(.04, .08), gain * rand(.5, 1), .2, base * rand(1.5, 2.3));
  }
}

const SOUNDS: Record<SfxName, (t: number) => void> = {
  // A soft wooden knock for every button.
  tap: (t) => { wood(rand(520, 600), t, .12, .07); grain(t, .02, 'bandpass', 2400, 1.5, .03); },
  select: (t) => { wood(rand(500, 540), t, .13, .12); wood(rand(740, 800), t + .065, .11, .12); },
  // Liquid rushing into a glass: a rising band of noise, a splash on top and a scatter of bubbles.
  pour: (t) => {
    grain(t, .8, 'bandpass', 500, 1.1, .5, 1900);
    grain(t + .05, .7, 'highpass', 3200, .7, .12);
    bubbles(t, .75, 11, .11);
  },
  // Ice and a metal shaker: many small hits at uneven times, a few louder ones, and the slosh underneath.
  shake: (t) => {
    let at = t;
    for (let i = 0; i < 15; i++) {
      grain(at, rand(.025, .05), 'bandpass', rand(2600, 6800), 4, (i % 3 === 0 ? .5 : .26) * rand(.7, 1.1), undefined, .3);
      at += rand(.04, .075);
    }
    grain(t, .75, 'bandpass', 850, 1.4, .16, 650);
    knock(t + .02, 190, 140, .12, .05);
  },
  // A glass set down on the bar: a short slide, a dull touch of the base and a little ring.
  serve: (t) => {
    grain(t, .16, 'bandpass', 2500, 2, .05, 1400);
    knock(t + .12, 260, 150, .09, .12);
    ring(rand(2300, 2650), t + .13, .1, .55, GLASS.ratios, GLASS.weights, .4);
  },
  // Two coins touching: bright metal with a hard, short strike.
  coin: (t) => {
    grain(t, .012, 'highpass', 5200, .7, .08);
    ring(rand(2250, 2400), t, .1, .24, COIN.ratios, COIN.weights, .3);
    ring(rand(2900, 3050), t + .075, .1, .5, COIN.ratios, COIN.weights, .35);
  },
  // A soft, low "bonk" — a wrong move is a gentle knock, never a harsh buzz.
  error: (t) => { knock(t, rand(170, 190), 95, .22, .3); grain(t, .06, 'lowpass', 520, .8, .08); knock(t + .16, rand(130, 145), 75, .26, .26); },
  // A little vibraphone figure: C – E – G.
  correct: (t) => [523.25, 659.25, 783.99].forEach((note, i) => ring(note, t + i * .085 + rand(-.006, .006), .11, 1.1, VIBES.ratios, VIBES.weights, .4)),
  wrong: (t) => { wood(rand(325, 335), t, .17, .2); wood(rand(245, 252), t + .15, .17, .26); },
  // A shop doorbell: two bell strokes with a long ring, and the small click of the door.
  guest: (t) => {
    grain(t, .03, 'bandpass', 1800, 2, .06);
    ring(1567.98, t + .02, .11, 1.3, BELL.ratios, BELL.weights, .45);
    ring(1174.66, t + .3, .11, 1.6, BELL.ratios, BELL.weights, .45);
  },
  // A rising vibraphone run that ends in a bright, shimmering bell.
  levelUp: (t) => {
    [392, 523.25, 659.25, 783.99].forEach((note, i) => ring(note, t + i * .09, .12, 1, VIBES.ratios, VIBES.weights, .45));
    ring(1046.5, t + .36, .13, 1.8, BELL.ratios, BELL.weights, .55);
    for (let i = 0; i < 6; i++) grain(t + .36 + rand(0, .45), .03, 'highpass', rand(6500, 9000), .8, .03, undefined, .5);
  },
  // A till: a mechanical click and two bright coin strikes.
  buy: (t) => {
    grain(t, .04, 'bandpass', 2300, 3, .16, 900);
    knock(t, 330, 190, .06, .07);
    ring(2093, t + .08, .1, .4, COIN.ratios, COIN.weights, .3);
    ring(2637, t + .16, .1, .6, COIN.ratios, COIN.weights, .35);
  }
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
