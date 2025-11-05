import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(),
    tailwindcss(),
  ],
  server: {
    host: true,
    port:5174,
    proxy: {
      // IMPORTANTE: Las rutas más específicas deben ir PRIMERO
      // /api-spring debe estar antes de /api para evitar conflictos
      '/api-spring': {
        target: 'http://localhost:8080',
        changeOrigin: true,
        secure: false,
        rewrite: (path) => path.replace(/^\/api-spring/, '/api'),
      },
      '/mipuntoV1': {
        target: 'http://localhost:8088',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/mipuntoV1/, '/mipuntoV1'),
      },
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true,
        secure: false,
        rewrite: (path) => path.replace(/^\/api/, '/api'),
      },
    } // Esto hace que el servidor escuche en todas las interfaces (0.0.0.0)
  },
  
})
