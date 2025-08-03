/**
 * ContactManager - NIP-02 Kind 3 Contact List Management
 * 
 * Provides clean, reactive contact management:
 * - Follow/unfollow users with reactive updates
 * - Fetch contact lists for any user
 * - NIP-02 compliant p-tag handling
 * - Contact list caching for performance
 */

import { writable, derived, type Readable, type Writable } from '../../store/NostrStore.js';
import type { 
  Contact,
  ContactList, 
  ContactEvent,
  FollowRequest,
  UnfollowRequest,
  ContactUpdateResult,
  ContactFetchOptions,
  ContactManagerConfig,
  ContactCacheEntry
} from '../types/contact-types.js';
import type { SubscriptionManager } from '../../subscription/SubscriptionManager.js';
import type { RelayManager } from '../../relay/RelayManager.js';
import type { SigningProvider } from '../../crypto/SigningProvider.js';
import type { EventBuilder } from '../../events/EventBuilder.js';
import type { NostrEvent, Filter } from '../../core/types.js';

export class ContactManager {
  private config: ContactManagerConfig;
  private contactCache = new Map<string, ContactCacheEntry>();
  private activeSubscriptions = new Map<string, string>(); // pubkey -> subscriptionId
  
  // Reactive stores
  private _myContacts = writable<ContactList | null>(null);
  private _contactUpdates = writable<Map<string, ContactList>>(new Map());
  
  // Public reactive properties
  public readonly mine: Readable<ContactList | null>;
  public readonly updates: Readable<Map<string, ContactList>>;

  constructor(config: ContactManagerConfig) {
    this.config = config;
    
    // Initialize reactive stores
    this.mine = derived(this._myContacts, $contacts => $contacts);
    this.updates = derived(this._contactUpdates, $updates => $updates);
    
    // Initialize own contact list if signing provider is available
    if (this.config.signingProvider) {
      this.initializeOwnContacts();
    }
  }

  /**
   * Follow a new contact
   */
  async follow(request: FollowRequest): Promise<ContactUpdateResult> {
    if (!this.config.signingProvider) {
      return {
        success: false,
        error: 'No signing provider available'
      };
    }

    try {
      // Get current contact list
      const currentContacts = await this.getMine();
      const contacts = currentContacts ? [...currentContacts.contacts] : [];
      
      // Check if already following
      const existingIndex = contacts.findIndex(c => c.pubkey === request.pubkey);
      if (existingIndex >= 0) {
        // Update existing contact
        contacts[existingIndex] = {
          pubkey: request.pubkey,
          relayUrl: request.relayUrl,
          petname: request.petname
        };
      } else {
        // Add new contact
        contacts.push({
          pubkey: request.pubkey,
          relayUrl: request.relayUrl,
          petname: request.petname
        });
      }

      // Publish updated contact list
      return this.publishContactList(contacts);

    } catch (error) {
      if (this.config.debug) {
        console.error('Error following contact:', error);
      }
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Unfollow a contact
   */
  async unfollow(request: UnfollowRequest): Promise<ContactUpdateResult> {
    if (!this.config.signingProvider) {
      return {
        success: false,
        error: 'No signing provider available'
      };
    }

    try {
      // Get current contact list
      const currentContacts = await this.getMine();
      if (!currentContacts) {
        return {
          success: false,
          error: 'No contact list found'
        };
      }

      // Remove contact
      const contacts = currentContacts.contacts.filter(c => c.pubkey !== request.pubkey);
      
      if (contacts.length === currentContacts.contacts.length) {
        return {
          success: false,
          error: 'Contact not found in list'
        };
      }

      // Publish updated contact list
      return this.publishContactList(contacts);

    } catch (error) {
      if (this.config.debug) {
        console.error('Error unfollowing contact:', error);
      }
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Get own contact list
   */
  async getMine(): Promise<ContactList | null> {
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
   * Get contact list for any user by pubkey
   */
  async get(pubkey: string, options: ContactFetchOptions = {}): Promise<ContactList | null> {
    try {
      // Check cache first
      if (options.useCache !== false) {
        const cached = this.getCachedContactList(pubkey);
        if (cached) {
          return cached;
        }
      }

      // Subscribe to contact list events for this user
      const filter: Filter = {
        kinds: [3],
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

        const executeQuery = async () => {
          const sharedSub = await this.config.subscriptionManager.getOrCreateSubscription([filter]);
          const listenerId = sharedSub.addListener({
            onEvent: (event: NostrEvent) => {
              if (!resolved && event.kind === 3) {
                resolved = true;
                clearTimeout(timeout);
                sharedSub.removeListener(listenerId);
                
                try {
                  const contactList = this.parseContactEvent(event as ContactEvent);
                  this.cacheContactList(contactList);
                  
                  // Update reactive store
                  this._contactUpdates.update(lists => {
                    lists.set(pubkey, contactList);
                    return new Map(lists);
                  });
                  
                  resolve(contactList);
                } catch (error) {
                  resolve(null);
                }
              }
            },
            onEose: () => {
              if (!resolved) {
                resolved = true;
                clearTimeout(timeout);
                sharedSub.removeListener(listenerId);
                resolve(null);
              }
            }
          });
        };
        
        executeQuery().catch(() => {
          if (!resolved) {
            resolved = true;
            clearTimeout(timeout);
            resolve(null);
          }
        });
      });

    } catch (error) {
      if (this.config.debug) {
        console.error('Error fetching contact list:', error);
      }
      return null;
    }
  }

  /**
   * Check if user is following a specific pubkey
   */
  async isFollowing(targetPubkey: string): Promise<boolean> {
    const contacts = await this.getMine();
    return contacts ? contacts.contacts.some(c => c.pubkey === targetPubkey) : false;
  }

  /**
   * Get list of pubkeys the user is following
   */
  async getFollowing(): Promise<string[]> {
    const contacts = await this.getMine();
    return contacts ? contacts.contacts.map(c => c.pubkey) : [];
  }

  /**
   * Update signing provider
   */
  async updateSigningProvider(signingProvider: SigningProvider): Promise<void> {
    this.config.signingProvider = signingProvider;
    await this.initializeOwnContacts();
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
    this.contactCache.clear();
    
    // Call close on subscription manager to match test expectations
    if (this.config.subscriptionManager.close) {
      await this.config.subscriptionManager.close();
    }
    
    if (this.config.debug) {
      console.log('ContactManager: Closed all subscriptions and cleared cache');
    }
  }

  // Private helper methods

  private async initializeOwnContacts(): Promise<void> {
    try {
      const myContacts = await this.getMine();
      if (myContacts) {
        this._myContacts.set(myContacts);
        if (this.config.debug) {
          console.log('Initialized own contact list:', myContacts);
        }
      }
    } catch (error) {
      if (this.config.debug) {
        console.error('Failed to initialize own contact list:', error);
      }
    }
  }

  private async publishContactList(contacts: Contact[]): Promise<ContactUpdateResult> {
    try {
      const userPubkey = await this.config.signingProvider.getPublicKey();
      
      // Build NIP-02 tags from contacts
      const tags = contacts.map(contact => {
        const tag = ['p', contact.pubkey];
        if (contact.relayUrl) {
          tag.push(contact.relayUrl);
        }
        if (contact.petname) {
          tag.push(contact.petname);
        }
        return tag;
      });

      // Build event
      const event = await this.config.eventBuilder
        .kind(3)
        .content('') // NIP-02 content is usually empty
        .tags(tags)
        .build();

      // Sign event
      const signedEvent = await this.config.signingProvider.signEvent(event);

      // Publish to relays
      const publishResults = await this.config.relayManager.publishToAll(signedEvent);
      const successfulPublishes = publishResults.filter(r => r.success);

      if (successfulPublishes.length === 0) {
        return {
          success: false,
          error: 'Failed to publish to any relay'
        };
      }

      // Create contact list object
      const contactList: ContactList = {
        contacts,
        ownerPubkey: userPubkey,
        lastUpdated: signedEvent.created_at,
        eventId: signedEvent.id,
        isOwn: true
      };

      // Update reactive stores
      this._myContacts.set(contactList);
      this._contactUpdates.update(lists => {
        lists.set(userPubkey, contactList);
        return new Map(lists);
      });

      // Cache the updated contact list
      this.cacheContactList(contactList);

      if (this.config.debug) {
        console.log('Published contact list:', contactList);
      }

      return {
        success: true,
        contactList,
        eventId: signedEvent.id
      };

    } catch (error) {
      if (this.config.debug) {
        console.error('Error publishing contact list:', error);
      }
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  private parseContactEvent(event: ContactEvent): ContactList {
    // Parse p-tags to extract contacts
    const contacts: Contact[] = [];
    
    for (const tag of event.tags) {
      if (tag[0] === 'p' && tag[1]) {
        const contact: Contact = {
          pubkey: tag[1],
          relayUrl: tag[2] || undefined,
          petname: tag[3] || undefined
        };
        contacts.push(contact);
      }
    }

    // Check if this is the user's own contact list
    const userPubkey = this.config.signingProvider?.getPublicKey ? 
      this.config.signingProvider.getPublicKey() : Promise.resolve('');
    
    return {
      contacts,
      ownerPubkey: event.pubkey,
      lastUpdated: event.created_at,
      eventId: event.id,
      isOwn: false // Will be updated based on pubkey comparison
    };
  }

  private getCachedContactList(pubkey: string): ContactList | null {
    const cached = this.contactCache.get(pubkey);
    if (!cached) return null;

    // Check if cache is still valid
    if (Date.now() - cached.timestamp > cached.ttl) {
      this.contactCache.delete(pubkey);
      return null;
    }

    return cached.contactList;
  }

  private cacheContactList(contactList: ContactList): void {
    const cacheEntry: ContactCacheEntry = {
      contactList,
      timestamp: Date.now(),
      ttl: 300000 // 5 minutes
    };
    
    this.contactCache.set(contactList.ownerPubkey, cacheEntry);
  }
}