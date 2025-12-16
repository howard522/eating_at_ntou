import path from "path";
import { defineConfig } from "vitest/config";

export default defineConfig({
    resolve: {
        alias: {
            "@app": path.resolve(__dirname, "./app"),
            "@composable": path.resolve(__dirname, "./app/composable"),
            "@components": path.resolve(__dirname, "./app/components"),
            "@stores": path.resolve(__dirname, "./app/stores"),
            "@types": path.resolve(__dirname, "./app/types"),
            "@utils": path.resolve(__dirname, "./app/utils"),
            "@server": path.resolve(__dirname, "./server"),
            "@test": path.resolve(__dirname, "./test"),
            "#imports": path.resolve(__dirname, "./.nuxt/imports.d.ts"),
        },
    },
    test: {
        globals: true,
        environment: "happy-dom",
    },
});
