import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

// base './' lets the built bundle run from any sub-path or a static file server.
export default defineConfig({
  base: './',
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
})
