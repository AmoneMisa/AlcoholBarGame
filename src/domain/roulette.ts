import { between, type Reward } from './loot';

// The daily wheel: three free spins a day. The server picks the segment and applies the prize; the screen only
// plays the animation towards that segment. The prizes are small on purpose (a few crystals, some coins, shards).
export const ROULETTE_SPINS_PER_DAY = 3;

export interface WheelSegment { id: string; label: string; icon: string; color: string; weight: number; make: (level: number, random: () => number) => Reward }

// Twelve segments, in the order they are drawn on the wheel (neighbours differ in colour and kind).
export const WHEEL: readonly WheelSegment[] = [
  { id: 'crystals-5', label: '5 crystals', icon: '💎', color: '#2f6f9f', weight: 14, make: () => ({ kind: 'crystals', amount: 5 }) },
  { id: 'coins', label: 'Coins', icon: '🪙', color: '#a8741f', weight: 16, make: (level, random) => ({ kind: 'coins', amount: Math.round(between(random, 80, 160) * (1 + level / 25)) }) },
  { id: 'style-shard', label: 'Style shard', icon: '🧵', color: '#7a3f8f', weight: 13, make: () => ({ kind: 'stylePieces', amount: 1 }) },
  { id: 'parts', label: '8 parts', icon: '🔩', color: '#4a5a6a', weight: 11, make: () => ({ kind: 'parts', amount: 8 }) },
  { id: 'crystals-15', label: '15 crystals', icon: '💎', color: '#1f8f8f', weight: 4, make: () => ({ kind: 'crystals', amount: 15 }) },
  { id: 'bronze-box', label: 'Bronze box', icon: '📦', color: '#8a5a2b', weight: 9, make: () => ({ kind: 'box', box: 'bronze' }) },
  { id: 'circle-shard', label: 'Circle shard', icon: '🤝', color: '#a23b5c', weight: 8, make: () => ({ kind: 'companionShards', amount: 1 }) },
  { id: 'xp', label: '60 XP', icon: '⭐', color: '#3f7f4a', weight: 8, make: () => ({ kind: 'xp', amount: 60 }) },
  { id: 'skin-shards', label: 'Skin shards', icon: '✨', color: '#5b4fa8', weight: 8, make: () => ({ kind: 'skinShards', amount: 6 }) },
  { id: 'booster', label: 'Booster', icon: '🚀', color: '#b04a2a', weight: 4, make: (_level, random) => ({ kind: 'consumable', id: (['xp-boost', 'coin-boost', 'tip-boost', 'happy-hour'] as const)[Math.floor(random() * 4)]!, amount: 1 }) },
  { id: 'style-shards-5', label: '5 style shards', icon: '🧵', color: '#8f3f7a', weight: 2.5, make: () => ({ kind: 'stylePieces', amount: 5 }) },
  { id: 'crystals-40', label: '40 crystals', icon: '💎', color: '#2b9fd4', weight: 1, make: () => ({ kind: 'crystals', amount: 40 }) }
];

export function spinWheel(level: number, random: () => number): { index: number; reward: Reward } {
  const total = WHEEL.reduce((sum, segment) => sum + segment.weight, 0);
  let roll = random() * total;
  let index = WHEEL.findIndex((segment) => (roll -= segment.weight) < 0);
  if (index < 0) index = 0;
  return { index, reward: WHEEL[index]!.make(level, random) };
}

export interface RouletteState { day: string; spins: number; last?: { index: number; text: string; n: number } }
export const emptyRoulette = (): RouletteState => ({ day: '', spins: 0 });
export const spinsLeft = (roulette: RouletteState, today: string) => Math.max(0, ROULETTE_SPINS_PER_DAY - (roulette.day === today ? roulette.spins : 0));
