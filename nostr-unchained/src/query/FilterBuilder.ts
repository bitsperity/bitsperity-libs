/**
 * FilterBuilder - Base class for Query and Sub builders
 * 
 * Provides identical fluent API for both cache queries and live subscriptions.
 * This ensures perfect API symmetry as designed in the session architecture.
 */

import type { Filter } from '../core/types.js';

export abstract class FilterBuilder {
  protected filter: Filter = {};
  
  // Abstract method to create new instance - subclasses must implement
  protected abstract clone(newFilter: Filter): this;
  
  kinds(kinds: number[]): this {
    const newFilter = { ...this.filter, kinds };
    return this.clone(newFilter);
  }
  
  authors(authors: string[]): this {
    const newFilter = { ...this.filter, authors };
    return this.clone(newFilter);
  }
  
  tags(tagName: string, values?: string[]): this {
    const newFilter = { ...this.filter };
    if (values) {
      newFilter[`#${tagName}`] = values;
    } else {
      // If no values provided, just check for existence of the tag
      newFilter[`#${tagName}`] = [];
    }
    return this.clone(newFilter);
  }
  
  since(timestamp: number): this {
    const newFilter = { ...this.filter, since: timestamp };
    return this.clone(newFilter);
  }
  
  until(timestamp: number): this {
    const newFilter = { ...this.filter, until: timestamp };
    return this.clone(newFilter);
  }
  
  limit(count: number): this {
    const newFilter = { ...this.filter, limit: count };
    return this.clone(newFilter);
  }
  
  ids(ids: string[]): this {
    const newFilter = { ...this.filter, ids };
    return this.clone(newFilter);
  }
  
  // Convenience methods for common patterns
  notes(): this {
    return this.kinds([1]);
  }
  
  profiles(): this {
    return this.kinds([0]);
  }
  
  reactions(): this {
    return this.kinds([7]);
  }
  
  dms(): this {
    return this.kinds([14]);
  }
  
  reposts(): this {
    return this.kinds([6]);
  }
}