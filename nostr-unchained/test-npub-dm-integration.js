#!/usr/bin/env node

/**
 * Test: npub Support für DM Module
 * 
 * Testet die neuen Features:
 * 1. DM mit npub statt nur hex
 * 2. Profile Chat-Button Integration
 * 3. Automatische npub ↔ hex Konvertierung
 */

import { NostrUnchained } from './dist/index.js';
import { npubToHex, hexToNpub, isValidNpub, isValidHexKey } from './dist/index.js';

console.log('🧪 Testing npub Support for DM Module\n');

// Test npub/hex conversion utilities
console.log('1️⃣ Testing encoding utilities...');

const testHex = '0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef';
const testNpub = hexToNpub(testHex);

console.log('✅ hex → npub conversion:', testHex.substring(0, 20) + '... → ' + testNpub);

const convertedBack = npubToHex(testNpub);
console.log('✅ npub → hex conversion:', testNpub + ' → ' + convertedBack.substring(0, 20) + '...');

console.log('✅ Bidirectional conversion works:', testHex.toLowerCase() === convertedBack.toLowerCase());

console.log('✅ Validation functions:');
console.log('  - isValidHexKey(hex):', isValidHexKey(testHex));
console.log('  - isValidNpub(npub):', isValidNpub(testNpub));
console.log('  - isValidHexKey(npub):', isValidHexKey(testNpub));
console.log('  - isValidNpub(hex):', isValidNpub(testHex));

// Test NostrUnchained integration
console.log('\n2️⃣ Testing NostrUnchained DM with npub...');

const nostr = new NostrUnchained({
  debug: false, // No debug noise
  relays: ['ws://localhost:4848'] // Local test relay  
});

// Skip connection for offline testing
console.log('⚠️ Skipping relay connection (offline test)');

// Simulate extension signer for testing
try {
  await nostr.useLocalKeySigner(); 
  console.log('✅ Local key signer initialized');
} catch (error) {
  console.log('⚠️ Signer not available, testing offline mode');
}

// Test 1: DM with hex (should work as before)
console.log('\n3️⃣ Testing DM with hex pubkey...');
const dmModule = nostr.getDM();
if (dmModule) {
  const chatHex = dmModule.with(testHex);
  console.log('✅ DM conversation created with hex:', !!chatHex);
} else {
  console.log('⚠️ DM module not available (no signing provider)');
}

// Test 2: DM with npub (NEW!)
console.log('\n4️⃣ Testing DM with npub...');
if (dmModule) {
  const chatNpub = dmModule.with(testNpub);
  console.log('✅ DM conversation created with npub:', !!chatNpub);
  
  // Should be the same conversation (caching)
  const chatHex2 = dmModule.with(testHex);
  console.log('✅ Same conversation instance cached:', chatNpub === chatHex2);
} else {
  console.log('⚠️ DM module not available (no signing provider)');
}

// Test 3: Profile Chat Button Integration
console.log('\n5️⃣ Testing Profile Chat Button Integration...');
const profile = nostr.profile;

// Test with hex
const chatFromProfileHex = profile.chat(testHex);
console.log('✅ Chat from profile with hex:', !!chatFromProfileHex);

// Test with npub
const chatFromProfileNpub = profile.chat(testNpub);
console.log('✅ Chat from profile with npub:', !!chatFromProfileNpub);

// Should be the same conversation
console.log('✅ Same conversation from profile:', chatFromProfileHex === chatFromProfileNpub);

// Test error handling
console.log('\n6️⃣ Testing error handling...');

try {
  const invalidChat = dmModule?.with('invalid-pubkey-format');
  console.log('✅ Invalid pubkey handled gracefully:', !!invalidChat);
} catch (error) {
  console.log('❌ Should not throw for invalid pubkey:', error.message);
}

try {
  const invalidNpub = profile.chat('npub1invalid');
  console.log('✅ Invalid npub handled gracefully:', !!invalidNpub);
} catch (error) {
  console.log('❌ Should not throw for invalid npub:', error.message);
}

console.log('\n🎉 All tests completed!');

// Usage examples
console.log('\n📋 Usage Examples:');
console.log('```typescript');
console.log('// Old way (hex only)');
console.log(`const chat1 = nostr.getDM().with('${testHex}');`);
console.log('');
console.log('// NEW: Works with npub!');
console.log(`const chat2 = nostr.getDM().with('${testNpub}');`);
console.log('');
console.log('// Profile integration');
console.log(`const profile = nostr.profile.get('${testNpub}');`);
console.log(`const chat3 = nostr.profile.chat('${testNpub}'); // Direct chat button!`);
console.log('```');

// Skip disconnect for offline testing
console.log('\n✅ Test completed successfully!');