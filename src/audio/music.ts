// Generative background music. Every bar interior gets a style (tempo, scale, chords, instruments and drums)
// that matches its painting; the notes are composed live so the music never loops the same way twice.
//
// To sound like players and not like a sequencer:
//  - instruments are modelled on real ones (Rhodes-style piano, plucked upright bass, vibraphone, marimba,
//    plucked strings, brushed drums) instead of raw oscillator waves;
//  - the melody is made of short phrases with rests, a repeated motif and small variations, not a random walk;
//  - every note is a little early or late and a little louder or softer, as a human's would be;
//  - everything sits in a shared hall reverb.
import { audioContext, musicDestination, musicOn, musicReverbSend, noise, unlockAudio } from './engine';

type Drum = 'kick' | 'snare' | 'hat' | 'brush' | 'shaker' | 'hand';
type Voice = 'epiano' | 'pad' | 'pluck' | 'vibes' | 'marimba' | 'bell' | 'synth';
type Comp = 'sustain' | 'charleston' | 'offbeat' | 'arp' | 'none';
interface Style {
  bpm: number;
  swing: number;                     // 0 = straight, .3 = jazzy
  root: number;                      // MIDI note of the key
  scale: number[];                   // scale used for chords and bass
  lead: number[];                    // scale used for the melody
  chords: number[];                  // chord root (scale degree) for each bar
  keys: Voice;                       // instrument that plays the chords
  comp: Comp;                        // how the chords are played
  bass: 'walk' | 'root' | 'pulse' | 'none';
  bassVoice: 'upright' | 'sub';
  melody: { voice: Voice; density: number; octave: number; decay: number };
  drone?: boolean;
  drums: Partial<Record<Drum, string>>; // 16 steps per bar, 'x' = hit, 'o' = soft hit
}

const MAJOR = [0, 2, 4, 5, 7, 9, 11];
const DORIAN = [0, 2, 3, 5, 7, 9, 10];
const MINOR = [0, 2, 3, 5, 7, 8, 10];
const MIXOLYDIAN = [0, 2, 4, 5, 7, 9, 10];
const PHRYGIAN_DOM = [0, 1, 4, 5, 7, 8, 10];
const HIRAJOSHI = [0, 2, 3, 7, 8];
const MAJOR_PENT = [0, 2, 4, 7, 9];
const MINOR_PENT = [0, 3, 5, 7, 10];

const STYLES: Record<string, Style> = {
  lounge: { bpm: 76, swing: .1, root: 57, scale: DORIAN, lead: MINOR_PENT, chords: [0, 3, 1, 4], keys: 'epiano', comp: 'sustain', bass: 'root', bassVoice: 'upright',
    melody: { voice: 'epiano', density: .5, octave: 1, decay: .9 }, drums: { kick: 'x.......x.o.....', brush: '..x...x...x...x.', hat: 'o.o.o.o.o.o.o.o.' } },
  jazz: { bpm: 104, swing: .32, root: 55, scale: DORIAN, lead: MINOR_PENT, chords: [1, 4, 0, 0], keys: 'epiano', comp: 'charleston', bass: 'walk', bassVoice: 'upright',
    melody: { voice: 'vibes', density: .6, octave: 1, decay: .9 }, drums: { brush: 'x.x.x.x.x.x.x.x.', hat: '..o...o...o...o.', kick: 'o.......o.......' } },
  library: { bpm: 66, swing: .18, root: 53, scale: MAJOR, lead: MAJOR_PENT, chords: [0, 5, 3, 4], keys: 'epiano', comp: 'arp', bass: 'root', bassVoice: 'upright',
    melody: { voice: 'epiano', density: .35, octave: 1, decay: 1.4 }, drums: {} },
  tropical: { bpm: 102, swing: 0, root: 60, scale: MIXOLYDIAN, lead: MAJOR_PENT, chords: [0, 3, 4, 3], keys: 'pluck', comp: 'offbeat', bass: 'pulse', bassVoice: 'upright',
    melody: { voice: 'marimba', density: .6, octave: 1, decay: .35 }, drums: { shaker: 'x.xxx.xxx.xxx.xx', hand: 'x..o..x...o.x...' } },
  ocean: { bpm: 84, swing: .05, root: 62, scale: MAJOR, lead: MAJOR_PENT, chords: [0, 4, 5, 3], keys: 'pad', comp: 'sustain', bass: 'root', bassVoice: 'sub',
    melody: { voice: 'vibes', density: .45, octave: 1, decay: 1.6 }, drums: { shaker: 'o.o.o.o.o.o.o.o.', kick: 'x.......x.......' } },
  desert: { bpm: 92, swing: 0, root: 50, scale: PHRYGIAN_DOM, lead: PHRYGIAN_DOM, chords: [0, 0, 1, 0], keys: 'pad', comp: 'sustain', bass: 'pulse', bassVoice: 'sub', drone: true,
    melody: { voice: 'pluck', density: .6, octave: 1, decay: .6 }, drums: { hand: 'x..x..o.x..x.o..', shaker: '..x...x...x...x.' } },
  izakaya: { bpm: 78, swing: 0, root: 57, scale: MINOR, lead: HIRAJOSHI, chords: [0, 5, 3, 0], keys: 'pad', comp: 'sustain', bass: 'root', bassVoice: 'sub', drone: true,
    melody: { voice: 'pluck', density: .4, octave: 1, decay: 1.1 }, drums: { hand: 'x.......o.......' } },
  winter: { bpm: 70, swing: 0, root: 64, scale: MAJOR, lead: MAJOR_PENT, chords: [0, 4, 5, 2], keys: 'pad', comp: 'sustain', bass: 'root', bassVoice: 'sub',
    melody: { voice: 'bell', density: .4, octave: 2, decay: 2 }, drums: {} },
  palace: { bpm: 88, swing: .05, root: 60, scale: MAJOR, lead: MAJOR_PENT, chords: [0, 3, 4, 0], keys: 'pluck', comp: 'arp', bass: 'walk', bassVoice: 'upright',
    melody: { voice: 'bell', density: .5, octave: 1, decay: 1.3 }, drums: { brush: '..x...x...x...x.', kick: 'x.......x.......' } },
  cyber: { bpm: 112, swing: 0, root: 45, scale: MINOR, lead: MINOR_PENT, chords: [0, 0, 5, 4], keys: 'synth', comp: 'arp', bass: 'pulse', bassVoice: 'sub',
    melody: { voice: 'synth', density: .45, octave: 2, decay: .3 }, drums: { kick: 'x...x...x...x...', snare: '....x.......x...', hat: 'xoxoxoxoxoxoxoxo' } },
  loft: { bpm: 96, swing: .12, root: 52, scale: DORIAN, lead: MINOR_PENT, chords: [0, 3, 0, 4], keys: 'epiano', comp: 'charleston', bass: 'pulse', bassVoice: 'upright',
    melody: { voice: 'epiano', density: .4, octave: 1, decay: .5 }, drums: { kick: 'x.....x...x.....', snare: '....x.......x...', hat: 'x.x.x.x.x.x.x.xo' } }
};

const STYLE_OF_INTERIOR: Record<string, keyof typeof STYLES> = {
  velvet: 'lounge', skyline: 'lounge', 'inferno-penthouse': 'lounge',
  speakeasy: 'jazz', 'jazz-cellar': 'jazz', 'art-deco': 'jazz', parisian: 'jazz', library: 'library',
  garden: 'ocean', tropical: 'tropical', beach: 'tropical', marina: 'ocean',
  desert: 'desert', riad: 'desert', izakaya: 'izakaya',
  winter: 'winter', palace: 'palace', cyberpunk: 'cyber', rooftop: 'cyber', loft: 'loft'
};

const midi = (n: number) => 440 * 2 ** ((n - 69) / 12);
const degree = (scale: number[], root: number, d: number) => root + 12 * Math.floor(d / scale.length) + scale[((d % scale.length) + scale.length) % scale.length];
const rand = (min: number, max: number) => min + Math.random() * (max - min);
const pickOne = <T,>(items: T[]) => items[Math.floor(Math.random() * items.length)]!;
// A rough bell curve: most values near 0, rarely far from it.
const gauss = () => (Math.random() + Math.random() + Math.random() - 1.5) / 1.5;

// A plucked string (Karplus–Strong): a burst of noise fed through a short delay with a slow low-pass loop.
// The result has the natural bloom and fade of a real string. Buffers are cached per pitch.
const strings = new Map<number, AudioBuffer>();
function stringBuffer(freq: number) {
  const ctx = audioContext()!;
  const key = Math.round(freq * 2);
  let buffer = strings.get(key);
  if (buffer) return buffer;
  const rate = ctx.sampleRate;
  const period = Math.max(2, Math.round(rate / freq));
  buffer = ctx.createBuffer(1, Math.floor(rate * 2.2), rate);
  const data = buffer.getChannelData(0);
  let smooth = 0;
  for (let i = 0; i < period; i++) { smooth += (Math.random() * 2 - 1 - smooth) * .6; data[i] = smooth; }
  for (let i = period; i < data.length; i++) data[i] = (data[i - period]! + data[i - period + 1]!) * .4985;
  strings.set(key, buffer);
  return buffer;
}

class Track {
  readonly out: GainNode;
  private readonly send: GainNode;
  private timer?: ReturnType<typeof setInterval>;
  private next = 0;
  private step = 0;
  private bar = 0;
  private lastLead = 2;
  private motif: { at: number; move: number; len: number }[] = [];
  private phrase: { at: number; degree: number; len: number }[] = [];
  constructor(private readonly style: Style) {
    const ctx = audioContext()!;
    this.out = ctx.createGain();
    this.out.gain.value = 0;
    this.out.connect(musicDestination()!);
    this.send = ctx.createGain();
    this.send.gain.value = 0;
    this.send.connect(musicReverbSend()!);
  }
  start(fade = 2.5) {
    const ctx = audioContext()!;
    this.next = ctx.currentTime + .1;
    this.out.gain.setTargetAtTime(1, ctx.currentTime, fade / 3);
    this.send.gain.setTargetAtTime(1, ctx.currentTime, fade / 3);
    this.timer = setInterval(() => this.schedule(), 100);
    this.schedule();
  }
  stop(fade = 2.5) {
    const ctx = audioContext()!;
    clearInterval(this.timer);
    this.out.gain.setTargetAtTime(0, ctx.currentTime, fade / 3);
    this.send.gain.setTargetAtTime(0, ctx.currentTime, fade / 3);
    setTimeout(() => { this.out.disconnect(); this.send.disconnect(); }, fade * 1500 + 3000);
  }
  private schedule() {
    const ctx = audioContext()!;
    const stepLength = 60 / this.style.bpm / 4;
    while (this.next < ctx.currentTime + .35) {
      const swing = this.step % 2 === 1 ? this.style.swing * stepLength : 0;
      this.play(this.step, this.next + swing, stepLength);
      this.next += stepLength;
      if (++this.step === 16) { this.step = 0; this.bar++; }
    }
  }
  // A voice's output goes to the track (dry) and, by `wet`, into the shared reverb.
  private to(node: AudioNode, wet: number) {
    const ctx = audioContext()!;
    node.connect(this.out);
    if (wet > 0) { const amount = ctx.createGain(); amount.gain.value = wet; node.connect(amount).connect(this.send); }
  }
  // Humans are never exactly on the beat: a few milliseconds early or late, and never the same loudness twice.
  private human(t: number, amount = .007) { return Math.max(audioContext()!.currentTime + .005, t + gauss() * amount); }
  private play(step: number, t: number, len: number) {
    const s = this.style;
    const chordDegree = s.chords[this.bar % s.chords.length]!;
    if (step === 0) this.chordBar(chordDegree, t, len);
    if (step === 0 && s.drone) this.pad(midi(s.root - 12), t, len * 16, .05);
    this.bassLine(step, t, len, chordDegree);
    this.melodyStep(step, t, len);
    for (const [drum, pattern] of Object.entries(s.drums)) {
      const hit = pattern?.[step];
      if (hit === 'x' || hit === 'o') this.drum(drum as Drum, this.human(t, .004), (hit === 'x' ? 1 : .42) * rand(.8, 1.1));
    }
  }

  // ---- harmony ----
  private chordBar(chordDegree: number, t: number, len: number) {
    const s = this.style;
    const spread = [2, 4, 6, 8].map((offset) => degree(s.scale, s.root + 12, chordDegree + offset));
    const triad = [0, 2, 4].map((offset) => degree(s.scale, s.root, chordDegree + offset));
    const at = (beat16: number) => t + beat16 * len;
    if (s.comp === 'sustain') {
      if (s.keys === 'epiano') spread.slice(0, 3).forEach((note, i) => this.epiano(midi(note), this.human(t + i * .012, .01), len * 12, .5));
      else if (s.keys === 'pad') triad.forEach((note) => this.pad(midi(note + 12), t, len * 16, .05));
      else triad.forEach((note, i) => this.pluck(midi(note + 12), at(0) + i * .03, .7));
    } else if (s.comp === 'charleston') {
      spread.forEach((note, i) => this.epiano(midi(note), this.human(at(0) + i * .008), len * 4, .6));
      spread.slice(1).forEach((note, i) => this.epiano(midi(note), this.human(at(6) + i * .008), len * 3, .42));
    } else if (s.comp === 'offbeat') {
      for (const beat of [2, 6, 10, 14]) spread.slice(0, 3).forEach((note, i) => this.pluck(midi(note), this.human(at(beat) + i * .014, .008), .45));
    } else if (s.comp === 'arp') {
      const order = [0, 1, 2, 3, 2, 1, 2, 3];
      for (let i = 0; i < 8; i++) {
        const note = spread[order[i]! % 4]!;
        if (s.keys === 'synth') this.synth(midi(note), this.human(at(i * 2)), len * 2.4, .045);
        else if (s.keys === 'pluck') this.pluck(midi(note), this.human(at(i * 2), .01), .5 + (i % 2 ? 0 : .15));
        else this.epiano(midi(note), this.human(at(i * 2), .01), len * 3, .3 + (i % 4 === 0 ? .15 : 0));
      }
    }
  }
  private bassLine(step: number, t: number, len: number, d: number) {
    const s = this.style;
    const root = degree(s.scale, s.root - 24, d);
    const play = (note: number, dur: number, vel: number) => this.bass(midi(note), this.human(t, .005), dur, vel * rand(.85, 1.1));
    if (s.bass === 'root' && (step === 0 || step === 10)) play(root, len * 6, .9);
    else if (s.bass === 'walk' && step % 4 === 0) {
      const walk = [0, 2, 4, 1][(step / 4) % 4]!;
      play(degree(s.scale, s.root - 24, d + walk), len * 3.6, .85);
    } else if (s.bass === 'pulse' && step % 2 === 0) {
      const note = step % 8 === 6 ? root + 12 : step % 8 === 4 ? root + 7 : root;
      play(note, len * 1.7, step % 8 === 0 ? .9 : .6);
    }
  }

  // ---- melody: two-bar phrases with a motif that comes back, changes a little, and rests ----
  private melodyStep(step: number, t: number, len: number) {
    const m = this.style.melody;
    const phraseStart = step === 0 && this.bar % 2 === 0;
    if (phraseStart) this.composePhrase();
    for (const note of this.phrase.filter((item) => item.at === (this.bar % 2) * 16 + step)) {
      const pitch = degree(this.style.lead, this.style.root + 12 * m.octave, note.degree);
      this.lead(midi(pitch), this.human(t, .01), Math.max(len * note.len, m.decay * .4), rand(.7, 1));
    }
  }
  private composePhrase() {
    const m = this.style.melody;
    // Quiet moments: sometimes the player simply lets the chords breathe.
    if (Math.random() > .35 + m.density * .6) { this.phrase = []; return; }
    // Keep the motif most of the time (so the ear recognises it), invent a new one now and then.
    if (!this.motif.length || Math.random() < .3) {
      const count = 2 + Math.round(m.density * 3 + Math.random() * 1.5);
      const slots = [0, 2, 3, 4, 6, 8, 10, 12, 14, 16, 18, 20, 22, 24, 26, 28].sort(() => Math.random() - .5).slice(0, count).sort((a, b) => a - b);
      this.motif = slots.map((at) => ({ at, move: pickOne([-2, -1, -1, 0, 1, 1, 2]), len: pickOne([1.5, 2, 3, 4]) }));
    }
    this.phrase = this.motif.map((note) => {
      this.lastLead = Math.max(-2, Math.min(this.style.lead.length + 2, this.lastLead + note.move + (Math.random() < .2 ? pickOne([-1, 1]) : 0)));
      return { at: note.at, degree: this.lastLead, len: note.len };
    });
  }
  private lead(freq: number, t: number, dur: number, vel: number) {
    const m = this.style.melody;
    if (m.voice === 'vibes') this.vibes(freq, t, m.decay, vel * .5);
    else if (m.voice === 'bell') this.bell(freq, t, m.decay, vel * .5);
    else if (m.voice === 'marimba') this.marimba(freq, t, vel * .6);
    else if (m.voice === 'pluck') this.pluck(freq, t, vel * .9);
    else if (m.voice === 'synth') this.synth(freq, t, dur, vel * .06);
    else if (m.voice === 'pad') this.pad(freq, t, dur, vel * .06);
    else this.epiano(freq, t, dur, vel * .65);
  }

  // ---- instruments ----
  // Rhodes-style electric piano: a sine carrier with a short "bark" of FM at the start, then a warm, slowly fading tone.
  private epiano(freq: number, t: number, dur: number, vel: number) {
    const ctx = audioContext()!;
    const amp = ctx.createGain();
    const tone = ctx.createBiquadFilter();
    tone.type = 'lowpass';
    tone.frequency.value = 1800 + vel * 2600;
    const carrier = ctx.createOscillator();
    const mod = ctx.createOscillator();
    const modDepth = ctx.createGain();
    carrier.type = 'sine';
    mod.type = 'sine';
    carrier.frequency.value = freq;
    mod.frequency.value = freq;
    modDepth.gain.setValueAtTime(freq * (1.4 + vel * 1.6), t);
    modDepth.gain.exponentialRampToValueAtTime(freq * .12, t + .35);
    mod.connect(modDepth).connect(carrier.frequency);
    const peak = .1 * vel;
    amp.gain.setValueAtTime(.0001, t);
    amp.gain.exponentialRampToValueAtTime(peak, t + .006);
    amp.gain.exponentialRampToValueAtTime(peak * .45, t + .35);
    amp.gain.setValueAtTime(peak * .45, t + Math.max(.35, dur * .6));
    amp.gain.exponentialRampToValueAtTime(.0001, t + dur + .5);
    carrier.connect(tone).connect(amp);
    this.to(amp, .45);
    carrier.start(t); mod.start(t);
    carrier.stop(t + dur + .6); mod.stop(t + dur + .6);
  }
  // A soft pad: two slightly detuned triangle waves under a low-pass, with a slow swell in and out.
  private pad(freq: number, t: number, dur: number, gain: number) {
    const ctx = audioContext()!;
    const amp = ctx.createGain();
    const tone = ctx.createBiquadFilter();
    tone.type = 'lowpass';
    tone.frequency.setValueAtTime(500, t);
    tone.frequency.linearRampToValueAtTime(1300, t + dur * .5);
    tone.frequency.linearRampToValueAtTime(600, t + dur);
    amp.gain.setValueAtTime(.0001, t);
    amp.gain.exponentialRampToValueAtTime(gain, t + dur * .3);
    amp.gain.setValueAtTime(gain, t + dur * .6);
    amp.gain.exponentialRampToValueAtTime(.0001, t + dur + .8);
    tone.connect(amp);
    this.to(amp, .8);
    for (const cents of [-7, 7]) {
      const osc = ctx.createOscillator();
      osc.type = 'triangle';
      osc.frequency.value = freq;
      osc.detune.value = cents;
      osc.connect(tone);
      osc.start(t);
      osc.stop(t + dur + .9);
    }
  }
  // Plucked string (Karplus–Strong): the guitar, harp or koto of the styles that use it.
  private pluck(freq: number, t: number, vel: number) {
    const ctx = audioContext()!;
    const source = ctx.createBufferSource();
    const amp = ctx.createGain();
    const tone = ctx.createBiquadFilter();
    source.buffer = stringBuffer(freq);
    tone.type = 'lowpass';
    tone.frequency.value = 2400 + vel * 2800;
    amp.gain.setValueAtTime(.34 * vel, t);
    amp.gain.exponentialRampToValueAtTime(.0001, t + 1.9);
    source.connect(tone).connect(amp);
    this.to(amp, .5);
    source.start(t);
    source.stop(t + 2);
  }
  // Plucked upright bass: a round sine with a little second harmonic, a quick finger "thump" and a fast fade.
  private bass(freq: number, t: number, dur: number, vel: number) {
    const ctx = audioContext()!;
    const amp = ctx.createGain();
    const tone = ctx.createBiquadFilter();
    tone.type = 'lowpass';
    tone.frequency.setValueAtTime(900, t);
    tone.frequency.exponentialRampToValueAtTime(260, t + .4);
    const sub = this.style.bassVoice === 'sub';
    const peak = (sub ? .26 : .3) * vel;
    amp.gain.setValueAtTime(.0001, t);
    amp.gain.exponentialRampToValueAtTime(peak, t + (sub ? .03 : .008));
    amp.gain.exponentialRampToValueAtTime(peak * (sub ? .7 : .25), t + Math.min(dur, sub ? 1.2 : .45));
    amp.gain.exponentialRampToValueAtTime(.0001, t + dur + .15);
    tone.connect(amp);
    this.to(amp, .12);
    for (const [ratio, weight, type] of [[1, 1, 'sine'], [2, sub ? .08 : .35, 'sine'], [3, sub ? 0 : .1, 'triangle']] as const) {
      if (!weight) continue;
      const osc = ctx.createOscillator();
      const level = ctx.createGain();
      osc.type = type;
      osc.frequency.value = freq * ratio;
      level.gain.value = weight;
      osc.connect(level).connect(tone);
      osc.start(t);
      osc.stop(t + dur + .3);
    }
    if (!sub) this.hit(t, .014, 'bandpass', 420, 1.2, .08 * vel);
  }
  // Vibraphone and bells: inharmonic overtones with a long, glassy fade.
  private vibes(freq: number, t: number, decay: number, vel: number) {
    [[1, 1, 1], [4, .22, .4], [10, .06, .15]].forEach(([ratio, weight, shorter]) => this.sine(freq * ratio!, t, decay * shorter!, .12 * vel * weight!, .6));
  }
  private bell(freq: number, t: number, decay: number, vel: number) {
    [[1, 1, 1], [2.76, .4, .6], [5.4, .2, .35], [8.93, .08, .2]].forEach(([ratio, weight, shorter]) => this.sine(freq * ratio!, t, decay * shorter!, .11 * vel * weight!, .7));
  }
  private marimba(freq: number, t: number, vel: number) {
    this.sine(freq, t, .45, .16 * vel, .35);
    this.sine(freq * 4, t, .12, .04 * vel, .2);
  }
  private sine(freq: number, t: number, decay: number, gain: number, wet: number) {
    const ctx = audioContext()!;
    const osc = ctx.createOscillator();
    const amp = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.value = freq;
    amp.gain.setValueAtTime(.0001, t);
    amp.gain.exponentialRampToValueAtTime(Math.max(.0002, gain), t + .005);
    amp.gain.exponentialRampToValueAtTime(.0001, t + decay);
    osc.connect(amp);
    this.to(amp, wet);
    osc.start(t);
    osc.stop(t + decay + .05);
  }
  // The cyberpunk style stays electronic, but with a filter that opens and closes with each note.
  private synth(freq: number, t: number, dur: number, gain: number) {
    const ctx = audioContext()!;
    const amp = ctx.createGain();
    const tone = ctx.createBiquadFilter();
    tone.type = 'lowpass';
    tone.Q.value = 5;
    tone.frequency.setValueAtTime(3200, t);
    tone.frequency.exponentialRampToValueAtTime(500, t + Math.max(.15, dur));
    amp.gain.setValueAtTime(.0001, t);
    amp.gain.exponentialRampToValueAtTime(gain, t + .01);
    amp.gain.exponentialRampToValueAtTime(.0001, t + dur + .2);
    tone.connect(amp);
    this.to(amp, .5);
    for (const cents of [-9, 9]) {
      const osc = ctx.createOscillator();
      osc.type = 'sawtooth';
      osc.frequency.value = freq;
      osc.detune.value = cents;
      osc.connect(tone);
      osc.start(t);
      osc.stop(t + dur + .3);
    }
  }

  // ---- drums ----
  private hit(t: number, dur: number, filter: BiquadFilterType, freq: number, q: number, gain: number, freqTo?: number, attack = .004) {
    const ctx = audioContext()!;
    const source = noise();
    const biquad = ctx.createBiquadFilter();
    const amp = ctx.createGain();
    biquad.type = filter;
    biquad.Q.value = q;
    biquad.frequency.setValueAtTime(freq, t);
    if (freqTo) biquad.frequency.exponentialRampToValueAtTime(freqTo, t + dur);
    amp.gain.setValueAtTime(.0001, t);
    amp.gain.exponentialRampToValueAtTime(Math.max(.0002, gain), t + attack);
    amp.gain.exponentialRampToValueAtTime(.0001, t + dur);
    source.connect(biquad).connect(amp);
    this.to(amp, .15);
    source.start(t, rand(0, 1.6));
    source.stop(t + dur + .05);
  }
  private thump(t: number, from: number, to: number, dur: number, gain: number) {
    const ctx = audioContext()!;
    const osc = ctx.createOscillator();
    const amp = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(from, t);
    osc.frequency.exponentialRampToValueAtTime(to, t + dur);
    amp.gain.setValueAtTime(gain, t);
    amp.gain.exponentialRampToValueAtTime(.0001, t + dur);
    osc.connect(amp);
    this.to(amp, .1);
    osc.start(t);
    osc.stop(t + dur + .05);
  }
  private drum(kind: Drum, t: number, level: number) {
    if (kind === 'kick') { this.thump(t, 115, 46, .22, .5 * level); this.hit(t, .012, 'bandpass', 1800, 1, .05 * level); }
    else if (kind === 'snare') { this.hit(t, .17, 'bandpass', 2100, .8, .2 * level); this.thump(t, 200, 150, .09, .12 * level); }
    else if (kind === 'hat') { this.hit(t, .035, 'highpass', 7500, .7, .055 * level); this.hit(t, .02, 'bandpass', 10000, 2, .03 * level); }
    // Brushes: a soft swish that swells in and fades, like a hand sweeping across a snare.
    else if (kind === 'brush') this.hit(t, .16, 'bandpass', 4800, .6, .09 * level, 3200, .05);
    else if (kind === 'shaker') { this.hit(t, .05, 'bandpass', 6200, 1.2, .07 * level, undefined, .012); this.hit(t + .03, .05, 'bandpass', 6800, 1.2, .045 * level, undefined, .01); }
    // Hand drum: a round tone and a slap.
    else { this.thump(t, rand(210, 240), 150, .17, .26 * level); this.hit(t, .025, 'bandpass', 1900, 1.5, .08 * level); }
  }
}

let current: { id: string; track: Track } | undefined;
let wanted = 'velvet';
let unlocked = false;

export function styleForInterior(id: string) { return STYLE_OF_INTERIOR[id] ?? 'lounge'; }

// Start (or crossfade to) the music that fits this bar interior.
export function setMusicInterior(interiorId: string) {
  wanted = interiorId;
  refresh();
}

export function refreshMusic() { refresh(); }

function refresh() {
  const ctx = audioContext();
  const style = styleForInterior(wanted);
  const shouldPlay = unlocked && musicOn.value && !!ctx && ctx.state === 'running';
  if (!shouldPlay) {
    if (current) { current.track.stop(.6); current = undefined; }
    return;
  }
  if (current?.id === style) return;
  current?.track.stop(2.5);
  const track = new Track(STYLES[style]!);
  track.start(2.5);
  current = { id: style, track };
}

export function initMusic() {
  unlockAudio(() => { unlocked = true; refresh(); });
}
