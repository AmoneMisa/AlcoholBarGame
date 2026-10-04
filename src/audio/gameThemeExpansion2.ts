// Original procedural music settings for the second game collection; no soundtrack recordings or melodies.
import type { Style } from './styles';

export const NEXT_GAME_MUSIC_STYLES: Record<string, Style> = {
  "harry-potter": {
    "bpm": 79,
    "swing": 0,
    "root": 62,
    "scale": [
      0,
      2,
      3,
      5,
      7,
      8,
      11
    ],
    "lead": [
      0,
      3,
      5,
      7,
      10
    ],
    "chords": [
      0,
      5,
      3,
      4
    ],
    "keys": "strings",
    "comp": "arp",
    "bass": "root",
    "bassVoice": "upright",
    "melody": {
      "voice": "bell",
      "density": 0.3,
      "octave": 2,
      "decay": 1.5
    },
    "drums": {}
  },
  "gta-5": {
    "bpm": 103,
    "swing": 0,
    "root": 54,
    "scale": [
      0,
      2,
      3,
      5,
      7,
      9,
      10
    ],
    "lead": [
      0,
      3,
      5,
      7,
      10
    ],
    "chords": [
      0,
      5,
      3,
      4
    ],
    "keys": "epiano",
    "comp": "charleston",
    "bass": "pulse",
    "bassVoice": "sub",
    "melody": {
      "voice": "synth",
      "density": 0.5,
      "octave": 1,
      "decay": 0.7
    },
    "drums": {
      "kick": "x.....x...x.....",
      "snare": "....x.......x...",
      "hat": "x.x.x.x.x.x.x.x."
    }
  },
  "gta-sa": {
    "bpm": 97,
    "swing": 0,
    "root": 46,
    "scale": [
      0,
      2,
      3,
      5,
      7,
      9,
      10
    ],
    "lead": [
      0,
      3,
      5,
      7,
      10
    ],
    "chords": [
      0,
      5,
      3,
      4
    ],
    "keys": "epiano",
    "comp": "offbeat",
    "bass": "pulse",
    "bassVoice": "sub",
    "melody": {
      "voice": "pluck",
      "density": 0.5,
      "octave": 1,
      "decay": 0.7
    },
    "drums": {
      "kick": "x..x....x.o.....",
      "snare": "....x.......x...",
      "hat": "xoxoxoxoxoxoxoxo"
    }
  },
  "gta-3": {
    "bpm": 88,
    "swing": 0,
    "root": 44,
    "scale": [
      0,
      2,
      3,
      5,
      7,
      8,
      10
    ],
    "lead": [
      0,
      3,
      5,
      7,
      10
    ],
    "chords": [
      0,
      5,
      3,
      4
    ],
    "keys": "pad",
    "comp": "sustain",
    "bass": "pulse",
    "bassVoice": "sub",
    "melody": {
      "voice": "epiano",
      "density": 0.5,
      "octave": 1,
      "decay": 0.7
    },
    "drums": {
      "kick": "x.......x.o.....",
      "snare": "....x.......x...",
      "hat": "o.o.o.o.o.o.o.o."
    }
  },
  "control": {
    "bpm": 81,
    "swing": 0,
    "root": 39,
    "scale": [
      0,
      2,
      3,
      5,
      7,
      8,
      10
    ],
    "lead": [
      0,
      3,
      5,
      7,
      10
    ],
    "chords": [
      0,
      5,
      3,
      4
    ],
    "keys": "pad",
    "comp": "sustain",
    "bass": "root",
    "bassVoice": "sub",
    "melody": {
      "voice": "synth",
      "density": 0.5,
      "octave": 1,
      "decay": 0.7
    },
    "drums": {
      "tom": "x.......o.....x.",
      "hat": "o...o...o...o..."
    }
  },
  "alan-wake": {
    "bpm": 65,
    "swing": 0,
    "root": 51,
    "scale": [
      0,
      2,
      3,
      5,
      7,
      8,
      10
    ],
    "lead": [
      0,
      3,
      5,
      7,
      10
    ],
    "chords": [
      0,
      5,
      3,
      4
    ],
    "keys": "epiano",
    "comp": "sustain",
    "bass": "root",
    "bassVoice": "upright",
    "melody": {
      "voice": "strings",
      "density": 0.3,
      "octave": 1,
      "decay": 1.5
    },
    "drums": {}
  },
  "quantum-break": {
    "bpm": 105,
    "swing": 0,
    "root": 49,
    "scale": [
      0,
      2,
      3,
      5,
      7,
      9,
      10
    ],
    "lead": [
      0,
      3,
      5,
      7,
      10
    ],
    "chords": [
      0,
      5,
      3,
      4
    ],
    "keys": "synth",
    "comp": "arp",
    "bass": "pulse",
    "bassVoice": "sub",
    "melody": {
      "voice": "bell",
      "density": 0.5,
      "octave": 2,
      "decay": 0.7
    },
    "drums": {
      "kick": "x...o...x.......",
      "hat": "o.o.x.o.o.o.x.o."
    }
  },
  "max-payne": {
    "bpm": 73,
    "swing": 0.14,
    "root": 47,
    "scale": [
      0,
      2,
      3,
      5,
      7,
      8,
      10
    ],
    "lead": [
      0,
      3,
      5,
      7,
      10
    ],
    "chords": [
      0,
      5,
      3,
      4
    ],
    "keys": "epiano",
    "comp": "charleston",
    "bass": "walk",
    "bassVoice": "upright",
    "melody": {
      "voice": "vibes",
      "density": 0.3,
      "octave": 1,
      "decay": 1.5
    },
    "drums": {
      "brush": "..x...x...x...x.",
      "kick": "o.......o......."
    }
  },
  "resident-evil": {
    "bpm": 69,
    "swing": 0,
    "root": 42,
    "scale": [
      0,
      2,
      3,
      5,
      7,
      8,
      11
    ],
    "lead": [
      0,
      3,
      5,
      7,
      10
    ],
    "chords": [
      0,
      5,
      3,
      4
    ],
    "keys": "strings",
    "comp": "sustain",
    "bass": "root",
    "bassVoice": "upright",
    "melody": {
      "voice": "epiano",
      "density": 0.3,
      "octave": 1,
      "decay": 1.5
    },
    "drums": {
      "tom": "x...........o..."
    }
  },
  "silent-hill": {
    "bpm": 61,
    "swing": 0,
    "root": 41,
    "scale": [
      0,
      1,
      3,
      5,
      7,
      8,
      10
    ],
    "lead": [
      0,
      3,
      5,
      7,
      10
    ],
    "chords": [
      0,
      5,
      3,
      4
    ],
    "keys": "pad",
    "comp": "sustain",
    "bass": "none",
    "bassVoice": "sub",
    "melody": {
      "voice": "bell",
      "density": 0.3,
      "octave": 2,
      "decay": 1.5
    },
    "drums": {}
  },
  "batman": {
    "bpm": 77,
    "swing": 0,
    "root": 48,
    "scale": [
      0,
      2,
      3,
      5,
      7,
      8,
      10
    ],
    "lead": [
      0,
      3,
      5,
      7,
      10
    ],
    "chords": [
      0,
      5,
      3,
      4
    ],
    "keys": "strings",
    "comp": "sustain",
    "bass": "pulse",
    "bassVoice": "sub",
    "melody": {
      "voice": "horn",
      "density": 0.3,
      "octave": 1,
      "decay": 1.5
    },
    "drums": {
      "tom": "x.......x...o..."
    }
  },
  "baldurs-gate-3": {
    "bpm": 86,
    "swing": 0,
    "root": 59,
    "scale": [
      0,
      2,
      3,
      5,
      7,
      9,
      10
    ],
    "lead": [
      0,
      3,
      5,
      7,
      10
    ],
    "chords": [
      0,
      5,
      3,
      4
    ],
    "keys": "strings",
    "comp": "sustain",
    "bass": "root",
    "bassVoice": "upright",
    "melody": {
      "voice": "flute",
      "density": 0.5,
      "octave": 1,
      "decay": 0.7
    },
    "drums": {
      "hand": "x.......o...o..."
    }
  },
  "divinity-original-sin-2": {
    "bpm": 91,
    "swing": 0,
    "root": 61,
    "scale": [
      0,
      2,
      4,
      5,
      7,
      9,
      11
    ],
    "lead": [
      0,
      2,
      4,
      7,
      9
    ],
    "chords": [
      0,
      3,
      4,
      1
    ],
    "keys": "pluck",
    "comp": "arp",
    "bass": "root",
    "bassVoice": "upright",
    "melody": {
      "voice": "flute",
      "density": 0.5,
      "octave": 1,
      "decay": 0.7
    },
    "drums": {
      "hand": "x...o...x...o...",
      "shaker": "o.o.o.o.o.o.o.o."
    }
  },
  "diablo-4": {
    "bpm": 71,
    "swing": 0,
    "root": 36,
    "scale": [
      0,
      2,
      3,
      5,
      7,
      8,
      11
    ],
    "lead": [
      0,
      3,
      5,
      7,
      10
    ],
    "chords": [
      0,
      5,
      3,
      4
    ],
    "keys": "organ",
    "comp": "sustain",
    "bass": "root",
    "bassVoice": "upright",
    "melody": {
      "voice": "horn",
      "density": 0.3,
      "octave": 1,
      "decay": 1.5
    },
    "drums": {
      "tom": "x...o...x......."
    }
  },
  "black-desert": {
    "bpm": 93,
    "swing": 0,
    "root": 63,
    "scale": [
      0,
      2,
      3,
      5,
      7,
      8,
      10
    ],
    "lead": [
      0,
      3,
      5,
      7,
      10
    ],
    "chords": [
      0,
      5,
      3,
      4
    ],
    "keys": "strings",
    "comp": "arp",
    "bass": "root",
    "bassVoice": "upright",
    "melody": {
      "voice": "pluck",
      "density": 0.5,
      "octave": 1,
      "decay": 0.7
    },
    "drums": {
      "hand": "x..o....x..o...."
    }
  },
  "darksiders-3": {
    "bpm": 113,
    "swing": 0,
    "root": 38,
    "scale": [
      0,
      2,
      3,
      5,
      7,
      8,
      10
    ],
    "lead": [
      0,
      3,
      5,
      7,
      10
    ],
    "chords": [
      0,
      5,
      3,
      4
    ],
    "keys": "organ",
    "comp": "offbeat",
    "bass": "pulse",
    "bassVoice": "sub",
    "melody": {
      "voice": "synth",
      "density": 0.5,
      "octave": 1,
      "decay": 0.7
    },
    "drums": {
      "kick": "x...x...x...x...",
      "tom": "x.....x...x...x."
    }
  },
  "death-stranding": {
    "bpm": 63,
    "swing": 0,
    "root": 56,
    "scale": [
      0,
      2,
      3,
      5,
      7,
      9,
      10
    ],
    "lead": [
      0,
      3,
      5,
      7,
      10
    ],
    "chords": [
      0,
      5,
      3,
      4
    ],
    "keys": "pad",
    "comp": "sustain",
    "bass": "none",
    "bassVoice": "sub",
    "melody": {
      "voice": "epiano",
      "density": 0.3,
      "octave": 1,
      "decay": 1.5
    },
    "drums": {}
  },
  "devil-may-cry": {
    "bpm": 129,
    "swing": 0,
    "root": 40,
    "scale": [
      0,
      2,
      3,
      5,
      7,
      8,
      10
    ],
    "lead": [
      0,
      3,
      5,
      7,
      10
    ],
    "chords": [
      0,
      5,
      3,
      4
    ],
    "keys": "synth",
    "comp": "offbeat",
    "bass": "pulse",
    "bassVoice": "sub",
    "melody": {
      "voice": "organ",
      "density": 0.5,
      "octave": 1,
      "decay": 0.7
    },
    "drums": {
      "kick": "x...x.x.x...x.x.",
      "snare": "....x.......x...",
      "hat": "xoxoxoxoxoxoxoxo"
    }
  },
  "palworld": {
    "bpm": 99,
    "swing": 0,
    "root": 65,
    "scale": [
      0,
      2,
      4,
      5,
      7,
      9,
      11
    ],
    "lead": [
      0,
      2,
      4,
      7,
      9
    ],
    "chords": [
      0,
      3,
      4,
      1
    ],
    "keys": "pluck",
    "comp": "arp",
    "bass": "root",
    "bassVoice": "upright",
    "melody": {
      "voice": "marimba",
      "density": 0.5,
      "octave": 1,
      "decay": 0.7
    },
    "drums": {
      "shaker": "o.o.o.o.o.o.o.o.",
      "hand": "x.......o...x..."
    }
  },
  "shadow-tomb-raider": {
    "bpm": 95,
    "swing": 0,
    "root": 53,
    "scale": [
      0,
      2,
      3,
      5,
      7,
      9,
      10
    ],
    "lead": [
      0,
      3,
      5,
      7,
      10
    ],
    "chords": [
      0,
      5,
      3,
      4
    ],
    "keys": "pad",
    "comp": "sustain",
    "bass": "pulse",
    "bassVoice": "sub",
    "melody": {
      "voice": "flute",
      "density": 0.5,
      "octave": 1,
      "decay": 0.7
    },
    "drums": {
      "hand": "x..x..o.x..o.x..",
      "shaker": "..x...x...x...x."
    }
  },
  "wolf-among-us": {
    "bpm": 83,
    "swing": 0.14,
    "root": 50,
    "scale": [
      0,
      2,
      3,
      5,
      7,
      8,
      10
    ],
    "lead": [
      0,
      3,
      5,
      7,
      10
    ],
    "chords": [
      0,
      5,
      3,
      4
    ],
    "keys": "epiano",
    "comp": "charleston",
    "bass": "walk",
    "bassVoice": "upright",
    "melody": {
      "voice": "synth",
      "density": 0.5,
      "octave": 1,
      "decay": 0.7
    },
    "drums": {
      "brush": "x.x.x.x.x.x.x.x.",
      "kick": "x.......o......."
    }
  },
  "walking-dead-s3": {
    "bpm": 67,
    "swing": 0,
    "root": 43,
    "scale": [
      0,
      2,
      3,
      5,
      7,
      8,
      10
    ],
    "lead": [
      0,
      3,
      5,
      7,
      10
    ],
    "chords": [
      0,
      5,
      3,
      4
    ],
    "keys": "pluck",
    "comp": "sustain",
    "bass": "root",
    "bassVoice": "upright",
    "melody": {
      "voice": "strings",
      "density": 0.3,
      "octave": 1,
      "decay": 1.5
    },
    "drums": {
      "brush": "o.......o......."
    }
  },
  "tropico-6": {
    "bpm": 111,
    "swing": 0,
    "root": 60,
    "scale": [
      0,
      2,
      4,
      5,
      7,
      9,
      10
    ],
    "lead": [
      0,
      3,
      5,
      7,
      10
    ],
    "chords": [
      0,
      5,
      3,
      4
    ],
    "keys": "epiano",
    "comp": "offbeat",
    "bass": "walk",
    "bassVoice": "upright",
    "melody": {
      "voice": "marimba",
      "density": 0.5,
      "octave": 1,
      "decay": 0.7
    },
    "drums": {
      "hand": "x..o..x...o.x...",
      "shaker": "x.xxx.xxx.xxx.xx"
    }
  },
  "worms": {
    "bpm": 123,
    "swing": 0.14,
    "root": 64,
    "scale": [
      0,
      2,
      4,
      5,
      7,
      9,
      11
    ],
    "lead": [
      0,
      2,
      4,
      7,
      9
    ],
    "chords": [
      0,
      3,
      4,
      1
    ],
    "keys": "pluck",
    "comp": "offbeat",
    "bass": "walk",
    "bassVoice": "upright",
    "melody": {
      "voice": "chip",
      "density": 0.5,
      "octave": 2,
      "decay": 0.7
    },
    "drums": {
      "hand": "x...o...x...o...",
      "shaker": "x.x.x.x.x.x.x.x."
    }
  }
};

export const NEXT_GAME_MUSIC_GAMES: Record<string, string> = {
  "harry-potter": "Harry Potter",
  "gta-5": "Grand Theft Auto V",
  "gta-sa": "Grand Theft Auto: San Andreas",
  "gta-3": "Grand Theft Auto III",
  "control": "Control",
  "alan-wake": "Alan Wake",
  "quantum-break": "Quantum Break",
  "max-payne": "Max Payne",
  "resident-evil": "Resident Evil",
  "silent-hill": "Silent Hill",
  "batman": "Batman",
  "baldurs-gate-3": "Baldur’s Gate 3",
  "divinity-original-sin-2": "Divinity: Original Sin II",
  "diablo-4": "Diablo IV",
  "black-desert": "Black Desert",
  "darksiders-3": "Darksiders III",
  "death-stranding": "Death Stranding",
  "devil-may-cry": "Devil May Cry",
  "palworld": "Palworld",
  "shadow-tomb-raider": "Shadow of the Tomb Raider",
  "wolf-among-us": "The Wolf Among Us",
  "walking-dead-s3": "The Walking Dead: Season 3",
  "tropico-6": "Tropico 6",
  "worms": "Worms"
};
