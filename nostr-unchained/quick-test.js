import { NostrUnchained, npubToHex } from './dist/index.js';

console.log('Testing npub conversion...');

// Test encoding utilities first
const testHex = '0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef';
const testNpub = 'npub1qy352euf40x77qfrg4ncn27dauqjx3t83x4ummcpydzk0zdtehhstefp92';

try {
  const converted = npubToHex(testNpub);
  console.log('✅ npubToHex works:', converted.substring(0, 20) + '...');
} catch (error) {
  console.log('❌ npubToHex failed:', error.message);
}

// Test DM module without signer
const nostr = new NostrUnchained({ debug: false });

const dm = nostr.getDM();
if (dm) {
  console.log('✅ DM module available');
  
  // Test the conversion method
  try {
    const chat = dm.with(testNpub);
    console.log('✅ DM with npub SUCCESS - chat created:', !!chat);
  } catch (error) {
    console.log('❌ DM with npub FAILED:', error.message);
  }
} else {
  console.log('⚠️ DM module not available (expected without signer)');
}