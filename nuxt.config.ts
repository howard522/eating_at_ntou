// https://nuxt.com/docs/api/configuration/nuxt-config
import path from "path";

export default defineNuxtConfig({
    compatibilityDate: "2025-07-15",
    pages: true,
    ssr: false,
    devtools: { enabled: true },
    modules: ["@pinia/nuxt"],
    css: ["vuetify/styles", "@mdi/font/css/materialdesignicons.min.css", "leaflet/dist/leaflet.css"],
    plugins: ["~/plugins/vuetify.ts", "~/plugins/fetch-auth.ts"],
    devServer: {
        host: "0.0.0.0",
        port: 3000,
    },
    components: true,
    build: {
        transpile: ["vuetify"],
    },
    alias: {
        "@app": path.resolve(__dirname, "./app"),
        "@composable": path.resolve(__dirname, "./app/composable"),
        "@components": path.resolve(__dirname, "./app/components"),
        "@stores": path.resolve(__dirname, "./app/stores"),
        "@types": path.resolve(__dirname, "./app/types"),
        "@utils": path.resolve(__dirname, "./app/utils"),
        "@server": path.resolve(__dirname, "./server"),
        $interfaces: path.resolve(__dirname, "./server/interfaces"),
        $models: path.resolve(__dirname, "./server/models"),
        $services: path.resolve(__dirname, "./server/services"),
        $utils: path.resolve(__dirname, "./server/utils"),
        "@test": path.resolve(__dirname, "./test"),
    },
    nitro: {
        experimental: {
            websocket: true,
        },
    },
});
