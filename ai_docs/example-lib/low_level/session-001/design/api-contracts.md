# API Contracts - System Design (Session 001)

## Public API Surface

### Store Factory API
```typescript
interface ExampleConfig {
  apiUrl?: string;
  timeout?: number;
  retryCount?: number;
  debug?: boolean;
}

function createExampleStore(config?: ExampleConfig): ExampleStore;
```

**Design Principles**:
- Configuration optional mit sensible defaults
- Type-safe parameter validation
- Immutable configuration nach creation
- Environment-aware initialization

### Store Instance API
```typescript
interface ExampleStore extends Readable<ExampleState> {
  // State operations
  load(params?: LoadParams): Promise<Result<void, LoadError>>;
  save(data: SaveData): Promise<Result<void, SaveError>>;
  clear(): void;
  
  // Event system
  on<T extends ExampleEvent>(event: T['type'], handler: EventHandler<T>): void;
  off<T extends ExampleEvent>(event: T['type'], handler: EventHandler<T>): void;
  
  // Utility
  destroy(): void;
}
```

**Contract Guarantees**:
- Svelte store compatibility maintained
- All async operations return Result types
- Memory cleanup via destroy method
- Event listeners properly managed

## Client API Contract

### HTTP Client Interface
```typescript
interface ExampleClient {
  // CRUD operations
  create<T>(endpoint: string, data: CreateData): Promise<Result<T, ClientError>>;
  read<T>(endpoint: string, params?: QueryParams): Promise<Result<T, ClientError>>;
  update<T>(endpoint: string, id: string, data: UpdateData): Promise<Result<T, ClientError>>;
  delete(endpoint: string, id: string): Promise<Result<boolean, ClientError>>;
  
  // Configuration
  configure(config: Partial<ClientConfig>): void;
  getConfig(): Readonly<ClientConfig>;
}
```

**Error Handling Contract**:
```typescript
type ClientError = 
  | { type: 'network'; message: string; status?: number }
  | { type: 'validation'; message: string; field?: string }
  | { type: 'timeout'; message: string; duration: number }
  | { type: 'unknown'; message: string; cause?: unknown };
```

## SvelteKit Integration API

### Form Actions Contract
```typescript
interface ActionConfig {
  validate?: (data: FormData) => ValidationResult;
  onSuccess?: (result: unknown) => void;
  onError?: (error: ActionError) => void;
}

function exampleAction(config?: ActionConfig): Action;
```

**Progressive Enhancement**:
- Works without JavaScript enabled
- Enhanced experience mit JavaScript
- Type-safe validation pipeline
- Automatic error state management

### SSR Integration
```typescript
interface SSRConfig {
  initialData?: unknown;
  hydrationKey?: string;
  serverOnly?: boolean;
}

function createSSRStore(config: SSRConfig): ExampleStore;
```

## Type System Contracts

### Core Types
```typescript
// State management
interface ExampleState {
  data: ExampleData | null;
  loading: boolean;
  error: ExampleError | null;
  lastUpdated: Date | null;
}

// Configuration
interface ExampleConfig {
  apiUrl?: string;
  timeout?: number;
  retryCount?: number;
  debug?: boolean;
}

// Events
type ExampleEvent = 
  | { type: 'loading'; timestamp: Date }
  | { type: 'loaded'; data: ExampleData; timestamp: Date }
  | { type: 'error'; error: ExampleError; timestamp: Date };
```

### Generic Constraints
```typescript
// Result type for error handling
type Result<T, E = Error> = 
  | { success: true; data: T }
  | { success: false; error: E };

// Event handler types
type EventHandler<T extends ExampleEvent> = (event: T) => void;
```

## Developer Experience API

### Error Messages Design
```typescript
// User-friendly error messages
interface ExampleError {
  code: string;
  message: string;
  suggestion?: string;
  docs?: string;
}

// Example: Helpful error with solution
{
  code: 'INVALID_CONFIG',
  message: 'API URL is required when using remote mode',
  suggestion: 'Add apiUrl to your configuration: createExampleStore({ apiUrl: "https://api.example.com" })',
  docs: 'https://docs.example.com/configuration'
}
```

### Debug API
```typescript
interface DebugTools {
  getState(): ExampleState;
  getConfig(): ExampleConfig;
  getMetrics(): PerformanceMetrics;
  enableVerboseLogging(): void;
}

// Available in development mode
const debug: DebugTools | undefined;
```

## Compatibility Contracts

### Version Compatibility
- **Semantic Versioning**: Major.Minor.Patch
- **Breaking Changes**: Only in major versions
- **Deprecation**: 2 minor versions warning period
- **TypeScript**: Forward compatibility within major versions

### Framework Compatibility
```typescript
// SvelteKit versions
"peerDependencies": {
  "@sveltejs/kit": "^2.0.0",
  "svelte": "^4.0.0"
}

// TypeScript versions  
"peerDependencies": {
  "typescript": "^5.0.0"
}
```

---

**API Stability**: Public APIs frozen for v1.0
**Error Handling**: Result types with comprehensive error categories
**Developer Experience**: Self-documenting APIs mit helpful error messages 