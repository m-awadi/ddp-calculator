import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';

export default defineConfig({
  plugins: [react()],
  base: './', // Use relative paths for assets to work under any path prefix
  server: {
    port: 8080,
    open: true
  },
  build: {
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
        quotation: resolve(__dirname, 'quotation.html')
      }
    }
  }
});
