// A guest's appearance, made from their id: the same guest always looks the same, and named regulars keep their gender and skin tone.
import { CHARACTER_ART } from '../data/cosmetics/artCatalog';
import {
  BLUSH_OPTIONS, BODY_SHAPES, BROW_SHAPES, BUST_OPTIONS, CHEEK_SHAPES, EYELINER_OPTIONS, EYESHADOW_OPTIONS, EYE_COLORS, EYE_SHAPES, FACE_SHAPES, FACIAL_HAIR_OPTIONS,
  HAIR_COLORS, LEO_HAIR_STYLES, LIP_COLORS, LIP_SHAPES, NOA_HAIR_STYLES, NOSE_SHAPES, SKIN_DETAILS, SKIN_TONES
} from '../data/cosmetics/bars';
import { SKIN, type Look3dInput } from './character3d';

function random(seed: string) {
  let h = 2166136261;
  for (const c of seed) h = Math.imul(h ^ c.charCodeAt(0), 16777619);
  return () => { h = Math.imul(h ^ (h >>> 15), 2246822507) >>> 0; h = Math.imul(h ^ (h >>> 13), 3266489909) >>> 0; return ((h ^ (h >>> 16)) >>> 0) / 4294967296; };
}
const pick = <T,>(next: () => number, items: readonly T[]) => items[Math.floor(next() * items.length)]!;
const distance = (a: string, b: string) => [1, 3, 5].reduce((sum, i) => sum + (parseInt(a.slice(i, i + 2), 16) - parseInt(b.slice(i, i + 2), 16)) ** 2, 0);
const SHIRTS = ['#e8e6df', '#3b5b8c', '#8c3b3b', '#2f6b55', '#c9a24a', '#5a3b7a', '#333a45', '#b5651d', '#d98fa5', '#7fa9c9', '#556b2f', '#f2c9a0'];
const VESTS = ['#1f2430', '#59101f', '#2f4a3a', '#3b2a1e', '#40355a', '#4a4a52'];
// Hair colours a guest may have: natural mostly, with the odd dyed one.
const HAIR = ['espresso', 'black', 'chestnut', 'chestnut', 'copper', 'blonde', 'platinum', 'red', 'espresso', 'black', 'blue', 'pink'] as const satisfies readonly (typeof HAIR_COLORS[number])[];

export function customerLook(seed: string, characterId?: string): Look3dInput {
  const next = random(characterId ?? seed);
  const art = CHARACTER_ART.find((item) => item.id === characterId);
  const female = art ? art.presentation === 'female' || (art.presentation === 'neutral' && next() < .5) : next() < .5;
  // The named cast keeps its skin tone: use the closest of the game's tones.
  const skinTone = art ? SKIN_TONES.reduce((best, tone) => (distance(SKIN[tone]!, art.skinTone) < distance(SKIN[best]!, art.skinTone) ? tone : best), SKIN_TONES[0]) : pick(next, SKIN_TONES);
  const look: Look3dInput & Record<string, string | string[] | undefined> = {
    bartenderCharacter: female ? 'noa' : 'leo', bartender: 'shirt', skinTone, tanLevel: pick(next, ['none', 'none', 'sun-kissed', 'deep']),
    face: pick(next, FACE_SHAPES), eyeShape: pick(next, EYE_SHAPES), browShape: pick(next, BROW_SHAPES), noseShape: pick(next, NOSE_SHAPES), lipShape: pick(next, LIP_SHAPES),
    cheekShape: pick(next, CHEEK_SHAPES), eyeColor: pick(next, EYE_COLORS), lipColor: female ? pick(next, LIP_COLORS) : 'bare', bodyShape: pick(next, BODY_SHAPES),
    bust: female ? pick(next, BUST_OPTIONS) : 'balanced', hairStyle: pick(next, female ? NOA_HAIR_STYLES : LEO_HAIR_STYLES), hairColor: pick(next, HAIR),
    skinDetail: next() < .2 ? pick(next, SKIN_DETAILS.filter((detail) => detail !== 'clean')) : 'clean',
    facialHair: !female && next() < .45 ? pick(next, FACIAL_HAIR_OPTIONS.filter((option) => option !== 'clean')) : 'clean',
    eyeshadow: female && next() < .5 ? pick(next, EYESHADOW_OPTIONS) : 'none', eyeliner: female && next() < .5 ? pick(next, EYELINER_OPTIONS) : 'none',
    blush: female && next() < .5 ? pick(next, BLUSH_OPTIONS) : 'none', lighting: 'amber',
    shirtColor: pick(next, SHIRTS), vestColor: next() < .4 ? pick(next, VESTS) : undefined
  };
  const parts: string[] = [];
  if (next() < .3) parts.push(`acc_glasses-${next() < .5 ? 'round' : 'angular'}`);
  const hat = next();
  if (hat < .14) parts.push('acc_beanie', 'acc_beanie-cuff'); else if (hat < .24) parts.push('acc_fedora', 'acc_fedora-band');
  if (female && next() < .35) parts.push('acc_hoops');
  if (next() < .25) parts.push('acc_pendant');
  look.extraParts = parts;
  return look as Look3dInput;
}
