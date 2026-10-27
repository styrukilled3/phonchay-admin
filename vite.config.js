import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// base './' để bundle chạy được ở mọi đường dẫn:
// local, GitHub Pages ở /<repo>/, hay nhánh preview mở qua CDN.
export default defineConfig({
  base: './',
  plugins: [react()],
})
