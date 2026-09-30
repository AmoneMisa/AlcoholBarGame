// Turns the saved bar appearance (BarProfile fields) into what the 3D bartender needs:
// morph-target weights, material colours and which hair / beard / clothing meshes to show.
// The names match the meshes, morph targets and clips built by scripts/blender/build_bartender.py.
import type { CharacterExpression } from './dialogue/types';

export interface Look3dInput {
  bartenderCharacter?: string; bartender?: string; face?: string; hairStyle?: string; hairColor?: string; bodyShape?: string; bust?: string;
  skinTone?: string; tanLevel?: string; eyeShape?: string; browShape?: string; noseShape?: string; lipShape?: string; cheekShape?: string;
  eyeColor?: string; lipColor?: string; facialHair?: string; lighting?: string;
}
export type Morphs = Record<string, number>;
export interface Rig3d {
  morphs: Morphs; colors: Record<string, string>; hair: string; beard?: string; visible: Set<string>; scale: number; light: string;
}

const FACE: Record<string, Morphs> = {
  oval: {}, heart: { jaw: -.8, chin: .3, forehead: .4, faceWidth: .1 }, square: { jaw: .9, chin: -.2, faceWidth: .15 }, round: { faceWidth: .5, faceLength: -.5, cheeks: .6 },
  diamond: { cheeks: .5, jaw: -.5, forehead: -.3, chin: .3 }, long: { faceLength: .9, faceWidth: -.3 }, soft: { cheeks: .4, jaw: -.3, chin: -.2 },
  angular: { jaw: .5, cheeks: -.6, chin: .6 }, mature: { faceLength: .3, cheeks: -.4, forehead: .3 }, sculpted: { cheeks: -.7, jaw: .3, chin: .4, forehead: .2 }
};
const EYES: Record<string, Morphs> = {
  almond: { eyeNarrow: .2 }, round: { eyeSize: .6, eyeNarrow: -.4 }, hooded: { eyeNarrow: .6 }, upturned: { eyeTilt: .8 }, downturned: { eyeTilt: -.8 },
  'deep-set': { eyeSize: -.2, eyeNarrow: .2, eyeSpacing: -.4 }, monolid: { eyeNarrow: .5, eyeSize: -.1 }, wide: { eyeSize: .4, eyeSpacing: .8 },
  narrow: { eyeNarrow: .7, eyeSize: -.3, eyeSpacing: -.3 }, cat: { eyeTilt: 1, eyeNarrow: .3 }
};
const BROWS: Record<string, Morphs> = {
  'soft-arch': { browRaise: .2 }, 'high-arch': { browRaise: .8 }, straight: {}, rounded: { browRaise: .3 }, feathered: { browThick: -.3 }, bold: { browThick: .9 },
  slim: { browThick: -.7 }, angled: { browAngry: .6 }, short: { browThick: -.2 }, long: { browThick: .2 }
};
const NOSES: Record<string, Morphs> = {
  straight: {}, button: { noseSize: -.4, noseUp: .7 }, aquiline: { noseSize: .5, noseWidth: -.4 }, wide: { noseWidth: .8 }, narrow: { noseWidth: -.6 },
  'turned-up': { noseUp: 1 }, roman: { noseSize: .7 }, soft: { noseSize: -.1 }
};
const LIPS: Record<string, Morphs> = {
  balanced: {}, full: { lipFull: .9 }, thin: { lipFull: -.7 }, cupid: { lipFull: .3, lipWide: -.2 }, wide: { lipWide: .8 }, small: { lipWide: -.6, lipFull: -.2 },
  'top-heavy': { lipFull: .4 }, 'bottom-heavy': { lipFull: .5 }, bowed: { lipFull: .3 }, soft: { lipFull: .4, lipWide: -.1 }
};
const CHEEKS: Record<string, Morphs> = { soft: { cheeks: .2 }, defined: { cheeks: -.4 }, high: { cheeks: .5 }, round: { cheeks: .8 }, hollow: { cheeks: -.9 }, full: { cheeks: .9 } };
const BODY: Record<string, Morphs> = { slim: { slim: 1 }, athletic: { broad: .3 }, curvy: { curvy: .9 }, muscular: { muscular: .9, broad: .4 }, broad: { broad: 1 } };
const BUST: Record<string, Morphs> = { petite: { bust: -.6 }, balanced: {}, full: { bust: 1 } };
// Character height: the two base presets differ a little; body shape adds to it.
const HEIGHT: Record<string, number> = { noa: .97, leo: 1.03 };

const SKIN: Record<string, string> = { porcelain: '#f0c7b5', fair: '#dca58a', warm: '#b97858', olive: '#a36f4f', brown: '#82523d', deep: '#54362d' };
const HAIR: Record<string, string> = { espresso: '#2a1712', black: '#100e12', chestnut: '#5b2d1f', copper: '#ad4f2b', blonde: '#d4af6d', platinum: '#e5ddce', red: '#8e1e26', blue: '#224f87', pink: '#9d3d72' };
const EYE: Record<string, string> = { brown: '#4b2f25', hazel: '#7a6a32', green: '#4f764b', blue: '#4e7896', gray: '#76808a', amber: '#a66c27', violet: '#76548d', black: '#17151a' };
const LIP: Record<string, string> = { bare: '#9b5f55', rose: '#a85169', nude: '#a86f62', berry: '#7f294b', red: '#b4243a', plum: '#62233e', coral: '#c9655d', brown: '#70443c', black: '#241b23', gloss: '#b66b72' };
const LIGHT: Record<string, string> = { amber: '#ffd9a0', rose: '#ffb3c6', blue: '#b3d4ff', violet: '#d2b8ff', emerald: '#b3f0cf', ice: '#e3f6ff' };
const OUTFIT: Record<string, { shirt: string; vest?: string; apron?: string }> = {
  base: { shirt: '#8b8f99' }, vest: { shirt: '#eeece6', vest: '#59101f' }, shirt: { shirt: '#e8e6df' }, apron: { shirt: '#1a1a1f', apron: '#0f5a45' },
  'special-gala': { shirt: '#f5f0e6', vest: '#1b1b24' }, 'special-cyberpunk': { shirt: '#15121f', vest: '#7a1fa0' }, 'special-steampunk': { shirt: '#d9c7a0', vest: '#5a3a1c' },
  'special-post-apocalypse': { shirt: '#6b5e4a', vest: '#3a3f33' }, 'special-historical': { shirt: '#efe6d0', vest: '#4a2a3a' },
  'special-fantasy': { shirt: '#d8e6d0', vest: '#2f5d4a' }, 'special-masquerade': { shirt: '#1a1420', vest: '#6d1a3a' }
};
const HAIR_MESH: Record<string, string> = { waves: 'shoulder-waves' };

function mix(target: Morphs, source: Morphs = {}) { for (const [key, value] of Object.entries(source)) target[key] = (target[key] ?? 0) + value; }
function shade(hex: string, factor: number) {
  const n = parseInt(hex.slice(1), 16);
  const channel = (shift: number) => Math.max(0, Math.min(255, Math.round(((n >> shift) & 255) * factor)));
  return '#' + [16, 8, 0].map((shift) => channel(shift).toString(16).padStart(2, '0')).join('');
}

export function rigFor(input: Look3dInput): Rig3d {
  const morphs: Morphs = {};
  mix(morphs, FACE[input.face ?? 'oval']); mix(morphs, EYES[input.eyeShape ?? 'almond']); mix(morphs, BROWS[input.browShape ?? 'soft-arch']);
  mix(morphs, NOSES[input.noseShape ?? 'soft']); mix(morphs, LIPS[input.lipShape ?? 'balanced']); mix(morphs, CHEEKS[input.cheekShape ?? 'soft']);
  mix(morphs, BODY[input.bodyShape ?? 'athletic']); mix(morphs, BUST[input.bust ?? 'balanced']);
  const outfit = OUTFIT[input.bartender ?? 'vest'] ?? OUTFIT.vest!;
  const tan = { none: 1, 'sun-kissed': .88, deep: .74 }[input.tanLevel ?? 'none'] ?? 1;
  const hair = HAIR[input.hairColor ?? 'espresso'] ?? HAIR.espresso!;
  const style = input.hairStyle ?? 'short';
  const visible = new Set(['cloth_shirt', 'cloth_pants', 'cloth_shoes']);
  if (outfit.vest) visible.add('cloth_vest');
  if (outfit.apron) visible.add('cloth_apron');
  return {
    morphs,
    colors: {
      skin: shade(SKIN[input.skinTone ?? 'warm'] ?? SKIN.warm!, tan), hair, iris: EYE[input.eyeColor ?? 'brown'] ?? EYE.brown!, lip: LIP[input.lipColor ?? 'bare'] ?? LIP.bare!,
      shirt: outfit.shirt, vest: outfit.vest ?? '#000000', apron: outfit.apron ?? '#000000', pants: '#15151b', shoes: '#0d0b0b', sclera: '#f2f1ee', pupil: '#050506', mouth: '#1c0508'
    },
    hair: `hair_${HAIR_MESH[style] ?? style}`,
    beard: input.facialHair && input.facialHair !== 'clean' ? `beard_${input.facialHair}` : undefined,
    visible,
    scale: (HEIGHT[input.bartenderCharacter ?? 'noa'] ?? 1) * (input.bodyShape === 'slim' ? 1.01 : 1),
    light: LIGHT[input.lighting ?? 'amber'] ?? LIGHT.amber!
  };
}

// Facial expression on top of the customised face (added to the base morphs while it plays).
export const EXPRESSION_MORPHS: Record<CharacterExpression, Morphs> = {
  neutral: {}, happy: { smile: .6 }, smile: { smile: .5 }, 'very-happy': { smile: 1, mouthOpen: .3, browRaise: .4 }, sad: { smile: -.6, browRaise: .5, browAngry: -.5 },
  worried: { smile: -.3, browRaise: .7 }, angry: { smile: -.7, browAngry: 1 }, annoyed: { smile: -.3, browAngry: .6 }, impatient: { browAngry: .4, smile: -.2 },
  confused: { browRaise: .6, smile: -.1 }, thinking: { browRaise: .3 }, surprised: { browRaise: 1, mouthOpen: .6 }, embarrassed: { smile: .2, browRaise: .3 },
  disappointed: { smile: -.5, browRaise: .2 }, impressed: { browRaise: .7, smile: .3 }
};

// Names of the clips in the GLB for the game's animation names.
export const CLIP_FOR: Record<string, string> = {
  idle: 'idle', talk: 'talk', listen: 'listen', think: 'think', pour: 'pour', shake: 'shake', stir: 'stir', serve: 'serve', garnish: 'garnish', receive: 'receive',
  'react-happy': 'react_happy', 'react-angry': 'react_angry', enter: 'wave', leave: 'wave', approach: 'idle', pay: 'receive', reach: 'serve', grab: 'receive'
};
