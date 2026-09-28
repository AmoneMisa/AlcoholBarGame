import {
  BAR_PAIRINGS,
  findAlcoholAlcoholPairings,
  findAlcoholFoodPairings,
  pairingBand
} from '../data/pairings/barPairings';

export type PairingMode = 'food' | 'drink';

export function alcoholProfile(id: string) {
  return BAR_PAIRINGS.alcohol_profiles.find((item) => item.id === id);
}

export function topFoodPairings(alcoholId: string, limit = 8) {
  return findAlcoholFoodPairings(alcoholId).slice(0, limit).map((item) => ({
    ...item,
    band: pairingBand(item.score)
  }));
}

export function topDrinkPairings(alcoholId: string, limit = 8) {
  return findAlcoholAlcoholPairings(alcoholId).slice(0, limit).map((item) => ({
    ...item,
    partnerId: item.a === alcoholId ? item.b : item.a,
    band: pairingBand(item.score)
  }));
}

export function recommendationPrompts() {
  return BAR_PAIRINGS.a0_dialogue_prompts.flatMap((group) =>
    group.a0.map((prompt) => ({ slot: group.slot, prompt }))
  );
}
