import type { NostrEvent } from '../../core/types.js';

export interface ZapRequestOptions {
  amountMsat?: number; // in millisats
  relays?: string[];   // suggested relays for receiver to find context
  noteId?: string;     // zap a note
  address?: string;    // zap an addressable entity
}

export class ZapModule {
  constructor(private nostr: any) {}

  /**
   * Create a NIP-57 Zap Request (kind 9734) for a user or a specific note/address.
   * The actual payment is handled off-band by LNURL provider. This emits the request event to relays.
   */
  async requestZap(receiverPubkey: string, options: ZapRequestOptions = {}): Promise<{ success: boolean; eventId?: string; error?: string }> {
    const builder = this.nostr.events.create().kind(9734).content(JSON.stringify({ relays: options.relays || this.nostr.relays }));
    // required: p tag for receiver
    builder.tag('p', receiverPubkey);
    if (options.noteId) builder.tag('e', options.noteId);
    if (options.address) builder.tag('a', options.address);
    if (options.amountMsat && options.amountMsat > 0) builder.tag('amount', String(options.amountMsat));
    return await builder.publish();
  }

  /** Reactive store of Zap Receipts (kind 9735) addressed to a note */
  receiptsForNote(noteId: string) {
    this.nostr.sub().kinds([9735]).execute().catch(() => {});
    return this.nostr
      .query()
      .kinds([9735])
      .execute()
      .map((events: NostrEvent[]) => events.filter((e) => e.tags.some((t) => t[0] === 'e' && t[1] === noteId)));
  }

  /** Reactive store of Zap Receipts (kind 9735) for a profile/pubkey */
  receiptsForProfile(pubkey: string) {
    this.nostr.sub().kinds([9735]).execute().catch(() => {});
    return this.nostr
      .query()
      .kinds([9735])
      .execute()
      .map((events: NostrEvent[]) => events.filter((e) => e.tags.some((t) => t[0] === 'p' && t[1] === pubkey)));
  }
}


