# ADR-003: Dexie.js (IndexedDB) as Primary Storage

**Status**: Accepted (v1.0)  
**Date**: 2026-06-28  
**Updated**: 2026-07-06 — removed SQLite references (sql.js never used in production)  
**Deciders**: Architecture Team

## Context

The application runs entirely in the browser. Data must survive page reloads without a backend server. IndexedDB is the only viable browser-based persistent storage for structured data at scale.

## Decision

Use Dexie.js as the sole IndexedDB abstraction layer:

1. Primary tables: `apiKeys`, `sessions`, `chatMessages`, `memories`, `keyValue` (generic KV), `roles`, `skills`, `connectors`, `notes`, `cognitiveTraces`, `traces`
2. `DatabaseService` wraps Dexie with typed tables and versioned schemas via `dexie-storage.ts`
3. Versioned migrations (`v5`–`v12`) handle schema evolution
4. `BucketStorageAdapter` (5 buckets) wraps localStorage for UI-persisted data (settings, layout, prompts)
5. `DataAccessLayer` / `StorageAdapter` provide abstracted access — no direct Dexie calls from UI

## Consequences

- Data survives reload, offline-friendly
- Dexie's versioned schema enables safe migrations
- IndexedDB is slower than in-memory — mitigated by in-memory caches (KeyStateStore, MemoryOrchestrator)
- All storage access goes through `DataAccessLayer` / `StorageAdapter` — not direct Dexie calls
- `StorageAdapter` DI allows future swap to different backend

## Related

- `src/kernel/services/database-service.ts` — Dexie wrapper
- `src/kernel/services/storage/` — storage implementations (Dexie via dexie-storage.ts, localStorage via BucketStorageAdapter)
- `src/kernel/dal/` — Data Access Layer (14 repositories)
