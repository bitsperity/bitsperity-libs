/**
 * UniversalDMModule - Cache-based DM Module
 * 
 * Implements the elegant session architecture:
 * "DMModule as simple query wrapper" - Session Plan Phase 4
 * 
 * This is a thin wrapper over the Universal Cache system.
 * All DM functionality is built on the tested cache infrastructure.
 */

import { UniversalDMConversation } from '../conversation/UniversalDMConversation.js';
import type { NostrUnchained } from '../../core/NostrUnchained.js';
import { npubToHex, isValidNpub, isValidHexKey } from '../../utils/encoding-utils.js';

export class UniversalDMModule {
  private conversationCache = new Map<string, UniversalDMConversation>();
  private roomCache = new Map<string, UniversalDMRoom>();
  
  constructor(
    private nostr: NostrUnchained,
    private initialMyPubkey: string
  ) {}
  
  // DM conversation is just a query for kind 14 (with lazy gift wrap subscription)
  // Supports both hex pubkeys and npub format
  with(pubkeyOrNpub: string): UniversalDMConversation {
    // Convert npub to hex if needed
    const hexPubkey = this.convertToHex(pubkeyOrNpub);
    
    // Normalize pubkey to lowercase to ensure consistent instance reuse
    const normalizedPubkey = this.normalizePubkey(hexPubkey);
    
    // Check cache first for instance reuse
    const cached = this.conversationCache.get(normalizedPubkey);
    if (cached) {
      return cached;
    }
    
    // Validate pubkey format - but don't throw, return a conversation that will fail gracefully
    if (!this.isValidPubkey(normalizedPubkey)) {
      console.warn('⚠️ Invalid pubkey format, creating conversation that will fail gracefully:', pubkeyOrNpub.substring(0, 16) + '...');
      // Return a conversation that will handle the invalid pubkey gracefully, but still cache it
      const conversation = new UniversalDMConversation(this.nostr, this.myPubkey, normalizedPubkey);
      this.conversationCache.set(normalizedPubkey, conversation);
      return conversation;
    }
    
    // LAZY LOADING: Start gift wrap subscription on first DM usage
    // This gives users proper control - only starts when they actually use DMs
    this.nostr.startUniversalGiftWrapSubscription().catch(error => {
      console.warn('⚠️ Failed to start gift wrap subscription for DMs:', error);
    });
    
    const conversation = new UniversalDMConversation(this.nostr, this.getMyPubkey(), normalizedPubkey);
    this.conversationCache.set(normalizedPubkey, conversation);
    return conversation;
  }
  
  /**
   * Convert npub to hex if needed, otherwise return as-is
   */
  private convertToHex(pubkeyOrNpub: string): string {
    if (!pubkeyOrNpub || typeof pubkeyOrNpub !== 'string') {
      return pubkeyOrNpub; // Will fail validation later
    }
    
    // If it's already hex, return as-is
    if (isValidHexKey(pubkeyOrNpub)) {
      return pubkeyOrNpub;
    }
    
    // If it's npub, convert to hex
    if (isValidNpub(pubkeyOrNpub)) {
      try {
        return npubToHex(pubkeyOrNpub);
      } catch (error) {
        console.warn('⚠️ Failed to convert npub to hex:', error);
        return pubkeyOrNpub; // Will fail validation later
      }
    }
    
    // Neither valid hex nor valid npub
    return pubkeyOrNpub; // Will fail validation later
  }
  
  private isValidPubkey(pubkey: string): boolean {
    return typeof pubkey === 'string' && 
           pubkey.length === 64 && 
           /^[0-9a-f]{64}$/i.test(pubkey); // Case-insensitive hex check
  }
  
  private normalizePubkey(pubkey: string): string {
    // Convert to lowercase for consistency
    return pubkey.toLowerCase();
  }
  
  private generateRoomId(participants: string[]): string {
    // Create a consistent room ID based on sorted participants (including self)
    const allParticipants = [...participants, this.myPubkey.toLowerCase()].sort();
    return allParticipants.join(',');
  }
  
  // Room functionality - also just queries (with lazy gift wrap subscription)
  room(participants: string[], options?: { subject?: string }): UniversalDMRoom {
    // Normalize participants and create room ID
    const normalizedParticipants = participants.map(p => p.toLowerCase());
    const roomId = this.generateRoomId(normalizedParticipants);
    
    // Check cache first
    const cached = this.roomCache.get(roomId);
    if (cached) {
      return cached;
    }
    
    // LAZY LOADING: Start gift wrap subscription on first DM room usage
    this.nostr.startUniversalGiftWrapSubscription().catch(error => {
      console.warn('⚠️ Failed to start gift wrap subscription for DM room:', error);
    });
    
    const room = new UniversalDMRoom(this.nostr, this.getMyPubkey(), normalizedParticipants, options);
    this.roomCache.set(roomId, room);
    return room;
  }
  
  // Get all conversations - query all kind 14 events I'm involved in
  get conversations(): UniversalDMConversation[] {
    // Return active conversations from cache
    return Array.from(this.conversationCache.values());
  }

  /**
   * Resolve current pubkey from active signing provider to avoid stale self keys
   */
  private getMyPubkey(): string {
    const signer: any = (this.nostr as any).signingProvider;
    const syncKey: string | null | undefined = signer?.getPublicKeySync?.();
    if (syncKey && typeof syncKey === 'string' && /^[0-9a-f]{64}$/i.test(syncKey)) {
      return syncKey.toLowerCase();
    }
    // Fallback to initial captured key (constructor)
    return this.initialMyPubkey.toLowerCase();
  }

  // Get conversation summaries - required by tests
  summaries(): Array<{ pubkey: string; type: 'conversation' | 'room'; participants?: string[]; subject?: string }> {
    const summaries = [];
    
    // Add conversations
    for (const [pubkey, conversation] of this.conversationCache.entries()) {
      summaries.push({
        pubkey,
        type: 'conversation' as const
        // Note: conversations don't have participants property (only rooms do)
      });
    }
    
    // Add rooms
    for (const [roomId, room] of this.roomCache.entries()) {
      summaries.push({
        pubkey: roomId,
        type: 'room' as const,
        participants: roomId.split(','), // roomId contains all participants
        subject: (room as any).options?.subject // Access the subject from room options
      });
    }
    
    return summaries;
  }
}

// Simplified Room implementation
export class UniversalDMRoom {
  private store: any; // TODO: Implement room store
  
  constructor(
    private nostr: NostrUnchained,
    private myPubkey: string,
    private roomParticipants: string[],
    private options?: { subject?: string }
  ) {
    // Room messages are kind 14 events with multiple participants
    this.store = this.nostr.query()
      .kinds([14])
      .tags('p', [this.myPubkey, ...this.roomParticipants])
      .execute();
  }
  
  subscribe(callback: (messages: any[]) => void): () => void {
    return this.store.subscribe(callback);
  }
  
  get messages(): any[] {
    return this.store.current;
  }
  
  async send(content: string): Promise<{ success: boolean }> {
    // Send to all participants
    try {
      // TODO: Implement room sending logic
      return { success: true };
    } catch (error) {
      return { success: false };
    }
  }
  
  // Room management
  get participants(): string[] {
    return [this.myPubkey, ...this.roomParticipants];
  }
  
  async addParticipant(pubkey: string): Promise<{ success: boolean }> {
    // TODO: Implement participant management
    return { success: true };
  }
  
  async removeParticipant(pubkey: string): Promise<{ success: boolean }> {
    // TODO: Implement participant management  
    return { success: true };
  }
}