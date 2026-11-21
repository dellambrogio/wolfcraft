import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
  base: '/wolfcraft/',
  build: {
    outDir: 'dist',
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
        dev:  resolve(__dirname, 'dev.html'),
      },
    },
  },
  server: {
    port: 5173,
  },
});
