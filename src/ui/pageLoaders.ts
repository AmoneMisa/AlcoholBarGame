import { loadRecipeDetails } from '../domain/loadRecipeDetails';

function cached<T>(load: () => Promise<T>) {
  let pending: Promise<T> | undefined;
  return () => pending ??= load().catch(error => { pending = undefined; throw error; });
}
export const loadStudy = cached(async () => { await loadRecipeDetails(); return import('../components/learning/LearningPage.vue'); });
export const loadConversation = cached(() => import('../components/conversation/ConversationPopup.vue'));
export const loadStorage = cached(() => import('../components/game/ManagementDeck.vue'));
export const loadInventory = cached(() => import('../components/game/InventoryPage.vue'));
export const loadRecipes = cached(async () => { await loadRecipeDetails(); return import('../components/game/RecipesPage.vue'); });
export const loadGuide = cached(async () => { await loadRecipeDetails(); return import('../components/knowledge/GuideSheet.vue'); });
export const loadPreparation = cached(async () => { await loadRecipeDetails(); return import('../components/cocktails/PreparationScreen.vue'); });
// Sound is deliberately absent. Its only entry point remains Download sound pack.
export const nextPages = [
  { id: 'study', load: loadStudy },
  { id: 'conversation', load: loadConversation },
  { id: 'storage', load: loadStorage },
  { id: 'inventory', load: loadInventory }
];
