/**
 * Demo: User Control über Signing Provider
 * 
 * Zeigt die neue API für Benutzer-Kontrolle über Signing Provider:
 * 1. User kann bewusst Extension Signer wählen
 * 2. User kann bewusst Local Key Signer wählen  
 * 3. User kann eigenen Custom Signer bereitstellen
 * 4. User kann jederzeit wechseln (zur Laufzeit)
 * 5. createBestAvailable() nur als Fallback
 */

import { NostrUnchained } from './src/core/NostrUnchained.js';
import { LocalKeySigner } from './src/crypto/SigningProvider.js';

async function demoSigningUserControl() {
  console.log('🎛️ Demo: User Control über Signing Provider');
  
  // Schritt 1: Initialization ohne expliziten Signer
  console.log('\n📋 Schritt 1: NostrUnchained ohne expliziten Signer');
  const nostr = new NostrUnchained({ debug: true });
  
  console.log('Signing Info vorher:', nostr.getSigningInfo());
  
  // Schritt 2: User wählt bewusst Local Key Signer
  console.log('\n🔑 Schritt 2: User wählt bewusst Local Key Signer');
  const localResult = await nostr.useLocalKeySigner();
  console.log('Local Key Signer Result:', localResult);
  console.log('Signing Info nachher:', nostr.getSigningInfo());
  
  if (localResult.success && localResult.pubkey) {
    console.log(`✅ Local Key Pubkey: ${localResult.pubkey.substring(0, 16)}...`);
  }
  
  // Schritt 3: User wechselt zu Extension (falls verfügbar)
  console.log('\n🌐 Schritt 3: User versucht Extension Signer');
  const hasExtension = await nostr.hasExtension();
  console.log('Extension verfügbar?', hasExtension);
  
  if (hasExtension) {
    const extensionResult = await nostr.useExtensionSigner();
    console.log('Extension Signer Result:', extensionResult);
    
    if (extensionResult.success && extensionResult.pubkey) {
      console.log(`✅ Extension Pubkey: ${extensionResult.pubkey.substring(0, 16)}...`);
    }
  } else {
    console.log('❌ Keine Extension verfügbar - User behält Local Key');
  }
  
  // Schritt 4: User nutzt Custom Signer
  console.log('\n🛠️ Schritt 4: User nutzt Custom Signer');
  const customSigner = new LocalKeySigner(); // Als Beispiel
  const customResult = await nostr.useCustomSigner(customSigner);
  console.log('Custom Signer Result:', customResult);
  console.log('Signing Info final:', nostr.getSigningInfo());
  
  if (customResult.success && customResult.pubkey) {
    console.log(`✅ Custom Pubkey: ${customResult.pubkey.substring(0, 16)}...`);
  }
  
  // Schritt 5: Test publishing mit dem gewählten Signer
  console.log('\n📝 Schritt 5: Test publishing mit gewähltem Signer');
  await nostr.connect();
  
  const publishResult = await nostr.publish('Test message with user-controlled signer! 🎛️');
  console.log('Publish erfolgreich?', publishResult.success);
  
  if (publishResult.success) {
    console.log(`✅ Event ID: ${publishResult.eventId}`);
  }
  
  console.log('\n🏆 PERFEKTE USER KONTROLLE:');
  console.log('✅ User wählt bewusst den Signer');
  console.log('✅ User kann jederzeit wechseln');
  console.log('✅ Custom Signer werden unterstützt');
  console.log('✅ createBestAvailable() nur als Fallback');
  console.log('✅ Alle Module werden automatisch neu initialisiert');
  
  console.log('\n📋 API Summary:');
  console.log('🔧 nostr.useExtensionSigner() → User wählt Extension');
  console.log('🔧 nostr.useLocalKeySigner() → User wählt Local Key');
  console.log('🔧 nostr.useCustomSigner(provider) → User nutzt eigenen');
  console.log('🔍 nostr.getSigningInfo() → Aktueller Status');
  console.log('🎯 Volle User-Kontrolle erreicht! ✨');
}

demoSigningUserControl().catch(console.error);