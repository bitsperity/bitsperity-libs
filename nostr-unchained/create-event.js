import { sha256 } from 'noble-hashes/lib/sha256.js';
import * as secp256k1 from 'noble-secp256k1';

/**
 * Create a signed Nostr event using the WORKING crypto approach
 */
async function createSignedEvent(content, privateKeyHex, publicKeyHex) {
  const privateKey = Uint8Array.from(Buffer.from(privateKeyHex, 'hex'));
  
  const event = {
    kind: 1,
    content,
    tags: [],
    created_at: Math.floor(Date.now() / 1000),
    pubkey: publicKeyHex
  };

  // Serialize for signing (NIP-01 format)
  const serialized = JSON.stringify([
    0,
    event.pubkey,
    event.created_at,
    event.kind,
    event.tags,
    event.content
  ]);

  // Real SHA256 hash
  const eventHash = Buffer.from(sha256(serialized)).toString('hex');
  
  // Real Schnorr signature (Nostr standard) - EXACT copy from working script
  const signature = await secp256k1.schnorr.sign(eventHash, privateKey);

  const finalEvent = {
    id: eventHash,
    ...event,
    sig: signature  // Use signature directly like working script
  };

  return finalEvent;
}

// CLI interface
if (process.argv.length >= 5) {
  const content = process.argv[2];
  const privateKeyHex = process.argv[3]; 
  const publicKeyHex = process.argv[4];
  
  createSignedEvent(content, privateKeyHex, publicKeyHex)
    .then(event => {
      console.log(JSON.stringify(event));
    })
    .catch(error => {
      console.error('Error:', error.message);
      process.exit(1);
    });
} else {
  console.error('Usage: node create-event.js <content> <privateKeyHex> <publicKeyHex>');
  process.exit(1);
} 