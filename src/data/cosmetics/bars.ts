import type { RegionId } from '../../domain/types';

export interface BarProfile {
  name: string;
  wall: string;
  counter: string;
  lighting: string;
  bartender: string;
  interior: 'velvet' | 'garden' | 'skyline';
}
export const INTERIORS = [
  { id: 'velvet', name: 'Velvet lounge', asset: '/assets/bar/backgrounds/velvet-hour-bar.png' },
  { id: 'garden', name: 'Botanical room', asset: '/assets/bar/backgrounds/botanical-room.png' },
  { id: 'skyline', name: 'Skyline lounge', asset: '/assets/bar/backgrounds/skyline-lounge.png' }
] as const;
export const DEFAULT_BARS: Record<RegionId, BarProfile> = {
  'new-york': { name:'The Velvet Hour',wall:'neon',counter:'classic',lighting:'amber',bartender:'vest',interior:'velvet' },
  london: { name:'Juniper & Oak',wall:'emerald',counter:'classic',lighting:'amber',bartender:'shirt',interior:'garden' },
  berlin: { name:'Midnight Studio',wall:'neon',counter:'marble',lighting:'blue',bartender:'apron',interior:'skyline' },
  tashkent: { name:'Silk Road Social',wall:'emerald',counter:'brass',lighting:'amber',bartender:'vest',interior:'garden' },
  bucharest: { name:'The Amber Room',wall:'burgundy',counter:'brass',lighting:'rose',bartender:'vest',interior:'velvet' },
  tokyo: { name:'Blue Lantern',wall:'neon',counter:'marble',lighting:'blue',bartender:'apron',interior:'skyline' }
};
export const CITY_COORDINATES: Record<RegionId,[number,number]> = {
  'new-york':[-74.01,40.71],london:[-.13,51.51],berlin:[13.4,52.52],tashkent:[69.24,41.3],bucharest:[26.1,44.43],tokyo:[139.69,35.69]
};
