/**
 * ProfileDiscoveryBuilder - Profile Search and Discovery
 * 
 * Provides search and discovery functionality for profiles with various
 * criteria including name search, NIP-05 verification, and metadata filtering.
 */

import type { SubscriptionManager } from '../subscription/SubscriptionManager.js';
import type { UserProfile, ProfileDiscoveryResult, ProfileSearchCriteria } from './types.js';
import type { NostrEvent, Filter } from '../core/types.js';

export interface ProfileDiscoveryBuilderConfig {
  subscriptionManager: SubscriptionManager;
  debug?: boolean;
}

export class ProfileDiscoveryBuilder {
  private config: ProfileDiscoveryBuilderConfig;
  private criteria: ProfileSearchCriteria = {};

  constructor(config: ProfileDiscoveryBuilderConfig) {
    this.config = config;
  }

  /**
   * Search profiles by NIP-05 identifier
   */
  byNip05(identifier: string): this {
    this.criteria.nip05Query = identifier.toLowerCase();
    return this;
  }

  /**
   * Search profiles by name (substring match)
   */
  byName(name: string): this {
    this.criteria.nameQuery = name.toLowerCase();
    return this;
  }

  /**
   * Filter profiles by metadata key-value pairs
   */
  withMetadata(key: string, value?: any): this {
    if (!this.criteria.metadataFilters) {
      this.criteria.metadataFilters = new Map();
    }
    this.criteria.metadataFilters.set(key, value);
    return this;
  }

  /**
   * Only include NIP-05 verified profiles
   */
  verified(): this {
    this.criteria.verifiedOnly = true;
    return this;
  }

  /**
   * Limit the number of results returned
   */
  limit(count: number): this {
    this.criteria.limit = Math.max(1, Math.min(count, 100)); // Cap at 100 for performance
    return this;
  }

  /**
   * Execute the profile discovery search
   */
  async execute(): Promise<ProfileDiscoveryResult[]> {
    if (this.config.debug) {
      console.log('ProfileDiscoveryBuilder: Starting discovery with criteria:', this.criteria);
    }

    try {
      // Create filter for profile events (kind 0)
      const filter: Filter = {
        kinds: [0],
        limit: this.criteria.limit || 50 // Default limit
      };

      const results: ProfileDiscoveryResult[] = [];
      const processedPubkeys = new Set<string>();

      return new Promise((resolve) => {
        let searchComplete = false;
        
        const timeoutId = setTimeout(() => {
          if (!searchComplete) {
            searchComplete = true;
            this.finalizeResults(results, resolve);
          }
        }, 10000); // 10 second timeout for discovery

        this.config.subscriptionManager.subscribe([filter], {
          onEvent: async (event: NostrEvent) => {
            if (event.kind === 0 && !processedPubkeys.has(event.pubkey)) {
              processedPubkeys.add(event.pubkey);
              
              try {
                const profile = await this.parseProfileEvent(event);
                const discoveryResult = await this.evaluateProfile(profile);
                
                if (discoveryResult) {
                  results.push(discoveryResult);
                  
                  if (this.config.debug) {
                    console.log(`ProfileDiscoveryBuilder: Found match - ${profile.metadata.name || 'unnamed'} (score: ${discoveryResult.relevanceScore})`);
                  }

                  // Stop early if we have enough results
                  if (this.criteria.limit && results.length >= this.criteria.limit) {
                    if (!searchComplete) {
                      searchComplete = true;
                      clearTimeout(timeoutId);
                      this.finalizeResults(results, resolve);
                    }
                  }
                }
              } catch (error) {
                if (this.config.debug) {
                  console.error('ProfileDiscoveryBuilder: Error processing profile:', error);
                }
              }
            }
          },
          onEose: () => {
            if (!searchComplete) {
              searchComplete = true;
              clearTimeout(timeoutId);
              this.finalizeResults(results, resolve);
            }
          },
          onError: (error: Error) => {
            if (!searchComplete) {
              searchComplete = true;
              clearTimeout(timeoutId);
              
              if (this.config.debug) {
                console.error('ProfileDiscoveryBuilder: Search error:', error);
              }
              
              resolve(results); // Return partial results even on error
            }
          }
        });
      });

    } catch (error) {
      if (this.config.debug) {
        console.error('ProfileDiscoveryBuilder: Failed to start discovery:', error);
      }
      return [];
    }
  }

  // Private helper methods

  private async parseProfileEvent(event: NostrEvent): Promise<UserProfile> {
    try {
      const metadata = JSON.parse(event.content);
      return {
        pubkey: event.pubkey,
        metadata,
        lastUpdated: event.created_at,
        eventId: event.id,
        isOwn: false
      };
    } catch (error) {
      throw new Error('Failed to parse profile event');
    }
  }

  private async evaluateProfile(profile: UserProfile): Promise<ProfileDiscoveryResult | null> {
    const matchedFields: string[] = [];
    let relevanceScore = 0;
    let matches = 0;
    let totalCriteria = 0;

    // Name search
    if (this.criteria.nameQuery) {
      totalCriteria++;
      const name = profile.metadata.name?.toLowerCase() || '';
      if (name.includes(this.criteria.nameQuery)) {
        matchedFields.push('name');
        matches++;
        // Higher score for exact matches
        if (name === this.criteria.nameQuery) {
          relevanceScore += 1.0;
        } else if (name.startsWith(this.criteria.nameQuery)) {
          relevanceScore += 0.8;
        } else {
          relevanceScore += 0.5;
        }
      } else {
        return null; // Name is required if specified
      }
    }

    // NIP-05 search
    if (this.criteria.nip05Query) {
      totalCriteria++;
      const nip05 = profile.metadata.nip05?.toLowerCase() || '';
      if (nip05.includes(this.criteria.nip05Query)) {
        matchedFields.push('nip05');
        matches++;
        relevanceScore += nip05 === this.criteria.nip05Query ? 1.0 : 0.7;
      } else {
        return null; // NIP-05 is required if specified
      }
    }

    // Metadata filters
    if (this.criteria.metadataFilters && this.criteria.metadataFilters.size > 0) {
      for (const [key, expectedValue] of this.criteria.metadataFilters) {
        totalCriteria++;
        const actualValue = profile.metadata[key as keyof typeof profile.metadata];
        
        if (actualValue !== undefined) {
          if (expectedValue === undefined) {
            // Just check if key exists
            matchedFields.push(key);
            matches++;
            relevanceScore += 0.3;
          } else if (typeof actualValue === 'string' && typeof expectedValue === 'string') {
            // String comparison (case insensitive substring)
            if (actualValue.toLowerCase().includes(expectedValue.toLowerCase())) {
              matchedFields.push(key);
              matches++;
              relevanceScore += actualValue.toLowerCase() === expectedValue.toLowerCase() ? 0.8 : 0.5;
            }
          } else if (actualValue === expectedValue) {
            // Exact match
            matchedFields.push(key);
            matches++;
            relevanceScore += 0.8;
          }
        }
      }
    }

    // NIP-05 verification check
    if (this.criteria.verifiedOnly) {
      totalCriteria++;
      if (profile.metadata.nip05) {
        const isVerified = await this.checkNip05Verification(profile);
        if (isVerified) {
          matchedFields.push('verified');
          matches++;
          relevanceScore += 0.5;
        } else if (this.criteria.verifiedOnly) {
          return null; // Verification required but failed
        }
      } else if (this.criteria.verifiedOnly) {
        return null; // No NIP-05 but verification required
      }
    }

    // If no criteria specified, include all profiles with low score
    if (totalCriteria === 0) {
      relevanceScore = 0.1;
      matches = 1;
      totalCriteria = 1;
    }

    // Must match at least something if criteria specified
    if (totalCriteria > 0 && matches === 0) {
      return null;
    }

    // Normalize relevance score
    const finalScore = Math.min(1.0, relevanceScore / Math.max(totalCriteria, 1));

    return {
      profile,
      matchedFields,
      relevanceScore: finalScore
    };
  }

  private async checkNip05Verification(profile: UserProfile): Promise<boolean> {
    if (!profile.metadata.nip05) return false;
    
    try {
      // Extract local and domain parts
      const [local, domain] = profile.metadata.nip05.split('@');
      if (!local || !domain) return false;

      // Fetch .well-known/nostr.json with timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);
      
      const response = await fetch(`https://${domain}/.well-known/nostr.json?name=${local}`, {
        signal: controller.signal
      });
      clearTimeout(timeoutId);
      
      if (!response.ok) return false;

      const data = await response.json();
      const expectedPubkey = data.names?.[local];
      
      // Verify the pubkey matches
      return expectedPubkey === profile.pubkey;
    } catch (error) {
      if (this.config.debug) {
        console.error('ProfileDiscoveryBuilder: NIP-05 verification failed:', error);
      }
      return false;
    }
  }

  private finalizeResults(
    results: ProfileDiscoveryResult[], 
    resolve: (results: ProfileDiscoveryResult[]) => void
  ): void {
    // Sort by relevance score (highest first)
    results.sort((a, b) => b.relevanceScore - a.relevanceScore);
    
    // Apply limit if specified
    const finalResults = this.criteria.limit ? results.slice(0, this.criteria.limit) : results;
    
    if (this.config.debug) {
      console.log(`ProfileDiscoveryBuilder: Discovery complete - found ${finalResults.length} matches`);
    }
    
    resolve(finalResults);
  }
}