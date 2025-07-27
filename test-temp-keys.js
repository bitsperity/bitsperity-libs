#!/usr/bin/env node

/**
 * Test script to verify TemporarySigner generates unique keys each time
 */

// Use dynamic import for ES modules
const { TemporarySigner } = await import('./nostr-unchained/src/crypto/SigningProvider.js');

console.log('Testing TemporarySigner key generation...\n');

// Test 1: Create multiple signers and verify they have different keys
console.log('Test 1: Multiple signer instances should have different keys');
const signer1 = new TemporarySigner();
const signer2 = new TemporarySigner();
const signer3 = new TemporarySigner();

const key1 = await signer1.getPublicKey();
const key2 = await signer2.getPublicKey();
const key3 = await signer3.getPublicKey();

console.log('Signer 1 public key:', key1);
console.log('Signer 2 public key:', key2);
console.log('Signer 3 public key:', key3);

if (key1 === key2 || key1 === key3 || key2 === key3) {
  console.log('❌ FAIL: Some keys are identical!');
  process.exit(1);
} else {
  console.log('✅ PASS: All keys are unique\n');
}

// Test 2: Verify keys are proper hex format
console.log('Test 2: Keys should be 64-character hex strings');
const keyPattern = /^[0-9a-f]{64}$/;

if (!keyPattern.test(key1) || !keyPattern.test(key2) || !keyPattern.test(key3)) {
  console.log('❌ FAIL: Some keys are not in proper hex format!');
  process.exit(1);
} else {
  console.log('✅ PASS: All keys are in proper hex format\n');
}

// Test 3: Test that the problematic key is not generated
const problematicKey = '7a72aad06c3291620bab68894f88ac349bf221bc0384741eda2e7e2aca5a7a99';
console.log('Test 3: Should not generate the problematic key:', problematicKey);

if (key1 === problematicKey || key2 === problematicKey || key3 === problematicKey) {
  console.log('❌ FAIL: Generated the problematic key!');
  process.exit(1);
} else {
  console.log('✅ PASS: Did not generate the problematic key\n');
}

console.log('🎉 All tests passed! TemporarySigner is generating unique keys correctly.');