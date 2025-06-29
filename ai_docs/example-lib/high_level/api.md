# API Specification - Example Library

## Core API Interface

### Primary Exports
```typescript
// Main entry point
export { createExampleStore } from './stores/example-store.js';
export { ExampleClient } from './client/example-client.js';
export { type ExampleConfig, type ExampleEvent } from './types/index.js';

// SvelteKit integration
export { exampleAction } from './integrations/sveltekit.js';
export { exampleStore } from './stores/svelte-store.js';
```

### Store API
```typescript
interface ExampleStore {
  // State management
  subscribe: (callback: (value: ExampleState) => void) => () => void;
  update: (updater: (state: ExampleState) => ExampleState) => void;
  set: (value: ExampleState) => void;
  
  // Async operations
  load: (config: LoadConfig) => Promise<ExampleData>;
  save: (data: ExampleData) => Promise<void>;
  
  // Event handling
  on: <T extends ExampleEvent>(event: T['type'], handler: (event: T) => void) => void;
  off: <T extends ExampleEvent>(event: T['type'], handler: (event: T) => void) => void;
}
```

### Client API
```typescript
class ExampleClient {
  constructor(config: ExampleConfig);
  
  // CRUD operations
  async create(data: CreateData): Promise<ExampleEntity>;
  async read(id: string): Promise<ExampleEntity | null>;
  async update(id: string, data: UpdateData): Promise<ExampleEntity>;
  async delete(id: string): Promise<boolean>;
  
  // Batch operations
  async bulkCreate(data: CreateData[]): Promise<ExampleEntity[]>;
  async bulkUpdate(updates: UpdateOperation[]): Promise<ExampleEntity[]>;
  
  // Reactive subscriptions
  subscribe(query: QueryConfig): ExampleSubscription;
}
```

## SvelteKit Integration

### Form Actions
```typescript
// Form action integration
export const actions: Actions = {
  default: exampleAction({
    onSuccess: (result) => console.log('Success:', result),
    onError: (error) => console.error('Error:', error)
  })
};
```

### Store Integration
```typescript
// Svelte store usage
import { exampleStore } from 'example-lib';

// In component
<script>
  $: data = $exampleStore;
  
  function handleUpdate() {
    exampleStore.update(state => ({ ...state, updated: true }));
  }
</script>
```

## Error Handling

### Result Types
```typescript
type Result<T, E = Error> = 
  | { success: true; data: T }
  | { success: false; error: E };
```

### Error Categories
- `ValidationError`: Input validation failures
- `NetworkError`: API communication issues
- `ConfigurationError`: Setup and configuration problems
- `RuntimeError`: Unexpected runtime exceptions

## Performance Considerations

### Bundle Optimization
- Tree-shaking support for all exports
- Separate entry points for different use cases
- Lazy loading for optional features
- Minimal runtime dependencies

### Caching Strategy
- Automatic caching for read operations
- Configurable cache TTL
- Cache invalidation patterns
- Memory-efficient storage 