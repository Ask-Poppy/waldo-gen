import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  base: '/waldo-gen/',
  plugins: [react()],
  optimizeDeps: {
    exclude: ['lucide-react'],
  },
  worker: {
    format: 'es',
    plugins: []
  }
});
