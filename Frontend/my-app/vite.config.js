import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [react(),tailwindcss(),],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  build: {
    outDir: 'dist',
  },
  server: {
    host: '0.0.0.0', // 👈 Needed only for local dev if deploying via web service
    port: 5173,       // 👈 Render ignores this in static site, okay to leave
  },
  base: './', // 👈 Ensures correct paths for assets in production
});
