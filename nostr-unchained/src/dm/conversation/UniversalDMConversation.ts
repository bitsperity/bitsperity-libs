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
import { EventBuilder } from '../../core/EventBuilder.js';
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
    this.myPubkey = (myPubkey || '').toLowerCase();
    this.otherPubkey = (otherPubkey || '').toLowerCase();
    
    console.log('🚀 UniversalDMConversation constructor:', {
      myPubkey: myPubkey.substring(0, 16) + '...',
      otherPubkey: otherPubkey.substring(0, 16) + '...',
      hasQueryMethod: typeof this.nostr.query === 'function'
    });
    
    try {
      // Ensure the global gift wrap inbox sub is active (centralized)
      this.nostr.startUniversalGiftWrapSubscription().catch(() => {});

      // Query decrypted DMs (kind 14) for this peer conversation using a single filter
      // authors in [me, other] AND #p contains [me, other]
      this.store = this.nostr
        .query()
        .kinds([14])
        .authors([this.myPubkey, this.otherPubkey])
        .tags('p', [this.myPubkey, this.otherPubkey])
        .execute();

      console.log('✅ Store created successfully:', typeof this.store, this.store?.constructor?.name);

      // Debug: Check current cache state
      setTimeout(() => {
        console.log('🔍 Cache state after store init:', {
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
      const signer: any = (this.nostr as any).signingProvider;
      const caps = await (signer?.capabilities?.() ?? { nip44Encrypt: false, rawKey: false });

      // Build rumor (kind 14) without needing private key
      const rumor: any = {
        pubkey: this.myPubkey,
        created_at: Math.floor(Date.now() / 1000),
        kind: 14,
        tags: subject ? [['subject', subject]] : [],
        content
      };

      // Build and publish gift wraps using signer if possible; else fallback to local key
      if (caps.nip44Encrypt && typeof signer.nip44Encrypt === 'function') {
        // Helper to build signed seal for a specific recipient
        const buildSealForRecipient = async (peerPubkey: string) => {
          const ciphertext = await signer.nip44Encrypt(peerPubkey, JSON.stringify(rumor));
          const unsignedSeal = {
            pubkey: this.myPubkey,
            created_at: Math.floor(Date.now() / 1000),
            kind: 13,
            tags: [],
            content: ciphertext
          } as any;
          const id = EventBuilder.calculateEventId(unsignedSeal as any);
          const sig = await signer.signEvent(unsignedSeal as any);
          return { ...(unsignedSeal as any), id, sig };
        };

        // Create two seals: one for recipient, one self-addressed (multi-device history)
        const [sealOther, sealSelf] = await Promise.all([
          buildSealForRecipient(this.otherPubkey),
          buildSealForRecipient(this.myPubkey)
        ]);

        const { GiftWrapCreator } = await import('../protocol/GiftWrapCreator.js');
        const [wrapOther, wrapSelf] = await Promise.all([
          GiftWrapCreator.createGiftWrap(sealOther as any, { pubkey: this.otherPubkey }, undefined, Math.floor(Date.now() / 1000)),
          GiftWrapCreator.createGiftWrap(sealSelf as any, { pubkey: this.myPubkey }, undefined, Math.floor(Date.now() / 1000))
        ]);

        // Publish both; require recipient publish to succeed
        const [resOther] = await Promise.all([
          this.nostr.publishSigned(wrapOther.giftWrap),
          this.nostr.publishSigned(wrapSelf.giftWrap).catch(() => ({ success: false }))
        ]);

        if (resOther.success) {
          const giftWrapEvent = wrapOther.giftWrap;
          const sentMessage: DMMessage = {
            id: giftWrapEvent.id,
            content: content,
            senderPubkey: this.myPubkey,
            recipientPubkey: this.otherPubkey,
            timestamp: giftWrapEvent.created_at,
            isFromMe: true,
            eventId: giftWrapEvent.id,
            status: 'sent',
            subject: subject,
            sender: this.myPubkey
          };
          this.messageCache.push(sentMessage);
          this.messageCache.sort((a, b) => a.timestamp - b.timestamp);
          return { success: true, messageId: giftWrapEvent.id };
        }

        return { success: false, error: 'Failed to publish to recipient' };
      } else {
        // Fallback: use local private key flow (for LocalKeySigner)
        const privateKey = await this.nostr.getPrivateKeyForEncryption();
        if (!privateKey) {
          return { success: false, error: 'Private key not available for encryption' };
        }
        const result = await GiftWrapProtocol.createGiftWrappedDM(
          content,
          privateKey,
          { recipients: [
            { pubkey: this.otherPubkey, relayUrl: '' },
            { pubkey: this.myPubkey, relayUrl: '' }
          ], maxTimestampAge: 0 },
          subject
        );
        const giftWrapEventOther = result.giftWraps.find(g => g.recipient === this.otherPubkey)!.giftWrap;
        const giftWrapEventSelf = result.giftWraps.find(g => g.recipient === this.myPubkey)!.giftWrap;
        const [resOther] = await Promise.all([
          this.nostr.publishSigned(giftWrapEventOther),
          this.nostr.publishSigned(giftWrapEventSelf).catch(() => ({ success: false }))
        ]);
        if (resOther.success) {
          const sentMessage: DMMessage = {
            id: giftWrapEventOther.id,
            content: content,
            senderPubkey: this.myPubkey,
            recipientPubkey: this.otherPubkey,
            timestamp: giftWrapEventOther.created_at,
            isFromMe: true,
            eventId: giftWrapEventOther.id,
            status: 'sent',
            subject: subject,
            sender: this.myPubkey
          };
          this.messageCache.push(sentMessage);
          this.messageCache.sort((a, b) => a.timestamp - b.timestamp);
          return { success: true, messageId: giftWrapEventOther.id };
        }
        return { success: false, error: 'Failed to publish to recipient' } as any;
      }

      // signer and fallback branches return above
    } catch (error) {
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      };
    }
  }
  
  private async convertEventsToMessages(events: NostrEvent[]): Promise<DMMessage[]> {
    const messages: DMMessage[] = [];
    
    // Nur auf bereits entschlüsselte kind 14 aus Cache/Gesamtsystem reagieren
    for (const event of events) {
      if (event.kind !== 14) continue;
      const isMeSender = event.pubkey === this.myPubkey;
      const isToOther = event.tags.some(t => t[0] === 'p' && t[1] === this.otherPubkey);
      const isToMe = event.tags.some(t => t[0] === 'p' && t[1] === this.myPubkey);
      if (!(isToMe || (isMeSender && isToOther))) continue;

      messages.push({
        id: event.id,
        content: event.content,
        senderPubkey: event.pubkey,
        recipientPubkey: isMeSender ? this.otherPubkey : this.myPubkey,
        timestamp: event.created_at,
        isFromMe: isMeSender,
        eventId: event.id,
        status: isMeSender ? 'sent' : 'received',
        subject: this.getSubjectFromEvent(event),
        sender: event.pubkey
      });
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