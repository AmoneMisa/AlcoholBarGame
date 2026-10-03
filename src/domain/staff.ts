
// Servers (waiters). Up to four can be hired, one at each of these bar levels. They work while the player is away
// and serve guests for them, but not as well as the player: four servers at full level handle up to 85% of what the
// player would earn by serving alone, and they never bring crystals, recipes or tips. Each server has an upgrade of
// their own. They do not appear in the bar scene, only as icons in the header.

export const STAFF_UNLOCK_LEVELS = [8, 12, 15, 23] as const;
export const MAX_STAFF = STAFF_UNLOCK_LEVELS.length;
export const MAX_STAFF_LEVEL = 5;
/** What four fully upgraded servers reach, as a share of the player's own service. */
export const STAFF_TEAM_CAP = .85;
/** The longest absence that is paid, so a forgotten bar does not run for days. */
export const STAFF_AWAY_CAP_MS = 24 * 60 * 60 * 1000;
/** Shorter gaps than this are the player simply being slow, not away. */
export const STAFF_AWAY_MIN_MS = 3 * 60 * 1000;

export interface StaffMember { level: number }

export const STAFF_PROFILES = [
  { name: 'Mia', role: 'Floor server', about: 'Quick and friendly. Takes the easy orders.' },
  { name: 'Omar', role: 'Cocktail server', about: 'Learns the menu and keeps guests happy.' },
  { name: 'Lena', role: 'Host', about: 'Greets guests and keeps the tables moving.' },
  { name: 'Ravi', role: 'Head server', about: 'Experienced. Handles busy evenings.' }
] as const;

const HIRE_COST = [1500, 4500, 12000, 30000];
export const hireCost = (index: number) => HIRE_COST[index] ?? 30000;
export const upgradeCost = (index: number, level: number) => Math.round(hireCost(index) * .5 * level);

/** One server's share of the player's own service: from 40% of a fair share at level 1 to a full share at level 5. */
export const staffShare = (level: number) => (STAFF_TEAM_CAP / MAX_STAFF) * (.4 + .15 * (Math.max(1, Math.min(MAX_STAFF_LEVEL, level)) - 1));
export const teamShare = (staff: StaffMember[]) => Math.round(staff.reduce((sum, member) => sum + staffShare(member.level), 0) * 100) / 100;
export const unlockedSlots = (playerLevel: number) => STAFF_UNLOCK_LEVELS.filter((level) => playerLevel >= level).length;
