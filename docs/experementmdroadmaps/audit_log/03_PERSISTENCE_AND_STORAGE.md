# 03_PERSISTENCE_AND_STORAGE.md

## Storage Engine: Dexie (IndexedDB)

We will add a new table `auditLogs` to the existing Dexie database (`database-service.ts`).

## Schema Design

- **Table**: `auditLogs`
- **Indices**: `'id, correlationId, entityType, entityId, timestamp'`
- **TTL/Retention**:
  - Limit to 50,000 entries.
  - Implement a `runCleanup()` service on startup that deletes entries older than `7 days`.
- **Compression**: For `metadata` fields, if size > 5KB, apply LZ-string compression before insertion to keep Dexie footprint low.
