import { sha256 } from 'noble-hashes/lib/sha256.js';

const text = 'test';
const bytes = new TextEncoder().encode(text);
console.log('Text:', text);
console.log('Bytes type:', typeof bytes);
console.log('Bytes constructor:', bytes.constructor.name);
console.log('Bytes:', bytes);

try {
  const hash = sha256(bytes);
  console.log('Hash worked:', Buffer.from(hash).toString('hex'));
} catch (e) {
  console.error('Hash failed:', e.message);
  console.error('Error:', e);
}

// Test direct string
try {
  const hashDirect = sha256(text);
  console.log('Direct string hash worked:', Buffer.from(hashDirect).toString('hex'));
} catch (e) {
  console.error('Direct string hash failed:', e.message);
} 