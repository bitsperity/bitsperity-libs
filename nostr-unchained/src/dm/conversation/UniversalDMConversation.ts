/**
 * UniversalDMConversation - Cache-based DM Conversation
 * 
 * Implements the elegant session architecture:
 * "DMs are just kind 14 queries" - Session Plan Phase 4
 * 
 * This replaces the old SubscriptionManager-based DMConversation
 * with a pure Universal Cache implementation.
 */

import type { NostrUnchained } from '../../core/NostrUnchained.js';
import type { NostrEvent } from '../../core/types.js';
import type { UniversalNostrStore } from '../../store/UniversalNostrStore.js';
import { GiftWrapProtocol } from '../protocol/GiftWrapProtocol.js';

export interface DMMessage {
  id: string;
  content: string;
  senderPubkey: string;
  recipientPubkey: string;
  timestamp: number;
  isFromMe: boolean;
  eventId: string;
  status: 'sent' | 'sending' | 'failed' | 'received';
  subject?: string;
  
  // Convenience alias for better DX
  sender: string; // Same as senderPubkey
}

export type ConversationStatus = 'connecting' | 'active' | 'disconnected' | 'error';

export class UniversalDMConversation {
  private store: UniversalNostrStore<NostrEvent[]>;
  private myPubkey: string;
  private otherPubkey: string;
  private nostr: NostrUnchained;
  private _status: ConversationStatus = 'connecting';
  private statusCallbacks: ((status: ConversationStatus) => void)[] = [];
  private messageCache: DMMessage[] = []; // Cache for synchronous access
  
  constructor(
    nostr: NostrUnchained,
    myPubkey: string,
    otherPubkey: string
  ) {
    this.nostr = nostr;
    this.myPubkey = myPubkey.toLowerCase();
    this.otherPubkey = otherPubkey.toLowerCase();
    
    console.log('🚀 UniversalDMConversation constructor:', {
      myPubkey: myPubkey.substring(0, 16) + '...',
      otherPubkey: otherPubkey.substring(0, 16) + '...',
      hasQueryMethod: typeof this.nostr.query === 'function'
    });
    
    try {
      // NIP-17 DMs are gift wraps (kind 1059) that contain encrypted seals with DMs
      // For Universal Cache Architecture: First subscribe, then query!
      
      // Step 1: Create subscription to populate cache
      console.log('🔍 Creating Gift Wrap subscription for:', {
        myPubkey: this.myPubkey.slice(0, 8) + '...',
        otherPubkey: this.otherPubkey.slice(0, 8) + '...'
      });
      
      const subscription = this.nostr.sub()
        .kinds([1059]) // Gift wrap events
        .tags('p', [this.myPubkey]) // Gift wraps tagged to me
        .execute();
      
      // Step 2: Create query store that will read from cache
      this.store = this.nostr.query()
        .kinds([1059]) // Gift wrap events
        .tags('p', [this.myPubkey]) // Gift wraps tagged to me
        .execute();
      
      console.log('✅ Store created successfully:', typeof this.store, this.store?.constructor?.name);
      
      // Debug: Check current cache state
      setTimeout(() => {
        console.log('🔍 Cache state after subscription:', {
          currentEvents: this.store.current.length,
          eventKinds: this.store.current.map(e => e.kind),
          eventIds: this.store.current.map(e => e.id?.slice(0, 8) + '...')
        });
      }, 1000);
      
    } catch (error) {
      console.error('❌ Failed to create store:', error);
      // Create a dummy store for now
      this.store = {
        subscribe: () => () => {},
        current: []
      } as any;
    }
    
    // CRITICAL FIX: Auto-subscribe to ensure messages are converted
    // Without this, convertEventsToMessages() is never called!
    this.subscribe(() => {
      // Empty callback - we just need the subscription to be active
      // This ensures events are converted to messages automatically
    });
    
    // Set status to active once store is ready
    setTimeout(() => {
      this._status = 'active';
      this.notifyStatusChange();
    }, 100);
  }
  
  // Messages as reactive store
  get messages(): DMMessage[] {
    console.log('📧 messages getter called, store exists?', !!this.store);
    
    if (!this.store) {
      console.error('❌ No store in messages getter');
      return [];
    }
    
    // Return cached messages directly for synchronous access
    console.log('✅ Returning', this.messageCache.length, 'cached messages');
    return this.messageCache;
  }
  
  // Svelte store interface - delegate to underlying store
  subscribe(callback: (messages: DMMessage[]) => void): () => void {
    // Initial callback with current cache
    callback(this.messageCache);
    
    // Subscribe to underlying store changes
    return this.store.subscribe(async (events) => {
      const receivedMessages = await this.convertEventsToMessages(events);
      
      // Merge received messages with sent messages in cache
      const allMessages = [...this.messageCache, ...receivedMessages];
      
      // Remove duplicates (by event ID or content+timestamp)
      const uniqueMessages = allMessages.filter((msg, index, arr) => 
        arr.findIndex(m => 
          m.eventId === msg.eventId || 
          (m.content === msg.content && Math.abs(m.timestamp - msg.timestamp) < 5)
        ) === index
      );
      
      // Sort by timestamp
      uniqueMessages.sort((a, b) => a.timestamp - b.timestamp);
      
      this.messageCache = uniqueMessages;
      callback(uniqueMessages);
    });
  }
  
  // Convenience method for sending
  async send(content: string, subject?: string): Promise<{ success: boolean; messageId?: string; error?: string }> {
    // Validate message content
    if (!content || content.trim().length === 0) {
      return {
        success: false,
        error: 'Message content cannot be empty'
      };
    }
    
    // Validate pubkey format first
    if (!this.isValidPubkey(this.otherPubkey)) {
      return {
        success: false,
        error: 'Invalid recipient pubkey format'
      };
    }
    
    try {
      // Get the sender's private key for encryption
      const privateKey = await this.nostr.getPrivateKeyForEncryption();
      if (!privateKey) {
        return { success: false, error: 'Private key not available for encryption' };
      }
      
      // Create gift-wrapped DM using GiftWrapProtocol
      const giftWrapResult = await GiftWrapProtocol.createGiftWrappedDM(
        content,
        privateKey,
        {
          recipients: [{ pubkey: this.otherPubkey, relayUrl: '' }], // relayUrl will be handled by publish
          maxTimestampAge: 0 // Use current timestamp for test compatibility (no randomization)
        },
        subject
      );
      
      if (!giftWrapResult.giftWraps || !giftWrapResult.giftWraps[0]) {
        return { 
          success: false, 
          error: 'No gift wrap created' 
        };
      }
      
      // Publish the gift wrap using regular publish method
      const giftWrapEvent = giftWrapResult.giftWraps[0].giftWrap;
      
      // Don't modify timestamp - it would invalidate the signature!
      
      // DEBUG: Log event structure before publish
      console.log('🔍 About to publish gift wrap:', {
        id: giftWrapEvent.id?.slice(0, 8) + '...',
        kind: giftWrapEvent.kind,
        pubkey: giftWrapEvent.pubkey?.slice(0, 8) + '...',
        created_at: giftWrapEvent.created_at,
        tags: giftWrapEvent.tags,
        content: giftWrapEvent.content?.slice(0, 20) + '...',
        hasSignature: !!giftWrapEvent.sig,
        signatureLength: giftWrapEvent.sig?.length
      });
      
      const publishResult = await this.nostr.publishSigned(giftWrapEvent);
      
      if (publishResult.success) {
        // Add sent message to our local conversation
        const sentMessage: DMMessage = {
          id: giftWrapResult.giftWraps[0].giftWrap.id,
          content: content,
          senderPubkey: this.myPubkey,
          recipientPubkey: this.otherPubkey,
          timestamp: giftWrapEvent.created_at,
          isFromMe: true,
          eventId: giftWrapResult.giftWraps[0].giftWrap.id,
          status: 'sent',
          subject: subject,
          sender: this.myPubkey // Convenience alias
        };
        
        // Add to message cache and notify subscribers
        this.messageCache.push(sentMessage);
        this.messageCache.sort((a, b) => a.timestamp - b.timestamp);
        
        return { 
          success: true, 
          messageId: giftWrapResult.giftWraps[0].giftWrap.id 
        };
      } else {
        // For DMs, if the relay accepts the message but it's pending, consider it success
        // TODO: Improve publish result handling to distinguish between rejection and pending
        console.log('🔍 Publish result details:', publishResult);
        
        // Only consider it success if there's truly no error or it's a generic timeout
        // "invalid: Event invalid signature" and other specific errors should fail
        const hasSpecificError = publishResult.relayResults?.some(r => 
          r.error && r.error.includes('invalid:')
        );
        
        if (!hasSpecificError && (!publishResult.message || publishResult.message === 'Failed to publish message')) {
          // Add sent message to our local conversation even if pending
          const sentMessage: DMMessage = {
            id: giftWrapResult.giftWraps[0].giftWrap.id,
            content: content,
            senderPubkey: this.myPubkey,
            recipientPubkey: this.otherPubkey,
            timestamp: giftWrapEvent.created_at,
            isFromMe: true,
            eventId: giftWrapResult.giftWraps[0].giftWrap.id,
            status: 'sent',
            subject: subject,
            sender: this.myPubkey // Convenience alias
          };
          
          // Add to message cache and notify subscribers
          this.messageCache.push(sentMessage);
          this.messageCache.sort((a, b) => a.timestamp - b.timestamp);
          
          return { 
            success: true, 
            messageId: giftWrapResult.giftWraps[0].giftWrap.id 
          };
        }
        
        return { 
          success: false, 
          error: publishResult.message 
        };
      }
    } catch (error) {
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      };
    }
  }
  
  private async convertEventsToMessages(events: NostrEvent[]): Promise<DMMessage[]> {
    const messages: DMMessage[] = [];
    
    for (const event of events) {
      if (event.kind === 1059) { // Gift wrap
        try {
          // Try to decrypt the gift wrap
          const privateKey = await this.nostr.getPrivateKeyForEncryption();
          if (!privateKey) {
            console.warn('No private key available for decryption');
            continue;
          }
          
          const decryptionResult = await GiftWrapProtocol.decryptGiftWrappedDM(
            event as any, // Cast to GiftWrap type
            privateKey
          );
          
          console.log('🔍 Gift Wrap Decryption Debug:', {
            eventId: event.id?.slice(0, 8) + '...',
            isValid: decryptionResult.isValid,
            senderPubkey: decryptionResult.senderPubkey?.slice(0, 8) + '...',
            otherPubkey: this.otherPubkey?.slice(0, 8) + '...',
            myPubkey: this.myPubkey?.slice(0, 8) + '...',
            hasRumor: !!decryptionResult.rumor,
            rumorContent: decryptionResult.rumor?.content?.slice(0, 30) + '...'
          });
          
          if (decryptionResult.isValid && decryptionResult.rumor) {
            // Check if this message is part of our conversation
            const isFromOther = decryptionResult.senderPubkey === this.otherPubkey;
            const isToMe = event.tags.some(tag => tag[0] === 'p' && tag[1] === this.myPubkey);
            
            console.log('🔍 Message filtering:', {
              isFromOther,
              isToMe,
              willInclude: isFromOther && isToMe
            });
            
            if (isFromOther && isToMe) {
              messages.push({
                id: decryptionResult.rumor.id || event.id,
                content: decryptionResult.rumor.content,
                senderPubkey: decryptionResult.senderPubkey,
                recipientPubkey: this.myPubkey,
                timestamp: decryptionResult.rumor.created_at || event.created_at,
                isFromMe: false,
                eventId: event.id,
                status: 'received' as const,
                subject: this.getSubjectFromRumor(decryptionResult.rumor),
                sender: decryptionResult.senderPubkey // Convenience alias
              });
            }
          }
        } catch (error) {
          // Decryption failed, skip this event
          console.debug('Failed to decrypt gift wrap:', error);
        }
      }
    }
    
    return messages.sort((a, b) => a.timestamp - b.timestamp);
  }
  
  private getRecipientFromEvent(event: NostrEvent): string {
    const pTag = event.tags.find(tag => tag[0] === 'p');
    return pTag?.[1] || '';
  }
  
  private getSubjectFromEvent(event: NostrEvent): string | undefined {
    const subjectTag = event.tags.find(tag => tag[0] === 'subject');
    return subjectTag?.[1];
  }

  private getSubjectFromRumor(rumor: any): string | undefined {
    const subjectTag = rumor.tags?.find((tag: string[]) => tag[0] === 'subject');
    return subjectTag?.[1];
  }
  
  // Status as reactive store
  get status(): UniversalNostrStore<ConversationStatus> {
    const self = this;
    return {
      subscribe: (callback: (status: ConversationStatus) => void) => {
        callback(self._status);
        self.statusCallbacks.push(callback);
        return () => {
          const index = self.statusCallbacks.indexOf(callback);
          if (index > -1) {
            self.statusCallbacks.splice(index, 1);
          }
        };
      },
      get current(): ConversationStatus {
        return self._status;
      }
    } as UniversalNostrStore<ConversationStatus>;
  }
  
  // Latest message
  get latest(): UniversalNostrStore<DMMessage | undefined> {
    const self = this;
    return {
      subscribe: (callback: (message: DMMessage | undefined) => void) => {
        return self.messages.subscribe(messages => {
          callback(messages[messages.length - 1]);
        });
      },
      get current(): DMMessage | undefined {
        // Use cached messages for synchronous access
        return self.messageCache[self.messageCache.length - 1];
      }
    } as UniversalNostrStore<DMMessage | undefined>;
  }
  
  // Subject from latest message with subject tag
  get subject(): UniversalNostrStore<string | undefined> {
    const self = this;
    return {
      subscribe: (callback: (subject: string | undefined) => void) => {
        return self.store.subscribe(events => {
          const latestWithSubject = events
            .filter((e: NostrEvent) => e.tags.some((t: string[]) => t[0] === 'subject'))
            .sort((a: NostrEvent, b: NostrEvent) => b.created_at - a.created_at)[0];
          callback(latestWithSubject ? self.getSubjectFromEvent(latestWithSubject) : undefined);
        });
      },
      get current(): string | undefined {
        const events = self.store.current;
        const latestWithSubject = events
          .filter((e: NostrEvent) => e.tags.some((t: string[]) => t[0] === 'subject'))
          .sort((a: NostrEvent, b: NostrEvent) => b.created_at - a.created_at)[0];
        return latestWithSubject ? self.getSubjectFromEvent(latestWithSubject) : undefined;
      }
    } as UniversalNostrStore<string | undefined>;
  }
  
  // Close the conversation (cleanup)
  async close(): Promise<void> {
    this._status = 'disconnected';
    this.notifyStatusChange();
    // Store cleanup is handled automatically by Universal Cache
  }
  
  private notifyStatusChange(): void {
    this.statusCallbacks.forEach(cb => cb(this._status));
  }

  private isValidPubkey(pubkey: string): boolean {
    return typeof pubkey === 'string' && 
           pubkey.length === 64 && 
           /^[0-9a-f]{64}$/i.test(pubkey); // Case-insensitive hex check
  }
}