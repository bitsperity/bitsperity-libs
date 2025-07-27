/**
 * DMConversation - Reactive Store for NIP-17 Direct Message Conversations
 * 
 * Provides a Svelte-compatible reactive store interface for managing
 * end-to-end encrypted direct message conversations using NIP-44 v2 encryption
 * and NIP-59 gift wrap protocol.
 * 
 * Features:
 * - Reactive message list with real-time updates
 * - Send/receive encrypted messages using NIP-17 protocol
 * - Multi-conversation support with proper isolation
 * - Connection and encryption status tracking
 * - Message history and latest message access
 */

import { writable, derived, type Readable, type Writable } from '../../store/NostrStore.js';
import { GiftWrapProtocol } from '../protocol/GiftWrapProtocol.js';
import { SubscriptionManager } from '../../subscription/SubscriptionManager.js';
import { RelayManager } from '../../relay/RelayManager.js';
import type { 
  NostrEvent, 
  Filter, 
  SubscriptionOptions,
  SubscriptionResult 
} from '../../core/types.js';
import type { 
  GiftWrap, 
  GiftWrapDecryptionResult, 
  Rumor 
} from '../types/nip59-types.js';

export type ConversationStatus = 'connecting' | 'active' | 'error' | 'disconnected';

export interface DMMessage {
  id: string;
  content: string;
  senderPubkey: string;
  recipientPubkey: string;
  timestamp: number;
  isFromMe: boolean;
  eventId?: string; // Original Nostr event ID if available
  status: 'sent' | 'sending' | 'failed' | 'received';
  subject?: string; // NIP-17 subject for threading
  participants?: string[]; // For multi-participant conversations
}

export interface DMConversationState {
  messages: DMMessage[];
  status: ConversationStatus;
  latest: DMMessage | null;
  isTyping: boolean;
  error: string | null;
  subject?: string; // Current conversation subject
}

export interface DMConversationConfig {
  recipientPubkey: string;
  senderPrivateKey: string;
  senderPubkey: string;
  subscriptionManager: SubscriptionManager;
  relayManager: RelayManager;
  relayHints?: string[];
  debug?: boolean;
  subject?: string; // Initial conversation subject
}

export class DMConversation {
  private _state: Writable<DMConversationState>;
  private subscription?: SubscriptionResult;
  private config: DMConversationConfig;
  
  // Reactive store properties
  public readonly messages: Readable<DMMessage[]>;
  public readonly status: Readable<ConversationStatus>;
  public readonly latest: Readable<DMMessage | null>;
  public readonly error: Readable<string | null>;
  public readonly subject: Readable<string | undefined>;

  constructor(config: DMConversationConfig) {
    this.config = config;

    // Initialize writable state
    this._state = writable<DMConversationState>({
      messages: [],
      status: 'connecting',
      latest: null,
      isTyping: false,
      error: null,
      subject: config.subject
    });

    // Create derived readable properties
    this.messages = derived(this._state, state => state.messages);
    this.status = derived(this._state, state => state.status);
    this.latest = derived(this._state, state => state.latest);
    this.error = derived(this._state, state => state.error);
    this.subject = derived(this._state, state => state.subject);

    // Start listening for incoming messages
    this.initializeSubscription();
  }

  /**
   * Send an encrypted direct message
   */
  async send(content: string, subject?: string): Promise<{ success: boolean; error?: string; messageId?: string }> {
    try {
      this.updateStatus('active');

      // Create temporary message ID
      const messageId = this.generateMessageId();
      const timestamp = Math.floor(Date.now() / 1000);

      // Add message to local state immediately (optimistic update)
      const optimisticMessage: DMMessage = {
        id: messageId,
        content,
        senderPubkey: this.config.senderPubkey,
        recipientPubkey: this.config.recipientPubkey,
        timestamp,
        isFromMe: true,
        status: 'sending',
        subject: subject || this.getCurrentSubject()
      };

      this.addMessage(optimisticMessage);

      // Create gift-wrapped DM using NIP-59 protocol
      const giftWrapConfig = GiftWrapProtocol.createSimpleConfig(
        this.config.recipientPubkey,
        this.config.relayHints?.[0]
      );

      const giftWrapResult = await GiftWrapProtocol.createGiftWrappedDM(
        content,
        this.config.senderPrivateKey,
        giftWrapConfig,
        subject
      );

      // Publish gift wraps to relays
      let publishSuccess = false;
      let publishError: string | undefined;

      for (const giftWrapData of giftWrapResult.giftWraps) {
        try {
          const publishResult = await this.config.relayManager.publishToAll(giftWrapData.giftWrap);
          const successful = publishResult.some(result => result.success);
          
          if (successful) {
            publishSuccess = true;
            // Store the actual event ID from the published gift wrap
            optimisticMessage.eventId = giftWrapData.giftWrap.id;
          }
        } catch (error) {
          publishError = error instanceof Error ? error.message : 'Publishing failed';
        }
      }

      // Update message status based on publish result
      if (publishSuccess) {
        this.updateMessageStatus(messageId, 'sent');
        if (this.config.debug) {
          console.log(`DM sent successfully: ${messageId}`);
        }
        return { success: true, messageId };
      } else {
        this.updateMessageStatus(messageId, 'failed');
        const errorMsg = publishError || 'Failed to publish to any relay';
        this.setError(errorMsg);
        return { success: false, error: errorMsg, messageId };
      }

    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Unknown error sending message';
      this.setError(errorMsg);
      return { success: false, error: errorMsg };
    }
  }

  /**
   * Update the conversation subject
   */
  updateSubject(newSubject: string): void {
    this._state.update(state => ({
      ...state,
      subject: newSubject
    }));
  }

  /**
   * Clear the conversation history
   */
  clearHistory(): void {
    this._state.update(state => ({
      ...state,
      messages: [],
      latest: null
    }));
  }

  /**
   * Close the conversation and clean up subscriptions
   */
  async close(): Promise<void> {
    if (this.subscription?.subscription?.id) {
      await this.config.subscriptionManager.close(this.subscription.subscription.id);
    }
    this.updateStatus('disconnected');
  }

  /**
   * Retry connection if in error state
   */
  async retry(): Promise<void> {
    if (this.subscription?.subscription?.id) {
      await this.config.subscriptionManager.close(this.subscription.subscription.id);
    }
    this.setError(null);
    await this.initializeSubscription();
  }

  /**
   * Handle a decrypted event forwarded from the global inbox
   * This enables transparent caching and zero-config DX
   */
  handleDecryptedEvent(decryptedEvent: NostrEvent): void {
    if (this.config.debug) {
      console.log('📨 Processing decrypted event in conversation:', decryptedEvent.id);
    }
    
    // Process the event using our existing handler
    this.handleInboxEvent(decryptedEvent);
  }

  // Private methods

  private async initializeSubscription(): Promise<void> {
    try {
      this.updateStatus('connecting');

      // Subscribe to gift wrap events (kind 1059) for this recipient
      const filter: Filter = {
        kinds: [1059], // NIP-59 gift wrap events
        '#p': [this.config.senderPubkey], // Events tagged with our pubkey as recipient
        limit: 100 // Get recent messages
      };

      const options: SubscriptionOptions = {
        onEvent: (event: NostrEvent) => this.handleIncomingEvent(event),
        onEose: () => {
          this.updateStatus('active');
          if (this.config.debug) {
            console.log(`DM conversation subscription active for ${this.config.recipientPubkey}`);
          }
        },
        onClose: (reason?: string) => {
          this.updateStatus('disconnected');
          if (reason) {
            this.setError(`Subscription closed: ${reason}`);
          }
        }
      };

      this.subscription = await this.config.subscriptionManager.subscribe([filter], options);

      if (!this.subscription.success) {
        const error = this.subscription.error?.message || 'Failed to create subscription';
        this.setError(error);
        this.updateStatus('error');
      }

    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Failed to initialize subscription';
      this.setError(errorMsg);
      this.updateStatus('error');
    }
  }

  private async handleIncomingEvent(event: NostrEvent): Promise<void> {
    try {
      // Check if this is a gift wrap event
      if (event.kind !== 1059) {
        return;
      }

      // Try to decrypt the gift wrap
      const decryptionResult = await GiftWrapProtocol.decryptGiftWrappedDM(
        event as GiftWrap,
        this.config.senderPrivateKey
      );

      if (!decryptionResult.isValid || !decryptionResult.rumor) {
        if (this.config.debug) {
          console.log('Failed to decrypt gift wrap or not for us');
        }
        return;
      }

      // Check if the message is from the conversation partner
      if (decryptionResult.senderPubkey !== this.config.recipientPubkey) {
        if (this.config.debug) {
          console.log('Message not from conversation partner');
        }
        return;
      }

      // Convert rumor to DMMessage
      const message: DMMessage = {
        id: this.generateMessageId(),
        content: decryptionResult.rumor.content,
        senderPubkey: decryptionResult.senderPubkey,
        recipientPubkey: this.config.senderPubkey,
        timestamp: decryptionResult.rumor.created_at,
        isFromMe: false,
        eventId: event.id,
        status: 'received',
        subject: this.extractSubjectFromRumor(decryptionResult.rumor)
      };

      // Check for duplicates
      const currentMessages = this.getCurrentMessages();
      const isDuplicate = currentMessages.some(msg => 
        msg.eventId === event.id || 
        (msg.content === message.content && 
         Math.abs(msg.timestamp - message.timestamp) < 5) // Within 5 seconds
      );

      if (!isDuplicate) {
        this.addMessage(message);

        if (this.config.debug) {
          console.log(`Received DM from ${decryptionResult.senderPubkey}: ${message.content}`);
        }
      }

    } catch (error) {
      if (this.config.debug) {
        console.error('Error handling incoming DM event:', error);
      }
    }
  }

  private addMessage(message: DMMessage): void {
    this._state.update(state => {
      const newMessages = [...state.messages, message];
      // Sort by timestamp (oldest first)
      newMessages.sort((a, b) => a.timestamp - b.timestamp);
      
      return {
        ...state,
        messages: newMessages,
        latest: newMessages[newMessages.length - 1] || null
      };
    });
  }

  private updateMessageStatus(messageId: string, status: DMMessage['status']): void {
    this._state.update(state => ({
      ...state,
      messages: state.messages.map(msg => 
        msg.id === messageId ? { ...msg, status } : msg
      )
    }));
  }

  private updateStatus(status: ConversationStatus): void {
    this._state.update(state => ({
      ...state,
      status
    }));
  }

  private setError(error: string | null): void {
    this._state.update(state => ({
      ...state,
      error
    }));
  }

  private getCurrentSubject(): string | undefined {
    let currentSubject: string | undefined;
    const unsubscribe = this.subject.subscribe(subject => {
      currentSubject = subject;
    });
    unsubscribe();
    return currentSubject;
  }

  private extractSubjectFromRumor(rumor: Rumor): string | undefined {
    // Extract subject from rumor tags according to NIP-17
    // NIP-17 uses 'subject' tags for conversation threading
    const subjectTag = rumor.tags?.find(tag => tag[0] === 'subject');
    return subjectTag?.[1];
  }

  private getCurrentMessages(): DMMessage[] {
    let currentMessages: DMMessage[] = [];
    const unsubscribe = this.messages.subscribe(messages => {
      currentMessages = messages;
    });
    unsubscribe();
    return currentMessages;
  }

  private generateMessageId(): string {
    // Generate a unique message ID
    return `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  // Subscribe method for Svelte store compatibility
  subscribe(run: (value: DMMessage[]) => void): () => void {
    return this.messages.subscribe(run);
  }
}