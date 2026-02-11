import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import path from 'path'
import { VitePWA } from 'vite-plugin-pwa'

// https://vite.dev/config/
export default defineConfig({
  // CAMBIO CLAVE AQUÍ:
  // Detecta si estamos en Vercel. Si es sí, usa la raíz '/'.
  // Si no (estás en GitHub o local), mantiene '/bar-jordy/'.
  //base: process.env.VERCEL ? '/' : '/bar-jordy/', 
  base: process.env.VITE_BASE_PATH || '/bar-jordy/',
  plugins: [
    vue(),
    VitePWA({
      registerType: 'prompt',
      includeAssets: ['favicon.ico', 'apple-touch-icon.png', 'masked-icon.svg'],
      manifest: {
        name: 'Bar Gordy POS',
        short_name: 'BarGordy',
        description: 'Punto de Venta Bar Gordy',
        theme_color: '#ffffff',
        icons: [
          {
            src: 'pwa-192x192.png',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: 'pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png'
          }
        ]
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff,woff2}'],
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/.*\.supabase\.co\/.*/i,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'supabase-cache',
              expiration: {
                maxEntries: 100,
                maxAgeSeconds: 60 * 60 * 24 * 7 // 7 días
              },
              networkTimeoutSeconds: 10
            }
          }
        ],
        navigateFallback: null // Deshabilitar fallback automático
      }
    })
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src')
    }
  }
})
