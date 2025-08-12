import { sha256 } from '@noble/hashes/sha256';
import { bytesToHex } from '@noble/hashes/utils';
import type { NostrEvent } from '../core/types.js';
import { signHttpAuth } from './Nip98HttpAuth.js';

export interface Nip96Info {
  api_url: string;
  download_url?: string;
  delegated_to_url?: string;
}

export interface Nip96UploadOptions {
  filename?: string;
  contentType?: string;
  caption?: string;
  alt?: string;
  requireAuth?: boolean; // add NIP-98 header
}

export interface Nip96UploadResult {
  status: 'success' | 'error' | string;
  message?: string;
  url?: string;
  ox?: string;
  x?: string;
  nip94_event?: { tags: string[][]; content?: string };
}

export class Nip96Client {
  constructor(private nostr: any) {}

  async discover(serverBaseUrl: string): Promise<Nip96Info> {
    const wellKnown = new URL('/.well-known/nostr/nip96.json', serverBaseUrl).toString();
    const res = await fetch(wellKnown);
    if (!res.ok) throw new Error(`nip96.json fetch failed: ${res.status}`);
    const json = await res.json();
    if (!json.api_url || typeof json.api_url !== 'string') throw new Error('Invalid nip96.json: missing api_url');
    return json as Nip96Info;
  }

  async upload(serverBaseUrl: string, bytes: Uint8Array | ArrayBuffer, opts: Nip96UploadOptions = {}): Promise<Nip96UploadResult> {
    const info = await this.discover(serverBaseUrl);
    const apiUrl = info.api_url || info.delegated_to_url || serverBaseUrl;
    const bodyBytes = bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes);
    const form = new FormData();
    const file = new Blob([bodyBytes], { type: opts.contentType || 'application/octet-stream' });
    form.append('file', file, opts.filename || 'upload.bin');
    if (opts.caption) form.append('caption', opts.caption);
    if (opts.alt) form.append('alt', opts.alt);

    const init: RequestInit = { method: 'POST', body: form, headers: {} };
    if (opts.requireAuth) {
      const { header } = await signHttpAuth(this.nostr, {
        method: 'POST',
        url: apiUrl,
        payload: bodyBytes // not strictly the file-hash semantics, but header exists
      });
      (init.headers as any)['Authorization'] = header;
    }

    const res = await fetch(apiUrl, init);
    const json = await res.json();
    const out: Nip96UploadResult = { status: json.status || (res.ok ? 'success' : 'error'), message: json.message };
    if (json.nip94_event?.tags) {
      out.nip94_event = json.nip94_event;
      const t = json.nip94_event.tags as string[][];
      const urlTag = t.find(x => x[0] === 'url');
      const oxTag = t.find(x => x[0] === 'ox');
      const xTag = t.find(x => x[0] === 'x');
      out.url = urlTag?.[1];
      out.ox = oxTag?.[1];
      out.x = xTag?.[1];
    }
    return out;
  }

  async publishNip94(nip94: { tags: string[][]; content?: string }): Promise<{ success: boolean; eventId?: string; error?: string }> {
    // Kind 1063 per NIP-94
    const b = this.nostr.events.create().kind(1063).content(nip94.content || '');
    for (const tag of nip94.tags || []) b.tag(tag[0], ...tag.slice(1));
    return await b.publish();
  }
}


