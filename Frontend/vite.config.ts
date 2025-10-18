import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173
  },
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
      'gantt-task-react',
      'react-swipeable',
      '@dnd-kit/core',
      '@dnd-kit/sortable',
      '@dnd-kit/utilities'
    ]
  }
})
