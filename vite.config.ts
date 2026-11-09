import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  // GitHub Pages serves the app under /<repo-name>/, so the deploy workflow
  // sets DEPLOY_BASE_PATH from the repository name. Local builds and
  // `npm run dev` default to "/" so http://localhost:5173 is unaffected.
  base: process.env.DEPLOY_BASE_PATH || '/',
})
