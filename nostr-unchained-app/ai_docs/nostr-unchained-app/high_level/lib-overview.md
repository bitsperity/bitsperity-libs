# Nostr Unchained App - High-Level Overview

## Vision Statement

**Mission**: Create the most elegant, performant, and developer-friendly mobile-first Nostr client app that showcases the full power of the nostr-unchained library while providing an exceptional user experience for decentralized social media.

## Core Philosophy

### Design Principles
1. **Mobile-First Excellence**: Every component designed for touch, optimized for mobile performance
2. **SQL-like Elegance**: Inherited from nostr-unchained's design philosophy - everything should be intuitive and expressive
3. **Zero Monolith Policy**: No single file should exceed 200 lines; perfect separation of concerns
4. **SOLID Architecture**: Every component follows Single Responsibility, Open/Closed, Liskov Substitution, Interface Segregation, and Dependency Inversion principles
5. **Developer Experience (DX) First**: Code should be a joy to read, write, and maintain

### Technical Excellence
- **State-of-the-Art Stack**: SvelteKit 2.0 + TypeScript 5.3 + Vite 5.0
- **100% Type Safety**: Every API call, state transition, and user interaction is typed
- **Performance-First**: Sub-second load times, smooth 60fps animations
- **Offline-First**: Progressive Web App with comprehensive offline capabilities
- **Test-Driven Development**: 100% test coverage with Vitest 3.2+

## Core App Modules

### 1. Authentication & Identity (`auth/`)
- **Scope**: Nostr key management, browser extension integration, temporary key generation
- **DX Focus**: One-line authentication setup with smart defaults
- **Components**: 
  - `AuthProvider.svelte` - Context provider for app-wide auth state
  - `LoginView.svelte` - Beautiful onboarding experience
  - `KeyManager.ts` - Secure key storage and management

### 2. Social Feed (`feed/`)
- **Scope**: Real-time social media timeline with threading, reactions, and rich content
- **DX Focus**: Instagram-like UX with Nostr's decentralized benefits
- **Components**:
  - `FeedView.svelte` - Main timeline interface
  - `PostCard.svelte` - Individual post component
  - `ThreadView.svelte` - Expanded thread discussions
  - `ReactionButton.svelte` - Like/dislike/custom reactions

### 3. Direct Messages (`dm/`)
- **Scope**: NIP-17 private messaging with NIP-44 encryption and NIP-59 gift wrapping
- **DX Focus**: WhatsApp-level UX with Signal-level privacy
- **Components**:
  - `ConversationList.svelte` - Chat list overview
  - `ConversationView.svelte` - Individual chat interface
  - `MessageBubble.svelte` - Message rendering component
  - `DMEncryption.ts` - Seamless encryption handling

### 4. Profile Management (`profile/`)
- **Scope**: User profiles, following/followers, profile editing
- **DX Focus**: LinkedIn-style professional profiles for Nostr
- **Components**:
  - `ProfileView.svelte` - User profile display
  - `ProfileEditor.svelte` - Profile modification interface
  - `ContactList.svelte` - Following/followers management
  - `ProfileCard.svelte` - Compact profile representation

### 5. Content Creation (`create/`)
- **Scope**: Post creation, media uploads, draft management
- **DX Focus**: Twitter/Instagram-style content creation flow
- **Components**:
  - `CreatePostModal.svelte` - Main creation interface
  - `MediaUpload.svelte` - Image/video upload handling
  - `DraftManager.ts` - Local draft persistence
  - `ContentValidator.ts` - Content validation and formatting

### 6. Discovery (`discover/`)
- **Scope**: Hashtag exploration, trending content, user discovery
- **DX Focus**: TikTok-style discovery with Nostr's open algorithms
- **Components**:
  - `DiscoverView.svelte` - Main discovery interface
  - `TrendingTopics.svelte` - Hashtag trending display
  - `UserSuggestions.svelte` - Follow recommendations
  - `SearchInterface.svelte` - Global search functionality

## Architectural Decisions

### State Management Strategy
```typescript
// Centralized store architecture using nostr-unchained's reactive stores
export const appState = {
  auth: writable<AuthState>(initialAuthState),
  feed: createFeed('timeline', timelineQuery),
  conversations: createFeed('dm', dmQuery),
  profile: writable<ProfileState>(initialProfileState)
};
```

### Component Architecture
```
src/
├── lib/
│   ├── components/          # Reusable UI components
│   │   ├── ui/             # Base UI primitives
│   │   ├── nostr/          # Nostr-specific components
│   │   └── layouts/        # Layout components
│   ├── stores/             # Global state management
│   ├── services/           # Business logic services
│   ├── utils/              # Pure utility functions
│   └── types/              # TypeScript type definitions
├── routes/                 # SvelteKit pages and API routes
│   ├── auth/              # Authentication routes
│   ├── feed/              # Social feed routes
│   ├── dm/                # Direct message routes
│   ├── profile/           # Profile routes
│   ├── create/            # Content creation routes
│   └── discover/          # Discovery routes
└── app.html               # Root HTML template
```

### Performance Optimization Strategy
1. **Virtual Scrolling**: For infinite feeds using `@tanstack/svelte-virtual`
2. **Image Optimization**: WebP/AVIF with progressive loading
3. **Code Splitting**: Route-based and component-based lazy loading
4. **Service Worker**: Intelligent caching and offline-first architecture
5. **Bundle Analysis**: Automated bundle size monitoring

## Integration with nostr-unchained

### Core Library Usage
```typescript
// Main app initialization
import { NostrUnchained, createFeed, DM } from 'nostr-unchained';

const nostr = new NostrUnchained({
  relays: ['wss://relay.damus.io', 'wss://relay.nostr.band'],
  debug: true
});

// Social feed integration
const timelineFeed = createFeed('timeline', {
  kinds: [1], // Text notes
  limit: 50,
  authors: followingList
});

// Direct message integration
const dmConversations = await DM.getConversations();
```

### API Surface Mapping
| App Feature | nostr-unchained API | Component |
|-------------|-------------------|-----------|
| Social Feed | `nostr.social.timeline()` | `FeedView.svelte` |
| Direct Messages | `nostr.dm.conversation()` | `ConversationView.svelte` |
| Profile Management | `nostr.social.profile()` | `ProfileView.svelte` |
| Content Creation | `nostr.events.createTextNote()` | `CreatePostModal.svelte` |
| Real-time Updates | `createFeed()` stores | All views |

## User Experience Design

### Mobile-First Navigation
- **Bottom Tab Bar**: Feed, DM, Create, Discover, Profile
- **Gesture Support**: Swipe navigation, pull-to-refresh, pinch-to-zoom
- **Dark/Light Mode**: System preference with manual override
- **Accessibility**: WCAG 2.1 AA compliance, screen reader support

### Progressive Web App Features
- **Install Prompt**: Smart install banner for supported browsers
- **Offline Mode**: Full read access, queued write operations
- **Push Notifications**: Real-time DM and mention notifications
- **Background Sync**: Automatic sync when connection restored

### Performance Targets
- **First Contentful Paint**: < 1.5s
- **Largest Contentful Paint**: < 2.5s
- **Cumulative Layout Shift**: < 0.1
- **First Input Delay**: < 100ms
- **Lighthouse Score**: 95+ on all metrics

## Development Workflow

### Code Quality Standards
```json
{
  "fileNaming": "kebab-case",
  "componentNaming": "PascalCase",
  "maxFileLines": 200,
  "maxFunctionLines": 30,
  "testCoverage": "100%",
  "bundleSize": "< 200KB gzipped"
}
```

### Git Workflow
- **Feature Branches**: `feature/component-name`
- **Commit Convention**: Conventional Commits
- **PR Requirements**: 100% test coverage, bundle size check
- **Automated Deployment**: Vercel/Netlify with preview deployments

## Success Metrics

### Technical KPIs
- Bundle size under 200KB gzipped
- 100% test coverage maintained
- Sub-second load times on 3G
- Zero accessibility violations
- 95+ Lighthouse scores

### User Experience KPIs
- Time to first post < 30 seconds for new users
- Message delivery time < 2 seconds
- Feed refresh time < 1 second
- Offline functionality retention rate > 90%
- User onboarding completion rate > 80%

## Risk Mitigation

### Technical Risks
1. **nostr-unchained API Changes**: Version pinning + adapter pattern
2. **Mobile Performance**: Continuous profiling + optimization
3. **Offline Synchronization**: Robust conflict resolution
4. **Key Management Security**: Hardware security module integration

### UX Risks
1. **Nostr Complexity**: Simplified onboarding flow
2. **Discovery**: Smart content recommendation algorithms
3. **Network Effects**: Social graph import from other platforms
4. **Content Moderation**: User-controlled filtering systems