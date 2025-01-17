import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    host: true,
    proxy: {
      '/api1': {
        target: 'http://localhost:5051', // Flask server URL
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api1/, ''),
      },
      '/api2': {
        target: 'http://localhost:5052', // Flask server URL
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api2/, ''),
      },
      '/api3': {
        target: 'http://localhost:5053', // Flask server URL
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api3/, ''),
      },
      '/api5': {
        target: 'http://localhost:5055', 
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api5/, '')
      },
    },
  },
  preview: {
    port: 5050,
    host: true,
  },
});
