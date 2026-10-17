// Vite's config helper and the React plugin (JSX transform + fast refresh).
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
// Used by `pnpm dev`/`build` (plugins) and by vitest (the `test` block).
export default defineConfig({
  // How: the React plugin compiles JSX and enables fast refresh in dev; the `test` block is read by vitest, which reuses
  // this config file.
  plugins: [react()],
  test: {
    // Tests import describe/it/expect from 'vitest' explicitly rather than
    // using injected globals, so no eslint config changes are needed for them.
    // jsdom provides document/localStorage for component tests; setupTests.js runs before each test file.
    environment: 'jsdom',
    setupFiles: './src/setupTests.js',
  },
})
