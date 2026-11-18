import { defineConfig } from 'vite';

// Deployed under https://<domain>/qwen4-max/ (see repo-root scripts/build-all.mjs).
export default defineConfig(({ command }) => ({
  base: command === 'build' ? '/qwen4-max/' : '/',
  server: { host: true, port: 5173 },
  build: { outDir: 'dist', target: 'es2020' },
}));