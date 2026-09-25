/**
 * AGEMS Audit types — leaf module with zero runtime imports.
 *
 * Moved out of services/agems-audit-service.ts so that
 * services/dexie-schema.ts can reference the auditLogs table row type
 * without creating a services ↔ services edge (database-service →
 * dexie-schema → agems-audit-service → database-service circular
 * dependency).
 */

export type AuditAction =
    | 'CREATE'
    | 'READ'
    | 'UPDATE'
    | 'DELETE'
    | 'EXECUTE'
    | 'COMMUNICATE'
    | 'LOGIN'
    | 'GRANT_ACCESS'
    | 'REVOKE_ACCESS'
    | 'APPROVE'
    | 'REJECT';

export interface AuditLog {
    id?: number;
    actorType: string;
    actorId: string;
    action: AuditAction;
    resourceType: string;
    resourceId: string;
    details?: Record<string, unknown>;
    ipAddress?: string;
    createdAt: number;
}
