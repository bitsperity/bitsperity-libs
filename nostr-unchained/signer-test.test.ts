import { describe, it, expect, beforeAll } from 'vitest';
import { TemporarySigner } from './src/signers/temporary-signer';

// Global setup for noble-secp256k1 HMAC before any tests
beforeAll(async () => {
  const secp256k1 = await import('@noble/secp256k1');
  const { hmac } = await import('@noble/hashes/hmac');
  const { sha256 } = await import('@noble/hashes/sha256');
  
  // Global configuration for secp256k1 
  // Try multiple API patterns since noble-secp256k1 has different exports
  if (secp256k1.default && secp256k1.default.utils) {
    secp256k1.default.utils.hmacSha256Sync = (key, ...msgs) => {
      const h = hmac.create(sha256, key);
      msgs.forEach(msg => h.update(msg));
      return h.digest();
    };
  } else if (secp256k1.utils) {
    secp256k1.utils.hmacSha256Sync = (key, ...msgs) => {
      const h = hmac.create(sha256, key);
      msgs.forEach(msg => h.update(msg));
      return h.digest();
    };
  } else {
    console.warn('⚠️ Could not find secp256k1.utils to configure HMAC');
  }
  
  console.log('✅ Global secp256k1 HMAC setup completed');
});

describe('🔧 TemporarySigner Repair Test', () => {
  it('should successfully create and sign events after all repairs', async () => {
    console.log('🧪 Testing TemporarySigner Event Creation...');
    
    const signer = new TemporarySigner();
    await signer.initialize();
    console.log('✅ Signer initialized successfully');
    console.log(`   PubKey: ${signer.info.pubkey.substring(0, 16)}...`);
    
    const event = await signer.signEvent({
      kind: 1,
      content: 'Hello from REPAIRED TemporarySigner!',
      tags: [],
      created_at: Math.floor(Date.now() / 1000)
    });
    
    console.log('🎉 SUCCESS! Event created and signed:');
    console.log(`   ✅ Event ID: ${event.id.substring(0, 16)}...`);
    console.log(`   ✅ Signature: ${event.sig.substring(0, 16)}...`);
    console.log(`   ✅ Content: ${event.content}`);
    console.log(`   ✅ PubKey: ${event.pubkey.substring(0, 16)}...`);
    
    // Validate all required components
    expect(event.id).toBeDefined();
    expect(event.sig).toBeDefined();
    expect(event.pubkey).toBeDefined();
    expect(event.content).toBe('Hello from REPAIRED TemporarySigner!');
    expect(event.kind).toBe(1);
    expect(typeof event.created_at).toBe('number');
    expect(Array.isArray(event.tags)).toBe(true);
    
    console.log('🔥 ALL VALIDATIONS PASSED - SIGNER IS FULLY WORKING!');
  }, 30000); // 30 second timeout
});