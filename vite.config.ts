import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
   server: {
    proxy: {
      // Khi React client gọi /api, nó sẽ được chuyển hướng tới NestJS server
      '/api': 'http://localhost:3000',
    },
  },
})
