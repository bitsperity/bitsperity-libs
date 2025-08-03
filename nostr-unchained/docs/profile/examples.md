# Profile API Examples

This document provides practical examples of using the Profile Management API in real-world scenarios.

## Table of Contents

- [Basic Profile Operations](#basic-profile-operations)
- [Social Media App](#social-media-app)
- [Profile Directory](#profile-directory)
- [Follow Management](#follow-management)
- [Performance Optimization](#performance-optimization)
- [Error Handling](#error-handling)

## Basic Profile Operations

### Creating a Complete User Profile

```typescript
import { NostrUnchained } from 'nostr-unchained';

const nostr = new NostrUnchained({
  relays: [
    'wss://relay.damus.io',
    'wss://nos.lol',
    'wss://relay.snort.social'
  ]
});

await nostr.initializeSigning();
await nostr.connect();

// Create comprehensive profile
await nostr.profile.edit()
  .name('Alice Cooper')
  .about('Bitcoin enthusiast, Lightning developer, Nostr advocate 🔥')
  .picture('https://example.com/alice-avatar.jpg')
  .banner('https://example.com/alice-banner.jpg')
  .nip05('alice@bitcoindev.org')
  .website('https://alice.dev')
  .lud16('alice@getalby.com')
  .publish();

console.log('✅ Profile created successfully');
```

### Reading Profile Information

```typescript
const pubkey = 'npub1alice123...';
const profile = nostr.profile.get(pubkey);

// Subscribe to profile updates
profile.subscribe(state => {
  if (state.loading) {
    console.log('⏳ Loading profile...');
    return;
  }
  
  if (state.error) {
    console.error('❌ Profile error:', state.error.message);
    return;
  }
  
  if (state.profile) {
    console.log('👤 Profile loaded:');
    console.log('  Name:', state.profile.metadata.name);
    console.log('  About:', state.profile.metadata.about);
    console.log('  NIP-05:', state.profile.metadata.nip05);
    console.log('  Verified:', state.verified ? '✅' : '❌');
    console.log('  Last updated:', state.lastUpdated);
  } else {
    console.log('👻 Profile not found');
  }
});
```

### Partial Profile Updates

```typescript
// Update only specific fields, preserve others
await nostr.profile.edit()
  .about('Updated bio with new information 🚀')
  .preserveExisting(true) // Keep name, picture, etc.
  .publish();

// Update avatar only
await nostr.profile.edit()
  .picture('https://example.com/new-avatar.jpg')
  .preserveExisting(true)
  .publish();
```

## Social Media App

### User Profile Component

```typescript
class UserProfileCard {
  private profileStore: ProfileStore;
  private followStore: FollowListStore;
  private isFollowingStore: Readable<boolean>;
  
  constructor(private pubkey: string, private nostr: NostrUnchained) {
    this.profileStore = nostr.profile.get(pubkey);
    this.followStore = nostr.profile.follows.mine();
    this.isFollowingStore = this.followStore.isFollowing(pubkey);
  }
  
  async render() {
    // Get current states
    const profileState = await this.getStoreValue(this.profileStore);
    const isFollowing = await this.getStoreValue(this.isFollowingStore);
    
    const profile = profileState.profile;
    if (!profile) return '<div>Profile not found</div>';
    
    return `
      <div class="profile-card">
        <div class="profile-header">
          <img src="${profile.metadata.picture || '/default-avatar.png'}" 
               alt="${profile.metadata.name || 'User'}" 
               class="avatar" />
          <div class="profile-info">
            <h3>
              ${profile.metadata.name || 'Anonymous'}
              ${profileState.verified ? '<span class="verified">✓</span>' : ''}
            </h3>
            <p class="nip05">${profile.metadata.nip05 || ''}</p>
            <p class="about">${profile.metadata.about || ''}</p>
          </div>
        </div>
        
        <div class="profile-actions">
          <button onclick="this.toggleFollow()" 
                  class="follow-btn ${isFollowing ? 'following' : 'not-following'}">
            ${isFollowing ? 'Unfollow' : 'Follow'}
          </button>
          
          <button onclick="this.openProfile()" class="view-btn">
            View Profile
          </button>
        </div>
        
        <div class="profile-links">
          ${profile.metadata.website ? 
            `<a href="${profile.metadata.website}" target="_blank">🌐 Website</a>` : ''}
          ${profile.metadata.lud16 ? 
            `<span class="lightning">⚡ ${profile.metadata.lud16}</span>` : ''}
        </div>
      </div>
    `;
  }
  
  async toggleFollow() {
    try {
      const isFollowing = await this.getStoreValue(this.isFollowingStore);
      
      if (isFollowing) {
        await this.nostr.profile.follows.remove(this.pubkey);
        console.log('✅ Unfollowed user');
      } else {
        await this.nostr.profile.follows.add(this.pubkey)
          .publish();
        console.log('✅ Followed user');
      }
    } catch (error) {
      console.error('❌ Follow action failed:', error);
    }
  }
  
  private async getStoreValue<T>(store: Readable<T>): Promise<T> {
    return new Promise(resolve => {
      const unsubscribe = store.subscribe(value => {
        unsubscribe();
        resolve(value);
      });
    });
  }
}
```

### Following Feed

```typescript
class FollowingFeed {
  private followStore: FollowListStore;
  private followingProfiles = new Map<string, ProfileStore>();
  
  constructor(private nostr: NostrUnchained) {
    this.followStore = nostr.profile.follows.mine();
    this.initializeFeed();
  }
  
  private async initializeFeed() {
    this.followStore.subscribe(async state => {
      if (state.loading) return;
      
      console.log(`📋 Following ${state.follows.length} people`);
      
      // Load profiles for all followed users
      const profilePromises = state.follows.map(async follow => {
        if (!this.followingProfiles.has(follow.pubkey)) {
          const profileStore = this.nostr.profile.get(follow.pubkey);
          this.followingProfiles.set(follow.pubkey, profileStore);
          
          // Subscribe to profile updates
          profileStore.subscribe(profileState => {
            this.updateFeedItem(follow.pubkey, profileState);
          });
        }
      });
      
      await Promise.all(profilePromises);
    });
  }
  
  private updateFeedItem(pubkey: string, profileState: ProfileState) {
    const feedElement = document.getElementById(`feed-item-${pubkey}`);
    if (!feedElement) return;
    
    if (profileState.loading) {
      feedElement.innerHTML = '<div class="loading">Loading...</div>';
    } else if (profileState.profile) {
      feedElement.innerHTML = this.renderFeedItem(pubkey, profileState.profile);
    }
  }
  
  private renderFeedItem(pubkey: string, profile: UserProfile): string {
    return `
      <div class="feed-item" data-npub="${hexToNpub(pubkey)}">
        <img src="${profile.metadata.picture || '/default-avatar.png'}" 
             class="feed-avatar" />
        <div class="feed-content">
          <div class="feed-header">
            <span class="feed-name">${profile.metadata.name || 'Anonymous'}</span>
            <span class="feed-nip05">${profile.metadata.nip05 || ''}</span>
          </div>
          <div class="feed-about">${profile.metadata.about || ''}</div>
        </div>
      </div>
    `;
  }
}
```

## Profile Directory

### Search and Discovery Interface

```typescript
class ProfileDirectory {
  private searchResults: ProfileDiscoveryResult[] = [];
  
  constructor(private nostr: NostrUnchained) {}
  
  async searchProfiles(query: string, filters: SearchFilters = {}) {
    console.log(`🔍 Searching profiles for: "${query}"`);
    
    try {
      const discovery = this.nostr.profile.discover();
      
      // Apply search criteria
      if (query) {
        discovery.byName(query);
      }
      
      if (filters.verified) {
        discovery.verified();
      }
      
      if (filters.hasWebsite) {
        discovery.withMetadata('website');
      }
      
      if (filters.hasLightning) {
        discovery.withMetadata('lud16');
      }
      
      discovery.limit(filters.limit || 20);
      
      this.searchResults = await discovery.execute();
      
      console.log(`📊 Found ${this.searchResults.length} profiles`);
      this.renderResults();
      
    } catch (error) {
      console.error('❌ Search failed:', error);
      this.renderError(error.message);
    }
  }
  
  private renderResults() {
    const container = document.getElementById('search-results');
    if (!container) return;
    
    if (this.searchResults.length === 0) {
      container.innerHTML = '<div class="no-results">No profiles found</div>';
      return;
    }
    
    container.innerHTML = this.searchResults
      .map(result => this.renderSearchResult(result))
      .join('');
  }
  
  private renderSearchResult(result: ProfileDiscoveryResult): string {
    const profile = result.profile;
    const relevance = Math.round(result.relevanceScore * 100);
    
    return `
      <div class="search-result" data-relevance="${relevance}">
        <div class="result-avatar">
          <img src="${profile.metadata.picture || '/default-avatar.png'}" 
               alt="${profile.metadata.name || 'User'}" />
        </div>
        
        <div class="result-info">
          <div class="result-header">
            <h4>${profile.metadata.name || 'Anonymous'}</h4>
            <span class="relevance-score">${relevance}% match</span>
          </div>
          
          <div class="result-details">
            ${profile.metadata.nip05 ? 
              `<div class="nip05">📧 ${profile.metadata.nip05}</div>` : ''}
            ${profile.metadata.about ? 
              `<div class="about">${this.truncate(profile.metadata.about, 100)}</div>` : ''}
            ${profile.metadata.website ? 
              `<div class="website">🌐 <a href="${profile.metadata.website}" target="_blank">Website</a></div>` : ''}
            ${profile.metadata.lud16 ? 
              `<div class="lightning">⚡ ${profile.metadata.lud16}</div>` : ''}
          </div>
          
          <div class="result-matched">
            <small>Matched: ${result.matchedFields.join(', ')}</small>
          </div>
        </div>
        
        <div class="result-actions">
          <button onclick="this.viewProfile('${profile.pubkey}')" class="view-btn">
            View
          </button>
          <button onclick="this.followUser('${profile.pubkey}')" class="follow-btn">
            Follow
          </button>
        </div>
      </div>
    `;
  }
  
  private truncate(text: string, maxLength: number): string {
    return text.length > maxLength ? text.substring(0, maxLength) + '...' : text;
  }
  
  async viewProfile(pubkey: string) {
    // Navigate to profile page or open modal
    console.log('👤 Viewing profile:', hexToNpub(pubkey));
  }
  
  async followUser(pubkey: string) {
    try {
      await this.nostr.profile.follows.add(pubkey).publish();
      console.log('✅ Followed user:', pubkey);
    } catch (error) {
      console.error('❌ Follow failed:', error);
    }
  }
}

interface SearchFilters {
  verified?: boolean;
  hasWebsite?: boolean;
  hasLightning?: boolean;
  limit?: number;
}
```

## Follow Management

### Advanced Follow Management Interface

```typescript
class FollowManager {
  private followStore: FollowListStore;
  private followProfiles = new Map<string, ProfileStore>();
  
  constructor(private nostr: NostrUnchained) {
    this.followStore = nostr.profile.follows.mine();
    this.initializeManager();
  }
  
  private async initializeManager() {
    this.followStore.subscribe(async state => {
      if (state.loading) return;
      
      console.log(`📋 Managing ${state.follows.length} follows`);
      
      // Batch load all profile data
      const pubkeys = state.follows.map(f => f.pubkey);
      const batchResult = await this.nostr.profile.batch()
        .get(pubkeys)
        .execute();
      
      this.renderFollowList(state.follows, batchResult.profiles);
    });
  }
  
  private renderFollowList(follows: Follow[], profiles: Map<string, UserProfile>) {
    const container = document.getElementById('follow-list');
    if (!container) return;
    
    // Sort follows by profile name
    const sortedFollows = follows.sort((a, b) => {
      const nameA = profiles.get(a.pubkey)?.metadata?.name || '';
      const nameB = profiles.get(b.pubkey)?.metadata?.name || '';
      return nameA.localeCompare(nameB);
    });
    
    container.innerHTML = sortedFollows
      .map(follow => this.renderFollowItem(follow, profiles.get(follow.pubkey)))
      .join('');
  }
  
  private renderFollowItem(follow: Follow, profile?: UserProfile): string {
    return `
      <div class="follow-item" data-npub="${hexToNpub(follow.pubkey)}">
        <div class="follow-profile">
          <img src="${profile?.metadata?.picture || '/default-avatar.png'}" 
               class="follow-avatar" />
          <div class="follow-info">
            <div class="follow-name">
              ${profile?.metadata?.name || 'Anonymous'}
              ${follow.petname ? `<span class="petname">(${follow.petname})</span>` : ''}
            </div>
            <div class="follow-nip05">${profile?.metadata?.nip05 || ''}</div>
            <div class="follow-about">
              ${this.truncate(profile?.metadata?.about || '', 80)}
            </div>
          </div>
        </div>
        
        <div class="follow-meta">
          ${follow.relayUrl ? 
            `<div class="follow-relay">📡 ${this.getRelayName(follow.relayUrl)}</div>` : ''}
        </div>
        
        <div class="follow-actions">
          <button onclick="this.editFollow('${follow.pubkey}')" class="edit-btn">
            Edit
          </button>
          <button onclick="this.unfollowUser('${follow.pubkey}')" class="unfollow-btn">
            Unfollow
          </button>
        </div>
      </div>
    `;
  }
  
  async editFollow(pubkey: string) {
    const currentFollow = await this.getCurrentFollow(pubkey);
    if (!currentFollow) return;
    
    // Show edit dialog
    const newPetname = prompt('Enter petname:', currentFollow.petname || '');
    const newRelay = prompt('Enter relay URL:', currentFollow.relayUrl || '');
    
    if (newPetname !== null || newRelay !== null) {
      try {
        // Remove current follow
        await this.nostr.profile.follows.remove(pubkey);
        
        // Add with new details
        const followBuilder = this.nostr.profile.follows.add(pubkey);
        
        if (newPetname && newPetname.trim()) {
          followBuilder.petname(newPetname.trim());
        }
        
        if (newRelay && newRelay.trim()) {
          followBuilder.relay(newRelay.trim());
        }
        
        await followBuilder.publish();
        
        console.log('✅ Updated follow:', pubkey);
      } catch (error) {
        console.error('❌ Failed to update follow:', error);
      }
    }
  }
  
  async unfollowUser(pubkey: string) {
    if (confirm('Are you sure you want to unfollow this user?')) {
      try {
        await this.nostr.profile.follows.remove(pubkey);
        console.log('✅ Unfollowed user:', pubkey);
      } catch (error) {
        console.error('❌ Unfollow failed:', error);
      }
    }
  }
  
  async bulkFollow(pubkeys: string[]) {
    try {
      await this.nostr.profile.follows.batch()
        .add(pubkeys)
        .publish();
      
      console.log(`✅ Bulk followed ${pubkeys.length} users`);
    } catch (error) {
      console.error('❌ Bulk follow failed:', error);
    }
  }
  
  async bulkUnfollow(pubkeys: string[]) {
    if (confirm(`Unfollow ${pubkeys.length} users?`)) {
      try {
        await this.nostr.profile.follows.batch()
          .remove(pubkeys)
          .publish();
        
        console.log(`✅ Bulk unfollowed ${pubkeys.length} users`);
      } catch (error) {
        console.error('❌ Bulk unfollow failed:', error);
      }
    }
  }
  
  private async getCurrentFollow(pubkey: string): Promise<Follow | null> {
    return new Promise(resolve => {
      const unsubscribe = this.followStore.subscribe(state => {
        const follow = state.follows.find(f => f.pubkey === pubkey);
        unsubscribe();
        resolve(follow || null);
      });
    });
  }
  
  private truncate(text: string, maxLength: number): string {
    return text.length > maxLength ? text.substring(0, maxLength) + '...' : text;
  }
  
  private getRelayName(url: string): string {
    try {
      return new URL(url).hostname;
    } catch {
      return url;
    }
  }
}
```

## Performance Optimization

### Efficient Profile Loading with Caching

```typescript
class ProfileManager {
  private profileCache = new Map<string, UserProfile>();
  private loadingProfiles = new Set<string>();
  
  constructor(private nostr: NostrUnchained) {}
  
  async loadProfile(pubkey: string): Promise<UserProfile | null> {
    // Return cached profile immediately
    if (this.profileCache.has(pubkey)) {
      console.log('📦 Cache hit for:', pubkey.substring(0, 16) + '...');
      return this.profileCache.get(pubkey)!;
    }
    
    // Avoid duplicate requests
    if (this.loadingProfiles.has(pubkey)) {
      console.log('⏳ Already loading:', pubkey.substring(0, 16) + '...');
      return this.waitForProfile(pubkey);
    }
    
    this.loadingProfiles.add(pubkey);
    
    try {
      console.log('📡 Fetching from relay:', pubkey.substring(0, 16) + '...');
      
      const profileStore = this.nostr.profile.get(pubkey);
      const profile = await this.getProfileFromStore(profileStore);
      
      if (profile) {
        this.profileCache.set(pubkey, profile);
        console.log('✅ Cached profile:', profile.metadata.name || 'Anonymous');
      }
      
      return profile;
      
    } finally {
      this.loadingProfiles.delete(pubkey);
    }
  }
  
  async loadMultipleProfiles(pubkeys: string[]): Promise<Map<string, UserProfile>> {
    console.log(`📦 Loading ${pubkeys.length} profiles...`);
    
    // Separate cached and uncached pubkeys
    const cached = new Map<string, UserProfile>();
    const uncached: string[] = [];
    
    pubkeys.forEach(pubkey => {
      if (this.profileCache.has(pubkey)) {
        cached.set(pubkey, this.profileCache.get(pubkey)!);
      } else {
        uncached.push(pubkey);
      }
    });
    
    console.log(`📦 Cache hits: ${cached.size}, Cache misses: ${uncached.length}`);
    
    if (uncached.length === 0) {
      return cached;
    }
    
    // Batch load uncached profiles
    const batchResult = await this.nostr.profile.batch()
      .get(uncached)
      .execute();
    
    // Update cache
    batchResult.profiles.forEach((profile, pubkey) => {
      this.profileCache.set(pubkey, profile);
      cached.set(pubkey, profile);
    });
    
    console.log(`✅ Loaded ${batchResult.profiles.size} new profiles`);
    return cached;
  }
  
  private async waitForProfile(pubkey: string): Promise<UserProfile | null> {
    // Wait for ongoing request to complete
    while (this.loadingProfiles.has(pubkey)) {
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    
    return this.profileCache.get(pubkey) || null;
  }
  
  private async getProfileFromStore(store: ProfileStore): Promise<UserProfile | null> {
    return new Promise(resolve => {
      const timeout = setTimeout(() => {
        unsubscribe();
        resolve(null);
      }, 5000);
      
      const unsubscribe = store.subscribe(state => {
        if (!state.loading) {
          clearTimeout(timeout);
          unsubscribe();
          resolve(state.profile);
        }
      });
    });
  }
  
  // Cache management
  clearCache() {
    this.profileCache.clear();
    console.log('🗑️ Profile cache cleared');
  }
  
  getCacheStats() {
    return {
      cachedProfiles: this.profileCache.size,
      loadingProfiles: this.loadingProfiles.size
    };
  }
}
```

### Performance Monitoring

```typescript
class ProfilePerformanceMonitor {
  private queryTimes: number[] = [];
  private cacheHits = 0;
  private cacheMisses = 0;
  
  constructor(private nostr: NostrUnchained) {
    this.startMonitoring();
  }
  
  private startMonitoring() {
    // Monitor cache performance
    setInterval(() => {
      const stats = this.nostr.getCacheStatistics();
      
      console.log('📊 Profile Performance Stats:');
      console.log('  Cache hit rate:', stats.hitRate.toFixed(1) + '%');
      console.log('  Avg query time:', stats.avgQueryTime.toFixed(1) + 'ms');
      console.log('  Total cached events:', stats.totalEvents);
      console.log('  Memory usage:', stats.memoryUsageMB.toFixed(1) + 'MB');
      
      if (stats.hitRate < 70) {
        console.warn('⚠️ Low cache hit rate - consider optimizing queries');
      }
      
      if (stats.avgQueryTime > 100) {
        console.warn('⚠️ Slow queries - consider using batch operations');
      }
      
    }, 30000); // Every 30 seconds
  }
  
  async measureProfileLoad(pubkey: string): Promise<number> {
    const startTime = performance.now();
    
    const profile = this.nostr.profile.get(pubkey);
    
    await new Promise<void>(resolve => {
      const unsubscribe = profile.subscribe(state => {
        if (!state.loading) {
          unsubscribe();
          resolve();
        }
      });
    });
    
    const loadTime = performance.now() - startTime;
    this.queryTimes.push(loadTime);
    
    // Keep only last 100 measurements
    if (this.queryTimes.length > 100) {
      this.queryTimes.shift();
    }
    
    return loadTime;
  }
  
  getPerformanceReport() {
    const avgTime = this.queryTimes.reduce((a, b) => a + b, 0) / this.queryTimes.length;
    const maxTime = Math.max(...this.queryTimes);
    const minTime = Math.min(...this.queryTimes);
    
    return {
      averageLoadTime: avgTime,
      maxLoadTime: maxTime,
      minLoadTime: minTime,
      totalQueries: this.queryTimes.length,
      cacheHitRate: (this.cacheHits / (this.cacheHits + this.cacheMisses)) * 100
    };
  }
}
```

## Error Handling

### Comprehensive Error Handling

```typescript
class RobustProfileManager {
  private retryAttempts = 3;
  private retryDelay = 1000;
  
  constructor(private nostr: NostrUnchained) {}
  
  async loadProfileWithRetry(pubkey: string): Promise<UserProfile | null> {
    for (let attempt = 1; attempt <= this.retryAttempts; attempt++) {
      try {
        console.log(`🔄 Attempt ${attempt}/${this.retryAttempts} for:`, pubkey.substring(0, 16) + '...');
        
        const profile = await this.loadProfileSafely(pubkey);
        
        if (profile) {
          console.log('✅ Profile loaded successfully');
          return profile;
        }
        
      } catch (error) {
        console.error(`❌ Attempt ${attempt} failed:`, error.message);
        
        if (attempt < this.retryAttempts) {
          const delay = this.retryDelay * attempt;
          console.log(`⏳ Retrying in ${delay}ms...`);
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
    }
    
    console.error('💥 All retry attempts failed');
    return null;
  }
  
  private async loadProfileSafely(pubkey: string): Promise<UserProfile | null> {
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        unsubscribe();
        reject(new Error('Profile load timeout'));
      }, 10000);
      
      const profileStore = this.nostr.profile.get(pubkey);
      
      const unsubscribe = profileStore.subscribe(state => {
        if (state.error) {
          clearTimeout(timeout);
          unsubscribe();
          reject(state.error);
          return;
        }
        
        if (!state.loading) {
          clearTimeout(timeout);
          unsubscribe();
          resolve(state.profile);
        }
      });
    });
  }
  
  async updateProfileSafely(updates: Partial<ProfileMetadata>): Promise<boolean> {
    try {
      // Validate updates
      this.validateProfileUpdates(updates);
      
      // Get current profile for preservation
      const currentProfile = await this.getCurrentProfile();
      
      // Build update with preservation
      const builder = this.nostr.profile.edit();
      
      if (updates.name !== undefined) builder.name(updates.name);
      if (updates.about !== undefined) builder.about(updates.about);
      if (updates.picture !== undefined) builder.picture(updates.picture);
      if (updates.banner !== undefined) builder.banner(updates.banner);
      if (updates.nip05 !== undefined) builder.nip05(updates.nip05);
      if (updates.website !== undefined) builder.website(updates.website);
      if (updates.lud16 !== undefined) builder.lud16(updates.lud16);
      
      // Preserve existing fields
      builder.preserveExisting(true);
      
      const result = await builder.publish();
      
      if (result.success) {
        console.log('✅ Profile updated successfully');
        return true;
      } else {
        console.error('❌ Profile update failed:', result.error);
        return false;
      }
      
    } catch (error) {
      console.error('💥 Profile update error:', error);
      return false;
    }
  }
  
  private validateProfileUpdates(updates: Partial<ProfileMetadata>) {
    if (updates.name !== undefined && typeof updates.name !== 'string') {
      throw new Error('Name must be a string');
    }
    
    if (updates.about !== undefined && typeof updates.about !== 'string') {
      throw new Error('About must be a string');
    }
    
    if (updates.picture !== undefined && !this.isValidUrl(updates.picture)) {
      throw new Error('Picture must be a valid URL');
    }
    
    if (updates.website !== undefined && !this.isValidUrl(updates.website)) {
      throw new Error('Website must be a valid URL');
    }
    
    if (updates.nip05 !== undefined && !this.isValidNip05(updates.nip05)) {
      throw new Error('NIP-05 identifier is invalid');
    }
    
    if (updates.lud16 !== undefined && !this.isValidLightningAddress(updates.lud16)) {
      throw new Error('Lightning address is invalid');
    }
  }
  
  private async getCurrentProfile(): Promise<UserProfile | null> {
    const pubkey = await this.nostr.signingProvider?.getPublicKey();
    if (!pubkey) return null;
    
    return this.loadProfileSafely(pubkey);
  }
  
  private isValidUrl(url: string): boolean {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  }
  
  private isValidNip05(nip05: string): boolean {
    // Basic NIP-05 validation
    return /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(nip05);
  }
  
  private isValidLightningAddress(lud16: string): boolean {
    // Lightning address is similar to email format
    return /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(lud16);
  }
}
```

These examples demonstrate real-world usage patterns for the Profile Management API, showing how to build robust, performant applications with proper error handling and caching strategies.