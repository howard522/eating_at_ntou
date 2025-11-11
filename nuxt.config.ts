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
  components: true,
  build: {
    transpile: ['vuetify'],
  },
  alias: {
    '@stores': path.resolve(__dirname, './stores'),
    '@app': path.resolve(__dirname, './app'),
    '@server': path.resolve(__dirname, './server'),
  },
})
