/**
 * ProfileCacheInterface - Cache Optimization for Profile Module (Phase 8)
 * 
 * Provides efficient access to the UniversalEventCache for profile-related queries.
 * Optimizes Profile and Follow List operations with intelligent caching.
 */

import type { UniversalEventCache } from '../cache/UniversalEventCache.js';
import type { ProfileMetadata, Follow } from './types.js';
import type { NostrEvent, Filter } from '../core/types.js';

export interface ProfileCacheStats {
  profileHits: number;
  profileMisses: number;
  followListHits: number;
  followListMisses: number;
  totalQueries: number;
  hitRate: number;
  avgQueryTime: number;
}

export class ProfileCacheInterface {
  private cache: UniversalEventCache;
  private stats = {
    profileHits: 0,
    profileMisses: 0,
    followListHits: 0,
    followListMisses: 0,
    totalQueries: 0,
    totalQueryTime: 0
  };
  
  constructor(cache: UniversalEventCache) {
    this.cache = cache;
  }

  /**
   * Get cached profile metadata (kind 0) for a single pubkey
   * Returns null if not in cache or stale
   */
  getCachedProfile(pubkey: string): ProfileMetadata | null {
    const startTime = performance.now();
    this.stats.totalQueries++;

    try {
      // Query cache for kind 0 events from this author
      const profileEvents = this.cache.query({
        kinds: [0],
        authors: [pubkey],
        limit: 1
      });

      const queryTime = performance.now() - startTime;
      this.stats.totalQueryTime += queryTime;

      if (profileEvents.length > 0) {
        this.stats.profileHits++;
        const profileEvent = profileEvents[0]; // Most recent
        
        try {
          const metadata: ProfileMetadata = JSON.parse(profileEvent.content);
          return metadata;
        } catch (e) {
          // Failed to parse profile JSON
          return null;
        }
      } else {
        this.stats.profileMisses++;
        return null;
      }
    } catch (error) {
      this.stats.profileMisses++;
      return null;
    }
  }

  /**
   * Get cached profile metadata for multiple pubkeys
   * Returns Map with only the profiles found in cache
   */
  getCachedProfiles(pubkeys: string[]): Map<string, ProfileMetadata> {
    const startTime = performance.now();
    this.stats.totalQueries++;

    const results = new Map<string, ProfileMetadata>();

    try {
      // Single cache query for all pubkeys
      const profileEvents = this.cache.query({
        kinds: [0],
        authors: pubkeys,
        limit: pubkeys.length * 2 // Allow for multiple profiles per author
      });

      const queryTime = performance.now() - startTime;
      this.stats.totalQueryTime += queryTime;

      // Group events by author, keep most recent
      const latestByAuthor = new Map<string, NostrEvent>();
      profileEvents.forEach(event => {
        const existing = latestByAuthor.get(event.pubkey);
        if (!existing || event.created_at > existing.created_at) {
          latestByAuthor.set(event.pubkey, event);
        }
      });

      // Parse metadata for each author
      latestByAuthor.forEach((event, pubkey) => {
        try {
          const metadata: ProfileMetadata = JSON.parse(event.content);
          results.set(pubkey, metadata);
          this.stats.profileHits++;
        } catch (e) {
          this.stats.profileMisses++;
          // Skip unparseable profiles
        }
      });

      // Count misses for pubkeys not found
      const foundPubkeys = new Set(results.keys());
      pubkeys.forEach(pubkey => {
        if (!foundPubkeys.has(pubkey)) {
          this.stats.profileMisses++;
        }
      });

      return results;
    } catch (error) {
      this.stats.profileMisses += pubkeys.length;
      return results;
    }
  }

  /**
   * Get cached follow list (kind 3) for a pubkey
   * Returns null if not in cache
   */
  getCachedFollowList(pubkey: string): Follow[] | null {
    const startTime = performance.now();
    this.stats.totalQueries++;

    try {
      // Query cache for kind 3 events from this author
      const followEvents = this.cache.query({
        kinds: [3],
        authors: [pubkey],
        limit: 1
      });

      const queryTime = performance.now() - startTime;
      this.stats.totalQueryTime += queryTime;

      if (followEvents.length > 0) {
        this.stats.followListHits++;
        const followEvent = followEvents[0]; // Most recent
        
        return this.parseFollowListEvent(followEvent);
      } else {
        this.stats.followListMisses++;
        return null;
      }
    } catch (error) {
      this.stats.followListMisses++;
      return null;
    }
  }

  /**
   * Check if we have recent profile data in cache
   * Useful for deciding whether to fetch from relay
   */
  hasRecentProfile(pubkey: string, maxAgeMinutes: number = 30): boolean {
    try {
      const profileEvents = this.cache.query({
        kinds: [0],
        authors: [pubkey],
        limit: 1
      });

      if (profileEvents.length === 0) return false;

      const profileEvent = profileEvents[0];
      const ageMinutes = (Date.now() / 1000 - profileEvent.created_at) / 60;
      
      return ageMinutes <= maxAgeMinutes;
    } catch {
      return false;
    }
  }

  /**
   * Check if we have recent follow list data in cache
   */
  hasRecentFollowList(pubkey: string, maxAgeMinutes: number = 60): boolean {
    try {
      const followEvents = this.cache.query({
        kinds: [3],
        authors: [pubkey],
        limit: 1
      });

      if (followEvents.length === 0) return false;

      const followEvent = followEvents[0];
      const ageMinutes = (Date.now() / 1000 - followEvent.created_at) / 60;
      
      return ageMinutes <= maxAgeMinutes;
    } catch {
      return false;
    }
  }

  /**
   * Get comprehensive cache statistics
   */
  getProfileCacheStats(): ProfileCacheStats {
    const totalHits = this.stats.profileHits + this.stats.followListHits;
    const totalMisses = this.stats.profileMisses + this.stats.followListMisses;
    const totalOperations = totalHits + totalMisses;

    return {
      profileHits: this.stats.profileHits,
      profileMisses: this.stats.profileMisses,
      followListHits: this.stats.followListHits,
      followListMisses: this.stats.followListMisses,
      totalQueries: this.stats.totalQueries,
      hitRate: totalOperations > 0 ? (totalHits / totalOperations) * 100 : 0,
      avgQueryTime: this.stats.totalQueries > 0 ? this.stats.totalQueryTime / this.stats.totalQueries : 0
    };
  }

  /**
   * Reset statistics (useful for testing)
   */
  resetStats(): void {
    this.stats = {
      profileHits: 0,
      profileMisses: 0,
      followListHits: 0,
      followListMisses: 0,
      totalQueries: 0,
      totalQueryTime: 0
    };
  }

  // Private helper methods

  private parseFollowListEvent(event: NostrEvent): Follow[] {
    const follows: Follow[] = [];
    
    try {
      // Parse p-tags from the follow list event (NIP-02)
      for (const tag of event.tags) {
        if (tag[0] === 'p' && tag[1]) {
          const follow: Follow = {
            pubkey: tag[1]
          };
          
          // Optional relay URL (3rd element)
          if (tag[2]) {
            follow.relayUrl = tag[2];
          }
          
          // Optional pet name (4th element)  
          if (tag[3]) {
            follow.petname = tag[3];
          }
          
          follows.push(follow);
        }
      }
      
      return follows;
    } catch (error) {
      console.warn('Failed to parse follow list event:', error);
      return [];
    }
  }
}