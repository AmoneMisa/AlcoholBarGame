import { ref } from 'vue';

// One guide sheet for the whole app: any screen can open the story of a cocktail or an ingredient.
export type GuideTarget = { kind: 'cocktail' | 'ingredient'; id: string };

const current = ref<GuideTarget>();

export function useGuide() {
  return {
    current,
    openGuide: (kind: GuideTarget['kind'], id: string) => { current.value = { kind, id }; },
    closeGuide: () => { current.value = undefined; }
  };
}
