import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'), // ✅ nice alias setup
    },
  },
  build: {
    outDir: 'dist', // ✅ correct, will generate into 'dist' directory
  },
  server: {
    port: 5173, // ✅ local dev port (Render ignores this)
  },
  base: './', // ✅ this is essential for correct asset linking on production
});
