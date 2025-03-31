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
      '/mipuntoV1': {
        target: 'http://localhost:8088',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/mipuntoV1/, '/mipuntoV1'),
      },
    } // Esto hace que el servidor escuche en todas las interfaces (0.0.0.0)
  },
  
})
