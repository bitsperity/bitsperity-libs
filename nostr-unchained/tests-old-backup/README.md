# Old Test Suite - Archived

Diese Tests wurden am 2025-08-07 archiviert und durch die neue `tests-v2/` Suite ersetzt.

## Warum archiviert?

Die alte Test-Suite hatte fundamentale Probleme:
- Hardcoded externe Relay-Dependencies (umbrel.local:4848)
- Missverständnis der Universal Cache Architecture
- Mock-basierte Ansätze statt protocol-basierter Tests
- Inkonsistente Test-Patterns
- 52 von 356 Tests failed (85.4% pass rate)

## Neue Test-Suite

Die neue `tests-v2/` Suite bietet:
- ✅ Ephemeral Container-Relay (keine externen Dependencies)
- ✅ Subscription-first Architecture Understanding
- ✅ Protocol-basierte Tests (NIP-compliant)
- ✅ 100% Clean Code ohne Mocks
- ✅ 7/7 Infrastructure Tests bestehen

## Wiederherstellung

Falls einzelne Tests aus dieser Suite gebraucht werden:

```bash
# Einzelne Testdatei wiederherstellen
cp tests-old-backup/unit/some-test.test.ts tests-v2/01-core/

# Gesamte Suite wiederherstellen (NICHT empfohlen)
mv tests-old-backup tests
```

Die neue Suite in `tests-v2/` sollte jedoch bevorzugt werden.