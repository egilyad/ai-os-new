# 04_IMPLEMENTATION_ROADMAP.md

## Phase 0: Foundation

- Define `AuditLogEntry` contract (`contracts/audit.ts`).
- Add `auditLogs` table to `schema-types.ts` (Dexie v21).
- Register `AuditLogService` (`services/audit/audit-log-service.ts`).

## Phase 1: Bridge

- Integrate middleware in `event-bus.ts`.
- Implement initial filter for `forum:*` and `debate:*` events.
- Build `AuditLogRepository` in DAL.

## Phase 2: UX & History

- Add `AuditPanel` (`components/AuditPanel/`) in the Knowledge section.
- Implement timeline view with filtering (`entityType`, `dateRange`).
- Implement simple correlation search (by `correlationId`).

## Phase 3: Analytics (Advanced)

- Add export to JSON/CSV.
- Implement automated pruning logic.
- Integrate with `KnowledgeGenerator` for automated pattern detection.
