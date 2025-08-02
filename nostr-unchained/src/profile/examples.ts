/**
 * Profile API Usage Examples
 * 
 * Demonstrates the enhanced Profile DX implementation
 */

import { NostrUnchained } from '../core/NostrUnchained.js';

const TEST_RELAY = 'ws://umbrel.local:4848';

// Example 1: Basic Profile Subscription
async function basicProfileExample() {
  const nostr = new NostrUnchained({
    relays: [TEST_RELAY],
    debug: true
  });

  // Get reactive profile store
  const profile = nostr.profile.get('npub1sn0wdenkukak0d9dfczzeacvhkrgz92ak56egt7vdgzn8pv2wfqqhrjdv9');
  
  // Subscribe to profile changes
  const unsubscribe = profile.subscribe(state => {
    console.log('Profile:', {
      name: state.profile?.metadata.name,
      about: state.profile?.metadata.about,
      verified: state.verified,
      loading: state.loading
    });
  });

  // Clean up after 10 seconds
  setTimeout(async () => {
    unsubscribe();
    await nostr.close();
  }, 10000);
}

// Example 2: Profile Creation/Editing (requires signing provider)
async function profileEditingExample() {
  // This would require a signing provider
  console.log('Profile editing example (requires signing provider):');
  console.log(`
  const nostr = new NostrUnchained({
    relays: ['${TEST_RELAY}'],
    signingProvider: yourSigningProvider
  });

  // Create/edit profile with builder pattern
  await nostr.profile.edit()
    .name("Alice")
    .about("Building on Nostr")
    .picture("https://example.com/alice.jpg")
    .nip05("alice@example.com")
    .preserveExisting() // Keep other fields
    .publish();
  `);
}

// Example 3: Follow List Management
async function followManagementExample() {
  console.log('Follow management example (requires signing provider):');
  console.log(`
  const nostr = new NostrUnchained({
    relays: ['${TEST_RELAY}'],
    signingProvider: yourSigningProvider
  });

  // Reactive follow list
  const myFollows = nostr.profile.follows.mine();
  myFollows.subscribe(state => {
    console.log('Following:', state.follows.length);
  });

  // Add single follow
  await nostr.profile.follows.add('npub1234...')
    .relay('wss://relay.example.com')
    .publish();

  // Batch operations
  await nostr.profile.follows.batch()
    .add(['npub1...', 'npub2...', 'npub3...'])
    .remove(['npub4...'])
    .publish();
  `);
}

// Example 4: Profile Discovery
async function profileDiscoveryExample() {
  const nostr = new NostrUnchained({
    relays: [TEST_RELAY],
    debug: true
  });

  console.log('Searching for profiles with "bitcoin" in metadata...');
  
  const results = await nostr.profile.discover()
    .withMetadata('bitcoin')
    .limit(10)
    .execute();

  console.log(`Found ${results.length} profiles`);
  
  for (const result of results) {
    console.log(`- ${result.profile.metadata.name || 'Unknown'} (${result.profile.pubkey.slice(0, 16)}...)`);
  }

  await nostr.close();
}

// Example 5: Batch Profile Operations
async function batchProfileExample() {
  const nostr = new NostrUnchained({
    relays: [TEST_RELAY],
    debug: true
  });

  const pubkeys = [
    'npub1sn0wdenkukak0d9dfczzeacvhkrgz92ak56egt7vdgzn8pv2wfqqhrjdv9',
    // Add more test pubkeys here
  ];

  console.log('Fetching multiple profiles...');
  
  const batchResult = await nostr.profile.batch()
    .get(pubkeys)
    .execute();

  console.log(`Successfully fetched ${batchResult.successful.length} profiles`);
  console.log(`Failed to fetch ${batchResult.failed.length} profiles`);

  await nostr.close();
}

// Export examples
export {
  basicProfileExample,
  profileEditingExample,
  followManagementExample,
  profileDiscoveryExample,
  batchProfileExample
};

// Run examples if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  console.log('🎯 Profile API Examples');
  console.log('=====================\n');

  // Run the examples that don't require signing providers
  await basicProfileExample();
  
  console.log('\n');
  await profileDiscoveryExample();
  
  console.log('\n');
  await batchProfileExample();

  // Show other examples as code
  profileEditingExample();
  followManagementExample();
}