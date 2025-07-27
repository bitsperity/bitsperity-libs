# Nostr Unchained App - API Interface Definitions

## Core App API Architecture

### Authentication Service API

```typescript
// auth/AuthService.ts
export interface AuthService {
  // Core authentication methods
  login(method: 'extension' | 'temporary' | 'nsec'): Promise<AuthResult>;
  logout(): Promise<void>;
  isAuthenticated(): boolean;
  getCurrentUser(): Promise<UserProfile | null>;
  
  // Key management
  exportKeys(): Promise<KeyExport>;
  importKeys(keys: KeyImport): Promise<void>;
  
  // Extension integration
  hasExtension(): Promise<boolean>;
  connectExtension(): Promise<ExtensionConnection>;
}

export interface AuthResult {
  success: boolean;
  user?: UserProfile;
  publicKey?: string;
  error?: AuthError;
}

export interface KeyExport {
  publicKey: string;
  privateKey?: string; // Only for temporary keys
  method: 'extension' | 'temporary';
}
```

### Social Feed Service API

```typescript
// feed/FeedService.ts
export interface FeedService {
  // Timeline management
  getTimeline(options: TimelineOptions): Promise<FeedStore<Post>>;
  refreshTimeline(): Promise<void>;
  loadMore(): Promise<Post[]>;
  
  // Post interactions
  createPost(content: PostContent): Promise<PostResult>;
  deletePost(postId: string): Promise<void>;
  reactToPost(postId: string, reaction: ReactionType): Promise<void>;
  
  // Thread operations
  getThread(postId: string): Promise<Thread>;
  replyToPost(postId: string, content: string): Promise<PostResult>;
  
  // Content filtering
  setContentFilter(filter: ContentFilter): void;
  blockUser(pubkey: string): Promise<void>;
  muteKeyword(keyword: string): Promise<void>;
}

export interface TimelineOptions {
  limit?: number;
  since?: number;
  until?: number;
  authors?: string[];
  includeReplies?: boolean;
}

export interface Post {
  id: string;
  content: string;
  author: UserProfile;
  createdAt: number;
  reactions: ReactionSummary;
  replyCount: number;
  thread?: Thread;
  media?: MediaAttachment[];
}

export interface PostContent {
  text: string;
  media?: File[];
  tags?: string[];
  mentions?: string[];
}
```

### Direct Message Service API

```typescript
// dm/DMService.ts
export interface DMService {
  // Conversation management
  getConversations(): Promise<FeedStore<Conversation>>;
  getConversation(pubkey: string): Promise<ConversationStore>;
  createConversation(pubkey: string): Promise<Conversation>;
  
  // Message operations
  sendMessage(to: string, content: MessageContent): Promise<MessageResult>;
  markAsRead(conversationId: string): Promise<void>;
  deleteMessage(messageId: string): Promise<void>;
  
  // Group messaging
  createGroup(participants: string[], name: string): Promise<GroupConversation>;
  addToGroup(groupId: string, pubkey: string): Promise<void>;
  leaveGroup(groupId: string): Promise<void>;
}

export interface Conversation {
  id: string;
  participants: UserProfile[];
  lastMessage?: Message;
  unreadCount: number;
  lastActivity: number;
  isGroup: boolean;
}

export interface Message {
  id: string;
  content: string;
  sender: UserProfile;
  timestamp: number;
  encrypted: boolean;
  media?: MediaAttachment[];
}

export interface MessageContent {
  text: string;
  media?: File[];
  replyTo?: string;
}
```

### Profile Service API

```typescript
// profile/ProfileService.ts
export interface ProfileService {
  // Profile management
  getProfile(pubkey: string): Promise<UserProfile>;
  updateProfile(updates: ProfileUpdate): Promise<UserProfile>;
  followUser(pubkey: string): Promise<void>;
  unfollowUser(pubkey: string): Promise<void>;
  
  // Contact management
  getFollowing(pubkey?: string): Promise<UserProfile[]>;
  getFollowers(pubkey?: string): Promise<UserProfile[]>;
  getContactList(): Promise<ContactList>;
  
  // Profile discovery
  searchProfiles(query: string): Promise<UserProfile[]>;
  getSuggestedFollows(): Promise<UserProfile[]>;
  
  // Profile verification
  verifyProfile(pubkey: string): Promise<VerificationResult>;
}

export interface UserProfile {
  pubkey: string;
  name?: string;
  about?: string;
  picture?: string;
  banner?: string;
  nip05?: string;
  lud16?: string;
  website?: string;
  displayName?: string;
  verified?: boolean;
  followsYou?: boolean;
  isFollowing?: boolean;
}

export interface ProfileUpdate {
  name?: string;
  about?: string;
  picture?: string;
  banner?: string;
  website?: string;
  nip05?: string;
  lud16?: string;
}
```

### Discovery Service API

```typescript
// discover/DiscoveryService.ts
export interface DiscoveryService {
  // Trending content
  getTrendingHashtags(): Promise<Hashtag[]>;
  getTrendingPosts(): Promise<Post[]>;
  getPopularProfiles(): Promise<UserProfile[]>;
  
  // Search functionality
  searchContent(query: string, filters: SearchFilters): Promise<SearchResults>;
  searchHashtag(tag: string): Promise<Post[]>;
  
  // Recommendation engine
  getRecommendedPosts(): Promise<Post[]>;
  getRecommendedUsers(): Promise<UserProfile[]>;
  getRecommendedHashtags(): Promise<Hashtag[]>;
  
  // Content exploration
  exploreCategory(category: ContentCategory): Promise<Post[]>;
  getRelatedContent(postId: string): Promise<Post[]>;
}

export interface SearchFilters {
  type?: 'posts' | 'profiles' | 'hashtags';
  timeRange?: 'hour' | 'day' | 'week' | 'month';
  sortBy?: 'relevance' | 'recent' | 'popular';
}

export interface SearchResults {
  posts: Post[];
  profiles: UserProfile[];
  hashtags: Hashtag[];
  total: number;
}

export interface Hashtag {
  name: string;
  count: number;
  trending: boolean;
  posts?: Post[];
}
```

### Content Creation Service API

```typescript
// create/ContentService.ts
export interface ContentService {
  // Post creation
  createTextPost(content: string, options?: PostOptions): Promise<PostResult>;
  createMediaPost(files: File[], caption?: string): Promise<PostResult>;
  createRepost(postId: string, comment?: string): Promise<PostResult>;
  
  // Draft management
  saveDraft(content: DraftContent): Promise<string>;
  getDrafts(): Promise<Draft[]>;
  deleteDraft(id: string): Promise<void>;
  
  // Media handling
  uploadMedia(file: File): Promise<MediaUploadResult>;
  validateMedia(file: File): MediaValidationResult;
  
  // Content validation
  validatePost(content: PostContent): ValidationResult;
  checkForSpam(content: string): Promise<SpamCheckResult>;
}

export interface PostOptions {
  tags?: string[];
  mentions?: string[];
  sensitive?: boolean;
  replyTo?: string;
  scheduledAt?: number;
}

export interface Draft {
  id: string;
  content: DraftContent;
  createdAt: number;
  updatedAt: number;
}

export interface DraftContent {
  text: string;
  media?: string[];
  tags?: string[];
  mentions?: string[];
}

export interface MediaUploadResult {
  url: string;
  hash: string;
  mimeType: string;
  size: number;
}
```

## Store Integration APIs

### Reactive State Management

```typescript
// stores/AppStore.ts
export interface AppStore {
  // Authentication state
  auth: Writable<AuthState>;
  
  // Feed state
  timeline: FeedStore<Post>;
  mentions: FeedStore<Post>;
  
  // DM state
  conversations: FeedStore<Conversation>;
  activeConversation: Writable<ConversationStore | null>;
  
  // Profile state
  currentUser: Writable<UserProfile | null>;
  profileCache: Writable<Map<string, UserProfile>>;
  
  // UI state
  theme: Writable<'light' | 'dark' | 'system'>;
  navigation: Writable<NavigationState>;
  notifications: Writable<Notification[]>;
}

// Integration with nostr-unchained stores
export function createAppStore(nostr: NostrUnchained): AppStore {
  return {
    auth: writable(initialAuthState),
    timeline: createFeed('timeline', timelineQuery),
    mentions: createFeed('mentions', mentionsQuery),
    conversations: createFeed('conversations', conversationsQuery),
    // ... other stores
  };
}
```

### Real-time Update Handlers

```typescript
// stores/RealtimeHandlers.ts
export interface RealtimeHandlers {
  onNewPost: (post: Post) => void;
  onNewMessage: (message: Message) => void;
  onProfileUpdate: (profile: UserProfile) => void;
  onReaction: (reaction: Reaction) => void;
  onFollowUpdate: (follow: FollowEvent) => void;
}

export function setupRealtimeHandlers(nostr: NostrUnchained): RealtimeHandlers {
  return {
    onNewPost: (post) => timeline.update(posts => [post, ...posts]),
    onNewMessage: (message) => conversations.updateConversation(message),
    // ... other handlers
  };
}
```

## Component API Contracts

### Base Component Interfaces

```typescript
// components/types.ts
export interface ComponentProps {
  class?: string;
  style?: string;
  [key: string]: unknown;
}

export interface PostCardProps extends ComponentProps {
  post: Post;
  showThread?: boolean;
  showActions?: boolean;
  onReact?: (reaction: ReactionType) => void;
  onReply?: () => void;
  onRepost?: () => void;
}

export interface ConversationItemProps extends ComponentProps {
  conversation: Conversation;
  isActive?: boolean;
  onClick?: () => void;
}

export interface ProfileCardProps extends ComponentProps {
  profile: UserProfile;
  showFollowButton?: boolean;
  onFollow?: () => void;
  onUnfollow?: () => void;
}
```

### Event Handling Interfaces

```typescript
// events/AppEvents.ts
export interface AppEvents {
  // Navigation events
  'navigate': { route: string; params?: Record<string, string> };
  
  // Social events
  'post:created': { post: Post };
  'post:deleted': { postId: string };
  'reaction:added': { postId: string; reaction: ReactionType };
  
  // Message events
  'message:sent': { message: Message };
  'message:received': { message: Message };
  'conversation:opened': { conversationId: string };
  
  // Profile events
  'profile:updated': { profile: UserProfile };
  'follow:added': { pubkey: string };
  'follow:removed': { pubkey: string };
  
  // Auth events
  'auth:login': { user: UserProfile };
  'auth:logout': {};
  
  // Error events
  'error:network': { error: Error };
  'error:validation': { field: string; message: string };
}
```

## API Integration Patterns

### Error Handling Strategy

```typescript
// api/ErrorHandler.ts
export interface AppErrorHandler {
  handleNetworkError(error: Error): UserFriendlyError;
  handleValidationError(errors: ValidationError[]): UserFriendlyError;
  handleAuthError(error: AuthError): UserFriendlyError;
  handleNostrError(error: NostrError): UserFriendlyError;
}

export interface UserFriendlyError {
  title: string;
  message: string;
  action?: {
    label: string;
    handler: () => void;
  };
  retryable?: boolean;
}
```

### Performance Monitoring

```typescript
// api/PerformanceMonitor.ts
export interface PerformanceMonitor {
  trackPageLoad(route: string): void;
  trackApiCall(endpoint: string, duration: number): void;
  trackUserInteraction(action: string): void;
  reportWebVitals(): void;
}
```

### Offline Support

```typescript
// api/OfflineManager.ts
export interface OfflineManager {
  isOnline(): boolean;
  queueOperation(operation: OfflineOperation): void;
  syncPendingOperations(): Promise<void>;
  getCachedData(key: string): unknown | null;
  setCachedData(key: string, data: unknown): void;
}

export interface OfflineOperation {
  type: 'post' | 'message' | 'reaction' | 'follow';
  data: unknown;
  timestamp: number;
  retry: number;
}
```

This API structure ensures:
1. **Type Safety**: Every interface is fully typed
2. **Separation of Concerns**: Clear boundaries between services
3. **Extensibility**: Easy to add new features without breaking existing code
4. **Performance**: Reactive stores for real-time updates
5. **DX Excellence**: Intuitive, predictable API design