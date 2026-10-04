import { ACHIEVEMENTS, achievementById, bestTiers } from './quests';
import { validWishlist } from './wishlist';
import type { RegionId } from './types';

// The player profile: what a visitor (or the player) sees about a bar. Built only from the saved state, on the server
// for friends and on the device for the player's own screen, so both always agree.

export const FEATURED_MAX = 5;

export interface ProfileStats {
  served: number;
  servedByBar: Record<string, number>;
  languageStats: { sentences: number; correct: number };
  ownedBarIds: RegionId[];
  loot: { achievements: string[] };
  featuredAchievements?: string[];
  wishedGifts?: string[];
}

export interface ProfileAchievement { id: string; name: string; series: string; seriesName: string; tier: number; tierName: string }

export interface PlayerProfile {
  /** Drinks served and bottles sold, all bars together. */
  served: number;
  servedByBar: Record<string, number>;
  /** The bar where most guests were served (undefined until someone was served). */
  favoriteBarId?: string;
  ownedBarIds: string[];
  /** Share of the player's English sentences that were correct, 0-100 (undefined before the first sentence). */
  englishPercent?: number;
  sentences: number;
  achievementCount: number;
  achievementTotal: number;
  /** Up to five achievements to show: the ones the player picked, otherwise the last earned. */
  shown: ProfileAchievement[];
  picked: boolean;
  wishedGifts?: string[];
}

// Every series is shown once, at the highest tier the player has earned.
const named = (ids: string[]): ProfileAchievement[] => bestTiers(ids).map((goal) => ({ id: goal.id, name: goal.name, series: goal.series, seriesName: goal.seriesName, tier: goal.tier, tierName: goal.tierName }));

export function buildPlayerProfile(state: ProfileStats): PlayerProfile {
  const byBar = Object.fromEntries(Object.entries(state.servedByBar ?? {}).filter(([, count]) => count > 0));
  const favorite = Object.entries(byBar).sort((a, b) => b[1] - a[1])[0]?.[0];
  const earned = state.loot.achievements.filter((id) => !!achievementById(id));
  const picked = (state.featuredAchievements ?? []).filter((id) => earned.includes(id)).slice(0, FEATURED_MAX);
  const best = named(earned);
  // A picked achievement shows at the highest tier of its series, even if a higher one was earned after the pick.
  const pickedBest = [...new Set(picked.map((id) => achievementById(id)!.series))].map((series) => best.find((item) => item.series === series)!);
  const shown = picked.length ? pickedBest : best.slice(-FEATURED_MAX).reverse();
  const { sentences, correct } = state.languageStats;
  return {
    served: state.served,
    servedByBar: byBar,
    favoriteBarId: favorite,
    ownedBarIds: [...state.ownedBarIds],
    englishPercent: sentences > 0 ? Math.round((correct / sentences) * 100) : undefined,
    sentences,
    achievementCount: earned.length,
    achievementTotal: ACHIEVEMENTS.length,
    shown,
    picked: picked.length > 0,
    wishedGifts:validWishlist(state.wishedGifts)
  };
}

/** What the player can choose to show: the highest tier earned in every series. */
export const earnedAchievements = (state: Pick<ProfileStats, 'loot'>): ProfileAchievement[] => named(state.loot.achievements);
