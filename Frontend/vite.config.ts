import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react({
      // Fast Refresh für bessere Entwicklererfahrung
      // fastRefresh: true,  // removed in newer versions
      // Babel-Konfiguration für bessere Hot Reloading
      babel: {
        plugins: [
          // Verhindert Caching-Probleme bei React-Komponenten
          ['@babel/plugin-transform-react-jsx-development', { runtime: 'automatic' }]
        ]
      }
    })
  ],
  server: {
    host: '0.0.0.0', // Erreichbar auf allen lokalen IPs (localhost, 127.0.0.1, etc.)
    port: 5173, // Standard-Port
    strictPort: false, // Erlaubt automatische Port-Suche falls 5173 belegt ist
    open: false, // Öffnet Browser nicht automatisch
    cors: true, // Aktiviert CORS für Cross-Origin Requests
    // Verbesserte Hot Module Replacement (HMR) Konfiguration
    hmr: {
      overlay: true, // Zeigt Fehler als Overlay
      clientPort: 5173, // Expliziter HMR-Port
    },
    // Force-Reload bei bestimmten Dateitypen
    watch: {
      usePolling: true, // Bessere Datei-Überwachung auf Windows
      interval: 100, // Schnellere Erkennung von Änderungen
      ignored: ['**/node_modules/**', '**/.git/**']
    },
    proxy: {
      '/api': {
        target: 'http://192.168.1.65:8000', // Verwende lokale IP für Backend
        changeOrigin: true,
        secure: false,
        // Cache-Busting für API-Calls
        configure: (proxy, _options) => {
          proxy.on('proxyReq', (proxyReq, req, _res) => {
            // Füge Cache-Busting-Parameter hinzu
            if (req.url && !req.url.includes('?')) {
              proxyReq.path += `?_t=${Date.now()}`;
            } else if (req.url) {
              proxyReq.path += `&_t=${Date.now()}`;
            }
          });
        }
      }
    }
  },
  build: {
    // Cache-Busting für Production Build
    rollupOptions: {
      output: {
        // Eindeutige Dateinamen mit Hash für Cache-Busting
        entryFileNames: 'assets/[name]-[hash].js',
        chunkFileNames: 'assets/[name]-[hash].js',
        assetFileNames: 'assets/[name]-[hash].[ext]'
      }
    },
    // Source Maps für besseres Debugging
    sourcemap: true,
    // Chunk-Größe-Warnung erhöhen
    chunkSizeWarningLimit: 1000
  },
  // Cache-Verzeichnis explizit setzen
  cacheDir: 'node_modules/.vite',
  // Optimierungen für bessere Performance
  optimizeDeps: {
    // Explizite Abhängigkeiten für besseres Caching
    include: [
      'react',
      'react-dom',
      'react-router-dom',
      'axios',
      'lucide-react',
      'framer-motion'
    ],
    // Force-Rebuild bei Änderungen
    force: false
  },
  // Entwicklungsserver-spezifische Einstellungen
  define: {
    // Cache-Busting-Variable für Runtime
    __BUILD_TIME__: JSON.stringify(new Date().toISOString()),
    __DEV__: JSON.stringify(process.env.NODE_ENV === 'development')
  }
})
