/**
 * QueryBuilder Implementation - Day 2 GREEN Phase
 * 
 * Immutable method chaining QueryBuilder with TypeScript generics
 * Integrates with SubscriptionManager from Day 1
 * 
 * Features:
 * - Immutable method chaining
 * - TypeScript generic constraints for type-safe event filtering
 * - NIP-01 filter compilation
 * - Integration with existing SubscriptionManager
 * - Basic validation and error handling
 */

import type {
  NostrEvent,
  Filter,
  SubscriptionOptions,
  SubscriptionResult,
} from '../core/types.js';
import { SubscriptionManager } from '../subscription/SubscriptionManager.js';

interface QueryValidation {
  valid: boolean;
  errors: string[];
}

export interface IQueryBuilder<T extends NostrEvent = NostrEvent> {
  // Basic filter methods
  kinds<K extends number>(kinds: K[]): IQueryBuilder<NostrEvent & { kind: K }>;
  authors(authors: string[]): IQueryBuilder<T>;
  ids(ids: string[]): IQueryBuilder<T>;
  since(timestamp: number): IQueryBuilder<T>;
  until(timestamp: number): IQueryBuilder<T>;
  limit(count: number): IQueryBuilder<T>;
  
  // Advanced filter methods
  tags(name: string, values: string[]): IQueryBuilder<T>;
  search(query: string): IQueryBuilder<T>;
  
  // Query composition
  union<U extends NostrEvent>(other: IQueryBuilder<U>): IQueryBuilder<T | U>;
  intersect(other: IQueryBuilder<T>): IQueryBuilder<T>;
  
  // Compilation and execution
  toFilter(): Filter[];
  execute(options?: SubscriptionOptions): Promise<T[]>;
  subscribe(options?: SubscriptionOptions): Promise<SubscriptionResult>;
  
  // Validation
  validate(): QueryValidation;
}

interface QueryBuilderState {
  kinds?: number[];
  authors?: string[];
  ids?: string[];
  since?: number;
  until?: number;
  limit?: number;
  tags?: Record<string, string[]>;
  search?: string;
  unionWith?: QueryBuilder<any>[];
  intersectWith?: QueryBuilder<any>[];
}

export class QueryBuilder<T extends NostrEvent = NostrEvent> implements IQueryBuilder<T> {
  private state: QueryBuilderState;
  private subscriptionManager?: SubscriptionManager;

  constructor(
    state: QueryBuilderState = {},
    subscriptionManager?: SubscriptionManager
  ) {
    this.state = { ...state };
    this.subscriptionManager = subscriptionManager;
  }

  // Immutable helper to create new instance
  private clone<U extends NostrEvent = T>(newState: Partial<QueryBuilderState> = {}): QueryBuilder<U> {
    return new QueryBuilder<U>(
      { ...this.state, ...newState },
      this.subscriptionManager
    );
  }

  // Basic filter methods with validation
  kinds<K extends number>(kinds: K[]): IQueryBuilder<NostrEvent & { kind: K }> {
    if (!Array.isArray(kinds) || kinds.length === 0) {
      throw new Error('kinds cannot be empty');
    }
    
    for (const kind of kinds) {
      if (typeof kind !== 'number') {
        throw new Error('kinds must be numbers');
      }
      if (!Number.isInteger(kind)) {
        throw new Error('kinds must be integers');
      }
    }

    // Deduplicate kinds
    const uniqueKinds = Array.from(new Set(kinds));
    return this.clone<NostrEvent & { kind: K }>({ kinds: uniqueKinds });
  }

  authors(authors: string[]): IQueryBuilder<T> {
    if (!Array.isArray(authors) || authors.length === 0) {
      throw new Error('authors cannot be empty');
    }
    
    for (const author of authors) {
      if (typeof author !== 'string') {
        throw new Error('authors must be strings');
      }
    }

    // Deduplicate authors
    const uniqueAuthors = Array.from(new Set(authors));
    return this.clone({ authors: uniqueAuthors });
  }

  ids(ids: string[]): IQueryBuilder<T> {
    if (!Array.isArray(ids) || ids.length === 0) {
      throw new Error('ids cannot be empty');
    }
    
    for (const id of ids) {
      if (typeof id !== 'string') {
        throw new Error('ids must be strings');
      }
    }

    const uniqueIds = Array.from(new Set(ids));
    return this.clone({ ids: uniqueIds });
  }

  since(timestamp: number): IQueryBuilder<T> {
    if (typeof timestamp !== 'number') {
      throw new Error('since must be a number');
    }
    if (timestamp < 0) {
      throw new Error('since must be positive');
    }

    return this.clone({ since: timestamp });
  }

  until(timestamp: number): IQueryBuilder<T> {
    if (typeof timestamp !== 'number') {
      throw new Error('until must be a number');
    }
    if (timestamp < 0) {
      throw new Error('until must be positive');
    }

    return this.clone({ until: timestamp });
  }

  limit(count: number): IQueryBuilder<T> {
    if (typeof count !== 'number') {
      throw new Error('limit must be a number');
    }
    if (count <= 0) {
      throw new Error('limit must be positive');
    }

    return this.clone({ limit: count });
  }

  // Advanced filter methods
  tags(name: string, values: string[]): IQueryBuilder<T> {
    if (typeof name !== 'string' || name.length === 0) {
      throw new Error('tag name must be a non-empty string');
    }
    if (!Array.isArray(values) || values.length === 0) {
      throw new Error('tag values cannot be empty');
    }

    const currentTags = { ...this.state.tags };
    const tagKey = name;
    
    // Merge with existing values for the same tag
    if (currentTags[tagKey]) {
      currentTags[tagKey] = Array.from(new Set([...currentTags[tagKey], ...values]));
    } else {
      currentTags[tagKey] = Array.from(new Set(values));
    }

    return this.clone({ tags: currentTags });
  }

  search(query: string): IQueryBuilder<T> {
    if (typeof query !== 'string' || query.length === 0) {
      throw new Error('search query must be a non-empty string');
    }

    return this.clone({ search: query });
  }

  // Query composition
  union<U extends NostrEvent>(other: IQueryBuilder<U>): IQueryBuilder<T | U> {
    const otherBuilder = other as QueryBuilder<U>;
    const currentUnions = this.state.unionWith || [];
    
    return this.clone<T | U>({ 
      unionWith: [...currentUnions, otherBuilder] 
    });
  }

  intersect(other: IQueryBuilder<T>): IQueryBuilder<T> {
    const otherBuilder = other as QueryBuilder<T>;
    
    // For intersection, merge the filter properties
    const mergedState: QueryBuilderState = { ...this.state };
    const otherState = otherBuilder.state;

    // Merge kinds
    if (otherState.kinds) {
      if (mergedState.kinds) {
        mergedState.kinds = Array.from(new Set([...mergedState.kinds, ...otherState.kinds]));
      } else {
        mergedState.kinds = [...otherState.kinds];
      }
    }

    // Merge authors
    if (otherState.authors) {
      if (mergedState.authors) {
        mergedState.authors = Array.from(new Set([...mergedState.authors, ...otherState.authors]));
      } else {
        mergedState.authors = [...otherState.authors];
      }
    }

    // Merge tags
    if (otherState.tags) {
      const mergedTags = { ...mergedState.tags };
      for (const [key, values] of Object.entries(otherState.tags)) {
        if (mergedTags[key]) {
          mergedTags[key] = Array.from(new Set([...mergedTags[key], ...values]));
        } else {
          mergedTags[key] = [...values];
        }
      }
      mergedState.tags = mergedTags;
    }

    // Take more restrictive time bounds
    if (otherState.since !== undefined) {
      mergedState.since = Math.max(mergedState.since || 0, otherState.since);
    }
    if (otherState.until !== undefined) {
      if (mergedState.until !== undefined) {
        mergedState.until = Math.min(mergedState.until, otherState.until);
      } else {
        mergedState.until = otherState.until;
      }
    }

    // Take smaller limit
    if (otherState.limit !== undefined) {
      if (mergedState.limit !== undefined) {
        mergedState.limit = Math.min(mergedState.limit, otherState.limit);
      } else {
        mergedState.limit = otherState.limit;
      }
    }

    return this.clone(mergedState);
  }

  // Compilation
  toFilter(): Filter[] {
    const filters: Filter[] = [];

    // Handle union - create separate filters for each union
    if (this.state.unionWith && this.state.unionWith.length > 0) {
      // Add main filter
      const mainFilter = this.compileStateToFilter(this.state);
      if (Object.keys(mainFilter).length > 0) {
        filters.push(mainFilter);
      }

      // Add union filters
      for (const unionBuilder of this.state.unionWith) {
        const unionFilter = unionBuilder.toFilter();
        filters.push(...unionFilter);
      }
    } else {
      // Single filter
      const filter = this.compileStateToFilter(this.state);
      filters.push(filter);
    }

    return filters;
  }

  private compileStateToFilter(state: QueryBuilderState): Filter {
    const filter: Filter = {};

    if (state.kinds && state.kinds.length > 0) {
      filter.kinds = state.kinds;
    }

    if (state.authors && state.authors.length > 0) {
      filter.authors = state.authors;
    }

    if (state.ids && state.ids.length > 0) {
      filter.ids = state.ids;
    }

    if (state.since !== undefined) {
      filter.since = state.since;
    }

    if (state.until !== undefined) {
      filter.until = state.until;
    }

    if (state.limit !== undefined) {
      filter.limit = state.limit;
    }

    // Handle tag filters (NIP-01 format: #<tag_name>)
    if (state.tags) {
      for (const [tagName, values] of Object.entries(state.tags)) {
        filter[`#${tagName}`] = values;
      }
    }

    // Handle search (not standard NIP-01 but some relays support it)
    if (state.search) {
      filter.search = state.search;
    }

    return filter;
  }

  // Execution
  async execute(options: SubscriptionOptions = {}): Promise<T[]> {
    if (!this.subscriptionManager) {
      throw new Error('SubscriptionManager is required for query execution');
    }

    const filters = this.toFilter();
    const events: T[] = [];
    let isComplete = false;
    let subscriptionId: string | undefined;

    const executeOptions: SubscriptionOptions = {
      ...options,
      onEvent: (event: NostrEvent) => {
        events.push(event as T);
        if (options.onEvent) {
          options.onEvent(event);
        }
      },
      onEose: async (relay: string) => {
        isComplete = true;
        if (options.onEose) {
          options.onEose(relay);
        }
        // Close the subscription immediately on EOSE
        if (subscriptionId) {
          await this.subscriptionManager!.close(subscriptionId);
        }
      },
      autoClose: true // Auto-close for execute
    };

    const result = await this.subscriptionManager.subscribe(filters, executeOptions);
    
    if (!result.success) {
      throw new Error(result.error?.message || 'Query execution failed');
    }

    subscriptionId = result.subscription.id;

    // Wait for EOSE or timeout
    const timeout = options.timeout || 10000; // Default 10s timeout
    const startTime = Date.now();
    
    while (!isComplete && (Date.now() - startTime) < timeout) {
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    // Ensure subscription is closed even on timeout
    if (subscriptionId && !isComplete) {
      await this.subscriptionManager.close(subscriptionId);
    }

    return events;
  }

  async subscribe(options: SubscriptionOptions = {}): Promise<SubscriptionResult> {
    if (!this.subscriptionManager) {
      throw new Error('SubscriptionManager is required for query subscription');
    }

    const filters = this.toFilter();
    
    const subscribeOptions: SubscriptionOptions = {
      ...options,
      autoClose: false // Don't auto-close for subscribe
    };

    return await this.subscriptionManager.subscribe(filters, subscribeOptions);
  }

  // Validation
  validate(): QueryValidation {
    const errors: string[] = [];

    // Check for time conflicts
    if (this.state.since !== undefined && this.state.until !== undefined) {
      if (this.state.until <= this.state.since) {
        errors.push('until must be after since');
      }
    }

    // Check for conflicting limits (this shouldn't happen with immutable design, but check anyway)
    // This is a design decision - we don't allow multiple limits in the same builder state

    // Check for empty filters
    const hasAnyFilter = this.state.kinds || this.state.authors || this.state.ids || 
                        this.state.since !== undefined || this.state.until !== undefined ||
                        this.state.limit !== undefined || this.state.tags || this.state.search;
    
    if (!hasAnyFilter && (!this.state.unionWith || this.state.unionWith.length === 0)) {
      // Empty filter is actually valid in Nostr - it means "get everything"
      // So we don't add an error here
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }

  // Getter for testing
  get _state(): QueryBuilderState {
    return { ...this.state };
  }
}

// Factory function
export function createQueryBuilder(subscriptionManager?: SubscriptionManager): IQueryBuilder {
  return new QueryBuilder({}, subscriptionManager);
}

// Export for backward compatibility
export function query(subscriptionManager?: SubscriptionManager): IQueryBuilder {
  return createQueryBuilder(subscriptionManager);
}