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

await hydrateCocktailCatalog();
initTelegram();
createApp(App).use(createPinia()).mount('#app');
