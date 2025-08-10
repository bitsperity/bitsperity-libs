import { describe, it, expect } from 'vitest';
import { 
  npubEncode, noteEncode, nprofileEncode, neventEncode, naddrEncode,
  parseNostrUri, isNostrUri, decode
} from '../../src/index.js';

describe('NIP-21 URI', () => {
  it('parses nostr: URIs and returns decoded result + params', () => {
    const npub = npubEncode('a'.repeat(64));
    const uri = `nostr:${npub}?relay=wss%3A%2F%2Frelay.example&foo=bar&foo=baz`;
    expect(isNostrUri(uri)).toBe(true);
    const { decoded, params } = parseNostrUri(uri);
    expect(decoded.type).toBe('npub');
    expect(params.relay).toBe('wss://relay.example');
    expect(Array.isArray(params.foo)).toBe(true);
  });

  it('accepts nostr: prefix in decode()', () => {
    const note = noteEncode('b'.repeat(64));
    const uri = `nostr:${note}`;
    const d = decode(uri);
    expect(d.type).toBe('note');
  });
});


