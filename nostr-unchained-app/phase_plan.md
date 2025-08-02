# Profile View Development - SMART Phase Implementation Plan

## Übersicht

Diese SMART-Phasen zerlegen die Profile View Entwicklung aus dem system-design.md in testbare, in sich abgeschlossene Entwicklungszyklen. Jede Phase ist **S**pezifisch, **M**essbar, **A**usführbar, **R**elevant und **T**erminiert.

---

## Phase 1: Foundation & Infrastructure (SMART Goals)

### 1.1 Ziele (Specific & Measurable)
- **Was**: TypeScript Types, Utility Functions, Base UI Components
- **Messbar**: 8 neue Dateien, 100% TypeScript Coverage, 0 Linting Errors
- **Deadline**: 2 Tage

### 1.2 Deliverables & Acceptance Criteria

#### 1.2.1 TypeScript Type System
**Files**: `src/lib/types/profile.ts`
```typescript
✅ ProfileViewProps interface (7 properties)
✅ ProfileFormData interface (7 form fields)
✅ ProfileFormErrors interface (7 error fields) 
✅ ProfileValidationResult interface (4 properties)
✅ All component-specific Props interfaces (5 components)
```
**Acceptance**: All types compile without errors, exported properly

#### 1.2.2 Base Utility Functions
**Files**: 
- `src/lib/utils/clipboard.ts` (copyToClipboard function)
- `src/lib/utils/nostr.ts` (formatPubkey, isValidPubkey, normalizeUrl)

**Acceptance**: 
- clipboard.ts: Works in modern browsers + fallback
- nostr.ts: Formats pubkeys correctly, validates hex strings

#### 1.2.3 Core UI Components
**Files**:
- `src/lib/components/ui/Modal.svelte` (reusable modal)
- `src/lib/components/ui/Input.svelte` (form input)
- `src/lib/components/ui/Textarea.svelte` (form textarea)

**Acceptance**: 
- Modal: Opens/closes, ESC key, backdrop click, all sizes
- Input: Proper labels, errors, validation states
- Textarea: Character counting, resize behavior

#### 1.2.4 App Type Updates
**Files**: `src/lib/types/app.ts`
```typescript
✅ RouteId erweitert um 'profile'
✅ ProfileRouteParams interface
```

### 1.3 Testing Requirements
- **Unit Tests**: clipboard.ts, nostr.ts utilities (>90% coverage)
- **Component Tests**: Modal, Input, Textarea (rendering + interactions)
- **Type Tests**: All interfaces compile and export correctly

### 1.4 Definition of Done
- [ ] All 8 Dateien erstellt und funktional
- [ ] `npm run typecheck` passes (0 errors)
- [ ] `npm run lint` passes (0 warnings)
- [ ] `npm run test` passes (all foundation tests)
- [ ] Components render ohne crashes
- [ ] **Manuelle Testanweisungen für Phase 1 befolgt und bestätigt**

---

## Phase 2: Core Profile Components (SMART Goals)

### 2.1 Ziele (Specific & Measurable)
- **Was**: ProfileView Container + ProfileHeader + ProfileInfo + ProfileActions
- **Messbar**: 4 Svelte Components, Profile API Integration, Reactive State
- **Deadline**: 3 Tage

### 2.2 Deliverables & Acceptance Criteria

#### 2.2.1 ProfileView.svelte (Main Container)
**File**: `src/lib/components/profile/ProfileView.svelte`
**Requirements**:
```svelte
✅ Props: nostr, pubkey?, authState
✅ Reactive State: profilePubkey, isOwnProfile, viewMode  
✅ Profile Manager Integration: createProfileManager()
✅ Event Handlers: handleFollowToggle, handleEditClick
✅ Template: 3 view modes (display/edit/create)
✅ CSS: Responsive grid layout, mobile-first
```
**Acceptance**: 
- Shows loading state correctly
- Distinguishes own vs foreign profile
- Handles missing profile gracefully

#### 2.2.2 ProfileHeader.svelte  
**File**: `src/lib/components/profile/ProfileHeader.svelte`
**Requirements**:
```svelte
✅ Avatar: Image + fallback placeholder
✅ Banner: Optional banner image
✅ Name: Display name + NIP-05 badge
✅ Edit Button: Only for own profile
✅ Pubkey: Copyable short format
✅ Loading: Skeleton animations
```
**Acceptance**:
- Avatar fallback shows first letter
- NIP-05 badge shows ✅ when verified
- Edit button triggers correctly
- Copy pubkey works

#### 2.2.3 ProfileInfo.svelte
**File**: `src/lib/components/profile/ProfileInfo.svelte`  
**Requirements**:
```svelte
✅ About: Profile bio/description
✅ Links: Website, Lightning address clickable
✅ Metadata: All profile fields display
✅ Loading: Skeleton for missing data
```
**Acceptance**:
- Links open in new tab
- Lightning addresses copyable
- Empty states handled gracefully

#### 2.2.4 ProfileActions.svelte
**File**: `src/lib/components/profile/ProfileActions.svelte`
**Requirements**:
```svelte
✅ Follow Button: Toggle follow/unfollow
✅ Edit Button: For own profile only
✅ Loading States: During actions
✅ Error Handling: Failed actions
```
**Acceptance**:
- Follow button shows correct state
- Optimistic updates work
- Error states display properly

#### 2.2.5 Profile Manager Utility
**File**: `src/lib/components/profile/utils/profileManager.ts`
**Requirements**:
```typescript
✅ NostrUnchained API Integration
✅ Reactive State Management (Svelte 5 runes)
✅ followUser() / unfollowUser() methods
✅ Profile store subscriptions
✅ Error handling & logging
```
**Acceptance**:
- Subscribes to profile changes
- Follow actions trigger API calls
- State updates reactively
- Errors logged properly

### 2.3 Testing Requirements
- **Component Tests**: Each component renders with props
- **Integration Tests**: ProfileView with NostrUnchained API
- **State Tests**: Profile manager state changes
- **Visual Tests**: Loading states, error states

### 2.4 Definition of Done
- [ ] 4 Components implementiert und funktional
- [ ] ProfileView integriert ProfileManager  
- [ ] Follow/unfollow functionality works
- [ ] Loading und error states implemented
- [ ] Responsive design auf mobile/desktop
- [ ] **Alle Tests von Phase 1 & 2 laufen erfolgreich**
- [ ] **Manuelle Testanweisungen für Phase 2 befolgt und bestätigt**

---

## Phase 3: Profile Editor & Form Management (SMART Goals)

### 3.1 Ziele (Specific & Measurable)
- **Was**: ProfileEditor Modal, Form Validation, Profile Creation/Updates
- **Messbar**: 1 Complex Component, Form State Management, Validation System
- **Deadline**: 2 Tage

### 3.2 Deliverables & Acceptance Criteria

#### 3.2.1 ProfileEditor.svelte
**File**: `src/lib/components/profile/ProfileEditor.svelte`
**Requirements**:
```svelte
✅ Modal Integration: Uses Modal component
✅ Form Fields: name, about, picture, banner, nip05, website, lud16
✅ Form State: Svelte 5 runes ($state, $derived)
✅ Real-time Validation: validateProfileForm integration
✅ Error Display: Field-level error messages
✅ Save/Cancel: Proper state management
```
**Acceptance**:
- Form validates on input change
- Errors clear when field corrected
- Save only enabled when valid + dirty
- Cancel resets form state
- Loading state during save

#### 3.2.2 Profile Validation System
**File**: `src/lib/components/profile/utils/profileValidation.ts`
**Requirements**:
```typescript
✅ validateProfileForm(data): Promise<ValidationResult>
✅ URL validation (picture, banner, website)
✅ NIP-05 format validation (email-like)
✅ Lightning address validation
✅ Length limits (name: 50, about: 500)
✅ Warning system for empty recommended fields
```
**Acceptance**:
- URL validation catches invalid URLs
- NIP-05 validation follows spec
- Error messages are user-friendly
- Warnings don't block save

#### 3.2.3 Profile Update Integration
**Requirements**:
```typescript
✅ profileManager.updateProfile(formData)
✅ NostrUnchained profile.edit() API integration
✅ preserveExisting(true) to keep other fields
✅ Optimistic updates in UI
✅ Error handling + rollback
```
**Acceptance**:
- Profile updates sent to relays
- UI updates immediately (optimistic)
- Errors rollback optimistic changes
- Success closes editor modal

### 3.3 Testing Requirements
- **Form Tests**: Validation logic, state management
- **Integration Tests**: Profile save/update workflow
- **Error Tests**: Network failures, validation errors
- **UX Tests**: Loading states, success/error feedback

### 3.4 Definition of Done
- [ ] ProfileEditor component functional
- [ ] Form validation system working
- [ ] Profile creation workflow complete
- [ ] Profile editing workflow complete
- [ ] Optimistic updates implemented
- [ ] **Alle Tests von Phase 1, 2 & 3 laufen erfolgreich**
- [ ] Manual testing: Can create/edit profiles
- [ ] **Manuelle Testanweisungen für Phase 3 befolgt und bestätigt**

---

## Phase 4: NostrApp Integration & Navigation (SMART Goals)

### 4.1 Ziele (Specific & Measurable)
- **Was**: Profile View in NostrApp Navigation, Route Integration
- **Messbar**: 1 Modified Component, Working Navigation, Full User Journey
- **Deadline**: 1 Tag

### 4.2 Deliverables & Acceptance Criteria

#### 4.2.1 NostrApp.svelte Integration
**File**: `src/lib/components/NostrApp.svelte`
**Modifications**:
```svelte
✅ Import ProfileView component
✅ Add 'profile' to currentView state type
✅ Add Profile navigation button (👤 Profile)
✅ Add ProfileView to main content area
✅ Pass nostr and authState props
```
**Acceptance**:
- Profile button appears in navigation
- Clicking switches to profile view
- ProfileView receives correct props
- Navigation state updates properly

#### 4.2.2 End-to-End User Journey
**User Flows**:
1. **New User**: Shows profile creation form
2. **Existing Profile**: Shows profile display
3. **Own Profile**: Edit button available
4. **Foreign Profile**: Follow button available
5. **Navigation**: Can switch between views

**Acceptance**:
- All user flows work without errors
- Profile creation saves correctly
- Profile editing preserves data
- Follow functionality works
- Navigation preserves state

### 4.3 Testing Requirements
- **Integration Tests**: Full app navigation flow
- **User Journey Tests**: Profile creation → editing → viewing
- **Cross-Component Tests**: ProfileView ↔ NostrApp state
- **Regression Tests**: Existing functionality unaffected

### 4.4 Definition of Done
- [ ] Profile navigation button added
- [ ] ProfileView integrated into NostrApp
- [ ] All user journeys functional
- [ ] Navigation state management working
- [ ] No regressions in existing features
- [ ] **Alle Tests von Phase 1, 2, 3 & 4 laufen erfolgreich**
- [ ] **Manuelle Testanweisungen für Phase 4 befolgt und bestätigt**

---

## Phase 5: ProfileStats & Polish (SMART Goals)

### 5.1 Ziele (Specific & Measurable)
- **Was**: ProfileStats Component, Loading Optimizations, Mobile Polish
- **Messbar**: 1 Component, Performance Improvements, Mobile Responsive
- **Deadline**: 2 Tage

### 5.2 Deliverables & Acceptance Criteria

#### 5.2.1 ProfileStats.svelte
**File**: `src/lib/components/profile/ProfileStats.svelte`
**Requirements**:
```svelte
✅ Following Count: From follow list store
✅ Followers Count: Optional (future feature)
✅ Loading States: Skeleton animations
✅ Responsive Design: Mobile/desktop layouts
```
**Acceptance**:
- Shows following count correctly
- Updates when follow list changes
- Loading skeleton while fetching
- Responsive on all screen sizes

#### 5.2.2 Loading & Performance Optimizations
**Improvements**:
```svelte
✅ Skeleton Loading: All components
✅ Image Lazy Loading: Avatars and banners
✅ Error Boundaries: Graceful failure handling
✅ Performance: Minimize re-renders
```
**Acceptance**:
- Loading states show immediately
- Images load progressively
- Errors don't crash the app
- Smooth animations and transitions

#### 5.2.3 Mobile Responsiveness
**Requirements**:
```css
✅ Mobile-first CSS: <768px breakpoint
✅ Touch-friendly: 44px minimum touch targets
✅ Viewport: Optimized for mobile screens
✅ Performance: <3s load time on mobile
```
**Acceptance**:
- All components usable on mobile
- Touch targets properly sized
- No horizontal scrolling
- Fast loading on mobile networks

#### 5.2.4 CSS Architecture Completion
**File**: `src/app.css` additions
```css
✅ Profile-specific CSS variables
✅ Skeleton animation keyframes
✅ Verified badge styles
✅ Mobile responsiveness utilities
```

### 5.3 Testing Requirements
- **Performance Tests**: Loading times, memory usage
- **Mobile Tests**: Touch interactions, responsive layout
- **Visual Tests**: Loading skeletons, animations
- **Accessibility Tests**: Screen reader, keyboard navigation

### 5.4 Definition of Done
- [ ] ProfileStats component implemented
- [ ] All loading states optimized
- [ ] Mobile responsiveness complete
- [ ] CSS architecture finalized
- [ ] Performance targets met
- [ ] Accessibility requirements satisfied
- [ ] **Alle Tests von Phase 1, 2, 3, 4 & 5 laufen erfolgreich**
- [ ] **Manuelle Testanweisungen für Phase 5 befolgt und bestätigt**

---

## Testing Strategy per Phase

### Phase 1: Foundation Testing
```bash
# Unit Tests
npm test -- src/lib/utils/clipboard.test.ts
npm test -- src/lib/utils/nostr.test.ts

# Component Tests  
npm test -- src/lib/components/ui/Modal.test.ts
npm test -- src/lib/components/ui/Input.test.ts
npm test -- src/lib/components/ui/Textarea.test.ts

# Type Tests
npm run typecheck
```

### Phase 2: Component Testing
```bash
# Component Tests
npm test -- src/lib/components/profile/ProfileView.test.ts
npm test -- src/lib/components/profile/ProfileHeader.test.ts
npm test -- src/lib/components/profile/ProfileInfo.test.ts
npm test -- src/lib/components/profile/ProfileActions.test.ts

# Integration Tests
npm test -- src/lib/components/profile/integration.test.ts

# State Management Tests
npm test -- src/lib/components/profile/utils/profileManager.test.ts
```

### Phase 3: Form & Validation Testing
```bash
# Form Logic Tests
npm test -- src/lib/components/profile/ProfileEditor.test.ts
npm test -- src/lib/components/profile/utils/profileValidation.test.ts

# User Interaction Tests
npm test -- src/lib/components/profile/form-interactions.test.ts
```

### Phase 4: Integration Testing
```bash
# App Integration Tests
npm test -- src/lib/components/NostrApp.integration.test.ts

# End-to-End Tests  
npm test -- src/lib/components/profile/e2e.test.ts
```

### Phase 5: Performance & Polish Testing
```bash
# Performance Tests
npm test -- src/lib/components/profile/performance.test.ts

# Mobile Tests
npm test -- src/lib/components/profile/responsive.test.ts

# Full Test Suite
npm test
npm run coverage
```

---

## Phase Success Metrics

### Phase 1 Success Criteria
- ✅ 8 neue Dateien erstellt
- ✅ 0 TypeScript Errors
- ✅ 0 Linting Warnings  
- ✅ >90% Test Coverage für Utilities
- ✅ All base components render

### Phase 2 Success Criteria
- ✅ 4 Profile Components functional
- ✅ Profile API Integration working
- ✅ Follow/unfollow functionality
- ✅ >85% Test Coverage
- ✅ Responsive design implemented

### Phase 3 Success Criteria
- ✅ Profile creation workflow complete
- ✅ Profile editing workflow complete
- ✅ Form validation system working
- ✅ >90% Test Coverage
- ✅ Optimistic updates implemented

### Phase 4 Success Criteria
- ✅ Full app navigation working
- ✅ All user journeys functional
- ✅ No regressions introduced
- ✅ Integration tests passing
- ✅ End-to-end workflow complete

### Phase 5 Success Criteria
- ✅ ProfileStats component working
- ✅ Mobile responsiveness complete
- ✅ Performance targets met
- ✅ >95% Test Coverage
- ✅ Production-ready quality

---

## Manuelle Testanweisungen pro Phase

### Phase 1: Foundation - Manuelle Tests
**Nach Implementierung von Phase 1 führe folgende Tests durch:**

1. **TypeScript Compilation**:
   ```bash
   npm run typecheck
   ```
   ✅ **Erwartung**: 0 Errors, alle neuen Types kompilieren

2. **Linting**:
   ```bash
   npm run lint
   ```
   ✅ **Erwartung**: 0 Warnings für neue Files

3. **Modal Component Test**:
   - Öffne Browser Dev Tools
   - Erstelle temporäre Test-Seite die Modal importiert
   - **Test 1**: Modal öffnet sich
   - **Test 2**: ESC Taste schließt Modal
   - **Test 3**: Click außerhalb schließt Modal
   - **Test 4**: Alle 4 Größen (sm, md, lg, xl) funktionieren

4. **Input Component Test**:
   - **Test 1**: Label wird angezeigt
   - **Test 2**: Placeholder funktioniert
   - **Test 3**: Error-State zeigt roten Border
   - **Test 4**: Helper Text wird angezeigt

5. **Textarea Component Test**:
   - **Test 1**: Mehrzeilige Eingabe möglich
   - **Test 2**: Character counting funktioniert
   - **Test 3**: Resize behavior korrekt

6. **Utility Functions**:
   - **clipboard.ts**: Test copy in Browser Console
   - **nostr.ts**: Test formatPubkey mit 64-char hex string

**✅ Phase 1 ist abgeschlossen wenn alle obigen Tests erfolgreich sind**

### Phase 2: Core Components - Manuelle Tests
**Nach Implementierung von Phase 2 führe folgende Tests durch:**

1. **Alle Phase 1 Tests wiederholen** ✅

2. **ProfileView Component**:
   - **Test 1**: Component rendert ohne Crash
   - **Test 2**: Loading state wird angezeigt
   - **Test 3**: Own profile vs foreign profile detection
   - **Test 4**: Responsive layout auf Desktop/Mobile

3. **ProfileHeader Component**:
   - **Test 1**: Avatar placeholder bei fehlendem Bild
   - **Test 2**: NIP-05 badge bei verifizierten Profilen
   - **Test 3**: Edit button nur bei eigenem Profil
   - **Test 4**: Copy pubkey funktioniert

4. **ProfileInfo Component**:
   - **Test 1**: About text wird angezeigt
   - **Test 2**: Website links öffnen in neuem Tab
   - **Test 3**: Lightning addresses sind copyable
   - **Test 4**: Empty states handled gracefully

5. **ProfileActions Component**:
   - **Test 1**: Follow button zeigt korrekten Status
   - **Test 2**: Loading state während actions
   - **Test 3**: Edit button nur für own profile

6. **NostrUnchained Integration**:
   - **Test 1**: Profile store subscription funktioniert
   - **Test 2**: Follow/unfollow API calls werden ausgelöst
   - **Test 3**: Error handling bei API failures

**✅ Phase 2 ist abgeschlossen wenn alle Phase 1 & 2 Tests erfolgreich sind**

### Phase 3: Profile Editor - Manuelle Tests
**Nach Implementierung von Phase 3 führe folgende Tests durch:**

1. **Alle Phase 1 & 2 Tests wiederholen** ✅

2. **ProfileEditor Modal**:
   - **Test 1**: Modal zeigt alle Form Felder
   - **Test 2**: Save button nur enabled wenn valid + dirty
   - **Test 3**: Cancel resettet Form state
   - **Test 4**: Loading state während save

3. **Form Validation**:
   - **Test 1**: URL validation für picture/banner/website
   - **Test 2**: NIP-05 format validation (email-like)
   - **Test 3**: Lightning address validation
   - **Test 4**: Character limits (name: 50, about: 500)
   - **Test 5**: Error messages sind user-friendly

4. **Profile Creation Workflow**:
   - **Test 1**: Neuer User sieht creation form
   - **Test 2**: Valid form kann submitted werden
   - **Test 3**: Profile wird an NostrUnchained API gesendet
   - **Test 4**: UI updates optimistically

5. **Profile Editing Workflow**:
   - **Test 1**: Existing profile lädt in form
   - **Test 2**: Nur geänderte Felder werden updated
   - **Test 3**: preserveExisting(true) funktioniert
   - **Test 4**: Erfolgreiche updates schließen modal

**✅ Phase 3 ist abgeschlossen wenn alle Phase 1, 2 & 3 Tests erfolgreich sind**

### Phase 4: NostrApp Integration - Manuelle Tests
**Nach Implementierung von Phase 4 führe folgende Tests durch:**

1. **Alle Phase 1, 2 & 3 Tests wiederholen** ✅

2. **Navigation Integration**:
   - **Test 1**: Profile button erscheint in Navigation
   - **Test 2**: Click auf Profile button switcht View
   - **Test 3**: ProfileView erhält korrekte Props
   - **Test 4**: Navigation state wird korrekt gemanaged

3. **End-to-End User Journeys**:
   - **Test 1**: Neuer User → Profile creation → Success
   - **Test 2**: Existing profile → View → Edit → Save
   - **Test 3**: Foreign profile → View → Follow → Success
   - **Test 4**: Navigation zwischen allen Views funktioniert

4. **Regression Tests**:
   - **Test 1**: Terminal view funktioniert noch
   - **Test 2**: Messages view funktioniert noch
   - **Test 3**: Publish view funktioniert noch
   - **Test 4**: Logout functionality unverändert

**✅ Phase 4 ist abgeschlossen wenn alle Phase 1-4 Tests erfolgreich sind**

### Phase 5: Polish & Performance - Manuelle Tests
**Nach Implementierung von Phase 5 führe folgende Tests durch:**

1. **Alle Phase 1-4 Tests wiederholen** ✅

2. **ProfileStats Component**:
   - **Test 1**: Following count wird korrekt angezeigt
   - **Test 2**: Updates wenn follow list sich ändert
   - **Test 3**: Loading skeleton während fetch
   - **Test 4**: Responsive auf allen screen sizes

3. **Mobile Responsiveness**:
   - **Test 1**: Alle components nutzbar auf Mobile (<768px)
   - **Test 2**: Touch targets mindestens 44px
   - **Test 3**: Kein horizontal scrolling
   - **Test 4**: Fast loading auf mobile networks

4. **Performance Tests**:
   - **Test 1**: Loading states zeigen sofort
   - **Test 2**: Images laden progressively
   - **Test 3**: Smooth animations und transitions
   - **Test 4**: <3s load time auf mobile

5. **Final Quality Check**:
   - **Test 1**: Alle user flows funktionieren perfekt
   - **Test 2**: Error handling ist robust
   - **Test 3**: UI ist polish und professional
   - **Test 4**: Ready für production deployment

**✅ Phase 5 ist abgeschlossen wenn alle Phase 1-5 Tests erfolgreich sind**

---

## Risk Management & Contingencies

### High Risk Areas
1. **NostrUnchained API Integration**: Complex reactive state management
   - **Mitigation**: Implement comprehensive mocking in tests
   - **Contingency**: Fallback to simplified state management

2. **Form State Management**: Complex validation + optimistic updates  
   - **Mitigation**: Implement step-by-step with extensive testing
   - **Contingency**: Simplify to basic save/cancel without optimistic updates

3. **Mobile Performance**: Image loading and layout shifts
   - **Mitigation**: Implement progressive loading and skeleton states
   - **Contingency**: Reduce image sizes and simplify mobile layout

### Medium Risk Areas
1. **CSS Architecture**: Complex responsive design
   - **Mitigation**: Mobile-first approach with systematic breakpoints
   
2. **Error Handling**: Network failures and edge cases
   - **Mitigation**: Comprehensive error boundary implementation

### Timeline Contingencies
- **Phase Extension**: +1 Tag per Phase als Buffer
- **Scope Reduction**: ProfileStats kann in späteren Iteration implementiert werden
- **Quality Gate**: Keine Phase startet ohne erfolgreich abgeschlossene Vorphase

---

## Implementation Schedule

| Phase | Duration | Start | End | Dependencies |
|-------|----------|-------|-----|--------------|
| Phase 1 | 2 Tage | Tag 1 | Tag 2 | None |
| Phase 2 | 3 Tage | Tag 3 | Tag 5 | Phase 1 ✅ |
| Phase 3 | 2 Tage | Tag 6 | Tag 7 | Phase 2 ✅ |
| Phase 4 | 1 Tag | Tag 8 | Tag 8 | Phase 3 ✅ |
| Phase 5 | 2 Tage | Tag 9 | Tag 10 | Phase 4 ✅ |
| **Total** | **10 Tage** | | | |

### Daily Checkpoints
- **Nach jeder Phase**: Alle bisherigen Tests müssen erfolgreich sein
- **Kein Phasenübergang**: Ohne erfolgreich abgeschlossene manuelle Tests
- **Git Commits**: Nach jedem erfolgreich getesteten Meilenstein
- **Dokumentation**: Code comments und README updates

### Phase Abschluss Protokoll
**Jede Phase ist erst abgeschlossen wenn:**
1. ✅ Alle Code-Implementierungen fertig
2. ✅ `npm run typecheck` und `npm run lint` erfolgreich
3. ✅ Alle bisherigen Tests laufen (kumulativ)
4. ✅ Manuelle Testanweisungen befolgt und bestätigt
5. ✅ Keine Regressions in vorherigen Features
6. ✅ Git commit mit "Phase X complete - all tests passed"

**Erst dann darf die nächste Phase beginnen!**

---

Dieser SMART Phase Plan macht die Profile View Entwicklung planbar, testbar und erfolgreich umsetzbar. Jede Phase ist in sich abgeschlossen und baut systematisch auf der vorherigen auf - **aber nur wenn alle Tests erfolgreich sind**.