/// <reference types="vitest" />
import { defineConfig } from 'vite';

export default defineConfig({
  test: {
    // Default config: exclude legacy backup tests; v2 hat eigene Config
    include: ['tests-v2/**/*.test.ts'],
    exclude: ['tests-old-backup/**'],
    environment: 'node',
    globals: true,
    setupFiles: [],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      thresholds: {
        lines: 90,
        functions: 90,
        branches: 85,
        statements: 90
      },
      exclude: [
        'node_modules/',
        'dist/',
        '**/*.d.ts',
        '**/*.test.ts',
        '**/*.spec.ts',
        'src/test-setup.ts'
      ]
    },
    testTimeout: 120000,
    hookTimeout: 20000,
    globalSetup: ['./tests-v2/globalSetup.ts']
  },
  resolve: {
    alias: {
      '@': new URL('./src', import.meta.url).pathname
    }
  }
});