import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  test: {
    environment: 'node',
    globals: true,
    setupFiles: ['./src/crypto/test-setup.ts'],
    include: ['src/crypto/**/*.test.ts'],
    testTimeout: 30000,
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
      '@/crypto': path.resolve(__dirname, 'src/crypto'),
      '@/types': path.resolve(__dirname, 'src/types'),
    },
  },
}); 