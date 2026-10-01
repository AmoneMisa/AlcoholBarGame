import { RECIPES } from '../domain/catalog';
import { buildProfile } from '../domain/conversation/customerTalk';
import { chatterFor, chatterGap, drinkReaction, talksOnOwn, type Chatter } from '../domain/social/alive';
import { ensureSocial } from '../domain/social/generate';
import { clampPercent } from '../domain/social/model';
import type { Customer } from '../domain/types';
import { barEventFor } from './events';
import { hasSituation } from './situations';
import type { PlayerState } from './state';

// Guests who sit at the bar do not wait in silence: they comment on the drink, the room and the people around, tell a
// little about their life, ask the bartender something, or speak up when they have been left alone for too long.

const MURMUR_MS = 30_000;
const MAX_CHATTER = 6;

export interface Said { guest: Customer; text: string; chatter: Chatter }

const traitsOf = (guest: Customer) => {
  const id = guest.social?.lastDrink?.recipeId ?? guest.orderRecipeId;
  const recipe = RECIPES.find((item) => item.id === id);
  return recipe ? buildProfile(recipe).traits : undefined;
};

export function collectChatter(state: PlayerState, now: number, random: () => number): Said[] {
  const said: Said[] = [];
  const event = barEventFor(state, now);
  for (const guest of state.customers) {
    const social = ensureSocial(guest, now);
    if (hasSituation(guest) || social.need || state.conversationCustomerId === guest.id) continue;
    // The first remark comes after a couple of minutes, so a guest first gets a chance to be greeted.
    if (social.chatterAt === undefined) { social.chatterAt = now + chatterGap(social, random()); social.spokenAt ??= now; continue; }
    if (now < social.chatterAt || (social.chatterCount ?? 0) >= MAX_CHATTER) continue;
    social.chatterAt = now + chatterGap(social, random());
    if (!talksOnOwn(social) && random() < .6) continue;
    const others = state.customers.filter((item) => item !== guest && item.social);
    const neighbour = { drunk: others.some((item) => (item.social?.drunk ?? 0) >= 50), sad: others.some((item) => item.social?.emotion === 'upset' || item.social?.emotion === 'lonely') };
    const chatter = chatterFor({
      guest, roll: random(), eventId: event?.id, neighbour, traits: traitsOf(guest),
      silentMinutes: (now - (social.spokenAt ?? now)) / 60_000
    });
    if (!chatter) continue;
    social.chatterCount = (social.chatterCount ?? 0) + 1;
    social.murmur = { text: chatter.text, until: now + MURMUR_MS };
    social.lastChatter = chatter.text;
    if (chatter.kind === 'story') social.offeredStory = true;
    if (chatter.asks) social.asked = true;
    if (chatter.rapport) social.rapport = clampPercent(social.rapport + chatter.rapport);
    said.push({ guest, text: chatter.text, chatter });
  }
  return said;
}

// A short word about the drink, said when it is put in front of the guest.
export function reactionToServed(guest: Customer, now: number, seed: string): string | undefined {
  const traits = traitsOf(guest);
  if (!traits || !guest.social) return undefined;
  const text = drinkReaction(guest, traits, seed);
  guest.social.murmur = { text, until: now + MURMUR_MS };
  return text;
}
