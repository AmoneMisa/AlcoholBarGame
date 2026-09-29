import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';

export default defineConfig(({ isSsrBuild }) => ({
  plugins: [vue()],
  // The server bundle (vite build --ssr) needs no copy of the public assets.
  publicDir: isSsrBuild ? false : 'public',
  server: {
    host: true,
    // `npm run dev` + `npm run dev:server:memory` (or dev:server): the game API runs on port 3000.
    proxy: { '/api': 'http://localhost:3000' }
  }
}));
