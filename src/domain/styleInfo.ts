import { INTERIORS, isEventInterior } from '../data/cosmetics/bars';
import { bartenderCostumesFor } from '../data/cosmetics/bartenderCostumes';
import { achievementForStyle, interiorForStyle, STYLE_PIECES_TO_CRAFT, STYLE_SHOP_PRICE, styleForInterior, styleSource, type StyleSource } from '../data/cosmetics/styleSources';
import { ACHIEVEMENTS } from './quests';

// The words the player sees about where a bartender style or a background comes from (Design and the preview).
const interiorName = (id: string) => INTERIORS.find((entry) => entry.id === id)?.name ?? '';
export const styleLabel = (character: string, value: string) => bartenderCostumesFor(character).find((entry) => entry.value === value)?.label ?? value;

export interface StyleOrigin { source: StyleSource | 'everyday'; how: string; background: string; price: number }
export function styleOrigin(character: string, value: string): StyleOrigin {
  const known = bartenderCostumesFor(character).some((entry) => entry.value === value);
  if (!known) return { source: 'everyday', how: 'An everyday outfit.', background: '', price: 0 };
  const source = styleSource(character, value);
  const interior = interiorForStyle(character, value);
  const goal = ACHIEVEMENTS.find((entry) => entry.id === achievementForStyle(character, value));
  const how = source === 'basic' ? 'Open from the start.'
    : source === 'shop' ? `Buy it for ${STYLE_SHOP_PRICE} crystals.`
    : source === 'achievement' ? `Achievement reward: ${goal?.name ?? ''}.`
    : source === 'background' ? (interior && isEventInterior(interior) ? 'Comes with its special-event background, found in Silver and Gold boxes. It is not sold on its own.' : `Comes with its background: buy the background, or craft the style from ${STYLE_PIECES_TO_CRAFT} style shards. It is not sold on its own.`)
    : `Comes from boxes: a rare full-style drop, or craft it from ${STYLE_PIECES_TO_CRAFT} style shards in the Workshop.`;
  return { source, how, background: source === 'background' && interior ? interiorName(interior) : '', price: source === 'shop' ? STYLE_SHOP_PRICE : 0 };
}

export interface InteriorOrigin { how: string; style: string; price: number; event: boolean }
export function interiorOrigin(interiorId: string): InteriorOrigin {
  const interior = INTERIORS.find((entry) => entry.id === interiorId);
  const linked = styleForInterior(interiorId);
  const event = isEventInterior(interiorId);
  const price = interior?.crystalCost ?? 0;
  const how = !price ? 'Open from the start.' : event ? 'A special-event background: found in Silver and Gold boxes.' : `Buy it for ${price} crystals, or find it in boxes.`;
  return { how, style: linked ? styleLabel(linked.character, linked.value) : '', price: event ? 0 : price, event };
}
