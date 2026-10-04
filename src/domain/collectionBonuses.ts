import { COSMETICS } from './cosmetics';
import { INTERIORS } from '../data/cosmetics/bars';

export interface CollectionOwnership { ownedCosmeticIds?: readonly string[]; ownedInteriorIds?: readonly string[] }
const styles = new Set(COSMETICS.filter(item => item.key === 'bartender').map(item => item.id));
const backgrounds = new Set(INTERIORS.filter(item => item.id !== 'velvet').map(item => item.id as string));
// Permanent ownership only: previews, copies, fragments and starter appearances do not count.
export function collectionBonuses(state: CollectionOwnership) {
  const styleCount = new Set((state.ownedCosmeticIds ?? []).filter(id => styles.has(id))).size;
  const backgroundCount = new Set((state.ownedInteriorIds ?? []).filter(id => backgrounds.has(id))).size;
  const count = styleCount + backgroundCount;
  const rate = Math.min(.10, Math.floor(count / 5) * .005);
  const offlineRate = Math.min(.20, Math.floor(count / 5) * .01);
  const extraSpins = Math.min(4, Math.floor(count / 16));
  const visitPrestige = Math.min(4, Math.floor(count / 20));
  return { styleCount, backgroundCount, count, rate, offlineRate, extraSpins, visitPrestige };
}
export const collectionReward = (amount: number, state?: CollectionOwnership) => Math.round(amount * (1 + (state ? collectionBonuses(state).rate : 0)));
