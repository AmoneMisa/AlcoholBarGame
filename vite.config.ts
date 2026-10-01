import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';

export default defineConfig(({ isSsrBuild }) => ({
  plugins: [vue()],
  // Which build this is: the commit CI built (GIT_SHA) and when. Shown on the profile screen and by /api/health.
  define: {
    __APP_VERSION__: JSON.stringify((process.env.GIT_SHA ?? 'dev').slice(0, 7)),
    __APP_BUILT__: JSON.stringify(new Date().toISOString())
  },
  // The server bundle (vite build --ssr) needs no copy of the public assets.
  publicDir: isSsrBuild ? false : 'public',
  server: {
    host: true,
    // `npm run dev` + `npm run dev:server:memory` (or dev:server): the game API runs on port 3000 (set API_URL to use another).
    proxy: { '/api': process.env.API_URL ?? 'http://localhost:3000' }
  }
}));
