import { COSMETICS, interiorForCosmetic } from './cosmetics';
import { INTERIORS, isEventInterior } from '../data/cosmetics/bars';
import { THEMED_INTERIOR_COSTUMES } from '../data/cosmetics/themedBars';
import { GAME_THEME_RECOMMENDATIONS } from '../data/cosmetics/gameThemeExpansion';
import { ACHIEVEMENT_STYLES } from '../data/cosmetics/styleSources';
import { PASS_THEMES, themeStyleIds } from './pass';
import { COMPANIONS, companionName } from './companions';
import { EQUIPMENT, type FragmentChoiceId } from './loot';
import type { RewardLine } from './rewards';
const exclusiveStyles = new Set([...PASS_THEMES.flatMap(themeStyleIds), ...Object.values(ACHIEVEMENT_STYLES).flatMap(pair => Object.entries(pair).map(([character,value]) => `bartender:${value}:${character}`))]);
for(const [interior,pair] of Object.entries({...THEMED_INTERIOR_COSTUMES,...GAME_THEME_RECOMMENDATIONS})) if(isEventInterior(interior)) for(const [character,values] of Object.entries(pair)) for(const value of values) exclusiveStyles.add(`bartender:${value}:${character}`);
const exclusiveBackgrounds = new Set([...PASS_THEMES.map(theme=>theme.interior), ...[...exclusiveStyles].map(interiorForCosmetic).filter(Boolean)]);
export function fragmentChoiceOptions(id: string): RewardLine[] {
  switch(id as FragmentChoiceId) {
    case 'style-choice': return COSMETICS.filter(item=>item.key==='bartender' && item.source!=='achievement' && !exclusiveStyles.has(item.id) && !exclusiveBackgrounds.has(interiorForCosmetic(item.id)) && !(interiorForCosmetic(item.id) && isEventInterior(interiorForCosmetic(item.id)!))).map(item=>({kind:'style',id:item.id,text:item.label,rarity:item.rarity}));
    case 'background-choice': return INTERIORS.filter(item=>!isEventInterior(item.id) && !exclusiveBackgrounds.has(item.id) && item.crystalCost>0).map(item=>({kind:'background',id:item.id,text:item.name}));
    case 'friend-choice': return COMPANIONS.map(item=>({kind:'companion',id:item.id,text:companionName(item.id)}));
    case 'equipment-choice': return EQUIPMENT.map(item=>({kind:'material',id:item.id,text:item.name}));
    default: return [];
  }
}
