import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import path from 'path';

export default defineConfig({
  plugins: [tailwindcss(), react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 3000,
    open: true,
    // Set by the devcontainer: file events from Windows/macOS hosts don't reach the container.
    watch: { usePolling: process.env['CHOKIDAR_USEPOLLING'] === 'true' },
  },
  build: {
    outDir: 'dist',
    sourcemap: false,
  },
});
