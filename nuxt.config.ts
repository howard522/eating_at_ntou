// https://nuxt.com/docs/api/configuration/nuxt-config
import path from 'path'

export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  pages: true,
  ssr: false,
  devtools: { enabled: true },
  modules: [
    '@pinia/nuxt',
  ],
  css: [
    'vuetify/styles',
    '@mdi/font/css/materialdesignicons.min.css',
  ],
  plugins: ['~/plugins/vuetify.ts', '~/plugins/fetch-auth.ts'],
  devServer: {
    host: '0.0.0.0',
    port: 3000,
  },
  components: true,
  build: {
    transpile: ['vuetify'],
  },
  alias: {
    '@stores': path.resolve(__dirname, './stores'),
    '@app': path.resolve(__dirname, './app'),
    '@server': path.resolve(__dirname, './server'),
    '@utils': path.resolve(__dirname, './app/utils'),
    '@composable': path.resolve(__dirname, './app/composable'),
    '@types': path.resolve(__dirname, './app/types')
  },
  nitro: {
    experimental: {
        websocket: true
    }
  }
})
