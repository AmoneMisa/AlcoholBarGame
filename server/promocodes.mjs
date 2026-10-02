import { COSMETICS } from '../src/domain/cosmetics';
import { INTERIORS } from '../src/data/cosmetics/bars';
import { COMPANIONS } from '../src/domain/companions';
import { CONSUMABLES, BOXES, EQUIPMENT } from '../src/domain/loot';
import { grantBox, grantCosmetic, grantReward } from '../src/sim/loot';
import { joinCompanion } from '../src/sim/companions';

export const cleanCode = (code) => typeof code === 'string' ? code.trim().toUpperCase() : '';
export function validatePromo(body, now) {
  const code = cleanCode(body?.code);
  const expiresAt = typeof body?.expiresAt === 'string' ? Date.parse(body.expiresAt) : body?.expiresAt;
  if (!/^[A-Z0-9_-]{3,40}$/.test(code)) throw new Error('Code must contain 3–40 letters, digits, underscores or hyphens.');
  if (!Number.isSafeInteger(expiresAt) || expiresAt <= now) throw new Error('Choose a future expiration time.');
  if (!Array.isArray(body?.rewards) || !body.rewards.length || body.rewards.length > 30) throw new Error('Choose 1–30 rewards.');
  const rewards = body.rewards.map((reward) => {
    const kind = reward?.kind;
    const ids = { style:COSMETICS.map(x=>x.id), background:INTERIORS.map(x=>x.id), companion:COMPANIONS.map(x=>x.id), box:BOXES.map(x=>x.id), consumable:CONSUMABLES.map(x=>x.id), itemShards:EQUIPMENT.map(x=>x.id) };
    const single = ['style','background','companion'].includes(kind);
    if (!['coins','crystals','parts','skinShards','stylePieces', ...Object.keys(ids)].includes(kind)) throw new Error('Unknown reward kind.');
    if (ids[kind] && !ids[kind].includes(reward.id)) throw new Error(`Unknown ${kind} reward.`);
    if (!single && (!Number.isSafeInteger(reward.amount) || reward.amount < 1 || reward.amount > 1_000_000)) throw new Error('Reward amount must be a whole number from 1 to 1000000.');
    return {kind, ...(ids[kind] ? {id:reward.id}:{}), ...(!single ? {amount:reward.amount}:{})};
  });
  return {code, expiresAt, rewards};
}
export function applyPromoRewards(state, rewards) {
  for (const reward of rewards) {
    if (reward.kind === 'style') grantCosmetic(state, reward.id);
    else if (reward.kind === 'background') { if (!state.ownedInteriorIds.includes(reward.id)) state.ownedInteriorIds.push(reward.id); }
    else if (reward.kind === 'companion') joinCompanion(state, reward.id);
    else if (reward.kind === 'box') grantBox(state, reward.id, reward.amount);
    else grantReward(state, reward, () => .5);
  }
}
