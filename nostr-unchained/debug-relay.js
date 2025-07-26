// Debug relay communication
import WebSocket from 'ws';

const relay = 'ws://umbrel.local:4848';
console.log(`Connecting to ${relay}...`);

const ws = new WebSocket(relay);

ws.on('open', () => {
  console.log('✅ Connected to relay');
  
  // Send a test event
  const testEvent = {
    id: "test123",
    pubkey: "testpubkey",
    created_at: Math.floor(Date.now() / 1000),
    kind: 1,
    tags: [],
    content: "Test message",
    sig: "testsig"
  };
  
  const message = JSON.stringify(["EVENT", testEvent]);
  console.log('📤 Sending:', message);
  ws.send(message);
});

ws.on('message', (data) => {
  console.log('📥 Received:', data.toString());
  try {
    const parsed = JSON.parse(data.toString());
    console.log('📥 Parsed:', parsed);
  } catch (e) {
    console.log('❌ Parse error:', e.message);
  }
});

ws.on('error', (error) => {
  console.log('❌ WebSocket error:', error.message);
});

ws.on('close', () => {
  console.log('🔌 Connection closed');
  process.exit(0);
});

// Auto-close after 5 seconds
setTimeout(() => {
  console.log('⏰ Timeout - closing connection');
  ws.close();
}, 5000);