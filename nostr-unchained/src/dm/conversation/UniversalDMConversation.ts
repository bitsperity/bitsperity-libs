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

export class UniversalDMConversation {
  private store: UniversalNostrStore<NostrEvent[]>;
  private myPubkey: string;
  private otherPubkey: string;
  private nostr: NostrUnchained;
  
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
  }
  
  // Svelte store interface - delegate to underlying store
  subscribe(callback: (messages: DMMessage[]) => void): () => void {
    return this.store.subscribe(events => {
      const messages = this.convertEventsToMessages(events);
      callback(messages);
    });
  }
  
  get messages(): DMMessage[] {
    return this.convertEventsToMessages(this.store.current);
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
}