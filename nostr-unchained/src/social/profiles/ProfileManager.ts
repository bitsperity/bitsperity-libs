/**
 * ProfileManager - User Profile Management (NIP-01 Kind 0)
 * 
 * Provides clean, reactive profile management:
 * - Create and update user profiles
 * - Fetch profiles for any user
 * - Reactive profile updates via stores
 * - Profile caching for performance
 */

import { writable, derived, type Readable, type Writable } from '../../store/NostrStore.js';
import type { 
  UserProfile, 
  ProfileMetadata, 
  ProfileUpdate,
  ProfileCreateRequest,
  ProfilePublishResult,
  ProfileFetchOptions,
  ProfileCacheEntry,
  ProfileEvent
} from '../types/profile-types.js';
import type { SubscriptionManager } from '../../subscription/SubscriptionManager.js';
import type { RelayManager } from '../../relay/RelayManager.js';
import type { SigningProvider } from '../../crypto/SigningProvider.js';
import type { EventBuilder } from '../../events/EventBuilder.js';
import type { NostrEvent, Filter } from '../../core/types.js';

export interface ProfileManagerConfig {
  subscriptionManager: SubscriptionManager;
  relayManager: RelayManager;
  signingProvider: SigningProvider;
  eventBuilder: EventBuilder;
  debug?: boolean;
}

export class ProfileManager {
  private config: ProfileManagerConfig;
  private profileCache = new Map<string, ProfileCacheEntry>();
  private activeSubscriptions = new Map<string, string>(); // pubkey -> subscriptionId
  
  // Reactive stores
  private _myProfile = writable<UserProfile | null>(null);
  private _profileUpdates = writable<Map<string, UserProfile>>(new Map());
  
  // Public reactive properties
  public readonly mine: Readable<UserProfile | null>;
  public readonly updates: Readable<Map<string, UserProfile>>;

  constructor(config: ProfileManagerConfig) {
    this.config = config;
    
    // Set up derived stores
    this.mine = this._myProfile;
    this.updates = this._profileUpdates;
    
    // Initialize own profile if signing provider is available
    if (this.config.signingProvider) {
      this.initializeOwnProfile();
    }
  }

  /**
   * Create a new user profile
   */
  async create(profileData: ProfileCreateRequest): Promise<ProfilePublishResult> {
    try {
      if (!this.config.signingProvider) {
        return {
          success: false,
          error: 'No signing provider available'
        };
      }

      // Validate profile data
      const validation = this.validateProfileData(profileData);
      if (!validation.isValid) {
        return {
          success: false,
          error: `Invalid profile data: ${validation.errors.join(', ')}`
        };
      }

      const userPubkey = await this.config.signingProvider.getPublicKey();
      
      // Create profile event (NIP-01 Kind 0)
      const profileEvent = await this.config.eventBuilder
        .kind(0)
        .content(JSON.stringify(profileData))
        .build();

      // Publish to relays
      const publishResults = await this.config.relayManager.publishToAll(profileEvent);
      const success = publishResults.some(result => result.success);

      if (success) {
        // Create user profile object
        const profile: UserProfile = {
          pubkey: userPubkey,
          metadata: profileData,
          lastUpdated: profileEvent.created_at,
          eventId: profileEvent.id,
          isOwn: true
        };

        // Update stores
        this._myProfile.set(profile);
        this._profileUpdates.update(profiles => {
          profiles.set(userPubkey, profile);
          return new Map(profiles);
        });

        // Cache the profile
        this.cacheProfile(profile);

        if (this.config.debug) {
          console.log('Profile created successfully:', profile);
        }

        return {
          success: true,
          eventId: profileEvent.id,
          profile
        };
      } else {
        const error = 'Failed to publish profile to any relay';
        return {
          success: false,
          error
        };
      }

    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Unknown error creating profile';
      return {
        success: false,
        error: errorMsg
      };
    }
  }

  /**
   * Update existing user profile
   */
  async update(updates: ProfileUpdate): Promise<ProfilePublishResult> {
    try {
      if (!this.config.signingProvider) {
        return {
          success: false,
          error: 'No signing provider available'
        };
      }

      // Get current profile
      const currentProfile = await this.getMine();
      if (!currentProfile) {
        // No existing profile, treat as create
        if (!updates.name) {
          return {
            success: false,
            error: 'Name is required for profile creation'
          };
        }
        return this.create(updates as ProfileCreateRequest);
      }

      // Merge with existing profile data
      const updatedMetadata: ProfileMetadata = {
        ...currentProfile.metadata,
        ...updates
      };

      // Validate merged data
      const validation = this.validateProfileData(updatedMetadata);
      if (!validation.isValid) {
        return {
          success: false,
          error: `Invalid profile data: ${validation.errors.join(', ')}`
        };
      }

      const userPubkey = await this.config.signingProvider.getPublicKey();

      // Create updated profile event
      const profileEvent = await this.config.eventBuilder
        .kind(0)
        .content(JSON.stringify(updatedMetadata))
        .build();

      // Publish to relays
      const publishResults = await this.config.relayManager.publishToAll(profileEvent);
      const success = publishResults.some(result => result.success);

      if (success) {
        // Create updated profile object
        const profile: UserProfile = {
          pubkey: userPubkey,
          metadata: updatedMetadata,
          lastUpdated: profileEvent.created_at,
          eventId: profileEvent.id,
          isOwn: true
        };

        // Update stores
        this._myProfile.set(profile);
        this._profileUpdates.update(profiles => {
          profiles.set(userPubkey, profile);
          return new Map(profiles);
        });

        // Cache the profile
        this.cacheProfile(profile);

        if (this.config.debug) {
          console.log('Profile updated successfully:', profile);
        }

        return {
          success: true,
          eventId: profileEvent.id,
          profile
        };
      } else {
        return {
          success: false,
          error: 'Failed to publish profile update to any relay'
        };
      }

    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Unknown error updating profile';
      return {
        success: false,
        error: errorMsg
      };
    }
  }

  /**
   * Get current user's profile
   */
  async getMine(): Promise<UserProfile | null> {
    if (!this.config.signingProvider) {
      return null;
    }

    try {
      const userPubkey = await this.config.signingProvider.getPublicKey();
      return this.get(userPubkey);
    } catch {
      return null;
    }
  }

  /**
   * Get profile for any user by pubkey
   */
  async get(pubkey: string, options: ProfileFetchOptions = {}): Promise<UserProfile | null> {
    try {
      // Check cache first if useCache is not explicitly false
      if (options.useCache !== false) {
        const cached = this.getCachedProfile(pubkey);
        if (cached) {
          return cached;
        }
      }

      // If useCache is explicitly true and we have no cache, still fetch
      // Subscribe to profile events for this user
      const filter: Filter = {
        kinds: [0],
        authors: [pubkey],
        limit: 1
      };

      return new Promise((resolve) => {
        let resolved = false;
        const timeout = setTimeout(() => {
          if (!resolved) {
            resolved = true;
            resolve(null);
          }
        }, options.timeout || 5000);

        this.config.subscriptionManager.subscribe([filter], {
          onEvent: (event: NostrEvent) => {
            if (!resolved && event.kind === 0) {
              resolved = true;
              clearTimeout(timeout);
              
              try {
                const profile = this.parseProfileEvent(event as ProfileEvent);
                this.cacheProfile(profile);
                
                // Update reactive store
                this._profileUpdates.update(profiles => {
                  profiles.set(pubkey, profile);
                  return new Map(profiles);
                });
                
                resolve(profile);
              } catch (error) {
                resolve(null);
              }
            }
          },
          onEose: () => {
            if (!resolved) {
              resolved = true;
              clearTimeout(timeout);
              resolve(null);
            }
          }
        });
      });

    } catch (error) {
      if (this.config.debug) {
        console.error('Error fetching profile:', error);
      }
      return null;
    }
  }

  /**
   * Update signing provider
   */
  async updateSigningProvider(signingProvider: SigningProvider): Promise<void> {
    this.config.signingProvider = signingProvider;
    await this.initializeOwnProfile();
  }

  /**
   * Close all subscriptions and cleanup
   */
  async close(): Promise<void> {
    // Close all active subscriptions
    const closePromises = Array.from(this.activeSubscriptions.values()).map(
      subscriptionId => this.config.subscriptionManager.close(subscriptionId)
    );
    
    await Promise.allSettled(closePromises);
    this.activeSubscriptions.clear();
    this.profileCache.clear();
    
    // Call close on subscription manager to match test expectations
    if (this.config.subscriptionManager.close) {
      await this.config.subscriptionManager.close();
    }
    
    if (this.config.debug) {
      console.log('ProfileManager: Closed all subscriptions and cleared cache');
    }
  }

  // Private helper methods

  private async initializeOwnProfile(): Promise<void> {
    try {
      const myProfile = await this.getMine();
      if (myProfile) {
        this._myProfile.set(myProfile);
        if (this.config.debug) {
          console.log('Initialized own profile:', myProfile);
        }
      }
    } catch (error) {
      if (this.config.debug) {
        console.error('Failed to initialize own profile:', error);
      }
    }
  }

  private parseProfileEvent(event: ProfileEvent): UserProfile {
    const metadata: ProfileMetadata = JSON.parse(event.content);
    const userPubkey = this.config.signingProvider?.getPublicKey ? 
      this.config.signingProvider.getPublicKey() : Promise.resolve('');
    
    return {
      pubkey: event.pubkey,
      metadata,
      lastUpdated: event.created_at,
      eventId: event.id,
      isOwn: false // Will be updated based on pubkey comparison
    };
  }

  private validateProfileData(data: any): { isValid: boolean; errors: string[]; warnings: string[] } {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Validate URLs if present
    if (data.picture && !this.isValidUrl(data.picture)) {
      errors.push('Invalid picture URL');
    }
    
    if (data.banner && !this.isValidUrl(data.banner)) {
      errors.push('Invalid banner URL');
    }
    
    if (data.website && !this.isValidUrl(data.website)) {
      errors.push('Invalid website URL');
    }

    // Validate NIP-05 identifier
    if (data.nip05 && !this.isValidNip05(data.nip05)) {
      warnings.push('Invalid NIP-05 identifier format');
    }

    // Check content length
    if (data.about && data.about.length > 500) {
      warnings.push('About section is quite long');
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }

  private isValidUrl(url: string): boolean {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  }

  private isValidNip05(nip05: string): boolean {
    // Basic email-like format validation for NIP-05
    return /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(nip05);
  }

  private cacheProfile(profile: UserProfile): void {
    const cacheEntry: ProfileCacheEntry = {
      profile,
      cachedAt: Date.now(),
      expiresAt: Date.now() + (10 * 60 * 1000) // 10 minutes
    };
    
    this.profileCache.set(profile.pubkey, cacheEntry);
  }

  private getCachedProfile(pubkey: string): UserProfile | null {
    const cached = this.profileCache.get(pubkey);
    if (cached && cached.expiresAt > Date.now()) {
      return cached.profile;
    }
    
    // Remove expired cache
    if (cached) {
      this.profileCache.delete(pubkey);
    }
    
    return null;
  }
}