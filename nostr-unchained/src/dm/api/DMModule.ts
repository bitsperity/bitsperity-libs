/**
 * DMModule - Direct Message Module for NostrUnchained
 * 
 * Provides the main entry point for NIP-17 direct messaging functionality.
 * Manages multiple conversation stores and handles global DM operations.
 * 
 * Main interface: nostr.dm
 * - .with(pubkey) - Create/get 1:1 conversation store
 * - .room(participants, options) - Create/get multi-participant room
 * - .conversations - List all active conversations  
 */

import { writable, derived, type Readable, type Writable } from '../../store/NostrStore.js';
import { DMConversation, type DMConversationConfig, type DMMessage } from '../conversation/DMConversation.js';
import { DMRoom, type DMRoomConfig, type DMRoomOptions } from '../room/DMRoom.js';
import { SubscriptionManager } from '../../subscription/SubscriptionManager.js';
import { RelayManager } from '../../relay/RelayManager.js';
import type { SigningProvider } from '../../crypto/SigningProvider.js';
import type { NostrEvent, Filter } from '../../core/types.js';

export interface DMModuleConfig {
  subscriptionManager: SubscriptionManager;
  relayManager: RelayManager;
  signingProvider: SigningProvider;
  debug?: boolean;
  parent?: any; // Reference to NostrUnchained instance
}

export interface ConversationSummary {
  pubkey: string;
  latestMessage: DMMessage | null;
  lastActivity: number;
  isActive: boolean;
  subject?: string;
  participants?: string[]; // For room conversations
  type: 'conversation' | 'room';
}

export class DMModule {
  private conversations = new Map<string, DMConversation>();
  private rooms = new Map<string, DMRoom>();
  private config: DMModuleConfig;
  private _senderPubkey: string | null = null;
  private _senderPrivateKey: string | null = null;
  private parentNostr?: any; // Reference to NostrUnchained instance
  
  // Reactive stores
  private _conversationList = writable<ConversationSummary[]>([]);
  
  public readonly conversations$: Readable<ConversationSummary[]>;

  constructor(config: DMModuleConfig) {
    this.config = config;
    this.parentNostr = config.parent;
    
    // Create derived stores
    this.conversations$ = this._conversationList;
    
    // Initialize sender credentials if signing provider is available
    if (this.config.signingProvider) {
      this.initializeSender();
    }
  }

  /**
   * Get or create a conversation with a specific user
   * This is the main entry point: nostr.dm.with('npub...')
   */
  async with(pubkey: string): Promise<DMConversation> {
    // Check if we should use the Universal DM Module (cache-based architecture)
    if (this.shouldUseUniversalDM()) {
      return this.delegateToUniversalDM(pubkey);
    }
    
    // Fallback to legacy implementation
    // Normalize pubkey (remove npub prefix if present)
    const normalizedPubkey = this.normalizePubkey(pubkey);
    
    // Check if conversation already exists
    let conversation = this.conversations.get(normalizedPubkey);
    
    if (!conversation) {
      // Create new conversation
      conversation = await this.createConversation(normalizedPubkey);
      this.conversations.set(normalizedPubkey, conversation);
      this.updateConversationList();
      
      if (this.config.debug) {
        console.log(`Created new DM conversation with ${normalizedPubkey}`);
      }
    }
    
    return conversation;
  }

  /**
   * Create or get a multi-participant room
   * This is the main entry point: nostr.dm.room(['pubkey1', 'pubkey2'], { subject: 'Meeting' })
   */
  async room(participants: string[], options?: DMRoomOptions): Promise<DMRoom> {
    // Normalize pubkeys
    const normalizedParticipants = participants.map(pubkey => this.normalizePubkey(pubkey));
    
    // Create a consistent room ID based on participants
    const roomId = this.generateRoomId(normalizedParticipants);
    
    // Check if room already exists
    let room = this.rooms.get(roomId);
    
    if (!room) {
      // Create new room
      room = await this.createRoom(normalizedParticipants, options);
      this.rooms.set(roomId, room);
      this.updateConversationList();
      
      if (this.config.debug) {
        console.log(`Created new DM room: ${roomId} with ${normalizedParticipants.length} participants`);
      }
    }
    
    return room;
  }

  /**
   * Get all active conversations as summaries
   */
  getConversations(): ConversationSummary[] {
    let currentList: ConversationSummary[] = [];
    const unsubscribe = this.conversations$.subscribe(list => {
      currentList = list;
    });
    unsubscribe();
    return currentList;
  }


  /**
   * Close a specific conversation
   */
  async closeConversation(pubkey: string): Promise<void> {
    const normalizedPubkey = this.normalizePubkey(pubkey);
    const conversation = this.conversations.get(normalizedPubkey);
    
    if (conversation) {
      await conversation.close();
      this.conversations.delete(normalizedPubkey);
      this.updateConversationList();
      
      if (this.config.debug) {
        console.log(`Closed DM conversation with ${normalizedPubkey}`);
      }
    }
  }

  /**
   * Close a specific room
   */
  async closeRoom(roomId: string): Promise<void> {
    const room = this.rooms.get(roomId);
    
    if (room) {
      await room.close();
      this.rooms.delete(roomId);
      this.updateConversationList();
      
      if (this.config.debug) {
        console.log(`Closed DM room: ${roomId}`);
      }
    }
  }

  /**
   * Close all conversations and clean up
   */
  async closeAll(): Promise<void> {
    const conversationClosePromises = Array.from(this.conversations.values()).map(conv => conv.close());
    const roomClosePromises = Array.from(this.rooms.values()).map(room => room.close());
    
    await Promise.all([...conversationClosePromises, ...roomClosePromises]);
    
    this.conversations.clear();
    this.rooms.clear();
    this.updateConversationList();
    
    if (this.config.debug) {
      console.log('Closed all DM conversations and rooms');
    }
  }

  /**
   * Update the signing provider and initialize sender credentials
   * Called by NostrUnchained when signing provider becomes available
   */
  async updateSigningProvider(signingProvider: SigningProvider): Promise<void> {
    this.config.signingProvider = signingProvider;
    await this.initializeSender();
  }

  /**
   * Start global DM inbox subscription
   * Subscribes to all kind 1059 events for the current user
   */
  async startInboxSubscription(): Promise<void> {
    if (!this._senderPubkey) {
      throw new Error('Sender public key not available. Ensure signing provider is initialized.');
    }

    try {
      // Subscribe to all gift wrap events for this user
      const filter: Filter = {
        kinds: [1059], // NIP-59 gift wrap events
        '#p': [this._senderPubkey], // Events tagged with our pubkey
        limit: 50 // Recent messages only for global inbox
      };

      await this.config.subscriptionManager.subscribe([filter], {
        onEvent: (event: NostrEvent) => this.handleGlobalInboxEvent(event),
        onEose: () => {
          if (this.config.debug) {
            console.log('Global DM inbox subscription active');
          }
        }
      });

    } catch (error) {
      if (this.config.debug) {
        console.error('Failed to start global inbox subscription:', error);
      }
      throw error;
    }
  }

  // Private methods

  private async initializeSender(): Promise<void> {
    try {
      if (!this.config.signingProvider) {
        if (this.config.debug) {
          console.log('DM module: No signing provider available yet');
        }
        return;
      }
      
      this._senderPubkey = await this.config.signingProvider.getPublicKey();
      
      // For now, we'll need the private key for NIP-44 encryption
      // In a real implementation, this might be handled differently for security
      // TODO: Consider secure key management approach
      if (this.config.debug) {
        console.log(`DM module initialized for pubkey: ${this._senderPubkey}`);
      }
    } catch (error) {
      if (this.config.debug) {
        console.error('Failed to initialize sender credentials:', error);
      }
    }
  }

  private async createConversation(recipientPubkey: string): Promise<DMConversation> {
    if (!this._senderPubkey) {
      throw new Error('Sender public key not available. Call nostr.publish() or another method first to initialize signing.');
    }

    // Get actual private key from signing provider
    const senderPrivateKey = await this.getPrivateKeySecurely();

    const conversationConfig: DMConversationConfig = {
      recipientPubkey,
      senderPrivateKey,
      senderPubkey: this._senderPubkey,
      subscriptionManager: this.config.subscriptionManager,
      relayManager: this.config.relayManager,
      debug: this.config.debug
    };

    const conversation = new DMConversation(conversationConfig);
    
    // Set up reactive updates for this conversation
    this.setupConversationReactivity(conversation);
    
    return conversation;
  }

  private async createRoom(participants: string[], options?: DMRoomOptions): Promise<DMRoom> {
    if (!this._senderPubkey) {
      throw new Error('Sender public key not available. Call nostr.publish() or another method first to initialize signing.');
    }

    // Get actual private key from signing provider
    const senderPrivateKey = await this.getPrivateKeySecurely();

    const roomConfig: DMRoomConfig = {
      participants,
      senderPrivateKey,
      senderPubkey: this._senderPubkey,
      subscriptionManager: this.config.subscriptionManager,
      relayManager: this.config.relayManager,
      options,
      debug: this.config.debug
    };

    const room = new DMRoom(roomConfig);
    
    // Set up reactive updates for this room
    this.setupRoomReactivity(room);
    
    return room;
  }

  private setupConversationReactivity(conversation: DMConversation): void {
    // Subscribe to conversation changes to update our global state
    conversation.latest.subscribe(() => {
      this.updateConversationList();
    });
    
    conversation.subject.subscribe(() => {
      this.updateConversationList();
    });
  }

  private setupRoomReactivity(room: DMRoom): void {
    // Subscribe to room changes to update our global state
    room.latest.subscribe(() => {
      this.updateConversationList();
    });
    
    room.subject.subscribe(() => {
      this.updateConversationList();
    });

    room.participants.subscribe(() => {
      this.updateConversationList();
    });
  }

  private updateConversationList(): void {
    const summaries: ConversationSummary[] = [];
    
    // Add conversations
    this.conversations.forEach((conversation, pubkey) => {
      // Get current state from the conversation
      let latestMessage: DMMessage | null = null;
      let status = 'disconnected';
      let subject: string | undefined;
      
      // Synchronously get the current values
      const unsubLatest = conversation.latest.subscribe(msg => { latestMessage = msg; });
      const unsubStatus = conversation.status.subscribe(s => { status = s; });
      const unsubSubject = conversation.subject.subscribe(s => { subject = s; });
      
      unsubLatest();
      unsubStatus();
      unsubSubject();
      
      summaries.push({
        pubkey,
        latestMessage,
        lastActivity: latestMessage?.timestamp || 0,
        isActive: status === 'active' || status === 'connecting',
        subject,
        type: 'conversation'
      });
    });

    // Add rooms
    this.rooms.forEach((room, roomId) => {
      // Get current state from the room
      let latestMessage: DMMessage | null = null;
      let status = 'disconnected';
      let subject = '';
      let participants: string[] = [];
      
      // Synchronously get the current values
      const unsubLatest = room.latest.subscribe(msg => { latestMessage = msg; });
      const unsubStatus = room.status.subscribe(s => { status = s; });
      const unsubSubject = room.subject.subscribe(s => { subject = s; });
      const unsubParticipants = room.participants.subscribe(p => { participants = p; });
      
      unsubLatest();
      unsubStatus();
      unsubSubject();
      unsubParticipants();
      
      summaries.push({
        pubkey: roomId, // Use roomId as the identifier
        latestMessage,
        lastActivity: latestMessage?.timestamp || 0,
        isActive: status === 'active' || status === 'connecting',
        subject,
        participants,
        type: 'room'
      });
    });
    
    // Sort by last activity (most recent first)
    summaries.sort((a, b) => b.lastActivity - a.lastActivity);
    
    this._conversationList.set(summaries);
  }


  private async handleGlobalInboxEvent(event: NostrEvent): Promise<void> {
    if (this.config.debug) {
      console.log('🎁 Processing gift wrap event:', event.id);
    }

    try {
      // Import the gift wrap protocol to handle decryption
      const { GiftWrapProtocol } = await import('../protocol/GiftWrapProtocol.js');
      
      // Get our private key for decryption
      const privateKey = await this.getPrivateKeySecurely();
      
      // Decrypt the gift wrap to reveal the actual event (could be DM, post, reaction, etc.)
      const decryptedEvent = await GiftWrapProtocol.unwrapGiftWrap(event, privateKey);
      
      if (decryptedEvent) {
        // Extract sender from the decrypted content
        const senderPubkey = decryptedEvent.pubkey;
        
        if (this.config.debug) {
          console.log('✅ Decrypted event (kind ' + decryptedEvent.kind + ') from:', senderPubkey.substring(0, 8) + '...');
        }
        
        // Check if this is a DM/chat message (kind 4 or 14)
        if (decryptedEvent.kind === 4 || decryptedEvent.kind === 14) {
          // Auto-create or get existing conversation for DMs
          let conversation = this.conversations.get(senderPubkey);
          if (!conversation) {
            if (this.config.debug) {
              console.log('🆕 Auto-creating conversation with:', senderPubkey.substring(0, 8) + '...');
            }
            
            // Create conversation dynamically - this achieves the zero-config DX
            conversation = await this.with(senderPubkey);
          }
          
          // Forward the decrypted event to the conversation for processing
          if (conversation && typeof conversation.handleDecryptedEvent === 'function') {
            conversation.handleDecryptedEvent(decryptedEvent);
          }
          
          // Update conversation list to reflect new activity
          this.updateConversationList();
          
          if (this.config.debug) {
            console.log('🔄 Updated conversations, total:', this.conversations.size);
          }
        } else {
          // TODO: For non-DM events, add to a general encrypted event cache
          // This is where the real power lies - ANY event type can be encrypted!
          if (this.config.debug) {
            console.log('🔮 Received encrypted event kind ' + decryptedEvent.kind + ' - not a DM, caching for future use');
          }
        }
      }
      
    } catch (error) {
      if (this.config.debug) {
        console.error('❌ Failed to process gift wrap event:', error);
      }
      // Don't throw - we want the inbox to keep working even if some events fail
    }
  }

  private normalizePubkey(pubkey: string): string {
    // Remove npub prefix if present and convert to hex
    if (pubkey.startsWith('npub')) {
      // TODO: Implement bech32 decoding for npub addresses
      // For now, assume hex pubkeys
      throw new Error('npub format not yet supported, please use hex pubkey');
    }
    
    // Validate hex pubkey format
    if (!/^[0-9a-f]{64}$/i.test(pubkey)) {
      throw new Error('Invalid pubkey format. Expected 64-character hex string');
    }
    
    return pubkey.toLowerCase();
  }

  private async getPrivateKeySecurely(): Promise<string> {
    // Try to get real private key from signing provider
    if (this.config.signingProvider && 'getPrivateKeyForEncryption' in this.config.signingProvider) {
      try {
        const privateKey = await (this.config.signingProvider as any).getPrivateKeyForEncryption();
        if (this.config.debug) {
          console.log('🔐 DMModule: Retrieved private key from signing provider:', {
            type: typeof privateKey,
            length: privateKey?.length,
            isString: typeof privateKey === 'string',
            prefix: privateKey?.substring(0, 8) + '...'
          });
        }
        
        // Validate private key
        if (!privateKey || typeof privateKey !== 'string' || privateKey.length !== 64) {
          throw new Error(`Invalid private key from signing provider: type=${typeof privateKey}, length=${privateKey?.length}`);
        }
        
        return privateKey;
      } catch (error) {
        if (this.config.debug) {
          console.warn('Failed to get private key from signing provider:', error);
        }
        throw error; // Re-throw to surface the real issue
      }
    }

    // Fallback for testing
    if (process.env.NODE_ENV === 'test' || this.config.debug) {
      console.warn('WARNING: Using mock private key for testing. Do not use in production!');
      return 'test-private-key-64-char-string-abcdef1234567890abcdef1234567890';
    }
    
    throw new Error('Private key access not yet implemented. This is required for NIP-44 encryption.');
  }

  private generateRoomId(participants: string[]): string {
    // Create a consistent room ID based on sorted participants
    const sortedParticipants = [...participants, this._senderPubkey!].sort();
    return sortedParticipants.join(',');
  }

  /**
   * Check if we should use the Universal DM Module (cache-based)
   * This is a temporary bridge while we migrate to the new architecture
   */
  private shouldUseUniversalDM(): boolean {
    // For now, always use Universal DM if available
    // TODO: Make this configurable if needed
    return Boolean(this.getUniversalDMInstance());
  }

  /**
   * Get the Universal DM Module instance from the parent NostrUnchained
   */
  private getUniversalDMInstance(): any {
    return this.parentNostr?.universalDM;
  }

  /**
   * Delegate to Universal DM Module with lazy loading
   */
  private delegateToUniversalDM(pubkey: string): any {
    const universalDM = this.getUniversalDMInstance();
    if (!universalDM) {
      throw new Error('Universal DM Module not available');
    }
    
    if (this.config.debug) {
      console.log('🎯 Delegating to Universal DM Module (cache-based) for:', pubkey.substring(0, 16) + '...');
    }
    
    return universalDM.with(pubkey);
  }
}