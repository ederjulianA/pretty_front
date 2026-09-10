import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  // Sin prefijo para poder leer variables que no van al bundle del cliente.
  const env = loadEnv(mode, process.cwd(), '')

  return {
    plugins: [react(),
      tailwindcss(),
    ],
    server: {
      host: true,
      port: 5174,
      proxy: {
        // IMPORTANTE: Las rutas más específicas deben ir PRIMERO
        // /api-spring debe estar antes de /api para evitar conflictos
        '/api-spring': {
          target: env.SPRING_TARGET || 'http://localhost:8080',
          changeOrigin: true,
          secure: false,
          rewrite: (path) => path.replace(/^\/api-spring/, '/api'),
        },
        '/mipuntoV1': {
          target: env.MIPUNTO_TARGET || 'http://localhost:8088',
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/mipuntoV1/, '/mipuntoV1'),
        },
        '/api': {
          // Puerto del backend Node. Se cambia con API_TARGET en el .env local.
          target: env.API_TARGET || 'http://localhost:3000',
          changeOrigin: true,
          secure: false,
          rewrite: (path) => path.replace(/^\/api/, '/api'),
        },
      } // Esto hace que el servidor escuche en todas las interfaces (0.0.0.0)
    },
  }
})
