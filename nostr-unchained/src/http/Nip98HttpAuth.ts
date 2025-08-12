import { sha256 } from '@noble/hashes/sha256';
import { bytesToHex } from '@noble/hashes/utils';
import type { NostrEvent } from '../core/types.js';

export interface HttpAuthOptions {
  method: string;
  url: string; // full URL
  payload?: string | Uint8Array; // raw body used to compute hash
}

function base64Encode(json: string): string {
  if (typeof (globalThis as any).btoa === 'function') return (globalThis as any).btoa(json);
  // Node
  return Buffer.from(json, 'utf8').toString('base64');
}

export async function buildHttpAuthEvent(nostr: any, opts: HttpAuthOptions): Promise<NostrEvent> {
  const method = opts.method.toUpperCase();
  const url = opts.url;
  let payloadHashHex: string | undefined;
  if (opts.payload && typeof opts.payload === 'string') {
    payloadHashHex = bytesToHex(sha256(new TextEncoder().encode(opts.payload)));
  } else if (opts.payload) {
    payloadHashHex = bytesToHex(sha256(opts.payload));
  }

  const builder = nostr.events.create()
    .kind(27235)
    .content('')
    .tag('u', url)
    .tag('method', method);
  if (payloadHashHex) builder.tag('payload', payloadHashHex);
  const signed = await builder.sign();
  return await signed.build();
}

export function buildHttpAuthHeader(event: NostrEvent): string {
  const json = JSON.stringify(event);
  return `Nostr ${base64Encode(json)}`;
}

export async function signHttpAuth(nostr: any, opts: HttpAuthOptions): Promise<{ event: NostrEvent; header: string }> {
  const event = await buildHttpAuthEvent(nostr, opts);
  const header = buildHttpAuthHeader(event);
  return { event, header };
}


