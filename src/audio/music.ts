// Generative background music. Every bar interior gets a style (tempo, scale, chords, instruments and drums)
// that matches its painting; the notes are composed live so the music never loops the same way twice.
import { audioContext, musicDestination, musicOn, unlockAudio } from './engine';

type Drum = 'kick' | 'snare' | 'hat' | 'brush' | 'shaker' | 'hand';
interface Style {
  bpm: number;
  swing: number;                     // 0 = straight, .3 = jazzy
  root: number;                      // MIDI note of the key
  scale: number[];                   // 7-note scale used for chords and bass
  lead: number[];                    // scale used for the melody
  chords: number[];                  // chord root (scale degree) for each bar
  pad: OscillatorType;
  bass: 'walk' | 'root' | 'pulse' | 'none';
  bassWave: OscillatorType;
  melody: { wave: OscillatorType | 'bell'; density: number; octave: number; decay: number };
  arp?: OscillatorType;
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
  lounge: { bpm: 76, swing: .1, root: 57, scale: DORIAN, lead: MINOR_PENT, chords: [0, 3, 1, 4], pad: 'triangle', bass: 'root', bassWave: 'sine',
    melody: { wave: 'triangle', density: .22, octave: 1, decay: .9 }, drums: { kick: 'x.......x.o.....', brush: '..x...x...x...x.', hat: 'o.o.o.o.o.o.o.o.' } },
  jazz: { bpm: 104, swing: .32, root: 55, scale: DORIAN, lead: MINOR_PENT, chords: [1, 4, 0, 0], pad: 'sine', bass: 'walk', bassWave: 'triangle',
    melody: { wave: 'triangle', density: .32, octave: 1, decay: .6 }, drums: { brush: 'x.x.x.x.x.x.x.x.', hat: '..o...o...o...o.', kick: 'o.......o.......' } },
  library: { bpm: 66, swing: .18, root: 53, scale: MAJOR, lead: MAJOR_PENT, chords: [0, 5, 3, 4], pad: 'sine', bass: 'root', bassWave: 'sine',
    melody: { wave: 'triangle', density: .14, octave: 1, decay: 1.4 }, drums: {} },
  tropical: { bpm: 102, swing: 0, root: 60, scale: MIXOLYDIAN, lead: MAJOR_PENT, chords: [0, 3, 4, 3], pad: 'triangle', bass: 'pulse', bassWave: 'sine',
    melody: { wave: 'triangle', density: .42, octave: 1, decay: .35 }, drums: { shaker: 'x.xxx.xxx.xxx.xx', hand: 'x..o..x...o.x...' } },
  ocean: { bpm: 84, swing: .05, root: 62, scale: MAJOR, lead: MAJOR_PENT, chords: [0, 4, 5, 3], pad: 'triangle', bass: 'root', bassWave: 'sine',
    melody: { wave: 'bell', density: .24, octave: 1, decay: 1.6 }, arp: 'sine', drums: { shaker: 'o.o.o.o.o.o.o.o.', kick: 'x.......x.......' } },
  desert: { bpm: 92, swing: 0, root: 50, scale: PHRYGIAN_DOM, lead: PHRYGIAN_DOM, chords: [0, 0, 1, 0], pad: 'sawtooth', bass: 'pulse', bassWave: 'triangle', drone: true,
    melody: { wave: 'triangle', density: .36, octave: 1, decay: .5 }, drums: { hand: 'x..x..o.x..x.o..', shaker: '..x...x...x...x.' } },
  izakaya: { bpm: 78, swing: 0, root: 57, scale: MINOR, lead: HIRAJOSHI, chords: [0, 5, 3, 0], pad: 'sine', bass: 'root', bassWave: 'sine',
    melody: { wave: 'triangle', density: .2, octave: 1, decay: 1.1 }, drone: true, drums: { hand: 'x.......o.......' } },
  winter: { bpm: 70, swing: 0, root: 64, scale: MAJOR, lead: MAJOR_PENT, chords: [0, 4, 5, 2], pad: 'sine', bass: 'root', bassWave: 'sine',
    melody: { wave: 'bell', density: .2, octave: 2, decay: 2 }, arp: 'sine', drums: {} },
  palace: { bpm: 88, swing: .05, root: 60, scale: MAJOR, lead: MAJOR_PENT, chords: [0, 3, 4, 0], pad: 'triangle', bass: 'walk', bassWave: 'sine',
    melody: { wave: 'bell', density: .3, octave: 1, decay: 1.3 }, arp: 'triangle', drums: { brush: '..x...x...x...x.', kick: 'x.......x.......' } },
  cyber: { bpm: 112, swing: 0, root: 45, scale: MINOR, lead: MINOR_PENT, chords: [0, 0, 5, 4], pad: 'sawtooth', bass: 'pulse', bassWave: 'sawtooth',
    melody: { wave: 'square', density: .25, octave: 2, decay: .3 }, arp: 'square', drums: { kick: 'x...x...x...x...', snare: '....x.......x...', hat: 'xoxoxoxoxoxoxoxo' } },
  loft: { bpm: 96, swing: .12, root: 52, scale: DORIAN, lead: MINOR_PENT, chords: [0, 3, 0, 4], pad: 'triangle', bass: 'pulse', bassWave: 'triangle',
    melody: { wave: 'triangle', density: .2, octave: 1, decay: .5 }, drums: { kick: 'x.....x...x.....', snare: '....x.......x...', hat: 'x.x.x.x.x.x.x.xo' } }
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

class Track {
  readonly out: GainNode;
  private timer?: ReturnType<typeof setInterval>;
  private next = 0;
  private step = 0;
  private bar = 0;
  private lastLead = 2;
  constructor(private readonly style: Style) {
    const ctx = audioContext()!;
    this.out = ctx.createGain();
    this.out.gain.value = 0;
    this.out.connect(musicDestination()!);
  }
  start(fade = 2.5) {
    const ctx = audioContext()!;
    this.next = ctx.currentTime + .1;
    this.out.gain.setTargetAtTime(1, ctx.currentTime, fade / 3);
    this.timer = setInterval(() => this.schedule(), 100);
    this.schedule();
  }
  stop(fade = 2.5) {
    const ctx = audioContext()!;
    clearInterval(this.timer);
    this.out.gain.setTargetAtTime(0, ctx.currentTime, fade / 3);
    setTimeout(() => this.out.disconnect(), fade * 1500);
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
  private play(step: number, t: number, len: number) {
    const s = this.style;
    const chordDegree = s.chords[this.bar % s.chords.length];
    const chord = [0, 2, 4, 6].map((offset) => degree(s.scale, s.root, chordDegree + offset));
    if (step === 0) this.padChord(chord, t, len * 16);
    if (step === 0 && s.drone) this.note(midi(s.root - 12), t, len * 16, 'sawtooth', .05, 1.5, 300);
    this.bassLine(step, t, len, chordDegree);
    if (s.arp && step % 2 === 0) this.note(midi(chord[(step / 2) % 4] + 12), t, len * 2.5, s.arp, .05, .02, 2600, 1);
    if (Math.random() < s.melody.density * (step % 2 === 0 ? 1 : .35) && (step % 4 !== 0 || Math.random() < .7)) this.lead(t);
    for (const [drum, pattern] of Object.entries(s.drums)) {
      const hit = pattern?.[step];
      if (hit === 'x' || hit === 'o') this.drum(drum as Drum, t, hit === 'x' ? 1 : .45);
    }
  }
  private padChord(chord: number[], t: number, dur: number) {
    for (const n of chord.slice(0, 3)) this.note(midi(n), t, dur, this.style.pad, .045, .6, 1400, 1.4, dur * .25);
  }
  private bassLine(step: number, t: number, len: number, d: number) {
    const s = this.style;
    const root = degree(s.scale, s.root - 24, d);
    const beat = step % 4 === 0;
    if (s.bass === 'root' && (step === 0 || step === 10)) this.note(midi(root), t, len * 6, s.bassWave, .3, .02, 400);
    else if (s.bass === 'walk' && beat) {
      const walk = [0, 2, 4, 1][(step / 4) % 4];
      this.note(midi(degree(s.scale, s.root - 24, d + walk)), t, len * 3.6, s.bassWave, .3, .02, 500);
    } else if (s.bass === 'pulse' && step % 2 === 0) {
      const note = step % 8 === 6 ? root + 12 : step % 8 === 4 ? root + 7 : root;
      this.note(midi(note), t, len * 1.6, s.bassWave, .22, .01, 600);
    }
  }
  private lead(t: number) {
    const m = this.style.melody;
    const scale = this.style.lead;
    this.lastLead = Math.max(-2, Math.min(scale.length + 2, this.lastLead + [-2, -1, -1, 0, 1, 1, 2][Math.floor(Math.random() * 7)]));
    const note = degree(scale, this.style.root + 12 * m.octave, this.lastLead);
    if (m.wave === 'bell') {
      this.note(midi(note), t, m.decay, 'sine', .11, .005, 5000, 1, m.decay);
      this.note(midi(note) * 2.76, t, m.decay * .4, 'sine', .03, .005, 6000, 1, m.decay * .4);
    } else this.note(midi(note), t, m.decay, m.wave, m.wave === 'square' ? .06 : .13, .01, m.wave === 'triangle' ? 3000 : 2200, 1, m.decay);
  }
  // Basic voice: oscillator (optionally two detuned) -> lowpass -> envelope.
  private note(freq: number, t: number, dur: number, wave: OscillatorType, gain: number, attack: number, cutoff: number, detune = 1, release = .3) {
    const ctx = audioContext()!;
    const amp = ctx.createGain();
    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = cutoff;
    amp.gain.setValueAtTime(.0001, t);
    amp.gain.exponentialRampToValueAtTime(gain, t + Math.max(attack, .005));
    amp.gain.setValueAtTime(gain, t + Math.max(attack, dur * .4));
    amp.gain.exponentialRampToValueAtTime(.0001, t + dur + release);
    filter.connect(amp).connect(this.out);
    const voices = detune > 1 ? 2 : 1;
    for (let i = 0; i < voices; i++) {
      const osc = ctx.createOscillator();
      osc.type = wave;
      osc.frequency.value = freq;
      if (voices > 1) osc.detune.value = i ? 7 : -7;
      osc.connect(filter);
      osc.start(t);
      osc.stop(t + dur + release + .05);
    }
  }
  private drum(kind: Drum, t: number, level: number) {
    const ctx = audioContext()!;
    const amp = ctx.createGain();
    amp.connect(this.out);
    const env = (dur: number, peak: number) => {
      amp.gain.setValueAtTime(peak * level, t);
      amp.gain.exponentialRampToValueAtTime(.0001, t + dur);
    };
    const hiss = (type: BiquadFilterType, freq: number, dur: number) => {
      const source = ctx.createBufferSource();
      const bufferLength = Math.ceil(ctx.sampleRate * (dur + .05));
      const buffer = ctx.createBuffer(1, bufferLength, ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferLength; i++) data[i] = Math.random() * 2 - 1;
      source.buffer = buffer;
      const filter = ctx.createBiquadFilter();
      filter.type = type;
      filter.frequency.value = freq;
      source.connect(filter).connect(amp);
      source.start(t);
    };
    const thump = (from: number, to: number, dur: number, wave: OscillatorType = 'sine') => {
      const osc = ctx.createOscillator();
      osc.type = wave;
      osc.frequency.setValueAtTime(from, t);
      osc.frequency.exponentialRampToValueAtTime(to, t + dur);
      osc.connect(amp);
      osc.start(t);
      osc.stop(t + dur + .05);
    };
    if (kind === 'kick') { env(.28, .55); thump(130, 42, .25); }
    else if (kind === 'snare') { env(.16, .22); hiss('bandpass', 1800, .16); thump(200, 120, .08, 'triangle'); }
    else if (kind === 'hat') { env(.05, .1); hiss('highpass', 7000, .05); }
    else if (kind === 'brush') { env(.13, .09); hiss('highpass', 3500, .13); }
    else if (kind === 'shaker') { env(.07, .09); hiss('bandpass', 6500, .07); }
    else { env(.2, .3); thump(240, 110, .18, 'triangle'); }
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
  const track = new Track(STYLES[style]);
  track.start(2.5);
  current = { id: style, track };
}

export function initMusic() {
  unlockAudio(() => { unlocked = true; refresh(); });
}
