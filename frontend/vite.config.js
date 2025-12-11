var __spreadArray = (this && this.__spreadArray) || function (to, from, pack) {
    if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
        if (ar || !(i in from)) {
            if (!ar) ar = Array.prototype.slice.call(from, 0, i);
            ar[i] = from[i];
        }
    }
    return to.concat(ar || Array.prototype.slice.call(from));
};
import { defineConfig, loadEnv } from 'vite';
import { configDefaults } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';
import tailwindcss from 'tailwindcss';
import autoprefixer from 'autoprefixer';
export default defineConfig(function (_a) {
    var mode = _a.mode;
    // Load env from parent directory (root)
    var env = loadEnv(mode, path.resolve(__dirname, '..'), '');
    return {
        server: {
            port: process.env.VITE_PORT ? parseInt(process.env.VITE_PORT, 10) : 3000,
            host: '0.0.0.0',
            proxy: {
                '/api': {
                    target: env.VITE_API_URL || 'http://localhost:3001',
                    changeOrigin: true,
                },
                '/socket.io': {
                    target: env.VITE_API_URL || 'http://localhost:3001',
                    changeOrigin: true,
                    ws: true,
                },
            },
        },
        plugins: [react()],
        worker: {
            format: 'es',
            plugins: function () { return [
                react({
                    jsxRuntime: 'automatic',
                    // Disable fast refresh for workers
                    fastRefresh: false,
                }),
            ]; },
        },
        envDir: '..', // Load .env files from root directory
        css: {
            postcss: {
                plugins: [tailwindcss, autoprefixer],
            },
        },
        resolve: {
            alias: {
                '@': path.resolve(__dirname, './src'),
                daicer: path.resolve(__dirname, '..'),
            },
        },
        test: {
            globals: true,
            environment: 'jsdom',
            setupFiles: './src/test/setup.ts',
            include: ['src/**/*.{test,spec}.{ts,tsx}'],
            exclude: __spreadArray(__spreadArray([], configDefaults.exclude, true), ['e2e/**'], false),
            coverage: {
                provider: 'v8',
                reporter: ['text', 'json', 'html', 'lcov'],
                exclude: [
                    'node_modules/',
                    'src/test/',
                    '**/*.test.{ts,tsx}',
                    '**/*.spec.{ts,tsx}',
                    '**/*.stories.{ts,tsx}',
                    '**/types/',
                    '**/*.d.ts',
                ],
            },
        },
    };
});
