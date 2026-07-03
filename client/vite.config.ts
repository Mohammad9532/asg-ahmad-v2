import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'path'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss()
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  server: {
    host: 'localhost',
    port: 5173,
    hmr: {
      host: 'localhost',
      protocol: 'ws',
    },
    watch: {
      usePolling: true,   // Needed on some Windows setups
      interval: 300,
    }
  }
})

