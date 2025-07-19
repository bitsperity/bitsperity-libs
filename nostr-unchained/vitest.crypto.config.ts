import { defineConfig } from 'vitest/config';
import { resolve } from 'path';

export default defineConfig({
  test: {
    name: 'crypto-core',
    root: './src/crypto',
    environment: 'node',
    globals: true,
    setupFiles: ['./test-setup.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html', 'lcov'],
      exclude: [
        'node_modules/**',
        'dist/**',
        '**/*.test.ts',
        '**/*.spec.ts',
        '**/test-vectors/**',
        '**/benchmarks/**'
      ]
    },
    testTimeout: 30000, // Crypto operations können länger dauern
    benchmark: {
      include: ['**/*.bench.ts'],
      exclude: ['node_modules/**']
    }
  },
  resolve: {
    alias: {
      '@crypto': resolve(__dirname, './src/crypto'),
      '@test-utils': resolve(__dirname, './src/test-utils'),
      '@noble/ciphers': resolve(__dirname, './node_modules/@noble/ciphers')
    }
  },
  define: {
    'process.env.CRYPTO_BACKEND': JSON.stringify(process.env.CRYPTO_BACKEND || 'custom'),
    'process.env.NIP44_COMPLIANCE': JSON.stringify(process.env.NIP44_COMPLIANCE || 'strict')
  }
}); 