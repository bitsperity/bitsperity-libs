# Entwicklungsumgebung Setup

## Container-basierte Entwicklungsinfrastruktur

### Dockerfile.dev
```dockerfile
FROM node:18-alpine
WORKDIR /app

# System-Dependencies für Development
RUN apk add --no-cache \
    git \
    curl \
    ca-certificates \
    && rm -rf /var/cache/apk/*

# NPM-Konfiguration für bessere Performance
RUN npm config set registry https://registry.npmjs.org/
RUN npm install -g npm@latest

# Package-Installation mit Cache-Optimierung
COPY package*.json ./
RUN npm ci --production=false

# TypeScript global für IDE-Integration
RUN npm install -g typescript@^4.9.0

# Source-Code
COPY . .

# Development-Port
EXPOSE 3000
EXPOSE 8080

# Health-Check für Container-Monitoring
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:3000/health || exit 1

# Development-Server mit Hot-Reload
CMD ["npm", "run", "dev"]
```

### Dockerfile.test
```dockerfile
FROM node:18-alpine
WORKDIR /app

# Testing-Dependencies
RUN apk add --no-cache \
    chromium \
    firefox \
    xvfb \
    && rm -rf /var/cache/apk/*

# Playwright-Browser-Installation
ENV PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD=1
ENV PLAYWRIGHT_BROWSERS_PATH=/ms-playwright

# Package-Installation
COPY package*.json ./
RUN npm ci

# Playwright-Browser-Setup
RUN npx playwright install chromium firefox
RUN npx playwright install-deps

# Source-Code
COPY . .

# Test-Execution
CMD ["npm", "run", "test:all"]
```

### docker-compose.yml
```yaml
version: '3.8'

services:
  app:
    build:
      context: .
      dockerfile: Dockerfile.dev
    ports:
      - "3000:3000"
      - "8080:8080"
    volumes:
      - .:/app
      - /app/node_modules
      - ~/.gitconfig:/home/node/.gitconfig:ro
    environment:
      - NODE_ENV=development
      - CHOKIDAR_USEPOLLING=true
    restart: unless-stopped
    depends_on:
      - relay-mock

  tests:
    build:
      context: .
      dockerfile: Dockerfile.test
    volumes:
      - .:/app
      - /app/node_modules
    environment:
      - NODE_ENV=test
    command: npm run test:watch
    depends_on:
      - relay-mock

  relay-mock:
    image: node:18-alpine
    working_dir: /app
    volumes:
      - ./test/relay-mock.js:/app/relay-mock.js
    ports:
      - "8081:8081"
    command: node relay-mock.js
    environment:
      - NODE_ENV=test

  security-scan:
    image: node:18-alpine
    working_dir: /app
    volumes:
      - .:/app
      - /app/node_modules
    command: >
      sh -c "
        npm audit --audit-level=moderate &&
        npm run security:check
      "
    depends_on:
      - app
```

## Moderne TypeScript-Konfiguration

### tsconfig.json
```json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "ES2020",
    "moduleResolution": "node",
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "allowJs": false,
    "checkJs": false,
    "jsx": "preserve",
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true,
    "outDir": "./dist",
    "rootDir": "./src",
    "composite": false,
    "tsBuildInfoFile": "./dist/.tsbuildinfo",
    "removeComments": false,
    "noEmit": false,
    "importHelpers": false,
    "importsNotUsedAsValues": "error",
    "downlevelIteration": true,
    "isolatedModules": true,
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "exactOptionalPropertyTypes": true,
    "noImplicitReturns": true,
    "noFallthroughCasesInSwitch": true,
    "noUncheckedIndexedAccess": true,
    "noImplicitOverride": true,
    "allowUnusedLabels": false,
    "allowUnreachableCode": false,
    "skipDefaultLibCheck": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true,
    "allowSyntheticDefaultImports": true,
    "esModuleInterop": true,
    "preserveSymlinks": true,
    "experimentalDecorators": false,
    "emitDecoratorMetadata": false,
    "useDefineForClassFields": true,
    "preserveWatchOutput": true,
    "pretty": true,
    "incremental": true
  },
  "include": [
    "src/**/*",
    "test/**/*"
  ],
  "exclude": [
    "node_modules",
    "dist",
    "**/*.test.ts",
    "**/*.spec.ts"
  ],
  "ts-node": {
    "esm": true,
    "experimentalSpecifierResolution": "node"
  }
}
```

### tsconfig.build.json
```json
{
  "extends": "./tsconfig.json",
  "compilerOptions": {
    "noEmit": false,
    "sourceMap": false,
    "declaration": true,
    "declarationMap": true,
    "outDir": "./dist"
  },
  "include": [
    "src/**/*"
  ],
  "exclude": [
    "node_modules",
    "dist",
    "test",
    "**/*.test.ts",
    "**/*.spec.ts"
  ]
}
```

## Qualitätsautomatisierung-Setup

### .eslintrc.js
```javascript
module.exports = {
  root: true,
  env: {
    es2020: true,
    node: true,
    browser: true
  },
  parser: '@typescript-eslint/parser',
  parserOptions: {
    ecmaVersion: 2020,
    sourceType: 'module',
    project: './tsconfig.json'
  },
  extends: [
    'eslint:recommended',
    '@typescript-eslint/recommended',
    '@typescript-eslint/recommended-requiring-type-checking'
  ],
  plugins: [
    '@typescript-eslint'
  ],
  rules: {
    // TypeScript-spezifische Regeln
    '@typescript-eslint/no-explicit-any': 'error',
    '@typescript-eslint/explicit-function-return-type': 'error',
    '@typescript-eslint/no-unused-vars': 'error',
    '@typescript-eslint/prefer-readonly': 'error',
    '@typescript-eslint/prefer-as-const': 'error',
    '@typescript-eslint/no-non-null-assertion': 'error',
    '@typescript-eslint/no-unsafe-assignment': 'error',
    '@typescript-eslint/no-unsafe-member-access': 'error',
    '@typescript-eslint/no-unsafe-call': 'error',
    '@typescript-eslint/no-unsafe-return': 'error',
    
    // Code-Quality-Regeln
    'prefer-const': 'error',
    'no-var': 'error',
    'no-console': 'warn',
    'no-debugger': 'error',
    'eqeqeq': 'error',
    'curly': 'error',
    'no-eval': 'error',
    'no-implicit-globals': 'error',
    'no-implied-eval': 'error',
    'no-new-wrappers': 'error',
    'no-throw-literal': 'error',
    'prefer-promise-reject-errors': 'error',
    'radix': 'error',
    'no-return-await': 'error'
  },
  ignorePatterns: [
    'dist',
    'node_modules',
    '*.js'
  ]
};
```

### .prettierrc.js
```javascript
module.exports = {
  semi: true,
  trailingComma: 'es5',
  singleQuote: true,
  printWidth: 80,
  tabWidth: 2,
  useTabs: false,
  quoteProps: 'as-needed',
  bracketSpacing: true,
  arrowParens: 'always',
  endOfLine: 'lf',
  embeddedLanguageFormatting: 'auto',
  insertPragma: false,
  requirePragma: false,
  proseWrap: 'preserve',
  htmlWhitespaceSensitivity: 'css'
};
```

### package.json
```json
{
  "name": "nostr-unchained",
  "version": "0.1.0",
  "type": "module",
  "description": "TypeScript-first Nostr DM library for SvelteKit",
  "main": "./dist/index.js",
  "types": "./dist/index.d.ts",
  "exports": {
    ".": {
      "import": "./dist/index.js",
      "require": "./dist/index.cjs",
      "types": "./dist/index.d.ts"
    }
  },
  "files": [
    "dist",
    "README.md",
    "LICENSE"
  ],
  "scripts": {
    "dev": "vite",
    "build": "tsc --project tsconfig.build.json",
    "build:watch": "tsc --project tsconfig.build.json --watch",
    "test": "vitest",
    "test:watch": "vitest --watch",
    "test:all": "vitest run --coverage",
    "test:ui": "vitest --ui",
    "lint": "eslint src --ext .ts,.tsx",
    "lint:fix": "eslint src --ext .ts,.tsx --fix",
    "format": "prettier --write src/**/*.{ts,tsx,json,md}",
    "format:check": "prettier --check src/**/*.{ts,tsx,json,md}",
    "type-check": "tsc --noEmit",
    "security:check": "npm audit --audit-level=moderate",
    "prepare": "husky install",
    "prepublishOnly": "npm run build && npm run test && npm run lint"
  },
  "devDependencies": {
    "@types/node": "^18.0.0",
    "@typescript-eslint/eslint-plugin": "^5.0.0",
    "@typescript-eslint/parser": "^5.0.0",
    "@vitest/coverage-c8": "^0.28.0",
    "@vitest/ui": "^0.28.0",
    "eslint": "^8.0.0",
    "husky": "^8.0.0",
    "jsdom": "^21.0.0",
    "lint-staged": "^13.0.0",
    "playwright": "^1.30.0",
    "prettier": "^2.8.0",
    "typescript": "^4.9.0",
    "vite": "^4.0.0",
    "vitest": "^0.28.0"
  },
  "lint-staged": {
    "src/**/*.{ts,tsx}": [
      "eslint --fix",
      "prettier --write"
    ],
    "src/**/*.{json,md}": [
      "prettier --write"
    ]
  },
  "engines": {
    "node": ">=18.0.0"
  },
  "repository": {
    "type": "git",
    "url": "git+https://github.com/bitsperity/nostr-unchained.git"
  },
  "keywords": [
    "nostr",
    "typescript",
    "sveltekit",
    "dm",
    "messaging",
    "decentralized"
  ],
  "author": "Bitsperity",
  "license": "MIT",
  "bugs": {
    "url": "https://github.com/bitsperity/nostr-unchained/issues"
  },
  "homepage": "https://github.com/bitsperity/nostr-unchained#readme"
}
```

## Vite-Konfiguration

### vite.config.ts
```typescript
import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
  build: {
    lib: {
      entry: resolve(__dirname, 'src/index.ts'),
      name: 'NostrUnchained',
      fileName: 'index',
      formats: ['es', 'cjs']
    },
    rollupOptions: {
      external: ['svelte', 'svelte/store'],
      output: {
        globals: {
          svelte: 'svelte',
          'svelte/store': 'svelteStore'
        }
      }
    },
    target: 'es2020',
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true,
        drop_debugger: true
      }
    }
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src')
    }
  },
  server: {
    port: 3000,
    host: '0.0.0.0',
    cors: true
  },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./test/setup.ts']
  }
});
```

## Vitest-Konfiguration

### vitest.config.ts
```typescript
import { defineConfig } from 'vitest/config';
import { resolve } from 'path';

export default defineConfig({
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./test/setup.ts'],
    coverage: {
      provider: 'c8',
      reporter: ['text', 'html', 'json-summary'],
      include: ['src/**/*.ts'],
      exclude: [
        'src/**/*.test.ts',
        'src/**/*.spec.ts',
        'src/**/*.d.ts'
      ],
      thresholds: {
        statements: 95,
        branches: 90,
        functions: 95,
        lines: 95
      }
    },
    testTimeout: 10000,
    hookTimeout: 10000,
    threads: false,
    maxThreads: 1,
    minThreads: 1
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src')
    }
  }
});
```

## KI-Entwicklungsworkflow

### Phase-Entwicklungsprozess
1. **Analysieren** - Phasen-Analyse mit analyze_phase.mdc
2. **Implementieren** - KI-unterstützte Code-Generierung
3. **Testen** - Automatisierte Tests in Container-Umgebung
4. **Finalisieren** - Dokumentation und Deployment-Vorbereitung

### KI-Assistenz-Richtlinien
- **Verwende KI für**: Boilerplate-Code, repetitive Aufgaben, Test-Generierung
- **Validiere**: Alle KI-generierten Code durch Container-Tests
- **Behalte**: Menschliche Aufsicht für Architektur-Entscheidungen
- **Dokumentiere**: KI-generierten Code für Wartbarkeit

### Entwicklungs-Container-Befehle
```bash
# Container-Entwicklungsumgebung starten
docker-compose up -d app

# Tests in Container ausführen
docker-compose run tests

# Sicherheits-Scans in Container
docker-compose run security-scan

# Production-Build in Container
docker-compose run app npm run build

# Container-Logs überwachen
docker-compose logs -f app
```

## Qualitätskontrolle

### Pre-commit-Hooks
```bash
# .husky/pre-commit
#!/bin/sh
. "$(dirname "$0")/_/husky.sh"

npm run lint
npm run format:check
npm run type-check
npm run test
```

### CI/CD-Pipeline
```yaml
# .github/workflows/ci.yml
name: CI/CD Pipeline

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
          cache: 'npm'
      - name: Install dependencies
        run: npm ci
      - name: Run tests
        run: npm run test:all
      - name: Upload coverage
        uses: codecov/codecov-action@v3

  build:
    needs: test
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
          cache: 'npm'
      - name: Install dependencies
        run: npm ci
      - name: Build library
        run: npm run build
      - name: Check bundle size
        run: npm run size-check
```

## Terminationskriterien

Die Entwicklungsumgebung ist bereit, wenn:

1. **Container-Setup**: Docker-Umgebung konfiguriert und validiert
2. **TypeScript-Toolchain**: Moderne Konfiguration mit Strict Mode
3. **Qualitäts-Gates**: ESLint, Prettier, Vitest konfiguriert
4. **KI-Integration**: Tools für KI-unterstützte Entwicklung eingerichtet
5. **Performance-Benchmarks**: Metriken für <200ms Initialisierung definiert

**Bereit für AI-beschleunigte Implementierung von Phase 1** 