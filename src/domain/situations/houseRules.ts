import type { RegionId } from '../types';

// The rules of the house and of the city. A bar must follow them, explain them politely to guests, and sometimes
// say no. These are game rules chosen for practice: they are NOT legal advice and may not match real laws.
// Each city has its own list, shown to the player, and the situations in rules.ts enforce them.

export interface HouseRule { id: string; icon: string; title: string; text: string; regions: RegionId[] | 'all' }

export const HOUSE_RULES: HouseRule[] = [
  { id: 'no-pets', icon: '🐾', title: 'No pets in the bar', text: 'Pets are not allowed inside. Registered service dogs are always welcome.', regions: 'all' },
  { id: 'pets-terrace', icon: '🌿', title: 'Pets on the terrace', text: 'Well-behaved pets may sit with their owner on the terrace.', regions: ['london', 'berlin', 'bucharest'] },
  { id: 'alcohol-card-only', icon: '💳', title: 'Alcohol by card only', text: 'In this city, alcohol is paid for by card. If a guest tries to pay for alcohol in cash, politely explain the rule.', regions: ['tashkent'] },
  { id: 'boarding-pass', icon: '🛫', title: 'Duty-free: boarding pass needed', text: 'Duty-free bottles are sold only to travellers who show a boarding pass and a passport.', regions: ['bucharest', 'tokyo'] },
  { id: 'smoking-terrace', icon: '🚭', title: 'No smoking inside', text: 'Smoking is only allowed on the terrace, not inside the bar.', regions: ['new-york', 'london', 'berlin', 'tokyo'] },
  { id: 'id-check', icon: '🪪', title: 'Check ID', text: 'If a guest looks under twenty-five, you will be asked what to do: check their ID, and never serve a guest who is underage.', regions: 'all' },
  { id: 'no-drunk-service', icon: '🥴', title: 'No alcohol for drunk guests', text: 'Do not serve more alcohol to a guest who is clearly drunk.', regions: 'all' },
  { id: 'last-call', icon: '🕛', title: 'Last call', text: 'No new alcohol orders after last call. Tell guests politely and offer water or coffee.', regions: 'all' }
];

export const rulesFor = (region: RegionId) => HOUSE_RULES.filter((rule) => rule.regions === 'all' || rule.regions.includes(region));
export const hasRule = (region: RegionId, id: string) => rulesFor(region).some((rule) => rule.id === id);
