import { COSMETICS } from '../domain/cosmetics';
import { INTERIORS, isEventInterior } from '../data/cosmetics/bars';
import { styleForInterior } from '../data/cosmetics/styleSources';
import type { PlayerState } from './state';

export const styleInUse = (state: PlayerState, cosmeticId: string) => {
  const item = COSMETICS.find(entry => entry.id === cosmeticId);
  return !!item && Object.values(state.bars).some(bar => bar.bartender === item.value && (bar.bartenderCharacter ?? 'noa') === item.character);
};
export const interiorInUse = (state: PlayerState, interiorId: string) => Object.values(state.bars).some(bar => bar.interior === interiorId);
const connectedStyleId = (interiorId: string) => { const linked = styleForInterior(interiorId); return linked ? `bartender:${linked.value}:${linked.character}` : ''; };
export const giftableStyles = (state: PlayerState) => COSMETICS.filter(item => item.source === 'box' && state.ownedCosmeticIds.includes(item.id) && !styleInUse(state, item.id));
export const giftableInteriors = (state: PlayerState) => INTERIORS.filter(item => isEventInterior(item.id) && state.ownedInteriorIds.includes(item.id)
  && !interiorInUse(state, item.id) && !(connectedStyleId(item.id) && styleInUse(state, connectedStyleId(item.id))));
