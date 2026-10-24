import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    // Dev only: the browser stays same-origin, so the backend needs no CORS.
    proxy: {
      '/candles': 'http://localhost:3000',
    },
  },
})
