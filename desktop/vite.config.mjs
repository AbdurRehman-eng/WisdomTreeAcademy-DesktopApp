import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  base: './',
  test: {
    globals: true,
    environment: 'node',
    setupFiles: './src/test/setup.js',
    server: {
      deps: {
        inline: [
          '@csstools/css-calc',
          '@asamuzakjp/css-color'
        ]
      }
    }
  }
})
