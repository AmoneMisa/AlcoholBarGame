import { COSMETICS } from './cosmetics';
import type { RewardLine } from './rewards';

export function ownedFirst<T>(items: readonly T[], owns: (item: T) => boolean): T[] {
  return [...items].sort((a,b)=>Number(owns(b))-Number(owns(a)));
}

// Receiving an outfit never switches the player's chosen bartender.
export function appearanceRewardOption(line: RewardLine, character: string, ownedStyles: readonly string[], ownedInteriors: readonly string[]) {
  if (!line.id) return undefined;
  if (line.kind === 'background' && ownedInteriors.includes(line.id)) return {key:'interior',value:line.id,label:'Use background'};
  if (line.kind !== 'style' || !ownedStyles.includes(line.id)) return undefined;
  const style=COSMETICS.find(item=>item.id===line.id);
  if (!style || (style.character && style.character !== character)) return undefined;
  return {key:style.key,value:style.value,label:style.key==='bartender' ? 'Wear now' : 'Use now'};
}
