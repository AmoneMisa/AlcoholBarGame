import { createApp, type Component } from 'vue';
import { createPinia } from 'pinia';
import { initTelegram } from './telegram/webapp';
import { hydrateCocktailCatalog } from './domain/recipeApi';

// The bundled catalogue is identical to the database seed, so a slow or failing API must not delay the game:
// wait briefly for the fresh list, then start with what we have.
// The character studio (?studio) is an optional tool: a build without its file still works.
const studio = Object.values(import.meta.glob('./components/characters/CharacterStudio.vue'))[0] as (() => Promise<{ default: Component }>) | undefined;
if (studio && new URLSearchParams(window.location.search).has('studio')) {
  const { default: CharacterStudio } = await studio();
  createApp(CharacterStudio).mount('#app');
} else {
  await Promise.all([
    import('./style.css'), import('./dashboard.css'), import('./game.css'),
    import('./conversation.css'), import('./management.css'),
    import('./learning.css'), import('./knowledge.css'),
  ]);
  await import('./polish.css'); // last, so its layout fixes win over the older rules
  const catalogRequest = new AbortController();
  const abortTimer = setTimeout(() => catalogRequest.abort(), 800);
  await hydrateCocktailCatalog((input, init) => fetch(input, { ...init, signal: catalogRequest.signal }));
  clearTimeout(abortTimer);
  initTelegram();
  const { default: App } = await import('./App.vue');
  createApp(App).use(createPinia()).mount('#app');
}
