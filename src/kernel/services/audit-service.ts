/**
 * Audit Service — AGEMS port, Phase 9.
 * Log + query audit events + access rules per agent.
 */
import type { AuditLogEntry, AuditAction, AuditActorType, AccessRule, AuditFilters } from '../types/audit-types';
import { rootLogger } from './logger-service';

const log = rootLogger.child('AuditService');

let counter = 0;

export class AuditService {
    private db: {
        auditLogs: {
            toArray(): Promise<Record<string, unknown>[]>;
            put(v: Record<string, unknown>): Promise<string>;
        };
        accessRules: {
            toArray(): Promise<Record<string, unknown>[]>;
            get(id: string): Promise<Record<string, unknown> | undefined>;
            put(v: Record<string, unknown>): Promise<string>;
            delete(id: string): Promise<void>;
        };
    };

    constructor(db: {
        auditLogs: {
            toArray(): Promise<Record<string, unknown>[]>;
            put(v: Record<string, unknown>): Promise<string>;
        };
        accessRules: {
            toArray(): Promise<Record<string, unknown>[]>;
            get(id: string): Promise<Record<string, unknown> | undefined>;
            put(v: Record<string, unknown>): Promise<string>;
            delete(id: string): Promise<void>;
        };
    }) {
        this.db = db;
    }

    private genId(prefix: string): string {
        return `${prefix}-${Date.now()}-${++counter}`;
    }

    // ── Audit Log ──

    async log(input: {
        actorType: AuditActorType;
        actorId: string;
        action: AuditAction;
        resourceType: string;
        resourceId: string;
        details?: string;
        ipAddress?: string;
    }): Promise<AuditLogEntry> {
        const entry: AuditLogEntry = {
            id: this.genId('audit'),
            ...input,
            createdAt: Date.now(),
        };
        await this.db.auditLogs.put(entry as unknown as Record<string, unknown>);
        log.info('log', `${input.actorType}:${input.actorId} → ${input.action} ${input.resourceType}:${input.resourceId}`);
        return entry;
    }

    async list(filters?: AuditFilters): Promise<AuditLogEntry[]> {
        let entries = await this.db.auditLogs.toArray() as unknown as AuditLogEntry[];
        if (filters) {
            if (filters.actorType) entries = entries.filter(e => e.actorType === filters.actorType);
            if (filters.actorId) entries = entries.filter(e => e.actorId === filters.actorId);
            if (filters.action) entries = entries.filter(e => e.action === filters.action);
            if (filters.resourceType) entries = entries.filter(e => e.resourceType === filters.resourceType);
            if (filters.resourceId) entries = entries.filter(e => e.resourceId === filters.resourceId);
            if (filters.startDate) entries = entries.filter(e => e.createdAt >= filters.startDate!);
            if (filters.endDate) entries = entries.filter(e => e.createdAt <= filters.endDate!);
        }
        entries.sort((a, b) => b.createdAt - a.createdAt);
        const offset = filters?.offset ?? 0;
        const limit = filters?.limit ?? 100;
        return entries.slice(offset, offset + limit);
    }

    async count(filters?: AuditFilters): Promise<number> {
        const all = await this.list({ ...filters, limit: Infinity });
        return all.length;
    }

    // ── Access Rules ──

    async getRules(agentId: string): Promise<AccessRule[]> {
        const all = await this.db.accessRules.toArray() as unknown as AccessRule[];
        return all.filter(r => r.agentId === agentId);
    }

    async addRule(input: {
        agentId: string;
        resourceType: string;
        resourceId?: string;
        permissions: ('read' | 'write' | 'execute' | 'admin')[];
    }): Promise<AccessRule> {
        const rule: AccessRule = {
            id: this.genId('rule'),
            ...input,
            resourceId: input.resourceId ?? '*',
            createdAt: Date.now(),
            updatedAt: Date.now(),
        };
        await this.db.accessRules.put(rule as unknown as Record<string, unknown>);
        log.info('addRule', `Added rule for ${input.agentId}: ${input.resourceType}:${input.resourceId ?? '*'} → [${input.permissions.join(', ')}]`);
        return rule;
    }

    async updateRule(id: string, updates: Partial<Pick<AccessRule, 'permissions' | 'resourceId'>>): Promise<AccessRule> {
        const record = await this.db.accessRules.get(id);
        if (!record) throw new Error(`Rule not found: ${id}`);
        const rule = { ...record, ...updates, updatedAt: Date.now() } as unknown as AccessRule;
        await this.db.accessRules.put(rule as unknown as Record<string, unknown>);
        return rule;
    }

    async deleteRule(id: string): Promise<void> {
        await this.db.accessRules.delete(id);
    }

    async checkAccess(agentId: string, resourceType: string, resourceId: string, permission: 'read' | 'write' | 'execute' | 'admin'): Promise<boolean> {
        const rules = await this.getRules(agentId);
        // Check for exact resource match first, then wildcard
        const exactMatch = rules.find(r => r.resourceType === resourceType && r.resourceId === resourceId);
        if (exactMatch) return exactMatch.permissions.includes(permission) || exactMatch.permissions.includes('admin');
        const wildcardMatch = rules.find(r => r.resourceType === resourceType && r.resourceId === '*');
        if (wildcardMatch) return wildcardMatch.permissions.includes(permission) || wildcardMatch.permissions.includes('admin');
        // No rule = denied
        return false;
    }
}
