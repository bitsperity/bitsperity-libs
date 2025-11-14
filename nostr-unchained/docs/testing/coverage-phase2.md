<!-- Phase 2 Coverage Inventory -->
# Phase 2 – Test Coverage & Gap Analysis

## Scope & Methodik
- **Quellen**: `src/**`, bestehende Suites unter `tests-v2/**`, NIP-Matrix (`nostr/nostr_index.md`, `NIP_STATUS.md`).
- **Kriterien**: Für jedes Modul muss mind. ein Test alle Punkte abdecken:
  1. **Happy Path** (produktives Szenario)
  2. **Negativpfad/Validierung** (Fehlermeldung, Exception)
  3. **Performance** (Messung oder Grenzzeit)
  4. **Multi-Relay / Concurrency** (falls relevant)
  5. **Persistence/Cache** (Store-Sync, Giftwrap-Reprocess, Replaceables)
- **Artefakte**: Diese Datei wird pro Phase aktualisiert, neue Tests referenzieren hier ihre Ziele.

## Layer 0/1 – Core, Cache & Relay
| Modul/Dateien | Bestehende Tests | Bewertung | Gaps & geplanter Ausbau |
| --- | --- | --- | --- |
| `src/cache/UniversalEventCache.ts` | `tests-v2/01-core/cache-initialization.test.ts`, `cache-lru-stress.test.ts` | Happy Path + LRU ✅ | Giftwrap-Reprocess-Suite, Memory-Limit-Tests, kombinierte `#tag` + `kinds` für große Datensätze fehlen. |
| `src/query/QueryBuilder.ts`, `src/subscription/*` | `01-core/query-guards`, `query-tags`, `query-search` | Grundlegende Guards ✅ | Keine Tests für kombinierte Filter (kinds+authors+tags), keine Failure/timeout-Szenarien bei Subscriptions. |
| `src/core/NostrUnchained.ts` (publish/publishSigned) | Indirekt über Social/Relay Suites | Teilweise ✅ | Neue Tests, die explizit Fallback-Routing, `autoSelectRelaysForEvent`, Publish-Ergebnis bei Relay-Ausfällen prüfen. |
| `src/relay/RelayManager.ts`, `RelayDiscovery.ts`, `RelayHealthMonitor.ts` | `00-infrastructure/relay-*`, `relay/manual-relay-priority` | Positivpfade ✅ | Fehlende Tests für Backoff, AUTH-Lifecycle, Pending-Publish-Retry nach AUTH, Multi-relay ensureConnected failure. |
| `src/http/Nip96Client.ts`, `Nip98HttpAuth.ts` | `01-core/nip98-http-auth`, `03-social/files-nip94-96`, `02-protocol-compliance/http/nip96-negative` | Basis + Fehlerpfade (nip96.json/Upload) ✅ | Weitere Szenarien: TLS-Fehler, Auth-Header ungültig, Streaming/Timeout. |

## Layer 2 – High-Level DM & Social
| Modul | Aktuelle Suites | Bewertung | Gaps |
| --- | --- | --- | --- |
| `src/dm/**` (UniversalDM, Giftwrap pipeline) | `02-protocol-compliance/nip44-crypto`, `04-protocol-compliance/nip44-encryption`, Debug-Suites, `03-high-level/dm-universal` | Gute Abdeckung Happy Path + Fallback ✅ | Noch offen: Parallelversand / Replay-Angriffe, DM Rooms, Giftwrap-Reprocess-Audit. |
| `src/social/communities/**` | `03-social/communities-*`, `02-protocol-compliance/social/nip72*`, `03-integration/community-relay-resolution` | Sehr gut für Posts/Approvals ✅ | Fehlende Szenarien: Moderator-Wechsel (Kind 34550 Update), Approvals mit verzögerten Relays, Negative Cases (fehlende Tags, invalid marker). |
| `src/social/comments/CommentsModule.ts` | `03-social/comments-nip22` | Grundlegend + Fallback ✅ | Weitere Szenarien: Addressable vs event-root Mischformen, invalid tag combinations, Performance/Limit Checks. |
| `src/social/content/ContentModule.ts` (NIP-23/feeds) | `03-social/longform-nip23`, `feeds`, `feeds-stats` | Baseline ✅ | Keine Replaceable-Kollisionstests (mehrere Autoren), keine Negative Cases (fehlender `d` Tag), keine Performance-Metrik. |
| `src/profile/**`, `src/relay/RelayListModule.ts` | `03-social/profile-update`, `follows`, `02-protocol-compliance/social/nip02` | ok ✅ | Kein Test für `relayList.edit` mit parallelen Publishes, keine Fehlermeldungstests bei invaliden petnames/relays. |
| Reactions/Labels/Reports (`src/social/*`) | Jeweils NIP-focused Suites | Gute Abdeckung ✅ | Performance- und Deletion-Ketten (Kind5) teils ungetestet; Reaction-Dedupe, Label Uniqueness, Report dedupe fehlen. |

## Validierung & Error Paths
| Thema | Status | Gaps |
| --- | --- | --- |
| Event Validation (`EventBuilder.validateEvent`) | `01-core/event-validation` | Basisfälle ✅ | Noch offen: content size limits, invalid signatures, builder error handling bei zu vielen Tags. |
| Signing Provider (`src/crypto/SigningProvider.ts`) | `signer-conformance`, `nip46-*` | Kein Test für temporäre Key Rotation, nip44 capabilities missing. |
| HTTP & File Storage | nur Erfolgsszenarien | Negative TLS/Status-Codes, Timeout/Einschläge. |
| Input Sanitization (hashtags, tags) | manuell | Fehlende Tests für XSS/invalid unicode (z. B. `content.hashtag` in ContentModule). |

## Performance Assertions
- Bestehende Messpunkte (`TestEnvironment.assertPerformance`) nur in Communities/Relay-Suites.
- Ausbauziel:
  - DM Send & decrypt < 3s (parallel).
  - Relay Discovery < 3s (bereits vorhanden).
  - Cache Query < 10ms (neue Benchmarks).
  - HTTP Upload < definierter Timeout.

## Failure Injection & Infrastruktur
- **Bedarf**: Hooks in `TestEnvironment` für
  - Temporäres Stoppen einzelner Relays (`docker compose stop nostr-relay` per Script).
  - Simulierte AUTH-Failure (`relay-opts` env).
  - Custom latency/timeout (per env var oder Proxy).
- **Framework**: `shared/BugAnalysisFramework.ts` → Assertion Helpers für „expect success with debug logs“, Snapshot optional.

## Nächste Schritte
1. **Core/Relay Suites**:
   - ✅ `tests-v2/01-core/cache-lru-stress.test.ts`
   - 🟡 `tests-v2/02-protocol-compliance/relay/resilience.test.ts`
   - ✅ `tests-v2/02-protocol-compliance/http/nip96-negative.test.ts`
2. **DM & Social**:
   - `tests-v2/03-high-level/dm-universal.test.ts`
   - Communities Moderator/Failure tests.
3. **Validation Suites**:
   - `tests-v2/01-core/event-validation.test.ts`
   - Input sanitation tests for builders.
4. **Infrastructure Enhancements**:
   - Fault-injection helpers im TestEnvironment.
   - README Update + `npm run test:focus`.

> Dieser Plan wird nach jedem Suite-PR aktualisiert (Status/TODO abgleichen). Bitte jede neue Suite hier referenzieren, inkl. abgedeckter Kriterien (Happy/Negative/Perf/MultiRelay/Cache).

