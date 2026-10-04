import { INTERIORS, isEventInterior } from '../data/cosmetics/bars';
import { bartenderCostumesFor } from '../data/cosmetics/bartenderCostumes';
import { achievementForStyle, interiorForStyle, STYLE_PIECES_TO_CRAFT, STYLE_SHOP_PRICE, styleForInterior, styleSource, type StyleSource } from '../data/cosmetics/styleSources';
import { ACHIEVEMENTS } from './quests';
import { restrictedTheme, PROMO_THEME_IDS, NEW_PASS_THEME_IDS, THEME_DRAW_POOLS, cosmeticTheme } from '../data/cosmetics/themeDistribution';

// The words the player sees about where a bartender style or a background comes from (Design and the preview).
const interiorName = (id: string) => INTERIORS.find((entry) => entry.id === id)?.name ?? '';
export const styleLabel = (character: string, value: string) => bartenderCostumesFor(character).find((entry) => entry.value === value)?.label ?? value;

export interface StyleOrigin { source: StyleSource | 'everyday'; how: string; background: string; price: number }
export function styleOrigin(character: string, value: string): StyleOrigin {
  const known = bartenderCostumesFor(character).some((entry) => entry.value === value);
  if (!known) return { source: 'everyday', how: 'An everyday outfit.', background: '', price: 0 };
  const source = styleSource(character, value);
  const theme=cosmeticTheme(`bartender:${value}:${character}`);
  if(theme && restrictedTheme(theme)) {
    const pool=THEME_DRAW_POOLS.find(item=>item.styleIds.includes(`bartender:${value}:${character}`));
    return {source:'box',how:PROMO_THEME_IDS.some(id=>id===theme)?'Available through promo codes.':pool?`Find this style in ${pool.name}.`:'Earn this style in its Battle Pass season.',background:interiorName(theme),price:0};
  }
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
  if(restrictedTheme(interiorId)) return {how:PROMO_THEME_IDS.some(id=>id===interiorId)?'Available through promo codes.':NEW_PASS_THEME_IDS.some(id=>id===interiorId)?'Earn this background in its Battle Pass season.':'Comes with its style from a collection draw.',style:linked?styleLabel(linked.character,linked.value):'',price:0,event:true};
  const how = !price ? 'Open from the start.' : event ? 'A special-event background: found in Silver and Gold boxes.' : `Buy it for ${price} crystals, or find it in boxes.`;
  return { how, style: linked ? styleLabel(linked.character, linked.value) : '', price: event ? 0 : price, event };
}
