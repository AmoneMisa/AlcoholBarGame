import { BARTENDER_COSTUMES } from './bartenderCostumes';

// Where each painted bartender style comes from. Every style is exactly one of:
//   basic       — open from the start (three per bartender)
//   background  — comes with its background (bought, or found in boxes for the event backgrounds); never sold on its own
//   achievement — a reward for a lifetime achievement; never sold
//   shop        — a short list bought with crystals
//   box         — everything else: a rare full-style drop from boxes, or crafted from style shards
// None of the painted styles are in the style draw, the daily roulette, Spark or skin-shard crafting.
export type Bartender = 'noa' | 'leo';
export type StyleSource = 'basic' | 'background' | 'achievement' | 'shop' | 'box';

export const BASIC_COSTUMES: Record<Bartender, readonly string[]> = {
  noa: ['reference-streetwear', 'reference-trench', 'reference-kimono'],
  leo: ['reference-tailored', 'reference-casual', 'reference-urban']
};

// One background ↔ one style. A background has exactly one connected style (never two, even where several would
// fit), and getting the style by any route gives the player its background too.
export const INTERIOR_STYLE: Readonly<Record<string, { character: Bartender; value: string }>> = {
  'underwater': { character: 'noa', value: 'reference-shark-noa' },
  'underground': { character: 'noa', value: 'theme-underground-noa' },
  'fairy': { character: 'noa', value: 'theme-fairy-noa' },
  'fairytale': { character: 'noa', value: 'theme-fairytale-noa' },
  'lineage-2': { character: 'noa', value: 'theme-l2-human-noa' },
  'perfect-world': { character: 'noa', value: 'theme-pw-human-noa' },
  'warcraft-3': { character: 'noa', value: 'theme-wc3-sylvanas-noa' },
  'allods': { character: 'noa', value: 'theme-allods-kanian-noa' },
  'lost-ark': { character: 'noa', value: 'theme-lost-ark-bard-noa' },
  'mass-effect': { character: 'noa', value: 'theme-shepard-noa' },
  'nfs-most-wanted': { character: 'noa', value: 'theme-mw-noa' },
  'nfs-carbon': { character: 'noa', value: 'theme-carbon-noa' },
  'nfs-underground': { character: 'noa', value: 'theme-nfs-underground-noa' },
  garden: { character: 'noa', value: 'reference-final-57' },
  skyline: { character: 'leo', value: 'reference-final-94' },
  'inferno-penthouse': { character: 'noa', value: 'reference-flame' },
  speakeasy: { character: 'leo', value: 'reference-final-54' },
  'jazz-cellar': { character: 'noa', value: 'reference-final-12' },
  'art-deco': { character: 'leo', value: 'reference-tailcoat' },
  library: { character: 'noa', value: 'reference-teal-mage' },
  palace: { character: 'noa', value: 'reference-royal' },
  tropical: { character: 'leo', value: 'reference-final-60' },
  desert: { character: 'noa', value: 'reference-desert' },
  winter: { character: 'leo', value: 'reference-ice-king' },
  beach: { character: 'leo', value: 'reference-final-51' },
  rooftop: { character: 'leo', value: 'reference-final-21' },
  cyberpunk: { character: 'noa', value: 'reference-neon-hood' },
  izakaya: { character: 'noa', value: 'reference-sakura' },
  marina: { character: 'leo', value: 'reference-final-61' },
  parisian: { character: 'noa', value: 'reference-final-97' },
  loft: { character: 'leo', value: 'reference-denim' },
  riad: { character: 'noa', value: 'reference-final-85' }
};

// Lifetime achievements hand out a matching pair, one style for each bartender.
export const ACHIEVEMENT_STYLES: Readonly<Record<string, Record<Bartender, string>>> = {
  'a-serve-10': { noa: 'reference-biker', leo: 'reference-hooded-tech' },
  'a-serve-100': { noa: 'reference-qipao', leo: 'reference-black-tie' },
  'a-serve-500': { noa: 'reference-final-67', leo: 'reference-final-70' },
  'a-vip-10': { noa: 'reference-violet-gown', leo: 'reference-court' },
  'a-bottles-25': { noa: 'reference-traveler', leo: 'reference-admiral' },
  'a-boxes-20': { noa: 'reference-archer', leo: 'reference-pirate' },
  'a-draws-30': { noa: 'reference-lavender', leo: 'reference-final-109' },
  'a-upgrades-30': { noa: 'reference-cobalt', leo: 'reference-tech' },
  'a-talk-25': { noa: 'reference-final-23', leo: 'reference-resort' },
  'a-lessons-14': { noa: 'reference-violet-mage', leo: 'reference-frost-mage' },
  'a-sig-50': { noa: 'reference-final-116', leo: 'reference-vampire' },
  'a-taste-20': { noa: 'reference-emerald-witch', leo: 'reference-plum-coat' }
};

// The styles sold for crystals: only ones that belong to no background and no achievement.
export const SHOP_STYLES: Readonly<Record<Bartender, readonly string[]>> = {
  noa: ['reference-gothic', 'reference-ice-gown', 'reference-paladin', 'reference-turquoise', 'reference-final-8', 'reference-final-28'],
  leo: ['reference-warrior', 'reference-duelist', 'reference-samurai', 'reference-explorer', 'reference-tropical', 'reference-historical']
};

export const STYLE_SHOP_PRICE = 400;
// Boxes: any box has this chance to hold a whole box-pool style, and style shards add up to one.
export const BOX_STYLE_CHANCE = 0.005;
export const STYLE_PIECES_TO_CRAFT = 50;

export const interiorForStyle = (character: string, value: string) =>
  Object.entries(INTERIOR_STYLE).find(([, style]) => style.character === character && style.value === value)?.[0];
export const styleForInterior = (interiorId: string) => INTERIOR_STYLE[interiorId];
export const achievementForStyle = (character: string, value: string) =>
  Object.entries(ACHIEVEMENT_STYLES).find(([, pair]) => (pair as Record<string, string>)[character] === value)?.[0];

export function styleSource(character: string, value: string): StyleSource {
  if ((BASIC_COSTUMES[character as Bartender] ?? []).includes(value)) return 'basic';
  if (interiorForStyle(character, value)) return 'background';
  if (achievementForStyle(character, value)) return 'achievement';
  if ((SHOP_STYLES[character as Bartender] ?? []).includes(value)) return 'shop';
  return 'box';
}

export const STYLE_CHARACTERS = Object.keys(BARTENDER_COSTUMES) as Bartender[];
