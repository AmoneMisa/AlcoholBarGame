// Appended collections preserve all existing atlas cells and saved costume IDs.
import { NEXT_GAME_INTERIORS, NEXT_GAME_COSTUMES, NEXT_GAME_RECOMMENDATIONS, NEXT_GAME_PRIMARY_STYLES, NEXT_GAME_SHELVES } from './gameThemeExpansion2';
export const GAME_THEME_INTERIORS = [
  {
    "id": "witcher-3",
    "name": "Witcher 3 • Novigrad tavern",
    "asset": "/assets/bar/backgrounds/interior-witcher-3.webp",
    "tint": "#10162222",
    "position": "center",
    "blend": "multiply",
    "crystalCost": 2800
  },
  {
    "id": "heroes-3",
    "name": "Heroes of Might and Magic III • Erathia inn",
    "asset": "/assets/bar/backgrounds/interior-heroes-3.webp",
    "tint": "#10162222",
    "position": "center",
    "blend": "multiply",
    "crystalCost": 2840
  },
  {
    "id": "elden-ring",
    "name": "Elden Ring • Lands Between tavern",
    "asset": "/assets/bar/backgrounds/interior-elden-ring.webp",
    "tint": "#10162222",
    "position": "center",
    "blend": "multiply",
    "crystalCost": 2880
  },
  {
    "id": "minecraft",
    "name": "Minecraft • Block village taproom",
    "asset": "/assets/bar/backgrounds/interior-minecraft.webp",
    "tint": "#10162222",
    "position": "center",
    "blend": "multiply",
    "crystalCost": 2920
  },
  {
    "id": "skyrim",
    "name": "Skyrim • Whiterun mead hall",
    "asset": "/assets/bar/backgrounds/interior-skyrim.webp",
    "tint": "#10162222",
    "position": "center",
    "blend": "multiply",
    "crystalCost": 2960
  },
  {
    "id": "cyberpunk-2077",
    "name": "Cyberpunk 2077 • Night City lounge",
    "asset": "/assets/bar/backgrounds/interior-cyberpunk-2077.webp",
    "tint": "#10162222",
    "position": "center",
    "blend": "multiply",
    "crystalCost": 3000
  },
  {
    "id": "cs-2",
    "name": "Counter-Strike 2 • Tactical clubhouse",
    "asset": "/assets/bar/backgrounds/interior-cs-2.webp",
    "tint": "#10162222",
    "position": "center",
    "blend": "multiply",
    "crystalCost": 3040
  },
  {
    "id": "assassins-creed",
    "name": "Assassin’s Creed • Venetian hidden tavern",
    "asset": "/assets/bar/backgrounds/interior-assassins-creed.webp",
    "tint": "#10162222",
    "position": "center",
    "blend": "multiply",
    "crystalCost": 3080
  },
  {
    "id": "watch-dogs",
    "name": "Watch Dogs • Chicago hacker bar",
    "asset": "/assets/bar/backgrounds/interior-watch-dogs.webp",
    "tint": "#10162222",
    "position": "center",
    "blend": "multiply",
    "crystalCost": 3120
  },
  {
    "id": "sleeping-dogs",
    "name": "Sleeping Dogs • Hong Kong night bar",
    "asset": "/assets/bar/backgrounds/interior-sleeping-dogs.webp",
    "tint": "#10162222",
    "position": "center",
    "blend": "multiply",
    "crystalCost": 3160
  },
  {
    "id": "detroit",
    "name": "Detroit: Become Human • Android lounge",
    "asset": "/assets/bar/backgrounds/interior-detroit.webp",
    "tint": "#10162222",
    "position": "center",
    "blend": "multiply",
    "crystalCost": 3200
  },
  {
    "id": "neighbours-from-hell",
    "name": "Neighbours from Hell • Prankster pub",
    "asset": "/assets/bar/backgrounds/interior-neighbours-from-hell.webp",
    "tint": "#10162222",
    "position": "center",
    "blend": "multiply",
    "crystalCost": 3240
  },
  {
    "id": "gta",
    "name": "Grand Theft Auto • Vice City beach bar",
    "asset": "/assets/bar/backgrounds/interior-gta.webp",
    "tint": "#10162222",
    "position": "center",
    "blend": "multiply",
    "crystalCost": 3280
  },
  {
    "id": "stellar-blade",
    "name": "Stellar Blade • Xion lounge",
    "asset": "/assets/bar/backgrounds/interior-stellar-blade.webp",
    "tint": "#10162222",
    "position": "center",
    "blend": "multiply",
    "crystalCost": 3320
  },
  {
    "id": "repo",
    "name": "R.E.P.O. • Salvage depot bar",
    "asset": "/assets/bar/backgrounds/interior-repo.webp",
    "tint": "#10162222",
    "position": "center",
    "blend": "multiply",
    "crystalCost": 3360
  },
  {
    "id": "among-us",
    "name": "Among Us • Skeld cafeteria bar",
    "asset": "/assets/bar/backgrounds/interior-among-us.webp",
    "tint": "#10162222",
    "position": "center",
    "blend": "multiply",
    "crystalCost": 3400
  },
  {
    "id": "borderlands",
    "name": "Borderlands • Pandora saloon",
    "asset": "/assets/bar/backgrounds/interior-borderlands.webp",
    "tint": "#10162222",
    "position": "center",
    "blend": "multiply",
    "crystalCost": 3440
  },
  ...NEXT_GAME_INTERIORS,
] as const;

export const GAME_THEME_COSTUMES = {
  "noa": [
    {
      "value": "theme-witcher-3-noa",
      "label": "Witcher 3 · Ciri",
      "theme": "witcher-3"
    },
    {
      "value": "theme-heroes-3-noa",
      "label": "Heroes of Might and Magic III · Catherine Ironfist",
      "theme": "heroes-3"
    },
    {
      "value": "theme-elden-ring-noa",
      "label": "Elden Ring · Ranni",
      "theme": "elden-ring"
    },
    {
      "value": "theme-minecraft-noa",
      "label": "Minecraft · Alex",
      "theme": "minecraft"
    },
    {
      "value": "theme-skyrim-noa",
      "label": "Skyrim · Dragonborn shieldmaiden",
      "theme": "skyrim"
    },
    {
      "value": "theme-cyberpunk-2077-noa",
      "label": "Cyberpunk 2077 · V • female",
      "theme": "cyberpunk-2077"
    },
    {
      "value": "theme-cs-2-noa",
      "label": "Counter-Strike 2 · Agent Ava",
      "theme": "cs-2"
    },
    {
      "value": "theme-assassins-creed-noa",
      "label": "Assassin’s Creed · Evie Frye",
      "theme": "assassins-creed"
    },
    {
      "value": "theme-watch-dogs-noa",
      "label": "Watch Dogs · Sitara",
      "theme": "watch-dogs"
    },
    {
      "value": "theme-sleeping-dogs-noa",
      "label": "Sleeping Dogs · Hong Kong detective",
      "theme": "sleeping-dogs"
    },
    {
      "value": "theme-detroit-noa",
      "label": "Detroit: Become Human · Kara",
      "theme": "detroit"
    },
    {
      "value": "theme-neighbours-from-hell-noa",
      "label": "Neighbours from Hell · Prankster hostess",
      "theme": "neighbours-from-hell"
    },
    {
      "value": "theme-gta-noa",
      "label": "Grand Theft Auto · Vice City hostess",
      "theme": "gta"
    },
    {
      "value": "theme-stellar-blade-noa",
      "label": "Stellar Blade · EVE",
      "theme": "stellar-blade"
    },
    {
      "value": "theme-repo-noa",
      "label": "R.E.P.O. · Salvage robot • female",
      "theme": "repo"
    },
    {
      "value": "theme-among-us-noa",
      "label": "Among Us · Crewmate • red",
      "theme": "among-us"
    },
    {
      "value": "theme-borderlands-noa",
      "label": "Borderlands · Lilith",
      "theme": "borderlands"
    },
    ...NEXT_GAME_COSTUMES.noa,
  ],
  "leo": [
    {
      "value": "theme-witcher-3-leo",
      "label": "Witcher 3 · Geralt",
      "theme": "witcher-3"
    },
    {
      "value": "theme-heroes-3-leo",
      "label": "Heroes of Might and Magic III · Gelu",
      "theme": "heroes-3"
    },
    {
      "value": "theme-elden-ring-leo",
      "label": "Elden Ring · Blaidd",
      "theme": "elden-ring"
    },
    {
      "value": "theme-minecraft-leo",
      "label": "Minecraft · Steve",
      "theme": "minecraft"
    },
    {
      "value": "theme-skyrim-leo",
      "label": "Skyrim · Dragonborn warrior",
      "theme": "skyrim"
    },
    {
      "value": "theme-cyberpunk-2077-leo",
      "label": "Cyberpunk 2077 · V • male",
      "theme": "cyberpunk-2077"
    },
    {
      "value": "theme-cs-2-leo",
      "label": "Counter-Strike 2 · Counter-terrorist operator",
      "theme": "cs-2"
    },
    {
      "value": "theme-assassins-creed-leo",
      "label": "Assassin’s Creed · Ezio Auditore",
      "theme": "assassins-creed"
    },
    {
      "value": "theme-watch-dogs-leo",
      "label": "Watch Dogs · Aiden Pearce",
      "theme": "watch-dogs"
    },
    {
      "value": "theme-sleeping-dogs-leo",
      "label": "Sleeping Dogs · Wei Shen",
      "theme": "sleeping-dogs"
    },
    {
      "value": "theme-detroit-leo",
      "label": "Detroit: Become Human · Connor",
      "theme": "detroit"
    },
    {
      "value": "theme-neighbours-from-hell-leo",
      "label": "Neighbours from Hell · Woody",
      "theme": "neighbours-from-hell"
    },
    {
      "value": "theme-gta-leo",
      "label": "Grand Theft Auto · Tommy Vercetti",
      "theme": "gta"
    },
    {
      "value": "theme-stellar-blade-leo",
      "label": "Stellar Blade · Adam",
      "theme": "stellar-blade"
    },
    {
      "value": "theme-repo-leo",
      "label": "R.E.P.O. · Salvage robot • male",
      "theme": "repo"
    },
    {
      "value": "theme-among-us-leo",
      "label": "Among Us · Crewmate • cyan",
      "theme": "among-us"
    },
    {
      "value": "theme-borderlands-leo",
      "label": "Borderlands · Mordecai",
      "theme": "borderlands"
    },
    ...NEXT_GAME_COSTUMES.leo,
  ]
} as const;

export const GAME_THEME_RECOMMENDATIONS = {
  ...NEXT_GAME_RECOMMENDATIONS,
  "witcher-3": {
    "noa": [
      "theme-witcher-3-noa"
    ],
    "leo": [
      "theme-witcher-3-leo"
    ]
  },
  "heroes-3": {
    "noa": [
      "theme-heroes-3-noa"
    ],
    "leo": [
      "theme-heroes-3-leo"
    ]
  },
  "elden-ring": {
    "noa": [
      "theme-elden-ring-noa"
    ],
    "leo": [
      "theme-elden-ring-leo"
    ]
  },
  "minecraft": {
    "noa": [
      "theme-minecraft-noa"
    ],
    "leo": [
      "theme-minecraft-leo"
    ]
  },
  "skyrim": {
    "noa": [
      "theme-skyrim-noa"
    ],
    "leo": [
      "theme-skyrim-leo"
    ]
  },
  "cyberpunk-2077": {
    "noa": [
      "theme-cyberpunk-2077-noa"
    ],
    "leo": [
      "theme-cyberpunk-2077-leo"
    ]
  },
  "cs-2": {
    "noa": [
      "theme-cs-2-noa"
    ],
    "leo": [
      "theme-cs-2-leo"
    ]
  },
  "assassins-creed": {
    "noa": [
      "theme-assassins-creed-noa"
    ],
    "leo": [
      "theme-assassins-creed-leo"
    ]
  },
  "watch-dogs": {
    "noa": [
      "theme-watch-dogs-noa"
    ],
    "leo": [
      "theme-watch-dogs-leo"
    ]
  },
  "sleeping-dogs": {
    "noa": [
      "theme-sleeping-dogs-noa"
    ],
    "leo": [
      "theme-sleeping-dogs-leo"
    ]
  },
  "detroit": {
    "noa": [
      "theme-detroit-noa"
    ],
    "leo": [
      "theme-detroit-leo"
    ]
  },
  "neighbours-from-hell": {
    "noa": [
      "theme-neighbours-from-hell-noa"
    ],
    "leo": [
      "theme-neighbours-from-hell-leo"
    ]
  },
  "gta": {
    "noa": [
      "theme-gta-noa"
    ],
    "leo": [
      "theme-gta-leo"
    ]
  },
  "stellar-blade": {
    "noa": [
      "theme-stellar-blade-noa"
    ],
    "leo": [
      "theme-stellar-blade-leo"
    ]
  },
  "repo": {
    "noa": [
      "theme-repo-noa"
    ],
    "leo": [
      "theme-repo-leo"
    ]
  },
  "among-us": {
    "noa": [
      "theme-among-us-noa"
    ],
    "leo": [
      "theme-among-us-leo"
    ]
  },
  "borderlands": {
    "noa": [
      "theme-borderlands-noa"
    ],
    "leo": [
      "theme-borderlands-leo"
    ]
  }
} as const;

export const GAME_THEME_PRIMARY_STYLES = {
  ...NEXT_GAME_PRIMARY_STYLES,
  "witcher-3": {
    "character": "noa",
    "value": "theme-witcher-3-noa"
  },
  "heroes-3": {
    "character": "noa",
    "value": "theme-heroes-3-noa"
  },
  "elden-ring": {
    "character": "noa",
    "value": "theme-elden-ring-noa"
  },
  "minecraft": {
    "character": "noa",
    "value": "theme-minecraft-noa"
  },
  "skyrim": {
    "character": "noa",
    "value": "theme-skyrim-noa"
  },
  "cyberpunk-2077": {
    "character": "noa",
    "value": "theme-cyberpunk-2077-noa"
  },
  "cs-2": {
    "character": "noa",
    "value": "theme-cs-2-noa"
  },
  "assassins-creed": {
    "character": "noa",
    "value": "theme-assassins-creed-noa"
  },
  "watch-dogs": {
    "character": "noa",
    "value": "theme-watch-dogs-noa"
  },
  "sleeping-dogs": {
    "character": "noa",
    "value": "theme-sleeping-dogs-noa"
  },
  "detroit": {
    "character": "noa",
    "value": "theme-detroit-noa"
  },
  "neighbours-from-hell": {
    "character": "noa",
    "value": "theme-neighbours-from-hell-noa"
  },
  "gta": {
    "character": "noa",
    "value": "theme-gta-noa"
  },
  "stellar-blade": {
    "character": "noa",
    "value": "theme-stellar-blade-noa"
  },
  "repo": {
    "character": "noa",
    "value": "theme-repo-noa"
  },
  "among-us": {
    "character": "noa",
    "value": "theme-among-us-noa"
  },
  "borderlands": {
    "character": "noa",
    "value": "theme-borderlands-noa"
  }
} as const;

export const GAME_THEME_SHELVES = {
  ...NEXT_GAME_SHELVES,
  "witcher-3": "walnut",
  "heroes-3": "brass",
  "elden-ring": "brass",
  "minecraft": "rustic",
  "skyrim": "rustic",
  "cyberpunk-2077": "neon",
  "cs-2": "glass",
  "assassins-creed": "marble",
  "watch-dogs": "neon",
  "sleeping-dogs": "walnut",
  "detroit": "glass",
  "neighbours-from-hell": "rustic",
  "gta": "bamboo",
  "stellar-blade": "marble",
  "repo": "rustic",
  "among-us": "glass",
  "borderlands": "rustic"
} as const;
