import {
  BLUSH_OPTIONS, BROW_SHAPES, CHEEK_SHAPES, EYELINER_OPTIONS, EYESHADOW_OPTIONS, EYE_COLORS, EYE_SHAPES,
  FACE_SHAPES, FACIAL_HAIR_OPTIONS, LEO_HAIR_STYLES, LIP_COLORS, LIP_SHAPES, NOA_HAIR_STYLES, NOSE_SHAPES
} from '../data/cosmetics/bars';
import { BARTENDER_COSTUMES, bartenderCostumeFor, REFERENCE_COSTUME_IDS } from '../data/cosmetics/bartenderCostumes';
import { interiorForStyle, styleSource, STYLE_CHARACTERS, type StyleSource } from '../data/cosmetics/styleSources';

export type CosmeticKey = 'bartender' | 'hairStyle' | 'face' | 'eyeShape' | 'browShape' | 'noseShape' | 'lipShape' | 'cheekShape' | 'eyeColor' | 'eyeliner' | 'eyeshadow' | 'lipColor' | 'blush' | 'facialHair';
export interface CosmeticItem { id:string; key:CosmeticKey; value:string; label:string; character?:'noa'|'leo'; rarity:'common'|'rare'|'legendary'; source?:StyleSource }

const title = (value:string) => value.split('-').map((part) => part[0]!.toUpperCase() + part.slice(1)).join(' ');
const item = (key:CosmeticKey, value:string, rarity:CosmeticItem['rarity']='common', character?:CosmeticItem['character'], label?:string, source?:StyleSource):CosmeticItem => ({ id:`${key}:${value}${character ? `:${character}` : ''}`,key,value,label:label ?? title(value),rarity,character,source });
const except = (values:readonly string[], free:readonly string[]) => values.filter((value) => !free.includes(value));

export const COSMETICS: CosmeticItem[] = [
  ...except(NOA_HAIR_STYLES,['updo']).map((value) => item('hairStyle',value,'rare','noa')),
  ...except(LEO_HAIR_STYLES,['slick','undercut']).map((value) => item('hairStyle',value,'rare','leo')),
  ...except(FACE_SHAPES,['soft','angular']).map((value) => item('face',value,'rare')),
  ...except(EYE_SHAPES,['almond','hooded']).map((value) => item('eyeShape',value)),
  ...except(BROW_SHAPES,['soft-arch','bold']).map((value) => item('browShape',value)),
  ...except(NOSE_SHAPES,['soft','straight']).map((value) => item('noseShape',value)),
  ...except(LIP_SHAPES,['full','balanced']).map((value) => item('lipShape',value)),
  ...except(CHEEK_SHAPES,['high','defined']).map((value) => item('cheekShape',value)),
  ...except(EYE_COLORS,['hazel','brown']).map((value) => item('eyeColor',value)),
  ...except(EYELINER_OPTIONS,['winged','none']).map((value) => item('eyeliner',value,'common','noa')),
  ...except(EYESHADOW_OPTIONS,['bronze','smoky','none']).map((value) => item('eyeshadow',value,'common','noa')),
  ...except(LIP_COLORS,['rose','berry','bare']).map((value) => item('lipColor',value,'common','noa')),
  ...except(BLUSH_OPTIONS,['soft','none']).map((value) => item('blush',value,'common','noa')),
  ...except(FACIAL_HAIR_OPTIONS,['clean','short-beard']).map((value) => item('facialHair',value,'rare','leo')),
  ...['special-gala','special-cyberpunk','special-steampunk','special-post-apocalypse','special-historical','special-fantasy'].map((value) => item('bartender',value,'legendary','noa')),
  ...['special-cyberpunk','special-steampunk','special-post-apocalypse','special-historical','special-fantasy','special-masquerade'].map((value) => item('bartender',value,'legendary','leo')),
  // The painted styles: three per bartender are open from the start (no item); the rest must be earned or bought.
  ...STYLE_CHARACTERS.flatMap((character) => BARTENDER_COSTUMES[character]
    .filter((costume) => styleSource(character, costume.value) !== 'basic')
    .map((costume) => item('bartender', costume.value, 'rare', character, costume.label, styleSource(character, costume.value))))
];

// Draws, the daily roulette, Spark and skin shards only hand out these: the painted styles have their own ways in.
export const DRAWABLE_COSMETICS = COSMETICS.filter((entry) => !entry.source);

// The background connected to a style (each background has exactly one style). Owning the style gives the background.
export const interiorForCosmetic = (id:string) => {
  const entry = COSMETICS.find((candidate) => candidate.id === id);
  return entry?.key === 'bartender' && entry.character ? interiorForStyle(entry.character, entry.value) : undefined;
};

// Facial hair now works on the imported avatar too. Keep the original item IDs
// so previously awarded Leo cosmetics remain owned after this update.
const matchesCharacter = (entry:CosmeticItem, character?:string) => !entry.character || entry.character === character || entry.key === 'facialHair';
export const cosmeticFor = (key:string,value:string,character?:string) => COSMETICS.find((entry) => entry.key === key && entry.value === value && matchesCharacter(entry,character));
export const canUseCosmetic = (owned:readonly string[], key:string,value:string,character?:string) => {
  if (key === 'bartender' && character && (REFERENCE_COSTUME_IDS as readonly string[]).includes(value) && !bartenderCostumeFor(character, value)) return false;
  const variants = COSMETICS.filter((entry) => entry.key === key && entry.value === value);
  if (variants.length && !variants.some((entry) => matchesCharacter(entry,character))) return false;
  const cosmetic = cosmeticFor(key,value,character);
  return !cosmetic || owned.includes(cosmetic.id);
};

