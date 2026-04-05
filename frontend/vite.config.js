import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    proxy: {
      '/api': {
        target: 'https://localhost',
        changeOrigin: true,
        rejectUnauthorized: false, // Allow self-signed certificates in dev
      },
    },
  },
  build: {
    outDir: 'dist',
    sourcemap: false,
  },
});
