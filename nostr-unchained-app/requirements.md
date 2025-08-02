# Profile View Implementation Requirements

## High-Level Concept

Implementation einer umfassenden Profile View für die nostr-unchained-app, die das vollständige Profil-Management für Nostr-User ermöglicht. Die View unterscheidet zwischen dem eigenen Profil (editierbar) und fremden Profilen (read-only) und nutzt die volle Power des @nostr-unchained Profile API.

## 1. Überblick & Vision

### 1.1 Zielsetzung
- **Eigenes Profil**: Vollständiges Profil-Management mit Erstellung, Bearbeitung und NIP-05 Verifikation
- **Fremde Profile**: Ansprechende Darstellung mit Follow-Management und sozialen Funktionen
- **Reactive UI**: Echtzeitaktualisierungen über Profile API Stores
- **Performance**: Cache-first Loading mit <10ms Antwortzeiten für cached Profiles

### 1.2 Core User Stories
1. **Als User möchte ich mein Profil erstellen/bearbeiten können**
2. **Als User möchte ich fremde Profile übersichtlich betrachten können**
3. **Als User möchte ich andere User followen/unfollownen können**
4. **Als User möchte ich NIP-05 Verifikation sehen und einrichten können**
5. **Als User möchte ich Lightning-Adressen und Social Links sehen**

## 2. Technische Architektur

### 2.1 Integration mit Existing App Structure
- **Navigation**: Neue "Profile" Route zu `RouteId` Type hinzufügen
- **Main App**: Integration als neue View in `NostrApp.svelte`
- **Component Structure**: Folgt dem Zero-Monolith Principle (<200 Zeilen pro Component)

### 2.2 Component Hierarchy
```
ProfileView.svelte (Main Container)
├── ProfileHeader.svelte (Avatar, Name, NIP-05 Badge)
├── ProfileInfo.svelte (About, Links, Metadata)
├── ProfileActions.svelte (Follow/Edit Buttons)
├── ProfileEditor.svelte (Edit Mode für eigenes Profil)
└── ProfileStats.svelte (Following/Followers, optional)
```

### 2.3 NostrUnchained API Integration
```typescript
// Profile Store für reactive Updates
const profileStore = nostr.profile.get(pubkey);
const followStore = nostr.profile.follows.mine();
const isFollowingStore = followStore.isFollowing(pubkey);

// Profile Editing (nur für eigenes Profil)
await nostr.profile.edit()
  .name('Alice')
  .about('Nostr enthusiast')
  .picture('https://example.com/avatar.jpg')
  .nip05('alice@domain.com')
  .publish();

// Follow Management
await nostr.profile.follows.add(pubkey).publish();
await nostr.profile.follows.remove(pubkey);
```

## 3. Feature Spezifikationen

### 3.1 Eigenes Profil (Authenticated User)

#### 3.1.1 Profil Creation
- **Trigger**: Wenn noch kein Profil existiert
- **Modal/View**: Guided Setup mit Schritt-für-Schritt Erstellung
- **Required Fields**: Name (optional aber empfohlen)
- **Optional Fields**: About, Picture, Banner, Website, Lightning Address, NIP-05

#### 3.1.2 Profil Editing
- **In-Place Editing**: Click-to-edit Interface für alle Felder
- **Preservation**: `preserveExisting(true)` um andere Felder nicht zu überschreiben
- **Validation**: Client-seitige Validierung für URLs, Lightning Addresses, NIP-05
- **Optimistic Updates**: Sofortige UI Updates mit Relay Confirmation

#### 3.1.3 NIP-05 Management
- **Setup Flow**: Guided NIP-05 Einrichtung mit Validation
- **Status Display**: Verification Status mit Icon (✅/❌/⏳)
- **Re-verification**: Manual re-check Möglichkeit

### 3.2 Fremde Profile (Other Users)

#### 3.2.1 Profile Display
- **Read-Only**: Alle Informationen sichtbar aber nicht editierbar
- **Responsive Layout**: Mobile-first Design
- **Rich Content**: Links, Lightning Addresses, NIP-05 clickable/copyable

#### 3.2.2 Social Interactions
- **Follow Button**: Toggle Follow/Unfollow mit optimistic updates
- **Follow Status**: Clear indication ob User gefolgt wird
- **Relay Hints**: Zeige suggested relay für User (falls verfügbar)

### 3.3 Universal Features (Both Views)

#### 3.3.1 Avatar & Banner
- **Image Display**: Fallback zu default avatars
- **Lazy Loading**: Progressive image loading
- **Error Handling**: Graceful fallbacks bei broken images

#### 3.3.2 Metadata Display
- **Lightning Integration**: Clickable ⚡ addresses
- **Website Links**: External link handling mit target="_blank"
- **Copy Functions**: Easy copy für pubkeys, NIP-05, Lightning addresses

#### 3.3.3 Loading & Error States
- **Skeleton Loading**: Smooth loading experience
- **Error Recovery**: Retry mechanisms für failed loads
- **Offline Handling**: Cached data when offline

## 4. UI/UX Design Prinzipien

### 4.1 Design System Integration
- **CSS Variables**: Nutzung der existing design tokens
- **Component Consistency**: Erbt von `BaseComponent.svelte`
- **Responsive**: Mobile-first mit tablet/desktop optimizations

### 4.2 Accessibility
- **Keyboard Navigation**: Full keyboard support
- **Screen Reader**: Proper ARIA labels und semantic HTML
- **Focus Management**: Clear focus indicators
- **Test IDs**: Comprehensive test coverage support

### 4.3 Visual Hierarchy
- **Profile Header**: Dominant avatar und name
- **Action Buttons**: Clear, prominent placement
- **Information Density**: Balanced, not overwhelming
- **Status Indicators**: Clear verification badges und follow status

## 5. Performance Requirements

### 5.1 Loading Performance
- **Cache Hits**: <10ms für cached profiles
- **Cache Misses**: <2s für fresh profile loads
- **Batch Loading**: Efficient multi-profile loading wenn möglich

### 5.2 Memory Management
- **Store Cleanup**: Proper subscription cleanup
- **Image Optimization**: Efficient image loading und caching
- **Reactive Updates**: Minimal re-renders through smart reactivity

## 6. Navigation Integration

### 6.1 Route Structure
```typescript
// Erweitere RouteId type
export type RouteId = 'feed' | 'dm' | 'profile' | 'discover' | 'create' | 'auth';

// Navigation patterns
/profile -> eigenes Profil
/profile/{pubkey} -> fremdes Profil
/profile/edit -> edit mode für eigenes Profil
```

### 6.2 Main App Integration
```svelte
<!-- Add to NostrApp.svelte navigation -->
<button 
  class="nav-btn"
  class:active={currentView === 'profile'}
  onclick={() => currentView = 'profile'}
>
  👤 Profile
</button>

<!-- Add to main content area -->
{:else if currentView === 'profile'}
  <ProfileView {nostr} {authState} />
```

## 7. Security Considerations

### 7.1 Data Privacy
- **Own Profile**: Full edit access nur für authenticated user
- **Foreign Profiles**: Read-only, no sensitive data exposure
- **Key Management**: Kein private key exposure in UI

### 7.2 Input Validation
- **URL Validation**: Sichere URL validation für links
- **Image URLs**: Validation für picture/banner URLs
- **NIP-05**: Proper format validation
- **Lightning**: Lightning address format validation

## 8. Error Handling Strategy

### 8.1 Profile Loading Errors
- **Network Errors**: Retry mechanisms mit exponential backoff
- **Profile Not Found**: User-friendly "Profile not found" message
- **Relay Timeouts**: Graceful degradation mit cached data

### 8.2 Profile Update Errors
- **Validation Errors**: Clear field-level error messages
- **Relay Failures**: Rollback optimistic updates
- **Network Issues**: Queue updates for retry

## 9. Testing Strategy

### 9.1 Unit Tests
- **Component Rendering**: Each component renders correctly
- **User Interactions**: Follow/unfollow, edit actions
- **State Management**: Profile store integrations

### 9.2 Integration Tests
- **NostrUnchained API**: Profile API integration
- **Navigation**: Route changes und parameter handling
- **Real Data**: Tests mit actual Nostr data

## 10. Implementation Phases

### Phase 1: Core Profile Display
- Basic ProfileView component
- Profile data loading via NostrUnchained API
- Basic styling und responsive layout

### Phase 2: Edit Functionality  
- Profile editor für eigenes Profil
- Form validation und submission
- Optimistic updates

### Phase 3: Social Features
- Follow/unfollow functionality
- Enhanced metadata display
- Lightning und NIP-05 integration

### Phase 4: Polish & Performance
- Loading optimizations
- Error handling improvements
- Accessibility audit
- Mobile optimizations

## 11. Success Metrics

### 11.1 Performance Metrics
- Profile load time: <2s für fresh loads, <10ms für cached
- Follow action response: <500ms
- Memory usage: <5MB für profile views

### 11.2 User Experience Metrics
- Profile creation completion rate: >80%
- Follow action success rate: >95%
- Mobile usability score: >90/100

## 12. Conclusion

Diese Profile View wird das missing piece für social functionality in der nostr-unchained-app. Durch die enge Integration mit dem NostrUnchained Profile API können wir eine state-of-the-art User Experience bieten, die sowohl performant als auch feature-complete ist.

Die klare Trennung zwischen eigenem und fremdem Profil, combined mit reactive updates und optimistic UI patterns, wird eine moderne Social Media Experience liefern, die den Standards von etablierten Plattformen entspricht.