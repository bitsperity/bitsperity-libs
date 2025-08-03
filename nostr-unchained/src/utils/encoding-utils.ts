/**
 * NIP-19 Encoding Utilities
 * 
 * Komfortable Konvertierung zwischen Hex und Bech32-kodierten Nostr-Entitäten
 * Basiert auf NIP-19: Bech32-encoded entities
 * 
 * Inspiriert von nostr-tools, aber als vanilla Implementation für nostr-unchained
 */

import { bytesToHex, hexToBytes, concatBytes } from '@noble/hashes/utils';
import { bech32 } from '@scure/base';

// Bech32 size limit
const BECH32_MAX_SIZE = 5000;

// TypeScript types
export type NPub = `npub1${string}`;
export type NSec = `nsec1${string}`;
export type Note = `note1${string}`;
export type NProfile = `nprofile1${string}`;
export type NEvent = `nevent1${string}`;
export type NAddr = `naddr1${string}`;

export interface ProfilePointer {
  pubkey: string; // hex
  relays?: string[];
}

export interface EventPointer {
  id: string; // hex
  relays?: string[];
  author?: string;
  kind?: number;
}

export interface AddressPointer {
  identifier: string;
  pubkey: string;
  kind: number;
  relays?: string[];
}

// Decoded result types
export interface DecodedNpub {
  type: 'npub';
  data: string;
}

export interface DecodedNsec {
  type: 'nsec';
  data: Uint8Array;
}

export interface DecodedNote {
  type: 'note';
  data: string;
}

export interface DecodedNprofile {
  type: 'nprofile';
  data: ProfilePointer;
}

export interface DecodedNevent {
  type: 'nevent';
  data: EventPointer;
}

export interface DecodedNaddr {
  type: 'naddr';
  data: AddressPointer;
}

export type DecodedResult = DecodedNpub | DecodedNsec | DecodedNote | DecodedNprofile | DecodedNevent | DecodedNaddr;

// TLV type definitions
type TLV = { [t: number]: Uint8Array[] };

// Text encoder/decoder
const utf8Encoder = new TextEncoder();
const utf8Decoder = new TextDecoder();

/**
 * Konvertiert Integer zu Uint8Array (big-endian)
 */
function integerToUint8Array(number: number): Uint8Array {
  const uint8Array = new Uint8Array(4);
  uint8Array[0] = (number >> 24) & 0xff; // MSB
  uint8Array[1] = (number >> 16) & 0xff;
  uint8Array[2] = (number >> 8) & 0xff;
  uint8Array[3] = number & 0xff; // LSB
  return uint8Array;
}

/**
 * Parst TLV Daten
 */
function parseTLV(data: Uint8Array): TLV {
  const result: TLV = {};
  let rest = data;
  
  while (rest.length > 0) {
    if (rest.length < 2) break;
    
    const t = rest[0];
    const l = rest[1];
    
    if (rest.length < 2 + l) break;
    
    const v = rest.slice(2, 2 + l);
    rest = rest.slice(2 + l);
    
    result[t] = result[t] || [];
    result[t].push(v);
  }
  
  return result;
}

/**
 * Kodiert TLV Daten
 */
function encodeTLV(tlv: TLV): Uint8Array {
  const entries: Uint8Array[] = [];

  Object.entries(tlv)
    .reverse()
    .forEach(([t, vs]) => {
      vs.forEach(v => {
        const entry = new Uint8Array(v.length + 2);
        entry.set([parseInt(t)], 0);
        entry.set([v.length], 1);
        entry.set(v, 2);
        entries.push(entry);
      });
    });

  return concatBytes(...entries);
}

/**
 * Generische Bech32 Kodierung
 */
function encodeBech32<Prefix extends string>(prefix: Prefix, data: Uint8Array): `${Prefix}1${string}` {
  const words = bech32.toWords(data);
  return bech32.encode(prefix, words, BECH32_MAX_SIZE) as `${Prefix}1${string}`;
}

/**
 * Enkodiert Bytes mit Präfix
 */
function encodeBytes<Prefix extends string>(prefix: Prefix, bytes: Uint8Array): `${Prefix}1${string}` {
  return encodeBech32(prefix, bytes);
}

// === Public API ===

/**
 * Dekodiert alle NIP-19 Formate
 */
export function decode(code: string): DecodedResult {
  const { prefix, words } = bech32.decode(code, BECH32_MAX_SIZE);
  const data = new Uint8Array(bech32.fromWords(words));

  switch (prefix) {
    case 'nprofile': {
      const tlv = parseTLV(data);
      if (!tlv[0]?.[0]) throw new Error('missing TLV 0 for nprofile');
      if (tlv[0][0].length !== 32) throw new Error('TLV 0 should be 32 bytes');

      return {
        type: 'nprofile',
        data: {
          pubkey: bytesToHex(tlv[0][0]),
          relays: tlv[1] ? tlv[1].map(d => utf8Decoder.decode(d)) : [],
        },
      };
    }
    case 'nevent': {
      const tlv = parseTLV(data);
      if (!tlv[0]?.[0]) throw new Error('missing TLV 0 for nevent');
      if (tlv[0][0].length !== 32) throw new Error('TLV 0 should be 32 bytes');
      if (tlv[2] && tlv[2][0] && tlv[2][0].length !== 32) throw new Error('TLV 2 should be 32 bytes');
      if (tlv[3] && tlv[3][0] && tlv[3][0].length !== 4) throw new Error('TLV 3 should be 4 bytes');

      return {
        type: 'nevent',
        data: {
          id: bytesToHex(tlv[0][0]),
          relays: tlv[1] ? tlv[1].map(d => utf8Decoder.decode(d)) : [],
          author: tlv[2]?.[0] ? bytesToHex(tlv[2][0]) : undefined,
          kind: tlv[3]?.[0] ? parseInt(bytesToHex(tlv[3][0]), 16) : undefined,
        },
      };
    }
    case 'naddr': {
      const tlv = parseTLV(data);
      if (!tlv[0]?.[0]) throw new Error('missing TLV 0 for naddr');
      if (!tlv[2]?.[0]) throw new Error('missing TLV 2 for naddr');
      if (tlv[2][0].length !== 32) throw new Error('TLV 2 should be 32 bytes');
      if (!tlv[3]?.[0]) throw new Error('missing TLV 3 for naddr');
      if (tlv[3][0].length !== 4) throw new Error('TLV 3 should be 4 bytes');

      return {
        type: 'naddr',
        data: {
          identifier: utf8Decoder.decode(tlv[0][0]),
          pubkey: bytesToHex(tlv[2][0]),
          kind: parseInt(bytesToHex(tlv[3][0]), 16),
          relays: tlv[1] ? tlv[1].map(d => utf8Decoder.decode(d)) : [],
        },
      };
    }
    case 'nsec':
      return { type: prefix, data };
    case 'npub':
    case 'note':
      return { type: prefix, data: bytesToHex(data) };
    default:
      throw new Error(`Unknown prefix ${prefix}`);
  }
}

/**
 * Enkodiert NSec aus Uint8Array
 */
export function nsecEncode(key: Uint8Array): NSec {
  return encodeBytes('nsec', key);
}

/**
 * Enkodiert NPub aus Hex String
 */
export function npubEncode(hex: string): NPub {
  return encodeBytes('npub', hexToBytes(hex));
}

/**
 * Enkodiert Note aus Hex String
 */
export function noteEncode(hex: string): Note {
  return encodeBytes('note', hexToBytes(hex));
}

/**
 * Enkodiert NProfile
 */
export function nprofileEncode(profile: ProfilePointer): NProfile {
  const data = encodeTLV({
    0: [hexToBytes(profile.pubkey)],
    1: (profile.relays || []).map(url => utf8Encoder.encode(url)),
  });
  return encodeBech32('nprofile', data);
}

/**
 * Enkodiert NEvent
 */
export function neventEncode(event: EventPointer): NEvent {
  let kindArray;
  if (event.kind !== undefined) {
    kindArray = integerToUint8Array(event.kind);
  }

  const data = encodeTLV({
    0: [hexToBytes(event.id)],
    1: (event.relays || []).map(url => utf8Encoder.encode(url)),
    2: event.author ? [hexToBytes(event.author)] : [],
    3: kindArray ? [new Uint8Array(kindArray)] : [],
  });

  return encodeBech32('nevent', data);
}

/**
 * Enkodiert NAddr
 */
export function naddrEncode(addr: AddressPointer): NAddr {
  const kind = new ArrayBuffer(4);
  new DataView(kind).setUint32(0, addr.kind, false);

  const data = encodeTLV({
    0: [utf8Encoder.encode(addr.identifier)],
    1: (addr.relays || []).map(url => utf8Encoder.encode(url)),
    2: [hexToBytes(addr.pubkey)],
    3: [new Uint8Array(kind)],
  });
  return encodeBech32('naddr', data);
}

// === Convenience Functions ===

/**
 * Konvertiert einen Hex-Public-Key zu npub-Format
 */
export function hexToNpub(hexPubkey: string): NPub {
  const cleanHex = hexPubkey.startsWith('0x') ? hexPubkey.slice(2) : hexPubkey;
  if (!/^[0-9a-fA-F]{64}$/.test(cleanHex)) {
    throw new Error('Invalid hex pubkey: must be 64 hex characters');
  }
  return npubEncode(cleanHex);
}

/**
 * Konvertiert einen Hex-Private-Key zu nsec-Format
 */
export function hexToNsec(hexPrivkey: string): NSec {
  const cleanHex = hexPrivkey.startsWith('0x') ? hexPrivkey.slice(2) : hexPrivkey;
  if (!/^[0-9a-fA-F]{64}$/.test(cleanHex)) {
    throw new Error('Invalid hex privkey: must be 64 hex characters');
  }
  return nsecEncode(hexToBytes(cleanHex));
}

/**
 * Konvertiert eine Hex-Event-ID zu note-Format
 */
export function hexToNote(hexEventId: string): Note {
  const cleanHex = hexEventId.startsWith('0x') ? hexEventId.slice(2) : hexEventId;
  if (!/^[0-9a-fA-F]{64}$/.test(cleanHex)) {
    throw new Error('Invalid hex event id: must be 64 hex characters');
  }
  return noteEncode(cleanHex);
}

/**
 * Konvertiert npub zu Hex-Format
 */
export function npubToHex(npub: string): string {
  if (!npub.startsWith('npub1')) {
    throw new Error('Invalid npub: must start with "npub1"');
  }
  const decoded = decode(npub);
  if (decoded.type !== 'npub') {
    throw new Error('Invalid npub: decoded type is not "npub"');
  }
  return decoded.data;
}

/**
 * Konvertiert nsec zu Hex-Format
 */
export function nsecToHex(nsec: string): string {
  if (!nsec.startsWith('nsec1')) {
    throw new Error('Invalid nsec: must start with "nsec1"');
  }
  const decoded = decode(nsec);
  if (decoded.type !== 'nsec') {
    throw new Error('Invalid nsec: decoded type is not "nsec"');
  }
  return bytesToHex(decoded.data);
}

/**
 * Konvertiert note zu Hex-Format
 */
export function noteToHex(note: string): string {
  if (!note.startsWith('note1')) {
    throw new Error('Invalid note: must start with "note1"');
  }
  const decoded = decode(note);
  if (decoded.type !== 'note') {
    throw new Error('Invalid note: decoded type is not "note"');
  }
  return decoded.data;
}

/**
 * Erstellt ein nprofile mit Public Key und optionalen Relay-Hints
 */
export function createNprofile(pubkey: string, relays?: string[]): NProfile {
  const cleanPubkey = pubkey.startsWith('0x') ? pubkey.slice(2) : pubkey;
  if (!/^[0-9a-fA-F]{64}$/.test(cleanPubkey)) {
    throw new Error('Invalid hex pubkey: must be 64 hex characters');
  }
  return nprofileEncode({ pubkey: cleanPubkey, relays });
}

/**
 * Erstellt ein nevent mit Event-ID und optionalen Metadaten
 */
export function createNevent(
  eventId: string, 
  relays?: string[], 
  author?: string, 
  kind?: number
): NEvent {
  const cleanEventId = eventId.startsWith('0x') ? eventId.slice(2) : eventId;
  if (!/^[0-9a-fA-F]{64}$/.test(cleanEventId)) {
    throw new Error('Invalid hex event id: must be 64 hex characters');
  }
  
  let cleanAuthor: string | undefined;
  if (author) {
    cleanAuthor = author.startsWith('0x') ? author.slice(2) : author;
    if (!/^[0-9a-fA-F]{64}$/.test(cleanAuthor)) {
      throw new Error('Invalid hex author pubkey: must be 64 hex characters');
    }
  }
  
  return neventEncode({
    id: cleanEventId,
    relays,
    author: cleanAuthor,
    kind
  });
}

/**
 * Erstellt ein naddr für adressierbare Events
 */
export function createNaddr(
  identifier: string,
  pubkey: string,
  kind: number,
  relays?: string[]
): NAddr {
  const cleanPubkey = pubkey.startsWith('0x') ? pubkey.slice(2) : pubkey;
  if (!/^[0-9a-fA-F]{64}$/.test(cleanPubkey)) {
    throw new Error('Invalid hex pubkey: must be 64 hex characters');
  }
  
  return naddrEncode({
    identifier,
    pubkey: cleanPubkey,
    kind,
    relays
  });
}

// === Validation Helpers ===

/**
 * Prüft ob ein String ein gültiger Hex-Key ist
 */
export function isValidHexKey(hex: string): boolean {
  if (!hex || typeof hex !== 'string') {
    return false;
  }
  const cleanHex = hex.startsWith('0x') ? hex.slice(2) : hex;
  return /^[0-9a-fA-F]{64}$/.test(cleanHex);
}

/**
 * Prüft ob ein String ein gültiger npub ist
 */
export function isValidNpub(npub: string): boolean {
  if (!npub || typeof npub !== 'string' || !npub.startsWith('npub1')) {
    return false;
  }
  try {
    npubToHex(npub);
    return true;
  } catch {
    return false;
  }
}

/**
 * Prüft ob ein String ein gültiger nsec ist
 */
export function isValidNsec(nsec: string): boolean {
  if (!nsec || typeof nsec !== 'string' || !nsec.startsWith('nsec1')) {
    return false;
  }
  try {
    nsecToHex(nsec);
    return true;
  } catch {
    return false;
  }
}

/**
 * Prüft ob ein String eine gültige note ist
 */
export function isValidNote(note: string): boolean {
  if (!note || typeof note !== 'string' || !note.startsWith('note1')) {
    return false;
  }
  try {
    noteToHex(note);
    return true;
  } catch {
    return false;
  }
}