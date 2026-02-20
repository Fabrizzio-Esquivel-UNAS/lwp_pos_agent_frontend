import { defineConfig } from 'vite'
import { svelte } from '@sveltejs/vite-plugin-svelte'
import moment from 'moment';

const TIMESTAMP = moment().format('YYYYMMDDHHmmss');

// https://vite.dev/config/
export default defineConfig({
  plugins: [svelte()],

  optimizeDeps: {
    include: ['@event-calendar/core']
  },
  build: {
    manifest: 'manifest.json',
    outDir: 'dist',
    cssCodeSplit: false,
    assetsInlineLimit: 100000000,
    rollupOptions: {
      output: {
        entryFileNames: `bundle.${TIMESTAMP}.[hash].js`,
        chunkFileNames: `bundle.${TIMESTAMP}.[hash].js`,
        assetFileNames: `assets/[name].${TIMESTAMP}.[hash].[ext]`,
      }
    }
  },
  server: {
    headers: {
      'Cache-Control': 'public, max-age=86400',
    },
    cors: true
  },
})

