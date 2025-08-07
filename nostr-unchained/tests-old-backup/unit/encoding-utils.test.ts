/**
 * Tests für NIP-19 Encoding Utilities
 */

import { describe, it, expect } from 'vitest';
import {
  hexToNpub,
  hexToNsec,
  hexToNote,
  npubToHex,
  nsecToHex,
  noteToHex,
  createNprofile,
  createNevent,
  createNaddr,
  decode,
  isValidHexKey,
  isValidNpub,
  isValidNsec,
  isValidNote,
  npubEncode,
  nsecEncode,
  noteEncode,
  nprofileEncode,
  neventEncode,
  naddrEncode
} from '../../src/utils/encoding-utils.js';
import { hexToBytes } from '@noble/hashes/utils';

// Test data
const testHexPubkey = '3bf0c63fcb93463407af97a5e5ee64fa883d107ef9e558472c4eb9aaaefa459d';
const testHexPrivkey = '67dea2ed018072d675f5415ecfaed7d2597555e202d85b3d65ea4e58d2d92ffa';
const testHexEventId = '4376c65d2f232afbe9b882a35baa4f6fe8667c4e684749af565f981833ed6a65';

describe('NIP-19 Encoding Utilities', () => {
  
  describe('Basic encoding/decoding', () => {
    it('should encode and decode npub correctly', () => {
      const npub = hexToNpub(testHexPubkey);
      expect(npub).toMatch(/^npub1[a-z0-9]+$/);
      
      const decoded = npubToHex(npub);
      expect(decoded).toBe(testHexPubkey);
    });

    it('should encode and decode nsec correctly', () => {
      const nsec = hexToNsec(testHexPrivkey);
      expect(nsec).toMatch(/^nsec1[a-z0-9]+$/);
      
      const decoded = nsecToHex(nsec);
      expect(decoded).toBe(testHexPrivkey);
    });

    it('should encode and decode note correctly', () => {
      const note = hexToNote(testHexEventId);
      expect(note).toMatch(/^note1[a-z0-9]+$/);
      
      const decoded = noteToHex(note);
      expect(decoded).toBe(testHexEventId);
    });
  });

  describe('Extended entities with TLV', () => {
    it('should create and decode nprofile', () => {
      const relays = ['wss://relay.example.com', 'wss://relay2.example.com'];
      const nprofile = createNprofile(testHexPubkey, relays);
      expect(nprofile).toMatch(/^nprofile1[a-z0-9]+$/);
      
      const decoded = decode(nprofile);
      expect(decoded.type).toBe('nprofile');
      if (decoded.type === 'nprofile') {
        expect(decoded.data.pubkey).toBe(testHexPubkey);
        expect(decoded.data.relays).toEqual(relays);
      }
    });

    it('should create and decode nevent with all metadata', () => {
      const relays = ['wss://relay.example.com'];
      const author = testHexPubkey;
      const kind = 1;
      
      const nevent = createNevent(testHexEventId, relays, author, kind);
      expect(nevent).toMatch(/^nevent1[a-z0-9]+$/);
      
      const decoded = decode(nevent);
      expect(decoded.type).toBe('nevent');
      if (decoded.type === 'nevent') {
        expect(decoded.data.id).toBe(testHexEventId);
        expect(decoded.data.relays).toEqual(relays);
        expect(decoded.data.author).toBe(author);
        expect(decoded.data.kind).toBe(kind);
      }
    });

    it('should create and decode naddr', () => {
      const identifier = 'test-article';
      const kind = 30023;
      const relays = ['wss://relay.example.com'];
      
      const naddr = createNaddr(identifier, testHexPubkey, kind, relays);
      expect(naddr).toMatch(/^naddr1[a-z0-9]+$/);
      
      const decoded = decode(naddr);
      expect(decoded.type).toBe('naddr');
      if (decoded.type === 'naddr') {
        expect(decoded.data.identifier).toBe(identifier);
        expect(decoded.data.pubkey).toBe(testHexPubkey);
        expect(decoded.data.kind).toBe(kind);
        expect(decoded.data.relays).toEqual(relays);
      }
    });
  });

  describe('Input validation', () => {
    it('should handle hex input with 0x prefix', () => {
      const hexWithPrefix = '0x' + testHexPubkey;
      const npub = hexToNpub(hexWithPrefix);
      const decoded = npubToHex(npub);
      expect(decoded).toBe(testHexPubkey);
    });

    it('should reject invalid hex input', () => {
      expect(() => hexToNpub('invalid')).toThrow('Invalid hex pubkey');
      expect(() => hexToNpub('123')).toThrow('Invalid hex pubkey');
      expect(() => hexToNpub('g'.repeat(64))).toThrow('Invalid hex pubkey');
    });

    it('should reject invalid bech32 input', () => {
      expect(() => npubToHex('invalid')).toThrow('Invalid npub');
      expect(() => npubToHex('nsec1' + 'x'.repeat(58))).toThrow('Invalid npub');
    });

    it('should validate hex keys correctly', () => {
      expect(isValidHexKey(testHexPubkey)).toBe(true);
      expect(isValidHexKey('0x' + testHexPubkey)).toBe(true);
      expect(isValidHexKey('invalid')).toBe(false);
      expect(isValidHexKey('123')).toBe(false);
      expect(isValidHexKey('')).toBe(false);
    });
  });

  describe('Validation helpers', () => {
    it('should validate npub correctly', () => {
      const validNpub = hexToNpub(testHexPubkey);
      expect(isValidNpub(validNpub)).toBe(true);
      expect(isValidNpub('invalid')).toBe(false);
      expect(isValidNpub('nsec1' + 'x'.repeat(58))).toBe(false);
    });

    it('should validate nsec correctly', () => {
      const validNsec = hexToNsec(testHexPrivkey);
      expect(isValidNsec(validNsec)).toBe(true);
      expect(isValidNsec('invalid')).toBe(false);
      expect(isValidNsec('npub1' + 'x'.repeat(58))).toBe(false);
    });

    it('should validate note correctly', () => {
      const validNote = hexToNote(testHexEventId);
      expect(isValidNote(validNote)).toBe(true);
      expect(isValidNote('invalid')).toBe(false);
      expect(isValidNote('npub1' + 'x'.repeat(58))).toBe(false);
    });
  });

  describe('Low-level encoding functions', () => {
    it('should encode npub with low-level function', () => {
      const npub = npubEncode(testHexPubkey);
      expect(npub).toMatch(/^npub1[a-z0-9]+$/);
      
      const decoded = decode(npub);
      expect(decoded.type).toBe('npub');
      if (decoded.type === 'npub') {
        expect(decoded.data).toBe(testHexPubkey);
      }
    });

    it('should encode nsec with low-level function', () => {
      const privkeyBytes = hexToBytes(testHexPrivkey);
      const nsec = nsecEncode(privkeyBytes);
      expect(nsec).toMatch(/^nsec1[a-z0-9]+$/);
      
      const decoded = decode(nsec);
      expect(decoded.type).toBe('nsec');
      if (decoded.type === 'nsec') {
        expect(decoded.data).toEqual(privkeyBytes);
      }
    });

    it('should encode note with low-level function', () => {
      const note = noteEncode(testHexEventId);
      expect(note).toMatch(/^note1[a-z0-9]+$/);
      
      const decoded = decode(note);
      expect(decoded.type).toBe('note');
      if (decoded.type === 'note') {
        expect(decoded.data).toBe(testHexEventId);
      }
    });
  });

  describe('Edge cases', () => {
    it('should handle nprofile without relays', () => {
      const nprofile = createNprofile(testHexPubkey);
      const decoded = decode(nprofile);
      expect(decoded.type).toBe('nprofile');
      if (decoded.type === 'nprofile') {
        expect(decoded.data.pubkey).toBe(testHexPubkey);
        expect(decoded.data.relays).toEqual([]);
      }
    });

    it('should handle nevent without optional fields', () => {
      const nevent = createNevent(testHexEventId);
      const decoded = decode(nevent);
      expect(decoded.type).toBe('nevent');
      if (decoded.type === 'nevent') {
        expect(decoded.data.id).toBe(testHexEventId);
        expect(decoded.data.relays).toEqual([]);
        expect(decoded.data.author).toBeUndefined();
        expect(decoded.data.kind).toBeUndefined();
      }
    });

    it('should handle naddr without relays', () => {
      const identifier = 'test-article';
      const kind = 30023;
      
      const naddr = createNaddr(identifier, testHexPubkey, kind);
      const decoded = decode(naddr);
      expect(decoded.type).toBe('naddr');
      if (decoded.type === 'naddr') {
        expect(decoded.data.identifier).toBe(identifier);
        expect(decoded.data.pubkey).toBe(testHexPubkey);
        expect(decoded.data.kind).toBe(kind);
        expect(decoded.data.relays).toEqual([]);
      }
    });
  });

  describe('Real-world compatibility', () => {
    // These test vectors come from the NIP-19 specification and nostr-tools
    it('should decode known test vectors correctly', () => {
      // npub example from NIP-19
      const knownNpub = 'npub180cvv07tjdrrgpa0j7j7tmnyl2yr6yr7l8j4s3evf6u64th6gkwsyjh6w6';
      const expectedHex = '3bf0c63fcb93463407af97a5e5ee64fa883d107ef9e558472c4eb9aaaefa459d';
      
      expect(npubToHex(knownNpub)).toBe(expectedHex);
      expect(hexToNpub(expectedHex)).toBe(knownNpub);
    });
  });

  describe('Type safety', () => {
    it('should have correct TypeScript types', () => {
      const npub = hexToNpub(testHexPubkey);
      const nsec = hexToNsec(testHexPrivkey);
      const note = hexToNote(testHexEventId);
      
      // These should compile without type errors
      expect(npub.startsWith('npub1')).toBe(true);
      expect(nsec.startsWith('nsec1')).toBe(true);
      expect(note.startsWith('note1')).toBe(true);
    });
  });
});