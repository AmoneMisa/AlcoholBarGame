import type { BoxKind, Reward } from './loot';
import type { StatId } from './quests';

// The season pass: one pass every two weeks, twenty levels. Points come from normal play (serving, lessons, VIPs,
// bottles, boxes …), counted from the day the pass starts, so there is nothing extra to do. Every level has a free
// reward and a premium reward (the premium track is bought once per pass with crystals). The last level gives the
// season's background and the costumes of both bartenders that go with it.
export const PASS_DAYS = 14;
export const PASS_MS = PASS_DAYS * 24 * 60 * 60 * 1000;
// Passes run in fixed two-week cycles counted from a Monday, so every player sees the same pass at the same time.
export const PASS_EPOCH = Date.UTC(2026, 0, 5);
export const PASS_LEVELS = 20;
export const PASS_LEVEL_POINTS = 75;
// Priced so that a free player can only afford it by playing about nine days in ten and finishing the weekly quests:
// over 14 days that is roughly 540 crystals (daily reward, lessons, the wheel, weekly quests, the free track), while
// someone playing seven days in ten ends near 330. Premium rewards stay claimable, so buying late loses nothing.
export const PASS_PREMIUM_PRICE = 450;

// How many pass points each thing is worth. Only counters that the server rules raise are used.
export const PASS_POINTS: Partial<Record<StatId, number>> = {
  serves: 2, vips: 6, bottles: 4, boxes: 3, lessons: 12, perfectTalks: 5, tasted: 4, upgrades: 3, signatures: 3
};

export type PassReward = Reward | { kind: 'interior'; id: string } | { kind: 'cosmetics'; ids: string[] };
export interface PassTheme { id: string; name: string; tagline: string; interior: string; noa: string; leo: string }
const outfit = (character: 'noa' | 'leo', value: string) => `bartender:${value}:${character}`;
export const themeStyleIds = (theme: PassTheme) => [outfit('noa', theme.noa), outfit('leo', theme.leo)];

// The pass rotates through these seasons. Every season is built on a game: its background plus a costume for Noa and
// one for Leo from that game. The order matters: the pass in progress must not change under the players, so the
// season now running stays where it is (see the schedule test) and new ones are added after it.
export const PASS_THEMES: readonly PassTheme[] = [
  { id: 'nfs-underground', name: 'Need for Speed: Underground', tagline: 'The tuner bar: neon, nitrous and a long line at the garage door.', interior: 'nfs-underground', noa: 'theme-nfs-underground-noa', leo: 'theme-nfs-underground-leo' },
  { id: 'lost-ark', name: 'Lost Ark', tagline: 'A beach club at the end of the world, sunset included.', interior: 'lost-ark', noa: 'theme-lost-ark-bard-noa', leo: 'theme-lost-ark-berserker-leo' },
  { id: 'lineage-2', name: 'Lineage II', tagline: 'The Aden tavern: elves, mages and a long night at the bar.', interior: 'lineage-2', noa: 'theme-l2-elf-noa', leo: 'theme-l2-elf-leo' },
  { id: 'warcraft-3', name: 'Warcraft III', tagline: 'The crossroads bar, where heroes of every side share a table.', interior: 'warcraft-3', noa: 'theme-wc3-sylvanas-noa', leo: 'theme-wc3-arthas-leo' },
  { id: 'mass-effect', name: 'Mass Effect', tagline: 'The Citadel lounge: a drink between missions.', interior: 'mass-effect', noa: 'theme-shepard-noa', leo: 'theme-shepard-leo' },
  { id: 'perfect-world', name: 'Perfect World', tagline: 'A celestial bar above the clouds, open to every race.', interior: 'perfect-world', noa: 'theme-pw-winged-elf-noa', leo: 'theme-pw-winged-elf-leo' },
  { id: 'nfs-most-wanted', name: 'Need for Speed: Most Wanted', tagline: 'The garage bar: every regular has a story about the chase.', interior: 'nfs-most-wanted', noa: 'theme-mw-noa', leo: 'theme-mw-leo' },
  { id: 'allods', name: 'Allods Online', tagline: 'The astral bar, floating between worlds.', interior: 'allods', noa: 'theme-allods-elf-noa', leo: 'theme-allods-elf-leo' },
  { id: 'nfs-carbon', name: 'Need for Speed: Carbon', tagline: 'The night garage bar, canyon runs and cold drinks.', interior: 'nfs-carbon', noa: 'theme-carbon-noa', leo: 'theme-carbon-leo' }
];

export const passCycle = (now: number) => Math.floor((now - PASS_EPOCH) / PASS_MS);
export const passId = (now: number) => `pass-${passCycle(now)}`;
export const passThemeAt = (now: number) => PASS_THEMES[((passCycle(now) % PASS_THEMES.length) + PASS_THEMES.length) % PASS_THEMES.length]!;
export const passStartsAt = (now: number) => PASS_EPOCH + passCycle(now) * PASS_MS;
export const passEndsAt = (now: number) => passStartsAt(now) + PASS_MS;

export const passLevel = (points: number) => Math.min(PASS_LEVELS, Math.floor(Math.max(0, points) / PASS_LEVEL_POINTS));
export const passPointsFor = (stats: Partial<Record<string, number>>, base: Partial<Record<string, number>>) =>
  Object.entries(PASS_POINTS).reduce((sum, [stat, weight]) => sum + Math.max(0, (stats[stat] ?? 0) - (base[stat] ?? 0)) * weight!, 0);

const box = (kind: Exclude<BoxKind, 'choice'>): Reward => ({ kind: 'box', box: kind });
const crystals = (amount: number): Reward => ({ kind: 'crystals', amount });
const coins = (amount: number): Reward => ({ kind: 'coins', amount });
const shards = (amount: number): Reward => ({ kind: 'stylePieces', amount });
const circle = (amount: number): Reward => ({ kind: 'companionShards', amount });

// Rewards per level. The last free level is the season's grand prize (filled in from the season's theme).
const FREE: Reward[] = [
  coins(200), { kind: 'parts', amount: 10 }, crystals(10), box('bronze'), shards(3), { kind: 'skinShards', amount: 8 }, crystals(15), box('silver'), circle(2), crystals(20),
  coins(400), shards(5), box('bronze'), { kind: 'xp', amount: 200 }, crystals(20), box('silver'), circle(3), shards(8), crystals(25)
];
const PREMIUM: Reward[] = [
  box('bronze'), crystals(10), shards(3), coins(300), box('silver'), crystals(15), circle(2), { kind: 'parts', amount: 20 }, crystals(15), box('gold'),
  shards(5), crystals(20), box('silver'), { kind: 'skinShards', amount: 15 }, circle(3), crystals(25), box('silver'), crystals(25), shards(10), box('gold')
];

export interface PassLevelRewards { level: number; free: PassReward[]; premium: PassReward[] }
export function passRewards(theme: PassTheme): PassLevelRewards[] {
  return Array.from({ length: PASS_LEVELS }, (_, index) => {
    const level = index + 1;
    const final = level === PASS_LEVELS;
    return {
      level,
      free: final ? [{ kind: 'interior', id: theme.interior }, { kind: 'cosmetics', ids: themeStyleIds(theme) }, crystals(30)] : [FREE[index]!],
      premium: [PREMIUM[index]!, ...(final ? [crystals(50)] : [])]
    };
  });
}

export interface PassState { id: string; base: Record<string, number>; premium: boolean; claimed: string[] }
export const emptyPass = (): PassState => ({ id: '', base: {}, premium: false, claimed: [] });
export const passClaimKey = (track: 'free' | 'premium', level: number) => `${track === 'free' ? 'f' : 'p'}${level}`;
