import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    host: '0.0.0.0', // Erreichbar auf allen lokalen IPs (localhost, 127.0.0.1, etc.)
    port: 5173, // Standard-Port
    strictPort: false, // Erlaubt automatische Port-Suche falls 5173 belegt ist
    open: false, // Öffnet Browser nicht automatisch
    cors: true, // Aktiviert CORS für Cross-Origin Requests
    proxy: {
      '/api': {
        target: 'http://192.168.1.65:8000', // Verwende lokale IP für Backend
        changeOrigin: true,
        secure: false,
      }
    }
  },
})
