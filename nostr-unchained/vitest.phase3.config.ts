import { defineConfig } from 'vitest/config';

export default defineConfig({
  plugins: [],
  
  test: {
    // Test environment configuration für Svelte stores
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/test-utils/setup-phase3.ts'],
    
    // Include Phase 3 specific tests
    include: [
      'src/**/*.{test,spec}.ts',
      'src/__tests__/phase3/**/*.{test,spec}.ts',
      'src/stores/**/*.{test,spec}.ts'
    ],
    
    // Exclude other phase tests
    exclude: [
      'node_modules/',
      'src/__tests__/phase1/**/*',
      'src/__tests__/phase2/**/*',
      'src/__tests__/config.test.ts',
      'src/__tests__/nostr-unchained.test.ts',
      'src/__tests__/phase2-integration.test.ts'
    ],
    
    // Coverage configuration
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      reportsDirectory: './coverage/phase3',
      exclude: [
        'node_modules/',
        'src/__tests__/',
        'dist/',
        '**/*.d.ts',
        'src/test-utils/',
        'src/crypto/**/*' // Exclude crypto from Phase 3 coverage
      ],
      all: true,
      lines: 95,
      functions: 90,
      branches: 90,
      statements: 95
    },
    
    // Performance and timeout configuration
    testTimeout: 15000, // Longer für Umbrel relay tests
    hookTimeout: 10000,
    teardownTimeout: 10000,
    
    // Parallel testing für faster execution
    threads: true,
    maxConcurrency: 4,
    
    // Output configuration
    outputFile: {
      json: './test-results/phase3/results.json',
      junit: './test-results/phase3/junit.xml'
    },
    
    // Reporter configuration
    reporter: ['verbose', 'json', 'junit'],
    
    // Browser testing disabled - use Playwright instead for multi-tab
    // browser: { enabled: false },
    
    // Environment variables for tests
    env: {
      UMBREL_RELAY: process.env.UMBREL_RELAY || 'ws://umbrel.local:4848',
      STORE_TEST_RELAY: process.env.STORE_TEST_RELAY || 'ws://umbrel.local:4848',
      PHASE: '3',
      NODE_ENV: 'test'
    }
  },
  
  resolve: {
    alias: {
      '@': '/app/src',
      '@/stores': '/app/src/stores',
      '@/types': '/app/src/types',
      '@/test-utils': '/app/src/test-utils',
      '@/core': '/app/src/core'
    }
  },
  
  define: {
    'import.meta.vitest': undefined,
    'process.env.UMBREL_RELAY': JSON.stringify(process.env.UMBREL_RELAY || 'ws://umbrel.local:4848')
  },
  
  // Optimizations für store testing
  optimizeDeps: {
    include: [
      'svelte',
      '@testing-library/svelte'
    ]
  },
  
  // Server configuration für development
  server: {
    host: true,
    port: 5173,
    strictPort: true
  }
}); 