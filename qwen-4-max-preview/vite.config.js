import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

export default defineConfig({
  plugins: [vue()],
  base: './',
  server: {
    port: 5173,
    host: true,
    watch: { ignored: ['**/test-shots/**', '**/.tmp/**'] }
  },
  build: { target: 'es2020', chunkSizeWarningLimit: 1200 }
})