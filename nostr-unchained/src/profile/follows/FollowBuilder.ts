/**
 * FollowBuilder - Fluent API for Adding Follows
 */

import type { RelayManager } from '../../relay/RelayManager.js';
import type { SigningProvider } from '../../crypto/SigningProvider.js';
import type { EventBuilder } from '../../core/EventBuilder.js';
import type { FollowListStore } from './FollowListStore.js';

export interface FollowBuilderConfig {
  targetPubkey: string;
  relayManager: RelayManager;
  signingProvider: SigningProvider;
  eventBuilder: EventBuilder;
  followListStore: FollowListStore;
  debug?: boolean;
}

export class FollowBuilder {
  private config: FollowBuilderConfig;
  private relayHint?: string;
  private petnameName?: string;

  constructor(config: FollowBuilderConfig) {
    this.config = config;
  }

  /**
   * Set relay hint for this follow
   */
  relay(url: string): this {
    this.relayHint = url;
    return this;
  }

  /**
   * Set petname for this follow
   */
  petname(name: string): this {
    this.petnameName = name;
    return this;
  }

  /**
   * Publish the follow
   */
  async publish(): Promise<{ success: boolean; error?: string }> {
    try {
      // Add to follow list store optimistically
      await this.config.followListStore.addFollow({
        pubkey: this.config.targetPubkey,
        relay: this.relayHint,
        petname: this.petnameName
      });

      // TODO: Implement actual publishing to relay
      // This would create a new kind 3 event with the updated follow list

      if (this.config.debug) {
        console.log(`FollowBuilder: Added follow for ${this.config.targetPubkey}`);
      }

      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to add follow'
      };
    }
  }
}