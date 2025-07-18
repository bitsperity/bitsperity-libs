import { defineConfig } from 'vitest/config';
import { resolve } from 'path';

export default defineConfig({
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/test-utils/setup.ts']
  },
  resolve: {
    alias: {
      '@': resolve(process.cwd(), 'src')
    }
  }
}); 