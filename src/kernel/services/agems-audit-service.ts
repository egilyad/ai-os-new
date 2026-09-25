import { getDexieDb } from './database-service';
import type { AuditAction, AuditLog } from '../types/agems-audit';

export type { AuditAction, AuditLog } from '../types/agems-audit';

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
