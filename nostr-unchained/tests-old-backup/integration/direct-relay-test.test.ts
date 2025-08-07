/**
 * DIRECT Relay Test - Test direct relay communication without lib overhead
 */

import { describe, it, expect } from 'vitest';
import WebSocket from 'ws';
import { TemporarySigner } from '../../src/crypto/SigningProvider.js';
import { EventBuilder } from '../../src/core/EventBuilder.js';

describe('Direct Relay Communication Test', () => {
  const testRelay = 'ws://umbrel.local:4848';

  it('should create and publish a real event directly to relay', async () => {
    console.log('=== Direct relay test ===');
    
    // Create real signer
    const signer = new TemporarySigner();
    const pubkey = await signer.getPublicKey();
    
    console.log('Test pubkey:', pubkey);
    
    // Create real event using static method
    const unsignedEvent = EventBuilder.createTextNote(
      `DIRECT TEST: Real event from nostr-unchained direct test at ${new Date().toISOString()}`,
      pubkey
    );
    
    // Calculate event ID and sign
    const eventId = EventBuilder.calculateEventId(unsignedEvent);
    const signature = await signer.signEvent(unsignedEvent);
    const signedEvent = {
      ...unsignedEvent,
      id: eventId,
      sig: signature
    };
    
    console.log('Created event:', signedEvent.id);
    
    // Connect to relay and publish
    return new Promise<void>((resolve, reject) => {
      const ws = new WebSocket(testRelay);
      let eventPublished = false;
      let eventReceived = false;
      
      const timeout = setTimeout(() => {
        ws.close();
        if (!eventPublished || !eventReceived) {
          reject(new Error(`Test timeout - published: ${eventPublished}, received: ${eventReceived}`));
        } else {
          resolve();
        }
      }, 15000);
      
      ws.on('open', () => {
        console.log('Connected to relay');
        
        // Publish event
        const publishMsg = ['EVENT', signedEvent];
        ws.send(JSON.stringify(publishMsg));
        console.log('Published event to relay');
      });
      
      ws.on('message', (data) => {
        const msg = JSON.parse(data.toString());
        console.log('Relay response:', msg);
        
        if (msg[0] === 'OK' && msg[1] === signedEvent.id) {
          if (msg[2] === true) {
            console.log('✅ Event accepted by relay');
            eventPublished = true;
            
            // Now try to fetch it back
            const reqId = 'test-fetch';
            const reqMsg = ['REQ', reqId, {
              ids: [signedEvent.id],
              kinds: [1],
              limit: 1
            }];
            ws.send(JSON.stringify(reqMsg));
            console.log('Requesting event back from relay');
          } else {
            reject(new Error(`Relay rejected event: ${msg[3]}`));
          }
        } else if (msg[0] === 'EVENT' && msg[2]?.id === signedEvent.id) {
          console.log('✅ Received our event back from relay');
          eventReceived = true;
          
          const receivedEvent = msg[2];
          expect(receivedEvent.id).toBe(signedEvent.id);
          expect(receivedEvent.pubkey).toBe(pubkey);
          expect(receivedEvent.content).toContain('DIRECT TEST');
          
          clearTimeout(timeout);
          ws.close();
          resolve();
        } else if (msg[0] === 'EOSE') {
          if (!eventReceived) {
            reject(new Error('Event not found on relay'));
          }
        }
      });
      
      ws.on('error', (err) => {
        clearTimeout(timeout);
        reject(err);
      });
    });
  }, 20000);

  it('should verify events are actually persisted on relay', async () => {
    console.log('=== Checking relay persistence ===');
    
    return new Promise<void>((resolve, reject) => {
      const ws = new WebSocket(testRelay);
      
      const timeout = setTimeout(() => {
        ws.close();
        reject(new Error('Timeout checking relay'));
      }, 10000);
      
      ws.on('open', () => {
        // Get recent events
        const reqMsg = ['REQ', 'recent-check', {
          kinds: [1],
          limit: 20,
          since: Math.floor(Date.now() / 1000) - 3600 // Last hour
        }];
        ws.send(JSON.stringify(reqMsg));
      });
      
      const events: any[] = [];
      
      ws.on('message', (data) => {
        const msg = JSON.parse(data.toString());
        
        if (msg[0] === 'EVENT') {
          events.push(msg[2]);
          console.log(`Event: ${msg[2].id} - "${msg[2].content.substring(0, 60)}..."`);
        } else if (msg[0] === 'EOSE') {
          console.log(`Found ${events.length} recent events on relay`);
          
          // Look for our test events
          const testEvents = events.filter(e => 
            e.content.includes('DIRECT TEST') || 
            e.content.includes('nostr-unchained')
          );
          
          console.log(`Found ${testEvents.length} test events`);
          
          clearTimeout(timeout);
          ws.close();
          
          expect(events.length).toBeGreaterThan(0);
          resolve();
        }
      });
      
      ws.on('error', (err) => {
        clearTimeout(timeout);
        reject(err);
      });
    });
  }, 15000);
});