import type { BoxKind, Reward } from './loot';
import type { StatId } from './quests';
import { NEW_PASS_THEME_IDS } from '../data/cosmetics/themeDistribution';

// The season pass: one pass every two weeks, twenty levels. Points come from normal play (serving, lessons, VIPs,
// bottles, boxes …), counted from the day the pass starts, so there is nothing extra to do. Every level has a free
// reward and a premium reward (the premium track is bought once per pass with crystals). Crystals and shards are only on
// the premium track. Level 14 gives the season's
// costumes (one for each bartender) and level 20 its background.
export const PASS_DAYS = 14;
export const PASS_MS = PASS_DAYS * 24 * 60 * 60 * 1000;
export const PASS_LEVELS = 20;
export const PASS_LEVEL_POINTS = 75;
// Priced so that a free player can only afford it by playing about nine days in ten and finishing the weekly quests:
// over 14 days that is roughly 440 crystals (daily reward, lessons, the wheel, weekly quests), while
// someone playing seven days in ten ends near 330. Premium rewards stay claimable, so buying late loses nothing.
export const PASS_PREMIUM_PRICE = 450;
// Crystals can also buy levels: one level costs this much, whatever part of the level is already filled.
export const PASS_LEVEL_PRICE = 40;

// How many pass points each thing is worth. Only counters that the server rules raise are used.
export const PASS_POINTS: Partial<Record<StatId, number>> = {
  serves: 2, vips: 6, bottles: 4, boxes: 3, lessons: 12, perfectTalks: 5, tasted: 4, upgrades: 3, signatures: 3
};

// What gives pass points, in words, for the pass screen: the same list the points are counted from.
export const PASS_SOURCES: readonly { stat: StatId; label: string }[] = [
  { stat: 'lessons', label: 'Finish a daily English lesson set' },
  { stat: 'vips', label: 'Serve a VIP guest' },
  { stat: 'perfectTalks', label: 'Have a perfect English conversation' },
  { stat: 'bottles', label: 'Sell a sealed bottle' },
  { stat: 'tasted', label: 'Serve a recipe or brand for the first time' },
  { stat: 'boxes', label: 'Open a box' },
  { stat: 'upgrades', label: 'Upgrade equipment' },
  { stat: 'signatures', label: 'Serve your signature cocktail' },
  { stat: 'serves', label: 'Serve a perfect drink' }
];

export type PassReward = Reward | { kind: 'interior'; id: string } | { kind: 'cosmetics'; ids: string[] };
export interface PassTheme { id: string; name: string; tagline: string; interior: string; noa: string; leo: string }
const outfit = (character: 'noa' | 'leo', value: string) => `bartender:${value}:${character}`;
export const themeStyleIds = (theme: PassTheme) => [outfit('noa', theme.noa), outfit('leo', theme.leo)];

// The pass rotates through these seasons. Every season is built on a game: its background plus a costume for Noa and
// one for Leo from that game. A player's first pass is the first season below and the rest follow in this order, so new
// seasons are only ever added at the END: nobody's running or announced season changes (see the schedule test).
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
  { id: 'assassins-creed', name: 'Assassin’s Creed', tagline: 'A hidden tavern in Venice, the best seat has a view of the door.', interior: 'assassins-creed', noa: 'theme-assassins-creed-noa', leo: 'theme-assassins-creed-leo' },
  ...NEW_PASS_THEME_IDS.map(id=>({id,name:({'gta':'GTA: Vice City','gta-5':'GTA V','gta-sa':'GTA: San Andreas','gta-3':'GTA III','palworld':'Palworld','devil-may-cry':'Devil May Cry','darksiders-3':'Darksiders III','baldurs-gate-3':'Baldur’s Gate 3','diablo-4':'Diablo IV'} as Record<string,string>)[id]!,tagline:'A new world for your bar, with matching styles for both bartenders.',interior:id,noa:`theme-${id}-noa`,leo:`theme-${id}-leo`}))
];

// Every player has their own pass clock: it starts the first time the game sees them, so a new player begins with the
// first season and then follows the rotation from there, 14 days at a time. Nothing depends on the date on the server.
export const passCycleOf = (epoch: number, now: number) => Math.max(0, Math.floor((now - epoch) / PASS_MS));
export const passIdOf = (epoch: number, now: number) => `pass-${passCycleOf(epoch, now)}`;
export const passThemeOf = (epoch: number, now: number) => PASS_THEMES[passCycleOf(epoch, now) % PASS_THEMES.length]!;
export const passStartsOf = (epoch: number, now: number) => epoch + passCycleOf(epoch, now) * PASS_MS;
export const passEndsOf = (epoch: number, now: number) => passStartsOf(epoch, now) + PASS_MS;
// The old shared clock (one pass for everybody). Only used to carry players who were already in a pass over to their own.
export const PASS_SHARED_EPOCH = Date.UTC(2026, 0, 5);
export const sharedPassStart = (now: number) => PASS_SHARED_EPOCH + Math.floor((now - PASS_SHARED_EPOCH) / PASS_MS) * PASS_MS;
export const sharedPassId = (now: number) => `pass-${Math.floor((now - PASS_SHARED_EPOCH) / PASS_MS)}`;

export const passLevelPoints = (stats: Partial<Record<string, number>>, base: Partial<Record<string, number>>, bonus = 0) => passPointsFor(stats, base) + Math.max(0, bonus);
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
  coins(200), { kind: 'parts', amount: 10 }, coins(250), box('bronze'), { kind: 'parts', amount: 12 }, { kind: 'xp', amount: 150 }, coins(300), box('silver'), { kind: 'parts', amount: 15 }, coins(350),
  coins(400), { kind: 'xp', amount: 150 }, box('bronze'), { kind: 'xp', amount: 200 }, coins(450), box('silver'), { kind: 'parts', amount: 20 }, { kind: 'xp', amount: 250 }, coins(500)
];
const booster = (id: 'xp-boost' | 'coin-boost' | 'tip-boost' | 'happy-hour', amount = 1): Reward => ({ kind: 'consumable', id, amount });
const supplies = (size: 'small' | 'medium' | 'large'): Reward => ({ kind: 'supplies', size });
const prestige = (amount: number): Reward => ({ kind: 'prestige', amount });
// Crystals and every kind of shard are premium rewards, so the free track never hands out the pass's best currency.
const skin = (amount: number): Reward => ({ kind: 'skinShards', amount });
const PREMIUM: Reward[][] = [
  [supplies('small')], [coins(300)], [crystals(10), booster('coin-boost')], [prestige(1)], [shards(3), supplies('medium')],
  [skin(8), coins(400)], [crystals(15), booster('tip-boost')], [prestige(1)], [circle(2), supplies('medium')], [crystals(20), coins(600), prestige(1)],
  [booster('xp-boost', 2)], [shards(5), supplies('large')], [coins(600)], [prestige(2)], [crystals(20), booster('coin-boost', 2)],
  [supplies('large')], [circle(3), coins(800)], [shards(8), booster('happy-hour', 2)], [crystals(25), prestige(2)], [crystals(30), supplies('large'), coins(1000), prestige(3), booster('xp-boost', 3)]
];

export interface PassLevelRewards { level: number; free: PassReward[]; premium: PassReward[] }
export function passRewards(theme: PassTheme): PassLevelRewards[] {
  return Array.from({ length: PASS_LEVELS }, (_, index) => {
    const level = index + 1;
    const free: PassReward[] = level === PASS_STYLES_LEVEL ? [{ kind: 'cosmetics', ids: themeStyleIds(theme) }]
      : level === PASS_LEVELS ? [{ kind: 'interior', id: theme.interior }, box('gold')]
      : [FREE[index]!];
    return { level, free, premium: PREMIUM[index]! };
  });
}

export interface PassState { /** Points bought with crystals in this pass (see PASS_LEVEL_PRICE). */ bonus: number; id: string; /** When this player's first pass began (0 until the game has seen them). */ epoch: number; base: Record<string, number>; premium: boolean; claimed: string[] }
export const emptyPass = (): PassState => ({ bonus: 0, id: '', epoch: 0, base: {}, premium: false, claimed: [] });
export const passClaimKey = (track: 'free' | 'premium', level: number) => `${track === 'free' ? 'f' : 'p'}${level}`;

/** How many rewards the player can claim right now: every reached level not yet claimed, and the premium ones once bought. */
export function readyPassRewards(level: number, premium: boolean, claimed: readonly string[]): number {
  let ready = 0;
  for (let at = 1; at <= Math.min(level, PASS_LEVELS); at++) {
    if (!claimed.includes(passClaimKey('free', at))) ready++;
    if (premium && !claimed.includes(passClaimKey('premium', at))) ready++;
  }
  return ready;
}
