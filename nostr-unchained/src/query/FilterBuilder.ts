/**
 * FilterBuilder - Base class for Query and Sub builders
 * 
 * Provides identical fluent API for both cache queries and live subscriptions.
 * This ensures perfect API symmetry as designed in the session architecture.
 */

import type { Filter } from '../core/types.js';

export abstract class FilterBuilder {
  protected filter: Filter = {};
  
  kinds(kinds: number[]): this {
    this.filter.kinds = kinds;
    return this;
  }
  
  authors(authors: string[]): this {
    this.filter.authors = authors;
    return this;
  }
  
  tags(tagName: string, values: string[]): this {
    this.filter[`#${tagName}`] = values;
    return this;
  }
  
  since(timestamp: number): this {
    this.filter.since = timestamp;
    return this;
  }
  
  until(timestamp: number): this {
    this.filter.until = timestamp;
    return this;
  }
  
  limit(count: number): this {
    this.filter.limit = count;
    return this;
  }
  
  ids(ids: string[]): this {
    this.filter.ids = ids;
    return this;
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