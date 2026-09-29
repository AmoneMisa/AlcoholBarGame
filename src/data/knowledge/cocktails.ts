import { CLASSIC_GUIDES } from './cocktailsClassic';
import type { CocktailGuide } from './cocktailTypes';
import { SPIRITED_GUIDES } from './cocktailsSpirited';

export type { CocktailGuide } from './cocktailTypes';

// Every recipe in the game has a guide (checked by the test suite).
export const COCKTAIL_GUIDES: Record<string, CocktailGuide> = { ...CLASSIC_GUIDES, ...SPIRITED_GUIDES };

export const TECHNIQUE_EXPLAINED: Record<CocktailGuide['preparation']['technique'], string> = {
  shaken: 'Shaken: ingredients and ice are shaken hard in a shaker. Use it for drinks with juice, cream or egg — it mixes them fully, chills fast and adds air.',
  stirred: 'Stirred: ingredients are stirred with ice in a mixing glass. Use it for drinks made only of spirits — it keeps them clear, silky and strong.',
  built: 'Built: the drink is made directly in the serving glass. Use it for drinks topped with bubbles (so the bubbles stay alive) and for drinks where mint or fruit is pressed in the glass.',
  blended: 'Blended: mixed with ice in a blender for a frozen, slushy texture.'
};
