import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [
    react({
      // Ensure React is properly handled in production
      jsxRuntime: 'automatic',
      jsxImportSource: 'react',
      babel: {
        plugins: []
      }
    })
  ],
  publicDir: 'public',
  
  // Development server configuration
  server: {
    port: 5173,
    host: true
  },
  
  // Production build optimizations
  build: {
    outDir: 'dist',
    sourcemap: false,
    minify: 'esbuild', // Use esbuild instead of terser - faster and safer for React
    target: 'es2015',
    rollupOptions: {
      output: {
        manualChunks: {
          // Split vendor code for better caching
          'react-vendor': ['react', 'react-dom', 'react-router-dom'],
          'ui-vendor': ['lucide-react', 'framer-motion'],
          'chart-vendor': ['chart.js', 'react-chartjs-2', 'recharts'],
          'utils-vendor': ['axios', 'dayjs', 'date-fns'],
          'leaflet-vendor': ['leaflet', 'react-leaflet'],
          'dnd-vendor': ['@dnd-kit/core', '@dnd-kit/sortable', '@dnd-kit/utilities'],
          'pdf-vendor': ['jspdf', 'canvas-confetti']
        }
      }
    },
    chunkSizeWarningLimit: 1000
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
    ],
    // Force pre-bundling of React and related packages
    force: false,
    esbuildOptions: {
      target: 'es2015'
    }
  },
  
  // Ensure proper resolution of React
  resolve: {
    dedupe: ['react', 'react-dom']
  },
  
  // Preview server (for testing production build)
  preview: {
    port: 4173,
    host: true
  }
})
