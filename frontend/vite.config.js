import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  test: {
    // Tests import describe/it/expect from 'vitest' explicitly rather than
    // using injected globals, so no eslint config changes are needed for them.
    environment: 'jsdom',
    setupFiles: './src/setupTests.js',
  },
})
