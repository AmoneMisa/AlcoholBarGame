import { GAME_THEME_INTERIORS, GAME_THEME_COSTUMES, GAME_THEME_RECOMMENDATIONS } from './gameThemeExpansion';

export const THEMED_INTERIORS = [
  {
    "id": "underwater",
    "name": "Underwater reef bar",
    "asset": "/assets/bar/backgrounds/interior-underwater.webp",
    "tint": "#10162222",
    "position": "center",
    "blend": "multiply",
    "crystalCost": 1200
  },
  {
    "id": "underground",
    "name": "Underground tavern",
    "asset": "/assets/bar/backgrounds/interior-underground.webp",
    "tint": "#10162222",
    "position": "center",
    "blend": "multiply",
    "crystalCost": 1350
  },
  {
    "id": "fairy",
    "name": "Fairy grove bar",
    "asset": "/assets/bar/backgrounds/interior-fairy.webp",
    "tint": "#10162222",
    "position": "center",
    "blend": "multiply",
    "crystalCost": 1450
  },
  {
    "id": "fairytale",
    "name": "Fairytale castle bar",
    "asset": "/assets/bar/backgrounds/interior-fairytale.webp",
    "tint": "#10162222",
    "position": "center",
    "blend": "multiply",
    "crystalCost": 1550
  },
  {
    "id": "lineage-2",
    "name": "Lineage II · Aden tavern",
    "asset": "/assets/bar/backgrounds/interior-lineage-2.webp",
    "tint": "#10162222",
    "position": "center",
    "blend": "multiply",
    "crystalCost": 1700
  },
  {
    "id": "perfect-world",
    "name": "Perfect World · celestial bar",
    "asset": "/assets/bar/backgrounds/interior-perfect-world.webp",
    "tint": "#10162222",
    "position": "center",
    "blend": "multiply",
    "crystalCost": 1750
  },
  {
    "id": "warcraft-3",
    "name": "Warcraft III · crossroads bar",
    "asset": "/assets/bar/backgrounds/interior-warcraft-3.webp",
    "tint": "#10162222",
    "position": "center",
    "blend": "multiply",
    "crystalCost": 1850
  },
  {
    "id": "allods",
    "name": "Allods Online · astral bar",
    "asset": "/assets/bar/backgrounds/interior-allods.webp",
    "tint": "#10162222",
    "position": "center",
    "blend": "multiply",
    "crystalCost": 2000
  },
  {
    "id": "lost-ark",
    "name": "Lost Ark · beach club",
    "asset": "/assets/bar/backgrounds/interior-lost-ark.webp",
    "tint": "#10162222",
    "position": "center",
    "blend": "multiply",
    "crystalCost": 2250
  },
  {
    "id": "mass-effect",
    "name": "Mass Effect · Citadel lounge",
    "asset": "/assets/bar/backgrounds/interior-mass-effect.webp",
    "tint": "#10162222",
    "position": "center",
    "blend": "multiply",
    "crystalCost": 2300
  },
  {
    "id": "nfs-most-wanted",
    "name": "Most Wanted · garage bar",
    "asset": "/assets/bar/backgrounds/interior-nfs-most-wanted.webp",
    "tint": "#10162222",
    "position": "center",
    "blend": "multiply",
    "crystalCost": 2400
  },
  {
    "id": "nfs-carbon",
    "name": "Carbon · night garage bar",
    "asset": "/assets/bar/backgrounds/interior-nfs-carbon.webp",
    "tint": "#10162222",
    "position": "center",
    "blend": "multiply",
    "crystalCost": 2600
  },
  {
    "id": "nfs-underground",
    "name": "Underground · tuner bar",
    "asset": "/assets/bar/backgrounds/interior-nfs-underground.webp",
    "tint": "#10162222",
    "position": "center",
    "blend": "multiply",
    "crystalCost": 2750
  },
  ...GAME_THEME_INTERIORS,
] as const;

export const THEMED_COSTUMES = {
  "noa": [
    {
      "value": "theme-underground-noa",
      "label": "Underground · cave keeper",
      "theme": "underground"
    },
    {
      "value": "theme-fairy-noa",
      "label": "Fairy · woodland host",
      "theme": "fairy"
    },
    {
      "value": "theme-fairytale-noa",
      "label": "Fairytale · royal host",
      "theme": "fairytale"
    },
    {
      "value": "theme-l2-human-noa",
      "label": "Lineage II · Human",
      "theme": "lineage-2"
    },
    {
      "value": "theme-l2-elf-noa",
      "label": "Lineage II · Elf",
      "theme": "lineage-2"
    },
    {
      "value": "theme-l2-dark-elf-noa",
      "label": "Lineage II · Dark Elf",
      "theme": "lineage-2"
    },
    {
      "value": "theme-l2-orc-noa",
      "label": "Lineage II · Orc",
      "theme": "lineage-2"
    },
    {
      "value": "theme-l2-dwarf-noa",
      "label": "Lineage II · Dwarf",
      "theme": "lineage-2"
    },
    {
      "value": "theme-l2-kamael-noa",
      "label": "Lineage II · Kamael",
      "theme": "lineage-2"
    },
    {
      "value": "theme-l2-ertheia-noa",
      "label": "Lineage II · Ertheia",
      "theme": "lineage-2"
    },
    {
      "value": "theme-pw-human-noa",
      "label": "Perfect World · Human",
      "theme": "perfect-world"
    },
    {
      "value": "theme-pw-winged-elf-noa",
      "label": "Perfect World · Winged Elf",
      "theme": "perfect-world"
    },
    {
      "value": "theme-pw-untamed-noa",
      "label": "Perfect World · Untamed",
      "theme": "perfect-world"
    },
    {
      "value": "theme-pw-tideborn-noa",
      "label": "Perfect World · Tideborn",
      "theme": "perfect-world"
    },
    {
      "value": "theme-pw-earthguard-noa",
      "label": "Perfect World · Earthguard",
      "theme": "perfect-world"
    },
    {
      "value": "theme-pw-nightshade-noa",
      "label": "Perfect World · Nightshade",
      "theme": "perfect-world"
    },
    {
      "value": "theme-allods-kanian-noa",
      "label": "Allods Online · Kanian",
      "theme": "allods"
    },
    {
      "value": "theme-allods-elf-noa",
      "label": "Allods Online · Elf",
      "theme": "allods"
    },
    {
      "value": "theme-allods-gibberling-noa",
      "label": "Allods Online · Gibberling",
      "theme": "allods"
    },
    {
      "value": "theme-allods-xadaganian-noa",
      "label": "Allods Online · Xadaganian",
      "theme": "allods"
    },
    {
      "value": "theme-allods-orc-noa",
      "label": "Allods Online · Orc",
      "theme": "allods"
    },
    {
      "value": "theme-allods-arisen-noa",
      "label": "Allods Online · Arisen",
      "theme": "allods"
    },
    {
      "value": "theme-allods-priden-noa",
      "label": "Allods Online · Priden",
      "theme": "allods"
    },
    {
      "value": "theme-allods-aoidos-noa",
      "label": "Allods Online · Aoidos",
      "theme": "allods"
    },
    {
      "value": "theme-wc3-sylvanas-noa",
      "label": "Warcraft III · Sylvanas",
      "theme": "warcraft-3"
    },
    {
      "value": "theme-wc3-maiev-noa",
      "label": "Warcraft III · Maiev",
      "theme": "warcraft-3"
    },
    {
      "value": "theme-wc3-jaina-noa",
      "label": "Warcraft III · Jaina",
      "theme": "warcraft-3"
    },
    {
      "value": "theme-wc3-tyrande-noa",
      "label": "Warcraft III · Tyrande",
      "theme": "warcraft-3"
    },
    {
      "value": "theme-lost-ark-bard-noa",
      "label": "Lost Ark · beach Bard",
      "theme": "lost-ark"
    },
    {
      "value": "theme-shepard-noa",
      "label": "Mass Effect · Shepard",
      "theme": "mass-effect"
    },
    {
      "value": "theme-miranda-noa",
      "label": "Mass Effect · Miranda",
      "theme": "mass-effect"
    },
    {
      "value": "theme-liara-noa",
      "label": "Mass Effect · Liara",
      "theme": "mass-effect"
    },
    {
      "value": "theme-mw-noa",
      "label": "NFS Most Wanted · street racer",
      "theme": "nfs-most-wanted"
    },
    {
      "value": "theme-carbon-noa",
      "label": "NFS Carbon · street racer",
      "theme": "nfs-carbon"
    },
    {
      "value": "theme-nfs-underground-noa",
      "label": "NFS Underground · street racer",
      "theme": "nfs-underground"
    },
    {
      "value": "theme-l2-dark-elf-mage-noa",
      "label": "Lineage II · Dark Elf mage",
      "theme": "lineage-2"
    },
    ...GAME_THEME_COSTUMES.noa,
  ],
  "leo": [
    {
      "value": "theme-underground-leo",
      "label": "Underground · cave keeper",
      "theme": "underground"
    },
    {
      "value": "theme-fairy-leo",
      "label": "Fairy · woodland host",
      "theme": "fairy"
    },
    {
      "value": "theme-fairytale-leo",
      "label": "Fairytale · royal host",
      "theme": "fairytale"
    },
    {
      "value": "theme-l2-human-leo",
      "label": "Lineage II · Human",
      "theme": "lineage-2"
    },
    {
      "value": "theme-l2-elf-leo",
      "label": "Lineage II · Elf",
      "theme": "lineage-2"
    },
    {
      "value": "theme-l2-dark-elf-leo",
      "label": "Lineage II · Dark Elf",
      "theme": "lineage-2"
    },
    {
      "value": "theme-l2-orc-leo",
      "label": "Lineage II · Orc",
      "theme": "lineage-2"
    },
    {
      "value": "theme-l2-dwarf-leo",
      "label": "Lineage II · Dwarf",
      "theme": "lineage-2"
    },
    {
      "value": "theme-l2-kamael-leo",
      "label": "Lineage II · Kamael",
      "theme": "lineage-2"
    },
    {
      "value": "theme-l2-ertheia-leo",
      "label": "Lineage II · Ertheia",
      "theme": "lineage-2"
    },
    {
      "value": "theme-pw-human-leo",
      "label": "Perfect World · Human",
      "theme": "perfect-world"
    },
    {
      "value": "theme-pw-winged-elf-leo",
      "label": "Perfect World · Winged Elf",
      "theme": "perfect-world"
    },
    {
      "value": "theme-pw-untamed-leo",
      "label": "Perfect World · Untamed",
      "theme": "perfect-world"
    },
    {
      "value": "theme-pw-tideborn-leo",
      "label": "Perfect World · Tideborn",
      "theme": "perfect-world"
    },
    {
      "value": "theme-pw-earthguard-leo",
      "label": "Perfect World · Earthguard",
      "theme": "perfect-world"
    },
    {
      "value": "theme-pw-nightshade-leo",
      "label": "Perfect World · Nightshade",
      "theme": "perfect-world"
    },
    {
      "value": "theme-allods-kanian-leo",
      "label": "Allods Online · Kanian",
      "theme": "allods"
    },
    {
      "value": "theme-allods-elf-leo",
      "label": "Allods Online · Elf",
      "theme": "allods"
    },
    {
      "value": "theme-allods-gibberling-leo",
      "label": "Allods Online · Gibberling",
      "theme": "allods"
    },
    {
      "value": "theme-allods-xadaganian-leo",
      "label": "Allods Online · Xadaganian",
      "theme": "allods"
    },
    {
      "value": "theme-allods-orc-leo",
      "label": "Allods Online · Orc",
      "theme": "allods"
    },
    {
      "value": "theme-allods-arisen-leo",
      "label": "Allods Online · Arisen",
      "theme": "allods"
    },
    {
      "value": "theme-allods-priden-leo",
      "label": "Allods Online · Priden",
      "theme": "allods"
    },
    {
      "value": "theme-allods-aoidos-leo",
      "label": "Allods Online · Aoidos",
      "theme": "allods"
    },
    {
      "value": "theme-wc3-illidan-leo",
      "label": "Warcraft III · Illidan",
      "theme": "warcraft-3"
    },
    {
      "value": "theme-wc3-malfurion-leo",
      "label": "Warcraft III · Malfurion",
      "theme": "warcraft-3"
    },
    {
      "value": "theme-wc3-arthas-leo",
      "label": "Warcraft III · Arthas",
      "theme": "warcraft-3"
    },
    {
      "value": "theme-wc3-thrall-leo",
      "label": "Warcraft III · Thrall",
      "theme": "warcraft-3"
    },
    {
      "value": "theme-lost-ark-berserker-leo",
      "label": "Lost Ark · casual Berserker",
      "theme": "lost-ark"
    },
    {
      "value": "theme-shepard-leo",
      "label": "Mass Effect · Shepard",
      "theme": "mass-effect"
    },
    {
      "value": "theme-garrus-leo",
      "label": "Mass Effect · Garrus",
      "theme": "mass-effect"
    },
    {
      "value": "theme-thane-leo",
      "label": "Mass Effect · Thane",
      "theme": "mass-effect"
    },
    {
      "value": "theme-mw-leo",
      "label": "NFS Most Wanted · street racer",
      "theme": "nfs-most-wanted"
    },
    {
      "value": "theme-carbon-leo",
      "label": "NFS Carbon · street racer",
      "theme": "nfs-carbon"
    },
    {
      "value": "theme-nfs-underground-leo",
      "label": "NFS Underground · street racer",
      "theme": "nfs-underground"
    },
    {
      "value": "theme-l2-dark-elf-mage-leo",
      "label": "Lineage II · Dark Elf mage",
      "theme": "lineage-2"
    },
    ...GAME_THEME_COSTUMES.leo,
  ]
} as const;

export const THEMED_INTERIOR_COSTUMES: Readonly<Record<string, { noa: readonly string[]; leo: readonly string[] }>> = {
  ...GAME_THEME_RECOMMENDATIONS,
  "underwater": {
    "noa": [
      "reference-shark-noa"
    ],
    "leo": [
      "reference-shark-leo"
    ]
  },
  "underground": {
    "noa": [
      "theme-underground-noa"
    ],
    "leo": [
      "theme-underground-leo"
    ]
  },
  "fairy": {
    "noa": [
      "theme-fairy-noa"
    ],
    "leo": [
      "theme-fairy-leo"
    ]
  },
  "fairytale": {
    "noa": [
      "theme-fairytale-noa"
    ],
    "leo": [
      "theme-fairytale-leo"
    ]
  },
  "lineage-2": {
    "noa": [
      "theme-l2-human-noa",
      "theme-l2-elf-noa",
      "theme-l2-dark-elf-noa",
      "theme-l2-orc-noa",
      "theme-l2-dwarf-noa",
      "theme-l2-kamael-noa",
      "theme-l2-ertheia-noa",
      "theme-l2-dark-elf-mage-noa"
    ],
    "leo": [
      "theme-l2-human-leo",
      "theme-l2-elf-leo",
      "theme-l2-dark-elf-leo",
      "theme-l2-orc-leo",
      "theme-l2-dwarf-leo",
      "theme-l2-kamael-leo",
      "theme-l2-ertheia-leo",
      "theme-l2-dark-elf-mage-leo"
    ]
  },
  "perfect-world": {
    "noa": [
      "theme-pw-human-noa",
      "theme-pw-winged-elf-noa",
      "theme-pw-untamed-noa",
      "theme-pw-tideborn-noa",
      "theme-pw-earthguard-noa",
      "theme-pw-nightshade-noa"
    ],
    "leo": [
      "theme-pw-human-leo",
      "theme-pw-winged-elf-leo",
      "theme-pw-untamed-leo",
      "theme-pw-tideborn-leo",
      "theme-pw-earthguard-leo",
      "theme-pw-nightshade-leo"
    ]
  },
  "warcraft-3": {
    "noa": [
      "theme-wc3-sylvanas-noa",
      "theme-wc3-maiev-noa",
      "theme-wc3-jaina-noa",
      "theme-wc3-tyrande-noa"
    ],
    "leo": [
      "theme-wc3-illidan-leo",
      "theme-wc3-malfurion-leo",
      "theme-wc3-arthas-leo",
      "theme-wc3-thrall-leo"
    ]
  },
  "allods": {
    "noa": [
      "theme-allods-kanian-noa",
      "theme-allods-elf-noa",
      "theme-allods-gibberling-noa",
      "theme-allods-xadaganian-noa",
      "theme-allods-orc-noa",
      "theme-allods-arisen-noa",
      "theme-allods-priden-noa",
      "theme-allods-aoidos-noa"
    ],
    "leo": [
      "theme-allods-kanian-leo",
      "theme-allods-elf-leo",
      "theme-allods-gibberling-leo",
      "theme-allods-xadaganian-leo",
      "theme-allods-orc-leo",
      "theme-allods-arisen-leo",
      "theme-allods-priden-leo",
      "theme-allods-aoidos-leo"
    ]
  },
  "lost-ark": {
    "noa": [
      "theme-lost-ark-bard-noa"
    ],
    "leo": [
      "theme-lost-ark-berserker-leo"
    ]
  },
  "mass-effect": {
    "noa": [
      "theme-shepard-noa",
      "theme-miranda-noa",
      "theme-liara-noa"
    ],
    "leo": [
      "theme-shepard-leo",
      "theme-garrus-leo",
      "theme-thane-leo"
    ]
  },
  "nfs-most-wanted": {
    "noa": [
      "theme-mw-noa"
    ],
    "leo": [
      "theme-mw-leo"
    ]
  },
  "nfs-carbon": {
    "noa": [
      "theme-carbon-noa"
    ],
    "leo": [
      "theme-carbon-leo"
    ]
  },
  "nfs-underground": {
    "noa": [
      "theme-nfs-underground-noa"
    ],
    "leo": [
      "theme-nfs-underground-leo"
    ]
  }
};

export const themedCostumeFor = (character: string, outfit: string) => {
  const choices = THEMED_COSTUMES[character as keyof typeof THEMED_COSTUMES] ?? [];
  const index = choices.findIndex(choice => choice.value === outfit);
  if (index < 0) return undefined;
  return { ...choices[index]!, index: index % 6, columns: 3, rows: 2, frameRatio: 420 / 552,
    sheet: `/assets/characters/bartender/${character}-themed-atlas-v${Math.floor(index / 6) + 1}.webp` };
};

// Recommendations offer both bartenders a look for every original and new bar.
export const INTERIOR_COSTUME_RECOMMENDATIONS: Readonly<Record<string, { noa: readonly string[]; leo: readonly string[] }>> = {
  ...{
  "velvet": {
    "noa": [
      "vest"
    ],
    "leo": [
      "vest"
    ]
  },
  "garden": {
    "noa": [
      "reference-final-57"
    ],
    "leo": [
      "reference-frost-mage"
    ]
  },
  "skyline": {
    "noa": [
      "reference-trench"
    ],
    "leo": [
      "reference-final-94"
    ]
  },
  "inferno-penthouse": {
    "noa": [
      "reference-flame"
    ],
    "leo": [
      "reference-final-54"
    ]
  },
  "speakeasy": {
    "noa": [
      "reference-final-115"
    ],
    "leo": [
      "reference-final-54"
    ]
  },
  "jazz-cellar": {
    "noa": [
      "reference-final-12"
    ],
    "leo": [
      "reference-black-tie"
    ]
  },
  "art-deco": {
    "noa": [
      "reference-violet-gown"
    ],
    "leo": [
      "reference-tailcoat"
    ]
  },
  "library": {
    "noa": [
      "reference-teal-mage"
    ],
    "leo": [
      "reference-frost-mage"
    ]
  },
  "palace": {
    "noa": [
      "reference-royal"
    ],
    "leo": [
      "reference-court"
    ]
  },
  "tropical": {
    "noa": [
      "reference-turquoise"
    ],
    "leo": [
      "reference-final-60"
    ]
  },
  "desert": {
    "noa": [
      "reference-desert"
    ],
    "leo": [
      "reference-explorer"
    ]
  },
  "winter": {
    "noa": [
      "reference-ice-gown"
    ],
    "leo": [
      "reference-ice-king"
    ]
  },
  "beach": {
    "noa": [
      "reference-final-79"
    ],
    "leo": [
      "reference-final-51"
    ]
  },
  "rooftop": {
    "noa": [
      "reference-final-47"
    ],
    "leo": [
      "reference-final-21"
    ]
  },
  "cyberpunk": {
    "noa": [
      "reference-neon-hood"
    ],
    "leo": [
      "reference-tech"
    ]
  },
  "izakaya": {
    "noa": [
      "reference-sakura"
    ],
    "leo": [
      "reference-samurai"
    ]
  },
  "marina": {
    "noa": [
      "reference-traveler"
    ],
    "leo": [
      "reference-final-61"
    ]
  },
  "parisian": {
    "noa": [
      "reference-final-97"
    ],
    "leo": [
      "reference-tailored"
    ]
  },
  "loft": {
    "noa": [
      "reference-streetwear"
    ],
    "leo": [
      "reference-denim"
    ]
  },
  "riad": {
    "noa": [
      "reference-final-85"
    ],
    "leo": [
      "reference-historical"
    ]
  }
},
  ...THEMED_INTERIOR_COSTUMES,
};
export const costumesForInterior = (interior: string, character: string): readonly string[] =>
  INTERIOR_COSTUME_RECOMMENDATIONS[interior]?.[character as 'noa' | 'leo'] ?? [];


