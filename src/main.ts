import { createApp } from 'vue';
import { createPinia } from 'pinia';
import App from './App.vue';
import './style.css';
import './dashboard.css';
import { initTelegram } from './telegram/webapp';

initTelegram();
createApp(App).use(createPinia()).mount('#app');