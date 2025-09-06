/**
 * QueryBuilder - Cache lookup with elegant fluent API
 * 
 * Implements the Query/Sub symmetry from the session architecture.
 * Query = immediate cache lookup, Sub = live subscription.
 */

import { FilterBuilder } from './FilterBuilder.js';
import { UniversalEventCache } from '../cache/UniversalEventCache.js';
import type { Filter } from '../core/types.js';
import { UniversalNostrStore } from '../store/UniversalNostrStore.js';
import type { NostrEvent } from '../core/types.js';

export class QueryBuilder extends FilterBuilder {
  constructor(private cache: UniversalEventCache) {
    super();
  }
  
  protected clone(newFilter: Filter): this {
    const cloned = new QueryBuilder(this.cache) as this;
    cloned.filter = newFilter;
    return cloned;
  }
  
  execute(): UniversalNostrStore<NostrEvent[]> {
    // Immediate cache lookup
    return new UniversalNostrStore(this.cache, this.filter);
  }
}

/**
 * Subscription handle for managing live subscriptions
 */
export interface SubscriptionHandle {
  id: string;
  store: UniversalNostrStore<NostrEvent[]>;
  stop(): Promise<void>;
  isActive(): boolean;
}

export class SubBuilder extends FilterBuilder {
  private relayUrls: string[] = [];
  // Auto-batching config (generalized: works for 'ids', 'authors', '#e', '#p')
  private autoBatchFieldName: string | null = null;
  private autoBatchWindowMs: number = 0; // microtask coalescing (same tick)
  private autoBatchMaxValues: number = 200;
  private autoBatchMaxTotalLimit: number = 1000; // safety cap for merged limit

  // Static pending batches per process (keyed by base filter signature + relays)
  private static pendingBatches: Map<string, {
    tagName: string;
    ids: Set<string>;
    timer: any;
    creating: boolean;
    sharedKey?: string;
    resolvers: Array<(key: string) => void>;
    targetRelays: string[] | undefined;
    baseFilter: any;
  }> = new Map();
  
  constructor(
    private cache: UniversalEventCache,
    private subscriptionManager: any // TODO: Type this properly
  ) {
    super();
  }
  
  protected clone(newFilter: Filter): this {
    const cloned = new SubBuilder(this.cache, this.subscriptionManager) as this;
    cloned.filter = newFilter;
    cloned.relayUrls = [...this.relayUrls];
    return cloned;
  }
  
  relay(url: string): this {
    const cloned = this.clone(this.filter);
    cloned.relayUrls = [url];
    return cloned;
  }
  
  relays(urls: string[]): this {
    const cloned = this.clone(this.filter);
    cloned.relayUrls = urls;
    return cloned;
  }
  
  /**
   * Execute the subscription and return a handle for lifecycle control
   * This provides excellent DX for managing subscriptions
   * USES SMART DEDUPLICATION to prevent subscription overload
   */
  async execute(): Promise<SubscriptionHandle> {
    const targetRelays = this.relayUrls.length > 0 ? this.relayUrls : undefined;

    // Auto-enable batching for common patterns: single value fields that can be merged
    if (!this.autoBatchFieldName) {
      const candidateFields = ['ids', 'authors', '#e', '#p'] as const;
      for (const field of candidateFields) {
        const values = (this.filter as any)[field] as string[] | undefined;
        if (Array.isArray(values) && values.length === 1) {
          this.autoBatchFieldName = field;
          break;
        }
      }
    }

    if (this.autoBatchFieldName && Array.isArray((this.filter as any)[this.autoBatchFieldName]) && ((this.filter as any)[this.autoBatchFieldName] as string[]).length === 1) {
      // Only batch for simple filters to avoid semantics surprises
      const allowedKeys = new Set<string>(['kinds', this.autoBatchFieldName, 'limit']);
      const rawFilter: any = this.filter as any;
      // Consider only meaningful keys (ignore empty arrays/objects/null)
      const filterKeys = Object.keys(rawFilter).filter((k) => {
        const v = rawFilter[k];
        if (v == null) return false;
        if (Array.isArray(v)) return v.length > 0;
        if (typeof v === 'object') return Object.keys(v).length > 0;
        return true;
      });
      const hasDisallowedKey = filterKeys.some((k) => !allowedKeys.has(k));
      if (hasDisallowedKey) {
        // Fallback to normal subscription
        return await this.executeNonBatched(targetRelays);
      }
      // Build a batch key ignoring the specific tag value
      const fieldName = this.autoBatchFieldName;
      const baseFilter: any = { ...this.filter } as any;
      const fieldVals = baseFilter[fieldName] as string[];
      const singleId: string = String(fieldVals[0]);
      baseFilter[fieldName] = '__BATCH__';
      const relaysKey = (targetRelays || []).slice().sort().join(',');
      const batchKey = JSON.stringify(baseFilter) + '::' + relaysKey;

      // Ensure batch bucket
      if (!SubBuilder.pendingBatches.has(batchKey)) {
        SubBuilder.pendingBatches.set(batchKey, {
          tagName: fieldName,
          ids: new Set<string>(),
          timer: null,
          creating: false,
          resolvers: [],
          targetRelays,
          baseFilter
        });
      }
      const batch = SubBuilder.pendingBatches.get(batchKey)!;
      batch.ids.add(singleId);

      // Create a promise that resolves to the shared key when batch fires
      const sharedKeyPromise = new Promise<string>((resolve) => {
        batch.resolvers.push((key: string) => resolve(key ?? batchKey));
      });

      if (!batch.timer) {
        const flush = async () => {
          batch.timer = null;
          if (batch.creating) return;
          batch.creating = true;
          try {
            const mergedIds = Array.from(batch.ids).slice(0, this.autoBatchMaxValues);
            const mergedFilter: any = { ...batch.baseFilter };
            mergedFilter[batch.tagName] = mergedIds;
            // Adjust limit: per-id * count, but keep a sensible global cap
            const perIdLimit = (this.filter as any).limit ?? 100;
            const totalLimit = Math.min(perIdLimit * mergedIds.length, this.autoBatchMaxTotalLimit);
            if (totalLimit) {
              mergedFilter.limit = totalLimit;
            }
            const sharedSub = await this.subscriptionManager.getOrCreateSubscription([mergedFilter], batch.targetRelays);
            const batchedListenerId = sharedSub.addListener({
              onEvent: (event: NostrEvent) => {
                this.cache.addEvent(event);
              }
            });
            // Ensure shared key is a string for resolvers (SharedSubscription.key is string)
            const sharedKey: string = String(sharedSub.key);
            batch.sharedKey = sharedKey;
            batch.resolvers.forEach((r) => r(sharedKey));
            batch.resolvers = [];
            // Register listener so that a later stop() can deregister
            (SubBuilder as any)._batchedListenerRegistry = (SubBuilder as any)._batchedListenerRegistry || new Map<string, { sub: any, listenerId: string }>();
            (SubBuilder as any)._batchedListenerRegistry.set(sharedKey, { sub: sharedSub, listenerId: batchedListenerId });
          } finally {
            SubBuilder.pendingBatches.delete(batchKey);
          }
        };
        // Coalesce within a frame; fallback to immediate timeout
        if (typeof window !== 'undefined' && typeof (window as any).requestAnimationFrame === 'function') {
          (batch as any).timer = (window as any).requestAnimationFrame(() => flush());
        } else {
          (batch as any).timer = setTimeout(flush, this.autoBatchWindowMs || 0);
        }
      }

      // Build store immediately; subscription will arrive via batch
      const store = new UniversalNostrStore(this.cache, this.filter);
      let resolvedKey: string | null = null;
      sharedKeyPromise.then((k) => { resolvedKey = k; });

      return {
        id: resolvedKey || batchKey,
        store,
        stop: async () => {
          const registry = (SubBuilder as any)._batchedListenerRegistry as Map<string, { sub: any, listenerId: string }> | undefined;
          const key = resolvedKey || batchKey;
          if (registry && registry.has(key)) {
            const entry = registry.get(key)!;
            const noListeners = entry.sub.removeListener(entry.listenerId);
            registry.delete(key);
            if (noListeners && this.subscriptionManager?.cleanupSharedSubscriptions) {
              await this.subscriptionManager.cleanupSharedSubscriptions();
            }
          }
        },
        isActive: () => true
      };
    }

    // Fallback: normal deduped subscription
    const sharedSub = await this.subscriptionManager.getOrCreateSubscription([this.filter], targetRelays);
    const listenerId = sharedSub.addListener({
      onEvent: (event: NostrEvent) => {
        this.cache.addEvent(event);
      }
    });
    const store = new UniversalNostrStore(this.cache, this.filter);
    return {
      id: sharedSub.key,
      store,
      stop: async () => {
        // Remove listener and cleanup shared subscriptions when no listeners remain
        const noListeners = sharedSub.removeListener(listenerId);
        if (noListeners && this.subscriptionManager?.cleanupSharedSubscriptions) {
          await this.subscriptionManager.cleanupSharedSubscriptions();
        }
      },
      isActive: () => sharedSub.hasListeners()
    };
  }

  /**
   * Execute a single-shot subscription that auto-unsubscribes.
   * closeOn:
   *  - 'eose' (default): unsubscribe after EOSE is received
   *  - 'first-event': unsubscribe after the first matching event arrives
   */
  async executeOnce(opts?: { closeOn?: 'eose' | 'first-event' }): Promise<SubscriptionHandle> {
    const closeOn = opts?.closeOn || 'eose';
    const targetRelays = this.relayUrls.length > 0 ? this.relayUrls : undefined;

    // Reuse shared subscription for deduplication and batching benefits
    const sharedSub = await this.subscriptionManager.getOrCreateSubscription([this.filter], targetRelays);

    // Local listener which will remove itself and trigger cleanup
    const listenerId = sharedSub.addListener({
      onEvent: (event: any) => {
        // Add to cache immediately
        this.cache.addEvent(event);
        if (closeOn === 'first-event') {
          // Remove our listener and cleanup; underlying sub stays if others listen
          const noListeners = sharedSub.removeListener(listenerId);
          if (noListeners && this.subscriptionManager?.cleanupSharedSubscriptions) {
            this.subscriptionManager.cleanupSharedSubscriptions().catch(()=>{});
          }
        }
      },
      onEose: (_relay: string) => {
        if (closeOn === 'eose') {
          const noListeners = sharedSub.removeListener(listenerId);
          if (noListeners && this.subscriptionManager?.cleanupSharedSubscriptions) {
            this.subscriptionManager.cleanupSharedSubscriptions().catch(()=>{});
          }
        }
      }
    });

    // Build a cache-backed store for consumers
    const store = new UniversalNostrStore(this.cache, this.filter);

    return {
      id: sharedSub.key,
      store,
      stop: async () => {
        const noListeners = sharedSub.removeListener(listenerId);
        if (noListeners && this.subscriptionManager?.cleanupSharedSubscriptions) {
          await this.subscriptionManager.cleanupSharedSubscriptions();
        }
      },
      isActive: () => sharedSub.hasListeners()
    };
  }

  private async executeNonBatched(targetRelays?: string[]): Promise<SubscriptionHandle> {
    const sharedSub = await this.subscriptionManager.getOrCreateSubscription([this.filter], targetRelays);
    const listenerId = sharedSub.addListener({
      onEvent: (event: NostrEvent) => {
        this.cache.addEvent(event);
      }
    });
    const store = new UniversalNostrStore(this.cache, this.filter);
    return {
      id: sharedSub.key,
      store,
      stop: async () => {
        const noListeners = sharedSub.removeListener(listenerId);
        if (noListeners && this.subscriptionManager?.cleanupSharedSubscriptions) {
          await this.subscriptionManager.cleanupSharedSubscriptions();
        }
      },
      isActive: () => sharedSub.hasListeners()
    };
  }
}