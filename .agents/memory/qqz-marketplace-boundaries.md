---
name: QQZ marketplace boundaries
description: The web marketplace exposes discovery entry points for future listings and bookings without fabricating inventory until shared APIs exist.
---

Future listings, rentals, providers, bookings, messages, saved items, and notifications must connect to the existing QQZ account, trust, payment, and ledger systems; until their APIs exist, the web UI should use explicit collection or workspace states rather than mock records.

**Why:** QQZ is intended to share one core across website, mobile, Facebook, and Zapier. Fake inventory or a second data store would create misleading marketplace state and break account continuity.

**How to apply:** Add schema, API contracts, persistence, and generated hooks first for new transaction domains, then replace the current honest discovery/workspace states with real data and mutations.