# Nostr Unchained — Overview

Nostr Unchained is a SOLID, TypeScript‑first client library for building modern Nostr apps with god‑tier DX. It combines a Universal Event Cache, a unified Query/Subscription engine, and focused high‑level modules (DM, Social, Profiles, Signing) to give you instant reads with reactive live updates — without mocks, without hidden state, and fully NIP‑compliant.

Highlights
- Universal Cache Architecture: subscription‑first, O(log n) indexed, reactive stores
- Identical APIs for cache queries and live subscriptions
- Battle‑tested crypto: NIP‑44 v2, NIP‑59 gift wraps (no re‑sign), perfect forward secrecy
- Production‑grade relay features: NIP‑42 AUTH, NIP‑65 relay lists & optional routing
- Social modules with fluent builders: NIP‑51 Lists, NIP‑22 Comments, NIP‑32 Labels, NIP‑28 Channels
- Remote signing: NIP‑46 (Nostr Connect)

When to use
- You want clean layering (no DM code leaking into core), explicit user‑controlled signing, and instant cache reads that stay in sync.
- You prefer real‑relay tests over mocks, predictable performance, and a minimal surface that scales.

Learn next
- Getting Started: ../README.md#-documentation-walkthrough
- Query & Subscriptions: ./query/README.md
- Events & Publishing: ./events/README.md
- Direct Messages: ./dm/README.md
- Social Core: ./social/README.md
- Relay Lists & Routing: ./events/README.md#relay-and-routing
- Signing (NIP‑46): ./signing/README.md
- Architecture: ./architecture/README.md
- NIP Status: ../NIP_STATUS.md


