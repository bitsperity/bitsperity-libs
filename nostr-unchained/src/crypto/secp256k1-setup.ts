/**
 * Professional secp256k1 setup using the modern @noble/secp256k1 package
 * This is the maintained, security-updated version
 */

import { hmac } from '@noble/hashes/hmac';
import { sha256 } from '@noble/hashes/sha256';
import * as secp256k1 from '@noble/secp256k1';

// Modern @noble/secp256k1 setup (no manual HMAC configuration needed)
secp256k1.etc.hmacSha256Sync = (key, ...msgs) => {
  const h = hmac.create(sha256, key);
  msgs.forEach(msg => h.update(msg));
  return h.digest();
};

console.log('✅ Modern @noble/secp256k1 configured');

// Export the configured secp256k1 instance
export { secp256k1 };
export default secp256k1;