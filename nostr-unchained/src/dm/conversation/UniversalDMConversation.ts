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
}

export type ConversationStatus = 'connecting' | 'active' | 'disconnected' | 'error';

export class UniversalDMConversation {
  private store: UniversalNostrStore<NostrEvent[]>;
  private myPubkey: string;
  private otherPubkey: string;
  private nostr: NostrUnchained;
  private _status: ConversationStatus = 'connecting';
  private statusCallbacks: ((status: ConversationStatus) => void)[] = [];
  
  constructor(
    nostr: NostrUnchained,
    myPubkey: string,
    otherPubkey: string
  ) {
    this.nostr = nostr;
    this.myPubkey = myPubkey;
    this.otherPubkey = otherPubkey;
    
    // DMs are just kind 14 events between two people
    this.store = this.nostr.query()
      .kinds([14])
      .authors([this.myPubkey, this.otherPubkey])
      .tags('p', [this.myPubkey, this.otherPubkey])
      .execute();
    
    // Set status to active once store is ready
    setTimeout(() => {
      this._status = 'active';
      this.notifyStatusChange();
    }, 100);
  }
  
  // Messages as reactive store
  get messages(): UniversalNostrStore<DMMessage[]> {
    // Create a derived store that converts events to messages
    return {
      subscribe: (callback: (messages: DMMessage[]) => void) => {
        return this.store.subscribe(events => {
          const messages = this.convertEventsToMessages(events);
          callback(messages);
        });
      },
      get current(): DMMessage[] {
        return this.convertEventsToMessages(this.store.current);
      }
    } as UniversalNostrStore<DMMessage[]>;
  }
  
  // Svelte store interface - delegate to underlying store
  subscribe(callback: (messages: DMMessage[]) => void): () => void {
    return this.store.subscribe(events => {
      const messages = this.convertEventsToMessages(events);
      callback(messages);
    });
  }
  
  // Convenience method for sending
  async send(content: string, subject?: string): Promise<{ success: boolean; messageId?: string; error?: string }> {
    try {
      const rumor = {
        kind: 14,
        content,
        tags: [
          ['p', this.otherPubkey],
          ...(subject ? [['subject', subject]] : [])
        ],
        created_at: Math.floor(Date.now() / 1000),
        pubkey: this.myPubkey,
        id: '', // Will be set during signing
        sig: '' // Will be set during signing
      };
      
      // Use the new Universal publishEncrypted method
      const result = await this.nostr.publishEncrypted(rumor, [this.otherPubkey]);
      
      if (result.success) {
        return { success: true, messageId: rumor.id };
      } else {
        return { success: false, error: result.error };
      }
    } catch (error) {
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      };
    }
  }
  
  private convertEventsToMessages(events: NostrEvent[]): DMMessage[] {
    return events
      .filter(event => event.kind === 14)
      .map(event => ({
        id: event.id,
        content: event.content,
        senderPubkey: event.pubkey,
        recipientPubkey: this.getRecipientFromEvent(event),
        timestamp: event.created_at,
        isFromMe: event.pubkey === this.myPubkey,
        eventId: event.id,
        status: 'received' as const,
        subject: this.getSubjectFromEvent(event)
      }))
      .sort((a, b) => a.timestamp - b.timestamp); // Chronological order
  }
  
  private getRecipientFromEvent(event: NostrEvent): string {
    const pTag = event.tags.find(tag => tag[0] === 'p');
    return pTag?.[1] || '';
  }
  
  private getSubjectFromEvent(event: NostrEvent): string | undefined {
    const subjectTag = event.tags.find(tag => tag[0] === 'subject');
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
        const messages = self.messages.current;
        return messages[messages.length - 1];
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
}