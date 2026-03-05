import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

/**
 * Vite Configuration for GasWeb.info
 * 
 * This configuration sets up the development and build environment
 * for the GasWeb marketing website.
 * 
 * @see https://vitejs.dev/config/
 */
export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    open: true,
    proxy: {
      // LegalFlow backend API (Express, port 3002)
      '/api/legalflow': {
        target: 'http://localhost:3002',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/legalflow/, '/api'),
      },
      // FinanceFlow backend API (Express, port 3003)
      '/api/financeflow': {
        target: 'http://localhost:3003',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/financeflow/, '/api'),
      },
    },
  },
  build: {
    outDir: 'dist',
    sourcemap: true,
  },
  resolve: {
    alias: {
      '@': '/src',
      '@components': '/src/components',
      '@pages': '/src/pages',
      '@lib': '/src/lib',
      '@hooks': '/src/hooks',
      '@contexts': '/src/contexts',
      '@assets': '/src/assets',
    },
  },
});

