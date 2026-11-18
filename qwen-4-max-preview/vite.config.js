import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

// Deployed under https://<domain>/qwen4-max-preview/ (see repo-root scripts/build-all.mjs).
export default defineConfig(({ command }) => ({
  plugins: [vue()],
  base: command === 'build' ? '/qwen4-max-preview/' : '/',
  server: {
    port: 5173,
    host: true,
    watch: { ignored: ['**/test-shots/**', '**/.tmp/**'] }
  },
  build: { target: 'es2020', chunkSizeWarningLimit: 1200 }
}))