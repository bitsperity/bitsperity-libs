import { sha256 } from '@noble/hashes/sha256';
import { bytesToHex } from '@noble/hashes/utils';

export interface PublishAttachmentOptions {
  mimeType?: string;
  alt?: string;
  dim?: string;
  addHash?: boolean; // include NIP-94 sha256 in imeta ('x')
}

export class FileModule {
  constructor(private nostr: any) {}

  async hashHex(bytes: Uint8Array | ArrayBuffer): Promise<string> {
    const view = bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes);
    return bytesToHex(sha256(view));
  }

  async publishNoteWithAttachment(text: string, url: string, opts: PublishAttachmentOptions = {}): Promise<{ success: boolean; eventId?: string; error?: string }> {
    const b = this.nostr.events.create().kind(1).content(text);
    const meta: any = { mimeType: opts.mimeType, alt: opts.alt, dim: opts.dim };
    if (opts.addHash) {
      try {
        // Best-effort: fetch URL and compute sha256 for 'x' field
        const res = await fetch(url);
        const buf = new Uint8Array(await res.arrayBuffer());
        meta.sha256 = await this.hashHex(buf);
      } catch {}
    }
    b.attachMedia(url, meta);
    return await b.publish();
  }
}


