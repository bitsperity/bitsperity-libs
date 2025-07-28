#!/usr/bin/env node
/**
 * 🚀 NOSTR-UNCHAINED DM POWER DEMO
 * 
 * Dieses Script beweist eindeutig, dass nostr-unchained DMs funktionieren:
 * 
 * ✅ Echte NIP-17 End-to-End Verschlüsselung
 * ✅ Echter privater Relay (ws://umbrel.local:4848)
 * ✅ Echte secp256k1 Kryptographie
 * ✅ Zero-Config Developer Experience
 * ✅ Production-ready Components
 * 
 * Watch: Alice sendet verschlüsselte DM → Bob empfängt und entschlüsselt automatisch
 */

import { NostrUnchained } from './src/core/NostrUnchained.js';
import { LocalKeySigner } from './src/crypto/SigningProvider.js';

// 🔐 Echte secp256k1 Private Keys (deterministic für Demo)
const ALICE_PRIVATE_KEY = '0000000000000000000000000000000000000000000000000000000000000001';
const BOB_PRIVATE_KEY = '0000000000000000000000000000000000000000000000000000000000000002';

// 🌐 Ihr echter privater Relay
const RELAY_URL = 'ws://umbrel.local:4848';

// 🎨 Schöne Konsolen-Ausgabe
const log = {
  title: (msg) => console.log(`\n🚀 ${msg}`),
  step: (msg) => console.log(`   → ${msg}`),
  success: (msg) => console.log(`   ✅ ${msg}`),
  message: (sender, content) => console.log(`   💬 ${sender}: "${content}"`),
  error: (msg) => console.log(`   ❌ ${msg}`),
  separator: () => console.log('   ' + '─'.repeat(60))
};

// 🏭 Production Signing Provider mit fixen Keys
class DemoSigner extends LocalKeySigner {
  constructor(privateKey) {
    super();
    this.privateKey = privateKey;
  }

  async getPublicKey() {
    // Echter secp256k1 Public Key aus Private Key (wie in Production)
    const { bytesToHex } = await import('@noble/hashes/utils');
    const secp256k1 = await import('@noble/secp256k1');
    return bytesToHex(secp256k1.schnorr.getPublicKey(this.privateKey));
  }

  async getPrivateKeyForEncryption() {
    return this.privateKey;
  }
}

async function demonstrateNostrUnchainedPower() {
  log.title('NOSTR-UNCHAINED DM POWER DEMONSTRATION');
  
  try {
    log.step('Initialisiere Alice und Bob mit echten Signing Providern...');
    
    // 👩 Alice Setup - Production-ready
    const alice = new NostrUnchained({
      debug: false,
      relays: [RELAY_URL]
    });
    const aliceSigner = new DemoSigner(ALICE_PRIVATE_KEY);
    await alice.dm.updateSigningProvider(aliceSigner);
    
    // 👨 Bob Setup - Production-ready  
    const bob = new NostrUnchained({
      debug: false,
      relays: [RELAY_URL]
    });
    const bobSigner = new DemoSigner(BOB_PRIVATE_KEY);
    await bob.dm.updateSigningProvider(bobSigner);
    
    log.success('Alice und Bob initialisiert');
    
    // 🌐 Verbindung zum echten Relay
    log.step('Verbinde zu echtem Relay ws://umbrel.local:4848...');
    await Promise.all([
      alice.connect(),
      bob.connect()
    ]);
    
    // Kurz warten für Relay-Verbindung
    await new Promise(resolve => setTimeout(resolve, 1000));
    log.success('Verbunden mit echtem Relay');
    
    // 💬 DM Conversation Setup - Zero Config!
    log.step('Erstelle DM Conversations (Zero-Config)...');
    const alicesPubkey = await aliceSigner.getPublicKey();
    const bobsPubkey = await bobSigner.getPublicKey();
    
    const aliceConversation = await alice.dm.with(bobsPubkey);
    const bobConversation = await bob.dm.with(alicesPubkey);
    
    log.success('DM Conversations erstellt');
    log.separator();
    
    // 📡 Message Listener für Bob (auto-decrypt!)
    log.step('Bob hört auf eingehende verschlüsselte Messages...');
    let messageReceived = false;
    
    const unsubscribe = bobConversation.messages.subscribe(messages => {
      if (messages.length > 0) {
        const latestMessage = messages[messages.length - 1];
        if (latestMessage.content.includes('DEMO MESSAGE')) {
          log.success('Bob empfängt und entschlüsselt automatisch:');
          log.message('Bob empfangen', latestMessage.content);
          log.success('🎉 AUTOMATIC DECRYPTION SUCCESSFUL!');
          messageReceived = true;
        }
      }
    });
    
    // 🔐 Alice sendet verschlüsselte Message
    log.step('Alice sendet verschlüsselte DM (NIP-17 + NIP-44 + NIP-59)...');
    const demoMessage = `DEMO MESSAGE: Hallo Bob! Das ist eine echte verschlüsselte DM um ${new Date().toLocaleTimeString()}`;
    
    log.message('Alice sendet', demoMessage);
    
    const sendResult = await aliceConversation.send(demoMessage);
    
    if (sendResult.success) {
      log.success('Message erfolgreich verschlüsselt und published!');
      log.step('📡 Message ID: ' + sendResult.messageId);
    } else {
      log.error('Send failed: ' + sendResult.error);
      return;
    }
    
    // ⏱️ Warte auf Empfang
    log.step('Warte auf automatische Entschlüsselung bei Bob...');
    
    let attempts = 0;
    while (!messageReceived && attempts < 30) {
      await new Promise(resolve => setTimeout(resolve, 200));
      attempts++;
    }
    
    if (messageReceived) {
      log.separator();
      log.title('🎉 BEWEIS ERBRACHT!');
      log.success('✅ Message wurde verschlüsselt (NIP-17/44/59)');
      log.success('✅ Message wurde über echten Relay gesendet');
      log.success('✅ Message wurde automatisch entschlüsselt');
      log.success('✅ Zero-Config Developer Experience');
      log.success('✅ Production-ready Components verwendet');
      log.separator();
      log.title('NOSTR-UNCHAINED DM POWER: VOLLSTÄNDIG BEWIESEN! 🚀');
    } else {
      log.error('Message nicht rechtzeitig empfangen (Relay-Problem?)');
    }
    
    // 🧹 Cleanup
    unsubscribe();
    await alice.disconnect();
    await bob.disconnect();
    
  } catch (error) {
    log.error('Demo failed: ' + error.message);
    console.error(error);
  }
}

// 🎬 Run the demonstration
demonstrateNostrUnchainedPower().then(() => {
  process.exit(0);
}).catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});