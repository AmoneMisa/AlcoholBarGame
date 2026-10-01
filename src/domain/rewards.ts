import { RECIPES } from './catalog';
import { COSMETICS } from './cosmetics';
import { INTERIORS } from '../data/cosmetics/bars';
import { levelFor, type PlayerState } from '../sim/state';

// What the player just received. Built by comparing the state before and after an action, so every source
// of income (service, tips, bottle sales, daily gift, lessons, friends) is reported the same way.

export type RewardKind = 'coins' | 'tip' | 'crystals' | 'xp' | 'recipe' | 'style' | 'background' | 'card' | 'prestige' | 'level' | 'gift';
export interface RewardLine { kind: RewardKind; text: string }
export interface RewardReport { id: number; title: string; lines: RewardLine[] }

export interface Snapshot {
  money: number; crystals: number; xp: number; level: number; prestige: number;
  recipes: string[]; styles: string[]; interiors: string[]; cards: number;
}

const sum = (record: Record<string, number> | undefined) => Object.values(record ?? {}).reduce((total, value) => total + (Number(value) || 0), 0);

export function snapshot(state: PlayerState): Snapshot {
  return {
    money: state.money, crystals: state.crystals ?? 0, xp: state.xp, level: levelFor(state.xp), prestige: state.popularity ?? 0,
    recipes: [...state.knownRecipeIds], styles: [...(state.ownedCosmeticIds ?? [])], interiors: [...(state.ownedInteriorIds ?? [])],
    cards: sum(state.recipeCopies) + sum(state.cosmeticCopies)
  };
}

const plural = (count: number, one: string, many = `${one}s`) => `${count} ${count === 1 ? one : many}`;

// `message` is the game's own sentence for the action; a "Tip +N" in it is shown apart from the payment.
export function rewardLines(before: Snapshot, after: Snapshot, message = ''): RewardLine[] {
  const lines: RewardLine[] = [];
  const earned = Math.round((after.money - before.money) * 100) / 100;
  if (earned > 0) {
    const tip = Number(/Tip \+(\d+(?:\.\d+)?)/i.exec(message)?.[1] ?? 0);
    if (tip > 0 && tip < earned) {
      lines.push({ kind: 'coins', text: `+${(Math.round((earned - tip) * 100) / 100).toLocaleString('en-US')} coins` });
      lines.push({ kind: 'tip', text: `+${tip.toLocaleString('en-US')} coins tip` });
    } else if (tip > 0) lines.push({ kind: 'tip', text: `+${tip.toLocaleString('en-US')} coins tip` });
    else lines.push({ kind: 'coins', text: `+${earned.toLocaleString('en-US')} coins` });
  }
  if (after.crystals > before.crystals) lines.push({ kind: 'crystals', text: `+${(after.crystals - before.crystals).toLocaleString('en-US')} crystals` });
  if (after.xp > before.xp) lines.push({ kind: 'xp', text: `+${(after.xp - before.xp).toLocaleString('en-US')} XP` });
  if (after.level > before.level) lines.push({ kind: 'level', text: `Level ${after.level} reached` });
  for (const id of after.recipes.filter((item) => !before.recipes.includes(item))) lines.push({ kind: 'recipe', text: `New recipe: ${RECIPES.find((recipe) => recipe.id === id)?.name ?? id}` });
  for (const id of after.styles.filter((item) => !before.styles.includes(item))) lines.push({ kind: 'style', text: `New style: ${COSMETICS.find((item) => item.id === id)?.label ?? id}` });
  for (const id of after.interiors.filter((item) => !before.interiors.includes(item))) lines.push({ kind: 'background', text: `New background: ${INTERIORS.find((item) => item.id === id)?.name ?? id}` });
  if (after.cards > before.cards) lines.push({ kind: 'card', text: `+${plural(after.cards - before.cards, 'spare card')}` });
  if (after.prestige > before.prestige) lines.push({ kind: 'prestige', text: `+${after.prestige - before.prestige} prestige` });
  return lines;
}
