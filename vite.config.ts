import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  // Relative asset paths so the built app also loads correctly via file://
  // (Electron's BrowserWindow.loadFile), not just from a dev/preview server.
  base: './',
  plugins: [react()],
})
