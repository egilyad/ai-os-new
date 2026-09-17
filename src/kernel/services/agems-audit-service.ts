import { getDexieDb } from './dexie-schema';

export type AuditAction = 'CREATE' | 'READ' | 'UPDATE' | 'DELETE' | 'EXECUTE' | 'COMMUNICATE' | 'LOGIN' | 'GRANT_ACCESS' | 'REVOKE_ACCESS' | 'APPROVE' | 'REJECT';

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

export class AgemsAuditService {
    async log(entry: Omit<AuditLog, 'id' | 'createdAt'>): Promise<number> {
        const row: AuditLog = { ...entry, createdAt: Date.now() };
        return (await getDexieDb().table('auditLogs').add(row as never)) as unknown as number;
    }

    async list(filters?: { actorId?: string; action?: AuditAction; resourceType?: string }): Promise<AuditLog[]> {
        let arr = (await getDexieDb().table('auditLogs').toArray()) as unknown as AuditLog[];
        if (filters?.actorId) arr = arr.filter((r) => r.actorId === filters.actorId);
        if (filters?.action) arr = arr.filter((r) => r.action === filters.action);
        if (filters?.resourceType) arr = arr.filter((r) => r.resourceType === filters.resourceType);
        return arr.sort((a, b) => b.createdAt - a.createdAt).slice(0, 100);
    }
}

export const agemsAuditService = new AgemsAuditService();
