import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    chunkSizeWarningLimit: 650,
    rollupOptions: {
      output: {
        manualChunks: {
          react: ['react', 'react-dom', 'react-router-dom'],
          i18n: ['i18next', 'i18next-browser-languagedetector', 'i18next-http-backend', 'react-i18next'],
          chartjs: ['chart.js', 'react-chartjs-2'],
          recharts: ['recharts'],
          maps: ['@googlemaps/react-wrapper'],
          icons: ['react-icons'],
          utils: ['axios', 'dompurify', 'react-hot-toast'],
        },
      },
    },
  },
});
