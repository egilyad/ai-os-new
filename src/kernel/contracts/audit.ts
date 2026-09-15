/**
 * Audit service contract — AGEMS port, Phase 9.
 */
import type { AuditLogEntry, AuditAction, AuditActorType, AccessRule, AuditFilters } from '../types/audit-types';

export interface IAuditService {
    log(input: {
        actorType: AuditActorType;
        actorId: string;
        action: AuditAction;
        resourceType: string;
        resourceId: string;
        details?: string;
        ipAddress?: string;
    }): Promise<AuditLogEntry>;

    list(filters?: AuditFilters): Promise<AuditLogEntry[]>;
    count(filters?: AuditFilters): Promise<number>;

    getRules(agentId: string): Promise<AccessRule[]>;
    addRule(input: {
        agentId: string;
        resourceType: string;
        resourceId?: string;
        permissions: ('read' | 'write' | 'execute' | 'admin')[];
    }): Promise<AccessRule>;
    updateRule(id: string, updates: Partial<Pick<AccessRule, 'permissions' | 'resourceId'>>): Promise<AccessRule>;
    deleteRule(id: string): Promise<void>;
    checkAccess(agentId: string, resourceType: string, resourceId: string, permission: 'read' | 'write' | 'execute' | 'admin'): Promise<boolean>;
}
