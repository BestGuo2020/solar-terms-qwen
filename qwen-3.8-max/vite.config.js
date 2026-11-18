import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

// Deployed under https://<domain>/qwen3.8-max/ (see repo-root scripts/build-all.mjs).
// Keep '/' for local dev; use the absolute sub-path base for production builds.
export default defineConfig(({ command }) => ({
  base: command === 'build' ? '/qwen3.8-max/' : '/',
  plugins: [vue()],
  build: {
    target: 'es2020',
    chunkSizeWarningLimit: 1400,
    rollupOptions: {
      output: {
        manualChunks: {
          three: ['three'],
          astro: ['astronomy-engine'],
        },
      },
    },
  },
  server: {
    host: '127.0.0.1',
    port: 5173,
    strictPort: false,
  },
}))
