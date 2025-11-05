// https://nuxt.com/docs/api/configuration/nuxt-config
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
})
