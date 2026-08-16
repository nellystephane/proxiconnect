import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: 'autoUpdate',
      injectRegister: 'auto',
      includeAssets: ['icons/favicon-32.png', 'icons/apple-touch-icon.png'],
      manifest: {
        id: '/proxiconnect/',
        name: 'ProxiConnect',
        short_name: 'ProxiConnect',
        description: 'Services et commerce de proximité : vendeurs, restaurateurs, hôteliers et livreurs près de chez vous.',
        lang: 'fr',
        start_url: '/proxiconnect/',
        scope: '/proxiconnect/',
        display: 'standalone',
        orientation: 'portrait',
        background_color: '#F2F2F7',
        theme_color: '#007AFF',
        icons: [
          { src: 'icons/icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
          { src: 'icons/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
          { src: 'icons/icon-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
        shortcuts: [
          { name: 'Déposer une annonce', short_name: 'Déposer', url: '/proxiconnect/#/deposer', icons: [{ src: 'icons/icon-192.png', sizes: '192x192' }] },
          { name: 'Messages', short_name: 'Messages', url: '/proxiconnect/#/messages', icons: [{ src: 'icons/icon-192.png', sizes: '192x192' }] },
          { name: 'Mes favoris', short_name: 'Favoris', url: '/proxiconnect/#/favoris', icons: [{ src: 'icons/icon-192.png', sizes: '192x192' }] },
        ],
      },
      workbox: {
        // Précache le shell de l'app (JS/CSS/HTML/icônes) pour un démarrage hors-ligne quasi instantané.
        globPatterns: ['**/*.{js,css,html,png,svg,ico,woff2}'],
        navigateFallback: '/proxiconnect/index.html',
        runtimeCaching: [
          {
            // Les données (annonces, produits, messages...) doivent rester fraîches :
            // on tente toujours le réseau d'abord, avec un repli sur le cache hors-ligne.
            urlPattern: ({ url }) => String((url as unknown as { pathname?: string }).pathname ?? '').startsWith('/api/'),
            handler: 'NetworkFirst',
            options: {
              cacheName: 'proxiconnect-api-cache',
              networkTimeoutSeconds: 8,
              expiration: { maxEntries: 100, maxAgeSeconds: 60 * 60 * 24 }, // 1 jour
              cacheableResponse: { statuses: [0, 200] },
            },
          },
          {
            // Photos uploadées (Cloudinary ou équivalent) : rarement modifiées une fois postées.
            urlPattern: ({ request }) => request.destination === 'image',
            handler: 'CacheFirst',
            options: {
              cacheName: 'proxiconnect-images-cache',
              expiration: { maxEntries: 200, maxAgeSeconds: 60 * 60 * 24 * 30 }, // 30 jours
              cacheableResponse: { statuses: [0, 200] },
            },
          },
        ],
      },
      devOptions: {
        enabled: false, // évite les surprises de cache pendant le développement local
      },
    }),
  ],
  base: "/proxiconnect/",
})