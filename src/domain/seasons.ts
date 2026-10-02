import { DRAWABLE_COSMETICS } from './cosmetics';

// Seasonal banner: one season per UTC calendar month. Its banner raises the odds of two featured legendary styles,
// counts the player's draws, pays milestone boxes, and lets them pick a featured style after SPARK_DRAWS draws.
// Styles are never locked to a season; every legendary is featured once a year and can always be crafted from shards.
export const SEASON_THEMES = [
  ['Winter Gala', 'Snow on the windows and champagne on the bar.'], ['Velvet Romance', 'Candlelight, dark wood and slow jazz.'],
  ['Lucky Night', 'Green lanterns and a pour for good fortune.'], ['Spring Terrace', 'Fresh herbs, open windows, first sunshine.'],
  ['Garden Party', 'Flowers in every glass.'], ['Midsummer Rooftop', 'The longest evening of the year.'],
  ['Beach Club', 'Salt air, ice and a long horizon.'], ['Sunset Bazaar', 'Spice, brass and golden hour.'],
  ['Harvest Masquerade', 'Masks on, ciders out.'], ['Haunted Speakeasy', 'The password changes every night.'],
  ['Golden Autumn', 'Amber light and warming spirits.'], ['Midnight Countdown', 'One more round before the bells.']
] as const;
export const SPARK_DRAWS = 80;
export const SEASON_MILESTONES: { draws: number; box: 'silver' | 'gold' | 'choice'; label: string }[] = [
  { draws: 10, box: 'silver', label: 'Silver box' }, { draws: 30, box: 'gold', label: 'Gold box' }, { draws: 60, box: 'choice', label: 'Choice box' }
];
export const SEASON_FEATURED_SHARE = .75;

export interface Season { id: string; month: number; name: string; tagline: string; startsAt: number; endsAt: number; featuredIds: string[]; }

export function seasonAt(now: number): Season {
  const date = new Date(now);
  const year = date.getUTCFullYear(), month = date.getUTCMonth();
  const legendary = DRAWABLE_COSMETICS.filter((item) => item.rarity === 'legendary');
  const [name, tagline] = SEASON_THEMES[month]!;
  // Two legendary styles per month; twelve months cover all twelve legendaries exactly once.
  const featuredIds = legendary.length ? [legendary[(2 * month) % legendary.length]!.id, legendary[(2 * month + 1) % legendary.length]!.id] : [];
  return { id: `${year}-${String(month + 1).padStart(2, '0')}`, month, name, tagline, startsAt: Date.UTC(year, month, 1), endsAt: Date.UTC(year, month + 1, 1), featuredIds };
}
