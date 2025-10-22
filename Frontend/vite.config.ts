import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { reactNamespacePlugin } from './vite-plugin-react-namespace'

export default defineConfig({
  plugins: [
    reactNamespacePlugin(), // Convert named imports to React.xxx FIRST
    react({
      // Use classic runtime to ensure React is always in scope
      jsxRuntime: 'classic'
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
    minify: true,
    target: 'es2015',
    // Ensure React hooks are preserved during minification
    esbuild: {
      keepNames: true,  // Preserve function names (important for React hooks)
      minifyIdentifiers: false  // Don't minify variable names that could break React
    },
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
    chunkSizeWarningLimit: 1000,
    commonjsOptions: {
      include: [/node_modules/],
      transformMixedEsModules: true
    }
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
