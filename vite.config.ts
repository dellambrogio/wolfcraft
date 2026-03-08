import { defineConfig } from 'vite';

export default defineConfig({
  base: '/wolfcraft/',
  build: {
    outDir: 'dist',
  },
  server: {
    port: 5173,
  },
});
