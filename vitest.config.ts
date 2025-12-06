import { defineConfig } from 'vitest/config'
import path from 'path'

export default defineConfig({
    resolve: {
        alias: {
            '@app': path.resolve(__dirname, './app'),
            '@server': path.resolve(__dirname, './server'),
            '@stores': path.resolve(__dirname, './stores'),
            '#imports': path.resolve(__dirname, './.nuxt/imports.d.ts'),
        },
    },
    test: {
        globals: true,
        environment: 'happy-dom',
    },
})
