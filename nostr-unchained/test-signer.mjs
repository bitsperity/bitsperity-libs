import { TemporarySigner } from './src/signers/temporary-signer.js';

async function testSigner() {
  console.log('🧪 Testing TemporarySigner...');
  
  try {
    const signer = new TemporarySigner();
    await signer.init();
    console.log('✅ Signer initialized:', signer.info.pubkey.substring(0, 16) + '...');
    
    const event = await signer.signEvent({
      kind: 1,
      content: 'Test message from direct test',
      tags: [],
      created_at: Math.floor(Date.now() / 1000)
    });
    
    console.log('✅ Event created successfully!');
    console.log(`   ID: ${event.id.substring(0, 16)}...`);
    console.log(`   Signature: ${event.sig.substring(0, 16)}...`);
    console.log(`   Content: ${event.content}`);
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.error('❌ Full error:', error);
  }
}

testSigner();