import { sha256 } from 'noble-hashes/lib/sha256.js';
import * as secp256k1 from 'noble-secp256k1';
import WebSocket from 'ws';

/**
 * 🎯 QUICK UMBREL TEST
 * Sends REAL valid Nostr events to your Umbrel relay
 */

// Generate a real keypair
const privateKey = secp256k1.utils.randomPrivateKey();
const publicKey = Buffer.from(secp256k1.getPublicKey(privateKey, true).slice(1)).toString('hex');

console.log('🔑 Generated keypair:');
console.log('  Private Key:', Buffer.from(privateKey).toString('hex'));
console.log('  Public Key:', publicKey);

// Create a real Nostr event
async function createTextNote(content) {
  const event = {
    kind: 1,
    created_at: Math.floor(Date.now() / 1000),
    tags: [],
    content,
    pubkey: publicKey
  };

  // Serialize exactly as per NIP-01
  const serialized = JSON.stringify([
    0,
    event.pubkey,
    event.created_at,
    event.kind,
    event.tags,
    event.content
  ]);

  console.log('📝 Serialized event:', serialized);

  // Real SHA256 hash
  const eventHash = Buffer.from(sha256(serialized)).toString('hex');
  
  // Real Schnorr signature (Nostr standard)
  const signature = await secp256k1.schnorr.sign(eventHash, privateKey);

  const finalEvent = {
    id: eventHash,
    ...event,
    sig: signature
  };

  console.log('✅ Created event:');
  console.log('  ID:', finalEvent.id);
  console.log('  Signature:', finalEvent.sig);

  return finalEvent;
}

async function sendToUmbrel() {
  const UMBREL_RELAY = 'ws://umbrel.local:4848';
  
  console.log('🌐 Connecting to Umbrel relay...');
  
  const ws = new WebSocket(UMBREL_RELAY);
  
  ws.on('open', async () => {
    console.log('✅ Connected to Umbrel!');
    
    // Create and send a real event
    const event = await createTextNote('🎉 REAL VALID EVENT FROM PHASE 3! 🎉\n\nThis is a genuine Nostr event with:\n✅ Valid SHA256 ID\n✅ Valid secp256k1 signature\n✅ Proper NIP-01 serialization\n\nYour Umbrel should show this! 🚀');
    
    console.log('📤 Sending event to Umbrel...');
    ws.send(JSON.stringify(['EVENT', event]));
  });
  
  ws.on('message', (data) => {
    const message = JSON.parse(data.toString());
    console.log('📡 Relay response:', message);
    
    if (message[0] === 'OK') {
      if (message[2] === true) {
        console.log('🎉 SUCCESS! Event accepted by Umbrel!');
        console.log('🔍 Check your Umbrel interface - you should see activity!');
      } else {
        console.log('❌ Event rejected:', message[3]);
      }
      ws.close();
    }
  });
  
  ws.on('error', (error) => {
    console.error('❌ WebSocket error:', error);
  });
  
  ws.on('close', () => {
    console.log('🔌 Disconnected from Umbrel');
  });
}

// Send multiple events
async function sendMultipleEvents() {
  const messages = [
    '🚀 Phase 3 Test #1: Hello Umbrel!',
    '✅ Phase 3 Test #2: Store synchronization works!',
    '🎯 Phase 3 Test #3: Real-time updates implemented!',
    '📡 Phase 3 Test #4: Relay integration successful!',
    '🌐 Phase 3 Test #5: Your Umbrel is now on Nostr!'
  ];

  for (let i = 0; i < messages.length; i++) {
    console.log(`\n📝 Sending message ${i + 1}/5...`);
    
    const ws = new WebSocket('ws://umbrel.local:4848');
    
         await new Promise((resolve, reject) => {
       ws.on('open', async () => {
         const event = await createTextNote(messages[i]);
         ws.send(JSON.stringify(['EVENT', event]));
       });
      
      ws.on('message', (data) => {
        const message = JSON.parse(data.toString());
        if (message[0] === 'OK') {
          console.log(`${message[2] ? '✅' : '❌'} Message ${i + 1}:`, message[2] ? 'accepted' : message[3]);
          ws.close();
          resolve();
        }
      });
      
      ws.on('error', reject);
    });
    
    // Wait between messages
    await new Promise(r => setTimeout(r, 1000));
  }
  
  console.log('\n🎉 All messages sent! Check your Umbrel interface!');
}

// Run the test
console.log('🎯 Starting Umbrel integration test...\n');

sendToUmbrel().then(() => {
  console.log('\n📊 Sending multiple events...');
  return sendMultipleEvents();
}).catch(console.error); 