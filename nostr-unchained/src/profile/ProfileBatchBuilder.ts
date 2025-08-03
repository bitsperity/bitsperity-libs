/**
 * ProfileBatchBuilder - Efficient Multiple Profile Operations
 * 
 * CLEAN ARCHITECTURE: Uses base layer for all operations
 * Provides batch operations for fetching multiple profiles with optimal caching.
 */

import type { UserProfile, BatchProfileResult } from './types.js';
import type { NostrUnchained } from '../core/NostrUnchained.js';

export interface ProfileBatchBuilderConfig {
  debug?: boolean;
  // CLEAN ARCHITECTURE: Use base layer instead of direct SubscriptionManager
  nostr: NostrUnchained;
}

export class ProfileBatchBuilder {
  private config: ProfileBatchBuilderConfig;
  private pubkeys: string[] = [];

  constructor(config: ProfileBatchBuilderConfig) {
    this.config = config;
  }

  /**
   * Set the list of pubkeys to fetch profiles for
   */
  get(pubkeys: string[]): this {
    this.pubkeys = [...pubkeys]; // Copy array to avoid mutations
    return this;
  }

  /**
   * Execute batch profile fetch using CLEAN ARCHITECTURE
   */
  async execute(): Promise<BatchProfileResult> {
    if (this.pubkeys.length === 0) {
      return {
        profiles: new Map(),
        success: true,
        errors: new Map(),
        totalRequested: 0,
        totalFound: 0
      };
    }

    if (this.config.debug) {
      console.log(`ProfileBatchBuilder: Fetching ${this.pubkeys.length} profiles using base layer`);
    }

    try {
      // CLEAN ARCHITECTURE: Use base layer for batch profile fetching
      const profileStore = this.config.nostr.query()
        .kinds([0])
        .authors(this.pubkeys)
        .limit(this.pubkeys.length)
        .execute();

      // Try cache first (instant!)
      const cachedProfiles = profileStore.current;
      const profiles = new Map<string, UserProfile | null>();
      const errors = new Map<string, string>();

      // Initialize all profiles as null (not found)
      this.pubkeys.forEach(pubkey => {
        profiles.set(pubkey, null);
      });

      // Parse cached profiles
      let foundCount = 0;
      cachedProfiles.forEach(event => {
        if (event.kind === 0 && this.pubkeys.includes(event.pubkey)) {
          try {
            const metadata = JSON.parse(event.content);
            const profile: UserProfile = {
              pubkey: event.pubkey,
              metadata,
              lastUpdated: event.created_at,
              eventId: event.id,
              isOwn: false
            };
            profiles.set(event.pubkey, profile);
            foundCount++;
          } catch (error) {
            errors.set(event.pubkey, 'Failed to parse profile metadata');
          }
        }
      });

      if (this.config.debug) {
        console.log(`ProfileBatchBuilder: Found ${foundCount}/${this.pubkeys.length} profiles in cache`);
      }

      // If we found all profiles in cache, return immediately
      if (foundCount === this.pubkeys.length) {
        return {
          profiles,
          success: true,
          errors,
          totalRequested: this.pubkeys.length,
          totalFound: foundCount
        };
      }

      // Start subscription for missing profiles
      await this.config.nostr.sub()
        .kinds([0])
        .authors(this.pubkeys)
        .limit(this.pubkeys.length)
        .execute();

      // Wait a bit for subscription to populate cache
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Check cache again for newly fetched profiles
      const updatedProfiles = profileStore.current;
      updatedProfiles.forEach(event => {
        if (event.kind === 0 && this.pubkeys.includes(event.pubkey) && !profiles.get(event.pubkey)) {
          try {
            const metadata = JSON.parse(event.content);
            const profile: UserProfile = {
              pubkey: event.pubkey,
              metadata,
              lastUpdated: event.created_at,
              eventId: event.id,
              isOwn: false
            };
            profiles.set(event.pubkey, profile);
            foundCount++;
          } catch (error) {
            errors.set(event.pubkey, 'Failed to parse profile metadata');
          }
        }
      });

      if (this.config.debug) {
        console.log(`ProfileBatchBuilder: Final result - found ${foundCount}/${this.pubkeys.length} profiles`);
      }

      return {
        profiles,
        success: true,
        errors,
        totalRequested: this.pubkeys.length,
        totalFound: foundCount
      };

    } catch (error) {
      return {
        profiles: new Map(),
        success: false,
        errors: new Map([['batch', error instanceof Error ? error.message : 'Unknown error']]),
        totalRequested: this.pubkeys.length,
        totalFound: 0
      };
    }
  }

  /**
   * Execute and return a reactive store for continuous updates
   */
  executeReactive() {
    // CLEAN ARCHITECTURE: Return the base layer store directly
    return this.config.nostr.query()
      .kinds([0])
      .authors(this.pubkeys)
      .execute()
      .map(events => {
        // Transform events to UserProfile map
        const profiles = new Map<string, UserProfile | null>();
        
        // Initialize all as null
        this.pubkeys.forEach(pubkey => profiles.set(pubkey, null));
        
        // Fill found profiles
        events.forEach(event => {
          if (event.kind === 0 && this.pubkeys.includes(event.pubkey)) {
            try {
              const metadata = JSON.parse(event.content);
              profiles.set(event.pubkey, {
                pubkey: event.pubkey,
                metadata,
                lastUpdated: event.created_at,
                eventId: event.id,
                isOwn: false
              });
            } catch (error) {
              // Skip invalid profiles
            }
          }
        });
        
        return profiles;
      });
  }

  /**
   * Watch for profile updates with reactive store
   */
  watch() {
    // Start subscription for live updates
    this.config.nostr.sub()
      .kinds([0])
      .authors(this.pubkeys)
      .execute()
      .catch(error => {
        if (this.config.debug) {
          console.warn('ProfileBatchBuilder: Failed to start watch subscription:', error);
        }
      });

    // Return reactive store
    return this.executeReactive();
  }
}