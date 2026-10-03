import { createApp } from 'vue';
import { installDragScroll } from './ui/dragScroll';
import { createPinia } from 'pinia';
import { initTelegram } from './telegram/webapp';
import { initGraphics } from './ui/graphics';

// The opening bar needs recipe mechanics only; descriptions and database prose load with Study.
if (window.location.pathname === '/admin' || new URLSearchParams(window.Telegram?.WebApp?.initData ?? '').get('start_param') === 'admin') {
  initTelegram();
  try {
    const {post}=await import('./telegram/api');
    const access=await post<{role:'owner'|'admin'|'moderator'}>('/api/admin/access',{});
    const {default:AdminPage}=await import('./components/admin/AdminPage.vue');
    createApp(AdminPage,{role:access.role}).mount('#app');
  } catch { document.getElementById('app')!.textContent='Access denied. Open this page through Telegram with an authorized account.'; }
} else {
  initGraphics();
  await Promise.all([
    import('./style.css'), import('./dashboard.css'), import('./game.css'),
  ]);
  const pageStylesAnchor = document.createElement('meta');
  pageStylesAnchor.name = 'page-styles-anchor';
  document.head.append(pageStylesAnchor);
  await import('./ui-kit.css');
  await import('./polish.css'); // last, so its layout fixes win over the older rules
  await import('./performance.css');
  await import('./readability.css');
  initTelegram();
  const { default: App } = await import('./App.vue');
  installDragScroll();
  createApp(App).use(createPinia()).mount('#app');
}
