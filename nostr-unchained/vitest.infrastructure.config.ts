/// <reference types="vitest" />
import { defineConfig } from 'vite';

export default defineConfig({
  test: {
    include: ['tests/infrastructure/**/*.test.ts'],
    environment: 'node',
    globals: true,
    testTimeout: 30000,
    hookTimeout: 10000,
    reporter: 'verbose'
  }
});