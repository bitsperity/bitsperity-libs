// Quick test of publishing
import { NostrUnchained } from './dist/index.js';

console.log('Testing NostrUnchained publishing...');

try {
  const nostr = new NostrUnchained({
    debug: true,
    relays: ['ws://umbrel.local:4848']
  });
  
  console.log('Created NostrUnchained instance');
  console.log('Relays:', nostr.relays);
  
  const result = await nostr.publish("Hello from test!");
  console.log('Publish result:', result);
  
} catch (error) {
  console.error('Error:', error.message);
  console.error('Stack:', error.stack);
}