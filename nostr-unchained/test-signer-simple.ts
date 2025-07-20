import { TemporarySigner } from './src/signers/temporary-signer';

async function testSigner() {
  console.log('🧪 Testing TemporarySigner Event Creation...');
  
  try {
    const signer = new TemporarySigner();
    await signer.init();
    console.log('✅ Signer initialized successfully');
    console.log(`   PubKey: ${signer.info.pubkey.substring(0, 16)}...`);
    
    const event = await signer.signEvent({
      kind: 1,
      content: 'Hello from fixed TemporarySigner!',
      tags: [],
      created_at: Math.floor(Date.now() / 1000)
    });
    
    console.log('🎉 SUCCESS! Event created and signed:');
    console.log(`   ✅ Event ID: ${event.id.substring(0, 16)}...`);
    console.log(`   ✅ Signature: ${event.sig.substring(0, 16)}...`);
    console.log(`   ✅ Content: ${event.content}`);
    console.log(`   ✅ PubKey: ${event.pubkey.substring(0, 16)}...`);
    
    // Validate basic structure
    if (event.id && event.sig && event.pubkey && event.content) {
      console.log('🔥 ALL COMPONENTS PRESENT - SIGNER IS WORKING!');
      return true;
    } else {
      console.log('❌ Missing components in event');
      return false;
    }
    
  } catch (error: any) {
    console.error('❌ Signer test failed:', error.message);
    if (error.cause) {
      console.error('❌ Cause:', error.cause.message);
    }
    return false;
  }
}

testSigner().then(success => {
  if (success) {
    console.log('\n🎉 PHASE 3 EVENT CREATION IS WORKING!');
    process.exit(0);
  } else {
    console.log('\n❌ Phase 3 event creation still broken');
    process.exit(1);
  }
});