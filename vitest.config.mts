import { defineConfig } from "vitest/config";
import path from 'path';

export default defineConfig({
    test: {
        environment: "edge-runtime",
        server: { deps: { inline: ["convex-test"] } },
    },
    resolve: {
        alias: {
            '@': path.resolve(__dirname, './src'),
            '@shared': path.resolve(__dirname, './shared'),
            '@convex': path.resolve(__dirname, './convex'),
            '@worker': path.resolve(__dirname, './worker'),
            '@server': path.resolve(__dirname, './server'),
        },
    },
});