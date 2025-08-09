import { EventBuilder } from '../core/EventBuilder.js';
import type { NostrEvent, UnsignedEvent } from '../core/types.js';
import { LocalKeySigner } from './SigningProvider.js';

/**
 * Minimal NIP-46 client-side SigningProvider using kind:24133 requests over relays.
 *
 * Design:
 * - Uses an internal ephemeral client key (LocalKeySigner) for transport events (kind 24133)
 * - Encrypts request/response content with NIP-44 between client-ephemeral and remote-signer pubkey
 * - Publishes requests via nostr.publishSigned(), subscribes to responses via nostr.sub()
 */
export class NostrConnectSigner {
  private readonly remoteSignerPubkey: string;
  private readonly relays: string[];
  private readonly nostr: any; // NostrUnchained instance
  private readonly clientTransport: LocalKeySigner; // ephemeral client key
  private remoteUserPubkey: string | null = null;
  private responseCallbacks = new Map<string, (payload: any) => void>();
  private subscriptionStarted = false;
  private requestedPermissions: string[] = [];

  constructor(params: { remoteSignerPubkey: string; relays: string[]; nostr: any }) {
    this.remoteSignerPubkey = params.remoteSignerPubkey;
    this.relays = params.relays;
    this.nostr = params.nostr;
    this.clientTransport = new LocalKeySigner();
  }

  private async ensureResponseSubscription(): Promise<void> {
    if (this.subscriptionStarted) return;
    const clientPub = await this.clientTransport.getPublicKey();
    this.nostr
      .sub()
      .kinds([24133])
      .authors([this.remoteSignerPubkey])
      .tags('p', [clientPub])
      .limit(200)
      .execute()
      .then(() => {})
      .catch(() => {});

    const q = this.nostr
      .query()
      .kinds([24133])
      .authors([this.remoteSignerPubkey])
      .tags('p', [clientPub])
      .since(Math.floor(Date.now() / 1000) - 300)
      .execute();

    q.subscribe(async (events: NostrEvent[]) => {
      for (const ev of events) {
        try {
          const cipher = ev.content;
          const plain = await this.clientTransport.nip44Decrypt!(this.remoteSignerPubkey, cipher);
          const msg = JSON.parse(plain);
          const cb = this.responseCallbacks.get(msg.id);
          if (cb) {
            this.responseCallbacks.delete(msg.id);
            cb(msg);
          }
        } catch {}
      }
    });
    this.subscriptionStarted = true;
  }

  private async rpcRequest(method: string, params: any[]): Promise<any> {
    await this.ensureResponseSubscription();
    const clientPub = await this.clientTransport.getPublicKey();
    const reqId = Math.random().toString(36).slice(2);
    const body = { id: reqId, method, params };
    const cipher = await this.clientTransport.nip44Encrypt!(this.remoteSignerPubkey, JSON.stringify(body));
    const unsigned: UnsignedEvent = {
      pubkey: clientPub,
      created_at: Math.floor(Date.now() / 1000),
      kind: 24133,
      tags: [['p', this.remoteSignerPubkey]],
      content: cipher
    };
    const id = EventBuilder.calculateEventId(unsigned);
    const sig = await this.clientTransport.signEvent(unsigned);
    const signed: NostrEvent = { ...unsigned, id, sig };

    const response = new Promise<any>((resolve, reject) => {
      const timeout = setTimeout(() => {
        this.responseCallbacks.delete(reqId);
        reject(new Error('NIP-46 request timeout'));
      }, 10000);
      this.responseCallbacks.set(reqId, (msg) => {
        clearTimeout(timeout);
        if (msg.error) reject(new Error(msg.error));
        else resolve(msg.result);
      });
    });

    await this.nostr.publishSigned(signed);
    return await response;
  }

  /**
   * Client-initiated connection token (nostrconnect://)
   * Allows sharing a QR/URI with remote-signer to establish permissions.
   */
  async createClientToken(options?: { name?: string; secret?: string; relays?: string[]; perms?: string[] }): Promise<string> {
    const clientPub = await this.clientTransport.getPublicKey();
    const relays = (options?.relays && options.relays.length ? options.relays : this.relays) || [];
    const params = new URLSearchParams();
    for (const r of relays) params.append('relay', encodeURIComponent(r));
    if (options?.perms && options.perms.length) {
      params.set('perms', options.perms.join(','));
      this.requestedPermissions = options.perms.slice();
    }
    if (options?.name) params.set('name', options.name);
    if (options?.secret) params.set('secret', options.secret);
    const qs = params.toString();
    return `nostrconnect://${clientPub}${qs ? `?${qs}` : ''}`;
  }

  setRequestedPermissions(perms: string[]): void {
    this.requestedPermissions = perms.slice();
  }

  async getPublicKey(): Promise<string> {
    if (this.remoteUserPubkey) return this.remoteUserPubkey;
    const result = await this.rpcRequest('get_public_key', []);
    this.remoteUserPubkey = String(result);
    return this.remoteUserPubkey;
  }

  getPublicKeySync(): string | null {
    return this.remoteUserPubkey;
  }

  async signEvent(event: UnsignedEvent): Promise<string> {
    // Request remote signer to sign; result is json_stringified(signed_event)
    const result = await this.rpcRequest('sign_event', [JSON.stringify({
      content: event.content,
      kind: event.kind,
      tags: event.tags,
      created_at: event.created_at
    })]);
    try {
      const parsed = typeof result === 'string' ? JSON.parse(result) : result;
      if (!parsed || !parsed.sig) throw new Error('Invalid response from remote signer');
      return parsed.sig as string;
    } catch (e) {
      throw new Error('Failed to parse remote signature');
    }
  }
}


