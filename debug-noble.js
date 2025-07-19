import { sha256 } from 'noble-hashes/lib/sha256.js';

console.log('🔍 Testing noble-hashes sha256 API...\n');

// Test 1: Direct string (like quick-umbrel-test.js)
const testString = 'test string';
console.log('Test 1 - Direct string:');
console.log('  Input:', testString);
console.log('  Type:', typeof testString);
try {
  const hash1 = sha256(testString);
  console.log('  ✅ Success:', Buffer.from(hash1).toString('hex'));
} catch (e) {
  console.log('  ❌ Failed:', e.message);
}

// Test 2: TextEncoder.encode() 
const testBytes = new TextEncoder().encode(testString);
console.log('\nTest 2 - TextEncoder bytes:');
console.log('  Input type:', typeof testBytes);
console.log('  Constructor:', testBytes.constructor.name);
console.log('  Length:', testBytes.length);
try {
  const hash2 = sha256(testBytes);
  console.log('  ✅ Success:', Buffer.from(hash2).toString('hex'));
} catch (e) {
  console.log('  ❌ Failed:', e.message);
}

// Test 3: Complex JSON like in nostr
const complexObj = [0, "abc123", 1234567890, 1, [], "hello world"];
const serialized = JSON.stringify(complexObj);
console.log('\nTest 3 - JSON serialized (like Nostr):');
console.log('  Serialized:', serialized);
console.log('  Type:', typeof serialized);
try {
  const hash3 = sha256(serialized);
  console.log('  ✅ Direct Success:', Buffer.from(hash3).toString('hex'));
} catch (e) {
  console.log('  ❌ Direct Failed:', e.message);
}

try {
  const serializedBytes = new TextEncoder().encode(serialized);
  const hash3b = sha256(serializedBytes);
  console.log('  ✅ Bytes Success:', Buffer.from(hash3b).toString('hex'));
} catch (e) {
  console.log('  ❌ Bytes Failed:', e.message);
} 