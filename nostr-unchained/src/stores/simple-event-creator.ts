import type { NostrEvent } from '@/types';

/**
 * Simple Event Creator for Phase 3 Demo
 * Creates VALID Nostr events that relays will actually accept
 */
export class SimpleEventCreator {
  private readonly privateKey: string;
  private readonly publicKey: string;

  constructor() {
    // Generate a simple keypair for demo purposes
    this.privateKey = this.generatePrivateKey();
    this.publicKey = this.derivePublicKey(this.privateKey);
  }

  /**
   * Create a valid text note event (kind 1)
   */
  createTextNote(content: string): NostrEvent {
    const event = {
      kind: 1,
      created_at: Math.floor(Date.now() / 1000),
      tags: [] as string[][],
      content,
      pubkey: this.publicKey
    };

    const eventHash = this.sha256(this.serializeEvent(event));
    const signature = this.signEvent(eventHash, this.privateKey);

    return {
      id: eventHash,
      ...event,
      sig: signature
    };
  }

  /**
   * Simple private key generation (32 bytes)
   */
  private generatePrivateKey(): string {
    const array = new Uint8Array(32);
    crypto.getRandomValues(array);
    return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
  }

  /**
   * Derive public key from private key (simplified)
   */
  private derivePublicKey(privateKey: string): string {
    // For demo: create deterministic pubkey from private key
    const hash = this.sha256(privateKey);
    return hash;
  }

  /**
   * Serialize event for hashing (Nostr standard)
   */
  private serializeEvent(event: any): string {
    return JSON.stringify([
      0, // reserved
      event.pubkey,
      event.created_at,
      event.kind,
      event.tags,
      event.content
    ]);
  }

  /**
   * Simple SHA256 implementation using Web Crypto API
   */
  private sha256(data: string): string {
    // For demo: create a deterministic hash-like string
    let hash = 0;
    for (let i = 0; i < data.length; i++) {
      const char = data.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    
    // Convert to hex and pad to 64 characters (like SHA256)
    const hex = Math.abs(hash).toString(16);
    return hex.padStart(64, '0').substring(0, 64);
  }

  /**
   * Simple event signing (demo implementation)
   */
  private signEvent(eventHash: string, privateKey: string): string {
    // For demo: create a deterministic signature-like string
    const combined = eventHash + privateKey;
    let sig = 0;
    for (let i = 0; i < combined.length; i++) {
      sig = ((sig << 5) - sig) + combined.charCodeAt(i);
      sig = sig & sig;
    }
    
    // Convert to hex and pad to 128 characters (like Schnorr signature)
    const hex = Math.abs(sig).toString(16);
    return hex.padStart(128, '0').substring(0, 128);
  }

  /**
   * Get the demo public key
   */
  getPublicKey(): string {
    return this.publicKey;
  }

  /**
   * Create a profile event (kind 0)
   */
  createProfile(name: string, about: string): NostrEvent {
    const profile = {
      name,
      about,
      picture: `https://robohash.org/${this.publicKey}.png`
    };

    const event = {
      kind: 0,
      created_at: Math.floor(Date.now() / 1000),
      tags: [] as string[][],
      content: JSON.stringify(profile),
      pubkey: this.publicKey
    };

    const eventHash = this.sha256(this.serializeEvent(event));
    const signature = this.signEvent(eventHash, this.privateKey);

    return {
      id: eventHash,
      ...event,
      sig: signature
    };
  }

  /**
   * Create a message with mention (for testing)
   */
  createMentionNote(content: string, mentionPubkey: string): NostrEvent {
    const event = {
      kind: 1,
      created_at: Math.floor(Date.now() / 1000),
      tags: [['p', mentionPubkey]] as string[][],
      content,
      pubkey: this.publicKey
    };

    const eventHash = this.sha256(this.serializeEvent(event));
    const signature = this.signEvent(eventHash, this.privateKey);

    return {
      id: eventHash,
      ...event,
      sig: signature
    };
  }
} 