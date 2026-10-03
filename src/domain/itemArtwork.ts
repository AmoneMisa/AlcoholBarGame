/** Versioned filenames keep older cached placeholder art out of the updated UI. */
const PAINTED = new Set([
  "equipment/shaker", "equipment/speakers", "equipment/ice-machine", "equipment/register", "equipment/cellar", "equipment/fridge", "items/vip-magnet", "items/voucher", "items/calm-charm", "items/second-chance", "items/golden-ice", "items/whisper", "items/courier", "items/steady-hand", "items/scroll", "items/friend-choice", "items/background-choice", "items/style-choice", "items/equipment-choice",
  'resources/coins', 'resources/crystals', 'resources/xp', 'shards/parts',
  'boxes/bronze', 'boxes/silver', 'boxes/gold', 'boxes/choice',
  'items/xp-boost', 'items/coin-boost', 'items/tip-boost', 'items/happy-hour'
]);

export function itemArtwork(path: string, base = '/') {
  return `${base}assets/workshop/${path}${PAINTED.has(path) ? '-painted-v1' : ''}.webp`;
}
