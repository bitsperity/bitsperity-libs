/**
 * QueryBuilder Examples - Day 2 Implementation
 * 
 * Demonstrates the fluent API usage with real-world scenarios
 */

import { query, NostrUnchained } from '../index.js';
import type { NostrEvent } from '../core/types.js';

/**
 * Example 1: Basic text note query
 */
export async function getRecentTextNotes() {
  const client = new NostrUnchained();
  await client.connect();

  // Get last 50 text notes from the last 24 hours
  const posts = await query(client.subscriptionManager)
    .kinds([1]) // Text notes
    .since(Date.now() - 86400000) // Last 24 hours
    .limit(50)
    .execute();

  console.log(`Found ${posts.length} recent text notes`);
  return posts;
}

/**
 * Example 2: Author-specific query with type safety
 */
export async function getAuthorPosts(authorPubkey: string) {
  const client = new NostrUnchained();
  await client.connect();

  // TypeScript knows these are text notes (kind 1)
  const textNotes: (NostrEvent & { kind: 1 })[] = await query(client.subscriptionManager)
    .kinds([1])
    .authors([authorPubkey])
    .limit(100)
    .execute();

  return textNotes;
}

/**
 * Example 3: Complex query with multiple conditions
 */
export async function getTaggedContent() {
  const client = new NostrUnchained();
  await client.connect();

  const builder = query(client.subscriptionManager)
    .kinds([1, 6]) // Text notes and reposts
    .tags('t', ['nostr', 'bitcoin']) // Tagged with nostr or bitcoin
    .since(Date.now() - 7 * 24 * 60 * 60 * 1000) // Last week
    .limit(200);

  const events = await builder.execute();
  console.log(`Found ${events.length} tagged events`);
  return events;
}

/**
 * Example 4: Query composition with union
 */
export async function getFollowingAndReactions(followingPubkeys: string[]) {
  const client = new NostrUnchained();
  await client.connect();

  // Get posts from following
  const followingPosts = query(client.subscriptionManager)
    .kinds([1])
    .authors(followingPubkeys)
    .since(Date.now() - 86400000);

  // Get reactions to my posts
  const reactions = query(client.subscriptionManager)
    .kinds([7])
    .tags('p', [client.config.pubkey || '']);

  // Combine both queries
  const combined = followingPosts.union(reactions);
  const events = await combined.execute();

  return events;
}

/**
 * Example 5: Real-time subscription
 */
export async function subscribeToLiveEvents() {
  const client = new NostrUnchained();
  await client.connect();

  const subscription = await query(client.subscriptionManager)
    .kinds([1]) // Text notes
    .since(Date.now()) // Only new events
    .subscribe({
      onEvent: (event) => {
        console.log('New event:', event.content);
      },
      onEose: (relay) => {
        console.log(`EOSE from ${relay}`);
      }
    });

  return subscription;
}

/**
 * Example 6: Filter validation
 */
export function validateComplexQuery() {
  const client = new NostrUnchained();
  
  const builder = query(client.subscriptionManager)
    .kinds([1])
    .since(Date.now())
    .until(Date.now() - 86400000); // Invalid: until before since

  const validation = builder.validate();
  if (!validation.valid) {
    console.error('Query validation failed:', validation.errors);
    return false;
  }

  return true;
}

/**
 * Example 7: Immutable method chaining
 */
export function demonstrateImmutability() {
  const client = new NostrUnchained();
  
  const baseQuery = query(client.subscriptionManager).kinds([1]);
  
  // Each method call creates a new builder instance
  const aliceQuery = baseQuery.authors(['alice_pubkey']);
  const bobQuery = baseQuery.authors(['bob_pubkey']);
  
  console.log('Alice filter:', aliceQuery.toFilter());
  console.log('Bob filter:', bobQuery.toFilter());
  
  // baseQuery is unchanged
  console.log('Base filter:', baseQuery.toFilter());
}