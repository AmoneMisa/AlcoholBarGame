import type { BoxKind, Reward } from './loot';
import type { StatId } from './quests';

// The season pass: one pass every two weeks, twenty levels. Points come from normal play (serving, lessons, VIPs,
// bottles, boxes …), counted from the day the pass starts, so there is nothing extra to do. Every level has a free
// reward and a premium reward (the premium track is bought once per pass with crystals). Level 14 gives the season's
// costumes (one for each bartender) and level 20 its background.
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
// one for Leo from that game. The first one is the pass that began on 28 September 2026 (cycle 19) and the rest
// follow in this order, so new seasons are only ever added at the END: the schedule of every pass already running or
// announced stays as it is (see the schedule test).
export const PASS_THEMES: readonly PassTheme[] = [
  { id: 'lost-ark', name: 'Lost Ark', tagline: 'A beach club at the end of the world, sunset included.', interior: 'lost-ark', noa: 'theme-lost-ark-bard-noa', leo: 'theme-lost-ark-berserker-leo' },
  { id: 'lineage-2', name: 'Lineage II', tagline: 'The Aden tavern: elves, mages and a long night at the bar.', interior: 'lineage-2', noa: 'theme-l2-elf-noa', leo: 'theme-l2-elf-leo' },
  { id: 'warcraft-3', name: 'Warcraft III', tagline: 'The crossroads bar, where heroes of every side share a table.', interior: 'warcraft-3', noa: 'theme-wc3-sylvanas-noa', leo: 'theme-wc3-arthas-leo' },
  { id: 'mass-effect', name: 'Mass Effect', tagline: 'The Citadel lounge: a drink between missions.', interior: 'mass-effect', noa: 'theme-shepard-noa', leo: 'theme-shepard-leo' },
  { id: 'perfect-world', name: 'Perfect World', tagline: 'A celestial bar above the clouds, open to every race.', interior: 'perfect-world', noa: 'theme-pw-winged-elf-noa', leo: 'theme-pw-winged-elf-leo' },
  { id: 'nfs-most-wanted', name: 'Need for Speed: Most Wanted', tagline: 'The garage bar: every regular has a story about the chase.', interior: 'nfs-most-wanted', noa: 'theme-mw-noa', leo: 'theme-mw-leo' },
  { id: 'allods', name: 'Allods Online', tagline: 'The astral bar, floating between worlds.', interior: 'allods', noa: 'theme-allods-elf-noa', leo: 'theme-allods-elf-leo' },
  { id: 'nfs-carbon', name: 'Need for Speed: Carbon', tagline: 'The night garage bar, canyon runs and cold drinks.', interior: 'nfs-carbon', noa: 'theme-carbon-noa', leo: 'theme-carbon-leo' },
  { id: 'nfs-underground', name: 'Need for Speed: Underground', tagline: 'The tuner bar: neon, nitrous and a long line at the garage door.', interior: 'nfs-underground', noa: 'theme-nfs-underground-noa', leo: 'theme-nfs-underground-leo' },
  { id: 'witcher-3', name: 'The Witcher 3', tagline: 'The Novigrad tavern, where every contract starts over a drink.', interior: 'witcher-3', noa: 'theme-witcher-3-noa', leo: 'theme-witcher-3-leo' },
  { id: 'cyberpunk-2077', name: 'Cyberpunk 2077', tagline: 'The Night City lounge: chrome, neon and quiet deals.', interior: 'cyberpunk-2077', noa: 'theme-cyberpunk-2077-noa', leo: 'theme-cyberpunk-2077-leo' },
  { id: 'minecraft', name: 'Minecraft', tagline: 'A taproom in the block village, built one cube at a time.', interior: 'minecraft', noa: 'theme-minecraft-noa', leo: 'theme-minecraft-leo' },
  { id: 'skyrim', name: 'Skyrim', tagline: 'The Whiterun mead hall, warm fire and louder songs.', interior: 'skyrim', noa: 'theme-skyrim-noa', leo: 'theme-skyrim-leo' },
  { id: 'stellar-blade', name: 'Stellar Blade', tagline: 'The Xion lounge, the last bright place on a broken Earth.', interior: 'stellar-blade', noa: 'theme-stellar-blade-noa', leo: 'theme-stellar-blade-leo' },
  { id: 'heroes-3', name: 'Heroes of Might and Magic III', tagline: 'The Erathia inn, where armies rest between campaigns.', interior: 'heroes-3', noa: 'theme-heroes-3-noa', leo: 'theme-heroes-3-leo' },
  { id: 'borderlands', name: 'Borderlands', tagline: 'The Pandora saloon: loot, bullets and very cold beer.', interior: 'borderlands', noa: 'theme-borderlands-noa', leo: 'theme-borderlands-leo' },
  { id: 'elden-ring', name: 'Elden Ring', tagline: 'A tavern in the Lands Between for those who still hope.', interior: 'elden-ring', noa: 'theme-elden-ring-noa', leo: 'theme-elden-ring-leo' },
  { id: 'detroit', name: 'Detroit: Become Human', tagline: 'The android lounge, where nobody asks who is who.', interior: 'detroit', noa: 'theme-detroit-noa', leo: 'theme-detroit-leo' },
  { id: 'assassins-creed', name: 'Assassin’s Creed', tagline: 'A hidden tavern in Venice, the best seat has a view of the door.', interior: 'assassins-creed', noa: 'theme-assassins-creed-noa', leo: 'theme-assassins-creed-leo' }
];

export const passCycle = (now: number) => Math.floor((now - PASS_EPOCH) / PASS_MS);
export const passId = (now: number) => `pass-${passCycle(now)}`;
const FIRST_THEME_CYCLE = 19;
export const passThemeAt = (now: number) => PASS_THEMES[(((passCycle(now) - FIRST_THEME_CYCLE) % PASS_THEMES.length) + PASS_THEMES.length) % PASS_THEMES.length]!;
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

// Rewards per level. The free track ends with the season's two prizes: the costumes of both bartenders at level 14 and
// the background (with its connected style) at level 20. The premium track is for the bar itself: supplies, coins,
// boosters and prestige.
export const PASS_STYLES_LEVEL = 14;
const FREE: Reward[] = [
  coins(200), { kind: 'parts', amount: 10 }, crystals(10), box('bronze'), shards(3), { kind: 'skinShards', amount: 8 }, crystals(15), box('silver'), circle(2), crystals(20),
  coins(400), shards(5), box('bronze'), { kind: 'xp', amount: 200 }, crystals(20), box('silver'), circle(3), shards(8), crystals(25)
];
const booster = (id: 'xp-boost' | 'coin-boost' | 'tip-boost' | 'happy-hour', amount = 1): Reward => ({ kind: 'consumable', id, amount });
const supplies = (size: 'small' | 'medium' | 'large'): Reward => ({ kind: 'supplies', size });
const prestige = (amount: number): Reward => ({ kind: 'prestige', amount });
const PREMIUM: Reward[][] = [
  [supplies('small')], [coins(300)], [booster('coin-boost')], [prestige(1)], [supplies('medium')],
  [coins(400)], [booster('tip-boost')], [prestige(1)], [supplies('medium')], [coins(600), prestige(1)],
  [booster('xp-boost', 2)], [supplies('large')], [coins(600)], [prestige(2)], [booster('coin-boost', 2)],
  [supplies('large')], [coins(800)], [booster('happy-hour', 2)], [prestige(2)], [supplies('large'), coins(1000), prestige(3), booster('xp-boost', 3)]
];

export interface PassLevelRewards { level: number; free: PassReward[]; premium: PassReward[] }
export function passRewards(theme: PassTheme): PassLevelRewards[] {
  return Array.from({ length: PASS_LEVELS }, (_, index) => {
    const level = index + 1;
    const free: PassReward[] = level === PASS_STYLES_LEVEL ? [{ kind: 'cosmetics', ids: themeStyleIds(theme) }]
      : level === PASS_LEVELS ? [{ kind: 'interior', id: theme.interior }, crystals(30)]
      : [FREE[index]!];
    return { level, free, premium: PREMIUM[index]! };
  });
}

export interface PassState { id: string; base: Record<string, number>; premium: boolean; claimed: string[] }
export const emptyPass = (): PassState => ({ id: '', base: {}, premium: false, claimed: [] });
export const passClaimKey = (track: 'free' | 'premium', level: number) => `${track === 'free' ? 'f' : 'p'}${level}`;
