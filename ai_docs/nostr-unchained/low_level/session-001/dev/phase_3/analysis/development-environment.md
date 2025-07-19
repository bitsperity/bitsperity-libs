# Development Environment Setup - Phase 3: Reactive Store System

## Container-Based Development Stack für Svelte Integration

### Dockerfile.phase3.dev
```dockerfile
FROM node:18-alpine
WORKDIR /app

# Install system dependencies für Svelte development
RUN apk add --no-cache \
    git \
    python3 \
    make \
    g++

# Copy package files
COPY package*.json ./
COPY vitest.config.ts ./
COPY vitest.phase3.config.ts ./

# Install dependencies
RUN npm ci

# Install Svelte-specific development tools
RUN npm install -D \
    @testing-library/svelte@^4.0.0 \
    @sveltejs/adapter-node@^1.0.0 \
    @sveltejs/kit@^1.0.0 \
    svelte@^4.0.0

# Install browser testing tools für multi-tab tests
RUN npm install -D \
    playwright@^1.40.0 \
    @playwright/test@^1.40.0

# Create test directories
RUN mkdir -p test-results/phase3
RUN mkdir -p coverage/phase3

# Copy source code
COPY . .

# Build for development
RUN npm run build

# Expose development and testing ports
EXPOSE 3000 5173 8080 8081

# Health check für store functionality
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD npm run test:health:stores || exit 1

# Development command mit hot reload
CMD ["npm", "run", "dev:phase3"]
```

### docker-compose.phase3.yml
```yaml
version: '3.8'

services:
  # Main development environment
  nostr-unchained-dev:
    build:
      context: .
      dockerfile: Dockerfile.phase3.dev
    container_name: nostr-unchained-phase3-dev
    ports:
      - "3000:3000"      # Main dev server
      - "5173:5173"      # Vite dev server
      - "8080:8080"      # Test server 1
      - "8081:8081"      # Test server 2
    volumes:
      - .:/app
      - /app/node_modules
      - ./test-results:/app/test-results
      - ./coverage:/app/coverage
    environment:
      - NODE_ENV=development
      - PHASE=3
      - SVELTE_DEV=true
      - VITE_TEST_MODE=true
    networks:
      - nostr-network
    depends_on:
      - test-runner

  # Dedicated test runner für continuous testing  
  test-runner:
    build:
      context: .
      dockerfile: Dockerfile.phase3.dev
    container_name: nostr-unchained-phase3-tests
    volumes:
      - .:/app
      - /app/node_modules
      - ./test-results:/app/test-results
      - ./coverage:/app/coverage
    environment:
      - NODE_ENV=test
      - PHASE=3
      - CI=true
    command: npm run test:phase3:watch
    networks:
      - nostr-network

  # Multi-tab testing environment
  multi-tab-tester:
    build:
      context: .
      dockerfile: Dockerfile.phase3.dev
    container_name: nostr-unchained-phase3-multitab
    ports:
      - "9080:8080"
      - "9081:8081"
    volumes:
      - .:/app
      - /app/node_modules
      - ./test-results:/app/test-results
    environment:
      - NODE_ENV=test
      - PHASE=3
      - MULTI_TAB_TEST=true
      - PLAYWRIGHT_BROWSERS_PATH=/opt/playwright
    command: npm run test:cross-tab:watch
    networks:
      - nostr-network

  # SSR testing environment
  ssr-tester:
    build:
      context: .
      dockerfile: Dockerfile.phase3.dev
    container_name: nostr-unchained-phase3-ssr
    ports:
      - "3001:3000"
    volumes:
      - .:/app
      - /app/node_modules
      - ./test-results:/app/test-results
    environment:
      - NODE_ENV=production
      - PHASE=3
      - SSR_TEST=true
      - SVELTEKIT_MODE=true
    command: npm run test:ssr:watch
    networks:
      - nostr-network

networks:
  nostr-network:
    driver: bridge
```

## Modern TypeScript Configuration für Svelte

### tsconfig.phase3.json
```json
{
  "extends": "./tsconfig.json",
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "node",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "declaration": true,
    "outDir": "./dist/phase3",
    "rootDir": "./src",
    
    // Svelte-specific configurations
    "allowJs": true,
    "checkJs": false,
    "resolveJsonModule": true,
    "verbatimModuleSyntax": false,
    
    // Type checking optimizations
    "incremental": true,
    "composite": true,
    "tsBuildInfoFile": "./dist/phase3/.tsbuildinfo",
    
    // Path mapping für clean imports
    "baseUrl": ".",
    "paths": {
      "@/*": ["./src/*"],
      "@/stores/*": ["./src/stores/*"],
      "@/types/*": ["./src/types/*"],
      "@/test-utils/*": ["./src/test-utils/*"]
    }
  },
  "include": [
    "src/**/*",
    "src/stores/**/*",
    "src/__tests__/phase3/**/*"
  ],
  "exclude": [
    "node_modules",
    "dist",
    "coverage",
    "test-results",
    "**/*.test.ts",
    "src/__tests__/phase1/**/*",
    "src/__tests__/phase2/**/*"
  ]
}
```

### vitest.phase3.config.ts
```typescript
import { defineConfig } from 'vitest/config';
import { sveltekit } from '@sveltejs/kit/vite';

export default defineConfig({
  plugins: [sveltekit()],
  test: {
    // Test environment configuration
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/test-utils/setup-phase3.ts'],
    
    // Include Phase 3 specific tests
    include: [
      'src/**/*.{test,spec}.ts',
      'src/__tests__/phase3/**/*.{test,spec}.ts',
      'src/stores/**/*.{test,spec}.ts'
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
        'src/test-utils/'
      ],
      thresholds: {
        global: {
          branches: 90,
          functions: 90,
          lines: 95,
          statements: 95
        }
      }
    },
    
    // Performance and timeout configuration
    testTimeout: 10000,
    hookTimeout: 10000,
    teardownTimeout: 10000,
    
    // Parallel testing für faster execution
    pool: 'threads',
    poolOptions: {
      threads: {
        singleThread: false,
        maxThreads: 4
      }
    },
    
    // Output configuration
    outputFile: {
      json: './test-results/phase3/results.json',
      junit: './test-results/phase3/junit.xml'
    },
    
    // Reporter configuration
    reporter: ['verbose', 'json', 'junit'],
    
    // Browser testing für cross-tab functionality
    browser: {
      enabled: false, // Use Playwright instead
      name: 'chromium',
      provider: 'playwright'
    }
  },
  
  resolve: {
    alias: {
      '@': '/src',
      '@/stores': '/src/stores',
      '@/types': '/src/types',
      '@/test-utils': '/src/test-utils'
    }
  },
  
  define: {
    'import.meta.vitest': undefined
  }
});
```

## Quality Automation Setup für Phase 3

### .eslintrc.phase3.js
```javascript
module.exports = {
  extends: [
    '@typescript-eslint/recommended',
    'plugin:svelte/recommended',
    'prettier'
  ],
  parser: '@typescript-eslint/parser',
  parserOptions: {
    ecmaVersion: 2022,
    sourceType: 'module',
    project: './tsconfig.phase3.json',
    extraFileExtensions: ['.svelte']
  },
  plugins: [
    '@typescript-eslint',
    'svelte'
  ],
  rules: {
    // AI-friendly rules für consistent code
    '@typescript-eslint/explicit-function-return-type': 'error',
    '@typescript-eslint/no-explicit-any': 'error',
    '@typescript-eslint/prefer-readonly': 'error',
    'prefer-const': 'error',
    
    // Svelte-specific rules
    'svelte/no-at-debug-tags': 'warn',
    'svelte/no-reactive-functions': 'error',
    'svelte/prefer-destructuring-props': 'warn',
    
    // Store-specific rules
    'no-store-async': 'error',
    'prefer-store-subscribe': 'warn'
  },
  overrides: [
    {
      files: ['*.svelte'],
      parser: 'svelte-eslint-parser',
      parserOptions: {
        parser: '@typescript-eslint/parser'
      }
    },
    {
      files: ['src/stores/**/*.ts'],
      rules: {
        // Stricter rules für store implementations
        '@typescript-eslint/no-floating-promises': 'error',
        '@typescript-eslint/await-thenable': 'error'
      }
    }
  ]
};
```

### playwright.config.ts für Multi-Tab Testing
```typescript
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './src/__tests__/phase3/e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: [
    ['html', { outputFolder: './test-results/phase3/playwright-report' }],
    ['json', { outputFile: './test-results/phase3/playwright-results.json' }],
    ['junit', { outputFile: './test-results/phase3/playwright-junit.xml' }]
  ],
  
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure'
  },

  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },
    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
    },
    
    // Multi-tab specific testing
    {
      name: 'multi-tab-chrome',
      use: { 
        ...devices['Desktop Chrome'],
        contextOptions: {
          permissions: ['storage-access']
        }
      },
      testMatch: /.*multi-tab.*\.spec\.ts/
    }
  ],

  webServer: [
    {
      command: 'npm run dev:phase3',
      port: 3000,
      timeout: 120 * 1000,
      reuseExistingServer: !process.env.CI
    },
    {
      command: 'npm run serve:test-tab1',
      port: 8080,
      timeout: 60 * 1000,
      reuseExistingServer: !process.env.CI
    },
    {
      command: 'npm run serve:test-tab2', 
      port: 8081,
      timeout: 60 * 1000,
      reuseExistingServer: !process.env.CI
    }
  ]
});
```

## AI Development Workflow für Phase 3

### Phase 3 Development Process
1. **Analyse** ✅ - Phase 3 requirements und AI assistance strategy
2. **Setup** - Container environment mit Svelte tools
3. **Implement** - AI-assisted store development
4. **Test** - Automated testing mit multi-tab validation
5. **Integrate** - Integration mit Phase 1+2 components
6. **Finalize** - Documentation und Phase 5 preparation

### AI Assistance Guidelines für Svelte Stores

#### **Daily Development Workflow**
```bash
# Morning setup (15 min)
docker-compose -f docker-compose.phase3.yml up -d
npm run dev:phase3

# Development session (2-3 hours)
# 1. AI-assisted feature development
# 2. Container-based validation  
# 3. Continuous testing

# Evening wrap-up (30 min)
npm run test:phase3:coverage
git commit -m "feat(stores): AI-assisted DMConversation implementation"
```

#### **AI Prompting Strategies**
```typescript
// Effective prompts für store development:

// High-level architecture prompt:
"Create a Svelte readable store for NostrUnchained DM conversations that integrates with existing EventBus and supports automatic cleanup, cross-tab sync, and memory management"

// Implementation prompt:
"Implement LRU cache for conversation message history with 1000 message limit, efficient indexing, and memory usage optimization"

// Testing prompt:
"Generate comprehensive test suite for Svelte store including subscription lifecycle, memory management, cross-tab synchronization, and SSR compatibility"
```

## Performance Monitoring für Phase 3

### Store Performance Benchmarks
```typescript
// benchmarks/stores.bench.ts
import { bench, describe } from 'vitest';
import { DMConversation } from '@/stores/dm-conversation';

describe('Store Performance', () => {
  bench('store update latency', async () => {
    const conversation = new DMConversation('test-id');
    const startTime = performance.now();
    
    conversation.addMessage(mockMessage);
    
    return performance.now() - startTime;
  }, { time: 1000 });
  
  bench('memory usage with 1000 messages', async () => {
    const conversation = new DMConversation('memory-test');
    const baseline = process.memoryUsage().heapUsed;
    
    for (let i = 0; i < 1000; i++) {
      conversation.addMessage(generateMockMessage(i));
    }
    
    return process.memoryUsage().heapUsed - baseline;
  }, { time: 5000 });
  
  bench('cross-tab sync latency', async () => {
    // Multi-tab synchronization performance test
  }, { time: 2000 });
});
```

### Container Resource Monitoring
```yaml
# monitoring/docker-compose.monitoring.yml
version: '3.8'

services:
  cadvisor:
    image: gcr.io/cadvisor/cadvisor:latest
    container_name: nostr-unchained-monitoring
    ports:
      - "8082:8080"
    volumes:
      - /:/rootfs:ro
      - /var/run:/var/run:rw
      - /sys:/sys:ro
      - /var/lib/docker/:/var/lib/docker:ro
    networks:
      - nostr-network
```

## Security Validation für Phase 3

### Store Security Checks
```typescript
// security/store-security.test.ts
describe('Store Security', () => {
  it('should prevent XSS in conversation content', () => {
    const maliciousContent = '<script>alert("xss")</script>';
    const conversation = new DMConversation('security-test');
    
    conversation.addMessage({
      content: maliciousContent,
      // ... other properties
    });
    
    // Verify content is properly sanitized
    expect(conversation.state.messages[0].content)
      .not.toContain('<script>');
  });
  
  it('should not leak sensitive data in store state', () => {
    // Verify no private keys or sensitive data in store state
  });
  
  it('should validate message integrity', () => {
    // Verify message tampering detection
  });
});
```

### Cross-Tab Security
```typescript
// security/cross-tab-security.test.ts
describe('Cross-Tab Security', () => {
  it('should validate BroadcastChannel message origin', () => {
    // Verify only valid app instances can communicate
  });
  
  it('should prevent malicious state injection', () => {
    // Verify state updates are properly validated
  });
});
```

## Deployment Validation

### Container Health Checks
```bash
#!/bin/bash
# scripts/health-check-phase3.sh

echo "🔍 Phase 3 Health Check Starting..."

# 1. Container build check
echo "📦 Building Phase 3 container..."
docker build -f Dockerfile.phase3.dev -t nostr-unchained:phase3 .
if [ $? -ne 0 ]; then
  echo "❌ Container build failed"
  exit 1
fi

# 2. Store functionality check
echo "🏪 Testing store functionality..."
docker run --rm nostr-unchained:phase3 npm run test:stores:health
if [ $? -ne 0 ]; then
  echo "❌ Store health check failed"
  exit 1
fi

# 3. Multi-tab sync check
echo "🔄 Testing cross-tab synchronization..."
docker-compose -f docker-compose.phase3.yml up -d multi-tab-tester
sleep 10
docker-compose -f docker-compose.phase3.yml logs multi-tab-tester | grep "SYNC_SUCCESS"
if [ $? -ne 0 ]; then
  echo "❌ Cross-tab sync check failed"
  exit 1
fi

# 4. SSR compatibility check
echo "🎭 Testing SSR compatibility..."
docker-compose -f docker-compose.phase3.yml up -d ssr-tester
sleep 10
docker-compose -f docker-compose.phase3.yml logs ssr-tester | grep "SSR_SUCCESS"
if [ $? -ne 0 ]; then
  echo "❌ SSR compatibility check failed"
  exit 1
fi

echo "✅ Phase 3 Health Check Complete - All systems operational!"
```

### Production Readiness Checklist
```markdown
## Phase 3 Deployment Readiness

### Container Validation ✅
- [ ] Development container builds successfully
- [ ] Test container passes all store tests
- [ ] Multi-tab container validates cross-tab sync
- [ ] SSR container renders without hydration mismatches
- [ ] Resource usage within acceptable limits

### Performance Validation ✅
- [ ] Store updates complete in <100ms
- [ ] Memory usage stable with 1000+ messages
- [ ] Cross-tab sync latency <100ms
- [ ] No memory leaks over 24h operation
- [ ] UI remains responsive at 60fps

### Integration Validation ✅
- [ ] Event Bus integration functional
- [ ] Resource Manager cleanup works
- [ ] Foundation Layer compatibility confirmed
- [ ] Crypto Layer integration ready
- [ ] API contracts defined für Phase 5

### Quality Validation ✅  
- [ ] TypeScript compilation clean
- [ ] ESLint passes with zero warnings
- [ ] Test coverage >95%
- [ ] Security scans pass
- [ ] Documentation complete
```

Dieses Development Environment Setup stellt sicher, dass Phase 3 effizient mit AI-Unterstützung entwickelt wird, während Container-basierte Validierung die Qualität und Konsistenz gewährleistet. 