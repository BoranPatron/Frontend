import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  publicDir: 'public', // Explicitly set public directory
  
  // Development server configuration
  server: {
    port: 5173,
    host: true  // Allow network access
  },
  
  // Production build optimizations
  build: {
    outDir: 'dist',
    sourcemap: false,  // Disable sourcemaps in production for smaller bundle
    minify: 'terser',  // Use terser for better minification
    terserOptions: {
      compress: {
        drop_console: true,  // Remove console.log in production
        drop_debugger: true
      }
    },
    rollupOptions: {
      output: {
        manualChunks: {
          // Split vendor code for better caching - React-Core bleibt zusammen für Hook-Kompatibilität
          'ui-vendor': ['lucide-react', 'framer-motion'],
          'chart-vendor': ['chart.js', 'react-chartjs-2', 'recharts'],
          'utils-vendor': ['axios', 'dayjs', 'date-fns'],
          'leaflet-vendor': ['leaflet', 'react-leaflet'],
          'dnd-vendor': ['@dnd-kit/core', '@dnd-kit/sortable', '@dnd-kit/utilities'],
          'pdf-vendor': ['jspdf', 'canvas-confetti']
        }
      }
    },
    // Chunk size warnings
    chunkSizeWarningLimit: 1000  // 1MB
  },
  
  // Dependency optimization
  optimizeDeps: {
    include: [
      'react',
      'react-dom',
      'react-router-dom',
      'axios',
      'leaflet',
      'react-leaflet',
      'chart.js',
      'react-chartjs-2',
      'framer-motion',
      'lucide-react',
      'canvas-confetti',
      'jspdf',
      'dayjs',
      'date-fns',
      'recharts',
      'react-swipeable',
      '@dnd-kit/core',
      '@dnd-kit/sortable',
      '@dnd-kit/utilities'
    ]
  },
  
  // Preview server (for testing production build)
  preview: {
    port: 4173,
    host: true
  }
})
