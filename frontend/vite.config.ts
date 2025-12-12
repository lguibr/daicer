import { defineConfig, loadEnv } from 'vite';
import { configDefaults } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';
import tailwindcss from 'tailwindcss';
import autoprefixer from 'autoprefixer';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default defineConfig(({ mode }) => {
  // Load env from parent directory (root)
  const env = loadEnv(mode, path.resolve(__dirname, '..'), '');

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
      plugins: () => [
        react({
          jsxRuntime: 'automatic',
          // Disable fast refresh for workers
          fastRefresh: false,
        }),
      ],
    },
    envDir: '..', // Load .env files from root directory
    css: {
      postcss: {
        plugins: [tailwindcss, autoprefixer],
      },
    },
    resolve: {
      alias: [
        { find: '@', replacement: path.resolve(__dirname, './src') },
        { find: 'daicer', replacement: path.resolve(__dirname, '..') },
      ],
    },
    test: {
      globals: true,
      environment: 'jsdom',
      setupFiles: './src/test/setup.ts',
      include: ['src/**/*.{test,spec}.{ts,tsx}'],
      exclude: [...configDefaults.exclude, 'e2e/**'],
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
