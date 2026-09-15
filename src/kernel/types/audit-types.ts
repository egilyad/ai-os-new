/**
 * Audit types — AGEMS port, Phase 9.
 */

export type AuditAction =
    | 'create'
    | 'read'
    | 'update'
    | 'delete'
    | 'execute'
    | 'communicate'
    | 'login'
    | 'grant_access'
    | 'revoke_access'
    | 'approve'
    | 'reject';

export type AuditActorType = 'agent' | 'human' | 'system';

export interface AuditLogEntry {
    id: string;
    actorType: AuditActorType;
    actorId: string;
    action: AuditAction;
    resourceType: string;
    resourceId: string;
    details?: string;
    ipAddress?: string;
    createdAt: number;
}

export interface AccessRule {
    id: string;
    agentId: string;
    resourceType: string;
    resourceId?: string; // optional: specific resource, or '*' for all
    permissions: ('read' | 'write' | 'execute' | 'admin')[];
    createdAt: number;
    updatedAt: number;
}

export interface AuditFilters {
    actorType?: AuditActorType;
    actorId?: string;
    action?: AuditAction;
    resourceType?: string;
    resourceId?: string;
    startDate?: number;
    endDate?: number;
    limit?: number;
    offset?: number;
}
