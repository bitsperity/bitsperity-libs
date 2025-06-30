# Meilenstein 1: Magische Erste Erfahrung - Akzeptanzkriterien

## Übersicht
Dieses Dokument definiert spezifische, testbare Kriterien zur Validierung der Vollständigkeit von Meilenstein 1.

## Feature-Akzeptanzkriterien

### Kern-Feature 1: NostrUnchained-Klassen-Architektur

#### User Story Akzeptanz
**Als ein** müder Entwickler um 21 Uhr
**Möchte ich** sofort loslegen können ohne Konfiguration
**Damit** ich in 5 Minuten Erfolg sehe

**Akzeptanzkriterien:**
- [ ] Given fresh npm project, when `const nostr = new NostrUnchained()` wird ausgeführt, then initialisiert sich in <200ms ohne Fehler
- [ ] Given keine Relay-Konfiguration, when NostrUnchained initialisiert wird, then verbindet sich automatisch zu >3 Standard-Relays
- [ ] Given failed relay connections, when initialization stattfindet, then graceful fallback ohne crashes
- [ ] Given multiple NostrUnchained Instanzen mit gleicher Config, when erstellt, then teilen sich Ressourcen für Speicher-Effizienz

#### API-Akzeptanzkriterien
- [ ] API folgt dokumentiertem Interface aus api.md
- [ ] API integriert mit Svelte Store patterns nahtlos
- [ ] API liefert TypeScript-sichere Error-Objekte mit context
- [ ] API performer innerhalb <200ms initialization time

#### Developer Experience Akzeptanz
- [ ] Entwickler kann erste Verwendung in unter 2 Minuten abschließen
- [ ] Entwickler erhält klares Feedback für alle Error-Szenarien
- [ ] Entwickler kann Probleme mit detailliertem Debug-Modus diagnostizieren
- [ ] Entwickler kann mit bestehenden SvelteKit-Workflows integrieren

### Kern-Feature 2: DM-Modul mit reaktivem Store-Pattern

#### User Story Akzeptanz
**Als ein** SvelteKit-Entwickler
**Möchte ich** DMs wie native Svelte Stores verwenden
**Damit** ich reaktive UIs ohne zusätzliche Komplexität erstellen kann

**Akzeptanzkriterien:**
- [ ] Given valid npub, when `nostr.dm.with(npub)` aufgerufen wird, then returns valid Svelte Store
- [ ] Given Store subscription, when neue DM empfangen wird, then Store updated innerhalb 100ms
- [ ] Given `await conversation.send("text")`, when erfolgreich, then message erscheint in `$conversation.messages`
- [ ] Given Relay-Ausfall, when sending DM, then automatischer Retry mit exponential backoff

#### NIP-17 Gift Wrap Akzeptanzkriterien
- [ ] Alle gesendeten DMs verwenden NIP-17 Gift Wrap Architektur
- [ ] NIP-44 ChaCha20-Poly1305 Verschlüsselung wird korrekt implementiert
- [ ] Conversation Keys werden sicher abgeleitet ohne Wiederverwendung
- [ ] Metadata privacy wird durch seal/giftwrap pattern geschützt

#### Performance Akzeptanzkriterien
- [ ] Erste DM-Verbindung in <2s auf Standard-Internet
- [ ] Message send latency <500ms unter normalen Bedingungen
- [ ] Store updates triggern UI re-renders in <100ms
- [ ] Memory usage bleibt <10MB für aktive Conversation

### Kern-Feature 3: Automatisches Signer-Management

#### User Story Akzeptanz
**Als ein** Nostr-Neuling ohne Extension
**Möchte ich** trotzdem DMs senden können
**Damit** ich die Library sofort testen kann

**Akzeptanzkriterien:**
- [ ] Given keine NIP-07 Extension, when NostrUnchained initialisiert, then generiert automatisch temporäre Keys
- [ ] Given temporäre Keys, when DM gesendet wird, then funktioniert identisch zu Extension-Keys
- [ ] Given Extension wird installiert, when detected, then nahtloser Übergang ohne Conversation-Verlust
- [ ] Given Extension permission denied, when fallback zu temp keys, then clear warning message

#### Security Akzeptanzkriterien
- [ ] Temporäre Keys werden mit kryptographisch sicherer Randomness generiert
- [ ] Keys werden niemals in plaintext in localStorage gespeichert
- [ ] Browser secure storage APIs werden für Key-Persistence verwendet
- [ ] Clear warnings über Security-Implications von temporären Keys

#### Extension Kompatibilitätskriterien
- [ ] Alby Extension wird automatisch erkannt und verwendet
- [ ] nos2x Extension funktioniert ohne spezielle Konfiguration
- [ ] Amber mobile Extension über nostr-connect protocol unterstützt
- [ ] Extension timeouts handled gracefully mit fallback

### Kern-Feature 4: Intelligentes Relay-Management

#### User Story Akzeptanz
**Als ein** Entwickler
**Möchte ich** dass Nachrichten zuverlässig ankommen
**Ohne** mich um Relay-Details kümmern zu müssen

**Akzeptanzkriterien:**
- [ ] Given Standard-Setup, when DM gesendet wird, then >90% Delivery-Erfolgsrate
- [ ] Given primärer Relay down, when sending, then automatischer Fallback zu Secondary-Relays
- [ ] Given alle konfigurierten Relays down, when sending, then clear error mit recovery suggestions
- [ ] Given network latency spikes, when connecting, then adaptive timeout adjustments

#### NIP-65 Outbox Model Akzeptanzkriterien
- [ ] User-declared write relays werden automatisch erkannt und verwendet
- [ ] Relay discovery basiert auf NIP-65 relay list metadata events
- [ ] Smart relay selection bevorzugt User's outbox relays für bessere Delivery
- [ ] Fallback zu well-known relays wenn keine User-Relays verfügbar

#### Performance und Zuverlässigkeitskriterien
- [ ] Connection pooling reduziert Ressourcenverbrauch bei multiple conversations
- [ ] Rate limiting detection mit intelligent backoff algorithms
- [ ] Health monitoring tracked kontinuierlich mit automatic bad relay removal
- [ ] Redundant publishing zu multiple relays für Ausfallsicherheit

## Integrations-Akzeptanzkriterien

### SvelteKit Integration
- [ ] Server-side rendering funktioniert ohne window-dependency crashes
- [ ] Client-side hydration aktiviert reactive updates nahtlos
- [ ] Form actions können mit und ohne JavaScript funktionieren
- [ ] Build process integriert ohne warnings oder errors

### TypeScript Integration
- [ ] Vollständige Type-Safety ohne any-types in public APIs
- [ ] IDE autocompletion funktioniert für alle public methods
- [ ] Compile-time errors für common API misuse patterns
- [ ] Generated types documentation ist aktuell und vollständig

### Browser Extension Integration
- [ ] Extension detection funktioniert in allen major browsers
- [ ] Permission flows sind user-friendly mit clear instructions
- [ ] Extension crashes führen nicht zu app crashes
- [ ] Multiple extensions installed handled gracefully mit preference order

## Performance-Akzeptanzkriterien

### Bundle Size und Loading
- [ ] Gesamte M1 Funktionalität <30KB gzipped gemessen mit webpack-bundle-analyzer
- [ ] Tree-shaking eliminiert ungenutzte Features aus final bundle
- [ ] Dynamic imports für große Dependencies (crypto libraries)
- [ ] No bundled polyfills für moderne Browser-targets

### Memory Usage
- [ ] Active conversation verwendet <10MB RAM gemessen mit Chrome DevTools
- [ ] Memory leaks detection: keine Steigerung über 24h normal usage
- [ ] Automatic cleanup von inactive conversations nach konfigurierbarem timeout
- [ ] Weak references für cached data zur GC-Freundlichkeit

### Network Performance
- [ ] Concurrent relay connections mit connection pooling
- [ ] Message batching für efficiency bei high-volume scenarios
- [ ] Intelligent retry strategies mit exponential backoff
- [ ] Bandwidth-efficient protocols (WebSocket über HTTP wo möglich)

## Dokumentations-Akzeptanzkriterien

### Schnellstart-Dokumentation
- [ ] 5-Minuten-Tutorial führt von Installation zu erfolgreicher DM
- [ ] Copy-paste Codebeispiele funktionieren ohne Modifikation
- [ ] Häufige Error-Szenarien mit Lösungen dokumentiert
- [ ] Screenshots/GIFs für visuelle Bestätigung des Erfolgs

### API-Referenz-Vollständigkeit
- [ ] Jede public method hat JSDoc-Kommentare mit Beispielen
- [ ] TypeScript-generated docs sind aktuell und browsable
- [ ] Error-Codes dokumentiert mit recovery recommendations
- [ ] Beispiele für alle major use cases

## Validierungsmethoden

### Automatisierte Tests
- [ ] Unit tests für alle core APIs mit >90% coverage
- [ ] Integration tests für Relay-Kommunikation
- [ ] End-to-end tests für komplette DM-Workflows
- [ ] Performance regression tests für Bundle size und memory

### Manuelle Tests
- [ ] Fresh developer onboarding tests mit echten Personen
- [ ] Cross-browser compatibility testing
- [ ] Extension ecosystem testing mit verschiedenen Signers
- [ ] Network resilience testing mit simulated failures

### Developer Tests
- [ ] Alpha testing mit 5+ echten Entwicklern ohne Nostr-Erfahrung
- [ ] Time-to-first-success measurement mit stopwatch
- [ ] API usability feedback sessions mit Think-aloud protocol
- [ ] Documentation quality assessment mit task-completion rates

### Integration Tests
- [ ] SvelteKit project template functionality verification
- [ ] Vite build pipeline integration without errors
- [ ] TypeScript strict mode compatibility verification
- [ ] Browser extension installation und usage flows

## Erfolgskennzahlen

### Primäre Erfolgsmetriken
- [ ] **Time-to-First-DM**: <5 Minuten gemessen von npm install
- [ ] **Zero-Config Success Rate**: >95% der fresh installs funktionieren ohne Konfiguration
- [ ] **Developer Satisfaction**: >8/10 in Post-Tutorial surveys
- [ ] **API Discoverability**: >80% finden next steps ohne Dokumentation

### Performance Benchmarks
- [ ] **Bundle Size**: <30KB gzipped verified mit bundle analyzer
- [ ] **Memory Usage**: <10MB für active conversation verified mit profiler
- [ ] **Message Delivery**: >90% success rate auf major relays
- [ ] **Response Times**: <2s first connection, <500ms message send

### Developer Experience Metriken
- [ ] **Error Recovery**: >90% können sich von common errors erholen
- [ ] **Documentation Effectiveness**: >85% task completion mit docs allein
- [ ] **TypeScript Experience**: >95% operations haben complete type inference
- [ ] **Integration Smoothness**: <4 hours für Migration von anderen Nostr libs 