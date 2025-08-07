/// <reference types="vitest" />
import { defineConfig } from 'vite';

export default defineConfig({
  test: {
    include: ['tests-v2/**/*.test.ts'],
    environment: 'node',
    globals: true,
    testTimeout: 120000,
    hookTimeout: 20000,
    setupFiles: [],
    globalSetup: ['./tests-v2/globalSetup.ts'],
    reporters: 'default'
  }
});


