// Direct test with our implementation
import { NostrUnchained } from './src/index.ts';

console.log('🚀 Starting publish debug test...\n');

const nostr = new NostrUnchained({
  debug: true,
  relays: ['ws://umbrel.local:4848']
});

try {
  console.log('📋 Config:', { relays: nostr.relays });
  
  const result = await nostr.publish("Debug test message!");
  
  console.log('\n✅ Publish result:', {
    success: result.success,
    eventId: result.eventId,
    relayResults: result.relayResults,
    error: result.error
  });
  
} catch (error) {
  console.error('\n❌ Error:', error.message);
  console.error('Stack:', error.stack);
}

process.exit(0);