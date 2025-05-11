import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  base: '/', // Required to ensure correct asset paths in production
  plugins: [react()],
  build: {
    outDir: 'dist', // default is fine, but you can specify explicitly
  },
  server: {
    fs: {
      strict: false,
    }
  }
});
