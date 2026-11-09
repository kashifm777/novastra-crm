import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  // GitHub Pages serves the app under /<repo-name>/ — the deploy workflow sets
  // DEPLOY_BASE_PATH (e.g. "/CRM/"), local builds default to "/".
  base: process.env.DEPLOY_BASE_PATH || '/',
})
