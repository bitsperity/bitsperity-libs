/**
 * ProfileBuilder - Fluent API for Profile Creation/Updates
 * 
 * Provides a builder pattern API for creating and updating profiles
 * with field preservation and validation.
 */

import { EventBuilder } from '../core/EventBuilder.js';
import type { SubscriptionManager } from '../subscription/SubscriptionManager.js';
import type { RelayManager } from '../relay/RelayManager.js';
import type { SigningProvider } from '../crypto/SigningProvider.js';
import type { ProfileMetadata, UserProfile, PublishResult } from './types.js';
import type { NostrEvent, Filter } from '../core/types.js';

export interface ProfileBuilderConfig {
  subscriptionManager: SubscriptionManager;
  relayManager: RelayManager;
  signingProvider: SigningProvider;
  debug?: boolean;
}

export class ProfileBuilder {
  private config: ProfileBuilderConfig;
  private updates: Partial<ProfileMetadata> = {};
  private shouldPreserveExisting = true;
  private customMetadata: Record<string, any> = {};

  constructor(config: ProfileBuilderConfig) {
    this.config = config;
  }

  /**
   * Set display name
   */
  name(name: string): this {
    this.updates.name = name;
    return this;
  }

  /**
   * Set bio/about text
   */
  about(bio: string): this {
    this.updates.about = bio;
    return this;
  }

  /**
   * Set profile picture URL
   */
  picture(url: string): this {
    this.updates.picture = url;
    return this;
  }

  /**
   * Set banner image URL
   */
  banner(url: string): this {
    this.updates.banner = url;
    return this;
  }

  /**
   * Set NIP-05 identifier
   */
  nip05(identifier: string): this {
    this.updates.nip05 = identifier;
    return this;
  }

  /**
   * Set Lightning address (lud16)
   */
  lud16(address: string): this {
    this.updates.lud16 = address;
    return this;
  }

  /**
   * Set website URL
   */
  website(url: string): this {
    this.updates.website = url;
    return this;
  }

  /**
   * Set GitHub username (NIP-39 external identity)
   */
  github(username: string): this {
    this.customMetadata.github = username;
    return this;
  }

  /**
   * Set Twitter/X username (NIP-39 external identity)
   */
  twitter(username: string): this {
    this.customMetadata.twitter = username;
    return this;
  }

  /**
   * Set Telegram username (NIP-39 external identity)
   */
  telegram(username: string): this {
    this.customMetadata.telegram = username;
    return this;
  }

  /**
   * Add custom metadata field
   */
  metadata(key: string, value: any): this {
    this.customMetadata[key] = value;
    return this;
  }

  /**
   * Whether to preserve existing fields (default: true)
   */
  preserveExisting(enable = true): this {
    this.shouldPreserveExisting = enable;
    return this;
  }

  /**
   * Sign the profile event (without publishing)
   */
  async sign(): Promise<SignedProfileEvent> {
    const profileData = await this.prepareProfileData();
    const pubkey = await this.config.signingProvider.getPublicKey();
    
    // Create unsigned event using static EventBuilder methods
    const unsignedEvent = {
      kind: 0,
      content: JSON.stringify(profileData),
      tags: [],
      created_at: Math.floor(Date.now() / 1000),
      pubkey: pubkey
    };

    // Add event ID
    const eventWithId = EventBuilder.addEventId(unsignedEvent);
    
    // Sign the event
    const signature = await this.config.signingProvider.signEvent(unsignedEvent);
    
    const signedEvent: SignedProfileEvent = {
      ...eventWithId,
      sig: signature
    };

    return signedEvent;
  }

  /**
   * Publish the profile update
   */
  async publish(): Promise<PublishResult> {
    try {
      const profileData = await this.prepareProfileData();
      
      if (this.config.debug) {
        console.log('ProfileBuilder: Publishing profile:', profileData);
      }

      // Create and sign the event
      const pubkey = await this.config.signingProvider.getPublicKey();
      
      const unsignedEvent = {
        kind: 0,
        content: JSON.stringify(profileData),
        tags: [],
        created_at: Math.floor(Date.now() / 1000),
        pubkey: pubkey
      };

      // Add event ID and sign
      const eventWithId = EventBuilder.addEventId(unsignedEvent);
      const signature = await this.config.signingProvider.signEvent(unsignedEvent);
      
      const signedEvent: NostrEvent = {
        ...eventWithId,
        sig: signature
      };

      // Publish to all relays
      const publishResults = await Promise.allSettled(
        this.config.relayManager.relayUrls.map(async (relayUrl) => {
          try {
            // Send event to relay
            await this.config.relayManager.sendToRelay(relayUrl, ['EVENT', signedEvent]);
            return { success: true, relay: relayUrl };
          } catch (error) {
            return { 
              success: false, 
              relay: relayUrl, 
              error: error instanceof Error ? error.message : 'Unknown error' 
            };
          }
        })
      );

      const successfulRelays = publishResults
        .filter((result): result is PromiseFulfilledResult<{success: true, relay: string}> => 
          result.status === 'fulfilled' && result.value.success
        )
        .map(result => result.value.relay);

      const success = successfulRelays.length > 0;

      if (success) {
        if (this.config.debug) {
          console.log(`ProfileBuilder: Published to ${successfulRelays.length} relays`);
        }
        return {
          success: true,
          eventId: signedEvent.id
        };
      } else {
        return {
          success: false,
          error: 'Failed to publish to any relay'
        };
      }

    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to publish profile'
      };
    }
  }

  // Private helper methods

  private async prepareProfileData(): Promise<ProfileMetadata> {
    let baseData: ProfileMetadata = {};

    // If preserving existing fields, fetch current profile
    if (this.shouldPreserveExisting) {
      const currentProfile = await this.getCurrentProfile();
      if (currentProfile) {
        baseData = { ...currentProfile.metadata };
        if (this.config.debug) {
          console.log('ProfileBuilder: Preserving existing profile data:', baseData);
        }
      } else {
        if (this.config.debug) {
          console.log('ProfileBuilder: No existing profile found to preserve');
        }
      }
    }

    // Apply updates
    const profileData: ProfileMetadata = {
      ...baseData,
      ...this.updates
    };

    // Add custom metadata
    if (Object.keys(this.customMetadata).length > 0) {
      Object.assign(profileData, this.customMetadata);
    }

    return profileData;
  }

  private async getCurrentProfile(): Promise<UserProfile | null> {
    try {
      const myPubkey = await this.config.signingProvider.getPublicKey();
      
      // Query for current profile
      const filter: Filter = {
        kinds: [0],
        authors: [myPubkey],
        limit: 1
      };

      return new Promise((resolve) => {
        let profileFound = false;
        
        const timeoutId = setTimeout(() => {
          if (!profileFound) {
            resolve(null);
          }
        }, 3000);

        const executeGetProfile = async () => {
          const sharedSub = await this.config.subscriptionManager.getOrCreateSubscription([filter]);
          const listenerId = sharedSub.addListener({
            onEvent: (event: NostrEvent) => {
              if (event.kind === 0 && event.pubkey === myPubkey && !profileFound) {
                profileFound = true;
                clearTimeout(timeoutId);
                sharedSub.removeListener(listenerId);
                
                try {
                  const metadata = JSON.parse(event.content);
                  const profile: UserProfile = {
                    pubkey: event.pubkey,
                    metadata,
                    lastUpdated: event.created_at,
                    eventId: event.id,
                    isOwn: true
                  };
                  resolve(profile);
                } catch {
                  resolve(null);
                }
              }
            },
            onEose: () => {
              if (!profileFound) {
                clearTimeout(timeoutId);
                sharedSub.removeListener(listenerId);
                resolve(null);
              }
            }
          });
        };
        
        executeGetProfile().catch(() => {
          if (!profileFound) {
            clearTimeout(timeoutId);
            resolve(null);
          }
        });
      });
    } catch {
      return null;
    }
  }
}

interface SignedProfileEvent {
  kind: 0;
  content: string;
  pubkey: string;
  created_at: number;
  tags: string[][];
  id: string;
  sig: string;
}