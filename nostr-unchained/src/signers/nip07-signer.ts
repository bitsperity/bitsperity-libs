import type { Signer, SignerInfo, SignerCapabilities, NostrEvent } from '@/types';
import { SignerError } from '@/types';

/**
 * NIP-07 Browser Extension Signer
 * Verwendet window.nostr für Signierung mit Browser-Extensions
 */
export class Nip07Signer implements Signer {
  private _info: SignerInfo | null = null;
  private _pubkey: string | null = null;

  public get info(): SignerInfo {
    if (!this._info) {
      throw new SignerError('Signer not initialized');
    }
    return this._info;
  }

  /**
   * Überprüft ob NIP-07 Extension verfügbar ist
   */
  public static isAvailable(): boolean {
    return typeof window !== 'undefined' && 
           typeof window.nostr !== 'undefined' && 
           typeof window.nostr.getPublicKey === 'function' &&
           typeof window.nostr.signEvent === 'function';
  }

  /**
   * Initialisiert den Signer mit der NIP-07 Extension
   */
  public async initialize(): Promise<void> {
    if (!Nip07Signer.isAvailable()) {
      throw new SignerError('NIP-07 extension not available');
    }

    try {
      this._pubkey = await window.nostr!.getPublicKey();
      
      const capabilities: SignerCapabilities = {
        canSign: true,
        canEncrypt: typeof window.nostr!.nip04?.encrypt === 'function',
        canDecrypt: typeof window.nostr!.nip04?.decrypt === 'function',
        supportsNip07: true,
        supportsNip44: false, // NIP-44 not typically supported by extensions yet
      };

      this._info = {
        type: 'nip07',
        pubkey: this._pubkey,
        capabilities,
        metadata: {
          hasRelays: typeof window.nostr!.getRelays === 'function',
        },
      };
    } catch (error) {
      throw new SignerError('Failed to initialize NIP-07 signer', error as Error);
    }
  }

  public async getPublicKey(): Promise<string> {
    if (!this._pubkey) {
      throw new SignerError('Signer not initialized');
    }
    return this._pubkey;
  }

  public async signEvent(event: Partial<NostrEvent>): Promise<NostrEvent> {
    if (!Nip07Signer.isAvailable()) {
      throw new SignerError('NIP-07 extension not available');
    }

    if (!this._pubkey) {
      throw new SignerError('Signer not initialized');
    }

    try {
      const eventToSign = {
        kind: event.kind!,
        tags: event.tags?.map(tag => [...tag]) || [],
        content: event.content!,
        created_at: event.created_at || Math.floor(Date.now() / 1000),
      };

      const signedEvent = await window.nostr!.signEvent(eventToSign);
      
      return {
        id: signedEvent.id,
        pubkey: signedEvent.pubkey,
        created_at: signedEvent.created_at,
        kind: signedEvent.kind,
        tags: signedEvent.tags.map(tag => [...tag] as readonly string[]),
        content: signedEvent.content,
        sig: signedEvent.sig,
      };
    } catch (error) {
      throw new SignerError('Failed to sign event', error as Error);
    }
  }

  public async encrypt(plaintext: string, recipientPubkey: string): Promise<string> {
    if (!this.info.capabilities.canEncrypt) {
      throw new SignerError('Encryption not supported');
    }

    if (!Nip07Signer.isAvailable() || !window.nostr!.nip04?.encrypt) {
      throw new SignerError('NIP-04 encryption not available');
    }

    try {
      return await window.nostr!.nip04.encrypt(recipientPubkey, plaintext);
    } catch (error) {
      throw new SignerError('Failed to encrypt message', error as Error);
    }
  }

  public async decrypt(ciphertext: string, senderPubkey: string): Promise<string> {
    if (!this.info.capabilities.canDecrypt) {
      throw new SignerError('Decryption not supported');
    }

    if (!Nip07Signer.isAvailable() || !window.nostr!.nip04?.decrypt) {
      throw new SignerError('NIP-04 decryption not available');
    }

    try {
      return await window.nostr!.nip04.decrypt(senderPubkey, ciphertext);
    } catch (error) {
      throw new SignerError('Failed to decrypt message', error as Error);
    }
  }

  public async cleanup(): Promise<void> {
    this._info = null;
    this._pubkey = null;
  }
} 