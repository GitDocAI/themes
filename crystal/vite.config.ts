import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import vectorSearchPlugin from './vite-plugin-vector-search'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  // Load env file based on `mode`
  const env = loadEnv(mode, process.cwd(), '')

  return {
    plugins: [react(), vectorSearchPlugin(env.VITE_MODE),tailwindcss()],
  }
})
