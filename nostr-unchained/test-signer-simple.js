// Simple test for TemporarySigner
const { TemporarySigner } = require('./dist/signers/temporary-signer.js');

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
    } else {
      console.log('❌ Missing components in event');
    }
    
  } catch (error) {
    console.error('❌ Signer test failed:', error.message);
    if (error.cause) {
      console.error('❌ Cause:', error.cause.message);
    }
  }
}

// First, build the project
const { execSync } = require('child_process');

console.log('📦 Building project...');
try {
  execSync('npm run build', { stdio: 'inherit' });
  console.log('✅ Build successful, now testing...\n');
  testSigner();
} catch (buildError) {
  console.error('❌ Build failed:', buildError.message);
  console.log('\n🔧 Trying direct TypeScript test instead...');
  
  // Fallback: test with ts-node
  try {
    execSync('npx ts-node test-signer-simple.ts', { stdio: 'inherit' });
  } catch (tsError) {
    console.error('❌ TypeScript test also failed');
  }
}