# 01_AUDIT_DATA_MODEL.md

## `AuditLogEntry` Schema

The entry must be lightweight to minimize overhead on the EventBus.

```typescript
export interface AuditLogEntry {
  id: string; // ULID for sortability
  correlationId: string;
  timestamp: number;

  // Entity Context
  entityType: 'DEBATE' | 'FORUM' | 'COGNITIVE' | 'INVOCATION' | 'SYSTEM';
  entityId: string;

  // Action Context
  actorId: string; // 'system' or specific agentId/userId
  action: string; // e.g., 'CONVERSATION_TURN_COMPLETE'

  // Payload
  metadata: Record<string, unknown>; // Minimal required fields
  result: 'SUCCESS' | 'FAILURE' | 'PENDING';
}
```

_Note: Metadata should be flattened where possible to avoid deep nesting in Dexie._
