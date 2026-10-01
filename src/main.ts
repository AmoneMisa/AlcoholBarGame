import { createApp } from 'vue';
import { createPinia } from 'pinia';
import App from './App.vue';
import './style.css';
import './dashboard.css';
import './game.css';
import './conversation.css';
import './management.css';
import './learning.css';
import './knowledge.css';
import { initTelegram } from './telegram/webapp';
import { hydrateCocktailCatalog } from './domain/recipeApi';

// The bundled catalogue is identical to the database seed, so a slow or failing API must not delay the game:
// wait briefly for the fresh list, then start with what we have.
const catalogRequest = new AbortController();
const abortTimer = setTimeout(() => catalogRequest.abort(), 800);
await hydrateCocktailCatalog((input, init) => fetch(input, { ...init, signal: catalogRequest.signal }));
clearTimeout(abortTimer);
initTelegram();
createApp(App).use(createPinia()).mount('#app');
