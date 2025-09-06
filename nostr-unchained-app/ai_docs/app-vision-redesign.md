## Nostr Unchained App – Vision 2025

Ein Read-Only-First, klar strukturiertes, modernes Frontend mit bewusster Signatur-Auswahl (Signer) und konsistenter UX – bei vollständiger Funktionsparität.

### TL;DR
- Start im Read-Only-Modus. Schreibfunktionen werden „just-in-time“ durch bewusste Signer-Wahl freigeschaltet.
- Weg von Tab-Overload hin zu klarer Informationsarchitektur mit Route-Gruppen, Seiten-Navigation und Command-Palette.
- Konsistentes Designsysten (Tokens, Primitives) und fokussierte Views; kein Funktionsverlust, aber deutlich reduzierte kognitive Last.

---

### 1) Bestandsaufnahme (Ist-Zustand)
- Einstieg über `src/routes/+page.svelte` mit sofortiger Signer-Auswahl; Main-App in `lib/components/NostrApp.svelte` gehalten.
- Starke Abhängigkeit von einer „Segmented-Nav“ mit vielen Tabs: `terminal`, `messages`, `feed`, `publish`, `relays`, `lists`, `labels`, `profile` – alles in einer Datei.
- Einige Seiten sind bereits separat geroutet (z. B. `routes/labels/+page.svelte`), der Großteil steckt jedoch im Tab-Container.
- Die Library `nostr-unchained` und der `NostrService` unterstützen bereits Read-Only (Instanz ohne Signing-Provider); Schreiboperationen benötigen `initializeSigning()` bzw. aktiven Signer.
- DM/Giftwrap-Flow: Universal-Giftwrap-Subscription vorhanden und sollte automatisch entpacken und cachen [[Auto-Unwrap Giftwrap ist Zielvorgabe [[memory:5504249]]]].

Schmerzpunkte:
- Visuell überladen, Tabs sind kontext-mischend, zu viele Primär-Aktionen sichtbar.
- Kein Read-Only-First: Nutzer werden sofort in eine Signer-Entscheidung gedrängt.
- Fehlende klare IA (Informationsarchitektur); schwer zu scannen, wenig Route-getrennte Views.

---

### 2) Leitprinzipien (Soll-Zustand)
- Read-Only-First und Progressive Disclosure: Inhalte zuerst, Aktionen später – „Signieren, wenn nötig, bewusst und kontextbezogen“.
- Klare IA mit Route-Gruppen und Seiten-Hierarchie statt überladener Tabs.
- Konsistentes, minimalistisches UI mit starken Defaults, hoher Lesbarkeit und guter Tastatur-Bedienbarkeit.
- Feature-Parität bleibt erhalten – nur die Darstellung, Navigation und Gating ändern sich.

Referenzen:
- Progressive Disclosure: [Nielsen Norman Group – Progressive Disclosure](https://www.nngroup.com/articles/progressive-disclosure/)
- SvelteKit Route Groups: [SvelteKit – Route Groups](https://kit.svelte.dev/docs/advanced-routing#route-groups)
- Svelte Primitives: [Melt UI – Docs](https://www.melt-ui.com/docs)
- Komponenten-Bibliothek: [shadcn-svelte](https://www.shadcn-svelte.com/)
- Command Palette (Svelte): [cmdk-sv – GitHub](https://github.com/huntabyte/cmdk-sv)
- Accessibility: [WAI-ARIA – W3C](https://www.w3.org/WAI/standards-guidelines/aria/)

---

### 3) Informationsarchitektur v2 (Route-Gruppen)

Ziel: Trennung von öffentlichen (read-only), autorisierten (write) und Entwicklungs-/Admin-Ansichten. Beispielstruktur:

```text
src/routes/
  /(public)/
    +layout.svelte           # Öffentliche Shell (Header, Sidebar light)
    +page.svelte             # Start: Explore/Trends (read-only)
    explore/+page.svelte     # Erkunden (read-only)
    threads/[id]/+page.svelte
    profiles/[pubkey]/+page.svelte
    labels/+page.svelte
    articles/
      +page.svelte
      [author]/[d]/+page.svelte
  /(write)/                  # Nur nach bewusster Signer-Wahl
    +layout.svelte
    compose/+page.svelte     # Publish / Composer
    messages/+page.svelte    # DMs
    lists/+page.svelte       # Bookmarks/Listen verwalten
    relays/+page.svelte      # Relays verwalten, NIP-65 publish
    profile/+page.svelte     # Eigenes Profil bearbeiten
  /(onboarding)/
    signin/+page.svelte      # Signer-Auswahl (Extension, Temporary)
  /(dev)/
    terminal/+page.svelte    # Nostr Terminal, Relay Inspector
    encodings/+page.svelte   # Encoding-Panel
```

Hinweise:
- `/(public)` liefert alle Kerninhalte in Read-Only.
- `/(write)` ist zugänglich, zeigt ohne aktiven Signer aber nur read-only Hinweise/CTA („Zum Fortfahren anmelden“). Kein harter Redirect.
- `/(onboarding)` enthält die Signer-Auswahl – aufrufbar „just-in-time“ beim Versuch, zu schreiben.
- `/(dev)` hält Entwickler-Tools sichtbar getrennt.

---

### 4) Navigations- & Interaktionskonzept
- Desktop: Linke Sidebar (primäre Bereiche), Top-App-Bar (Suche, Status, Quick Actions), Content rechts.
- Mobile: Bottom-Navigation (max. 4–5 Primärbereiche), FAB für „Compose“.
- Command-Palette (Cmd/Ctrl+K) für schnelle Navigation, Aktionen (Publish, DM, Open Profile, Open Thread, Toggle Relays). Umsetzung z. B. mit `cmdk-sv`.
- Tastaturkürzel: `g h` (Home), `g e` (Explore), `g p` (Profile), `c` (Compose), `/` (Suche), `?` (Shortcuts-Overlay).

---

### 5) Read-Only-First & „Just-in-Time“-Signieren (ohne Hard-Guards)
- Initial ist kein Signer aktiv. `NostrService.getInstance()` verbindet read-only; Queries/Subs funktionieren.
- Bei Schreibintention (Compose, React, Label setzen, DM senden):
  1. Inline-Prompt: „Zum Fortfahren bitte Signer wählen“.
  2. Weiterleitung nach `/(onboarding)/signin` mit Rücksprung zur Ursprungshandlung.
  3. Nach erfolgreicher Signer-Wahl wird die Aktion fortgesetzt (Parameter/State wird übergeben).
- Kein serverseitiger Redirect-Guard mehr (`hooks.server.ts` bleibt neutral). Stattdessen: UI-/Action-Gates – bei Schreibintention erscheint der Signer-Prompt; nach Abschluss Rückkehr zur ursprünglichen Aktion.
- Library-seitig bleibt alles kompatibel: Schreibzugriffe rufen `initializeSigning` nur nach expliziter Wahl auf.

---

### 6) UI-Designsystem
- Design Tokens: Farben, Abstände, Radius, Schriften als CSS-Variablen (bereits vorhanden – konsolidieren, dokumentieren).
- Primitives: Dialog, Popover, Command, Dropdown, Tabs (sparsam), Navigation Menu via Melt UI.
- Komponenten: AppBar, Sidebar, EntityCard (Event, Profile), ThreadView, Composer, ListView, RelayHealth.
- States: Loading (Skeletons), Empty, Error – konsistent mit klaren Aktionen.
- A11y: Fokuszustände, Rollen/Labels (WAI-ARIA), Kontraste, Screenreader-Texte.

---

### 7) Feature-Parität (Alt → Neu)
- Terminal/Inspector → `/dev/terminal`, `/dev/encodings` (nur optisch/IA verschoben).
- Messages (DM) → `/(write)/messages` (Read-only: Vorschau/Verlauf nur wenn technisch möglich; Senden nur mit Signer).
- Publish → `/(write)/compose`.
- Profile (eigene & fremde) → `/(public)/profiles/[pubkey]`, eigenes unter `/(write)/profile` (Bearbeitung).
- Feed/Explore → `/(public)/` (Start) und `/(public)/explore`.
- Threads → `/(public)/threads/[id]` (Reply nur mit Signer).
- Relays → `/(write)/relays` (NIP-65 publish), Read-only Relay-Liste/Status unter `/(public)/relays` optional.
- Lists (Bookmarks) → `/(public)/lists` (lesen) und `/(write)/lists` (verwalten).
- Labels → bleibt `/(public)/labels` (lesen); Labeln selbst via „Sign to label“ gated.

---

### 8) Technische Änderungen (High-Level)
1. Routen restrukturieren gemäß IA v2 (Route-Gruppen erstellen, Seiten aus `NostrApp.svelte` herauslösen).
2. `NostrApp.svelte` dekomponieren: Je View eine Page + eigenständige Komponenten. Die alte Segmented-Nav entfällt zugunsten von Sidebar/Topbar.
3. Read-Only-First: `+layout.svelte` lädt nur globale Styles; `+layout.ts` bleibt schlank. Keine Auto-Signer-Init mehr im Root.
4. Onboarding-Flow: `/(onboarding)/signin` mit Extension/Temporary-Auswahl; nach Erfolg: Rückkehr zur ursprünglichen Aktion (Query-Param `rt` und ggf. Aktion-Payload im Storage/State).
5. Guards: Keine Hard-Guards. Serverseitig keine Redirects; optional nur Zustand lesen. Clientseitig ausschließlich UI-/Action-Gates.
6. `NostrService` unverändert nutzbar: Instanz ohne Signer für Read-Only, `setSigningProvider()` bei Opt-in.
7. Performance: Query/Subscription-Scopes enger fassen, List-Virtualization für Feeds/Label-Listen, Skeleton-Loader.
8. A11y & i18n: Semantische Markup-Prüfung, Tastatursteuerung, ARIA-Rollen; Texte zentralisieren.
9. Command-Palette: universelle Navigation/Aktionen, kontextabhängige Befehle.

---

### 9) Migrationsplan (inkrementell, risikominimiert)
Phase 1: Grundlagen
- Route-Gruppen anlegen (`/(public)`, `/(write)`, `/(onboarding)`, `/(dev)`).
- `/(public)/labels` bestehen lassen; Startseite `/(public)/+page.svelte` (explorativ, read-only).
- Command-Palette scaffolden; Top-App-Bar + minimalistische Sidebar.

Phase 2: Entflechtung `NostrApp.svelte`
- `terminal`, `encodings` → `/dev/*` verschieben.
- `feed`, `thread`, `profile` als eigene Pages unter `/(public)`.
- `messages`, `compose`, `lists`, `relays`, `profile` (edit) unter `/(write)`.

Phase 3: Gating & Onboarding
- „Sign to continue“-Prompts einführen (Composer, Reactions, Follow, Label-Setzen, NIP-65 Publish).
- Keine Redirect-Guards verwenden; Rücksprung-Parameter (`rt`) für JIT-Fortsetzung unterstützen.

Phase 4: Designsystem & A11y
- Tokens konsolidieren, Primitives einführen (Melt UI), Fokus-/Hover-States, Shortcuts, Screenreader-Texte.

Phase 5: Performance & Polishing
- Abfragen straffen, Virtualization, Skeletons; Messung (Web Vitals, Interaktionslatenzen). Edge-Cases & Fehlerbilder polieren.

Rollback-Strategie:
- Alte Tab-Navigation bis Abschluss Phase 2 hinter einem Feature-Flag belassen; Umschaltbar per Env/Query.

---

### 10) Risiken & Gegenmaßnahmen
- Fragmentierung durch Routen-Shift → Übergangs-Flags, Redirect-Map, Kommunikation.
- Schreibvorgänge scheitern ohne Signer → JIT-Prompt mit Rücksprung garantiert Fortsetzung.
- A11y/Keyboard Regressions → CI-Checks, manuelle Tastatur-Tests, Storybook/Playwright-Coverage.

---

### 11) Erfolgsmessung (KPIs)
- Time-to-Content (ms) vom App-Start bis erste Inhalte sichtbar (P75/P95).
- Anzahl Schritte bis zum ersten Publish nach Intent (ohne/mit bestehendem Signer).
- Abbruchquote beim Onboarding (JIT-Prompt → Signer-Auswahl abgeschlossen?).
- Navigationsfehler (Zurückspringen, 404, Fehl-Redirects) vor/nach IA-Umstellung.

---

### 12) Notizen zur Library
- Read-Only ist nativ unterstützt (Instanz ohne `signingProvider`).
- Schreiboperationen bleiben ausschließlich nach `initializeSigning()` erlaubt.
- Giftwrap-Inbox universell und automatisch in Betrieb halten, kein manuelles Entpacken durch Nutzer [[Auto-Unwrap Giftwrap ist Zielvorgabe [[memory:5504249]]]].

---

### 13) Quellen & weitere Lektüre
- [Nielsen Norman Group – Progressive Disclosure](https://www.nngroup.com/articles/progressive-disclosure/)
- [SvelteKit – Route Groups](https://kit.svelte.dev/docs/advanced-routing#route-groups)
- [Melt UI – Docs](https://www.melt-ui.com/docs)
- [shadcn-svelte – Komponenten](https://www.shadcn-svelte.com/)
- [cmdk-sv – Command Palette für Svelte](https://github.com/huntabyte/cmdk-sv)
- [WAI-ARIA – W3C](https://www.w3.org/WAI/standards-guidelines/aria/)

---

Anmerkung: Dieses Dokument wurde bewusst außerhalb von IAC abgelegt (`ai_docs/`), da es agent-/app-übergreifende Leitlinien enthält [[Regel für Dokumentplatzierung [[memory:5504250]]].


