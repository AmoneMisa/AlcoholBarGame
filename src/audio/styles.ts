// The music styles of the bar backgrounds. Pure data (no audio code), so it can be checked without a browser.
// Every background has its own style: tempo, scale, chords, instruments and drums. The music is composed live from
// them (see music.ts), in the spirit of the setting. Nothing here comes from a game's soundtrack: no recordings and no
// melodies, only the sound world (instruments, mood, tempo) that goes with each place.

import { NEXT_GAME_MUSIC_STYLES, NEXT_GAME_MUSIC_GAMES } from './gameThemeExpansion2';

export type Drum = 'kick' | 'snare' | 'hat' | 'brush' | 'shaker' | 'hand' | 'tom';
export type Voice = 'epiano' | 'pad' | 'pluck' | 'vibes' | 'marimba' | 'bell' | 'synth' | 'flute' | 'strings' | 'organ' | 'horn' | 'chip';
export type Comp = 'sustain' | 'charleston' | 'offbeat' | 'arp' | 'none';
export interface Style {
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
const LYDIAN = [0, 2, 4, 6, 7, 9, 11];
const PHRYGIAN = [0, 1, 3, 5, 7, 8, 10];
const HARMONIC_MINOR = [0, 2, 3, 5, 7, 8, 11];
const PHRYGIAN_DOM = [0, 1, 4, 5, 7, 8, 10];
const HIRAJOSHI = [0, 2, 3, 7, 8];
const MAJOR_PENT = [0, 2, 4, 7, 9];
const MINOR_PENT = [0, 3, 5, 7, 10];

export const STYLES: Record<string, Style> = {
  ...NEXT_GAME_MUSIC_STYLES,
  // ---- the first backgrounds ----
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
    melody: { voice: 'epiano', density: .4, octave: 1, decay: .5 }, drums: { kick: 'x.....x...x.....', snare: '....x.......x...', hat: 'x.x.x.x.x.x.x.xo' } },

  // ---- the themed backgrounds that are not a game ----
  underwater: { bpm: 72, swing: 0, root: 60, scale: LYDIAN, lead: MAJOR_PENT, chords: [0, 4, 5, 2], keys: 'pad', comp: 'sustain', bass: 'root', bassVoice: 'sub',
    melody: { voice: 'vibes', density: .35, octave: 1, decay: 2.2 }, drums: { shaker: 'o...o...o...o...' } },
  underground: { bpm: 94, swing: 0, root: 45, scale: DORIAN, lead: MINOR_PENT, chords: [0, 0, 3, 0], keys: 'pluck', comp: 'offbeat', bass: 'pulse', bassVoice: 'upright', drone: true,
    melody: { voice: 'pluck', density: .5, octave: 1, decay: .7 }, drums: { tom: 'x.......x..x....', hand: 'o...o...o...o...' } },
  fairy: { bpm: 92, swing: .08, root: 67, scale: LYDIAN, lead: MAJOR_PENT, chords: [0, 3, 4, 1], keys: 'pluck', comp: 'arp', bass: 'root', bassVoice: 'sub',
    melody: { voice: 'bell', density: .55, octave: 2, decay: 1.6 }, drums: { shaker: 'o.o.o.o.o.o.o.o.' } },
  fairytale: { bpm: 84, swing: .05, root: 60, scale: MAJOR, lead: MAJOR_PENT, chords: [0, 5, 3, 4], keys: 'strings', comp: 'sustain', bass: 'root', bassVoice: 'upright',
    melody: { voice: 'bell', density: .45, octave: 1, decay: 1.4 }, drums: { brush: '..x...x...x...x.' } },

  // ---- one style for every game ----
  // Lineage II: epic fantasy. Strings and a brass-like horn over a low drone, war drums far away.
  'lineage-2': { bpm: 82, swing: 0, root: 50, scale: MINOR, lead: MINOR_PENT, chords: [0, 5, 3, 4], keys: 'strings', comp: 'sustain', bass: 'root', bassVoice: 'sub', drone: true,
    melody: { voice: 'horn', density: .35, octave: 1, decay: 1.2 }, drums: { tom: 'x.......x...x...' } },
  // Perfect World: celestial, Chinese-fantasy. A zither arpeggio and a bamboo flute on a pentatonic scale.
  'perfect-world': { bpm: 78, swing: 0, root: 62, scale: MAJOR_PENT, lead: MAJOR_PENT, chords: [0, 2, 3, 1], keys: 'pluck', comp: 'arp', bass: 'root', bassVoice: 'sub',
    melody: { voice: 'flute', density: .5, octave: 1, decay: 1.2 }, drums: { hand: 'x.......o.......' } },
  // Warcraft III: orchestral war. Harmonic minor, strings, horn calls and a steady war drum.
  'warcraft-3': { bpm: 90, swing: 0, root: 48, scale: HARMONIC_MINOR, lead: MINOR_PENT, chords: [0, 5, 3, 4], keys: 'strings', comp: 'sustain', bass: 'pulse', bassVoice: 'sub',
    melody: { voice: 'horn', density: .4, octave: 1, decay: 1 }, drums: { tom: 'x...x.x.x...x.x.', snare: '....x.......x...' } },
  // Allods Online: Slavic folk fantasy. A strummed gusli, a flute, hand drums and a dance beat.
  allods: { bpm: 102, swing: .06, root: 57, scale: DORIAN, lead: MINOR_PENT, chords: [0, 3, 0, 4], keys: 'pluck', comp: 'offbeat', bass: 'pulse', bassVoice: 'upright',
    melody: { voice: 'flute', density: .55, octave: 1, decay: .9 }, drums: { hand: 'x..x..x...x.x...', shaker: '..x...x...x...x.' } },
  // Lost Ark: a beach club at sunset. Bright mixolydian guitar and marimba over a summer groove.
  'lost-ark': { bpm: 104, swing: .04, root: 62, scale: MIXOLYDIAN, lead: MAJOR_PENT, chords: [0, 4, 3, 0], keys: 'pluck', comp: 'offbeat', bass: 'pulse', bassVoice: 'upright',
    melody: { voice: 'marimba', density: .6, octave: 1, decay: .4 }, drums: { kick: 'x.......x.......', shaker: 'x.xxx.xxx.xxx.xx' } },
  // Mass Effect: the Citadel lounge. Cool sci-fi: a synth arpeggio, a deep drone and a slow pulse.
  'mass-effect': { bpm: 100, swing: 0, root: 52, scale: MINOR, lead: MINOR_PENT, chords: [0, 5, 2, 4], keys: 'synth', comp: 'arp', bass: 'pulse', bassVoice: 'sub', drone: true,
    melody: { voice: 'synth', density: .35, octave: 2, decay: .6 }, drums: { kick: 'x.......x.......', hat: 'o.o.o.o.o.o.o.o.' } },
  // Need for Speed: Most Wanted. A fast, hard electronic chase.
  'nfs-most-wanted': { bpm: 128, swing: 0, root: 43, scale: MINOR, lead: MINOR_PENT, chords: [0, 0, 5, 4], keys: 'synth', comp: 'arp', bass: 'pulse', bassVoice: 'sub',
    melody: { voice: 'synth', density: .5, octave: 2, decay: .25 }, drums: { kick: 'x...x...x...x...', snare: '....x.......x...', hat: 'xoxoxoxoxoxoxoxo' } },
  // Need for Speed: Carbon. Darker night-canyon electronics: phrygian, heavier kick.
  'nfs-carbon': { bpm: 122, swing: 0, root: 41, scale: PHRYGIAN, lead: MINOR_PENT, chords: [0, 1, 0, 5], keys: 'synth', comp: 'arp', bass: 'pulse', bassVoice: 'sub', drone: true,
    melody: { voice: 'synth', density: .4, octave: 2, decay: .3 }, drums: { kick: 'x...x...x..x....', snare: '....x.......x..o', hat: '..x...x...x...x.' } },
  // Need for Speed: Underground. Neon street-tuner: a breakbeat and a bouncing electro bass.
  'nfs-underground': { bpm: 112, swing: .1, root: 45, scale: MINOR, lead: MINOR_PENT, chords: [0, 3, 0, 4], keys: 'synth', comp: 'arp', bass: 'pulse', bassVoice: 'sub',
    melody: { voice: 'synth', density: .45, octave: 2, decay: .3 }, drums: { kick: 'x.....x...x.....', snare: '....x.......x...', hat: 'x.x.x.x.x.x.x.xo' } },
  // The Witcher 3: Slavic folk. A lute, a wooden flute and a hand drum over a drone, in the dorian mode.
  'witcher-3': { bpm: 96, swing: .05, root: 50, scale: DORIAN, lead: MINOR_PENT, chords: [0, 6, 3, 0], keys: 'pluck', comp: 'arp', bass: 'root', bassVoice: 'upright', drone: true,
    melody: { voice: 'flute', density: .5, octave: 1, decay: 1 }, drums: { hand: 'x..x..o.x..x.o..', tom: 'x.......o.......' } },
  // Heroes of Might and Magic III: a castle inn. A pipe organ, bells and brushed drums in a bright major key.
  'heroes-3': { bpm: 88, swing: .04, root: 53, scale: MAJOR, lead: MAJOR_PENT, chords: [0, 4, 5, 3], keys: 'organ', comp: 'sustain', bass: 'walk', bassVoice: 'upright',
    melody: { voice: 'bell', density: .5, octave: 1, decay: 1.3 }, drums: { brush: '..x...x...x...x.' } },
  // Elden Ring: a lonely, solemn tavern at the end of the world. Slow strings, a deep drone, sparse bells.
  'elden-ring': { bpm: 62, swing: 0, root: 45, scale: PHRYGIAN, lead: MINOR_PENT, chords: [0, 5, 2, 4], keys: 'strings', comp: 'sustain', bass: 'root', bassVoice: 'sub', drone: true,
    melody: { voice: 'bell', density: .25, octave: 2, decay: 2.6 }, drums: { tom: 'x...............' } },
  // Minecraft: calm, spare piano. Long notes, lots of air and no drums.
  minecraft: { bpm: 70, swing: 0, root: 60, scale: MAJOR, lead: MAJOR_PENT, chords: [0, 5, 3, 4], keys: 'epiano', comp: 'arp', bass: 'root', bassVoice: 'upright',
    melody: { voice: 'epiano', density: .3, octave: 1, decay: 1.4 }, drums: {} },
  // Skyrim: the Nordic mead hall. A low drone, a horn, a deep war drum and a folk melody.
  skyrim: { bpm: 84, swing: 0, root: 45, scale: DORIAN, lead: MINOR_PENT, chords: [0, 0, 6, 5], keys: 'strings', comp: 'sustain', bass: 'root', bassVoice: 'sub', drone: true,
    melody: { voice: 'horn', density: .3, octave: 1, decay: 1.2 }, drums: { tom: 'x.......x.x.....' } },
  // Cyberpunk 2077: Night City synthwave. A neon arpeggio, a heavy pulse and a hard four-on-the-floor.
  'cyberpunk-2077': { bpm: 118, swing: 0, root: 40, scale: MINOR, lead: MINOR_PENT, chords: [0, 5, 0, 4], keys: 'synth', comp: 'arp', bass: 'pulse', bassVoice: 'sub', drone: true,
    melody: { voice: 'synth', density: .45, octave: 2, decay: .3 }, drums: { kick: 'x...x...x...x...', snare: '....x.......x...', hat: 'xoxoxoxoxoxoxoxo' } },
  // Counter-Strike 2: a tactical clubhouse. Dry boom-bap, electric piano stabs and a tense chip-tune line.
  'cs-2': { bpm: 92, swing: .1, root: 43, scale: MINOR, lead: MINOR_PENT, chords: [0, 0, 3, 5], keys: 'epiano', comp: 'charleston', bass: 'pulse', bassVoice: 'upright',
    melody: { voice: 'chip', density: .3, octave: 1, decay: .4 }, drums: { kick: 'x.....x...x.....', snare: '....x.......x...', hat: 'x.x.x.x.x.x.x.x.' } },
  // Assassin's Creed: a Venetian hidden tavern. A plucked lute, a flute and a hand drum in a Renaissance minor.
  'assassins-creed': { bpm: 96, swing: .02, root: 52, scale: PHRYGIAN_DOM, lead: PHRYGIAN_DOM, chords: [0, 0, 1, 0], keys: 'pluck', comp: 'arp', bass: 'root', bassVoice: 'upright',
    melody: { voice: 'flute', density: .45, octave: 1, decay: .8 }, drums: { hand: 'x..x..o.x..x.o..', shaker: '..x...x...x...x.' } },
  // Watch Dogs: a Chicago hacker bar. Glitchy electronics, a chip-tune lead and a busy hi-hat.
  'watch-dogs': { bpm: 104, swing: 0, root: 47, scale: MINOR, lead: MINOR_PENT, chords: [0, 0, 5, 3], keys: 'synth', comp: 'arp', bass: 'pulse', bassVoice: 'sub',
    melody: { voice: 'chip', density: .55, octave: 2, decay: .2 }, drums: { kick: 'x..x..x...x.....', snare: '....x.......x...', hat: 'xxoxxxoxxxoxxxox' } },
  // Sleeping Dogs: a Hong Kong night bar. A plucked zither on a pentatonic scale over a neon hip-hop beat.
  'sleeping-dogs': { bpm: 98, swing: .05, root: 57, scale: MAJOR_PENT, lead: HIRAJOSHI, chords: [0, 2, 1, 3], keys: 'pluck', comp: 'arp', bass: 'pulse', bassVoice: 'sub',
    melody: { voice: 'pluck', density: .5, octave: 1, decay: .9 }, drums: { kick: 'x.......x.o.....', snare: '....x.......x...', hand: 'o...o...o...o...' } },
  // Detroit: Become Human: an android lounge. A melancholy electric piano and a slow, quiet pulse.
  detroit: { bpm: 76, swing: 0, root: 57, scale: MINOR, lead: MINOR_PENT, chords: [0, 5, 3, 4], keys: 'epiano', comp: 'sustain', bass: 'root', bassVoice: 'sub',
    melody: { voice: 'epiano', density: .35, octave: 1, decay: 1.3 }, drums: { kick: 'x...............', hat: 'o.......o.......' } },
  // Neighbours from Hell: a prankster pub. Bouncy, cartoonish: marimba, plucked bass and a skipping beat.
  'neighbours-from-hell': { bpm: 126, swing: .12, root: 60, scale: MAJOR, lead: MAJOR_PENT, chords: [0, 3, 4, 0], keys: 'pluck', comp: 'offbeat', bass: 'walk', bassVoice: 'upright',
    melody: { voice: 'marimba', density: .7, octave: 1, decay: .35 }, drums: { shaker: 'x.x.x.x.x.x.x.x.', hand: 'x...o...x...o...' } },
  // Grand Theft Auto, Vice City: an eighties beach bar. Warm synth and electric piano over a pop groove.
  gta: { bpm: 108, swing: 0, root: 55, scale: DORIAN, lead: MINOR_PENT, chords: [0, 3, 1, 4], keys: 'epiano', comp: 'charleston', bass: 'pulse', bassVoice: 'sub',
    melody: { voice: 'synth', density: .5, octave: 2, decay: .35 }, drums: { kick: 'x...x...x...x...', snare: '....x.......x...', hat: 'o.o.o.o.o.o.o.o.' } },
  // Stellar Blade: the Xion lounge. Cinematic sci-fi: strings, piano and a deep, slow kick.
  'stellar-blade': { bpm: 90, swing: 0, root: 50, scale: MINOR, lead: MINOR_PENT, chords: [0, 5, 3, 4], keys: 'strings', comp: 'sustain', bass: 'root', bassVoice: 'sub',
    melody: { voice: 'epiano', density: .4, octave: 1, decay: 1.2 }, drums: { kick: 'x.......x.......', tom: 'o.......o.....x.', hat: 'o.o.o.o.o.o.o.o.' } },
  // R.E.P.O.: a salvage depot. Industrial and uneasy: a low drone, a sparse chip-tune line and a clanking hat.
  repo: { bpm: 84, swing: 0, root: 38, scale: MINOR, lead: MINOR_PENT, chords: [0, 0, 5, 0], keys: 'pad', comp: 'sustain', bass: 'root', bassVoice: 'sub', drone: true,
    melody: { voice: 'chip', density: .2, octave: 1, decay: .6 }, drums: { hat: 'o...o...o...o...', tom: 'x...............' } },
  // Among Us: the Skeld cafeteria. Minimal and suspicious: a synth pulse, a chip-tune blip and a light hat.
  'among-us': { bpm: 100, swing: 0, root: 52, scale: MINOR, lead: MINOR_PENT, chords: [0, 0, 5, 0], keys: 'synth', comp: 'arp', bass: 'pulse', bassVoice: 'sub',
    melody: { voice: 'chip', density: .45, octave: 2, decay: .15 }, drums: { hat: 'x.x.x.x.x.x.x.x.', kick: 'x.......x.......' } },
  // Borderlands: the Pandora saloon. Western rock: a twangy guitar, a stomping beat and a mixolydian riff.
  borderlands: { bpm: 112, swing: .08, root: 52, scale: MIXOLYDIAN, lead: MINOR_PENT, chords: [0, 3, 0, 4], keys: 'pluck', comp: 'offbeat', bass: 'pulse', bassVoice: 'upright',
    melody: { voice: 'pluck', density: .5, octave: 1, decay: .7 }, drums: { kick: 'x...x...x...x...', snare: '....x.......x...', hat: 'o.o.o.o.o.o.o.o.' } }
};

// Which style each background uses, and which game (if any) it belongs to. Every background has an entry.
export const STYLE_OF_INTERIOR: Record<string, keyof typeof STYLES> = {
  ...Object.fromEntries(Object.keys(NEXT_GAME_MUSIC_STYLES).map(id => [id, id])),
  velvet: 'lounge', skyline: 'lounge', 'inferno-penthouse': 'lounge',
  speakeasy: 'jazz', 'jazz-cellar': 'jazz', 'art-deco': 'jazz', parisian: 'jazz', library: 'library',
  garden: 'ocean', tropical: 'tropical', beach: 'tropical', marina: 'ocean',
  desert: 'desert', riad: 'desert', izakaya: 'izakaya',
  winter: 'winter', palace: 'palace', cyberpunk: 'cyber', rooftop: 'cyber', loft: 'loft',
  underwater: 'underwater', underground: 'underground', fairy: 'fairy', fairytale: 'fairytale',
  'lineage-2': 'lineage-2', 'perfect-world': 'perfect-world', 'warcraft-3': 'warcraft-3', allods: 'allods', 'lost-ark': 'lost-ark', 'mass-effect': 'mass-effect',
  'nfs-most-wanted': 'nfs-most-wanted', 'nfs-carbon': 'nfs-carbon', 'nfs-underground': 'nfs-underground',
  'witcher-3': 'witcher-3', 'heroes-3': 'heroes-3', 'elden-ring': 'elden-ring', minecraft: 'minecraft', skyrim: 'skyrim', 'cyberpunk-2077': 'cyberpunk-2077',
  'cs-2': 'cs-2', 'assassins-creed': 'assassins-creed', 'watch-dogs': 'watch-dogs', 'sleeping-dogs': 'sleeping-dogs', detroit: 'detroit',
  'neighbours-from-hell': 'neighbours-from-hell', gta: 'gta', 'stellar-blade': 'stellar-blade', repo: 'repo', 'among-us': 'among-us', borderlands: 'borderlands'
};

export const styleForInterior = (id: string) => STYLE_OF_INTERIOR[id] ?? 'lounge';

// The game each background comes from (the sound of its style is matched to that game's world). The backgrounds that
// are not a game (the reef, the cave, the fairy places) are not listed.
export const GAME_OF_INTERIOR: Record<string, string> = {
  ...NEXT_GAME_MUSIC_GAMES,
  'lineage-2': 'Lineage II', 'perfect-world': 'Perfect World', 'warcraft-3': 'Warcraft III', allods: 'Allods Online', 'lost-ark': 'Lost Ark',
  'mass-effect': 'Mass Effect', 'nfs-most-wanted': 'Need for Speed: Most Wanted', 'nfs-carbon': 'Need for Speed: Carbon', 'nfs-underground': 'Need for Speed: Underground',
  'witcher-3': 'The Witcher 3', 'heroes-3': 'Heroes of Might and Magic III', 'elden-ring': 'Elden Ring', minecraft: 'Minecraft', skyrim: 'Skyrim',
  'cyberpunk-2077': 'Cyberpunk 2077', 'cs-2': 'Counter-Strike 2', 'assassins-creed': 'Assassin’s Creed', 'watch-dogs': 'Watch Dogs', 'sleeping-dogs': 'Sleeping Dogs',
  detroit: 'Detroit: Become Human', 'neighbours-from-hell': 'Neighbours from Hell', gta: 'Grand Theft Auto', 'stellar-blade': 'Stellar Blade', repo: 'R.E.P.O.',
  'among-us': 'Among Us', borderlands: 'Borderlands'
};
