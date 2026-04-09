/// <reference types="vitest" />
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { fileURLToPath, URL } from 'node:url';
// https://vitejs.dev/config/
export default defineConfig({
    plugins: [react()],
    resolve: {
        alias: {
            '@': fileURLToPath(new URL('./src', import.meta.url)),
        },
    },
    server: {
        port: 5173,
    },
    build: {
        outDir: 'dist',
        sourcemap: false,
        target: 'es2020',
    },
    // Vitest config — Playwright E2E tests live in tests/ and must be excluded so
    // `npm run test` (vitest) and `npm run test:e2e` (playwright) do not collide.
    // Vitest scans src/ only; unit tests for pure helpers may be added there in
    // future sprints (e.g. src/lib/**.test.ts).
    test: {
        include: ['src/**/*.{test,spec}.{ts,tsx}'],
        exclude: ['node_modules', 'dist', 'tests/**'],
    },
});
