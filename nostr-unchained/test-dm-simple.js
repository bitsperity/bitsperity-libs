// Simple test to debug DM conversation issue
import { NostrUnchained } from './src/index.js';
import { TemporarySigner } from './src/crypto/SigningProvider.js';

async function test() {
  const signer = new TemporarySigner();
  const pubkey = await signer.getPublicKey();
  
  const nostr = new NostrUnchained({
    relays: ['ws://umbrel.local:4848'],
    debug: true,
    signingProvider: signer
  });

  await nostr.connect();
  await nostr.initializeSigning();

  console.log('NostrUnchained ready');
  console.log('universalDM exists?', !!nostr.universalDM);
  console.log('DM module:', nostr.dm);

  try {
    const conversation = nostr.dm.with('ebc523e8fa4f8dfdca60640addb7c849950fc4e64522bb9ea5eaf8a1b7a472fe');
    console.log('Conversation:', conversation);
    console.log('Conversation.messages:', conversation?.messages);
    console.log('Conversation.subscribe:', typeof conversation?.subscribe);
    console.log('Conversation.send:', typeof conversation?.send);
  } catch (error) {
    console.error('Error:', error.message);
  }
  
  await nostr.disconnect();
}

test().catch(console.error);