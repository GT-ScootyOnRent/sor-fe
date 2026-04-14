import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(),tailwindcss()],
  server: {
    host: true,
    allowedHosts: [
      '8329fa0d9a70.ngrok-free.app'   // 👈 add your ngrok domain here
    ],
    port: 5173
  }
})
