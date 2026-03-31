import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      manifest: {
        name: 'La Mandanga',
        short_name: 'Mandanga',
        description: 'App de la Charanga La Mandanga',
        start_url: '/',
        display: 'standalone',
        background_color: '#FFF5F8',
        theme_color: '#E91E7B',
        orientation: 'portrait',
        icons: [
          {
            src: '/logo.svg',
            sizes: 'any',
            type: 'image/svg+xml',
            purpose: 'any'
          }
        ]
      }
    })
  ]
})
