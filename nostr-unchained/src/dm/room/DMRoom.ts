/**
 * DMRoom - Multi-participant Conversation Room for NIP-17
 * 
 * Provides a reactive store interface for managing multi-participant
 * encrypted conversations using NIP-17 protocol with proper subject support.
 * 
 * Features:
 * - Multi-participant messaging with NIP-17 compliance
 * - Subject-based conversation threading
 * - Participant management (add/remove)
 * - Subject updates
 * - Reactive message list with real-time updates
 * - Connection and encryption status tracking
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
import type { DMMessage, ConversationStatus } from '../conversation/DMConversation.js';

export interface DMRoomOptions {
  subject?: string;
  relayHints?: string[];
}

export interface DMRoomState {
  messages: DMMessage[];
  status: ConversationStatus;
  latest: DMMessage | null;
  subject: string;
  participants: string[];
  isTyping: boolean;
  error: string | null;
}

export interface DMRoomConfig {
  participants: string[];
  senderPrivateKey: string;
  senderPubkey: string;
  subscriptionManager: SubscriptionManager;
  relayManager: RelayManager;
  options?: DMRoomOptions;
  debug?: boolean;
}

export class DMRoom {
  private _state: Writable<DMRoomState>;
  private subscription?: SubscriptionResult;
  private config: DMRoomConfig;
  private roomId: string;
  
  // Reactive store properties
  public readonly messages: Readable<DMMessage[]>;
  public readonly status: Readable<ConversationStatus>;
  public readonly latest: Readable<DMMessage | null>;
  public readonly subject: Readable<string>;
  public readonly participants: Readable<string[]>;
  public readonly error: Readable<string | null>;

  constructor(config: DMRoomConfig) {
    this.config = config;
    this.roomId = this.generateRoomId();

    // Initialize writable state
    this._state = writable<DMRoomState>({
      messages: [],
      status: 'connecting',
      latest: null,
      subject: config.options?.subject || 'Group Chat',
      participants: [...config.participants, config.senderPubkey], // Include sender
      isTyping: false,
      error: null
    });

    // Create derived readable properties
    this.messages = derived(this._state, state => state.messages);
    this.status = derived(this._state, state => state.status);
    this.latest = derived(this._state, state => state.latest);
    this.subject = derived(this._state, state => state.subject);
    this.participants = derived(this._state, state => state.participants);
    this.error = derived(this._state, state => state.error);

    // Start listening for incoming messages
    this.initializeSubscription();
  }

  /**
   * Send an encrypted message to all room participants
   */
  async send(content: string): Promise<{ success: boolean; error?: string; messageId?: string }> {
    try {
      this.updateStatus('active');

      // Create temporary message ID
      const messageId = this.generateMessageId();
      const timestamp = Math.floor(Date.now() / 1000);

      // Get current state
      const currentSubject = this.getCurrentSubject();
      const currentParticipants = this.getCurrentParticipants();

      // Add message to local state immediately (optimistic update)
      const optimisticMessage: DMMessage = {
        id: messageId,
        content,
        senderPubkey: this.config.senderPubkey,
        recipientPubkey: '', // Not applicable for rooms
        timestamp,
        isFromMe: true,
        status: 'sending',
        subject: currentSubject,
        participants: currentParticipants
      };

      this.addMessage(optimisticMessage);

      // Create gift-wrapped DMs for each participant (except sender)
      const recipients = currentParticipants.filter(p => p !== this.config.senderPubkey);
      const giftWrapConfig = {
        recipients: recipients.map(pubkey => ({ pubkey })),
        relayHint: this.config.options?.relayHints?.[0]
      };

      const giftWrapResult = await GiftWrapProtocol.createGiftWrappedDM(
        content,
        this.config.senderPrivateKey,
        giftWrapConfig
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
            // Store the actual event ID from one of the published gift wraps
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
          console.log(`Room message sent successfully: ${messageId}`);
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
   * Update the room subject
   */
  async updateSubject(newSubject: string): Promise<{ success: boolean; error?: string }> {
    try {
      this._state.update(state => ({
        ...state,
        subject: newSubject
      }));

      // TODO: Send subject update message to participants
      // This would involve creating a special message type for subject updates
      
      return { success: true };
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Failed to update subject';
      return { success: false, error: errorMsg };
    }
  }

  /**
   * Add a participant to the room
   */
  async addParticipant(pubkey: string): Promise<{ success: boolean; error?: string }> {
    try {
      const currentParticipants = this.getCurrentParticipants();
      
      if (currentParticipants.includes(pubkey)) {
        return { success: false, error: 'Participant already in room' };
      }

      this._state.update(state => ({
        ...state,
        participants: [...state.participants, pubkey]
      }));

      // TODO: Send participant added notification to all participants
      
      return { success: true };
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Failed to add participant';
      return { success: false, error: errorMsg };
    }
  }

  /**
   * Remove a participant from the room
   */
  async removeParticipant(pubkey: string): Promise<{ success: boolean; error?: string }> {
    try {
      const currentParticipants = this.getCurrentParticipants();
      
      if (!currentParticipants.includes(pubkey)) {
        return { success: false, error: 'Participant not in room' };
      }

      if (pubkey === this.config.senderPubkey) {
        return { success: false, error: 'Cannot remove yourself from room' };
      }

      this._state.update(state => ({
        ...state,
        participants: state.participants.filter(p => p !== pubkey)
      }));

      // TODO: Send participant removed notification to remaining participants
      
      return { success: true };
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Failed to remove participant';
      return { success: false, error: errorMsg };
    }
  }

  /**
   * Clear the room history
   */
  clearHistory(): void {
    this._state.update(state => ({
      ...state,
      messages: [],
      latest: null
    }));
  }

  /**
   * Close the room and clean up subscriptions
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

  // Private methods

  private async initializeSubscription(): Promise<void> {
    try {
      this.updateStatus('connecting');

      // Subscribe to gift wrap events (kind 1059) for this room
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
            console.log(`Room subscription active: ${this.roomId}`);
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

      // Check if the message is from a room participant
      const currentParticipants = this.getCurrentParticipants();
      if (!currentParticipants.includes(decryptionResult.senderPubkey)) {
        if (this.config.debug) {
          console.log('Message not from room participant');
        }
        return;
      }

      // Extract subject from rumor to match room context
      const messageSubject = this.extractSubjectFromRumor(decryptionResult.rumor);
      const currentSubject = this.getCurrentSubject();
      
      // For room messages, we could check subject matching or use other room identification
      // For now, we'll accept messages from known participants

      // Convert rumor to DMMessage
      const message: DMMessage = {
        id: this.generateMessageId(),
        content: decryptionResult.rumor.content,
        senderPubkey: decryptionResult.senderPubkey,
        recipientPubkey: '', // Not applicable for rooms
        timestamp: decryptionResult.rumor.created_at,
        isFromMe: false,
        eventId: event.id,
        status: 'received',
        subject: messageSubject || currentSubject,
        participants: currentParticipants
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
          console.log(`Received room message from ${decryptionResult.senderPubkey}: ${message.content}`);
        }
      }

    } catch (error) {
      if (this.config.debug) {
        console.error('Error handling incoming room event:', error);
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

  private getCurrentSubject(): string {
    let currentSubject = '';
    const unsubscribe = this.subject.subscribe(subject => {
      currentSubject = subject;
    });
    unsubscribe();
    return currentSubject;
  }

  private getCurrentParticipants(): string[] {
    let currentParticipants: string[] = [];
    const unsubscribe = this.participants.subscribe(participants => {
      currentParticipants = participants;
    });
    unsubscribe();
    return currentParticipants;
  }

  private getCurrentMessages(): DMMessage[] {
    let currentMessages: DMMessage[] = [];
    const unsubscribe = this.messages.subscribe(messages => {
      currentMessages = messages;
    });
    unsubscribe();
    return currentMessages;
  }

  private extractSubjectFromRumor(rumor: Rumor): string | undefined {
    // Extract subject from rumor tags according to NIP-17
    // NIP-17 uses 'subject' tags for conversation threading
    const subjectTag = rumor.tags?.find(tag => tag[0] === 'subject');
    return subjectTag?.[1];
  }

  private generateRoomId(): string {
    // Generate a unique room ID based on participants
    const sortedParticipants = [...this.config.participants, this.config.senderPubkey].sort();
    const participantString = sortedParticipants.join(',');
    return `room_${Date.now()}_${participantString.slice(0, 16)}`;
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