import type { DialogueEffect, DialogueScenario, DialogueState } from './types';

export const DEFAULT_DIALOGUE_STATE: DialogueState = {
  patience: 72,
  trust: 40,
  satisfaction: 50,
  alcoholPreference: 'either'
};

export function createDialogueState(scenario: DialogueScenario): DialogueState {
  return { ...DEFAULT_DIALOGUE_STATE, ...scenario.initialState };
}

export function applyDialogueEffects(state: DialogueState, effects: DialogueEffect[] = []) {
  for (const effect of effects) {
    if (typeof effect.delta === 'number') {
      const current = state[effect.field];
      if (typeof current === 'number') {
        (state[effect.field] as number) = Math.max(0, Math.min(100, current + effect.delta));
      }
      continue;
    }
    if (effect.value !== undefined) {
      (state[effect.field] as DialogueState[keyof DialogueState]) = effect.value;
    }
  }
}
