import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// GitHub Pages phục vụ site ở /<tên repo>/, nên base phải khớp.
// Chạy local vẫn ở / nhờ biến môi trường của Actions.
export default defineConfig({
  base: process.env.GITHUB_ACTIONS ? '/phonchay-admin/' : '/',
  plugins: [react()],
})
